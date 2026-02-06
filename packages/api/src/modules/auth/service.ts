/**
 * Business logic layer for Authentication module.
 * Handles token generation, validation, and authentication workflows.
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Result, Ok, Err, isOk } from '@multiverse-bazaar/shared/types/result';
import {
  BaseError,
  NotFoundError,
  UnauthorizedError,
  RateLimitError,
  InternalError,
} from '@multiverse-bazaar/shared/types/errors';
import { AuthRepository } from './repository.js';
import { LoginResponse, RefreshResponse, TokenPayload, UserProfile } from './types.js';
import { Config } from '../../infra/config.js';
import { Logger } from '../../infra/logger.js';

/**
 * Rate limiting configuration
 */
const RATE_LIMIT_MAX_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MINUTES = 15;
const RATE_LIMIT_MAX_FAILED_BY_IP = 10;

/**
 * Token expiration defaults (in seconds)
 */
const ACCESS_TOKEN_EXPIRY_SECONDS = 15 * 60; // 15 minutes
const REFRESH_TOKEN_EXPIRY_SECONDS = 7 * 24 * 60 * 60; // 7 days

/**
 * Service for authentication operations
 * Handles login, token refresh, logout, and token validation
 */
export class AuthService {
  constructor(
    private readonly repository: AuthRepository,
    private readonly config: Config,
    private readonly logger: Logger
  ) {}

