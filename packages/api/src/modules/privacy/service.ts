/**
 * Business logic layer for Privacy/GDPR module.
 * Handles data exports, account deletion, and consent management.
 */

import {
  Result,
  Ok,
  Err,
  isOk,
  BaseError,
  NotFoundError,
  ConflictError,
  InternalError,
} from '@multiverse-bazaar/shared';
import { PrivacyRepository } from './repository.js';
import {
  DataExportRequest,
  DataExportStatus,
  DeletionRequest,
  DeletionOptions,
  ConsentRecord,
  ConsentType,
  DeletionStatusResponse,
} from './types.js';
import { Logger } from '../../infra/logger.js';

/**
 * Service for privacy and GDPR operations
 * Handles data exports, account deletion, and consent management
 */
export class PrivacyService {
  constructor(
    private readonly repository: PrivacyRepository,
    private readonly logger: Logger
  ) {}

  /**
   * Request a data export for a user
   * Initiates the data collection and export process
   *
   * @param userId - User ID requesting export
   * @returns Result with export request or error
   */
  async requestDataExport(userId: string): Promise<Result<DataExportRequest, BaseError>> {
    try {
      this.logger.info({ userId }, 'User requesting data export');

      // Create the export request
      const requestResult = await this.repository.createDataExportRequest(userId);

      if (!isOk(requestResult)) {
        this.logger.error({ userId }, 'Failed to create data export request');
        return Err(requestResult.error);
      }

      const request = requestResult.value;

      // Immediately collect and prepare data (synchronous for now)
      // In production, this would be done asynchronously via a job queue
      const dataResult = await this.repository.collectUserData(userId);

      if (!isOk(dataResult)) {
        this.logger.error({ userId, requestId: request.id }, 'Failed to collect user data');

        // Update request status to failed (using EXPIRED as error state)
        await this.repository.updateDataExportRequest(request.id, {
          status: DataExportStatus.EXPIRED,
          completedAt: new Date(),
        });

        return Err(dataResult.error);
      }

      // Convert data to JSON and generate download URL
      // In production, this would be stored in S3 or similar
      const exportData = dataResult.value;
      const exportJson = JSON.stringify(exportData, null, 2);

      // For now, we'll use a simple base64 encoded data URL
      // In production, this would be an actual file URL
      const downloadUrl = `data:application/json;base64,${Buffer.from(exportJson).toString('base64')}`;

      // Update request with completion
      const updateResult = await this.repository.updateDataExportRequest(request.id, {
        status: DataExportStatus.COMPLETED,
        completedAt: new Date(),
        downloadUrl,
      });

      if (!isOk(updateResult)) {
        this.logger.error({ userId, requestId: request.id }, 'Failed to update export request');
        return Err(updateResult.error);
      }

      this.logger.info({ userId, requestId: request.id }, 'Data export completed successfully');

      return Ok(updateResult.value);
    } catch (error) {
      this.logger.error({ error, userId }, 'Unexpected error during data export request');
      return Err(
        new InternalError('An unexpected error occurred', {
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Get the status of a data export request
   *
   * @param userId - User ID (for authorization)
   * @param requestId - Export request ID
   * @returns Result with export request status or error
   */
  async getExportStatus(
    userId: string,
    requestId: string
  ): Promise<Result<DataExportRequest, BaseError>> {
    try {
      const requestResult = await this.repository.findDataExportRequest(requestId);

      if (!isOk(requestResult)) {
        this.logger.warn({ userId, requestId }, 'Export request not found');
        return Err(requestResult.error);
      }

      const request = requestResult.value;

      // Verify the request belongs to the user
      if (request.userId !== userId) {
        this.logger.warn(
          { userId, requestId, requestUserId: request.userId },
          'User attempted to access another user\'s export request'
        );
        return Err(new NotFoundError('Export request'));
      }

      return Ok(request);
    } catch (error) {
      this.logger.error({ error, userId, requestId }, 'Unexpected error getting export status');
      return Err(
        new InternalError('An unexpected error occurred', {
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Download a completed data export
   *
   * @param userId - User ID (for authorization)
   * @param requestId - Export request ID
   * @returns Result with download URL or error
   */
  async downloadExport(
    userId: string,
    requestId: string
  ): Promise<Result<string, BaseError>> {
    try {
      const requestResult = await this.repository.findDataExportRequest(requestId);

      if (!isOk(requestResult)) {
        this.logger.warn({ userId, requestId }, 'Export request not found');
        return Err(requestResult.error);
      }

      const request = requestResult.value;

      // Verify the request belongs to the user
      if (request.userId !== userId) {
        this.logger.warn(
          { userId, requestId, requestUserId: request.userId },
          'User attempted to download another user\'s export'
        );
        return Err(new NotFoundError('Export request'));
      }

      // Check if export is completed
      if (request.status !== DataExportStatus.COMPLETED || !request.downloadUrl) {
        this.logger.warn({ userId, requestId, status: request.status }, 'Export not ready');
        return Err(
          new ConflictError('Data export is not yet ready', {
            status: request.status,
          })
        );
      }

      this.logger.info({ userId, requestId }, 'User downloading data export');

      return Ok(request.downloadUrl);
    } catch (error) {
      this.logger.error({ error, userId, requestId }, 'Unexpected error downloading export');
      return Err(
        new InternalError('An unexpected error occurred', {
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Request account deletion with 30-day grace period
   *
   * @param userId - User ID requesting deletion
   * @param options - Deletion options
   * @returns Result with deletion request or error
   */
  async requestAccountDeletion(
    userId: string,
    options: DeletionOptions
  ): Promise<Result<DeletionRequest, BaseError>> {
    try {
      this.logger.info({ userId, options }, 'User requesting account deletion');

      const requestResult = await this.repository.createDeletionRequest(userId, options);

      if (!isOk(requestResult)) {
        this.logger.error({ userId }, 'Failed to create deletion request');
        return Err(requestResult.error);
      }

      const request = requestResult.value;

      this.logger.info(
        { userId, requestId: request.id, scheduledFor: request.scheduledFor },
        'Account deletion scheduled'
      );

      return Ok(request);
    } catch (error) {
      this.logger.error({ error, userId }, 'Unexpected error requesting account deletion');
      return Err(
        new InternalError('An unexpected error occurred', {
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Cancel a pending account deletion during grace period
   *
   * @param userId - User ID
   * @returns Result with void or error
   */
  async cancelDeletion(userId: string): Promise<Result<void, BaseError>> {
    try {
      this.logger.info({ userId }, 'User cancelling account deletion');

      const cancelResult = await this.repository.cancelDeletionRequest(userId);

      if (!isOk(cancelResult)) {
        this.logger.warn({ userId }, 'Failed to cancel deletion request');
        return Err(cancelResult.error);
      }

      this.logger.info({ userId }, 'Account deletion cancelled successfully');

      return Ok(undefined);
    } catch (error) {
      this.logger.error({ error, userId }, 'Unexpected error cancelling deletion');
      return Err(
        new InternalError('An unexpected error occurred', {
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Get the deletion status for a user
   *
   * @param userId - User ID
   * @returns Result with deletion status or error
   */
  async getDeletionStatus(userId: string): Promise<Result<DeletionStatusResponse, BaseError>> {
    try {
      const requestResult = await this.repository.findDeletionRequest(userId);

      if (!isOk(requestResult)) {
        // No pending deletion request
        return Ok({
          hasPendingDeletion: false,
        });
      }

      const request = requestResult.value;
      const now = new Date();
      const daysRemaining = Math.ceil(
        (request.scheduledFor.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      return Ok({
        hasPendingDeletion: true,
        deletionRequest: {
          requestedAt: request.requestedAt,
          scheduledFor: request.scheduledFor,
          daysRemaining: Math.max(0, daysRemaining),
          options: request.options,
        },
      });
    } catch (error) {
      this.logger.error({ error, userId }, 'Unexpected error getting deletion status');
      return Err(
        new InternalError('An unexpected error occurred', {
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Execute user anonymization (internal method)
   * Removes personal information but keeps content
   *
   * @param userId - User ID to anonymize
   * @returns Result with void or error
   */
  async executeAnonymization(userId: string): Promise<Result<void, BaseError>> {
    try {
      this.logger.info({ userId }, 'Executing user anonymization');

      const result = await this.repository.anonymizeUser(userId);

      if (!isOk(result)) {
        this.logger.error({ userId }, 'Failed to anonymize user');
        return Err(result.error);
      }

      this.logger.info({ userId }, 'User anonymized successfully');

      return Ok(undefined);
    } catch (error) {
      this.logger.error({ error, userId }, 'Unexpected error during anonymization');
      return Err(
        new InternalError('An unexpected error occurred', {
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Execute full user deletion (internal method)
   * Deletes all user data
   *
   * @param userId - User ID to delete
   * @returns Result with void or error
   */
  async executeFullDeletion(userId: string): Promise<Result<void, BaseError>> {
    try {
      this.logger.info({ userId }, 'Executing full user deletion');

      const result = await this.repository.deleteUser(userId);

      if (!isOk(result)) {
        this.logger.error({ userId }, 'Failed to delete user');
        return Err(result.error);
      }

      this.logger.info({ userId }, 'User deleted successfully');

      return Ok(undefined);
    } catch (error) {
      this.logger.error({ error, userId }, 'Unexpected error during deletion');
      return Err(
        new InternalError('An unexpected error occurred', {
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Record user consent for GDPR compliance
   *
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
  ): Promise<Result<ConsentRecord, BaseError>> {
    try {
      this.logger.info({ userId, consentType, granted }, 'Recording user consent');

      const result = await this.repository.recordConsent(
        userId,
        consentType,
        granted,
        context
      );

      if (!isOk(result)) {
        this.logger.error({ userId, consentType }, 'Failed to record consent');
        return Err(result.error);
      }

      this.logger.info(
        { userId, consentType, granted, recordId: result.value.id },
        'Consent recorded successfully'
      );

      return Ok(result.value);
    } catch (error) {
      this.logger.error({ error, userId, consentType }, 'Unexpected error recording consent');
      return Err(
        new InternalError('An unexpected error occurred', {
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Get consent status for a user
   * Returns all consent records
   *
   * @param userId - User ID
   * @returns Result with consent records or error
   */
  async getConsentStatus(userId: string): Promise<Result<ConsentRecord[], BaseError>> {
    try {
      const result = await this.repository.getConsentRecords(userId);

      if (!isOk(result)) {
        this.logger.error({ userId }, 'Failed to get consent records');
        return Err(result.error);
      }

      return Ok(result.value);
    } catch (error) {
      this.logger.error({ error, userId }, 'Unexpected error getting consent status');
      return Err(
        new InternalError('An unexpected error occurred', {
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Process scheduled deletions (for automated job)
   * Executes deletions for users past the grace period
   *
   * @returns Result with number of processed deletions or error
   */
  async processScheduledDeletions(): Promise<Result<number, BaseError>> {
    try {
      this.logger.info('Processing scheduled deletions');

      const now = new Date();
      const usersResult = await this.repository.getUsersScheduledForDeletion(now);

      if (!isOk(usersResult)) {
        this.logger.error('Failed to get users scheduled for deletion');
        return Err(usersResult.error);
      }

      const userIds = usersResult.value;
      let processed = 0;

      for (const userId of userIds) {
        // Get deletion request to check options
        const requestResult = await this.repository.findDeletionRequest(userId);

        if (!isOk(requestResult)) {
          this.logger.warn({ userId }, 'Could not find deletion request for scheduled user');
          continue;
        }

        const request = requestResult.value;

        // Execute deletion based on options
        if (request.options.anonymizeContributions) {
          const result = await this.executeAnonymization(userId);
          if (isOk(result)) {
            await this.repository.completeDeletionRequest(request.id);
            processed++;
            this.logger.info({ userId, requestId: request.id }, 'User anonymized');
          }
        } else {
          const result = await this.executeFullDeletion(userId);
          if (isOk(result)) {
            await this.repository.completeDeletionRequest(request.id);
            processed++;
            this.logger.info({ userId, requestId: request.id }, 'User deleted');
          }
        }
      }

      this.logger.info(
        { processed, total: userIds.length },
        'Completed processing scheduled deletions'
      );

      return Ok(processed);
    } catch (error) {
      this.logger.error({ error }, 'Unexpected error processing scheduled deletions');
      return Err(
        new InternalError('An unexpected error occurred', {
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }
}
