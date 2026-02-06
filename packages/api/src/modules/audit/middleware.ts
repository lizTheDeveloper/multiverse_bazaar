/**
 * Audit middleware for Hono routes.
 * Captures request context (IP address, user agent) and optionally logs requests.
 */

import { Context, Next } from 'hono';
import { AuditContext } from './types.js';

/**
 * Extended context variables for audit tracking
 */
export interface AuditVariables {
  auditContext: AuditContext;
}

/**
 * Extract IP address from request
 * Handles various proxy headers and fallback to socket address
 * @param c - Hono context
 * @returns IP address or null
 */
function getIpAddress(c: Context): string | null {
  // Check X-Forwarded-For header (most common proxy header)
  const forwardedFor = c.req.header('x-forwarded-for');
  if (forwardedFor) {
    // X-Forwarded-For can contain multiple IPs, take the first one (client IP)
    const ips = forwardedFor.split(',').map((ip) => ip.trim());
    if (ips.length > 0 && ips[0]) {
      return ips[0];
    }
  }

  // Check X-Real-IP header (nginx)
  const realIp = c.req.header('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Check CF-Connecting-IP header (Cloudflare)
  const cfIp = c.req.header('cf-connecting-ip');
  if (cfIp) {
    return cfIp;
  }

  // Fallback to connection remote address if available
  // Note: Hono doesn't expose socket directly, so this may not be available
  return null;
}

/**
 * Extract user agent from request
 * @param c - Hono context
 * @returns User agent string or null
 */
function getUserAgent(c: Context): string | null {
  return c.req.header('user-agent') || null;
}

/**
 * Creates audit middleware that captures request context
 * Stores IP address and user agent in context for later use by audit service
 *
 * @param options - Configuration options
 * @param options.logAllRequests - Whether to log all requests (default: false)
 * @returns Hono middleware function
 *
 * @example
 * ```typescript
 * const audit = auditMiddleware();
 * app.use('*', audit);
 *
 * // In your route handler or service:
 * const auditContext = c.get('auditContext');
 * await auditService.log(AuditAction.USER_CREATED, data, auditContext);
 * ```
 */
export function auditMiddleware(options?: {
  logAllRequests?: boolean;
}) {
  return async (c: Context, next: Next): Promise<void> => {
    const logger = c.get('logger');

    // Capture request context
    const auditContext: AuditContext = {
      ipAddress: getIpAddress(c),
      userAgent: getUserAgent(c),
    };

    // Store in context for later use
    c.set('auditContext', auditContext);

    // Optionally log all requests
    if (options?.logAllRequests && logger) {
      const method = c.req.method;
      const path = c.req.path;
      const user = c.get('user');

      logger.debug(
        {
          method,
          path,
          userId: user?.id,
          ip: auditContext.ipAddress,
          userAgent: auditContext.userAgent,
        },
        'Request received'
      );
    }

    await next();
  };
}

/**
 * Helper function to get audit context from Hono context
 * Provides a type-safe way to access audit context in route handlers
 *
 * @param c - Hono context
 * @returns Audit context or undefined
 *
 * @example
 * ```typescript
 * const context = getAuditContext(c);
 * await auditService.log(AuditAction.USER_CREATED, data, context);
 * ```
 */
export function getAuditContext(c: Context): AuditContext | undefined {
  return c.get('auditContext');
}
