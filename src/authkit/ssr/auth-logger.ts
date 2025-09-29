/**
 * Authentication event logging utilities
 */

export interface AuthEvent {
  type: 'login_attempt' | 'login_success' | 'login_failure' | 'logout' | 'token_refresh' | 'session_expired';
  userId?: string;
  email?: string;
  sessionId?: string;
  timestamp: string;
  userAgent?: string;
  ip?: string;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * Log authentication events to console and potentially external services
 */
export function logAuthEvent(event: Omit<AuthEvent, 'timestamp'>, request?: Request): void {
  const authEvent: AuthEvent = {
    ...event,
    timestamp: new Date().toISOString(),
  };

  // Add request metadata if available
  if (request) {
    authEvent.userAgent = request.headers.get('user-agent') || undefined;
    authEvent.ip = getClientIP(request);
  }

  // Log to console with structured format
  console.log(`[AUTH] ${authEvent.type.toUpperCase()}`, {
    timestamp: authEvent.timestamp,
    userId: authEvent.userId,
    email: authEvent.email,
    sessionId: authEvent.sessionId,
    ip: authEvent.ip,
    userAgent: authEvent.userAgent,
    error: authEvent.error,
    metadata: authEvent.metadata,
  });

  // Here you could add additional logging destinations:
  // - Send to external logging service (e.g., DataDog, LogRocket, etc.)
  // - Store in database
  // - Send to analytics platform
  // Example:
  // await sendToExternalLogger(authEvent);
}

/**
 * Extract client IP from request headers
 */
function getClientIP(request: Request): string | undefined {
  // Check common headers for client IP
  const headers = [
    'x-forwarded-for',
    'x-real-ip',
    'x-client-ip',
    'cf-connecting-ip', // Cloudflare
    'x-forwarded',
    'forwarded-for',
    'forwarded',
  ];

  for (const header of headers) {
    const value = request.headers.get(header);
    if (value) {
      // x-forwarded-for can contain multiple IPs, take the first one
      return value.split(',')[0].trim();
    }
  }

  return undefined;
}

/**
 * Log successful login
 */
export function logLoginSuccess(userId: string, email: string, sessionId: string, request?: Request): void {
  logAuthEvent({
    type: 'login_success',
    userId,
    email,
    sessionId,
  }, request);
}

/**
 * Log failed login attempt
 */
export function logLoginFailure(email: string | undefined, error: string, request?: Request): void {
  logAuthEvent({
    type: 'login_failure',
    email,
    error,
  }, request);
}

/**
 * Log logout event
 */
export function logLogout(userId: string, sessionId: string, request?: Request): void {
  logAuthEvent({
    type: 'logout',
    userId,
    sessionId,
  }, request);
}

/**
 * Log token refresh
 */
export function logTokenRefresh(userId: string, sessionId: string, request?: Request): void {
  logAuthEvent({
    type: 'token_refresh',
    userId,
    sessionId,
  }, request);
}

/**
 * Log session expiration
 */
export function logSessionExpired(userId: string, sessionId: string, request?: Request): void {
  logAuthEvent({
    type: 'session_expired',
    userId,
    sessionId,
  }, request);
}
