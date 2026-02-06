/**
 * Data access layer for Authentication module.
 * Handles all database operations related to authentication.
 */

import { PrismaClient } from '@prisma/client';
import { Result, Ok, Err, NotFoundError, InternalError } from '@multiverse-bazaar/shared';
import { UserProfile } from './types.js';

/**
 * Repository for authentication-related database operations
 */
export class AuthRepository {
  constructor(private readonly db: PrismaClient) {}

  /**
   * Find a user by ID
   * @param id - User ID
   * @returns Result with user or NotFoundError
   */
  async findUserById(id: string): Promise<Result<UserProfile, NotFoundError | InternalError>> {
    try {
      const user = await this.db.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          bio: true,
          karma: true,
          createdAt: true,
        },
      });

      if (!user) {
        return Err(new NotFoundError('User'));
      }

      return Ok(user);
    } catch (error) {
      return Err(new InternalError('Failed to find user by ID', {
        id,
        error: error instanceof Error ? error.message : String(error),
      }));
    }
  }

  /**
   * Find a user by email address (includes passwordHash for authentication)
   * @param email - User's email address
   * @returns Result with user including passwordHash or NotFoundError
   */
  async findUserByEmail(email: string): Promise<Result<UserProfile & { passwordHash: string | null }, NotFoundError | InternalError>> {
    try {
      const user = await this.db.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          passwordHash: true,
          name: true,
          avatarUrl: true,
          bio: true,
          karma: true,
          createdAt: true,
        },
      });

      if (!user) {
        return Err(new NotFoundError('User'));
      }

      return Ok(user);
    } catch (error) {
      return Err(new InternalError('Failed to find user by email', {
        email,
        error: error instanceof Error ? error.message : String(error),
      }));
    }
  }

  /**
   * Create a new user with email and hashed password
   * @param email - User's email address
   * @param passwordHash - Bcrypt hashed password
   * @param name - Optional user name
   * @returns Result with created user or InternalError
   */
  async createUser(email: string, passwordHash: string, name?: string): Promise<Result<UserProfile, InternalError>> {
    try {
      const user = await this.db.user.create({
        data: {
          email,
          passwordHash,
          name,
        },
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          bio: true,
          karma: true,
          createdAt: true,
        },
      });

      return Ok(user);
    } catch (error) {
      return Err(new InternalError('Failed to create user', {
        email,
        error: error instanceof Error ? error.message : String(error),
      }));
    }
  }

  /**
   * Create a refresh token record in the database
   * @param userId - User ID
   * @param tokenHash - Hashed refresh token
   * @param expiresAt - Token expiration date
   * @returns Result with token ID or InternalError
   */
  async createRefreshToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date
  ): Promise<Result<string, InternalError>> {
    try {
      const token = await this.db.refreshToken.create({
        data: {
          userId,
          tokenHash,
          expiresAt,
        },
      });

      return Ok(token.id);
    } catch (error) {
      return Err(new InternalError('Failed to create refresh token', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      }));
    }
  }

  /**
   * Find a refresh token by its hash
   * @param hash - Token hash to look up
   * @returns Result with token data or NotFoundError
   */
  async findRefreshTokenByHash(hash: string): Promise<
    Result<
      { id: string; userId: string; expiresAt: Date; revokedAt: Date | null },
      NotFoundError | InternalError
    >
  > {
    try {
      const token = await this.db.refreshToken.findUnique({
        where: { tokenHash: hash },
        select: {
          id: true,
          userId: true,
          expiresAt: true,
          revokedAt: true,
        },
      });

      if (!token) {
        return Err(new NotFoundError('Refresh token'));
      }

      return Ok(token);
    } catch (error) {
      return Err(new InternalError('Failed to find refresh token', {
        error: error instanceof Error ? error.message : String(error),
      }));
    }
  }

  /**
   * Revoke a refresh token by ID
   * @param id - Token ID to revoke
   * @returns Result with void or InternalError
   */
  async revokeRefreshToken(id: string): Promise<Result<void, InternalError>> {
    try {
      await this.db.refreshToken.update({
        where: { id },
        data: { revokedAt: new Date() },
      });

      return Ok(undefined);
    } catch (error) {
      return Err(new InternalError('Failed to revoke refresh token', {
        tokenId: id,
        error: error instanceof Error ? error.message : String(error),
      }));
    }
  }

  /**
   * Revoke all refresh tokens for a user
   * @param userId - User ID
   * @returns Result with count of revoked tokens or InternalError
   */
  async revokeAllUserTokens(userId: string): Promise<Result<number, InternalError>> {
    try {
      const result = await this.db.refreshToken.updateMany({
        where: {
          userId,
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      });

      return Ok(result.count);
    } catch (error) {
      return Err(new InternalError('Failed to revoke user tokens', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      }));
    }
  }

  /**
   * Record a login attempt for security auditing and rate limiting
   * @param email - Email address of login attempt
   * @param success - Whether the login was successful
   * @param ip - IP address of the request
   * @param userAgent - User agent string (optional)
   * @returns Result with attempt ID or InternalError
   */
  async recordLoginAttempt(
    email: string,
    success: boolean,
    ip: string,
    userAgent?: string
  ): Promise<Result<string, InternalError>> {
    try {
      // Find user by email to associate attempt if they exist
      const user = await this.db.user.findUnique({
        where: { email },
        select: { id: true },
      });

      const attempt = await this.db.loginAttempt.create({
        data: {
          email,
          userId: user?.id,
          success,
          ip,
          userAgent,
        },
      });

      return Ok(attempt.id);
    } catch (error) {
      // Don't fail the login if we can't record the attempt
      // Just log it as an error
      return Err(new InternalError('Failed to record login attempt', {
        email,
        success,
        ip,
        error: error instanceof Error ? error.message : String(error),
      }));
    }
  }

  /**
   * Get recent login attempts for an email (for rate limiting)
   * @param email - Email address to check
   * @param minutesAgo - How many minutes back to check
   * @returns Result with attempt count or InternalError
   */
  async getRecentLoginAttempts(
    email: string,
    minutesAgo: number = 15
  ): Promise<Result<number, InternalError>> {
    try {
      const since = new Date(Date.now() - minutesAgo * 60 * 1000);

      const count = await this.db.loginAttempt.count({
        where: {
          email,
          createdAt: {
            gte: since,
          },
        },
      });

      return Ok(count);
    } catch (error) {
      return Err(new InternalError('Failed to get recent login attempts', {
        email,
        minutesAgo,
        error: error instanceof Error ? error.message : String(error),
      }));
    }
  }

  /**
   * Get recent failed login attempts by IP (for rate limiting)
   * @param ip - IP address to check
   * @param minutesAgo - How many minutes back to check
   * @returns Result with attempt count or InternalError
   */
  async getRecentFailedAttemptsByIP(
    ip: string,
    minutesAgo: number = 15
  ): Promise<Result<number, InternalError>> {
    try {
      const since = new Date(Date.now() - minutesAgo * 60 * 1000);

      const count = await this.db.loginAttempt.count({
        where: {
          ip,
          success: false,
          createdAt: {
            gte: since,
          },
        },
      });

      return Ok(count);
    } catch (error) {
      return Err(new InternalError('Failed to get recent failed attempts by IP', {
        ip,
        minutesAgo,
        error: error instanceof Error ? error.message : String(error),
      }));
    }
  }
}
