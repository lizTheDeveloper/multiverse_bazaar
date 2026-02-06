/**
 * Business logic for file uploads.
 * Handles upload processing, validation, security checks, and file serving.
 */

import {
  Result,
  Ok,
  Err,
  ValidationError,
  NotFoundError,
  ForbiddenError,
  InternalError,
  isOk,
} from '@multiverse-bazaar/shared';
import { UploadRepository } from './repository.js';
import {
  UploadedFile,
  UploadResult,
  AllowedMimeTypes,
  MAX_FILE_SIZE,
  ALLOWED_MIME_TYPES,
  FILE_SIZE_LIMITS,
} from './types.js';
import {
  validateMimeType,
  generateSecureFilename,
  stripExifMetadata,
  validateFileSize,
  sanitizeOriginalFilename,
} from './utils.js';

/**
 * Service for handling file uploads
 */
export class UploadService {
  constructor(
    private readonly repository: UploadRepository,
    private readonly baseUrl: string = 'http://localhost:3000'
  ) {}

  /**
   * Initializes the upload service
   * Sets up the upload directory
   */
  async initialize(): Promise<Result<void, InternalError>> {
    return this.repository.initialize();
  }

  /**
   * Uploads a file with security validations
   *
   * Security measures:
   * 1. File size validation (reject if > 5MB before processing)
   * 2. MIME type validation using magic bytes (not extension)
   * 3. Generate secure UUID filename (discard original name)
   * 4. Strip EXIF metadata for privacy
   * 5. Save to upload directory outside web root
   *
   * @param userId - ID of the user uploading the file
   * @param file - File buffer
   * @param originalName - Original filename (sanitized before storage)
   * @returns Result with upload result or validation/internal error
   */
  async upload(
    userId: string,
    file: Buffer,
    originalName: string
  ): Promise<Result<UploadResult, ValidationError | InternalError>> {
    // 1. Validate file size FIRST (before any processing)
    if (!validateFileSize(file.length, MAX_FILE_SIZE)) {
      return Err(
        new ValidationError(
          `File size must be between ${FILE_SIZE_LIMITS.MIN_SIZE} bytes and ${MAX_FILE_SIZE} bytes (${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB)`,
          [
            {
              field: 'file',
              message: `File size ${file.length} bytes exceeds maximum of ${MAX_FILE_SIZE} bytes`,
            },
          ],
          { size: file.length, maxSize: MAX_FILE_SIZE }
        )
      );
    }

    // 2. Validate MIME type using magic bytes (not extension)
    const detectedMimeType = validateMimeType(file);
    if (!detectedMimeType) {
      return Err(
        new ValidationError(
          'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.',
          [
            {
              field: 'file',
              message: 'File type could not be determined or is not supported',
            },
          ],
          {
            allowedTypes: Array.from(ALLOWED_MIME_TYPES),
          }
        )
      );
    }

    // Double-check that the detected type is in our allowed list
    if (!ALLOWED_MIME_TYPES.has(detectedMimeType)) {
      return Err(
        new ValidationError(
          'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.',
          [
            {
              field: 'file',
              message: `Detected file type ${detectedMimeType} is not in the allowed list`,
            },
          ],
          {
            detectedType: detectedMimeType,
            allowedTypes: Array.from(ALLOWED_MIME_TYPES),
          }
        )
      );
    }

    // 3. Generate secure UUID-based filename
    const secureFilename = generateSecureFilename(detectedMimeType);

    // 4. Strip EXIF metadata for privacy and security
    let processedFile: Buffer;
    try {
      processedFile = await stripExifMetadata(file);
    } catch (error) {
      return Err(
        new InternalError('Failed to process image', {
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }

    // 5. Sanitize original filename for safe storage
    const sanitizedOriginalName = sanitizeOriginalFilename(originalName);

    // 6. Save file to disk and database
    const saveResult = await this.repository.save(processedFile, {
      filename: secureFilename,
      originalName: sanitizedOriginalName,
      mimeType: detectedMimeType,
      size: processedFile.length,
      uploadedBy: userId,
    });

    if (!isOk(saveResult)) {
      return Err(saveResult.error);
    }

    const upload = saveResult.value;

    // 7. Return upload result with URL
    return Ok({
      url: `${this.baseUrl}/api/uploads/${upload.id}`,
      filename: upload.filename,
      mimeType: upload.mimeType,
      size: upload.size,
    });
  }

  /**
   * Gets a file for serving
   *
   * @param fileId - Upload ID
   * @returns Result with file buffer and metadata or error
   */
  async getFile(
    fileId: string
  ): Promise<Result<{ file: Buffer; metadata: UploadedFile }, NotFoundError | InternalError>> {
    // Get file metadata from database
    const metadataResult = await this.repository.findById(fileId);
    if (!isOk(metadataResult)) {
      return Err(metadataResult.error);
    }

    const metadata = metadataResult.value;

    // Read file from disk
    const fileResult = await this.repository.readFile(metadata.path);
    if (!isOk(fileResult)) {
      return Err(fileResult.error);
    }

    return Ok({
      file: fileResult.value,
      metadata,
    });
  }

  /**
   * Deletes a file
   * Only the owner of the file can delete it
   *
   * @param userId - ID of the user requesting deletion
   * @param fileId - Upload ID
   * @returns Result indicating success or error
   */
  async deleteFile(
    userId: string,
    fileId: string
  ): Promise<Result<void, NotFoundError | ForbiddenError | InternalError>> {
    // Get file metadata to check ownership
    const metadataResult = await this.repository.findById(fileId);
    if (!isOk(metadataResult)) {
      return Err(metadataResult.error);
    }

    const metadata = metadataResult.value;

    // Check if user is the owner
    if (metadata.uploadedBy !== userId) {
      return Err(
        new ForbiddenError('You do not have permission to delete this file', {
          fileId,
          userId,
          ownerId: metadata.uploadedBy,
        })
      );
    }

    // Delete the file
    return this.repository.delete(fileId);
  }

  /**
   * Gets all uploads by a user
   *
   * @param userId - User ID
   * @returns Result with array of upload results or error
   */
  async getUserUploads(userId: string): Promise<Result<UploadResult[], InternalError>> {
    const uploadsResult = await this.repository.findByUser(userId);
    if (!isOk(uploadsResult)) {
      return Err(uploadsResult.error);
    }

    const uploads = uploadsResult.value;

    return Ok(
      uploads.map((upload) => ({
        url: `${this.baseUrl}/api/uploads/${upload.id}`,
        filename: upload.filename,
        mimeType: upload.mimeType,
        size: upload.size,
      }))
    );
  }

  /**
   * Cleans up orphaned files older than the specified date
   *
   * @param olderThan - Delete files older than this date
   * @returns Result with count of deleted files or error
   */
  async cleanupOrphanedFiles(olderThan: Date): Promise<Result<number, InternalError>> {
    return this.repository.deleteOrphaned(olderThan);
  }
}
