/**
 * Privacy/GDPR module entry point.
 * Exports public API for use by other parts of the application.
 */

// Export types
export type {
  DataExportRequest,
  DeletionRequest,
  DeletionOptions,
  ConsentRecord,
  UserDataExport,
  RecordConsentRequest,
  DeleteAccountRequest,
  DeletionStatusResponse,
} from './types.js';

export { DataExportStatus, ConsentType } from './types.js';

// Export service
export { PrivacyService } from './service.js';

// Export repository
export { PrivacyRepository } from './repository.js';

// Export routes factory
export { createPrivacyRoutes } from './routes.js';
