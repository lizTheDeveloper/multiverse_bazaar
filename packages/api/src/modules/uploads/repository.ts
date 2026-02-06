/**
 * Data access layer for Uploads module.
 * Handles all database operations related to file uploads.
 */

import { PrismaClient } from '@prisma/client';
import { Result, Ok, Err, NotFoundError, InternalError } from '@multiverse-bazaar/shared';
import { UploadedFile, AllowedMimeTypes } from './types.js';
import { promises as fs } from 'fs';
import { join } from 'path';

/**
 * Metadata for saving a file
 */
export interface SaveFileMetadata {
  filename: string;
  originalName: string;
  mimeType: AllowedMimeTypes;
  size: number;
  uploadedBy: string;
}

/**
 * Repository for upload-related database operations
 */
export class UploadRepository {
  private readonly uploadDir: string;

  constructor(
    private readonly db: PrismaClient,
    uploadDir?: string
  ) {
    // Default to uploads directory outside the public web root
    this.uploadDir = uploadDir || join(process.cwd(), 'uploads');
  }

  /**
   * Initializes the upload directory
   * Creates the directory if it doesn't exist
   *
   * @returns Result indicating success or error
   */
  async initialize(): Promise<Result<void, InternalError>> {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
      return Ok(undefined);
    } catch (error) {
      return Err(
        new InternalError('Failed to initialize upload directory', {
          uploadDir: this.uploadDir,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Saves a file to disk and records metadata in database
   *
   * @param file - File buffer to save
   * @param metadata - File metadata
   * @returns Result with uploaded file record or error
   */
  async save(
    file: Buffer,
    metadata: SaveFileMetadata
  ): Promise<Result<UploadedFile, InternalError>> {
    const filePath = join(this.uploadDir, metadata.filename);

    try {
      // Write file to disk
      await fs.writeFile(filePath, file);

      // Save metadata to database
      const upload = await this.db.upload.create({
        data: {
          filename: metadata.filename,
          originalName: metadata.originalName,
          mimeType: metadata.mimeType,
          size: metadata.size,
          path: filePath,
          uploadedBy: metadata.uploadedBy,
        },
      });

      return Ok({
        id: upload.id,
        filename: upload.filename,
        originalName: upload.originalName,
        mimeType: upload.mimeType as AllowedMimeTypes,
        size: upload.size,
        path: upload.path,
        uploadedBy: upload.uploadedBy,
        createdAt: upload.createdAt,
      });
    } catch (error) {
      // Try to clean up the file if database operation failed
      try {
        await fs.unlink(filePath);
      } catch {
        // Ignore cleanup errors
      }

      return Err(
        new InternalError('Failed to save file', {
          filename: metadata.filename,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Finds a file by its ID
   *
   * @param id - Upload ID
   * @returns Result with uploaded file or error
   */
  async findById(id: string): Promise<Result<UploadedFile, NotFoundError | InternalError>> {
    try {
      const upload = await this.db.upload.findUnique({
        where: { id },
      });

      if (!upload) {
        return Err(new NotFoundError('Upload'));
      }

      return Ok({
        id: upload.id,
        filename: upload.filename,
        originalName: upload.originalName,
        mimeType: upload.mimeType as AllowedMimeTypes,
        size: upload.size,
        path: upload.path,
        uploadedBy: upload.uploadedBy,
        createdAt: upload.createdAt,
      });
    } catch (error) {
      return Err(
        new InternalError('Failed to find upload by ID', {
          id,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Finds a file by its filename
   *
   * @param filename - Filename
   * @returns Result with uploaded file or error
   */
  async findByFilename(
    filename: string
  ): Promise<Result<UploadedFile, NotFoundError | InternalError>> {
    try {
      const upload = await this.db.upload.findUnique({
        where: { filename },
      });

      if (!upload) {
        return Err(new NotFoundError('Upload'));
      }

      return Ok({
        id: upload.id,
        filename: upload.filename,
        originalName: upload.originalName,
        mimeType: upload.mimeType as AllowedMimeTypes,
        size: upload.size,
        path: upload.path,
        uploadedBy: upload.uploadedBy,
        createdAt: upload.createdAt,
      });
    } catch (error) {
      return Err(
        new InternalError('Failed to find upload by filename', {
          filename,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Finds a file by its path
   *
   * @param path - File path
   * @returns Result with uploaded file or error
   */
  async findByPath(path: string): Promise<Result<UploadedFile, NotFoundError | InternalError>> {
    try {
      const upload = await this.db.upload.findFirst({
        where: { path },
      });

      if (!upload) {
        return Err(new NotFoundError('Upload'));
      }

      return Ok({
        id: upload.id,
        filename: upload.filename,
        originalName: upload.originalName,
        mimeType: upload.mimeType as AllowedMimeTypes,
        size: upload.size,
        path: upload.path,
        uploadedBy: upload.uploadedBy,
        createdAt: upload.createdAt,
      });
    } catch (error) {
      return Err(
        new InternalError('Failed to find upload by path', {
          path,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Deletes a file from disk and database
   *
   * @param id - Upload ID
   * @returns Result indicating success or error
   */
  async delete(id: string): Promise<Result<void, NotFoundError | InternalError>> {
    try {
      // Get the upload record first
      const upload = await this.db.upload.findUnique({
        where: { id },
      });

      if (!upload) {
        return Err(new NotFoundError('Upload'));
      }

      // Delete from database first
      await this.db.upload.delete({
        where: { id },
      });

      // Then delete the file from disk
      try {
        await fs.unlink(upload.path);
      } catch (error) {
        // Log but don't fail if file doesn't exist on disk
        console.warn(`Failed to delete file from disk: ${upload.path}`, error);
      }

      return Ok(undefined);
    } catch (error) {
      // Check if it's a "record not found" error
      if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
        return Err(new NotFoundError('Upload'));
      }

      return Err(
        new InternalError('Failed to delete upload', {
          id,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Deletes orphaned files that are older than the specified date
   * Orphaned files are those that exist on disk but have no database record
   * or database records that have no corresponding file on disk
   *
   * @param olderThan - Delete files older than this date
   * @returns Result with count of deleted files or error
   */
  async deleteOrphaned(olderThan: Date): Promise<Result<number, InternalError>> {
    try {
      // Delete database records for files that are old and might be orphaned
      const result = await this.db.upload.deleteMany({
        where: {
          createdAt: {
            lt: olderThan,
          },
        },
      });

      // TODO: Implement cleanup of files on disk that have no database record
      // This would require:
      // 1. Reading all files in the upload directory
      // 2. Checking each file against the database
      // 3. Deleting files that have no corresponding record
      // This is a more complex operation and should be done in a background job

      return Ok(result.count);
    } catch (error) {
      return Err(
        new InternalError('Failed to delete orphaned uploads', {
          olderThan: olderThan.toISOString(),
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Reads a file from disk
   *
   * @param path - File path
   * @returns Result with file buffer or error
   */
  async readFile(path: string): Promise<Result<Buffer, InternalError>> {
    try {
      const buffer = await fs.readFile(path);
      return Ok(buffer);
    } catch (error) {
      return Err(
        new InternalError('Failed to read file', {
          path,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Gets all uploads by a user
   *
   * @param userId - User ID
   * @returns Result with array of uploads or error
   */
  async findByUser(userId: string): Promise<Result<UploadedFile[], InternalError>> {
    try {
      const uploads = await this.db.upload.findMany({
        where: { uploadedBy: userId },
        orderBy: { createdAt: 'desc' },
      });

      return Ok(
        uploads.map((upload) => ({
          id: upload.id,
          filename: upload.filename,
          originalName: upload.originalName,
          mimeType: upload.mimeType as AllowedMimeTypes,
          size: upload.size,
          path: upload.path,
          uploadedBy: upload.uploadedBy,
          createdAt: upload.createdAt,
        }))
      );
    } catch (error) {
      return Err(
        new InternalError('Failed to find uploads by user', {
          userId,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }
}
