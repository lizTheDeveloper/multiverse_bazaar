/**
 * HTTP routes for file uploads.
 * Handles image upload, serving, and deletion endpoints.
 */

import { Hono } from 'hono';
import { isOk } from '@multiverse-bazaar/shared';
import { UploadService } from './service.js';
import { authMiddleware } from '../auth/middleware.js';
import { Logger } from '../../infra/logger.js';
import { AuthService } from '../auth/service.js';
import { MAX_FILE_SIZE } from './types.js';

/**
 * Context variables available in upload routes
 */
interface UploadContext {
  Variables: {
    requestId: string;
    logger: Logger;
    user?: {
      id: string;
      email: string;
      name: string | null;
    };
  };
}

/**
 * Creates upload routes
 *
 * @param uploadService - UploadService instance for handling upload operations
 * @param authService - AuthService instance for authentication
 * @returns Hono app with upload routes configured
 */
export function createUploadRoutes(
  uploadService: UploadService,
  authService: AuthService
): Hono<UploadContext> {
  const router = new Hono<UploadContext>();

  /**
   * POST /uploads/image
   * Upload an image file
   *
   * Request:
   * - Content-Type: multipart/form-data
   * - Body: file (binary data)
   *
   * Response:
   * {
   *   "url": "http://localhost:3000/api/uploads/uuid",
   *   "filename": "uuid.jpg",
   *   "mimeType": "image/jpeg",
   *   "size": 12345
   * }
   *
   * Security:
   * - Requires authentication
   * - 5MB file size limit enforced
   * - MIME type validated via magic bytes
   * - UUID-based filename generated
   * - EXIF metadata stripped
   */
  router.post('/image', authMiddleware(authService), async (c) => {
    const logger = c.get('logger');
    const user = c.get('user');

    if (!user) {
      logger.error('No user in context despite auth middleware');
      return c.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        401
      );
    }

    logger.info({ userId: user.id }, 'Image upload attempt');

    // Parse multipart form data
    // NOTE: Hono's built-in parseBody handles multipart/form-data
    // For more advanced multipart handling, consider using @hono/node-server/conninfo
    // or a dedicated multipart library like busboy or formidable

    let formData: FormData;
    try {
      formData = await c.req.formData();
    } catch (error) {
      logger.warn({ error }, 'Failed to parse multipart form data');
      return c.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid multipart form data',
            details: {
              error: error instanceof Error ? error.message : String(error),
            },
          },
        },
        400
      );
    }

    // Get the file from form data
    const file = formData.get('file');

    if (!file) {
      logger.warn('No file in upload request');
      return c.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'No file provided',
            fieldErrors: [
              {
                field: 'file',
                message: 'File is required',
              },
            ],
          },
        },
        400
      );
    }

    // Ensure file is a File object (not a string)
    if (typeof file === 'string') {
      logger.warn('File field contains string instead of file');
      return c.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid file format',
            fieldErrors: [
              {
                field: 'file',
                message: 'Expected file, got string',
              },
            ],
          },
        },
        400
      );
    }

    // Check file size before reading (early rejection)
    if (file.size > MAX_FILE_SIZE) {
      logger.warn({ size: file.size, maxSize: MAX_FILE_SIZE }, 'File too large');
      return c.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: `File size exceeds maximum of ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB`,
            fieldErrors: [
              {
                field: 'file',
                message: `File size ${file.size} bytes exceeds maximum of ${MAX_FILE_SIZE} bytes`,
              },
            ],
            details: {
              size: file.size,
              maxSize: MAX_FILE_SIZE,
            },
          },
        },
        400
      );
    }

    // Read file into buffer
    let buffer: Buffer;
    try {
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } catch (error) {
      logger.error({ error }, 'Failed to read file buffer');
      return c.json(
        {
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to read file',
            details: {
              error: error instanceof Error ? error.message : String(error),
            },
          },
        },
        500
      );
    }

    // Upload the file
    const result = await uploadService.upload(user.id, buffer, file.name);

    if (!isOk(result)) {
      const error = result.error;
      logger.warn({ error: error.message }, 'Upload failed');

      const statusCode = error.statusCode as 400 | 401 | 403 | 404 | 429 | 500;

      return c.json(
        {
          error: {
            code: error.code,
            message: error.message,
            ...(error.details && { details: error.details }),
            ...('fieldErrors' in error && error.fieldErrors && { fieldErrors: error.fieldErrors }),
          },
        },
        statusCode
      );
    }

    const uploadResult = result.value;

    logger.info({ userId: user.id, filename: uploadResult.filename }, 'Upload successful');

    return c.json(uploadResult, 201);
  });

  /**
   * GET /uploads/:id
   * Serve an uploaded file
   *
   * Response:
   * - Binary file data with appropriate Content-Type header
   *
   * Security:
   * - Public endpoint (no auth required)
   * - Files are served by UUID, which is non-guessable
   * - Original filenames are not exposed in URL
   */
  router.get('/:id', async (c) => {
    const logger = c.get('logger');
    const fileId = c.req.param('id');

    logger.info({ fileId }, 'File serve request');

    // Get the file
    const result = await uploadService.getFile(fileId);

    if (!isOk(result)) {
      const error = result.error;
      logger.warn({ fileId, error: error.message }, 'File serve failed');

      const statusCode = error.statusCode as 400 | 401 | 403 | 404 | 429 | 500;

      return c.json(
        {
          error: {
            code: error.code,
            message: error.message,
            ...(error.details && { details: error.details }),
          },
        },
        statusCode
      );
    }

    const { file, metadata } = result.value;

    logger.info({ fileId, mimeType: metadata.mimeType }, 'File served successfully');

    // Set appropriate headers
    c.header('Content-Type', metadata.mimeType);
    c.header('Content-Length', metadata.size.toString());
    c.header('Cache-Control', 'public, max-age=31536000, immutable'); // 1 year cache

    // Return the file
    return c.body(file);
  });

  /**
   * DELETE /uploads/:id
   * Delete an uploaded file
   *
   * Response:
   * {
   *   "message": "File deleted successfully"
   * }
   *
   * Security:
   * - Requires authentication
   * - Only the file owner can delete it
   */
  router.delete('/:id', authMiddleware(authService), async (c) => {
    const logger = c.get('logger');
    const user = c.get('user');
    const fileId = c.req.param('id');

    if (!user) {
      logger.error('No user in context despite auth middleware');
      return c.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        401
      );
    }

    logger.info({ userId: user.id, fileId }, 'File deletion attempt');

    // Delete the file
    const result = await uploadService.deleteFile(user.id, fileId);

    if (!isOk(result)) {
      const error = result.error;
      logger.warn({ userId: user.id, fileId, error: error.message }, 'File deletion failed');

      const statusCode = error.statusCode as 400 | 401 | 403 | 404 | 429 | 500;

      return c.json(
        {
          error: {
            code: error.code,
            message: error.message,
            ...(error.details && { details: error.details }),
          },
        },
        statusCode
      );
    }

    logger.info({ userId: user.id, fileId }, 'File deleted successfully');

    return c.json({
      message: 'File deleted successfully',
    });
  });

  /**
   * GET /uploads
   * Get all uploads for the authenticated user
   *
   * Response:
   * {
   *   "uploads": [
   *     {
   *       "url": "http://localhost:3000/api/uploads/uuid",
   *       "filename": "uuid.jpg",
   *       "mimeType": "image/jpeg",
   *       "size": 12345
   *     }
   *   ]
   * }
   *
   * Security:
   * - Requires authentication
   * - Users can only see their own uploads
   */
  router.get('/', authMiddleware(authService), async (c) => {
    const logger = c.get('logger');
    const user = c.get('user');

    if (!user) {
      logger.error('No user in context despite auth middleware');
      return c.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        401
      );
    }

    logger.info({ userId: user.id }, 'Get user uploads request');

    // Get user's uploads
    const result = await uploadService.getUserUploads(user.id);

    if (!isOk(result)) {
      const error = result.error;
      logger.warn({ userId: user.id, error: error.message }, 'Get user uploads failed');

      const statusCode = error.statusCode as 400 | 401 | 403 | 404 | 429 | 500;

      return c.json(
        {
          error: {
            code: error.code,
            message: error.message,
            ...(error.details && { details: error.details }),
          },
        },
        statusCode
      );
    }

    const uploads = result.value;

    logger.info({ userId: user.id, count: uploads.length }, 'User uploads retrieved');

    return c.json({
      uploads,
    });
  });

  return router;
}
