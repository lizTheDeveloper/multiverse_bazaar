/**
 * Zod validation schemas for Notifications module.
 * Provides runtime type validation for request payloads.
 */

import { z } from 'zod';
import { Platform } from './types.js';

/**
 * Schema for registering a push token
 * Validates token string and platform enum
 */
export const registerPushTokenSchema = z.object({
  token: z.string().min(1, 'Token cannot be empty'),
  platform: z.nativeEnum(Platform, {
    errorMap: () => ({ message: 'Platform must be either IOS or ANDROID' }),
  }),
});

/**
 * Type inference for validated push token registration
 */
export type ValidatedRegisterPushToken = z.infer<typeof registerPushTokenSchema>;

/**
 * Schema for notification list query parameters
 * Validates pagination and filtering options
 */
export const notificationListQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine((val) => val > 0, 'Page must be greater than 0'),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .refine((val) => val > 0 && val <= 100, 'Limit must be between 1 and 100'),
  unreadOnly: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
});

/**
 * Type inference for validated notification list query
 */
export type ValidatedNotificationListQuery = z.infer<typeof notificationListQuerySchema>;

/**
 * Schema for notification ID parameter
 * Ensures notificationId is a valid UUID
 */
export const notificationIdParamSchema = z.object({
  id: z.string().uuid('Invalid notification ID format'),
});

/**
 * Type inference for validated notification ID parameter
 */
export type ValidatedNotificationIdParam = z.infer<typeof notificationIdParamSchema>;

/**
 * Schema for deleting push token
 * Validates token string
 */
export const deletePushTokenSchema = z.object({
  token: z.string().min(1, 'Token cannot be empty'),
});

/**
 * Type inference for validated delete push token request
 */
export type ValidatedDeletePushToken = z.infer<typeof deletePushTokenSchema>;
