/**
 * Input validation middleware for the Multiverse Bazaar API.
 * Provides Zod-based validation with automatic sanitization and security checks.
 */

import type { Context, MiddlewareHandler, Next } from 'hono';
import { z, type ZodSchema, type ZodError } from 'zod';
import type { Logger } from '../infra/logger.js';

/**
 * Target for validation (body, query, params, or headers).
 */
export type ValidationTarget = 'body' | 'query' | 'param' | 'header';

/**
 * HTML sanitization regex patterns.
 */
const HTML_TAG_REGEX = /<[^>]*>/g;
const SCRIPT_TAG_REGEX = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
const STYLE_TAG_REGEX = /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi;
const ON_EVENT_REGEX = /\s*on\w+\s*=\s*["'][^"']*["']/gi;

/**
 * Sanitizes a string by removing HTML tags and dangerous content.
 *
 * @param value - String to sanitize
 * @returns Sanitized string
 */
function sanitizeHtml(value: string): string {
  if (typeof value !== 'string') {
    return value;
  }

  let sanitized = value;

  // Remove script tags
  sanitized = sanitized.replace(SCRIPT_TAG_REGEX, '');

  // Remove style tags
  sanitized = sanitized.replace(STYLE_TAG_REGEX, '');

  // Remove on* event handlers
  sanitized = sanitized.replace(ON_EVENT_REGEX, '');

  // Remove all HTML tags
  sanitized = sanitized.replace(HTML_TAG_REGEX, '');

  // Decode HTML entities
  sanitized = sanitized
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&');

  return sanitized.trim();
}

/**
 * Recursively sanitizes all string values in an object.
 *
 * @param obj - Object to sanitize
 * @returns Sanitized object
 */
function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizeHtml(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  if (obj !== null && typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }

  return obj;
}

/**
 * Common validation schemas for reuse across the application.
 */
export const commonSchemas = {
  /** Title validation: max 200 chars, trimmed, sanitized */
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less')
    .transform((val) => sanitizeHtml(val)),

  /** Description validation: max 5000 chars, trimmed, sanitized */
  description: z
    .string()
    .max(5000, 'Description must be 5000 characters or less')
    .transform((val) => sanitizeHtml(val))
    .optional(),

  /** Bio validation: max 5000 chars, trimmed, sanitized */
  bio: z
    .string()
    .max(5000, 'Bio must be 5000 characters or less')
    .transform((val) => sanitizeHtml(val))
    .optional(),

  /** Email validation: normalized to lowercase, trimmed */
  email: z
    .string()
    .email('Invalid email format')
    .transform((val) => val.trim().toLowerCase()),

  /** URL validation: must be valid URL format */
  url: z
    .string()
    .url('Invalid URL format')
    .transform((val) => val.trim()),

  /** Allowed domain URL validation */
  allowedDomainUrl: (domains: string[]) =>
    z
      .string()
      .url('Invalid URL format')
      .refine(
        (val) => {
          try {
            const url = new URL(val);
            return domains.some((domain) => url.hostname === domain || url.hostname.endsWith(`.${domain}`));
          } catch {
            return false;
          }
        },
        {
          message: `URL must be from allowed domains: ${domains.join(', ')}`,
        }
      ),

  /** UUID validation */
  uuid: z.string().uuid('Invalid UUID format'),

  /** Positive integer validation */
  positiveInt: z.number().int().positive('Must be a positive integer'),

  /** Non-negative integer validation */
  nonNegativeInt: z.number().int().nonnegative('Must be a non-negative integer'),

  /** Pagination limit validation */
  paginationLimit: z
    .number()
    .int()
    .positive()
    .max(100, 'Limit must be 100 or less')
    .default(20),

  /** Pagination offset validation */
  paginationOffset: z.number().int().nonnegative().default(0),
};

/**
 * Creates a validation middleware for the specified target and schema.
 *
 * @param target - What to validate (body, query, param, header)
 * @param schema - Zod schema for validation
 * @returns Hono middleware handler
 *
 * @example
 * ```typescript
 * const createItemSchema = z.object({
 *   title: commonSchemas.title,
 *   description: commonSchemas.description,
 * });
 *
 * app.post('/items', createValidator('body', createItemSchema), handler);
 * ```
 */
