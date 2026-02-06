/**
 * Karma module - Public API
 *
 * This module provides karma calculation functionality for users based on:
 * - Project upvotes weighted by their role (CREATOR: 1.0x, CONTRIBUTOR: 0.5x, ADVISOR: 0.25x)
 * - Featured project bonus (+10 karma per featured project created)
 *
 * Usage:
 * ```typescript
 * import { KarmaService, KarmaRepository } from './modules/karma';
 * import { db } from './infra/database';
 * import { getLogger } from './infra/logger';
 *
 * const karmaRepo = new KarmaRepository(db);
 * const karmaService = new KarmaService(karmaRepo, getLogger());
 *
 * // Calculate karma breakdown (without saving)
 * const breakdown = await karmaService.calculateUserKarma(userId);
 *
 * // Recalculate and save karma
 * const newKarma = await karmaService.recalculateAndSave(userId);
 *
 * // Recalculate karma for all project collaborators
 * const results = await karmaService.recalculateForProject(projectId);
 * ```
 *
 * Integration points:
 * - Call recalculateAndSave when upvotes are added/removed
 * - Call recalculateForProject when collaborators are added/removed
 * - Call recalculateForProject when a project's featured status changes
 */

// Export types
export {
  KarmaBreakdown,
  ProjectContribution,
  UserCollaboration,
  ProjectUpvoteCount,
  KarmaRecalculationResult,
  ROLE_MULTIPLIERS,
  FEATURED_BONUS,
} from './types.js';

// Export repository
export { KarmaRepository } from './repository.js';

// Export service
export { KarmaService } from './service.js';
