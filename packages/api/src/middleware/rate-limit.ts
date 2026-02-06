/**
 * Rate limiting middleware for the Multiverse Bazaar API.
 * Implements in-memory rate limiting to prevent abuse and ensure fair resource usage.
 */

import type { Context, MiddlewareHandler, Next } from 'hono';
import type { Logger } from '../infra/logger.js';

/**
 * Configuration for rate limiting.
 */
export interface RateLimitConfig {
  /** Time window in milliseconds */
  windowMs: number;

  /** Maximum number of requests allowed in the time window */
  maxRequests: number;

  /** Function to generate a unique key for the client */
  keyGenerator: (c: Context) => string;

  /** Custom message to return when rate limit is exceeded */
  message?: string;
}

/**
 * Represents a single rate limit entry for a client.
 */
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

/**
 * In-memory store for rate limit tracking.
 * Maps client keys to their rate limit entries.
 */
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Cleanup interval for expired rate limit entries (run every 60 seconds).
 */
const CLEANUP_INTERVAL_MS = 60_000;

/**
 * Periodically removes expired entries from the rate limit store.
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  const keysToDelete: string[] = [];

  rateLimitStore.forEach((entry, key) => {
    if (now > entry.resetTime) {
      keysToDelete.push(key);
    }
  });

  keysToDelete.forEach((key) => {
    rateLimitStore.delete(key);
  });
}

// Start cleanup interval
setInterval(cleanupExpiredEntries, CLEANUP_INTERVAL_MS);

/**
 * Creates a rate limiting middleware with the specified configuration.
 *
 * @param config - Rate limit configuration
 * @returns Hono middleware handler
 *
 * @example
 * ```typescript
 * const limiter = createRateLimiter({
 *   windowMs: 15 * 60 * 1000, // 15 minutes
 *   maxRequests: 100,
 *   keyGenerator: (c) => c.req.header('X-Forwarded-For') || 'unknown',
 * });
 *
 * app.use('/api/*', limiter);
 * ```
 */
export function createRateLimiter(config: RateLimitConfig): MiddlewareHandler {
  return async (c: Context, next: Next): Promise<Response> => {
    const key = config.keyGenerator(c);
    const now = Date.now();

    // Get or create rate limit entry for this key
    let entry = rateLimitStore.get(key);

    if (!entry || now > entry.resetTime) {
      // Create new entry or reset expired entry
      entry = {
        count: 0,
        resetTime: now + config.windowMs,
      };
      rateLimitStore.set(key, entry);
    }

    // Increment request count
    entry.count++;

    // Calculate remaining requests and reset time
    const remaining = Math.max(0, config.maxRequests - entry.count);
    const resetTime = Math.ceil(entry.resetTime / 1000); // Convert to seconds

    // Add rate limit headers
    c.header('X-RateLimit-Limit', config.maxRequests.toString());
    c.header('X-RateLimit-Remaining', remaining.toString());
    c.header('X-RateLimit-Reset', resetTime.toString());

    // Check if rate limit exceeded
    if (entry.count > config.maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      c.header('Retry-After', retryAfter.toString());

      // Log rate limit violation
      const logger = c.get('logger') as Logger | undefined;
      if (logger) {
        logger.warn('Rate limit exceeded', {
          key,
          count: entry.count,
          maxRequests: config.maxRequests,
          windowMs: config.windowMs,
        });
      }

      return c.json(
        {
          error: {
            message: config.message || 'Too many requests, please try again later.',
            retryAfter,
            timestamp: new Date().toISOString(),
          },
        },
        429
      );
    }

    await next();
    return c.res;
  };
}

/**
 * Rate limiter for login attempts.
 * Limits to 5 requests per 15 minutes per email address.
 */
export function loginRateLimiter(): MiddlewareHandler {
  return createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    keyGenerator: (c: Context) => {
      // Extract email from request body
      const body = c.req.raw.body;
      if (body) {
        try {
          // Note: This is a simplified approach. In production, you might want to
          // parse the body more carefully or use a different approach
          const email = c.req.query('email') || 'unknown';
          return `login:${email}`;
        } catch {
          return 'login:unknown';
        }
      }
      return 'login:unknown';
    },
    message: 'Too many login attempts. Please try again in 15 minutes.',
  });
}

/**
 * Rate limiter for item creation.
 * Limits to 10 requests per hour per user.
 */
export function itemCreateRateLimiter(): MiddlewareHandler {
  return createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
    keyGenerator: (c: Context) => {
      const userId = c.get('userId') as string | undefined;
      return `create:${userId || 'anonymous'}`;
    },
    message: 'You have created too many items. Please try again later.',
  });
}

/**
 * Rate limiter for upvoting.
 * Limits to 60 requests per minute per user.
 */
export function upvoteRateLimiter(): MiddlewareHandler {
  return createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,
    keyGenerator: (c: Context) => {
      const userId = c.get('userId') as string | undefined;
      return `upvote:${userId || 'anonymous'}`;
    },
    message: 'You are upvoting too quickly. Please slow down.',
  });
}

/**
 * Rate limiter for file uploads.
 * Limits to 20 requests per hour per user.
 */
export function uploadRateLimiter(): MiddlewareHandler {
  return createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 20,
    keyGenerator: (c: Context) => {
      const userId = c.get('userId') as string | undefined;
      return `upload:${userId || 'anonymous'}`;
    },
    message: 'You have uploaded too many files. Please try again later.',
  });
}

/**
 * Rate limiter for search operations.
 * Limits to 30 requests per minute per user or IP.
 */
export function searchRateLimiter(): MiddlewareHandler {
  return createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
    keyGenerator: (c: Context) => {
      const userId = c.get('userId') as string | undefined;
      if (userId) {
        return `search:user:${userId}`;
      }
      const ip = c.req.header('X-Forwarded-For') || c.req.header('X-Real-IP') || 'unknown';
      return `search:ip:${ip}`;
    },
    message: 'You are searching too frequently. Please slow down.',
  });
}

/**
 * General rate limiter for all API endpoints.
 * Limits to 100 requests per minute per IP address.
 */
export function generalRateLimiter(): MiddlewareHandler {
  return createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    keyGenerator: (c: Context) => {
      const ip = c.req.header('X-Forwarded-For') || c.req.header('X-Real-IP') || 'unknown';
      return `general:${ip}`;
    },
    message: 'Too many requests from this IP address. Please try again later.',
  });
}

/**
 * Resets the rate limit store.
 * Useful for testing purposes.
 *
 * @internal
 */
export function resetRateLimitStore(): void {
  rateLimitStore.clear();
}
