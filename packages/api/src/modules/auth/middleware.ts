/**
 * Authentication middleware for Hono routes.
 * Validates JWT tokens and attaches user information to request context.
 */

import { Context, Next } from 'hono';
import { isOk } from '@multiverse-bazaar/shared';
import { AuthService } from './service.js';
import { AuthenticatedUser } from './types.js';

/**
 * Extended context variables for authenticated requests
 */
export interface AuthVariables {
  user: AuthenticatedUser;
}

/**
 * Creates authentication middleware that requires a valid JWT token
 * Extracts Bearer token from Authorization header, validates it,
 * and attaches user info to context
 *
 * @param authService - AuthService instance for token validation
 * @returns Hono middleware function
 *
 * @example
 * ```typescript
 * const auth = authMiddleware(authService);
 * app.get('/protected', auth, (c) => {
 *   const user = c.get('user');
 *   return c.json({ message: `Hello ${user.email}` });
 * });
 * ```
 */
export function authMiddleware(authService: AuthService) {
  return async (c: Context, next: Next): Promise<Response | void> => {
    const logger = c.get('logger');

    if (!logger) {
      throw new Error('Logger not available in context');
    }

    // Extract Authorization header
    const authHeader = c.req.header('Authorization');

    if (!authHeader) {
      logger.warn('No Authorization header provided');
      return c.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authorization header is required',
          },
        },
        401
      );
    }

    // Check for Bearer token format
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer' || !parts[1]) {
      logger.warn('Invalid Authorization header format', { authHeader });
      return c.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authorization header must be in format: Bearer <token>',
          },
        },
        401
      );
    }

    const token = parts[1];

    // Validate token
    const result = authService.validateToken(token);

    if (!isOk(result)) {
      const errorMsg = result.error.message || 'Unknown error';
      logger.warn('Token validation failed', { error: errorMsg });
      return c.json(
        {
          error: {
            code: result.error.code,
            message: result.error.message,
          },
        },
        result.error.statusCode
      );
    }

    const payload = result.value;

    // Attach user to context
    const user: AuthenticatedUser = {
      id: payload.userId,
      email: payload.email,
      name: null, // Name not included in token payload
    };

    c.set('user', user);

    logger.info('Request authenticated', { userId: user.id });

    await next();
  };
}

/**
 * Creates optional authentication middleware that doesn't fail if no token is present
 * If a valid token is provided, attaches user info to context
 * If no token or invalid token, continues without setting user
 *
 * @param authService - AuthService instance for token validation
 * @returns Hono middleware function
 *
 * @example
 * ```typescript
 * const optionalAuth = optionalAuthMiddleware(authService);
 * app.get('/public', optionalAuth, (c) => {
 *   const user = c.get('user'); // May be undefined
 *   if (user) {
 *     return c.json({ message: `Hello ${user.email}` });
 *   }
 *   return c.json({ message: 'Hello guest' });
 * });
 * ```
 */
export function optionalAuthMiddleware(authService: AuthService) {
  return async (c: Context, next: Next): Promise<void> => {
    const logger = c.get('logger');

    if (!logger) {
      throw new Error('Logger not available in context');
    }

    // Extract Authorization header
    const authHeader = c.req.header('Authorization');

    if (!authHeader) {
      // No auth header, continue without user
      await next();
      return;
    }

    // Check for Bearer token format
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer' || !parts[1]) {
      logger.debug('Invalid Authorization header format in optional auth', { authHeader });
      // Invalid format, continue without user
      await next();
      return;
    }

    const token = parts[1];

    // Validate token
    const result = authService.validateToken(token);

    if (isOk(result)) {
      const payload = result.value;

      // Attach user to context
      const user: AuthenticatedUser = {
        id: payload.userId,
        email: payload.email,
        name: null, // Name not included in token payload
      };

      c.set('user', user);

      logger.debug('Optional auth: Request authenticated', { userId: user.id });
    } else {
      const errorMsg = result.error.message || 'Unknown error';
      logger.debug('Optional auth: Token validation failed', { error: errorMsg });
      // Invalid token, continue without user
    }

    await next();
  };
}
