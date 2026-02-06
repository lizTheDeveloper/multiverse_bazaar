/**
 * Zod validation schemas for Upvotes module.
 * Provides runtime type validation for request payloads.
 */

import { z } from 'zod';

/**
 * Schema for validating project ID parameter
 * Ensures projectId is a valid UUID
 */
export const projectIdParamSchema = z.object({
  id: z.string().uuid('Invalid project ID format'),
});

/**
 * Type inference for validated project ID parameter
 */
export type ValidatedProjectIdParam = z.infer<typeof projectIdParamSchema>;
