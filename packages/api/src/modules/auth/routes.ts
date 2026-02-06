/**
 * Authentication routes for the Multiverse Bazaar API.
 * Defines HTTP endpoints for login, logout, and token refresh.
 */

import { Hono } from 'hono';
import { isOk } from '@multiverse-bazaar/shared';
import { AuthService } from './service.js';
import { loginSchema, refreshSchema } from './schemas.js';
import { authMiddleware } from './middleware.js';
import { Logger } from '../../infra/logger.js';

/**
 * Context variables available in auth routes
 */
interface AuthContext {
  Variables: {
    requestId: string;
    logger: Logger;
    user?: {
      id: string;
      email: string;
      name: string | null;
    };
  };
}

/**
 * Creates authentication routes
 *
 * @param authService - AuthService instance for handling auth operations
 * @returns Hono app with auth routes configured
 */
export function createAuthRoutes(authService: AuthService): Hono<AuthContext> {
  const router = new Hono<AuthContext>();

  /**
   * POST /auth/login
   * Login with email (no password - email-only authentication)
   *
   * Request body:
   * {
   *   "email": "user@example.com"
   * }
   *
   * Response:
   * {
   *   "accessToken": "jwt.token.here",
   *   "user": {
   *     "id": "uuid",
   *     "email": "user@example.com",
   *     "name": "User Name",
   *     ...
   *   }
   * }
   *
   * Sets HTTP-only cookie with refresh token
   */
  router.post('/login', async (c) => {
    const logger = c.get('logger');

    // Parse and validate request body
    const body = await c.req.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return c.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            fieldErrors: validation.error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          },
        },
        400
      );
    }

    const { email } = validation.data;

    // Get IP address for rate limiting
    const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
    const userAgent = c.req.header('user-agent');

    logger.info({ email, ip }, 'Login attempt');

    const result = await authService.login(email, ip, userAgent);

    if (!isOk(result)) {
      const error = result.error;
      logger.warn({ email, error: error.message }, 'Login failed');

      const statusCode = error.statusCode as 400 | 401 | 403 | 404 | 429 | 500;

      return c.json(
        {
          error: {
            code: error.code,
            message: error.message,
            ...(error.details && { details: error.details }),
          },
        },
        statusCode
      );
    }

    const { accessToken, user } = result.value;

    logger.info({ userId: user.id }, 'Login successful');

    return c.json({
      accessToken,
      user,
    });
  });

  /**
   * POST /auth/logout
   * Logout current user (requires authentication)
   * Revokes all refresh tokens for the user
   *
   * Response:
   * {
   *   "message": "Logged out successfully"
   * }
   */
  router.post('/logout', authMiddleware(authService), async (c) => {
    const logger = c.get('logger');
    const user = c.get('user');

    if (!user) {
      logger.error('No user in context despite auth middleware');
      return c.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        401
      );
    }

    logger.info({ userId: user.id }, 'Logout attempt');

    const result = await authService.logout(user.id);

    if (!isOk(result)) {
      const error = result.error;
      logger.error({ userId: user.id, error: error.message }, 'Logout failed');

      const statusCode = error.statusCode as 400 | 401 | 403 | 404 | 429 | 500;

      return c.json(
        {
          error: {
            code: error.code,
            message: error.message,
            ...(error.details && { details: error.details }),
          },
        },
        statusCode
      );
    }

    logger.info({ userId: user.id }, 'Logout successful');

    return c.json({
      message: 'Logged out successfully',
    });
  });

  /**
   * POST /auth/refresh
   * Refresh access token using refresh token from cookie
   *
   * Request body: {} (empty - refresh token comes from cookie)
   *
   * Response:
   * {
   *   "accessToken": "new.jwt.token.here"
   * }
   *
   * Note: In a production setup, the refresh token would be read from an
   * HTTP-only cookie. For this implementation, we'll expect it in the
   * Authorization header or request body for simplicity.
   */
  router.post('/refresh', async (c) => {
    const logger = c.get('logger');

    // Parse request body (empty validation for now)
    const body = await c.req.json().catch(() => ({}));
    const validation = refreshSchema.safeParse(body);

    if (!validation.success) {
      return c.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
          },
        },
        400
      );
    }

    // Try to get refresh token from Authorization header
    // In production, this would come from HTTP-only cookie
    const authHeader = c.req.header('Authorization');
    let refreshToken: string | undefined;

    if (authHeader) {
      const parts = authHeader.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        refreshToken = parts[1];
      }
    }

    // Also check if it's in the request body (alternative for testing)
    if (!refreshToken) {
      const body = await c.req.json().catch(() => ({}));
      refreshToken = body.refreshToken;
    }

    if (!refreshToken) {
      logger.warn('No refresh token provided');
      return c.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Refresh token is required',
          },
        },
        401
      );
    }

    logger.info('Token refresh attempt');

    const result = await authService.refresh(refreshToken);

    if (!isOk(result)) {
      const error = result.error;
      logger.warn({ error: error.message }, 'Token refresh failed');

      const statusCode = error.statusCode as 400 | 401 | 403 | 404 | 429 | 500;

      return c.json(
        {
          error: {
            code: error.code,
            message: error.message,
            ...(error.details && { details: error.details }),
          },
        },
        statusCode
      );
    }

    const { accessToken } = result.value;

    logger.info('Token refresh successful');

    return c.json({
      accessToken,
    });
  });

  return router;
}
