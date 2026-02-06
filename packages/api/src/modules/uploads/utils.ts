/**
 * Security utilities for file uploads.
 * Provides functions for validating file types, generating secure filenames,
 * and stripping metadata from images.
 */

import { randomUUID } from 'crypto';
import { AllowedMimeTypes, MAGIC_BYTES } from './types.js';

/**
 * Validates the MIME type of a file by checking its magic bytes (file signature).
 * This is a security measure to ensure files are actually what they claim to be,
 * rather than relying on file extensions which can be easily spoofed.
 *
 * @param buffer - The file buffer to validate
 * @returns The detected MIME type or null if invalid
 */
export function validateMimeType(buffer: Buffer): AllowedMimeTypes | null {
  if (!buffer || buffer.length < 12) {
    return null;
  }

  // Check for JPEG (FF D8 FF)
  if (
    buffer[0] === MAGIC_BYTES.JPEG[0] &&
    buffer[1] === MAGIC_BYTES.JPEG[1] &&
    buffer[2] === MAGIC_BYTES.JPEG[2]
  ) {
    return 'image/jpeg';
  }

  // Check for PNG (89 50 4E 47)
  if (
    buffer[0] === MAGIC_BYTES.PNG[0] &&
    buffer[1] === MAGIC_BYTES.PNG[1] &&
    buffer[2] === MAGIC_BYTES.PNG[2] &&
    buffer[3] === MAGIC_BYTES.PNG[3]
  ) {
    return 'image/png';
  }

  // Check for GIF (47 49 46 38)
  if (
    buffer[0] === MAGIC_BYTES.GIF[0] &&
    buffer[1] === MAGIC_BYTES.GIF[1] &&
    buffer[2] === MAGIC_BYTES.GIF[2] &&
    buffer[3] === MAGIC_BYTES.GIF[3]
  ) {
    return 'image/gif';
  }

  // Check for WEBP (RIFF....WEBP)
  // WEBP files start with "RIFF" (52 49 46 46) and have "WEBP" (57 45 42 50) at offset 8
  if (
    buffer[0] === MAGIC_BYTES.WEBP_RIFF[0] &&
    buffer[1] === MAGIC_BYTES.WEBP_RIFF[1] &&
    buffer[2] === MAGIC_BYTES.WEBP_RIFF[2] &&
    buffer[3] === MAGIC_BYTES.WEBP_RIFF[3] &&
    buffer[8] === MAGIC_BYTES.WEBP_WEBP[0] &&
    buffer[9] === MAGIC_BYTES.WEBP_WEBP[1] &&
    buffer[10] === MAGIC_BYTES.WEBP_WEBP[2] &&
    buffer[11] === MAGIC_BYTES.WEBP_WEBP[3]
  ) {
    return 'image/webp';
  }

  return null;
}

/**
 * Generates a secure filename using UUID.
 * This prevents directory traversal attacks and ensures unique filenames.
 *
 * @param mimeType - The MIME type to determine file extension
 * @returns A secure UUID-based filename with appropriate extension
 */
export function generateSecureFilename(mimeType: AllowedMimeTypes): string {
  const uuid = randomUUID();

  // Map MIME types to file extensions
  const extensionMap: Record<AllowedMimeTypes, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
  };

  const extension = extensionMap[mimeType];
  return `${uuid}.${extension}`;
}

/**
 * Strips EXIF metadata from images for privacy and security.
 * EXIF data can contain sensitive information like GPS coordinates, camera details, etc.
 *
 * @param buffer - The image buffer to strip metadata from
 * @returns The image buffer with EXIF data removed
 *
 * TODO: Implement EXIF stripping using sharp library
 * For now, this is a placeholder that returns the buffer unchanged.
 *
 * To implement:
 * 1. Install sharp: npm install sharp @types/sharp
 * 2. Use sharp to process and strip metadata:
 *    ```typescript
 *    import sharp from 'sharp';
 *    const processed = await sharp(buffer)
 *      .rotate() // Auto-rotate based on EXIF orientation
 *      .withMetadata({ orientation: undefined }) // Strip EXIF
 *      .toBuffer();
 *    return processed;
 *    ```
 * 3. Consider adding image optimization (resize, compress) at the same time
 */
export async function stripExifMetadata(buffer: Buffer): Promise<Buffer> {
  // TODO: Implement EXIF metadata stripping using sharp library
  // For production use, install sharp and implement proper metadata removal
  // This is critical for user privacy as EXIF can contain GPS coordinates

  // Placeholder implementation - returns buffer unchanged
  // In production, this should use sharp or similar library to:
  // 1. Strip all EXIF metadata
  // 2. Handle orientation properly
  // 3. Optionally optimize/compress the image

  return buffer;
}

/**
 * Validates file size against security limits
 *
 * @param size - File size in bytes
 * @param maxSize - Maximum allowed size in bytes
 * @returns true if size is valid, false otherwise
 */
export function validateFileSize(size: number, maxSize: number): boolean {
  return size > 0 && size <= maxSize;
}

/**
 * Sanitizes the original filename by removing dangerous characters
 * and limiting length. Used for logging/display purposes only.
 *
 * @param filename - The original filename
 * @returns Sanitized filename safe for storage and display
 */
export function sanitizeOriginalFilename(filename: string): string {
  // Remove path components
  const basename = filename.split(/[\\/]/).pop() || 'unknown';

  // Replace dangerous characters
  const sanitized = basename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 255); // Limit length

  return sanitized || 'unknown';
}
