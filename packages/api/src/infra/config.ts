import { z } from 'zod';

/**
 * Configuration interface for the Multiverse Bazaar API.
 * All configuration values are loaded from environment variables.
 */
export interface Config {
  /** Port number for the HTTP server */
  port: number;

  /** Node environment: development, production, or test */
  nodeEnv: 'development' | 'production' | 'test';

  /** Database connection URL */
  databaseUrl: string;

  /** Secret key for signing JWT tokens */
  jwtSecret: string;

  /** Expiration time for access tokens (e.g., '15m', '1h') */
  jwtExpiresIn: string;

  /** Expiration time for refresh tokens (e.g., '7d', '30d') */
  refreshTokenExpiresIn: string;

  /** Allowed CORS origins for cross-origin requests */
  corsOrigins: string[];

  /** Directory path for file uploads */
  uploadDir: string;

  /** Maximum file size in bytes (default: 5MB) */
  maxFileSize: number;
}

/**
 * Zod schema for validating environment variables.
 * Provides runtime type safety and clear error messages for configuration.
 */
const configSchema = z.object({
  PORT: z.string().optional().default('3000').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters for security'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGINS: z.string().default('http://localhost:3000').transform((val) => val.split(',')),
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_FILE_SIZE: z.string().optional().default('5242880').transform(Number), // 5MB in bytes
});

/**
 * Loads and validates configuration from environment variables.
 *
 * @throws {Error} If required environment variables are missing or invalid
 * @returns {Config} Validated configuration object
 *
 * @example
 * ```typescript
 * const config = loadConfig();
 * console.log(`Server starting on port ${config.port}`);
 * ```
 */
export function loadConfig(): Config {
  const result = configSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.errors.map((err) => {
      return `  - ${err.path.join('.')}: ${err.message}`;
    }).join('\n');

    throw new Error(
      `Configuration validation failed:\n${errors}\n\n` +
      'Please check your environment variables and .env file.'
    );
  }

  const env = result.data;

  // In production, enforce stricter validation
  if (env.NODE_ENV === 'production') {
    if (env.JWT_SECRET.length < 64) {
      throw new Error(
        'In production, JWT_SECRET must be at least 64 characters for enhanced security'
      );
    }

    if (env.CORS_ORIGINS.includes('*') || env.CORS_ORIGINS.includes('http://localhost:3000')) {
      throw new Error(
        'In production, CORS_ORIGINS must not include wildcards or localhost'
      );
    }
  }

  const config: Config = {
    port: env.PORT,
    nodeEnv: env.NODE_ENV,
    databaseUrl: env.DATABASE_URL,
    jwtSecret: env.JWT_SECRET,
    jwtExpiresIn: env.JWT_EXPIRES_IN,
    refreshTokenExpiresIn: env.REFRESH_TOKEN_EXPIRES_IN,
    corsOrigins: env.CORS_ORIGINS,
    uploadDir: env.UPLOAD_DIR,
    maxFileSize: env.MAX_FILE_SIZE,
  };

  return config;
}

/**
 * Singleton instance of the configuration.
 * Loaded once at application startup.
 */
let configInstance: Config | null = null;

/**
 * Gets the application configuration.
 * Loads the configuration on first call and caches it.
 *
 * @returns {Config} Application configuration
 */
export function getConfig(): Config {
  if (!configInstance) {
    configInstance = loadConfig();
  }
  return configInstance;
}

/**
 * Resets the configuration instance.
 * Useful for testing purposes.
 *
 * @internal
 */
export function resetConfig(): void {
  configInstance = null;
}
