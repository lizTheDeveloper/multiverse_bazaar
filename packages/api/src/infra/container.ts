/**
 * Dependency Injection container for the Multiverse Bazaar API.
 * Provides a simple, type-safe DI system with singleton and transient lifetimes.
 */

import { Config, getConfig } from './config.js';
import { Logger, getLogger } from './logger.js';
import { getPrismaClient } from './database.js';

// Repository imports
import { AuthRepository } from '../modules/auth/repository.js';
import { UserRepository } from '../modules/users/repository.js';
import { ProjectRepository } from '../modules/projects/repository.js';
import { CollaboratorRepository } from '../modules/collaborators/repository.js';
import { UpvoteRepository } from '../modules/upvotes/repository.js';
import { IdeaRepository } from '../modules/ideas/repository.js';
import { NotificationRepository, PushTokenRepository } from '../modules/notifications/repository.js';
import { SearchRepository } from '../modules/search/repository.js';
import { UploadRepository } from '../modules/uploads/repository.js';
import { AuditRepository } from '../modules/audit/repository.js';
import { PrivacyRepository } from '../modules/privacy/repository.js';
import { KarmaRepository } from '../modules/karma/repository.js';

// Service imports
import { AuthService } from '../modules/auth/service.js';
import { UserService } from '../modules/users/service.js';
import { ProjectService } from '../modules/projects/service.js';
import { CollaboratorService } from '../modules/collaborators/service.js';
import { UpvoteService } from '../modules/upvotes/service.js';
import { IdeaService } from '../modules/ideas/service.js';
import { NotificationService } from '../modules/notifications/service.js';
import { SearchService } from '../modules/search/service.js';
import { UploadService } from '../modules/uploads/service.js';
import { AuditService } from '../modules/audit/service.js';
import { PrivacyService } from '../modules/privacy/service.js';
import { KarmaService } from '../modules/karma/service.js';

/**
 * Lifetime of a dependency in the container.
 * - singleton: One instance shared across all resolutions
 * - transient: New instance created for each resolution
 */
export type Lifetime = 'singleton' | 'transient';

/**
 * Factory function that creates an instance of a dependency.
 */
export type Factory<T> = (container: Container) => T;

/**
 * Registration entry for a dependency.
 */
interface Registration<T> {
  factory: Factory<T>;
  lifetime: Lifetime;
  instance?: T;
}

/**
 * Container interface for dependency injection.
 * Provides methods to register and resolve dependencies.
 */
export interface Container {
  /**
   * Registers a dependency with the container.
   *
   * @param key - Unique identifier for the dependency
   * @param factory - Factory function that creates the dependency
   * @param lifetime - Lifetime of the dependency (default: singleton)
   *
   * @example
   * ```typescript
   * container.register('userService', (c) => new UserService(c.resolve('logger')));
   * ```
   */
  register<T>(key: string, factory: Factory<T>, lifetime?: Lifetime): void;

  /**
   * Resolves a dependency from the container.
   *
   * @param key - Unique identifier for the dependency
   * @returns The resolved dependency instance
   * @throws {Error} If the dependency is not registered
   *
   * @example
   * ```typescript
   * const logger = container.resolve<Logger>('logger');
   * ```
   */
  resolve<T>(key: string): T;

  /**
   * Checks if a dependency is registered in the container.
   *
   * @param key - Unique identifier for the dependency
   * @returns True if the dependency is registered, false otherwise
   */
  has(key: string): boolean;
}

/**
 * Implementation of the Container interface.
 * Uses a Map to store registrations and manages instance lifecycles.
 */
class DIContainer implements Container {
  private registrations = new Map<string, Registration<unknown>>();

  register<T>(key: string, factory: Factory<T>, lifetime: Lifetime = 'singleton'): void {
    this.registrations.set(key, {
      factory: factory as Factory<unknown>,
      lifetime,
    });
  }

  resolve<T>(key: string): T {
    const registration = this.registrations.get(key);

    if (!registration) {
      throw new Error(
        `Dependency "${key}" is not registered in the container. ` +
        `Available dependencies: ${Array.from(this.registrations.keys()).join(', ')}`
      );
    }

    // For singleton lifetime, return cached instance if available
    if (registration.lifetime === 'singleton' && registration.instance !== undefined) {
      return registration.instance as T;
    }

    // Create new instance using factory
    const instance = registration.factory(this) as T;

    // Cache instance for singleton lifetime
    if (registration.lifetime === 'singleton') {
      registration.instance = instance;
    }

    return instance;
  }

  has(key: string): boolean {
    return this.registrations.has(key);
  }
}

/**
 * Creates a new dependency injection container.
 *
 * @returns {Container} A new container instance
 *
 * @example
 * ```typescript
 * const container = createContainer();
 * container.register('config', () => loadConfig());
 * const config = container.resolve<Config>('config');
 * ```
 */
export function createContainer(): Container {
  return new DIContainer();
}

/**
 * Sets up the container with core dependencies.
 * Pre-registers config and logger for use throughout the application.
 *
 * @returns {Container} Container with core dependencies registered
 *
 * @example
 * ```typescript
 * const container = setupContainer();
 * const logger = container.resolve<Logger>('logger');
 * logger.info('Application started');
 * ```
 */
