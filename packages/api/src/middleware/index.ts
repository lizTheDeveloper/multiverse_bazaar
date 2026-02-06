/**
 * Security middleware exports for the Multiverse Bazaar API.
 * Provides a centralized location for all security-related middleware.
 */

// Rate limiting middleware
export {
  createRateLimiter,
  loginRateLimiter,
  itemCreateRateLimiter,
  upvoteRateLimiter,
  uploadRateLimiter,
  searchRateLimiter,
  generalRateLimiter,
  resetRateLimitStore,
  type RateLimitConfig,
} from './rate-limit.js';

// Security headers middleware
export {
  securityHeaders,
  productionSecurityHeaders,
  developmentSecurityHeaders,
  type SecurityHeadersConfig,
} from './security-headers.js';

// CORS middleware
export {
  cors,
  productionCors,
  developmentCors,
  type CorsConfig,
} from './cors.js';

// Input validation middleware
export {
  createValidator,
  validateBody,
  validateQuery,
  validateParam,
  validateHeader,
  validateSize,
  commonSchemas,
  type ValidationTarget,
} from './input-validation.js';

import type { MiddlewareHandler } from 'hono';
import { securityHeaders } from './security-headers.js';
import { cors, type CorsConfig } from './cors.js';
import { generalRateLimiter } from './rate-limit.js';

/**
 * Configuration for the security middleware stack.
 */
export interface SecurityStackConfig {
  /** CORS configuration */
  cors: CorsConfig;

  /** Enable security headers (default: true) */
  enableSecurityHeaders?: boolean;

  /** Enable general rate limiting (default: true) */
  enableRateLimiting?: boolean;
}

/**
 * Creates a composable security middleware stack.
 * Combines multiple security middleware in the recommended order.
 *
 * @param config - Security stack configuration
 * @returns Array of Hono middleware handlers
 *
 * @example
 * ```typescript
 * const securityStack = createSecurityStack({
 *   cors: {
 *     allowedOrigins: ['https://app.example.com'],
 *     allowCredentials: true,
 *   },
 * });
 *
 * // Apply to all routes
 * securityStack.forEach(middleware => app.use('*', middleware));
 * ```
 */
export function createSecurityStack(config: SecurityStackConfig): MiddlewareHandler[] {
  const {
    enableSecurityHeaders = true,
    enableRateLimiting = true,
  } = config;

  const stack: MiddlewareHandler[] = [];

  // 1. Security headers (first, so they're applied to all responses)
  if (enableSecurityHeaders) {
    stack.push(securityHeaders());
  }

  // 2. CORS (before rate limiting to handle preflight)
  stack.push(cors(config.cors));

  // 3. General rate limiting (after CORS to rate limit actual requests)
  if (enableRateLimiting) {
    stack.push(generalRateLimiter());
  }

  return stack;
}

/**
 * Creates a production-ready security middleware stack.
 *
 * @param allowedOrigins - Array of allowed origin URLs
 * @returns Array of Hono middleware handlers
 *
 * @example
 * ```typescript
 * const stack = productionSecurityStack([
 *   'https://app.example.com',
 *   'https://admin.example.com'
 * ]);
 *
 * stack.forEach(middleware => app.use('*', middleware));
 * ```
 */
export function productionSecurityStack(allowedOrigins: string[]): MiddlewareHandler[] {
  return createSecurityStack({
    cors: {
      allowedOrigins,
      allowCredentials: true,
      allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
      exposedHeaders: ['X-Request-ID', 'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
      maxAge: 86400,
      allowNoOrigin: false,
    },
    enableSecurityHeaders: true,
    enableRateLimiting: true,
  });
}

/**
 * Creates a development-friendly security middleware stack.
 *
 * @returns Array of Hono middleware handlers
 *
 * @example
 * ```typescript
 * if (process.env.NODE_ENV === 'development') {
 *   const stack = developmentSecurityStack();
 *   stack.forEach(middleware => app.use('*', middleware));
 * }
 * ```
 */
export function developmentSecurityStack(): MiddlewareHandler[] {
  return createSecurityStack({
    cors: {
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
    },
    enableSecurityHeaders: true,
    enableRateLimiting: false, // Disabled for development convenience
  });
}
