import { createFileRoute } from '@tanstack/react-router';
import { getCookie, setCookie } from '@tanstack/react-start/server';
import { sealData, unsealData } from 'iron-session';
import { handleCallback } from '../authkit/ssr/oidc-client';
import { getConfig } from '../authkit/ssr/config';
import { saveSession } from '../authkit/ssr/session';
import type { Session } from '../authkit/ssr/interfaces';

export const Route = createFileRoute('/api/auth/callback')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const clearStateCookie = () => applyStateCookie('', 0);

        try {
          const currentUrl = new URL(request.url);
          
          console.log('[CALLBACK-DEBUG] Callback request received', {
            url: currentUrl.toString(),
            searchParams: Object.fromEntries(currentUrl.searchParams.entries()),
            userAgent: request.headers.get('user-agent')
          });

          // Get state data from cookie
          const stateCookie = getCookie('oidc-state');
          console.log('[CALLBACK-DEBUG] State cookie', {
            present: !!stateCookie,
            length: stateCookie?.length
          });
          
          if (!stateCookie) {
            console.error('No state cookie found');
            return new Response(null, {
              status: 302,
              headers: {
                'Location': '/?error=missing_state',
              },
            });
          }

          // Decrypt state data
          const cookiePassword = getConfig('cookiePassword');
          console.log('[CALLBACK-DEBUG] Cookie password', {
            present: !!cookiePassword,
            length: cookiePassword?.length
          });
          
          const stateData = await unsealData<{
            codeVerifier: string;
            state: string;
            returnTo: string;
          }>(stateCookie, { password: cookiePassword });
          
          console.log('[CALLBACK-DEBUG] State data decrypted', {
            hasCodeVerifier: !!stateData.codeVerifier,
            codeVerifierLength: stateData.codeVerifier?.length,
            state: stateData.state,
            returnTo: stateData.returnTo
          });

          // Handle OAuth errors
          const error = currentUrl.searchParams.get('error');
          const errorDescription = currentUrl.searchParams.get('error_description');
          if (error) {
            console.error('OAuth error:', error, errorDescription);
            clearStateCookie();
            return new Response(null, {
              status: 302,
              headers: {
                'Location': `/?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(errorDescription || '')}`,
              },
            });
          }

          console.log('[CALLBACK-DEBUG] About to call handleCallback');
          // Handle callback and get tokens + user
          const result = await handleCallback(currentUrl, stateData.codeVerifier, stateData.state);
          console.log('[CALLBACK-DEBUG] handleCallback completed successfully');

          // Create session
          const session: Session = {
            accessToken: result.tokens.access_token,
            refreshToken: result.tokens.refresh_token,
            idToken: result.tokens.id_token,
            user: result.user,
            expiresAt: result.tokens.expires_in ? Date.now() + (result.tokens.expires_in * 1000) : undefined,
          };

          console.log('[COOKIE-DEBUG] About to save session (WorkOS style)', {
            sessionData: {
              hasUser: !!session.user,
              userId: session.user?.id,
              email: session.user?.email,
              hasAccessToken: !!session.accessToken,
              hasRefreshToken: !!session.refreshToken
            }
          });

          // Use saveSession like in WorkOS example
          await saveSession(session);

          console.log('[COOKIE-DEBUG] Session saved successfully (WorkOS style)');

          // Log successful login
          console.log('[AUTH] LOGIN_SUCCESS', {
            timestamp: new Date().toISOString(),
            userId: result.user.id,
            email: result.user.email,
            name: result.user.name,
            sessionId: result.user.id,
            userAgent: request.headers.get('user-agent') || undefined,
          });

          // Redirect to return URL - simple redirect like WorkOS
          const redirectTo = stateData.returnTo || '/';

          const response = new Response(null, {
            status: 302,
            headers: {
              'Location': redirectTo,
            },
          });

          clearStateCookie();

          return response;

        } catch (error) {
          console.error('Callback processing error:', error);

          // Log failed login attempt
          console.log('[AUTH] LOGIN_FAILURE', {
            timestamp: new Date().toISOString(),
            userId: undefined,
            email: undefined,
            sessionId: undefined,
            userAgent: request.headers.get('user-agent') || undefined,
            error: error instanceof Error ? error.message : String(error),
          });

          clearStateCookie();

          return new Response(null, {
            status: 302,
            headers: {
              'Location': `/?error=callback_error&error_description=${encodeURIComponent(error instanceof Error ? error.message : String(error))}`,
            },
          });
        }
      },
    },
  },
});

function applyStateCookie(value: string, maxAge: number) {
  const secure = getConfig('redirectUri').startsWith('https:');
  const cookieOptions: Parameters<typeof setCookie>[2] = {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge,
    secure,
  };

  const domain = getConfig('cookieDomain');
  if (domain) {
    cookieOptions.domain = domain;
  }

  setCookie('oidc-state', value, cookieOptions);
}
