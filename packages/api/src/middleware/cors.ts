/**
 * Enhanced CORS middleware for the Multiverse Bazaar API.
 * Provides secure cross-origin resource sharing with strict validation.
 */

import type { Context, MiddlewareHandler, Next } from 'hono';
import type { Logger } from '../infra/logger.js';

/**
 * Configuration for CORS middleware.
 */
export interface CorsConfig {
  /** List of allowed origins. Use array of strings, not wildcards in production */
  allowedOrigins: string[];

  /** Allow credentials (cookies, authorization headers) */
  allowCredentials?: boolean;

  /** Allowed HTTP methods */
  allowedMethods?: string[];

  /** Allowed request headers */
  allowedHeaders?: string[];

  /** Headers to expose to the client */
  exposedHeaders?: string[];

  /** Preflight cache duration in seconds */
  maxAge?: number;

  /** Allow requests with no origin (e.g., mobile apps, curl) */
  allowNoOrigin?: boolean;
}

/**
 * Validates if the request origin is allowed based on configuration.
 *
 * @param origin - Request origin header value
 * @param config - CORS configuration
 * @returns True if origin is allowed, false otherwise
 */
function isOriginAllowed(origin: string | undefined, config: CorsConfig): boolean {
  // No origin header (e.g., same-origin, mobile app, curl)
  if (!origin) {
    return config.allowNoOrigin || false;
  }

  // Check if origin is in allowed list
  if (config.allowedOrigins.includes(origin)) {
    return true;
  }

  // Wildcard check (only allow in non-production)
  if (config.allowedOrigins.includes('*')) {
    if (process.env.NODE_ENV === 'production') {
      // Log security warning
      console.warn(
        'WARNING: Wildcard CORS origin (*) is not allowed in production. Request blocked.'
      );
      return false;
    }
    return true;
  }

  return false;
}

/**
 * Creates an enhanced CORS middleware with strict validation.
 *
 * @param config - CORS configuration
 * @returns Hono middleware handler
 *
 * @example
 * ```typescript
 * app.use('*', cors({
 *   allowedOrigins: ['https://app.example.com'],
 *   allowCredentials: true,
 *   exposedHeaders: ['X-Request-ID'],
 * }));
 * ```
 */
export function cors(config: CorsConfig): MiddlewareHandler {
  const {
    allowedOrigins,
    allowCredentials = true,
    allowedMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders = ['Content-Type', 'Authorization', 'X-Request-ID'],
    exposedHeaders = ['X-Request-ID', 'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
    maxAge = 86400, // 24 hours
    allowNoOrigin = false,
  } = config;

  // Validation: Ensure no wildcards in production
  if (process.env.NODE_ENV === 'production') {
    if (allowedOrigins.includes('*')) {
      throw new Error(
        'CORS wildcard (*) is not allowed in production. Please specify exact origins.'
      );
    }

    // Check for localhost origins in production
    const hasLocalhost = allowedOrigins.some(
      (origin) => origin.includes('localhost') || origin.includes('127.0.0.1')
    );
    if (hasLocalhost) {
      throw new Error(
        'Localhost origins are not allowed in production CORS configuration.'
      );
    }
  }

  return async (c: Context, next: Next): Promise<Response> => {
    const origin = c.req.header('Origin');
    const requestMethod = c.req.method;

    // Check if origin is allowed
    const originAllowed = isOriginAllowed(origin, {
      ...config,
      allowNoOrigin,
    });

    if (!originAllowed && origin) {
      // Log blocked request
      const logger = c.get('logger') as Logger | undefined;
      if (logger) {
        logger.warn('CORS: Origin not allowed', {
          origin,
          path: c.req.path,
          method: requestMethod,
        });
      }

      return c.json(
        {
          error: {
            message: 'CORS policy: Origin not allowed',
            timestamp: new Date().toISOString(),
          },
        },
        403
      );
    }

    // Set CORS headers
    if (origin && originAllowed) {
      // Use specific origin instead of wildcard
      c.header('Access-Control-Allow-Origin', origin);

      // Vary header to indicate response varies based on Origin
      c.header('Vary', 'Origin');
    }

    // Allow credentials
    if (allowCredentials) {
      c.header('Access-Control-Allow-Credentials', 'true');
    }

    // Expose headers to client
    if (exposedHeaders.length > 0) {
      c.header('Access-Control-Expose-Headers', exposedHeaders.join(', '));
    }

    // Handle preflight requests
    if (requestMethod === 'OPTIONS') {
      // Allowed methods
      c.header('Access-Control-Allow-Methods', allowedMethods.join(', '));

      // Allowed headers
      c.header('Access-Control-Allow-Headers', allowedHeaders.join(', '));

      // Preflight cache duration
      c.header('Access-Control-Max-Age', maxAge.toString());

      // Return 204 No Content for preflight
      return c.body(null, 204);
    }

    await next();
    return c.res;
  };
}

/**
 * Creates a CORS middleware with production-ready defaults.
 * Requires explicit origin configuration and enforces strict validation.
 *
 * @param allowedOrigins - Array of allowed origin URLs
 * @returns Hono middleware handler
 *
 * @example
 * ```typescript
 * app.use('*', productionCors([
 *   'https://app.example.com',
 *   'https://admin.example.com'
 * ]));
 * ```
 */
export function productionCors(allowedOrigins: string[]): MiddlewareHandler {
  // Validate origins
  if (allowedOrigins.length === 0) {
    throw new Error('Production CORS requires at least one allowed origin');
  }

  if (allowedOrigins.includes('*')) {
    throw new Error('Wildcard origins not allowed in production');
  }

  return cors({
    allowedOrigins,
    allowCredentials: true,
    allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    exposedHeaders: ['X-Request-ID', 'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
    maxAge: 86400, // 24 hours
    allowNoOrigin: false,
  });
}

/**
 * Creates a CORS middleware with development-friendly defaults.
 * Allows localhost and common development origins.
 *
 * @returns Hono middleware handler
 *
 * @example
 * ```typescript
 * if (process.env.NODE_ENV === 'development') {
 *   app.use('*', developmentCors());
 * }
 * ```
 */
export function developmentCors(): MiddlewareHandler {
  return cors({
    allowedOrigins: [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:8080',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:8080',
    ],
    allowCredentials: true,
    allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    exposedHeaders: ['X-Request-ID', 'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
    maxAge: 86400,
    allowNoOrigin: true,
  });
}