export function setupContainer(): Container {
  const container = createContainer();

  // Register core infrastructure
  container.register<Config>(
    'config',
    () => getConfig(),
    'singleton'
  );

  container.register<Logger>(
    'logger',
    () => getLogger(),
    'singleton'
  );

  // Register database
  container.register(
    'db',
    () => {
      return getPrismaClient();
    },
    'singleton'
  );

  // Register repositories
  container.register(
    'authRepository',
    (c) => {
      const db = c.resolve('db');
      return new AuthRepository(db);
    },
    'singleton'
  );

  container.register(
    'userRepository',
    (c) => {
      const db = c.resolve('db');
      return new UserRepository(db);
    },
    'singleton'
  );

  container.register(
    'projectRepository',
    (c) => {
      const db = c.resolve('db');
      return new ProjectRepository(db);
    },
    'singleton'
  );

  container.register(
    'collaboratorRepository',
    (c) => {
      const db = c.resolve('db');
      return new CollaboratorRepository(db);
    },
    'singleton'
  );

  container.register(
    'upvoteRepository',
    (c) => {
      const db = c.resolve('db');
      return new UpvoteRepository(db);
    },
    'singleton'
  );

  container.register(
    'ideaRepository',
    (c) => {
      const db = c.resolve('db');
      return new IdeaRepository(db);
    },
    'singleton'
  );

  container.register(
    'notificationRepository',
    (c) => {
      const db = c.resolve('db');
      return new NotificationRepository(db);
    },
    'singleton'
  );

  container.register(
    'pushTokenRepository',
    (c) => {
      const db = c.resolve('db');
      return new PushTokenRepository(db);
    },
    'singleton'
  );

  container.register(
    'searchRepository',
    (c) => {
      const db = c.resolve('db');
      return new SearchRepository(db);
    },
    'singleton'
  );

  container.register(
    'uploadRepository',
    (c) => {
      const db = c.resolve('db');
      return new UploadRepository(db);
    },
    'singleton'
  );

  container.register(
    'auditRepository',
    (c) => {
      const db = c.resolve('db');
      return new AuditRepository(db);
    },
    'singleton'
  );

  container.register(
    'privacyRepository',
    (c) => {
      const db = c.resolve('db');
      return new PrivacyRepository(db);
    },
    'singleton'
  );

  container.register(
    'karmaRepository',
    (c) => {
      const db = c.resolve('db');
      return new KarmaRepository(db);
    },
    'singleton'
  );

  // Register services
  container.register(
    'authService',
    (c) => {
      const authRepository = c.resolve('authRepository');
      const config = c.resolve<Config>('config');
      const logger = c.resolve<Logger>('logger');
      return new AuthService(authRepository, config, logger);
    },
    'singleton'
  );

  container.register(
    'userService',
    (c) => {
      const userRepository = c.resolve('userRepository');
      const logger = c.resolve<Logger>('logger');
      const uploadService = c.resolve('uploadService');
      return new UserService(userRepository, logger, uploadService);
    },
    'singleton'
  );

  container.register(
    'projectService',
    (c) => {
      const projectRepository = c.resolve('projectRepository');
      const logger = c.resolve<Logger>('logger');
      return new ProjectService(projectRepository, logger);
    },
    'singleton'
  );

  container.register(
    'collaboratorService',
    (c) => {
      const collaboratorRepository = c.resolve('collaboratorRepository');
      const projectRepository = c.resolve('projectRepository');
      const userRepository = c.resolve('userRepository');
      const notificationService = c.resolve('notificationService');
      const logger = c.resolve<Logger>('logger');
      return new CollaboratorService(
        collaboratorRepository,
        projectRepository,
        userRepository,
        notificationService,
        logger
      );
    },
    'singleton'
  );

  container.register(
    'upvoteService',
    (c) => {
      const upvoteRepository = c.resolve('upvoteRepository');
      const projectRepository = c.resolve('projectRepository');
      const notificationService = c.resolve('notificationService');
      const karmaService = c.resolve('karmaService');
      const logger = c.resolve<Logger>('logger');
      return new UpvoteService(
        upvoteRepository,
        projectRepository,
        notificationService,
        karmaService,
        logger
      );
    },
    'singleton'
  );

  container.register(
    'ideaService',
    (c) => {
      const ideaRepository = c.resolve('ideaRepository');
      const projectRepository = c.resolve('projectRepository');
      const logger = c.resolve<Logger>('logger');
      return new IdeaService(ideaRepository, projectRepository, logger);
    },
    'singleton'
  );

  container.register(
    'notificationService',
    (c) => {
      const notificationRepository = c.resolve('notificationRepository');
      const pushTokenRepository = c.resolve('pushTokenRepository');
      const logger = c.resolve<Logger>('logger');
      return new NotificationService(notificationRepository, pushTokenRepository, logger);
    },
    'singleton'
  );

  container.register(
    'searchService',
    (c) => {
      const searchRepository = c.resolve('searchRepository');
      const logger = c.resolve<Logger>('logger');
      return new SearchService(searchRepository, logger);
    },
    'singleton'
  );

  container.register(
    'uploadService',
    (c) => {
      const uploadRepository = c.resolve('uploadRepository');
      const config = c.resolve<Config>('config');
      // Construct base URL - in production this should come from environment
      const baseUrl = process.env.API_BASE_URL || `http://localhost:${config.port}`;
      return new UploadService(uploadRepository, baseUrl);
    },
    'singleton'
  );

  container.register(
    'auditService',
    (c) => {
      const auditRepository = c.resolve('auditRepository');
      const logger = c.resolve<Logger>('logger');
      return new AuditService(auditRepository, logger);
    },
    'singleton'
  );

  container.register(
    'privacyService',
    (c) => {
      const privacyRepository = c.resolve('privacyRepository');
      const userRepository = c.resolve('userRepository');
      const logger = c.resolve<Logger>('logger');
      return new PrivacyService(privacyRepository, userRepository, logger);
    },
    'singleton'
  );

  container.register(
    'karmaService',
    (c) => {
      const karmaRepository = c.resolve('karmaRepository');
      const logger = c.resolve<Logger>('logger');
      return new KarmaService(karmaRepository, logger);
    },
    'singleton'
  );

  return container;
}
