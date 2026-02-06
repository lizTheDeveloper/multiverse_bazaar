/**
 * Security headers middleware for the Multiverse Bazaar API.
 * Adds various security headers to protect against common vulnerabilities.
 */

import type { Context, MiddlewareHandler, Next } from 'hono';

/**
 * Configuration for security headers middleware.
 */
export interface SecurityHeadersConfig {
  /** Enable HSTS (Strict-Transport-Security) header */
  enableHSTS?: boolean;

  /** HSTS max age in seconds (default: 1 year) */
  hstsMaxAge?: number;

  /** Include subdomains in HSTS */
  hstsIncludeSubDomains?: boolean;

  /** Enable HSTS preload */
  hstsPreload?: boolean;

  /** Content Security Policy directives */
  contentSecurityPolicy?: string | false;

  /** Referrer Policy value */
  referrerPolicy?: string;

  /** X-Frame-Options value */
  frameOptions?: 'DENY' | 'SAMEORIGIN';
}

/**
 * Default Content Security Policy for API responses.
 * This is a strict policy suitable for JSON APIs.
 */
const DEFAULT_CSP = "default-src 'none'; frame-ancestors 'none'";

/**
 * Creates a security headers middleware with the specified configuration.
 *
 * @param config - Security headers configuration
 * @returns Hono middleware handler
 *
 * @example
 * ```typescript
 * app.use('*', securityHeaders({
 *   enableHSTS: true,
 *   contentSecurityPolicy: "default-src 'self'"
 * }));
 * ```
 */
export function securityHeaders(config: SecurityHeadersConfig = {}): MiddlewareHandler {
  const {
    enableHSTS = process.env.NODE_ENV === 'production',
    hstsMaxAge = 31536000, // 1 year
    hstsIncludeSubDomains = true,
    hstsPreload = true,
    contentSecurityPolicy = DEFAULT_CSP,
    referrerPolicy = 'strict-origin-when-cross-origin',
    frameOptions = 'DENY',
  } = config;

  return async (c: Context, next: Next) => {
    // X-Content-Type-Options: Prevents MIME type sniffing
    c.header('X-Content-Type-Options', 'nosniff');

    // X-Frame-Options: Prevents clickjacking attacks
    c.header('X-Frame-Options', frameOptions);

    // X-XSS-Protection: Enables browser XSS filter (legacy browsers)
    c.header('X-XSS-Protection', '1; mode=block');

    // Referrer-Policy: Controls how much referrer information is included
    c.header('Referrer-Policy', referrerPolicy);

    // Content-Security-Policy: Helps prevent XSS and other injection attacks
    if (contentSecurityPolicy !== false) {
      c.header('Content-Security-Policy', contentSecurityPolicy);
    }

    // Strict-Transport-Security: Forces HTTPS connections (production only)
    if (enableHSTS) {
      let hstsValue = `max-age=${hstsMaxAge}`;
      if (hstsIncludeSubDomains) {
        hstsValue += '; includeSubDomains';
      }
      if (hstsPreload) {
        hstsValue += '; preload';
      }
      c.header('Strict-Transport-Security', hstsValue);
    }

    // X-Permitted-Cross-Domain-Policies: Restricts cross-domain access
    c.header('X-Permitted-Cross-Domain-Policies', 'none');

    // X-Download-Options: Prevents Internet Explorer from executing downloads
    c.header('X-Download-Options', 'noopen');

    // X-DNS-Prefetch-Control: Controls DNS prefetching
    c.header('X-DNS-Prefetch-Control', 'off');

    // Permissions-Policy: Controls browser features and APIs
    c.header(
      'Permissions-Policy',
      'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()'
    );

    await next();
  };
}

/**
 * Creates a security headers middleware with production-ready defaults.
 * Includes HSTS, strict CSP, and all security headers enabled.
 *
 * @returns Hono middleware handler
 *
 * @example
 * ```typescript
 * if (process.env.NODE_ENV === 'production') {
 *   app.use('*', productionSecurityHeaders());
 * }
 * ```
 */
export function productionSecurityHeaders(): MiddlewareHandler {
  return securityHeaders({
    enableHSTS: true,
    hstsMaxAge: 31536000, // 1 year
    hstsIncludeSubDomains: true,
    hstsPreload: true,
    contentSecurityPolicy: DEFAULT_CSP,
    referrerPolicy: 'strict-origin-when-cross-origin',
    frameOptions: 'DENY',
  });
}

/**
 * Creates a security headers middleware with development-friendly defaults.
 * Excludes HSTS and uses relaxed policies suitable for local development.
 *
 * @returns Hono middleware handler
 *
 * @example
 * ```typescript
 * if (process.env.NODE_ENV === 'development') {
 *   app.use('*', developmentSecurityHeaders());
 * }
 * ```
 */
export function developmentSecurityHeaders(): MiddlewareHandler {
  return securityHeaders({
    enableHSTS: false,
    contentSecurityPolicy: DEFAULT_CSP,
    referrerPolicy: 'strict-origin-when-cross-origin',
    frameOptions: 'DENY',
  });
}
