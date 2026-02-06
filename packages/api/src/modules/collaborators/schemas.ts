/**
 * Zod validation schemas for Collaborators module.
 * Provides runtime type validation for request payloads.
 */

import { z } from 'zod';
import { CollaboratorRole } from './types.js';

/**
 * Schema for collaborator role validation
 * Ensures role is one of the valid enum values
 */
export const collaboratorRoleSchema = z.nativeEnum(CollaboratorRole, {
  errorMap: () => ({
    message: `Role must be one of: ${Object.values(CollaboratorRole).join(', ')}`,
  }),
});

/**
 * Schema for invite collaborator request validation
 * Validates email format and role
 */
export const inviteCollaboratorSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .min(1, 'Email is required')
    .max(255, 'Email must be less than 255 characters')
    .toLowerCase()
    .trim(),
  role: collaboratorRoleSchema,
});

/**
 * Schema for accept invitation request validation
 * Validates UUID token format
 */
export const acceptInvitationSchema = z.object({
  token: z
    .string()
    .uuid('Invalid invitation token format')
    .min(1, 'Invitation token is required'),
});

/**
 * Schema for decline invitation request validation
 * Validates UUID token format
 */
export const declineInvitationSchema = z.object({
  token: z
    .string()
    .uuid('Invalid invitation token format')
    .min(1, 'Invitation token is required'),
});

/**
 * Schema for UUID path parameter validation
 */
export const uuidParamSchema = z.string().uuid('Invalid ID format');

/**
 * Type inference for validated invite collaborator request
 */
export type ValidatedInviteCollaboratorRequest = z.infer<typeof inviteCollaboratorSchema>;

/**
 * Type inference for validated accept invitation request
 */
export type ValidatedAcceptInvitationRequest = z.infer<typeof acceptInvitationSchema>;

/**
 * Type inference for validated decline invitation request
 */
export type ValidatedDeclineInvitationRequest = z.infer<typeof declineInvitationSchema>;
