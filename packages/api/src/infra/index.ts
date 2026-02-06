/**
 * Infrastructure module for the Multiverse Bazaar API.
 * Provides core utilities for configuration, logging, and dependency injection.
 *
 * @module infra
 */

// Re-export configuration
export {
  Config,
  loadConfig,
  getConfig,
  resetConfig,
} from './config.js';

// Re-export logger
export {
  Logger,
  LogContext,
  createLogger,
  getLogger,
  requestLogger,
  childLogger,
  resetLogger,
} from './logger.js';

// Re-export container
export {
  Container,
  Lifetime,
  Factory,
  createContainer,
  setupContainer,
} from './container.js';
