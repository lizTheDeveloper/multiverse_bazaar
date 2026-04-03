/**
 * Error Resolver Client for the API server
 * Automatically submits unhandled errors to the Autonomous Error Resolver
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { randomBytes } from 'crypto';
import { hostname } from 'os';
import type { Context } from 'hono';

export interface ErrorResolverConfig {
  /** Path to the errors/pending directory */
  errorsDir: string;
  /** Whether error submission is enabled */
  enabled: boolean;
  /** Hostname identifier for this server */
  hostname?: string;
  /** Only submit 5xx errors (default: true) */
  onlyServerErrors?: boolean;
  /** Error patterns to ignore */
  ignorePatterns?: RegExp[];
}

interface SubmittedError {
  error_id: string;
  error_message: string;
  error_name: string;
  stack_trace: string;
  source_file: string;
  source_line: string;
  request_context: {
    method: string;
    url: string;
    path: string;
    headers: Record<string, string>;
    query: Record<string, string>;
    requestId?: string;
  };
  server_context: {
    hostname: string;
    nodeEnv: string;
    timestamp: string;
  };
  submitted_at: string;
  submitted_from: string;
  attempt_count: number;
  resolution_attempts: unknown[];
}

const DEFAULT_IGNORE_PATTERNS = [
  /Not Found/i,
  /Unauthorized/i,
  /Forbidden/i,
  /Bad Request/i,
  /ECONNREFUSED/i, // External service unavailable
];

export class ErrorResolverClient {
  private config: Required<ErrorResolverConfig>;

  constructor(config: ErrorResolverConfig) {
    this.config = {
      errorsDir: config.errorsDir,
      enabled: config.enabled,
      hostname: config.hostname ?? hostname(),
      onlyServerErrors: config.onlyServerErrors ?? true,
      ignorePatterns: config.ignorePatterns ?? DEFAULT_IGNORE_PATTERNS,
    };

    // Ensure the directory exists
    if (this.config.enabled && !existsSync(this.config.errorsDir)) {
      try {
        mkdirSync(this.config.errorsDir, { recursive: true });
      } catch (err) {
        console.error('[ErrorResolver] Failed to create errors directory:', err);
      }
    }
  }

  private generateId(): string {
    const now = new Date();
    const timestamp = now.toISOString()
      .replace(/[-:]/g, '')
      .replace('T', '_')
      .slice(0, 15);
    const random = randomBytes(4).toString('hex');
    return `err_${timestamp}_${random}`;
  }

  private parseStackTrace(stack?: string): { file: string; line: string } {
    if (!stack) return { file: 'unknown', line: 'unknown' };

    const lines = stack.split('\n');
    for (const line of lines) {
      // Match: "at functionName (/path/to/file.ts:42:13)" or "at /path/to/file.ts:42:13"
      const match = line.match(/at\s+(?:.*?\s+)?\(?(.*?):(\d+):\d+\)?$/);
      if (match) {
        const [, filePath, lineNum] = match;
        // Skip node_modules and internal Node.js files
        if (filePath && lineNum && !filePath.includes('node_modules') && !filePath.startsWith('node:')) {
          // Convert absolute path to relative if possible
          const relativePath = filePath.includes('/packages/')
            ? filePath.substring(filePath.indexOf('/packages/') + 1)
            : filePath;
          return { file: relativePath, line: lineNum };
        }
      }
    }

    return { file: 'unknown', line: 'unknown' };
  }

  private shouldIgnore(error: Error): boolean {
    const message = error.message;
    return this.config.ignorePatterns.some(pattern => pattern.test(message));
  }

  private getErrorStatus(error: Error): number {
    if ('status' in error && typeof (error as { status: unknown }).status === 'number') {
      return (error as { status: number }).status;
    }
    return 500;
  }

