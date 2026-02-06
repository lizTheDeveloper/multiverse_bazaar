/**
 * Zod validation schemas for Authentication module.
 * Provides runtime type validation for request payloads.
 */

import { z } from 'zod';

/**
 * Schema for login request validation
 * Validates email format
 */
export const loginSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .min(1, 'Email is required')
    .max(255, 'Email must be less than 255 characters')
    .toLowerCase()
    .trim(),
});

/**
 * Schema for refresh token request validation
 * Currently empty as token comes from cookie
 */
export const refreshSchema = z.object({
  // Empty schema - refresh token extracted from cookie
});

/**
 * Type inference for validated login request
 */
export type ValidatedLoginRequest = z.infer<typeof loginSchema>;

/**
 * Type inference for validated refresh request
 */
export type ValidatedRefreshRequest = z.infer<typeof refreshSchema>;
