/**
 * Zod validation schemas for Authentication module.
 * Provides runtime type validation for request payloads.
 */

import { z } from 'zod';

/**
 * Schema for login request validation
 * Validates email format and password
 */
export const loginSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .min(1, 'Email is required')
    .max(255, 'Email must be less than 255 characters')
    .toLowerCase()
    .trim(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be less than 100 characters'),
});

/**
 * Schema for register request validation
 * Validates email, password, and optional name
 */
export const registerSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .min(1, 'Email is required')
    .max(255, 'Email must be less than 255 characters')
    .toLowerCase()
    .trim(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be less than 100 characters'),
  name: z.string()
    .min(1, 'Name must not be empty')
    .max(100, 'Name must be less than 100 characters')
    .optional(),
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
 * Type inference for validated register request
 */
export type ValidatedRegisterRequest = z.infer<typeof registerSchema>;

/**
 * Type inference for validated refresh request
 */
export type ValidatedRefreshRequest = z.infer<typeof refreshSchema>;
