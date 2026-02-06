/**
 * Zod validation schemas for Users module.
 * Provides runtime type validation for request payloads.
 */

import { z } from 'zod';

/**
 * Schema for updating user profile
 * Validates name, avatarUrl, and bio constraints
 */
export const updateUserSchema = z.object({
  name: z
    .string()
    .max(100, 'Name must be less than 100 characters')
    .trim()
    .optional(),
  avatarUrl: z
    .string()
    .url('Avatar URL must be a valid URL')
    .optional(),
  bio: z
    .string()
    .max(5000, 'Bio must be less than 5000 characters')
    .trim()
    .optional(),
});

/**
 * Schema for privacy settings validation
 */
export const privacySettingsSchema = z.object({
  showEmailOnProfile: z
    .boolean({
      required_error: 'showEmailOnProfile is required',
      invalid_type_error: 'showEmailOnProfile must be a boolean',
    }),
  includeInSearch: z
    .boolean({
      required_error: 'includeInSearch is required',
      invalid_type_error: 'includeInSearch must be a boolean',
    }),
  showActivityPublicly: z
    .boolean({
      required_error: 'showActivityPublicly is required',
      invalid_type_error: 'showActivityPublicly must be a boolean',
    }),
});

/**
 * Schema for inviting external user to collaborate
 */
export const inviteExternalUserSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .min(1, 'Email is required')
    .max(255, 'Email must be less than 255 characters')
    .toLowerCase()
    .trim(),
  projectId: z
    .string()
    .uuid('Project ID must be a valid UUID')
    .min(1, 'Project ID is required'),
  role: z
    .enum(['CONTRIBUTOR', 'ADVISOR'], {
      errorMap: () => ({ message: 'Role must be either CONTRIBUTOR or ADVISOR' }),
    }),
});

/**
 * Type inference for validated update user request
 */
export type ValidatedUpdateUserRequest = z.infer<typeof updateUserSchema>;

/**
 * Type inference for validated privacy settings
 */
export type ValidatedPrivacySettings = z.infer<typeof privacySettingsSchema>;

/**
 * Type inference for validated invite external user request
 */
export type ValidatedInviteExternalUserRequest = z.infer<typeof inviteExternalUserSchema>;