  /**
   * Submit an error from a Hono context
   */
  submitFromContext(error: Error, c: Context): string | null {
    if (!this.config.enabled) {
      return null;
    }

    // Check if we should ignore this error
    if (this.shouldIgnore(error)) {
      return null;
    }

    // Only submit server errors (5xx) by default
    const status = this.getErrorStatus(error);
    if (this.config.onlyServerErrors && status < 500) {
      return null;
    }

    const errorId = this.generateId();
    const { file, line } = this.parseStackTrace(error.stack);

    // Extract safe headers (exclude sensitive ones)
    const headers: Record<string, string> = {};
    c.req.raw.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (!['authorization', 'cookie', 'x-api-key', 'x-auth-token'].includes(lowerKey)) {
        headers[key] = value;
      }
    });

    // Extract query params
    const query: Record<string, string> = {};
    const url = new URL(c.req.url);
    url.searchParams.forEach((value, key) => {
      // Don't include potentially sensitive query params
      if (!['token', 'key', 'secret', 'password', 'auth'].includes(key.toLowerCase())) {
        query[key] = value;
      }
    });

    const errorData: SubmittedError = {
      error_id: errorId,
      error_message: error.message,
      error_name: error.name,
      stack_trace: error.stack || 'No stack trace available',
      source_file: file,
      source_line: line,
      request_context: {
        method: c.req.method,
        url: c.req.url,
        path: c.req.path,
        headers,
        query,
        requestId: c.get('requestId'),
      },
      server_context: {
        hostname: this.config.hostname,
        nodeEnv: process.env.NODE_ENV || 'unknown',
        timestamp: new Date().toISOString(),
      },
      submitted_at: new Date().toISOString(),
      submitted_from: `api-server:${this.config.hostname}`,
      attempt_count: 0,
      resolution_attempts: [],
    };

    const filePath = join(this.config.errorsDir, `${errorId}.json`);

    try {
      writeFileSync(filePath, JSON.stringify(errorData, null, 2));
      console.log(`[ErrorResolver] Submitted error: ${errorId} - ${error.message}`);
      return errorId;
    } catch (err) {
      console.error('[ErrorResolver] Failed to submit error:', err);
      return null;
    }
  }

  /**
   * Submit an error directly (without Hono context)
   */
  submit(error: Error, context?: Record<string, unknown>): string | null {
    if (!this.config.enabled) {
      return null;
    }

    if (this.shouldIgnore(error)) {
      return null;
    }

    const errorId = this.generateId();
    const { file, line } = this.parseStackTrace(error.stack);

    const errorData = {
      error_id: errorId,
      error_message: error.message,
      error_name: error.name,
      stack_trace: error.stack || 'No stack trace available',
      source_file: file,
      source_line: line,
      request_context: context || {},
      server_context: {
        hostname: this.config.hostname,
        nodeEnv: process.env.NODE_ENV || 'unknown',
        timestamp: new Date().toISOString(),
      },
      submitted_at: new Date().toISOString(),
      submitted_from: `api-server:${this.config.hostname}`,
      attempt_count: 0,
      resolution_attempts: [],
    };

    const filePath = join(this.config.errorsDir, `${errorId}.json`);

    try {
      writeFileSync(filePath, JSON.stringify(errorData, null, 2));
      console.log(`[ErrorResolver] Submitted error: ${errorId} - ${error.message}`);
      return errorId;
    } catch (err) {
      console.error('[ErrorResolver] Failed to submit error:', err);
      return null;
    }
  }
}

// Singleton instance - lazily initialized
let instance: ErrorResolverClient | null = null;

/**
 * Get or create the error resolver client singleton
 */
export function getErrorResolver(): ErrorResolverClient {
  if (!instance) {
    // Default path relative to the project root
    const projectRoot = process.cwd().includes('/packages/')
      ? process.cwd().split('/packages/')[0]
      : process.cwd();

    const errorsDir = join(projectRoot, 'scripts/error-resolver/errors/pending');

    instance = new ErrorResolverClient({
      errorsDir,
      enabled: process.env.AUTO_ERROR_RESOLVER === 'true' || process.env.NODE_ENV === 'development',
      onlyServerErrors: true,
    });
  }
  return instance;
}

export default ErrorResolverClient;
