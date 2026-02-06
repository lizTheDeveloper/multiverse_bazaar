/**
 * Tests for security middleware.
 * These tests verify the functionality of rate limiting, security headers, CORS, and input validation.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { z } from 'zod';
import {
  createRateLimiter,
  resetRateLimitStore,
  securityHeaders,
  cors,
  validateBody,
  commonSchemas,
} from '../index.js';

describe('Rate Limiting Middleware', () => {
  beforeEach(() => {
    resetRateLimitStore();
  });

  it('should allow requests under the limit', async () => {
    const app = new Hono();
    const limiter = createRateLimiter({
      windowMs: 60000, // 1 minute
      maxRequests: 5,
      keyGenerator: () => 'test-key',
    });

    app.get('/test', limiter, (c) => c.json({ success: true }));

    // Make 5 requests (should all succeed)
    for (let i = 0; i < 5; i++) {
      const res = await app.request('/test');
      expect(res.status).toBe(200);
      expect(res.headers.get('X-RateLimit-Limit')).toBe('5');
    }
  });

  it('should block requests over the limit', async () => {
    const app = new Hono();
    const limiter = createRateLimiter({
      windowMs: 60000,
      maxRequests: 3,
      keyGenerator: () => 'test-key',
    });

    app.get('/test', limiter, (c) => c.json({ success: true }));

    // Make 3 requests (should succeed)
    for (let i = 0; i < 3; i++) {
      const res = await app.request('/test');
      expect(res.status).toBe(200);
    }

    // 4th request should be blocked
    const res = await app.request('/test');
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBeTruthy();

    const body = await res.json();
    expect(body.error.message).toContain('Too many requests');
  });

  it('should include rate limit headers', async () => {
    const app = new Hono();
    const limiter = createRateLimiter({
      windowMs: 60000,
      maxRequests: 10,
      keyGenerator: () => 'test-key',
    });

    app.get('/test', limiter, (c) => c.json({ success: true }));

    const res = await app.request('/test');
    expect(res.headers.get('X-RateLimit-Limit')).toBe('10');
    expect(res.headers.get('X-RateLimit-Remaining')).toBe('9');
    expect(res.headers.get('X-RateLimit-Reset')).toBeTruthy();
  });
});

describe('Security Headers Middleware', () => {
  it('should add security headers to responses', async () => {
    const app = new Hono();
    app.use('*', securityHeaders());
    app.get('/test', (c) => c.json({ success: true }));

    const res = await app.request('/test');

    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(res.headers.get('X-Frame-Options')).toBe('DENY');
    expect(res.headers.get('X-XSS-Protection')).toBe('1; mode=block');
    expect(res.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    expect(res.headers.get('Content-Security-Policy')).toBeTruthy();
  });

  it('should add HSTS header when enabled', async () => {
    const app = new Hono();
    app.use(
      '*',
      securityHeaders({
        enableHSTS: true,
        hstsMaxAge: 31536000,
      })
    );
    app.get('/test', (c) => c.json({ success: true }));

    const res = await app.request('/test');

    const hsts = res.headers.get('Strict-Transport-Security');
    expect(hsts).toContain('max-age=31536000');
    expect(hsts).toContain('includeSubDomains');
  });

  it('should not add HSTS header when disabled', async () => {
    const app = new Hono();
    app.use(
      '*',
      securityHeaders({
        enableHSTS: false,
      })
    );
    app.get('/test', (c) => c.json({ success: true }));

    const res = await app.request('/test');

    expect(res.headers.get('Strict-Transport-Security')).toBeNull();
  });
});

describe('CORS Middleware', () => {
  it('should allow requests from allowed origins', async () => {
    const app = new Hono();
    app.use(
      '*',
      cors({
        allowedOrigins: ['https://example.com'],
        allowCredentials: true,
      })
    );
    app.get('/test', (c) => c.json({ success: true }));

    const res = await app.request('/test', {
      headers: {
        Origin: 'https://example.com',
      },
    });

    expect(res.status).toBe(200);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://example.com');
    expect(res.headers.get('Access-Control-Allow-Credentials')).toBe('true');
  });

  it('should block requests from disallowed origins', async () => {
    const app = new Hono();
    app.use(
      '*',
      cors({
        allowedOrigins: ['https://example.com'],
        allowCredentials: true,
      })
    );
    app.get('/test', (c) => c.json({ success: true }));

    const res = await app.request('/test', {
      headers: {
        Origin: 'https://evil.com',
      },
    });

    expect(res.status).toBe(403);

    const body = await res.json();
    expect(body.error.message).toContain('Origin not allowed');
  });

  it('should handle preflight requests', async () => {
    const app = new Hono();
    app.use(
      '*',
      cors({
        allowedOrigins: ['https://example.com'],
        allowedMethods: ['GET', 'POST'],
        allowedHeaders: ['Content-Type'],
        maxAge: 86400,
      })
    );
    app.get('/test', (c) => c.json({ success: true }));

    const res = await app.request('/test', {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://example.com',
      },
    });

    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET');
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
    expect(res.headers.get('Access-Control-Max-Age')).toBe('86400');
  });
});

describe('Input Validation Middleware', () => {
  it('should validate and sanitize request body', async () => {
    const app = new Hono();
    const schema = z.object({
      title: commonSchemas.title,
      email: commonSchemas.email,
    });

    app.post('/test', validateBody(schema), (c) => {
      const data = c.get('validatedBody');
      return c.json({ success: true, data });
    });

    const res = await app.request('/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: '  Test Title  ',
        email: 'TEST@EXAMPLE.COM',
      }),
    });

    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data.title).toBe('Test Title'); // Trimmed
    expect(body.data.email).toBe('test@example.com'); // Lowercase
  });

  it('should reject invalid data', async () => {
    const app = new Hono();
    const schema = z.object({
      email: commonSchemas.email,
      age: commonSchemas.positiveInt,
    });

    app.post('/test', validateBody(schema), (c) => {
      return c.json({ success: true });
    });

    const res = await app.request('/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'invalid-email',
        age: -5,
      }),
    });

    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error.message).toBe('Validation failed');
    expect(body.error.details).toHaveLength(2);
  });

  it('should sanitize HTML in strings', async () => {
    const app = new Hono();
    const schema = z.object({
      title: commonSchemas.title,
      description: commonSchemas.description,
    });

    app.post('/test', validateBody(schema), (c) => {
      const data = c.get('validatedBody');
      return c.json({ success: true, data });
    });

    const res = await app.request('/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: '<script>alert("xss")</script>Hello',
        description: '<b>Bold</b> text with <script>bad()</script>',
      }),
    });

    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data.title).not.toContain('<script>');
    expect(body.data.title).not.toContain('</script>');
    expect(body.data.description).not.toContain('<script>');
    expect(body.data.description).not.toContain('<b>');
  });

  it('should enforce string length limits', async () => {
    const app = new Hono();
    const schema = z.object({
      title: commonSchemas.title,
    });

    app.post('/test', validateBody(schema), (c) => {
      return c.json({ success: true });
    });

    const longTitle = 'a'.repeat(201); // Exceeds 200 char limit

    const res = await app.request('/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: longTitle,
      }),
    });

    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error.details[0].message).toContain('200 characters');
  });
});

describe('Common Schemas', () => {
  it('should validate UUIDs', () => {
    const validUuid = '123e4567-e89b-12d3-a456-426614174000';
    const invalidUuid = 'not-a-uuid';

    expect(commonSchemas.uuid.safeParse(validUuid).success).toBe(true);
    expect(commonSchemas.uuid.safeParse(invalidUuid).success).toBe(false);
  });

  it('should validate pagination parameters', () => {
    expect(commonSchemas.paginationLimit.parse(undefined)).toBe(20); // Default
    expect(commonSchemas.paginationLimit.parse(50)).toBe(50);
    expect(commonSchemas.paginationOffset.parse(undefined)).toBe(0); // Default
    expect(commonSchemas.paginationOffset.parse(100)).toBe(100);
  });

  it('should validate URLs', () => {
    const validUrl = 'https://example.com/path';
    const invalidUrl = 'not-a-url';

    expect(commonSchemas.url.safeParse(validUrl).success).toBe(true);
    expect(commonSchemas.url.safeParse(invalidUrl).success).toBe(false);
  });

  it('should validate allowed domain URLs', () => {
    const allowedDomainUrl = commonSchemas.allowedDomainUrl(['example.com', 'trusted.org']);

    expect(allowedDomainUrl.safeParse('https://example.com/path').success).toBe(true);
    expect(allowedDomainUrl.safeParse('https://trusted.org/path').success).toBe(true);
    expect(allowedDomainUrl.safeParse('https://evil.com/path').success).toBe(false);
  });
});