  /**
   * Authenticate a user by email and generate tokens
   * Creates a new user if one doesn't exist (email-only auth)
   *
   * @param email - User's email address
   * @param ip - IP address of the request (for rate limiting)
   * @param userAgent - User agent string (for audit logging)
   * @returns Result with LoginResponse or BaseError
   */
  async login(
    email: string,
    ip: string,
    userAgent?: string
  ): Promise<Result<LoginResponse, BaseError>> {
    try {
      // Check rate limiting by email
      const emailAttemptsResult = await this.repository.getRecentLoginAttempts(
        email,
        RATE_LIMIT_WINDOW_MINUTES
      );

      if (isOk(emailAttemptsResult) && emailAttemptsResult.value >= RATE_LIMIT_MAX_ATTEMPTS) {
        this.logger.warn({ email, ip }, 'Rate limit exceeded for email');
        return Err(
          new RateLimitError(
            'Too many login attempts. Please try again later.',
            RATE_LIMIT_WINDOW_MINUTES * 60
          )
        );
      }

      // Check rate limiting by IP
      const ipAttemptsResult = await this.repository.getRecentFailedAttemptsByIP(
        ip,
        RATE_LIMIT_WINDOW_MINUTES
      );

      if (isOk(ipAttemptsResult) && ipAttemptsResult.value >= RATE_LIMIT_MAX_FAILED_BY_IP) {
        this.logger.warn({ ip, email }, 'Rate limit exceeded for IP');
        return Err(
          new RateLimitError(
            'Too many failed login attempts from this IP. Please try again later.',
            RATE_LIMIT_WINDOW_MINUTES * 60
          )
        );
      }

      // Find or create user
      let userResult = await this.repository.findUserByEmail(email);

      if (!isOk(userResult)) {
        // User doesn't exist, create new user
        this.logger.info({ email }, 'Creating new user for first-time login');
        userResult = await this.repository.createUser(email);

        if (!isOk(userResult)) {
          await this.repository.recordLoginAttempt(email, false, ip, userAgent);
          return Err(userResult.error);
        }
      }

      const user = userResult.value;

      // Generate access token
      const accessToken = this.generateAccessToken(user);

      // Generate refresh token
      const refreshToken = this.generateRefreshToken();
      const refreshTokenHash = await this.hashToken(refreshToken);

      // Calculate refresh token expiration
      const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_SECONDS * 1000);

      // Store refresh token in database
      const storeResult = await this.repository.createRefreshToken(
        user.id,
        refreshTokenHash,
        expiresAt
      );

      if (!isOk(storeResult)) {
        await this.repository.recordLoginAttempt(email, false, ip, userAgent);
        return Err(storeResult.error);
      }

      // Record successful login attempt
      await this.repository.recordLoginAttempt(email, true, ip, userAgent);

      this.logger.info({ userId: user.id, email }, 'User logged in successfully');

      return Ok({
        accessToken,
        user,
      });
    } catch (error) {
      this.logger.error({ error, email }, 'Unexpected error during login');
      return Err(
        new InternalError('An unexpected error occurred during login', {
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Refresh an access token using a refresh token
   *
   * @param refreshToken - The refresh token
   * @returns Result with RefreshResponse or BaseError
   */
  async refresh(refreshToken: string): Promise<Result<RefreshResponse, BaseError>> {
    try {
      // Hash the refresh token to look it up
      const tokenHash = await this.hashToken(refreshToken);

      // Find the refresh token in database
      const tokenResult = await this.repository.findRefreshTokenByHash(tokenHash);

      if (!isOk(tokenResult)) {
        this.logger.warn('Invalid refresh token provided');
        return Err(new UnauthorizedError('Invalid refresh token'));
      }

      const storedToken = tokenResult.value;

      // Check if token is revoked
      if (storedToken.revokedAt !== null) {
        this.logger.warn({ tokenId: storedToken.id }, 'Attempted to use revoked refresh token');
        return Err(new UnauthorizedError('Refresh token has been revoked'));
      }

      // Check if token is expired
      if (storedToken.expiresAt < new Date()) {
        this.logger.warn({ tokenId: storedToken.id }, 'Attempted to use expired refresh token');
        return Err(new UnauthorizedError('Refresh token has expired'));
      }

      // Get user information by finding them via a query
      // We need to look up the user by ID to get their current email
      const user = await this.getUserById(storedToken.userId);

      if (!user) {
        return Err(new UnauthorizedError('User not found'));
      }

      // Generate new access token
      const accessToken = this.generateAccessToken(user);

      this.logger.info({ userId: user.id }, 'Access token refreshed successfully');

      return Ok({
        accessToken,
      });
    } catch (error) {
      this.logger.error({ error }, 'Unexpected error during token refresh');
      return Err(
        new InternalError('An unexpected error occurred during token refresh', {
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Logout a user by revoking all their refresh tokens
   *
   * @param userId - User ID to logout
   * @returns Result with void or BaseError
   */
  async logout(userId: string): Promise<Result<void, BaseError>> {
    try {
      const result = await this.repository.revokeAllUserTokens(userId);

      if (!isOk(result)) {
        return Err(result.error);
      }

      this.logger.info({ userId, tokensRevoked: result.value }, 'User logged out successfully');

      return Ok(undefined);
    } catch (error) {
      this.logger.error({ error, userId }, 'Unexpected error during logout');
      return Err(
        new InternalError('An unexpected error occurred during logout', {
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Validate a JWT access token
   *
   * @param token - JWT access token to validate
   * @returns Result with TokenPayload or UnauthorizedError
   */
  validateToken(token: string): Result<TokenPayload, UnauthorizedError> {
    try {
      const payload = jwt.verify(token, this.config.jwtSecret) as TokenPayload;

      // Verify required fields
      if (!payload.userId || !payload.email || !payload.iat || !payload.exp) {
        this.logger.warn({ payload }, 'Invalid token payload structure');
        return Err(new UnauthorizedError('Invalid token payload'));
      }

      return Ok(payload);
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        this.logger.warn({ error: error.message }, 'JWT validation failed');
        return Err(new UnauthorizedError('Invalid token'));
      }

      if (error instanceof jwt.TokenExpiredError) {
        this.logger.warn('Expired token provided');
        return Err(new UnauthorizedError('Token has expired'));
      }

      this.logger.error({ error }, 'Unexpected error during token validation');
      return Err(new UnauthorizedError('Token validation failed'));
    }
  }

  /**
   * Generate a JWT access token for a user
   *
   * @param user - User profile
   * @returns JWT access token string
   */
  private generateAccessToken(user: UserProfile): string {
    const payload: Omit<TokenPayload, 'iat' | 'exp'> = {
      userId: user.id,
      email: user.email,
    };

    return jwt.sign(payload, this.config.jwtSecret, {
      expiresIn: this.parseExpiresIn(this.config.jwtExpiresIn),
    });
  }

  /**
   * Generate a cryptographically secure refresh token
   *
   * @returns Random token string
   */
  private generateRefreshToken(): string {
    // Generate 32 bytes of random data and convert to hex
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Hash a token using bcrypt
   *
   * @param token - Token to hash
   * @returns Hashed token
   */
  private async hashToken(token: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(token, saltRounds);
  }

  /**
   * Get user by user ID (helper method)
   * Used when we need to fetch user details by ID
   *
   * @param userId - User ID
   * @returns UserProfile or null if not found
   */
  private async getUserById(userId: string): Promise<UserProfile | null> {
    try {
      const result = await this.repository.findUserById(userId);
      return isOk(result) ? result.value : null;
    } catch (error) {
      this.logger.error({ error, userId }, 'Error fetching user by ID');
      return null;
    }
  }

  /**
   * Parse expiration time string to seconds
   * Supports formats like '15m', '7d', '1h', or just seconds as string
   *
   * @param expiresIn - Expiration string
   * @returns Expiration in seconds
   */
  private parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])?$/);

    if (!match) {
      this.logger.warn({ expiresIn }, 'Invalid expiresIn format, using default');
      return ACCESS_TOKEN_EXPIRY_SECONDS;
    }

    const value = parseInt(match[1], 10);
    const unit = match[2] || 's';

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 24 * 60 * 60;
      default:
        return ACCESS_TOKEN_EXPIRY_SECONDS;
    }
  }
}
