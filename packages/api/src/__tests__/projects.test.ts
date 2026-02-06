/**
 * Integration tests for project endpoints.
 * Tests project CRUD operations, permissions, and pagination.
 */

import { describe, it, expect } from 'vitest';
import { getTestApp, getTestToken, createTestUser, createTestProject, getTestDb } from './setup.js';

describe('Projects API', () => {
  describe('POST /api/v1/projects', () => {
    it('should create a project successfully when authenticated', async () => {
      const app = getTestApp();
      const { token, user } = await getTestToken();

      const response = await app.request('/api/v1/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: 'My New Project',
          description: 'A project for testing',
          url: 'https://example.com',
          repoUrl: 'https://github.com/user/repo',
          imageUrl: 'https://example.com/image.png',
          status: 'BUILDING',
        }),
      });

      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data).toMatchObject({
        title: 'My New Project',
        description: 'A project for testing',
        url: 'https://example.com',
        repoUrl: 'https://github.com/user/repo',
        imageUrl: 'https://example.com/image.png',
        status: 'BUILDING',
      });
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('createdAt');
      expect(data).toHaveProperty('updatedAt');
    });

    it('should create creator collaborator when creating project', async () => {
      const app = getTestApp();
      const db = getTestDb();
      const { token, user } = await getTestToken();

      const response = await app.request('/api/v1/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: 'Test Project',
          description: 'Testing creator collaborator',
        }),
      });

      expect(response.status).toBe(201);

      const data = await response.json();

      // Check that creator collaborator was created
      const collaborator = await db.collaborator.findFirst({
        where: {
          projectId: data.id,
          userId: user.id,
          role: 'CREATOR',
        },
      });

      expect(collaborator).toBeDefined();
      expect(collaborator?.role).toBe('CREATOR');
    });

    it('should reject project creation without authentication', async () => {
      const app = getTestApp();

      const response = await app.request('/api/v1/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Unauthorized Project',
          description: 'Should fail',
        }),
      });

      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject project with missing required fields', async () => {
      const app = getTestApp();
      const { token } = await getTestToken();

      const response = await app.request('/api/v1/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: 'Missing Description',
          // description is required
        }),
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.fieldErrors).toBeDefined();
    });

    it('should reject project with invalid status', async () => {
      const app = getTestApp();
      const { token } = await getTestToken();

      const response = await app.request('/api/v1/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: 'Invalid Status',
          description: 'Testing invalid status',
          status: 'INVALID_STATUS',
        }),
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/v1/projects', () => {
    it('should list projects with pagination', async () => {
      const app = getTestApp();
      const user = await createTestUser();

      // Create multiple test projects
      await createTestProject(user.id, { title: 'Project 1' });
      await createTestProject(user.id, { title: 'Project 2' });
      await createTestProject(user.id, { title: 'Project 3' });

      const response = await app.request('/api/v1/projects?page=1&limit=2', {
        method: 'GET',
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('projects');
      expect(data).toHaveProperty('total');
      expect(data).toHaveProperty('page');
      expect(data).toHaveProperty('limit');
      expect(data).toHaveProperty('totalPages');

      expect(data.projects).toHaveLength(2);
      expect(data.total).toBe(3);
      expect(data.page).toBe(1);
      expect(data.limit).toBe(2);
      expect(data.totalPages).toBe(2);
    });

    it('should filter projects by status', async () => {
      const app = getTestApp();
      const user = await createTestUser();

      await createTestProject(user.id, { status: 'BUILDING' });
      await createTestProject(user.id, { status: 'BUILDING' });
      await createTestProject(user.id, { status: 'LAUNCHED' });

      const response = await app.request('/api/v1/projects?status=BUILDING', {
        method: 'GET',
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.total).toBe(2);
      expect(data.projects.every((p: any) => p.status === 'BUILDING')).toBe(true);
    });

    it('should filter projects by creator', async () => {
      const app = getTestApp();
      const user1 = await createTestUser();
      const user2 = await createTestUser();

      await createTestProject(user1.id);
      await createTestProject(user1.id);
      await createTestProject(user2.id);

      const response = await app.request(`/api/v1/projects?creatorId=${user1.id}`, {
        method: 'GET',
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.total).toBe(2);
    });

    it('should return empty array when no projects exist', async () => {
      const app = getTestApp();

      const response = await app.request('/api/v1/projects', {
        method: 'GET',
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.projects).toEqual([]);
      expect(data.total).toBe(0);
    });

    it('should reject invalid pagination parameters', async () => {
      const app = getTestApp();

      const response = await app.request('/api/v1/projects?page=-1&limit=1000', {
        method: 'GET',
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/v1/projects/:id', () => {
    it('should get project details by ID', async () => {
      const app = getTestApp();
      const user = await createTestUser();
      const project = await createTestProject(user.id, {
        title: 'Detailed Project',
        description: 'A project with details',
      });

      const response = await app.request(`/api/v1/projects/${project.id}`, {
        method: 'GET',
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toMatchObject({
        id: project.id,
        title: 'Detailed Project',
        description: 'A project with details',
      });
      expect(data).toHaveProperty('collaborators');
      expect(data).toHaveProperty('upvoteCount');
    });

    it('should return 404 for non-existent project', async () => {
      const app = getTestApp();

      const response = await app.request('/api/v1/projects/00000000-0000-0000-0000-000000000000', {
        method: 'GET',
      });

      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error.code).toBe('NOT_FOUND');
    });

    it('should return 400 for invalid project ID format', async () => {
      const app = getTestApp();

      const response = await app.request('/api/v1/projects/invalid-id', {
        method: 'GET',
      });

      expect(response.status).toBe(400);
    });
  });

  describe('PATCH /api/v1/projects/:id', () => {
    it('should update project when authenticated as creator', async () => {
      const app = getTestApp();
      const { token, user } = await getTestToken();
      const project = await createTestProject(user.id, {
        title: 'Original Title',
        description: 'Original description',
      });

      const response = await app.request(`/api/v1/projects/${project.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: 'Updated Title',
          description: 'Updated description',
          status: 'LAUNCHED',
        }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toMatchObject({
        id: project.id,
        title: 'Updated Title',
        description: 'Updated description',
        status: 'LAUNCHED',
      });
    });

    it('should allow partial updates', async () => {
      const app = getTestApp();
      const { token, user } = await getTestToken();
      const project = await createTestProject(user.id, {
        title: 'Original Title',
        description: 'Original description',
      });

      const response = await app.request(`/api/v1/projects/${project.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: 'Only Title Updated',
        }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.title).toBe('Only Title Updated');
      expect(data.description).toBe('Original description');
    });

    it('should reject update from non-creator user', async () => {
      const app = getTestApp();
      const creator = await createTestUser();
      const project = await createTestProject(creator.id);

      // Different user trying to update
      const { token } = await getTestToken();

      const response = await app.request(`/api/v1/projects/${project.id}`, {
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
      expect(data).toHaveProperty('error');
      expect(data.error.code).toBe('FORBIDDEN');
    });

    it('should reject update without authentication', async () => {
      const app = getTestApp();
      const user = await createTestUser();
      const project = await createTestProject(user.id);

      const response = await app.request(`/api/v1/projects/${project.id}`, {
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

    it('should return 404 when updating non-existent project', async () => {
      const app = getTestApp();
      const { token } = await getTestToken();

      const response = await app.request('/api/v1/projects/00000000-0000-0000-0000-000000000000', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: 'Does Not Exist',
        }),
      });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/v1/projects/:id', () => {
    it('should delete project when authenticated as creator', async () => {
      const app = getTestApp();
      const { token, user } = await getTestToken();
      const project = await createTestProject(user.id);

      const response = await app.request(`/api/v1/projects/${project.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('message');
      expect(data.message).toBe('Project deleted successfully');

      // Verify project is actually deleted
      const getResponse = await app.request(`/api/v1/projects/${project.id}`, {
        method: 'GET',
      });

      expect(getResponse.status).toBe(404);
    });

    it('should reject deletion from non-creator user', async () => {
      const app = getTestApp();
      const creator = await createTestUser();
      const project = await createTestProject(creator.id);

      // Different user trying to delete
      const { token } = await getTestToken();

      const response = await app.request(`/api/v1/projects/${project.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.status).toBe(403);

      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error.code).toBe('FORBIDDEN');
    });

    it('should reject deletion without authentication', async () => {
      const app = getTestApp();
      const user = await createTestUser();
      const project = await createTestProject(user.id);

      const response = await app.request(`/api/v1/projects/${project.id}`, {
        method: 'DELETE',
      });

      expect(response.status).toBe(401);
    });

    it('should return 404 when deleting non-existent project', async () => {
      const app = getTestApp();
      const { token } = await getTestToken();

      const response = await app.request('/api/v1/projects/00000000-0000-0000-0000-000000000000', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.status).toBe(404);
    });
  });
});
