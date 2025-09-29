import * as client from 'openid-client';
import { getConfig } from './config';
import type { OIDCUser, GetAuthURLOptions } from './interfaces';

// Cache for configuration
let configCache: client.Configuration | null = null;

/**
 * Get OIDC configuration
 */
async function getConfiguration(): Promise<client.Configuration> {
  if (configCache) {
    return configCache;
  }

  const issuer = getConfig('issuer');
  const clientId = getConfig('clientId');
  const clientSecret = getConfig('clientSecret');
  
  console.log('[OIDC-DEBUG] Loading configuration', {
    issuer: issuer,
    clientId: clientId,
    hasClientSecret: !!clientSecret,
    clientSecretLength: clientSecret?.length
  });

  const server = new URL(issuer);

  try {
    console.log('[OIDC-DEBUG] Attempting OIDC discovery at:', server.toString());
    configCache = await client.discovery(server, clientId, clientSecret);
    console.log('[OIDC-DEBUG] OIDC discovery successful');
    return configCache;
  } catch (error) {
    console.error('[OIDC-DEBUG] OIDC discovery failed:', error);
    throw new Error(`Failed to discover OIDC issuer at ${server}: ${error}`);
  }
}

/**
 * Begin OIDC authentication flow
 */
export async function beginAuth(options: GetAuthURLOptions = {}): Promise<{ url: string; codeVerifier: string; state: string }> {
  const scope = options.scope || getConfig('scope') || 'openid profile email';
  const codeVerifier = client.randomPKCECodeVerifier();
  const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier);
  const state = client.randomState();

  const config = await getConfiguration();
  const redirectUri = getConfig('redirectUri');

  const authParams: Record<string, string> = {
    redirect_uri: redirectUri,
    response_type: 'code',
    scope,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state,
  };

  if (options.screenHint) {
    authParams.kc_action = options.screenHint; // Keycloak-specific parameter
  }

  const url = client.buildAuthorizationUrl(config, authParams);

  return {
    url: url.toString(),
    codeVerifier,
    state: options.returnPathname || state,
  };
}

/**
 * Handle OIDC callback and exchange code for tokens
 */
export async function handleCallback(currentUrl: URL, codeVerifier: string, _state: string) {
  console.log('[OIDC-DEBUG] handleCallback started', {
    currentUrl: currentUrl.toString(),
    codeVerifier: codeVerifier ? 'present' : 'missing',
    state: _state,
    searchParams: Object.fromEntries(currentUrl.searchParams.entries())
  });

  const config = await getConfiguration();
  console.log('[OIDC-DEBUG] Configuration loaded', {
    configType: typeof config,
    configKeys: Object.keys(config)
  });

  try {
    // Create a clean URL without the state parameter for token exchange
    // The openid-client library doesn't expect the state parameter in the callback URL
    // but it does need the iss (issuer) parameter for validation
    const cleanUrl = new URL(currentUrl.toString());
    cleanUrl.searchParams.delete('state');
    cleanUrl.searchParams.delete('session_state'); // Also remove Keycloak-specific session_state
    // Keep the 'iss' parameter - it's needed for issuer validation
    
    console.log('[OIDC-DEBUG] Attempting authorizationCodeGrant with params:', {
      originalUrl: currentUrl.toString(),
      cleanUrl: cleanUrl.toString(),
      codeVerifier: codeVerifier ? 'present' : 'missing',
      code: currentUrl.searchParams.get('code'),
      state: currentUrl.searchParams.get('state')
    });

    // Exchange code for tokens using openid-client
    let tokenResponse;
    try {
      tokenResponse = await client.authorizationCodeGrant(config, cleanUrl, {
        pkceCodeVerifier: codeVerifier,
      });

      console.log('[OIDC-DEBUG] Token response received', {
        hasAccessToken: !!tokenResponse.access_token,
        hasRefreshToken: !!tokenResponse.refresh_token,
        hasIdToken: !!tokenResponse.id_token,
        tokenType: tokenResponse.token_type,
        expiresIn: tokenResponse.expires_in
      });
    } catch (tokenError) {
      console.error('[OIDC-DEBUG] Token exchange failed:', {
        error: tokenError,
        errorMessage: tokenError instanceof Error ? tokenError.message : String(tokenError),
        errorName: tokenError instanceof Error ? tokenError.name : 'Unknown',
        errorStack: tokenError instanceof Error ? tokenError.stack : undefined
      });
      throw tokenError;
    }

    // Get user info from ID token claims (simpler approach)
    const userInfo = tokenResponse.claims() || {} as any;

    const user: OIDCUser = {
      id: userInfo.sub || '',
      email: userInfo.email || '',
      firstName: userInfo.given_name,
      lastName: userInfo.family_name,
      name: userInfo.name,
      preferredUsername: userInfo.preferred_username,
      profilePictureUrl: userInfo.picture,
      emailVerified: userInfo.email_verified,
      ...userInfo, // Include all other claims
    };

    return {
      user,
      tokens: {
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token,
        id_token: tokenResponse.id_token,
        expires_in: tokenResponse.expires_in,
        token_type: tokenResponse.token_type || 'Bearer',
      }
    };
  } catch (error) {
    throw new Error(`Failed to handle callback: ${error}`);
  }
}

/**
 * Get user info from the OIDC provider using access token
 */
export async function getUserInfo(accessToken: string): Promise<OIDCUser> {
  const config = await getConfiguration();

  try {
    // For now, we'll use a simple fetch to the userinfo endpoint
    // TODO: Use client.fetchUserInfo when we figure out the correct API
    const userinfo = await client.fetchUserInfo(config, accessToken, 'sub');

    // Map OIDC standard claims to our user interface
    return {
      id: (userinfo as any).sub || '',
      email: (userinfo as any).email || '',
      firstName: (userinfo as any).given_name,
      lastName: (userinfo as any).family_name,
      name: (userinfo as any).name,
      preferredUsername: (userinfo as any).preferred_username,
      profilePictureUrl: (userinfo as any).picture,
      emailVerified: (userinfo as any).email_verified,
      ...userinfo, // Include all other claims
    };
  } catch (error) {
    throw new Error(`Failed to get user info: ${error}`);
  }
}

/**
 * Refresh access token using refresh token
 */
export async function refreshToken(refreshToken: string) {
  const config = await getConfiguration();

  try {
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);

    return {
      access_token: tokenResponse.access_token,
      refresh_token: tokenResponse.refresh_token || refreshToken,
      id_token: tokenResponse.id_token,
      expires_in: tokenResponse.expires_in,
      token_type: tokenResponse.token_type || 'Bearer',
    };
  } catch (error) {
    throw new Error(`Failed to refresh token: ${error}`);
  }
}
