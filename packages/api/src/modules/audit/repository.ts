/**
 * Data access layer for Audit module.
 * Handles all database operations related to audit logs and login history.
 */

import { PrismaClient } from '@prisma/client';
import { Result, Ok, Err, InternalError } from '@multiverse-bazaar/shared';
import {
  AuditLog,
  CreateAuditLogRequest,
  AuditContext,
  AuditLogQuery,
  AuditLogResult,
  LoginHistory,
} from './types.js';
import crypto from 'crypto';

/**
 * Repository for audit log database operations
 */
export class AuditRepository {
  constructor(private readonly db: PrismaClient) {}

  /**
   * Create a new audit log entry
   * @param data - Audit log data
   * @param context - Request context (IP address, user agent)
   * @returns Result with created audit log or error
   */
  async create(
    data: CreateAuditLogRequest,
    context?: AuditContext
  ): Promise<Result<AuditLog, InternalError>> {
    try {
      const auditLog = await this.db.auditLog.create({
        data: {
          userId: data.userId || null,
          action: data.action,
          resourceType: data.resourceType,
          resourceId: data.resourceId || null,
          ipAddress: context?.ipAddress || null,
          userAgent: context?.userAgent || null,
          metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : null,
        },
      });

      return Ok({
        id: auditLog.id,
        userId: auditLog.userId,
        action: auditLog.action as any,
        resourceType: auditLog.resourceType,
        resourceId: auditLog.resourceId,
        ipAddress: auditLog.ipAddress,
        userAgent: auditLog.userAgent,
        metadata: auditLog.metadata as Record<string, any> | null,
        createdAt: auditLog.createdAt,
      });
    } catch (error) {
      return Err(
        new InternalError('Failed to create audit log', {
          action: data.action,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Find audit logs for a specific user
   * @param userId - User ID
   * @param query - Optional query filters
   * @returns Result with paginated audit logs or error
   */
  async findByUserId(
    userId: string,
    query?: Omit<AuditLogQuery, 'userId'>
  ): Promise<Result<AuditLogResult, InternalError>> {
    return this.query({ ...query, userId });
  }

  /**
   * Find audit logs for a specific resource
   * @param resourceType - Type of resource
   * @param resourceId - Resource ID
   * @returns Result with audit logs or error
   */
  async findByResource(
    resourceType: string,
    resourceId: string
  ): Promise<Result<AuditLog[], InternalError>> {
    try {
      const logs = await this.db.auditLog.findMany({
        where: {
          resourceType,
          resourceId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return Ok(
        logs.map((log) => ({
          id: log.id,
          userId: log.userId,
          action: log.action as any,
          resourceType: log.resourceType,
          resourceId: log.resourceId,
          ipAddress: log.ipAddress,
          userAgent: log.userAgent,
          metadata: log.metadata as Record<string, any> | null,
          createdAt: log.createdAt,
        }))
      );
    } catch (error) {
      return Err(
        new InternalError('Failed to find audit logs by resource', {
          resourceType,
          resourceId,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Query audit logs with filters and pagination
   * @param query - Query parameters
   * @returns Result with paginated audit logs or error
   */
  async query(query: AuditLogQuery): Promise<Result<AuditLogResult, InternalError>> {
    try {
      const page = query.page || 1;
      const limit = query.limit || 50;
      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {};

      if (query.userId) {
        where.userId = query.userId;
      }

      if (query.action) {
        where.action = query.action;
      }

      if (query.resourceType) {
        where.resourceType = query.resourceType;
      }

      if (query.startDate || query.endDate) {
        where.createdAt = {};
        if (query.startDate) {
          where.createdAt.gte = query.startDate;
        }
        if (query.endDate) {
          where.createdAt.lte = query.endDate;
        }
      }

      // Get total count for pagination
      const total = await this.db.auditLog.count({ where });

      // Get paginated results
      const logs = await this.db.auditLog.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      });

      const totalPages = Math.ceil(total / limit);

      return Ok({
        logs: logs.map((log) => ({
          id: log.id,
          userId: log.userId,
          action: log.action as any,
          resourceType: log.resourceType,
          resourceId: log.resourceId,
          ipAddress: log.ipAddress,
          userAgent: log.userAgent,
          metadata: log.metadata as Record<string, any> | null,
          createdAt: log.createdAt,
        })),
        total,
        page,
        limit,
        totalPages,
      });
    } catch (error) {
      return Err(
        new InternalError('Failed to query audit logs', {
          query,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Anonymize old audit logs (remove userId, hash IP)
   * This is part of data retention compliance - keep audit trail but remove PII
   * @param olderThan - Date threshold - anonymize logs older than this date
   * @returns Result with count of anonymized logs or error
   */
  async anonymize(olderThan: Date): Promise<Result<number, InternalError>> {
    try {
      // Find logs that need anonymization
      const logsToAnonymize = await this.db.auditLog.findMany({
        where: {
          createdAt: {
            lt: olderThan,
          },
          OR: [
            { userId: { not: null } },
            { ipAddress: { not: null } },
          ],
        },
        select: {
          id: true,
          ipAddress: true,
        },
      });

      // Anonymize each log
      for (const log of logsToAnonymize) {
        const hashedIp = log.ipAddress
          ? crypto.createHash('sha256').update(log.ipAddress).digest('hex')
          : null;

        await this.db.auditLog.update({
          where: { id: log.id },
          data: {
            userId: null,
            ipAddress: hashedIp,
          },
        });
      }

      return Ok(logsToAnonymize.length);
    } catch (error) {
      return Err(
        new InternalError('Failed to anonymize audit logs', {
          olderThan,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Delete very old audit logs
   * This is the final step in data retention - completely remove old logs
   * @param olderThan - Date threshold - delete logs older than this date
   * @returns Result with count of deleted logs or error
   */
  async delete(olderThan: Date): Promise<Result<number, InternalError>> {
    try {
      const result = await this.db.auditLog.deleteMany({
        where: {
          createdAt: {
            lt: olderThan,
          },
        },
      });

      return Ok(result.count);
    } catch (error) {
      return Err(
        new InternalError('Failed to delete old audit logs', {
          olderThan,
          error: error instanceof Error ? error.message : String(error),
        })
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
    limit: number = 50
  ): Promise<Result<LoginHistory[], InternalError>> {
    try {
      const loginAttempts = await this.db.loginAttempt.findMany({
        where: {
          userId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
      });

      return Ok(
        loginAttempts.map((attempt) => ({
          id: attempt.id,
          email: attempt.email,
          success: attempt.success,
          ip: attempt.ip,
          userAgent: attempt.userAgent,
          createdAt: attempt.createdAt,
        }))
      );
    } catch (error) {
      return Err(
        new InternalError('Failed to get login history', {
          userId,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }
}
