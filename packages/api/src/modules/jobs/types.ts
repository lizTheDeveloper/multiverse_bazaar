/**
 * Type definitions for the Jobs module.
 * Defines job scheduling, execution, and result types.
 */

/**
 * Cron expression string for job scheduling.
 * Format: "second minute hour day-of-month month day-of-week"
 * Examples:
 * - "0 2 \* \* \*" - Daily at 2:00 AM
 * - "0 0 \* \* 0" - Weekly on Sunday at midnight
 * - "\*\/5 \* \* \* \*" - Every 5 minutes
 */
export type JobSchedule = string;

/**
 * Result of a job execution
 */
export interface JobResult {
  /** Whether the job executed successfully */
  success: boolean;

  /** Optional message describing the result */
  message?: string;

  /** Additional details about the execution (counts, errors, etc.) */
  details?: Record<string, unknown>;
}

/**
 * Job handler function that performs the actual work
 */
export type JobHandler = () => Promise<JobResult>;

/**
 * Job definition for scheduled tasks
 */
export interface Job {
  /** Unique name identifier for the job */
  name: string;

  /** Cron expression or interval for when to run the job */
  schedule: JobSchedule;

  /** Function that executes the job logic */
  handler: JobHandler;

  /** Whether the job is currently enabled */
  enabled: boolean;

  /** Last time the job was executed (undefined if never run) */
  lastRun?: Date;

  /** Next scheduled run time (calculated from schedule) */
  nextRun?: Date;

  /** Optional description of what the job does */
  description?: string;
}

/**
 * Status information for a registered job
 */
export interface JobStatus {
  /** Job name */
  name: string;

  /** Job description */
  description?: string;

  /** Whether the job is enabled */
  enabled: boolean;

  /** Whether the job is currently running */
  isRunning: boolean;

  /** Cron schedule expression */
  schedule: JobSchedule;

  /** Last execution time */
  lastRun?: Date;

  /** Next scheduled execution time */
  nextRun?: Date;

  /** Last execution result */
  lastResult?: JobResult;
}

/**
 * Statistics about job executions
 */
export interface JobStatistics {
  /** Total number of registered jobs */
  totalJobs: number;

  /** Number of enabled jobs */
  enabledJobs: number;

  /** Number of jobs currently running */
  runningJobs: number;

  /** Job-specific statistics */
  jobs: JobStatus[];
}
