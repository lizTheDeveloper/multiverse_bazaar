/**
 * Zod validation schemas for Search module.
 * Provides runtime type validation for search query parameters.
 */

import { z } from 'zod';

/**
 * Schema for search query parameters
 * Validates and transforms query string parameters
 */
export const searchQuerySchema = z.object({
  // Search query - required, min 1 char, max 200 chars
  q: z
    .string()
    .min(1, 'Search query is required')
    .max(200, 'Search query must be less than 200 characters')
    .trim(),

  // Search type - optional enum
  type: z.enum(['projects', 'ideas', 'all']).optional(),

  // Status filter - optional string (will be validated against ProjectStatus or IdeaStatus in service)
  status: z.string().optional(),

  // Featured filter - for projects only
  featured: z
    .string()
    .optional()
    .transform((val) => {
      if (val === undefined) return undefined;
      return val === 'true' || val === '1';
    })
    .pipe(z.boolean().optional()),

  // Pagination - page number
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().int().positive().default(1)),

  // Pagination - limit per page
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .pipe(z.number().int().positive().max(100).default(20)),
});

/**
 * Type inference for validated search query
 */
export type ValidatedSearchQuery = z.infer<typeof searchQuerySchema>;
