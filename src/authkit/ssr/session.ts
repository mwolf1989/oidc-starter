import { redirect } from '@tanstack/react-router';
import { getCookie, setCookie } from '@tanstack/react-start/server';
import { sealData, unsealData } from 'iron-session';
import { getConfig } from './config';


import type {
  AuthkitOptions,
  AuthkitResponse,
  CookieOptions,
  GetAuthURLOptions,
  Session,
} from './interfaces';


const sessionHeaderName = 'x-oidc-session';
const middlewareHeaderName = 'x-oidc-middleware';

export async function decryptSession(encryptedSession: string): Promise<Session> {
  const cookiePassword = getConfig('cookiePassword');
  return unsealData<Session>(encryptedSession, {
    password: cookiePassword,
  });
}

export async function encryptSession(session: Session) {
  return sealData(session, {
    password: getConfig('cookiePassword'),
    ttl: 0,
  });
}

export async function getAuthorizationUrl(_options: GetAuthURLOptions = {}): Promise<string> {
  // This is now handled by the login route directly
  return '/api/auth/login';
}

export function serializeCookie(name: string, value: string, options: Partial<CookieOptions> = {}): string {
  const {
    path = '/',
    maxAge = getConfig('cookieMaxAge'),
    secure = options.sameSite === 'none' ? true : getConfig('redirectUri').startsWith('https:'),
    sameSite = 'lax',
    domain = getConfig('cookieDomain'),
  } = options;

  let cookie = `${name}=${encodeURIComponent(value)}; Path=${path}; sameSite=${sameSite}; HttpOnly`;
  cookie += `; Max-Age=${maxAge}`;
  if (!maxAge) cookie += `; Expires=${new Date(0).toUTCString()}`;
  if (secure) cookie += '; Secure';
  if (domain) cookie += `; Domain=${domain}`;

  return cookie;
}


export async function withAuth() {
  const session = await getSessionFromCookie();
  console.log('withAuth: session from cookie:', session ? 'found' : 'not found');

  if (!session?.user) {
    console.log('withAuth: no user in session');
    return { user: null };
  }

  console.log('withAuth: user found:', session.user.email);

  // Generate session ID from user ID
  const sessionId = session.user.id || '';

  return {
    sessionId,
    user: session.user,
    accessToken: session.accessToken,
  };
}

export async function getSessionFromCookie() {
  const cookieName = getConfig('cookieName') || 'oidc-session';
  const accessTokenCookieName = 'oidc-access-token';
  const cookie = getCookie(cookieName);
  const accessTokenCookie = getCookie(accessTokenCookieName);

  console.log('[SESSION-DEBUG] getSessionFromCookie', {
    cookieName,
    hasCookie: !!cookie,
    cookieLength: cookie?.length,
    hasAccessTokenCookie: !!accessTokenCookie,
    accessTokenLength: accessTokenCookie?.length
  });

  if (cookie && accessTokenCookie) {
    try {
      const sessionWithoutToken = await decryptSession(cookie);
      const session: Session = {
        ...sessionWithoutToken,
        accessToken: accessTokenCookie,
      };
      console.log('[SESSION-DEBUG] Session decrypted successfully', {
        hasUser: !!session.user,
        userId: session.user?.id,
        email: session.user?.email
      });
      return session;
    } catch (error) {
      console.error('[SESSION-DEBUG] Failed to decrypt session:', error);
      return null;
    }
  }

  return null;
}

export async function saveSession(session: Session): Promise<{ mainCookie: string; accessTokenCookie: string }> {
  const cookieName = getConfig('cookieName') || 'oidc-session';
  const accessTokenCookieName = 'oidc-access-token';

  // Create session without accessToken for main cookie
  const sessionWithoutToken = {
    user: session.user,
    expiresAt: session.expiresAt,
  };
  const encryptedSession = await encryptSession(sessionWithoutToken as any);

  console.log('[SESSION-DEBUG] saveSession', {
    cookieName,
    encryptedSessionLength: encryptedSession.length,
    sessionData: {
      hasUser: !!session.user,
      userId: session.user?.id,
      email: session.user?.email
    }
  });

  // Create cookie with proper options for TanStack Start
  const cookieOptions: Partial<CookieOptions> = {
    secure: getConfig('redirectUri').startsWith('https:'),
    sameSite: 'lax' as const,
    maxAge: getConfig('cookieMaxAge') || 60 * 60 * 24 * 400, // 400 days default
  };

  console.log('[SESSION-DEBUG] Creating cookie with options', {
    cookieOptions,
    domain: getConfig('cookieDomain')
  });

  // Add domain if configured
  const domain = getConfig('cookieDomain');
  if (domain) {
    cookieOptions.domain = domain;
  }

  const mainCookie = serializeCookie(cookieName, encryptedSession, cookieOptions);
  const accessTokenCookie = serializeCookie(accessTokenCookieName, session.accessToken, cookieOptions);

  console.log('[SESSION-DEBUG] Cookie strings created');

  return { mainCookie, accessTokenCookie };
}

