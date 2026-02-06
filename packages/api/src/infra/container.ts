/**
 * Dependency Injection container for the Multiverse Bazaar API.
 * Provides a simple, type-safe DI system with singleton and transient lifetimes.
 */

import { Config, getConfig } from './config.js';
import { Logger, getLogger } from './logger.js';

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

  // Register config as a singleton
  container.register<Config>(
    'config',
    () => getConfig(),
    'singleton'
  );

  // Register logger as a singleton
  container.register<Logger>(
    'logger',
    () => getLogger(),
    'singleton'
  );

  return container;
}