export function createValidator<T extends ZodSchema>(
  target: ValidationTarget,
  schema: T
): MiddlewareHandler {
  return async (c: Context, next: Next): Promise<Response> => {
    let data: any;

    // Extract data based on target
    try {
      switch (target) {
        case 'body':
          data = await c.req.json();
          break;
        case 'query':
          data = Object.fromEntries(new URL(c.req.url).searchParams.entries());
          break;
        case 'param':
          data = c.req.param();
          break;
        case 'header':
          data = Object.fromEntries(
            Array.from(c.req.raw.headers.entries()).map(([key, value]) => [
              key.toLowerCase(),
              value,
            ])
          );
          break;
        default:
          throw new Error(`Invalid validation target: ${target}`);
      }
    } catch (error) {
      const logger = c.get('logger') as Logger | undefined;
      if (logger) {
        logger.warn('Failed to parse request data', {
          target,
          error: error instanceof Error ? error.message : String(error),
        });
      }

      return c.json(
        {
          error: {
            message: 'Invalid request data format',
            timestamp: new Date().toISOString(),
          },
        },
        400
      );
    }

    // Sanitize data before validation
    const sanitizedData = sanitizeObject(data);

    // Validate data
    const result = schema.safeParse(sanitizedData);

    if (!result.success) {
      const zodError = result.error as ZodError;

      // Format validation errors
      const errors = zodError.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
      }));

      // Log validation failure
      const logger = c.get('logger') as Logger | undefined;
      if (logger) {
        logger.warn('Validation failed', {
          target,
          errors,
        });
      }

      return c.json(
        {
          error: {
            message: 'Validation failed',
            details: errors,
            timestamp: new Date().toISOString(),
          },
        },
        400
      );
    }

    // Store validated data in context
    c.set(`validated${target.charAt(0).toUpperCase() + target.slice(1)}` as any, result.data);

    await next();
    return c.res;
  };
}

/**
 * Shorthand for body validation.
 *
 * @param schema - Zod schema for validation
 * @returns Hono middleware handler
 */
export function validateBody<T extends ZodSchema>(schema: T): MiddlewareHandler {
  return createValidator('body', schema);
}

/**
 * Shorthand for query validation.
 *
 * @param schema - Zod schema for validation
 * @returns Hono middleware handler
 */
export function validateQuery<T extends ZodSchema>(schema: T): MiddlewareHandler {
  return createValidator('query', schema);
}

/**
 * Shorthand for param validation.
 *
 * @param schema - Zod schema for validation
 * @returns Hono middleware handler
 */
export function validateParam<T extends ZodSchema>(schema: T): MiddlewareHandler {
  return createValidator('param', schema);
}

/**
 * Shorthand for header validation.
 *
 * @param schema - Zod schema for validation
 * @returns Hono middleware handler
 */
export function validateHeader<T extends ZodSchema>(schema: T): MiddlewareHandler {
  return createValidator('header', schema);
}

/**
 * Size limit validation middleware.
 * Checks the Content-Length header to enforce size limits before processing.
 *
 * @param maxSizeBytes - Maximum allowed size in bytes
 * @returns Hono middleware handler
 *
 * @example
 * ```typescript
 * app.post('/upload', validateSize(5 * 1024 * 1024), handler); // 5MB limit
 * ```
 */
export function validateSize(maxSizeBytes: number): MiddlewareHandler {
  return async (c: Context, next: Next): Promise<Response> => {
    const contentLength = c.req.header('Content-Length');

    if (contentLength) {
      const size = parseInt(contentLength, 10);

      if (size > maxSizeBytes) {
        const logger = c.get('logger') as Logger | undefined;
        if (logger) {
          logger.warn('Request size exceeds limit', {
            size,
            maxSize: maxSizeBytes,
          });
        }

        return c.json(
          {
            error: {
              message: `Request size exceeds maximum allowed size of ${maxSizeBytes} bytes`,
              timestamp: new Date().toISOString(),
            },
          },
          413
        );
      }
    }

    await next();
    return c.res;
  };
}
