# Security Middleware

Comprehensive security middleware for the Multiverse Bazaar API, providing rate limiting, security headers, CORS, and input validation.

## Table of Contents

- [Rate Limiting](#rate-limiting)
- [Security Headers](#security-headers)
- [CORS](#cors)
- [Input Validation](#input-validation)
- [Security Stack](#security-stack)

## Rate Limiting

Prevent abuse and ensure fair resource usage with in-memory rate limiting.

### Usage

```typescript
import {
  createRateLimiter,
  loginRateLimiter,
  itemCreateRateLimiter,
  upvoteRateLimiter,
  uploadRateLimiter,
  searchRateLimiter,
  generalRateLimiter,
} from './middleware/index.js';

// Apply general rate limiting to all routes
app.use('/api/v1/*', generalRateLimiter());

// Apply specific rate limiters to routes
app.post('/api/v1/auth/login', loginRateLimiter(), loginHandler);
app.post('/api/v1/items', itemCreateRateLimiter(), createItemHandler);
app.post('/api/v1/items/:id/upvote', upvoteRateLimiter(), upvoteHandler);
app.post('/api/v1/upload', uploadRateLimiter(), uploadHandler);
app.get('/api/v1/search', searchRateLimiter(), searchHandler);
```

### Custom Rate Limiter

```typescript
import { createRateLimiter } from './middleware/index.js';

const customRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  keyGenerator: (c) => {
    // Use user ID if authenticated, otherwise IP
    const userId = c.get('userId');
    if (userId) {
      return `custom:user:${userId}`;
    }
    const ip = c.req.header('X-Forwarded-For') || 'unknown';
    return `custom:ip:${ip}`;
  },
  message: 'Custom rate limit exceeded',
});

app.use('/api/v1/custom/*', customRateLimiter);
```

### Predefined Rate Limiters

| Limiter | Window | Max Requests | Key |
|---------|--------|--------------|-----|
| `loginRateLimiter` | 15 minutes | 5 | Email |
| `itemCreateRateLimiter` | 1 hour | 10 | User ID |
| `upvoteRateLimiter` | 1 minute | 60 | User ID |
| `uploadRateLimiter` | 1 hour | 20 | User ID |
| `searchRateLimiter` | 1 minute | 30 | User ID or IP |
| `generalRateLimiter` | 1 minute | 100 | IP |

### Response Headers

When rate limited, the following headers are included:

- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining in window
- `X-RateLimit-Reset`: Unix timestamp when limit resets
- `Retry-After`: Seconds until limit resets (when exceeded)

## Security Headers

Add security headers to protect against common vulnerabilities.

### Usage

```typescript
import {
  securityHeaders,
  productionSecurityHeaders,
  developmentSecurityHeaders,
} from './middleware/index.js';

// Apply security headers to all routes
app.use('*', securityHeaders());

// Or use environment-specific presets
if (process.env.NODE_ENV === 'production') {
  app.use('*', productionSecurityHeaders());
} else {
  app.use('*', developmentSecurityHeaders());
}
```

### Custom Configuration

```typescript
app.use('*', securityHeaders({
  enableHSTS: true,
  hstsMaxAge: 31536000, // 1 year
  hstsIncludeSubDomains: true,
  hstsPreload: true,
  contentSecurityPolicy: "default-src 'self'; script-src 'self' 'unsafe-inline'",
  referrerPolicy: 'strict-origin-when-cross-origin',
  frameOptions: 'DENY',
}));
```

### Headers Applied

- `X-Content-Type-Options: nosniff` - Prevents MIME type sniffing
- `X-Frame-Options: DENY` - Prevents clickjacking
- `X-XSS-Protection: 1; mode=block` - Enables browser XSS filter
- `Referrer-Policy: strict-origin-when-cross-origin` - Controls referrer information
- `Content-Security-Policy` - Prevents XSS and injection attacks
- `Strict-Transport-Security` - Forces HTTPS (production only)
- `Permissions-Policy` - Controls browser features

## CORS

Enhanced CORS middleware with strict validation and no wildcards in production.

### Usage

```typescript
import { cors, productionCors, developmentCors } from './middleware/index.js';

// Environment-specific CORS
if (process.env.NODE_ENV === 'production') {
  app.use('*', productionCors([
    'https://app.example.com',
    'https://admin.example.com',
  ]));
} else {
  app.use('*', developmentCors());
}
```

### Custom Configuration

```typescript
app.use('*', cors({
  allowedOrigins: ['https://app.example.com'],
  allowCredentials: true,
  allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  exposedHeaders: ['X-Request-ID', 'X-RateLimit-Limit'],
  maxAge: 86400, // 24 hours
  allowNoOrigin: false,
}));
```

### Features

- **No wildcards in production** - Throws error if `*` is used in production
- **Origin validation** - Blocks requests from unauthorized origins
- **Preflight caching** - Configurable preflight cache duration
- **Credentials support** - Allow cookies and authorization headers
- **Security logging** - Logs blocked CORS requests

## Input Validation

Zod-based validation with automatic sanitization and security checks.

### Usage

```typescript
import { z } from 'zod';
import {
  validateBody,
  validateQuery,
  validateParam,
  commonSchemas,
} from './middleware/index.js';

// Validate request body
const createItemSchema = z.object({
  title: commonSchemas.title,
  description: commonSchemas.description,
  tags: z.array(z.string()).max(10),
});

app.post(
  '/api/v1/items',
  validateBody(createItemSchema),
  async (c) => {
    const data = c.get('validatedBody');
    // data is fully typed and sanitized
  }
);

// Validate query parameters
const searchSchema = z.object({
  q: z.string().min(1),
  limit: commonSchemas.paginationLimit,
  offset: commonSchemas.paginationOffset,
});

app.get(
  '/api/v1/search',
  validateQuery(searchSchema),
  async (c) => {
    const query = c.get('validatedQuery');
    // query is fully typed
  }
);
```

### Common Schemas

Pre-built validation schemas for common patterns:

```typescript
import { commonSchemas } from './middleware/index.js';

// Titles (max 200 chars, trimmed, sanitized)
commonSchemas.title

// Descriptions (max 5000 chars, trimmed, sanitized)
commonSchemas.description

// Bios (max 5000 chars, trimmed, sanitized)
commonSchemas.bio

// Emails (normalized to lowercase)
commonSchemas.email

// URLs (validated format)
commonSchemas.url

// Domain-restricted URLs
commonSchemas.allowedDomainUrl(['example.com', 'trusted.com'])

// UUIDs
commonSchemas.uuid

// Positive integers
commonSchemas.positiveInt

// Non-negative integers
commonSchemas.nonNegativeInt

// Pagination
commonSchemas.paginationLimit  // default 20, max 100
commonSchemas.paginationOffset // default 0
```

### HTML Sanitization

All string values are automatically sanitized to prevent XSS:

- Removes `<script>` tags
- Removes `<style>` tags
- Removes `on*` event handlers
- Strips all HTML tags
- Decodes HTML entities

### Size Validation

Limit request size before processing:

```typescript
import { validateSize } from './middleware/index.js';

// Limit uploads to 5MB
app.post(
  '/api/v1/upload',
  validateSize(5 * 1024 * 1024),
  uploadHandler
);
```

## Security Stack

Compose multiple security middleware together.

### Usage

```typescript
import {
  createSecurityStack,
  productionSecurityStack,
  developmentSecurityStack,
} from './middleware/index.js';

// Environment-specific stack
if (process.env.NODE_ENV === 'production') {
  const stack = productionSecurityStack([
    'https://app.example.com',
    'https://admin.example.com',
  ]);
  stack.forEach(middleware => app.use('*', middleware));
} else {
  const stack = developmentSecurityStack();
  stack.forEach(middleware => app.use('*', middleware));
}
```

### Custom Stack

```typescript
const stack = createSecurityStack({
  cors: {
    allowedOrigins: ['https://app.example.com'],
    allowCredentials: true,
  },
  enableSecurityHeaders: true,
  enableRateLimiting: true,
});

stack.forEach(middleware => app.use('*', middleware));
```

### Stack Order

The security stack applies middleware in this order:

1. **Security Headers** - Applied first to all responses
2. **CORS** - Handle preflight and origin validation
3. **Rate Limiting** - Rate limit actual requests (after preflight)

## Complete Example

```typescript
import { Hono } from 'hono';
import { z } from 'zod';
import {
  productionSecurityStack,
  developmentSecurityStack,
  loginRateLimiter,
  itemCreateRateLimiter,
  validateBody,
  commonSchemas,
} from './middleware/index.js';

const app = new Hono();

// Apply security stack
const stack = process.env.NODE_ENV === 'production'
  ? productionSecurityStack(['https://app.example.com'])
  : developmentSecurityStack();

stack.forEach(middleware => app.use('*', middleware));

// Login endpoint with rate limiting
app.post(
  '/api/v1/auth/login',
  loginRateLimiter(),
  validateBody(z.object({
    email: commonSchemas.email,
    password: z.string().min(8),
  })),
  async (c) => {
    const { email, password } = c.get('validatedBody');
    // Handle login
  }
);

// Create item endpoint with rate limiting and validation
app.post(
  '/api/v1/items',
  itemCreateRateLimiter(),
  validateBody(z.object({
    title: commonSchemas.title,
    description: commonSchemas.description,
    url: commonSchemas.url.optional(),
  })),
  async (c) => {
    const data = c.get('validatedBody');
    // Handle item creation
  }
);

export default app;
```

## Testing

For testing purposes, you can reset the rate limit store:

```typescript
import { resetRateLimitStore } from './middleware/index.js';

beforeEach(() => {
  resetRateLimitStore();
});
```

## Security Best Practices

1. **Always use HTTPS in production** - HSTS headers enforce this
2. **Never use wildcard CORS origins** - The middleware enforces this
3. **Validate all inputs** - Use validation middleware on all routes
4. **Apply rate limiting** - Prevent abuse and DoS attacks
5. **Use environment-specific configs** - Production should be stricter
6. **Monitor security logs** - All violations are logged
7. **Keep dependencies updated** - Regular security updates
8. **Test security headers** - Use tools like SecurityHeaders.com
