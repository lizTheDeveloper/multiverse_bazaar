/**
 * Integration tests for upvote endpoints.
 * Tests upvoting projects, removing upvotes, and upvote count tracking.
 */

import { describe, it, expect } from 'vitest';
import { getTestApp, getTestToken, createTestUser, createTestProject, getTestDb } from './setup.js';

describe('Upvotes API', () => {
  describe('POST /api/v1/projects/:id/upvote', () => {
    it('should upvote a project successfully when authenticated', async () => {
      const app = getTestApp();
      const creator = await createTestUser();
      const project = await createTestProject(creator.id);
      const { token } = await getTestToken(); // Different user

      const response = await app.request(`/api/v1/projects/${project.id}/upvote`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('upvoted');
      expect(data).toHaveProperty('count');
      expect(data.upvoted).toBe(true);
      expect(data.count).toBe(1);
    });

    it('should increment upvote count correctly', async () => {
      const app = getTestApp();
      const creator = await createTestUser();
      const project = await createTestProject(creator.id);

      // Two different users upvote
      const { token: token1 } = await getTestToken();
      const { token: token2 } = await getTestToken();

      await app.request(`/api/v1/projects/${project.id}/upvote`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token1}` },
      });

      const response = await app.request(`/api/v1/projects/${project.id}/upvote`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token2}` },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.count).toBe(2);
    });

    it('should reject duplicate upvote from same user', async () => {
      const app = getTestApp();
      const creator = await createTestUser();
      const project = await createTestProject(creator.id);
      const { token } = await getTestToken();

      // First upvote
      await app.request(`/api/v1/projects/${project.id}/upvote`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      // Attempt duplicate upvote
      const response = await app.request(`/api/v1/projects/${project.id}/upvote`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.status).toBe(409);

      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error.code).toBe('CONFLICT');
    });

    it('should reject upvote without authentication', async () => {
      const app = getTestApp();
      const user = await createTestUser();
      const project = await createTestProject(user.id);

      const response = await app.request(`/api/v1/projects/${project.id}/upvote`, {
        method: 'POST',
      });

      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 404 for non-existent project', async () => {
      const app = getTestApp();
      const { token } = await getTestToken();

      const response = await app.request('/api/v1/projects/00000000-0000-0000-0000-000000000000/upvote', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error.code).toBe('NOT_FOUND');
    });

    it('should create upvote record in database', async () => {
      const app = getTestApp();
      const db = getTestDb();
      const creator = await createTestUser();
      const project = await createTestProject(creator.id);
      const { token, user } = await getTestToken();

      await app.request(`/api/v1/projects/${project.id}/upvote`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      // Verify upvote exists in database
      const upvote = await db.upvote.findFirst({
        where: {
          userId: user.id,
          projectId: project.id,
        },
      });

      expect(upvote).toBeDefined();
      expect(upvote?.userId).toBe(user.id);
      expect(upvote?.projectId).toBe(project.id);
    });
  });

  describe('DELETE /api/v1/projects/:id/upvote', () => {
    it('should remove upvote successfully', async () => {
      const app = getTestApp();
      const creator = await createTestUser();
      const project = await createTestProject(creator.id);
      const { token } = await getTestToken();

      // First, upvote the project
      await app.request(`/api/v1/projects/${project.id}/upvote`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      // Then remove the upvote
      const response = await app.request(`/api/v1/projects/${project.id}/upvote`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('upvoted');
      expect(data).toHaveProperty('count');
      expect(data.upvoted).toBe(false);
      expect(data.count).toBe(0);
    });

    it('should decrement upvote count correctly', async () => {
      const app = getTestApp();
      const creator = await createTestUser();
      const project = await createTestProject(creator.id);

      const { token: token1 } = await getTestToken();
      const { token: token2 } = await getTestToken();

      // Both users upvote
      await app.request(`/api/v1/projects/${project.id}/upvote`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token1}` },
      });

      await app.request(`/api/v1/projects/${project.id}/upvote`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token2}` },
      });

      // First user removes upvote
      const response = await app.request(`/api/v1/projects/${project.id}/upvote`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token1}` },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.count).toBe(1);
    });

    it('should return 404 when removing non-existent upvote', async () => {
      const app = getTestApp();
      const creator = await createTestUser();
      const project = await createTestProject(creator.id);
      const { token } = await getTestToken();

      // Try to remove upvote without upvoting first
      const response = await app.request(`/api/v1/projects/${project.id}/upvote`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error.code).toBe('NOT_FOUND');
    });

    it('should reject remove upvote without authentication', async () => {
      const app = getTestApp();
      const user = await createTestUser();
      const project = await createTestProject(user.id);

      const response = await app.request(`/api/v1/projects/${project.id}/upvote`, {
        method: 'DELETE',
      });

      expect(response.status).toBe(401);
    });

    it('should delete upvote record from database', async () => {
      const app = getTestApp();
      const db = getTestDb();
      const creator = await createTestUser();
      const project = await createTestProject(creator.id);
      const { token, user } = await getTestToken();

      // Create upvote
      await app.request(`/api/v1/projects/${project.id}/upvote`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      // Remove upvote
      await app.request(`/api/v1/projects/${project.id}/upvote`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      // Verify upvote is deleted from database
      const upvote = await db.upvote.findFirst({
        where: {
          userId: user.id,
          projectId: project.id,
        },
      });

      expect(upvote).toBeNull();
    });
  });

  describe('Upvote tracking in project details', () => {
    it('should include upvote count in project details', async () => {
      const app = getTestApp();
      const creator = await createTestUser();
      const project = await createTestProject(creator.id);

      // Create some upvotes
      const { token: token1 } = await getTestToken();
      const { token: token2 } = await getTestToken();

      await app.request(`/api/v1/projects/${project.id}/upvote`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token1}` },
      });

      await app.request(`/api/v1/projects/${project.id}/upvote`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token2}` },
      });

      // Get project details
      const response = await app.request(`/api/v1/projects/${project.id}`, {
        method: 'GET',
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('upvoteCount');
      expect(data.upvoteCount).toBe(2);
    });

    it('should show hasUpvoted status when authenticated', async () => {
      const app = getTestApp();
      const creator = await createTestUser();
      const project = await createTestProject(creator.id);
      const { token, user } = await getTestToken();

      // Upvote the project
      await app.request(`/api/v1/projects/${project.id}/upvote`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      // Get project details
      const response = await app.request(`/api/v1/projects/${project.id}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('hasUpvoted');
      expect(data.hasUpvoted).toBe(true);
    });

    it('should show hasUpvoted as false when not upvoted', async () => {
      const app = getTestApp();
      const creator = await createTestUser();
      const project = await createTestProject(creator.id);
      const { token } = await getTestToken();

      // Get project details without upvoting
      const response = await app.request(`/api/v1/projects/${project.id}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('hasUpvoted');
      expect(data.hasUpvoted).toBe(false);
    });

    it('should not include hasUpvoted when not authenticated', async () => {
      const app = getTestApp();
      const creator = await createTestUser();
      const project = await createTestProject(creator.id);

      const response = await app.request(`/api/v1/projects/${project.id}`, {
        method: 'GET',
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      // hasUpvoted may be false or undefined when not authenticated
      expect(data.hasUpvoted === false || data.hasUpvoted === undefined).toBe(true);
    });
  });

  describe('Upvote edge cases', () => {
    it('should handle concurrent upvotes correctly', async () => {
      const app = getTestApp();
      const creator = await createTestUser();
      const project = await createTestProject(creator.id);
      const { token } = await getTestToken();

      // Attempt multiple concurrent upvotes from same user
      const promises = [
        app.request(`/api/v1/projects/${project.id}/upvote`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }),
        app.request(`/api/v1/projects/${project.id}/upvote`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }),
        app.request(`/api/v1/projects/${project.id}/upvote`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }),
      ];

      const responses = await Promise.all(promises);

      // One should succeed, others should fail with conflict
      const successful = responses.filter(r => r.status === 200).length;
      const conflicts = responses.filter(r => r.status === 409).length;

      expect(successful).toBe(1);
      expect(conflicts).toBe(2);
    });

    it('should allow upvote after removing previous upvote', async () => {
      const app = getTestApp();
      const creator = await createTestUser();
      const project = await createTestProject(creator.id);
      const { token } = await getTestToken();

      // Upvote
      await app.request(`/api/v1/projects/${project.id}/upvote`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      // Remove upvote
      await app.request(`/api/v1/projects/${project.id}/upvote`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      // Upvote again
      const response = await app.request(`/api/v1/projects/${project.id}/upvote`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.upvoted).toBe(true);
      expect(data.count).toBe(1);
    });
  });
});
