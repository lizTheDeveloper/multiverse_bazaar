import pino, { Logger as PinoLogger, LoggerOptions } from 'pino';
import { getConfig } from './config.js';

/**
 * Log context that can be attached to log entries.
 * Useful for tracing requests and adding structured metadata.
 */
export interface LogContext {
  /** Unique identifier for tracing a request through the system */
  requestId?: string;

  /** User ID associated with the request or operation */
  userId?: string;

  /** Additional structured data to include in the log entry */
  [key: string]: unknown;
}

/**
 * Logger interface for the Multiverse Bazaar API.
 * Provides structured logging with different severity levels.
 */
export interface Logger {
  /** Most verbose logging level, for detailed debugging */
  trace(message: string, context?: LogContext): void;
  trace(obj: object, message: string, context?: LogContext): void;

  /** Debug-level logging for development */
  debug(message: string, context?: LogContext): void;
  debug(obj: object, message: string, context?: LogContext): void;

  /** Informational messages about normal operations */
  info(message: string, context?: LogContext): void;
  info(obj: object, message: string, context?: LogContext): void;

  /** Warning messages for potential issues */
  warn(message: string, context?: LogContext): void;
  warn(obj: object, message: string, context?: LogContext): void;

  /** Error messages for failures and exceptions */
  error(message: string, context?: LogContext): void;
  error(obj: object, message: string, context?: LogContext): void;
  error(error: Error, message: string, context?: LogContext): void;

  /** Critical errors that require immediate attention */
  fatal(message: string, context?: LogContext): void;
  fatal(obj: object, message: string, context?: LogContext): void;
  fatal(error: Error, message: string, context?: LogContext): void;

  /** Creates a child logger with additional context */
  child(context: LogContext): Logger;
}

/**
 * Wrapper class that implements the Logger interface using Pino.
 */
class PinoLoggerWrapper implements Logger {
  constructor(private pinoLogger: PinoLogger) {}

  trace(messageOrObj: string | object, messageOrContext?: string | LogContext, _context?: LogContext): void {
    if (typeof messageOrObj === 'string') {
      this.pinoLogger.trace(messageOrContext as LogContext, messageOrObj);
    } else {
      this.pinoLogger.trace(messageOrObj, messageOrContext as string);
    }
  }

  debug(messageOrObj: string | object, messageOrContext?: string | LogContext, _context?: LogContext): void {
    if (typeof messageOrObj === 'string') {
      this.pinoLogger.debug(messageOrContext as LogContext, messageOrObj);
    } else {
      this.pinoLogger.debug(messageOrObj, messageOrContext as string);
    }
  }

  info(messageOrObj: string | object, messageOrContext?: string | LogContext, _context?: LogContext): void {
    if (typeof messageOrObj === 'string') {
      this.pinoLogger.info(messageOrContext as LogContext, messageOrObj);
    } else {
      this.pinoLogger.info(messageOrObj, messageOrContext as string);
    }
  }

  warn(messageOrObj: string | object, messageOrContext?: string | LogContext, _context?: LogContext): void {
    if (typeof messageOrObj === 'string') {
      this.pinoLogger.warn(messageOrContext as LogContext, messageOrObj);
    } else {
      this.pinoLogger.warn(messageOrObj, messageOrContext as string);
    }
  }

  error(
    messageOrObjOrError: string | object | Error,
    messageOrContext?: string | LogContext,
    context?: LogContext
  ): void {
    if (messageOrObjOrError instanceof Error) {
      this.pinoLogger.error(
        { err: messageOrObjOrError, ...(context || {}) },
        messageOrContext as string
      );
    } else if (typeof messageOrObjOrError === 'string') {
      this.pinoLogger.error(messageOrContext as LogContext, messageOrObjOrError);
    } else {
      this.pinoLogger.error(messageOrObjOrError, messageOrContext as string);
    }
  }

