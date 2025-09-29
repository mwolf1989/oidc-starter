/**
 * Generic OIDC User interface
 */
export interface OIDCUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  preferredUsername?: string;
  profilePictureUrl?: string;
  emailVerified?: boolean;
  [key: string]: any; // Allow additional claims from OIDC provider
}

/**
 * OIDC Token Claims interface
 */
export interface OIDCTokenClaims {
  sub: string;
  iss: string;
  aud: string | string[];
  exp: number;
  iat: number;
  auth_time?: number;
  nonce?: string;
  acr?: string;
  amr?: string[];
  azp?: string;
  [key: string]: any; // Allow additional claims
}

export interface GetAuthURLOptions {
  redirectUri?: string;
  screenHint?: 'sign-up' | 'sign-in';
  returnPathname?: string;
  scope?: string;
  prompt?: string;
}

export interface CookieOptions {
  path: '/';
  httpOnly: true;
  secure: boolean;
  sameSite: 'lax' | 'strict' | 'none';
  maxAge: number;
  domain: string | undefined;
}

export interface UserInfo {
  user: OIDCUser;
  sessionId: string;
  accessToken: string;
  idToken?: string;
  [key: string]: any; // Allow additional user info from OIDC provider
}

export interface NoUserInfo {
  user: null;
  sessionId?: undefined;
  accessToken?: undefined;
  idToken?: undefined;
}

export interface AuthkitOptions {
  debug?: boolean;
  redirectUri?: string;
  screenHint?: 'sign-up' | 'sign-in';
  scope?: string;
  prompt?: string;
}

export interface AuthkitResponse {
  session: UserInfo | NoUserInfo;
  headers: Headers;
  authorizationUrl?: string;
}

/**
 * OIDC Session
 */
export interface Session {
  /**
   * The session access token
   */
  accessToken: string;
  /**
   * The session refresh token - used to refresh the access token
   */
  refreshToken?: string;
  /**
   * The OIDC ID token
   */
  idToken?: string;
  /**
   * The logged-in user
   */
  user: OIDCUser;
  /**
   * Token expiration timestamp
   */
  expiresAt?: number;
}

/**
 * OIDC Configuration Options
 */
export interface OIDCConfig {
  /**
   * The OIDC Client ID
   * Equivalent to the OIDC_CLIENT_ID environment variable
   */
  clientId: string;

  /**
   * The OIDC Client Secret
   * Equivalent to the OIDC_CLIENT_SECRET environment variable
   */
  clientSecret: string;

  /**
   * The OIDC Issuer URL (e.g., https://your-keycloak.com/realms/your-realm)
   * Equivalent to the OIDC_ISSUER environment variable
   */
  issuer: string;

  /**
   * The redirect URI for the authentication callback
   * Equivalent to the OIDC_REDIRECT_URI environment variable
   */
  redirectUri: string;

  /**
   * The password used to encrypt the session cookie
   * Equivalent to the OIDC_COOKIE_PASSWORD environment variable
   * Must be at least 32 characters long
   */
  cookiePassword: string;

  /**
   * The maximum age of the session cookie in seconds
   * Equivalent to the OIDC_COOKIE_MAX_AGE environment variable
   */
  cookieMaxAge: number;

  /**
   * The name of the session cookie
   * Equivalent to the OIDC_COOKIE_NAME environment variable
   * Defaults to "oidc-session"
   */
  cookieName: string;

  /**
   * The domain for the session cookie
   */
  cookieDomain?: string;

  /**
   * The OIDC scopes to request
   * Defaults to "openid profile email"
   */
  scope?: string;

  /**
   * Additional OIDC parameters
   */
  additionalParams?: Record<string, string>;
}

/**
 * PKCE (Proof Key for Code Exchange) data
 */
export interface PKCEData {
  codeVerifier: string;
  codeChallenge: string;
  codeChallengeMethod: 'S256';
}

/**
 * OIDC Token Response
 */
export interface OIDCTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
  id_token?: string;
  scope?: string;
}

/**
 * OIDC Discovery Document
 */
export interface OIDCDiscoveryDocument {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint?: string;
  jwks_uri: string;
  end_session_endpoint?: string;
  scopes_supported?: string[];
  response_types_supported: string[];
  grant_types_supported?: string[];
  code_challenge_methods_supported?: string[];
}

// Legacy alias for backward compatibility
export interface AuthKitConfig extends OIDCConfig {}