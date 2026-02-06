/**
 * Example usage of security middleware.
 * This file demonstrates how to use the security middleware in a real application.
 */

import { Hono } from 'hono';
import { z } from 'zod';
import type { Context } from 'hono';
import {
  productionSecurityStack,
  developmentSecurityStack,
  loginRateLimiter,
  itemCreateRateLimiter,
  upvoteRateLimiter,
  searchRateLimiter,
  validateBody,
  validateQuery,
  validateParam,
  commonSchemas,
} from './index.js';

// Create Hono app
const app = new Hono();

// ============================================================================
// Apply Security Stack
// ============================================================================

// Choose security stack based on environment
const securityStack =
  process.env.NODE_ENV === 'production'
    ? productionSecurityStack(['https://app.multiversebazaar.com'])
    : developmentSecurityStack();

// Apply all security middleware
securityStack.forEach((middleware) => app.use('*', middleware));

// ============================================================================
// Authentication Routes
// ============================================================================

// Login schema
const loginSchema = z.object({
  email: commonSchemas.email,
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// Login endpoint with rate limiting and validation
app.post(
  '/api/v1/auth/login',
  loginRateLimiter(),
  validateBody(loginSchema),
  async (c: Context) => {
    const { email } = c.get('validatedBody');
    // const { email, password } = c.get('validatedBody');

    // Handle login logic
    // In a real app, you would verify the password here
    // ...

    return c.json({
      success: true,
      message: 'Login successful',
      data: {
        email,
        // token, user, etc.
      },
    });
  }
);

// Register schema
const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be 30 characters or less')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
  email: commonSchemas.email,
  password: z.string().min(8, 'Password must be at least 8 characters'),
  bio: commonSchemas.bio,
});

// Register endpoint with validation
app.post('/api/v1/auth/register', validateBody(registerSchema), async (c: Context) => {
  const data = c.get('validatedBody');

  // Handle registration logic
  // ...

  return c.json({
    success: true,
    message: 'Registration successful',
    data: {
      username: data.username,
      email: data.email,
    },
  });
});

// ============================================================================
// Item Routes
// ============================================================================

// Create item schema
const createItemSchema = z.object({
  title: commonSchemas.title,
  description: commonSchemas.description,
  url: commonSchemas.url.optional(),
  tags: z.array(z.string().max(30)).max(10, 'Maximum 10 tags allowed'),
  categoryId: commonSchemas.uuid,
});

// Create item endpoint with rate limiting and validation
app.post(
  '/api/v1/items',
  itemCreateRateLimiter(),
  validateBody(createItemSchema),
  async (c: Context) => {
    const data = c.get('validatedBody');

    // Handle item creation logic
    // ...

    return c.json({
      success: true,
      message: 'Item created successfully',
      data: {
        id: 'generated-uuid',
        ...data,
      },
    });
  }
);

// Update item schema
const updateItemSchema = z.object({
  title: commonSchemas.title.optional(),
  description: commonSchemas.description.optional(),
  url: commonSchemas.url.optional(),
  tags: z.array(z.string().max(30)).max(10).optional(),
});

// Update item endpoint with validation
app.patch(
  '/api/v1/items/:id',
  validateParam(z.object({ id: commonSchemas.uuid })),
  validateBody(updateItemSchema),
  async (c: Context) => {
    const { id } = c.get('validatedParam');
    const data = c.get('validatedBody');

    // Handle item update logic
    // ...

    return c.json({
      success: true,
      message: 'Item updated successfully',
      data: {
        id,
        ...data,
      },
    });
  }
);

// Get item endpoint with param validation
app.get('/api/v1/items/:id', validateParam(z.object({ id: commonSchemas.uuid })), async (c: Context) => {
  const { id } = c.get('validatedParam');

  // Handle get item logic
  // ...

  return c.json({
    success: true,
    data: {
      id,
      title: 'Example Item',
      description: 'This is an example item',
    },
  });
});

// ============================================================================
// Interaction Routes
// ============================================================================

// Upvote endpoint with rate limiting
app.post(
  '/api/v1/items/:id/upvote',
  upvoteRateLimiter(),
  validateParam(z.object({ id: commonSchemas.uuid })),
  async (c: Context) => {
    const { id } = c.get('validatedParam');

    // Handle upvote logic
    // ...

    return c.json({
      success: true,
      message: 'Item upvoted successfully',
      data: {
        itemId: id,
        upvotes: 42,
      },
    });
  }
);

// ============================================================================
// Search Routes
// ============================================================================

// Search schema
const searchSchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  category: commonSchemas.uuid.optional(),
  tags: z.string().optional(), // comma-separated tags
  limit: commonSchemas.paginationLimit,
  offset: commonSchemas.paginationOffset,
});

// Search endpoint with rate limiting and validation
app.get('/api/v1/search', searchRateLimiter(), validateQuery(searchSchema), async (c: Context) => {
  const query = c.get('validatedQuery');

  // Handle search logic
  // ...

  return c.json({
    success: true,
    data: {
      results: [],
      total: 0,
      limit: query.limit,
      offset: query.offset,
    },
  });
});

// ============================================================================
// File Upload Routes
// ============================================================================

// Note: File upload would typically use multipart/form-data
// This example shows the structure

// app.post(
//   '/api/v1/upload',
//   uploadRateLimiter(),
//   validateSize(5 * 1024 * 1024), // 5MB limit
//   async (c: Context) => {
//     // Handle file upload logic
//     // ...
//
//     return c.json({
//       success: true,
//       message: 'File uploaded successfully',
//       data: {
//         url: 'https://cdn.example.com/file.jpg',
//       },
//     });
//   }
// );

// ============================================================================
// Health Check
// ============================================================================

app.get('/health', (c: Context) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ============================================================================
// Error Handling Example
// ============================================================================

// 404 handler
app.notFound((c: Context) => {
  return c.json(
    {
      error: {
        message: 'Not found',
        path: c.req.path,
        timestamp: new Date().toISOString(),
      },
    },
    404
  );
});

// General error handler
app.onError((err, c: Context) => {
  console.error('Error:', err);

  return c.json(
    {
      error: {
        message: err.message || 'Internal server error',
        timestamp: new Date().toISOString(),
      },
    },
    500
  );
});

export default app;