  fatal(
    messageOrObjOrError: string | object | Error,
    messageOrContext?: string | LogContext,
    context?: LogContext
  ): void {
    if (messageOrObjOrError instanceof Error) {
      this.pinoLogger.fatal(
        { err: messageOrObjOrError, ...(context || {}) },
        messageOrContext as string
      );
    } else if (typeof messageOrObjOrError === 'string') {
      this.pinoLogger.fatal(messageOrContext as LogContext, messageOrObjOrError);
    } else {
      this.pinoLogger.fatal(messageOrObjOrError, messageOrContext as string);
    }
  }

  child(context: LogContext): Logger {
    return new PinoLoggerWrapper(this.pinoLogger.child(context));
  }
}

/**
 * Creates the base Pino logger with appropriate configuration.
 *
 * @param nodeEnv - The Node environment (development, production, test)
 * @returns {PinoLogger} Configured Pino logger instance
 */
function createPinoLogger(nodeEnv: string): PinoLogger {
  const isDevelopment = nodeEnv === 'development';
  const isTest = nodeEnv === 'test';

  const options: LoggerOptions = {
    level: isTest ? 'silent' : isDevelopment ? 'debug' : 'info',
    // Redact sensitive fields from logs
    redact: {
      paths: [
        'password',
        'token',
        'accessToken',
        'refreshToken',
        'authorization',
        'cookie',
        'secret',
        'apiKey',
        '*.password',
        '*.token',
        '*.secret',
      ],
      censor: '[REDACTED]',
    },
    // Serialize errors properly
    serializers: {
      err: pino.stdSerializers.err,
      req: pino.stdSerializers.req,
      res: pino.stdSerializers.res,
    },
  };

  // In development, use pretty printing for better readability
  if (isDevelopment) {
    return pino({
      ...options,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss.l',
          ignore: 'pid,hostname',
          singleLine: false,
        },
      },
    });
  }

  // In production and test, use JSON logging
  return pino(options);
}

/**
 * Singleton logger instance.
 */
let loggerInstance: Logger | null = null;

/**
 * Creates and returns the application logger.
 *
 * @returns {Logger} Application logger instance
 *
 * @example
 * ```typescript
 * const logger = createLogger();
 * logger.info('Application started');
 * logger.error(new Error('Something went wrong'), 'Failed to process request');
 * ```
 */
export function createLogger(): Logger {
  if (!loggerInstance) {
    const config = getConfig();
    const pinoLogger = createPinoLogger(config.nodeEnv);
    loggerInstance = new PinoLoggerWrapper(pinoLogger);
  }
  return loggerInstance;
}

/**
 * Gets the application logger.
 * Alias for createLogger() that makes intent clearer.
 *
 * @returns {Logger} Application logger instance
 */
export function getLogger(): Logger {
  return createLogger();
}

/**
 * Creates a child logger with request-specific context.
 * Useful for tracing a request through multiple layers of the application.
 *
 * @param requestId - Unique identifier for the request
 * @param additionalContext - Additional context to include in all log entries
 * @returns {Logger} Child logger with request context
 *
 * @example
 * ```typescript
 * const logger = requestLogger('req-123', { userId: 'user-456' });
 * logger.info('Processing request'); // Includes requestId and userId
 * ```
 */
export function requestLogger(requestId: string, additionalContext?: LogContext): Logger {
  const logger = getLogger();
  return logger.child({
    requestId,
    ...additionalContext,
  });
}

/**
 * Creates a child logger with a specific scope or module name.
 * Useful for organizing logs by feature or module.
 *
 * @param scope - The scope or module name (e.g., 'auth', 'projects', 'database')
 * @param additionalContext - Additional context to include in all log entries
 * @returns {Logger} Child logger with scope context
 *
 * @example
 * ```typescript
 * const logger = childLogger('auth', { service: 'UserService' });
 * logger.debug('Validating user credentials');
 * ```
 */
export function childLogger(scope: string, additionalContext?: LogContext): Logger {
  const logger = getLogger();
  return logger.child({
    scope,
    ...additionalContext,
  });
}

/**
 * Resets the logger instance.
 * Useful for testing purposes.
 *
 * @internal
 */
export function resetLogger(): void {
  loggerInstance = null;
}
