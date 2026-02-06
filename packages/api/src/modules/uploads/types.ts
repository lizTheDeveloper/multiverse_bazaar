/**
 * Type definitions for the Uploads module.
 * Defines file upload types, validation rules, and security constants.
 */

/**
 * Allowed MIME types for image uploads
 */
export type AllowedMimeTypes = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

/**
 * Maximum file size in bytes (5MB)
 */
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Set of allowed MIME types for validation
 */
export const ALLOWED_MIME_TYPES: Set<AllowedMimeTypes> = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]);

/**
 * Full uploaded file metadata stored in database
 */
export interface UploadedFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: AllowedMimeTypes;
  size: number;
  path: string;
  uploadedBy: string;
  createdAt: Date;
}

/**
 * Result returned after successful upload
 */
export interface UploadResult {
  url: string;
  filename: string;
  mimeType: AllowedMimeTypes;
  size: number;
}

/**
 * Magic bytes (file signatures) for validating file types
 * Used to verify actual file content instead of relying on file extension
 */
export const MAGIC_BYTES = {
  JPEG: [0xff, 0xd8, 0xff],
  PNG: [0x89, 0x50, 0x4e, 0x47],
  GIF: [0x47, 0x49, 0x46, 0x38], // GIF8
  WEBP_RIFF: [0x52, 0x49, 0x46, 0x46], // RIFF
  WEBP_WEBP: [0x57, 0x45, 0x42, 0x50], // WEBP (at offset 8)
} as const;

/**
 * File size limits for validation
 */
export const FILE_SIZE_LIMITS = {
  MIN_SIZE: 100, // 100 bytes minimum
  MAX_SIZE: MAX_FILE_SIZE,
} as const;