// For now, we'll skip token verification since we don't store tokens
async function verifyAccessToken(): Promise<boolean> {
  // Since we don't store tokens, assume session is valid if it exists
  return true;
}

function getReturnPathname(url: string): string {
  const newUrl = new URL(url);

  return `${newUrl.pathname}${newUrl.searchParams.size > 0 ? '?' + newUrl.searchParams.toString() : ''}`;
}

export async function updateSession(
  request: Request,
  options: AuthkitOptions = { debug: false },
): Promise<AuthkitResponse> {
  const session = await getSessionFromCookie();

  const newRequestHeaders = new Headers();

  // Record that the request was routed through the middleware so we can check later for DX purposes
  newRequestHeaders.set(middlewareHeaderName, 'true');

  // We store the current request url in a custom header, so we can always have access to it
  // This is because on hard navigations we don't have access to `next-url` but need to get the current
  // `pathname` to be able to return the users where they came from before sign-in
  newRequestHeaders.set('x-url', request.url);

  if (options.redirectUri) {
    // Store the redirect URI in a custom header, so we always have access to it and so that subsequent
    // calls to `getAuthorizationUrl` will use the same redirect URI
    newRequestHeaders.set('x-redirect-uri', options.redirectUri);
  }

  newRequestHeaders.delete(sessionHeaderName);

  if (!session) {
    if (options.debug) {
      console.log('No session found from cookie');
    }

    const authUrl = await getAuthorizationUrl({
      returnPathname: getReturnPathname(request.url),
      redirectUri: options.redirectUri || getConfig('redirectUri'),
      screenHint: options.screenHint,
    });

    return {
      session: { user: null },
      headers: newRequestHeaders,
      authorizationUrl: authUrl,
    };
  }

  const hasValidSession = await verifyAccessToken();

  const cookieName = getConfig('cookieName') || 'oidc-session';

  if (hasValidSession) {
    newRequestHeaders.set(sessionHeaderName, getCookie(cookieName)!);

    // Generate session ID from user ID
    const sessionId = session.user.id || '';

    return {
      session: {
        sessionId,
        user: session.user,
        accessToken: session.accessToken,
      },
      headers: newRequestHeaders,
    };
  }

  try {
    if (options.debug) {
      console.log('Session invalid. Redirecting to login.');
    }

    // Since we don't store tokens, just redirect to login
    const authUrl = await getAuthorizationUrl();
    return {
      session: { user: null },
      headers: newRequestHeaders,
      authorizationUrl: authUrl,
    };
  } catch (e) {
    if (options.debug) {
      console.log('Failed to refresh. Deleting cookie.', e);
    }

    // When we need to delete a cookie, return it as a header as you can't delete cookies from edge middleware
    const deleteCookie = serializeCookie(cookieName, '', { maxAge: 0 });
    newRequestHeaders.append('Set-Cookie', deleteCookie);

    const authUrl = await getAuthorizationUrl({
      returnPathname: getReturnPathname(request.url),
    });

    return {
      session: { user: null },
      headers: newRequestHeaders,
      authorizationUrl: authUrl,
    };
  }
}

export async function terminateSession({ returnTo }: { returnTo?: string } = {}) {
  // Clear the session cookies
  const cookieName = getConfig('cookieName') || 'oidc-session';
  const accessTokenCookieName = 'oidc-access-token';

  const cookieOptions = {
    httpOnly: true,
    secure: getConfig('redirectUri').startsWith('https:'),
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 0, // Delete the cookie
  };

  // Add domain if configured
  const domain = getConfig('cookieDomain');
  if (domain) {
    (cookieOptions as any).domain = domain;
  }

  setCookie(cookieName, '', cookieOptions);
  setCookie(accessTokenCookieName, '', cookieOptions);

  return redirect({ to: returnTo ?? '/', throw: true, reloadDocument: true });
}