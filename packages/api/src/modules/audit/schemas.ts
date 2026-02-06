/**
 * Zod validation schemas for Audit module.
 * Provides runtime type validation for audit log queries and requests.
 */

import { z } from 'zod';
import { AuditAction } from './types.js';

/**
 * Schema for audit log query validation
 */
export const auditLogQuerySchema = z.object({
  userId: z.string().uuid().optional(),
  action: z.nativeEnum(AuditAction).optional(),
  resourceType: z.string().min(1).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

/**
 * Schema for create audit log request validation
 */
export const createAuditLogSchema = z.object({
  userId: z.string().uuid().nullable().optional(),
  action: z.nativeEnum(AuditAction),
  resourceType: z.string().min(1),
  resourceId: z.string().uuid().nullable().optional(),
  metadata: z.record(z.any()).nullable().optional(),
});

/**
 * Type inference for validated audit log query
 */
export type ValidatedAuditLogQuery = z.infer<typeof auditLogQuerySchema>;

/**
 * Type inference for validated create audit log request
 */
export type ValidatedCreateAuditLog = z.infer<typeof createAuditLogSchema>;
