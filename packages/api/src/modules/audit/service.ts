/**
 * Business logic layer for Audit module.
 * Provides high-level audit logging methods with fire-and-forget pattern.
 * Never throws errors to prevent audit logging from affecting business operations.
 */

import { Result, Ok, Err, isOk } from '@multiverse-bazaar/shared';
import { Logger } from '../../infra/logger.js';
import { AuditRepository } from './repository.js';
import {
  AuditAction,
  AuditLog,
  CreateAuditLogRequest,
  AuditContext,
  AuditLogQuery,
  AuditLogResult,
  LoginHistory,
} from './types.js';

/**
 * Service for audit logging operations
 * Implements fire-and-forget pattern - logs errors but never throws
 */
export class AuditService {
  constructor(
    private readonly repository: AuditRepository,
    private readonly logger: Logger
  ) {}

  /**
   * Main logging method - creates an audit log entry
   * Fire-and-forget: logs errors but never throws
   * @param action - Action being audited
   * @param data - Additional data for the audit log
   * @param context - Request context (IP, user agent)
   */
  async log(
    action: AuditAction,
    data: Omit<CreateAuditLogRequest, 'action'>,
    context?: AuditContext
  ): Promise<void> {
    try {
      const request: CreateAuditLogRequest = {
        ...data,
        action,
      };

      const result = await this.repository.create(request, context);

      if (!isOk(result)) {
        this.logger.error(
          {
            error: result.error.message,
            details: result.error.details,
            action,
          },
          'Failed to create audit log'
        );
      }
    } catch (error) {
      // Fire-and-forget: log the error but don't throw
      this.logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          action,
        },
        'Unexpected error in audit log creation'
      );
    }
  }

  /**
   * Log authentication events
   * @param action - Auth action (login success/failure, logout)
   * @param userId - User ID (null for failed logins)
   * @param success - Whether the auth action was successful
   * @param context - Request context
   */
  async logAuth(
    action: AuditAction.AUTH_LOGIN_SUCCESS | AuditAction.AUTH_LOGIN_FAILURE | AuditAction.AUTH_LOGOUT,
    userId: string | null,
    success: boolean,
    context?: AuditContext
  ): Promise<void> {
    await this.log(
      action,
      {
        userId,
        resourceType: 'auth',
        metadata: { success },
      },
      context
    );
  }

  /**
   * Log resource change events (create, update, delete)
   * @param action - Resource action
   * @param resourceType - Type of resource
   * @param resourceId - Resource ID
   * @param userId - User performing the action
   * @param changes - Optional changes being made (for updates)
   * @param context - Request context
   */
  async logResourceChange(
    action: AuditAction,
    resourceType: string,
    resourceId: string,
    userId: string,
    changes?: Record<string, any>,
    context?: AuditContext
  ): Promise<void> {
    await this.log(
      action,
      {
        userId,
        resourceType,
        resourceId,
        metadata: changes ? { changes } : null,
      },
      context
    );
  }

  /**
   * Log sensitive data access (exports, deletions)
   * @param action - Data access action
   * @param userId - User performing the action
   * @param context - Request context
   */
  async logSensitiveAccess(
    action: AuditAction.DATA_EXPORT_REQUESTED | AuditAction.DATA_DELETION_REQUESTED,
    userId: string,
    context?: AuditContext
  ): Promise<void> {
    await this.log(
      action,
      {
        userId,
        resourceType: 'data_request',
        metadata: { sensitiveAccess: true },
      },
      context
    );
  }

  /**
   * Get full audit trail for a user
   * @param userId - User ID
   * @param query - Optional query filters
   * @returns Result with audit trail or error
   */
  async getAuditTrail(
    userId: string,
    query?: Omit<AuditLogQuery, 'userId'>
  ): Promise<Result<AuditLogResult, Error>> {
    try {
      const result = await this.repository.findByUserId(userId, query);

      if (!isOk(result)) {
        return Err(new Error(result.error.message));
      }

      return Ok(result.value);
    } catch (error) {
      return Err(
        error instanceof Error
          ? error
          : new Error('Failed to get audit trail')
      );
    }
  }

  /**
   * Get audit logs for a specific resource
   * @param resourceType - Type of resource
   * @param resourceId - Resource ID
   * @returns Result with audit logs or error
   */
  async getResourceLogs(
    resourceType: string,
    resourceId: string
  ): Promise<Result<AuditLog[], Error>> {
    try {
      const result = await this.repository.findByResource(resourceType, resourceId);

      if (!isOk(result)) {
        return Err(new Error(result.error.message));
      }

      return Ok(result.value);
    } catch (error) {
      return Err(
        error instanceof Error
          ? error
          : new Error('Failed to get resource logs')
      );
    }
  }

  /**
   * Query audit logs with filters
   * @param query - Query parameters
   * @returns Result with audit logs or error
   */
  async queryLogs(
    query: AuditLogQuery
  ): Promise<Result<AuditLogResult, Error>> {
    try {
      const result = await this.repository.query(query);

      if (!isOk(result)) {
        return Err(new Error(result.error.message));
      }

      return Ok(result.value);
    } catch (error) {
      return Err(
        error instanceof Error
          ? error
          : new Error('Failed to query audit logs')
      );
    }
  }

  /**
   * Get login history for a user
   * @param userId - User ID
   * @param limit - Maximum number of login attempts to return
   * @returns Result with login history or error
   */
  async getLoginHistory(
    userId: string,
    limit?: number
  ): Promise<Result<LoginHistory[], Error>> {
    try {
      const result = await this.repository.getLoginHistory(userId, limit);

      if (!isOk(result)) {
        return Err(new Error(result.error.message));
      }

      return Ok(result.value);
    } catch (error) {
      return Err(
        error instanceof Error
          ? error
          : new Error('Failed to get login history')
      );
    }
  }

  /**
   * Anonymize old audit logs for data retention compliance
   * Should be run as a scheduled job
   * @param olderThan - Date threshold - anonymize logs older than this date
   * @returns Result with count of anonymized logs or error
   */
  async anonymizeOldLogs(olderThan: Date): Promise<Result<number, Error>> {
    try {
      const result = await this.repository.anonymize(olderThan);

      if (!isOk(result)) {
        return Err(new Error(result.error.message));
      }

      this.logger.info(
        { count: result.value, olderThan },
        'Anonymized old audit logs'
      );

      return Ok(result.value);
    } catch (error) {
      return Err(
        error instanceof Error
          ? error
          : new Error('Failed to anonymize old logs')
      );
    }
  }

  /**
   * Delete very old audit logs for data retention compliance
   * Should be run as a scheduled job
   * @param olderThan - Date threshold - delete logs older than this date
   * @returns Result with count of deleted logs or error
   */
  async deleteOldLogs(olderThan: Date): Promise<Result<number, Error>> {
    try {
      const result = await this.repository.delete(olderThan);

      if (!isOk(result)) {
        return Err(new Error(result.error.message));
      }

      this.logger.info(
        { count: result.value, olderThan },
        'Deleted old audit logs'
      );

      return Ok(result.value);
    } catch (error) {
      return Err(
        error instanceof Error
          ? error
          : new Error('Failed to delete old logs')
      );
    }
  }

  /**
   * Run data retention cleanup
   * Anonymizes logs older than 1 year, deletes logs older than 3 years
   * Should be run as a scheduled job (e.g., daily)
   */
  async runRetentionCleanup(): Promise<void> {
    try {
      const now = new Date();

      // Anonymize logs older than 1 year
      const oneYearAgo = new Date(now);
      oneYearAgo.setFullYear(now.getFullYear() - 1);

      const anonymizeResult = await this.anonymizeOldLogs(oneYearAgo);
      if (!isOk(anonymizeResult)) {
        this.logger.error(
          { error: anonymizeResult.error.message },
          'Failed to anonymize old audit logs'
        );
      }

      // Delete logs older than 3 years
      const threeYearsAgo = new Date(now);
      threeYearsAgo.setFullYear(now.getFullYear() - 3);

      const deleteResult = await this.deleteOldLogs(threeYearsAgo);
      if (!isOk(deleteResult)) {
        this.logger.error(
          { error: deleteResult.error.message },
          'Failed to delete old audit logs'
        );
      }
    } catch (error) {
      this.logger.error(
        { error: error instanceof Error ? error.message : String(error) },
        'Unexpected error in retention cleanup'
      );
    }
  }
}
