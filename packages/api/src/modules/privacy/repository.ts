/**
 * Data access layer for Privacy/GDPR module.
 * Handles all database operations related to data exports, deletion, and consent.
 */

import { PrismaClient } from '@prisma/client';
import { Result, Ok, Err, NotFoundError, InternalError } from '@multiverse-bazaar/shared';
import {
  DataExportRequest,
  DataExportStatus,
  DeletionRequest,
  DeletionOptions,
  ConsentRecord,
  ConsentType,
  UserDataExport,
} from './types.js';

/**
 * Repository for privacy-related database operations
 */
export class PrivacyRepository {
  constructor(private readonly db: PrismaClient) {}

  /**
   * Create a data export request
   * @param userId - User ID requesting export
   * @returns Result with created export request or error
   */
  async createDataExportRequest(
    userId: string
  ): Promise<Result<DataExportRequest, InternalError>> {
    try {
      const request = await this.db.dataRequest.create({
        data: {
          userId,
          requestType: 'EXPORT',
          status: 'PENDING',
        },
      });

      return Ok({
        id: request.id,
        userId: request.userId,
        status: request.status as DataExportStatus,
        requestedAt: request.requestedAt,
        completedAt: request.completedAt ?? undefined,
        downloadUrl: (request.metadata as { downloadUrl?: string })?.downloadUrl,
      });
    } catch (error) {
      return Err(
        new InternalError('Failed to create data export request', {
          userId,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Find a data export request by ID
   * @param requestId - Export request ID
   * @returns Result with export request or NotFoundError
   */
  async findDataExportRequest(
    requestId: string
  ): Promise<Result<DataExportRequest, NotFoundError | InternalError>> {
    try {
      const request = await this.db.dataRequest.findUnique({
        where: { id: requestId },
      });

      if (!request || request.requestType !== 'EXPORT') {
        return Err(new NotFoundError('Data export request'));
      }

      return Ok({
        id: request.id,
        userId: request.userId,
        status: request.status as DataExportStatus,
        requestedAt: request.requestedAt,
        completedAt: request.completedAt ?? undefined,
        downloadUrl: (request.metadata as { downloadUrl?: string })?.downloadUrl,
      });
    } catch (error) {
      return Err(
        new InternalError('Failed to find data export request', {
          requestId,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Update a data export request
   * @param requestId - Export request ID
   * @param data - Update data
   * @returns Result with updated request or error
   */
  async updateDataExportRequest(
    requestId: string,
    data: {
      status?: DataExportStatus;
      completedAt?: Date;
      downloadUrl?: string;
    }
  ): Promise<Result<DataExportRequest, InternalError>> {
    try {
      const updateData: any = {};
      if (data.status) {
        updateData.status = data.status;
      }
      if (data.completedAt) {
        updateData.completedAt = data.completedAt;
      }
      if (data.downloadUrl) {
        updateData.metadata = { downloadUrl: data.downloadUrl };
      }

      const request = await this.db.dataRequest.update({
        where: { id: requestId },
        data: updateData,
      });

      return Ok({
        id: request.id,
        userId: request.userId,
        status: request.status as DataExportStatus,
        requestedAt: request.requestedAt,
        completedAt: request.completedAt ?? undefined,
        downloadUrl: (request.metadata as { downloadUrl?: string })?.downloadUrl,
      });
    } catch (error) {
      return Err(
        new InternalError('Failed to update data export request', {
          requestId,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Create a deletion request with 30-day grace period
   * @param userId - User ID requesting deletion
   * @param options - Deletion options
   * @returns Result with created deletion request or error
   */
  async createDeletionRequest(
    userId: string,
    options: DeletionOptions
  ): Promise<Result<DeletionRequest, InternalError>> {
    try {
      // Check if there's already a pending deletion request
      const existing = await this.db.dataRequest.findFirst({
        where: {
          userId,
          requestType: 'DELETION',
          status: 'PENDING',
        },
      });

      if (existing) {
        // Return the existing request
        const scheduledFor = new Date(
          existing.requestedAt.getTime() + 30 * 24 * 60 * 60 * 1000
        );

        return Ok({
          id: existing.id,
          userId: existing.userId,
          status: 'PENDING',
          requestedAt: existing.requestedAt,
          scheduledFor,
          completedAt: existing.completedAt ?? undefined,
          options: (existing.options as unknown as DeletionOptions) ?? options,
        });
      }

      // Create new deletion request
      const scheduledFor = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      const request = await this.db.dataRequest.create({
        data: {
          userId,
          requestType: 'DELETION',
          status: 'PENDING',
          options: options as any,
        },
      });

      // Update user record to mark deletion request
      await this.db.user.update({
        where: { id: userId },
        data: { deletionRequestedAt: request.requestedAt },
      });

      return Ok({
        id: request.id,
        userId: request.userId,
        status: 'PENDING',
        requestedAt: request.requestedAt,
        scheduledFor,
        completedAt: request.completedAt ?? undefined,
        options,
      });
    } catch (error) {
      return Err(
        new InternalError('Failed to create deletion request', {
          userId,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Find active deletion request for a user
   * @param userId - User ID
   * @returns Result with deletion request or NotFoundError
   */
  async findDeletionRequest(
    userId: string
  ): Promise<Result<DeletionRequest, NotFoundError | InternalError>> {
    try {
      const request = await this.db.dataRequest.findFirst({
        where: {
          userId,
          requestType: 'DELETION',
          status: 'PENDING',
        },
      });

      if (!request) {
        return Err(new NotFoundError('Deletion request'));
      }

      const scheduledFor = new Date(
        request.requestedAt.getTime() + 30 * 24 * 60 * 60 * 1000
      );

      return Ok({
        id: request.id,
        userId: request.userId,
        status: 'PENDING',
        requestedAt: request.requestedAt,
        scheduledFor,
        completedAt: request.completedAt ?? undefined,
        options: (request.options as unknown as DeletionOptions) ?? {
          anonymizeContributions: true,
        },
      });
    } catch (error) {
      return Err(
        new InternalError('Failed to find deletion request', {
          userId,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Cancel a deletion request during grace period
   * @param userId - User ID
   * @returns Result with void or error
   */
  async cancelDeletionRequest(
    userId: string
  ): Promise<Result<void, NotFoundError | InternalError>> {
    try {
      const request = await this.db.dataRequest.findFirst({
        where: {
          userId,
          requestType: 'DELETION',
          status: 'PENDING',
        },
      });

      if (!request) {
        return Err(new NotFoundError('Deletion request'));
      }

      // Update request status to completed (cancelled)
      await this.db.dataRequest.update({
        where: { id: request.id },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });

      // Clear deletion request timestamp on user
      await this.db.user.update({
        where: { id: userId },
        data: { deletionRequestedAt: null },
      });

      return Ok(undefined);
    } catch (error) {
      return Err(
        new InternalError('Failed to cancel deletion request', {
          userId,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Record user consent
   * @param userId - User ID
   * @param consentType - Type of consent
   * @param granted - Whether consent was granted
   * @param context - Additional context (IP, user agent)
   * @returns Result with consent record or error
   */
  async recordConsent(
    userId: string,
    consentType: ConsentType,
    granted: boolean,
    context?: { ipAddress?: string; userAgent?: string }
  ): Promise<Result<ConsentRecord, InternalError>> {
    try {
      const record = await this.db.consentRecord.create({
        data: {
          userId,
          consentType,
          granted,
          grantedAt: granted ? new Date() : null,
          revokedAt: !granted ? new Date() : null,
          ipAddress: context?.ipAddress,
          userAgent: context?.userAgent,
        },
      });

      return Ok({
        id: record.id,
        userId: record.userId,
        consentType: record.consentType as ConsentType,
        granted: record.granted,
        timestamp: record.grantedAt ?? record.revokedAt ?? new Date(),
        ipAddress: record.ipAddress ?? undefined,
        userAgent: record.userAgent ?? undefined,
      });
    } catch (error) {
      return Err(
        new InternalError('Failed to record consent', {
          userId,
          consentType,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Get all consent records for a user
   * @param userId - User ID
   * @returns Result with consent records or error
   */
  async getConsentRecords(
    userId: string
  ): Promise<Result<ConsentRecord[], InternalError>> {
    try {
      const records = await this.db.consentRecord.findMany({
        where: { userId },
        orderBy: { grantedAt: 'desc' },
      });

      const consentRecords: ConsentRecord[] = records.map((record) => ({
        id: record.id,
        userId: record.userId,
        consentType: record.consentType as ConsentType,
        granted: record.granted,
        timestamp: record.grantedAt ?? record.revokedAt ?? new Date(),
        ipAddress: record.ipAddress ?? undefined,
        userAgent: record.userAgent ?? undefined,
      }));

      return Ok(consentRecords);
    } catch (error) {
      return Err(
        new InternalError('Failed to get consent records', {
          userId,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Get users scheduled for deletion (grace period expired)
   * @param before - Check for users with deletion scheduled before this date
   * @returns Result with user IDs or error
   */
  async getUsersScheduledForDeletion(
    before: Date
  ): Promise<Result<string[], InternalError>> {
    try {
      const requests = await this.db.dataRequest.findMany({
        where: {
          requestType: 'DELETION',
          status: 'PENDING',
          requestedAt: {
            lte: new Date(before.getTime() - 30 * 24 * 60 * 60 * 1000),
          },
        },
        select: { userId: true },
      });

      return Ok(requests.map((r) => r.userId));
    } catch (error) {
      return Err(
        new InternalError('Failed to get users scheduled for deletion', {
          before: before.toISOString(),
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Collect all user data for export
   * @param userId - User ID
   * @returns Result with user data export or error
   */
  async collectUserData(
    userId: string
  ): Promise<Result<UserDataExport, NotFoundError | InternalError>> {
    try {
      // Get user profile
      const user = await this.db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          bio: true,
          avatarUrl: true,
          karma: true,
          showEmailOnProfile: true,
          includeInSearch: true,
          showActivityPublicly: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        return Err(new NotFoundError('User'));
      }

      // Get projects (as creator or collaborator)
      const collaborations = await this.db.collaborator.findMany({
        where: { userId },
        include: {
          project: {
            select: {
              id: true,
              title: true,
              description: true,
              url: true,
              repoUrl: true,
              imageUrl: true,
              status: true,
              createdAt: true,
            },
          },
        },
      });

      const projects = collaborations.map((collab) => ({
        id: collab.project.id,
        title: collab.project.title,
        description: collab.project.description,
        url: collab.project.url,
        repoUrl: collab.project.repoUrl,
        imageUrl: collab.project.imageUrl,
        status: collab.project.status,
        role: collab.role,
        createdAt: collab.project.createdAt,
      }));

      // Get ideas
      const ideas = await this.db.idea.findMany({
        where: { creatorId: userId },
        select: {
          id: true,
          title: true,
          description: true,
          lookingFor: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Get upvotes
      const upvotesData = await this.db.upvote.findMany({
        where: { userId },
        include: {
          project: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      const upvotes = upvotesData.map((upvote) => ({
        projectId: upvote.project.id,
        projectTitle: upvote.project.title,
        createdAt: upvote.createdAt,
      }));

      // Get collaborations (separate from projects for clarity)
      const collaborationsList = collaborations.map((collab) => ({
        projectId: collab.project.id,
        projectTitle: collab.project.title,
        role: collab.role,
        createdAt: collab.createdAt,
      }));

      // Get consent records
      const consentRecords = await this.db.consentRecord.findMany({
        where: { userId },
        select: {
          consentType: true,
          granted: true,
          grantedAt: true,
          revokedAt: true,
        },
      });

      const consents = consentRecords.map((record) => ({
        consentType: record.consentType,
        granted: record.granted,
        timestamp: record.grantedAt ?? record.revokedAt ?? new Date(),
      }));

      // Get login history
      const loginAttempts = await this.db.loginAttempt.findMany({
        where: { userId },
        select: {
          success: true,
          ip: true,
          userAgent: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 100, // Limit to last 100 login attempts
      });

      const loginHistory = loginAttempts.map((attempt) => ({
        success: attempt.success,
        ip: attempt.ip,
        userAgent: attempt.userAgent ?? undefined,
        createdAt: attempt.createdAt,
      }));

      // Construct export data
      const exportData: UserDataExport = {
        exportedAt: new Date(),
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          bio: user.bio,
          avatarUrl: user.avatarUrl,
          karma: user.karma,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        privacySettings: {
          showEmailOnProfile: user.showEmailOnProfile,
          includeInSearch: user.includeInSearch,
          showActivityPublicly: user.showActivityPublicly,
        },
        projects,
        ideas,
        upvotes,
        collaborations: collaborationsList,
        consentRecords: consents,
        loginHistory,
      };

      return Ok(exportData);
    } catch (error) {
      return Err(
        new InternalError('Failed to collect user data', {
          userId,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Anonymize a user's account
   * Keeps content but removes personal information
   * @param userId - User ID to anonymize
   * @returns Result with void or error
   */
  async anonymizeUser(userId: string): Promise<Result<void, InternalError>> {
    try {
      await this.db.user.update({
        where: { id: userId },
        data: {
          name: '[Deleted User]',
          bio: null,
          avatarUrl: null,
          anonymizedAt: new Date(),
        },
      });

      return Ok(undefined);
    } catch (error) {
      return Err(
        new InternalError('Failed to anonymize user', {
          userId,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Fully delete a user and all their data
   * @param userId - User ID to delete
   * @returns Result with void or error
   */
  async deleteUser(userId: string): Promise<Result<void, InternalError>> {
    try {
      // Prisma will handle cascading deletes based on schema
      await this.db.user.update({
        where: { id: userId },
        data: { deletedAt: new Date() },
      });

      return Ok(undefined);
    } catch (error) {
      return Err(
        new InternalError('Failed to delete user', {
          userId,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Mark deletion request as completed
   * @param requestId - Deletion request ID
   * @returns Result with void or error
   */
  async completeDeletionRequest(
    requestId: string
  ): Promise<Result<void, InternalError>> {
    try {
      await this.db.dataRequest.update({
        where: { id: requestId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      return Ok(undefined);
    } catch (error) {
      return Err(
        new InternalError('Failed to complete deletion request', {
          requestId,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }
}
