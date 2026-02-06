/**
 * Job Scheduler for Multiverse Bazaar API.
 * Manages scheduled jobs using node-cron for cron-based scheduling.
 */

import cron from 'node-cron';
import { Logger } from '../../infra/logger.js';
import { Job, JobResult, JobStatus, JobStatistics } from './types.js';

/**
 * Job scheduler that manages and executes scheduled jobs
 */
export class JobScheduler {
  private jobs: Map<string, Job> = new Map();
  private cronTasks: Map<string, cron.ScheduledTask> = new Map();
  private runningJobs: Set<string> = new Set();
  private lastResults: Map<string, JobResult> = new Map();
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger.child({ scope: 'JobScheduler' });
  }

  /**
   * Register a job with the scheduler
   * @param job Job definition to register
   */
  register(job: Job): void {
    if (this.jobs.has(job.name)) {
      throw new Error(`Job with name "${job.name}" is already registered`);
    }

    // Validate cron expression
    if (!cron.validate(job.schedule)) {
      throw new Error(`Invalid cron expression for job "${job.name}": ${job.schedule}`);
    }

    this.jobs.set(job.name, job);
    this.logger.info(`Registered job: ${job.name} (${job.schedule})`, {
      jobName: job.name,
      schedule: job.schedule,
      enabled: job.enabled,
    });
  }

  /**
   * Start all enabled jobs
   */
  start(): void {
    this.logger.info('Starting job scheduler');

    for (const [name, job] of this.jobs) {
      if (!job.enabled) {
        this.logger.debug(`Skipping disabled job: ${name}`);
        continue;
      }

      const task = cron.schedule(
        job.schedule,
        async () => {
          await this.executeJob(name);
        },
        {
          scheduled: true,
          timezone: 'UTC', // Use UTC for consistency
        }
      );

      this.cronTasks.set(name, task);
      this.logger.info(`Scheduled job: ${name}`, {
        jobName: name,
        schedule: job.schedule,
      });
    }

    this.logger.info(`Job scheduler started with ${this.cronTasks.size} active jobs`);
  }

  /**
   * Stop all running jobs
   */
  stop(): void {
    this.logger.info('Stopping job scheduler');

    for (const [name, task] of this.cronTasks) {
      task.stop();
      this.logger.debug(`Stopped job: ${name}`);
    }

    this.cronTasks.clear();
    this.logger.info('Job scheduler stopped');
  }

  /**
   * Manually trigger a job to run immediately
   * @param jobName Name of the job to run
   * @returns Job execution result
   */
  async runNow(jobName: string): Promise<JobResult> {
    const job = this.jobs.get(jobName);

    if (!job) {
      throw new Error(`Job "${jobName}" not found`);
    }

    this.logger.info(`Manually triggering job: ${jobName}`);
    return await this.executeJob(jobName);
  }

  /**
   * Get the status of all registered jobs
   * @returns Job statistics and status information
   */
  getStatus(): JobStatistics {
    const jobStatuses: JobStatus[] = [];

    for (const [name, job] of this.jobs) {
      const isRunning = this.runningJobs.has(name);
      const lastResult = this.lastResults.get(name);

      jobStatuses.push({
        name: job.name,
        description: job.description,
        enabled: job.enabled,
        isRunning,
        schedule: job.schedule,
        lastRun: job.lastRun,
        nextRun: job.nextRun,
        lastResult,
      });
    }

    return {
      totalJobs: this.jobs.size,
      enabledJobs: Array.from(this.jobs.values()).filter((j) => j.enabled).length,
      runningJobs: this.runningJobs.size,
      jobs: jobStatuses,
    };
  }

  /**
   * Get status of a specific job
   * @param jobName Name of the job
   * @returns Job status or undefined if not found
   */
  getJobStatus(jobName: string): JobStatus | undefined {
    const job = this.jobs.get(jobName);
    if (!job) {
      return undefined;
    }

    const isRunning = this.runningJobs.has(jobName);
    const lastResult = this.lastResults.get(jobName);

    return {
      name: job.name,
      description: job.description,
      enabled: job.enabled,
      isRunning,
      schedule: job.schedule,
      lastRun: job.lastRun,
      nextRun: job.nextRun,
      lastResult,
    };
  }

  /**
   * Execute a job and handle errors gracefully
   * @param jobName Name of the job to execute
   * @returns Job execution result
   */
  private async executeJob(jobName: string): Promise<JobResult> {
    const job = this.jobs.get(jobName);

    if (!job) {
      return {
        success: false,
        message: `Job "${jobName}" not found`,
      };
    }

    // Prevent concurrent execution of the same job
    if (this.runningJobs.has(jobName)) {
      this.logger.warn(`Job "${jobName}" is already running, skipping execution`);
      return {
        success: false,
        message: 'Job is already running',
      };
    }

    this.runningJobs.add(jobName);
    const startTime = Date.now();

    this.logger.info(`Starting job execution: ${jobName}`, { jobName });

    try {
      const result = await job.handler();

      const duration = Date.now() - startTime;
      job.lastRun = new Date();
      this.lastResults.set(jobName, result);

      if (result.success) {
        this.logger.info(`Job completed successfully: ${jobName}`, {
          jobName,
          duration,
          message: result.message,
          details: result.details,
        });
      } else {
        this.logger.warn(`Job completed with errors: ${jobName}`, {
          jobName,
          duration,
          message: result.message,
          details: result.details,
        });
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorResult: JobResult = {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        details: {
          error: error instanceof Error ? error.stack : String(error),
        },
      };

      job.lastRun = new Date();
      this.lastResults.set(jobName, errorResult);

      this.logger.error(error instanceof Error ? error : new Error(String(error)), `Job failed: ${jobName}`, {
        jobName,
        duration,
      });

      return errorResult;
    } finally {
      this.runningJobs.delete(jobName);
    }
  }
}
