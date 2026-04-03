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
  // Optional refresh token in body (for testing/mobile apps)
  // In production, this would come from HTTP-only cookie
  refreshToken: z.string().optional(),
});

/**
 * Schema for magic link request validation
 * Validates email format
 */
export const magicLinkSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .min(1, 'Email is required')
    .max(255, 'Email must be less than 255 characters')
    .toLowerCase()
    .trim(),
});

/**
 * Schema for magic link verification request validation
 * Validates token format
 */
export const magicLinkVerifySchema = z.object({
  token: z.string()
    .min(1, 'Token is required')
    .max(128, 'Token must be less than 128 characters'),
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

/**
 * Type inference for validated magic link request
 */
export type ValidatedMagicLinkRequest = z.infer<typeof magicLinkSchema>;

/**
 * Type inference for validated magic link verify request
 */
export type ValidatedMagicLinkVerifyRequest = z.infer<typeof magicLinkVerifySchema>;
