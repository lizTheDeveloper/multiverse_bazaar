/**
 * Type definitions for the Privacy/GDPR module.
 * Defines types for data exports, deletion requests, and consent management.
 */

/**
 * Status of a data export request
 */
export enum DataExportStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  EXPIRED = 'EXPIRED',
}

/**
 * Data export request record
 */
export interface DataExportRequest {
  id: string;
  userId: string;
  status: DataExportStatus;
  requestedAt: Date;
  completedAt?: Date;
  downloadUrl?: string;
}

/**
 * Options for account deletion
 */
export interface DeletionOptions {
  /**
   * If true, anonymize contributions (keep content with "[Deleted User]")
   * If false, delete all user data including content
   */
  anonymizeContributions: boolean;
}

/**
 * Account deletion request record
 */
export interface DeletionRequest {
  id: string;
  userId: string;
  status: 'PENDING' | 'CANCELLED' | 'COMPLETED';
  requestedAt: Date;
  scheduledFor: Date; // 30 days after request
  completedAt?: Date;
  options: DeletionOptions;
}

/**
 * Types of consent that can be recorded
 */
export enum ConsentType {
  TERMS_OF_SERVICE = 'TERMS_OF_SERVICE',
  PRIVACY_POLICY = 'PRIVACY_POLICY',
  MARKETING = 'MARKETING',
  DATA_PROCESSING = 'DATA_PROCESSING',
}

/**
 * Consent record for GDPR compliance
 */
export interface ConsentRecord {
  id: string;
  userId: string;
  consentType: ConsentType;
  granted: boolean;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Complete user data export structure
 */
export interface UserDataExport {
  exportedAt: Date;
  user: {
    id: string;
    email: string;
    name: string | null;
    bio: string | null;
    avatarUrl: string | null;
    karma: number;
    createdAt: Date;
    updatedAt: Date;
  };
  privacySettings: {
    showEmailOnProfile: boolean;
    includeInSearch: boolean;
    showActivityPublicly: boolean;
  };
  projects: Array<{
    id: string;
    title: string;
    description: string;
    url: string | null;
    repoUrl: string | null;
    imageUrl: string | null;
    status: string;
    role: string;
    createdAt: Date;
  }>;
  ideas: Array<{
    id: string;
    title: string;
    description: string;
    lookingFor: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
  upvotes: Array<{
    projectId: string;
    projectTitle: string;
    createdAt: Date;
  }>;
  collaborations: Array<{
    projectId: string;
    projectTitle: string;
    role: string;
    createdAt: Date;
  }>;
  consentRecords: Array<{
    consentType: string;
    granted: boolean;
    timestamp: Date;
  }>;
  loginHistory: Array<{
    success: boolean;
    ip: string;
    userAgent?: string;
    createdAt: Date;
  }>;
}

/**
 * Request body for recording consent
 */
export interface RecordConsentRequest {
  consentType: ConsentType;
  granted: boolean;
}

/**
 * Request body for account deletion
 */
export interface DeleteAccountRequest {
  options: DeletionOptions;
}

/**
 * Response for deletion status
 */
export interface DeletionStatusResponse {
  hasPendingDeletion: boolean;
  deletionRequest?: {
    requestedAt: Date;
    scheduledFor: Date;
    daysRemaining: number;
    options: DeletionOptions;
  };
}
