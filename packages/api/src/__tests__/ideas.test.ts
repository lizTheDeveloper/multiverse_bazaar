/**
 * Integration tests for idea endpoints.
 * Tests idea CRUD operations, expressing interest, and graduating ideas to projects.
 */

import { describe, it, expect } from 'vitest';
import { getTestApp, getTestToken, createTestUser, createTestIdea, createTestProject, getTestDb } from './setup.js';

describe('Ideas API', () => {
  describe('POST /api/v1/ideas', () => {
    it('should create an idea successfully when authenticated', async () => {
      const app = getTestApp();
      const { token } = await getTestToken();

      const response = await app.request('/api/v1/ideas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: 'My Brilliant Idea',
          description: 'This is a great idea for a project',
          lookingFor: 'Co-founder, Designer, Developer',
        }),
      });

      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data).toMatchObject({
        title: 'My Brilliant Idea',
        description: 'This is a great idea for a project',
        lookingFor: 'Co-founder, Designer, Developer',
        status: 'OPEN',
      });
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('creator');
      expect(data).toHaveProperty('createdAt');
    });

    it('should reject idea creation without authentication', async () => {
      const app = getTestApp();

      const response = await app.request('/api/v1/ideas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Unauthorized Idea',
          description: 'Should fail',
          lookingFor: 'Nobody',
        }),
      });

      expect(response.status).toBe(401);
    });

    it('should reject idea with missing required fields', async () => {
      const app = getTestApp();
      const { token } = await getTestToken();

      const response = await app.request('/api/v1/ideas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: 'Missing Fields',
          // description and lookingFor are required
        }),
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.fieldErrors).toBeDefined();
    });
  });

  describe('GET /api/v1/ideas', () => {
    it('should list ideas with pagination', async () => {
      const app = getTestApp();
      const user = await createTestUser();

      // Create multiple ideas
      await createTestIdea(user.id, { title: 'Idea 1' });
      await createTestIdea(user.id, { title: 'Idea 2' });
      await createTestIdea(user.id, { title: 'Idea 3' });

      const response = await app.request('/api/v1/ideas?page=1&limit=2', {
        method: 'GET',
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('ideas');
      expect(data).toHaveProperty('total');
      expect(data).toHaveProperty('page');
      expect(data).toHaveProperty('limit');
      expect(data).toHaveProperty('totalPages');

      expect(data.ideas).toHaveLength(2);
      expect(data.total).toBe(3);
      expect(data.page).toBe(1);
      expect(data.totalPages).toBe(2);
    });

    it('should filter ideas by status', async () => {
      const app = getTestApp();
      const user = await createTestUser();

      await createTestIdea(user.id, { status: 'OPEN' });
      await createTestIdea(user.id, { status: 'OPEN' });
      await createTestIdea(user.id, { status: 'CLOSED' });

      const response = await app.request('/api/v1/ideas?status=OPEN', {
        method: 'GET',
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.total).toBe(2);
      expect(data.ideas.every((i: any) => i.status === 'OPEN')).toBe(true);
    });

    it('should return empty array when no ideas exist', async () => {
      const app = getTestApp();

      const response = await app.request('/api/v1/ideas', {
        method: 'GET',
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.ideas).toEqual([]);
      expect(data.total).toBe(0);
    });
  });

  describe('GET /api/v1/ideas/:id', () => {
    it('should get idea details by ID', async () => {
      const app = getTestApp();
      const user = await createTestUser();
      const idea = await createTestIdea(user.id, {
        title: 'Detailed Idea',
        description: 'An idea with details',
      });

      const response = await app.request(`/api/v1/ideas/${idea.id}`, {
        method: 'GET',
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toMatchObject({
        id: idea.id,
        title: 'Detailed Idea',
        description: 'An idea with details',
      });
      expect(data).toHaveProperty('creator');
    });

    it('should return 404 for non-existent idea', async () => {
      const app = getTestApp();

      const response = await app.request('/api/v1/ideas/00000000-0000-0000-0000-000000000000', {
        method: 'GET',
      });

      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data.error.code).toBe('NOT_FOUND');
    });
  });

  describe('PATCH /api/v1/ideas/:id', () => {
    it('should update idea when authenticated as creator', async () => {
      const app = getTestApp();
      const { token, user } = await getTestToken();
      const idea = await createTestIdea(user.id, {
        title: 'Original Title',
        description: 'Original description',
      });

      const response = await app.request(`/api/v1/ideas/${idea.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: 'Updated Title',
          description: 'Updated description',
          status: 'CLOSED',
        }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toMatchObject({
        id: idea.id,
        title: 'Updated Title',
        description: 'Updated description',
        status: 'CLOSED',
      });
    });

    it('should reject update from non-creator user', async () => {
      const app = getTestApp();
      const creator = await createTestUser();
      const idea = await createTestIdea(creator.id);

      // Different user trying to update
      const { token } = await getTestToken();

      const response = await app.request(`/api/v1/ideas/${idea.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: 'Unauthorized Update',
        }),
      });

      expect(response.status).toBe(403);

      const data = await response.json();
      expect(data.error.code).toBe('FORBIDDEN');
    });

    it('should reject update without authentication', async () => {
      const app = getTestApp();
      const user = await createTestUser();
      const idea = await createTestIdea(user.id);

      const response = await app.request(`/api/v1/ideas/${idea.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Unauthorized Update',
        }),
      });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/v1/ideas/:id', () => {
    it('should delete idea when authenticated as creator', async () => {
      const app = getTestApp();
      const { token, user } = await getTestToken();
      const idea = await createTestIdea(user.id);

      const response = await app.request(`/api/v1/ideas/${idea.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('message');
      expect(data.message).toBe('Idea deleted successfully');
    });

    it('should reject deletion from non-creator user', async () => {
      const app = getTestApp();
      const creator = await createTestUser();
      const idea = await createTestIdea(creator.id);

      // Different user trying to delete
      const { token } = await getTestToken();

      const response = await app.request(`/api/v1/ideas/${idea.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/v1/ideas/:id/interest', () => {
    it('should express interest in an idea successfully', async () => {
      const app = getTestApp();
      const creator = await createTestUser();
      const idea = await createTestIdea(creator.id);
      const { token } = await getTestToken(); // Different user

      const response = await app.request(`/api/v1/ideas/${idea.id}/interest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: 'I would love to collaborate on this!',
        }),
      });

      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data).toHaveProperty('message');
      expect(data.message).toBe('Interest expressed successfully');
    });

    it('should allow expressing interest without a message', async () => {
      const app = getTestApp();
      const creator = await createTestUser();
      const idea = await createTestIdea(creator.id);
      const { token } = await getTestToken();

      const response = await app.request(`/api/v1/ideas/${idea.id}/interest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(201);
    });

    it('should reject interest in own idea', async () => {
      const app = getTestApp();
      const { token, user } = await getTestToken();
      const idea = await createTestIdea(user.id); // Same user as token

      const response = await app.request(`/api/v1/ideas/${idea.id}/interest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: 'Cannot express interest in my own idea',
        }),
      });

      expect(response.status).toBe(403);

      const data = await response.json();
      expect(data.error.code).toBe('FORBIDDEN');
    });

    it('should reject duplicate interest from same user', async () => {
      const app = getTestApp();
      const creator = await createTestUser();
      const idea = await createTestIdea(creator.id);
      const { token } = await getTestToken();

      // First interest
      await app.request(`/api/v1/ideas/${idea.id}/interest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      // Attempt duplicate interest
      const response = await app.request(`/api/v1/ideas/${idea.id}/interest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(409);

      const data = await response.json();
      expect(data.error.code).toBe('CONFLICT');
    });

    it('should reject interest without authentication', async () => {
      const app = getTestApp();
      const user = await createTestUser();
      const idea = await createTestIdea(user.id);

      const response = await app.request(`/api/v1/ideas/${idea.id}/interest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(401);
    });

    it('should create interest record in database', async () => {
      const app = getTestApp();
      const db = getTestDb();
      const creator = await createTestUser();
      const idea = await createTestIdea(creator.id);
      const { token, user } = await getTestToken();

      await app.request(`/api/v1/ideas/${idea.id}/interest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: 'Very interested!',
        }),
      });

      const interest = await db.ideaInterest.findFirst({
        where: {
          userId: user.id,
          ideaId: idea.id,
        },
      });

      expect(interest).toBeDefined();
      expect(interest?.message).toBe('Very interested!');
    });
  });

  describe('DELETE /api/v1/ideas/:id/interest', () => {
    it('should remove interest successfully', async () => {
      const app = getTestApp();
      const creator = await createTestUser();
      const idea = await createTestIdea(creator.id);
      const { token } = await getTestToken();

      // First, express interest
      await app.request(`/api/v1/ideas/${idea.id}/interest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      // Then remove interest
      const response = await app.request(`/api/v1/ideas/${idea.id}/interest`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('message');
      expect(data.message).toBe('Interest removed successfully');
    });

    it('should return 404 when removing non-existent interest', async () => {
      const app = getTestApp();
      const creator = await createTestUser();
      const idea = await createTestIdea(creator.id);
      const { token } = await getTestToken();

      const response = await app.request(`/api/v1/ideas/${idea.id}/interest`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/v1/ideas/:id/graduate', () => {
    it('should graduate idea to new project', async () => {
      const app = getTestApp();
      const { token, user } = await getTestToken();
      const idea = await createTestIdea(user.id);

      const response = await app.request(`/api/v1/ideas/${idea.id}/graduate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.status).toBe('GRADUATED');
      expect(data).toHaveProperty('graduatedToProjectId');
      expect(data.graduatedToProjectId).toBeTruthy();
    });

    it('should graduate idea to existing project', async () => {
      const app = getTestApp();
      const { token, user } = await getTestToken();
      const idea = await createTestIdea(user.id);
      const project = await createTestProject(user.id);

      const response = await app.request(`/api/v1/ideas/${idea.id}/graduate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId: project.id,
        }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.status).toBe('GRADUATED');
      expect(data.graduatedToProjectId).toBe(project.id);
    });

    it('should reject graduation from non-creator', async () => {
      const app = getTestApp();
      const creator = await createTestUser();
      const idea = await createTestIdea(creator.id);
      const { token } = await getTestToken(); // Different user

      const response = await app.request(`/api/v1/ideas/${idea.id}/graduate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(403);
    });

    it('should reject graduation of already graduated idea', async () => {
      const app = getTestApp();
      const { token, user } = await getTestToken();
      const idea = await createTestIdea(user.id);

      // Graduate the first time
      await app.request(`/api/v1/ideas/${idea.id}/graduate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      // Try to graduate again
      const response = await app.request(`/api/v1/ideas/${idea.id}/graduate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(409);

      const data = await response.json();
      expect(data.error.code).toBe('CONFLICT');
    });

    it('should reject graduation without authentication', async () => {
      const app = getTestApp();
      const user = await createTestUser();
      const idea = await createTestIdea(user.id);

      const response = await app.request(`/api/v1/ideas/${idea.id}/graduate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(401);
    });
  });
});
