/**
 * Audit module - Public API
 * Exports all public types, classes, and functions for the audit logging system.
 */

// Export types
export {
  AuditAction,
  AuditLog,
  CreateAuditLogRequest,
  AuditContext,
  AuditLogQuery,
  AuditLogResult,
  LoginHistory,
} from './types.js';

// Export repository
export { AuditRepository } from './repository.js';

// Export service
export { AuditService } from './service.js';

// Export middleware
export {
  auditMiddleware,
  getAuditContext,
  AuditVariables,
} from './middleware.js';

// Export schemas
export {
  auditLogQuerySchema,
  createAuditLogSchema,
  ValidatedAuditLogQuery,
  ValidatedCreateAuditLog,
} from './schemas.js';
