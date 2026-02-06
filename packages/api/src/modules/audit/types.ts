/**
 * Type definitions for the Audit module.
 * Defines audit actions, log structures, and query types for audit trail.
 */

/**
 * Enumeration of all auditable actions in the system
 */
export enum AuditAction {
  // Authentication actions
  AUTH_LOGIN_SUCCESS = 'AUTH_LOGIN_SUCCESS',
  AUTH_LOGIN_FAILURE = 'AUTH_LOGIN_FAILURE',
  AUTH_LOGOUT = 'AUTH_LOGOUT',

  // User actions
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',

  // Project actions
  PROJECT_CREATED = 'PROJECT_CREATED',
  PROJECT_UPDATED = 'PROJECT_UPDATED',
  PROJECT_DELETED = 'PROJECT_DELETED',

  // Idea actions
  IDEA_CREATED = 'IDEA_CREATED',
  IDEA_UPDATED = 'IDEA_UPDATED',
  IDEA_DELETED = 'IDEA_DELETED',

  // Collaborator actions
  COLLABORATOR_ADDED = 'COLLABORATOR_ADDED',
  COLLABORATOR_REMOVED = 'COLLABORATOR_REMOVED',

  // Privacy and data actions
  DATA_EXPORT_REQUESTED = 'DATA_EXPORT_REQUESTED',
  DATA_DELETION_REQUESTED = 'DATA_DELETION_REQUESTED',

  // External user actions
  EXTERNAL_USER_INVITED = 'EXTERNAL_USER_INVITED',
  INVITATION_ACCEPTED = 'INVITATION_ACCEPTED',
}

/**
 * Audit log entry structure
 */
export interface AuditLog {
  /** Unique identifier for the audit log entry */
  id: string;

  /** User ID who performed the action (null if anonymized or system action) */
  userId: string | null;

  /** Action that was performed */
  action: AuditAction;

  /** Type of resource affected (e.g., 'user', 'project', 'idea') */
  resourceType: string;

  /** ID of the specific resource affected (if applicable) */
  resourceId: string | null;

  /** IP address from which the action was performed */
  ipAddress: string | null;

  /** User agent string from the request */
  userAgent: string | null;

  /** Additional metadata about the action (changes, context, etc.) */
  metadata: Record<string, any> | null;

  /** Timestamp when the action was performed */
  createdAt: Date;
}

/**
 * Request to create a new audit log entry
 */
export interface CreateAuditLogRequest {
  /** User ID who performed the action (optional for system actions) */
  userId?: string | null;

  /** Action that was performed */
  action: AuditAction;

  /** Type of resource affected */
  resourceType: string;

  /** ID of the specific resource affected (optional) */
  resourceId?: string | null;

  /** Additional metadata about the action */
  metadata?: Record<string, any> | null;
}

/**
 * Context information captured from the request
 */
export interface AuditContext {
  /** IP address from which the action was performed */
  ipAddress?: string | null;

  /** User agent string from the request */
  userAgent?: string | null;
}

/**
 * Query parameters for searching audit logs
 */
export interface AuditLogQuery {
  /** Filter by user ID */
  userId?: string;

  /** Filter by action type */
  action?: AuditAction;

  /** Filter by resource type */
  resourceType?: string;

  /** Filter by start date (inclusive) */
  startDate?: Date;

  /** Filter by end date (inclusive) */
  endDate?: Date;

  /** Page number for pagination (1-based) */
  page?: number;

  /** Number of results per page */
  limit?: number;
}

/**
 * Paginated result of audit log query
 */
export interface AuditLogResult {
  /** Array of audit log entries */
  logs: AuditLog[];

  /** Total number of logs matching the query */
  total: number;

  /** Current page number */
  page: number;

  /** Number of results per page */
  limit: number;

  /** Total number of pages */
  totalPages: number;
}

/**
 * Login history entry for a user
 */
export interface LoginHistory {
  /** Login attempt ID */
  id: string;

  /** Email used for login */
  email: string;

  /** Whether the login was successful */
  success: boolean;

  /** IP address from which the login was attempted */
  ip: string;

  /** User agent string from the login request */
  userAgent: string | null;

  /** Timestamp of the login attempt */
  createdAt: Date;
}
