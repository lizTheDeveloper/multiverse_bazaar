/**
 * Integration tests for collaborator endpoints.
 * Tests inviting collaborators, accepting/declining invitations, and permissions.
 */

import { describe, it, expect } from 'vitest';
import { getTestApp, getTestToken, createTestUser, createTestProject, getTestDb } from './setup.js';

describe('Collaborators API', () => {
  describe('GET /api/v1/projects/:id/collaborators', () => {
    it('should list project collaborators', async () => {
      const app = getTestApp();
      const user = await createTestUser();
      const project = await createTestProject(user.id);

      const response = await app.request(`/api/v1/projects/${project.id}/collaborators`, {
        method: 'GET',
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('collaborators');
      expect(data.collaborators).toHaveLength(1);
      expect(data.collaborators[0]).toMatchObject({
        userId: user.id,
        projectId: project.id,
        role: 'CREATOR',
      });
    });

    it('should return empty array when no collaborators exist', async () => {
      const app = getTestApp();
      const db = getTestDb();
      const user = await createTestUser();

      // Create project without creator collaborator
      const project = await db.project.create({
        data: {
          title: 'No Collaborators',
          description: 'Test project',
        },
      });

      const response = await app.request(`/api/v1/projects/${project.id}/collaborators`, {
        method: 'GET',
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.collaborators).toEqual([]);
    });

    it('should return 404 for non-existent project', async () => {
      const app = getTestApp();

      const response = await app.request('/api/v1/projects/00000000-0000-0000-0000-000000000000/collaborators', {
        method: 'GET',
      });

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/v1/projects/:id/collaborators', () => {
    it('should invite existing user as collaborator (immediate)', async () => {
      const app = getTestApp();
      const { token, user: creator } = await getTestToken();
      const project = await createTestProject(creator.id);
      const invitee = await createTestUser('invitee@example.com');

      const response = await app.request(`/api/v1/projects/${project.id}/collaborators`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: 'invitee@example.com',
          role: 'CONTRIBUTOR',
        }),
      });

      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data).toHaveProperty('immediate');
      expect(data.immediate).toBe(true);
      expect(data).toHaveProperty('collaborator');
      expect(data.collaborator).toMatchObject({
        userId: invitee.id,
        projectId: project.id,
        role: 'CONTRIBUTOR',
      });
    });

    it('should create pending invitation for non-existing user', async () => {
      const app = getTestApp();
      const { token, user: creator } = await getTestToken();
      const project = await createTestProject(creator.id);

      const response = await app.request(`/api/v1/projects/${project.id}/collaborators`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: 'newuser@example.com',
          role: 'ADVISOR',
        }),
      });

      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data).toHaveProperty('immediate');
      expect(data.immediate).toBe(false);
      expect(data).toHaveProperty('invitationToken');
      expect(data).toHaveProperty('expiresAt');
    });

    it('should reject invitation from non-creator', async () => {
      const app = getTestApp();
      const creator = await createTestUser();
      const project = await createTestProject(creator.id);

      // Different user trying to invite
      const { token } = await getTestToken();

      const response = await app.request(`/api/v1/projects/${project.id}/collaborators`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: 'someone@example.com',
          role: 'CONTRIBUTOR',
        }),
      });

      expect(response.status).toBe(403);

      const data = await response.json();
      expect(data.error.code).toBe('FORBIDDEN');
    });

    it('should reject invitation without authentication', async () => {
      const app = getTestApp();
      const user = await createTestUser();
      const project = await createTestProject(user.id);

      const response = await app.request(`/api/v1/projects/${project.id}/collaborators`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'someone@example.com',
          role: 'CONTRIBUTOR',
        }),
      });

      expect(response.status).toBe(401);
    });

    it('should reject invitation with invalid role', async () => {
      const app = getTestApp();
      const { token, user } = await getTestToken();
      const project = await createTestProject(user.id);

      const response = await app.request(`/api/v1/projects/${project.id}/collaborators`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: 'someone@example.com',
          role: 'INVALID_ROLE',
        }),
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject duplicate invitation', async () => {
      const app = getTestApp();
      const { token, user: creator } = await getTestToken();
      const project = await createTestProject(creator.id);
      const invitee = await createTestUser('duplicate@example.com');

      // First invitation
      await app.request(`/api/v1/projects/${project.id}/collaborators`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: 'duplicate@example.com',
          role: 'CONTRIBUTOR',
        }),
      });

      // Duplicate invitation
      const response = await app.request(`/api/v1/projects/${project.id}/collaborators`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: 'duplicate@example.com',
          role: 'CONTRIBUTOR',
        }),
      });

      expect(response.status).toBe(409);

      const data = await response.json();
      expect(data.error.code).toBe('CONFLICT');
    });
  });

  describe('DELETE /api/v1/projects/:id/collaborators/:userId', () => {
    it('should remove collaborator when authenticated as creator', async () => {
      const app = getTestApp();
      const db = getTestDb();
      const { token, user: creator } = await getTestToken();
      const project = await createTestProject(creator.id);
      const collaborator = await createTestUser();

      // Add collaborator
      await db.collaborator.create({
        data: {
          userId: collaborator.id,
          projectId: project.id,
          role: 'CONTRIBUTOR',
        },
      });

      const response = await app.request(`/api/v1/projects/${project.id}/collaborators/${collaborator.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('message');
      expect(data.message).toBe('Collaborator removed successfully');

      // Verify collaborator is removed
      const removed = await db.collaborator.findFirst({
        where: {
          userId: collaborator.id,
          projectId: project.id,
        },
      });

      expect(removed).toBeNull();
    });

    it('should reject removal from non-creator', async () => {
      const app = getTestApp();
      const db = getTestDb();
      const creator = await createTestUser();
      const project = await createTestProject(creator.id);
      const collaborator = await createTestUser();

      await db.collaborator.create({
        data: {
          userId: collaborator.id,
          projectId: project.id,
          role: 'CONTRIBUTOR',
        },
      });

      // Different user trying to remove
      const { token } = await getTestToken();

      const response = await app.request(`/api/v1/projects/${project.id}/collaborators/${collaborator.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.status).toBe(403);
    });

    it('should reject removal of creator', async () => {
      const app = getTestApp();
      const { token, user: creator } = await getTestToken();
      const project = await createTestProject(creator.id);

      const response = await app.request(`/api/v1/projects/${project.id}/collaborators/${creator.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.status).toBe(403);

      const data = await response.json();
      expect(data.error.code).toBe('FORBIDDEN');
    });

    it('should return 404 when removing non-existent collaborator', async () => {
      const app = getTestApp();
      const { token, user } = await getTestToken();
      const project = await createTestProject(user.id);

      const response = await app.request(`/api/v1/projects/${project.id}/collaborators/00000000-0000-0000-0000-000000000000`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/v1/invitations/:token', () => {
    it('should get invitation details', async () => {
      const app = getTestApp();
      const db = getTestDb();
      const creator = await createTestUser('creator@example.com', 'Creator');
      const project = await createTestProject(creator.id, { title: 'Test Project' });

      // Create pending invitation
      const invitation = await db.pendingInvitation.create({
        data: {
          email: 'invited@example.com',
          invitedById: creator.id,
          projectId: project.id,
          role: 'CONTRIBUTOR',
          token: '12345678-1234-1234-1234-123456789012',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      const response = await app.request(`/api/v1/invitations/${invitation.token}`, {
        method: 'GET',
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('invitation');
      expect(data.invitation).toMatchObject({
        email: 'invited@example.com',
        role: 'CONTRIBUTOR',
      });
    });

    it('should return 404 for non-existent invitation', async () => {
      const app = getTestApp();

      const response = await app.request('/api/v1/invitations/00000000-0000-0000-0000-000000000000', {
        method: 'GET',
      });

      expect(response.status).toBe(404);
    });

    it('should return 404 for expired invitation', async () => {
      const app = getTestApp();
      const db = getTestDb();
      const creator = await createTestUser();
      const project = await createTestProject(creator.id);

      // Create expired invitation
      const invitation = await db.pendingInvitation.create({
        data: {
          email: 'expired@example.com',
          invitedById: creator.id,
          projectId: project.id,
          role: 'CONTRIBUTOR',
          token: '12345678-1234-1234-1234-123456789013',
          expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
        },
      });

      const response = await app.request(`/api/v1/invitations/${invitation.token}`, {
        method: 'GET',
      });

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/v1/invitations/:token/accept', () => {
    it('should accept invitation when authenticated', async () => {
      const app = getTestApp();
      const db = getTestDb();
      const creator = await createTestUser();
      const project = await createTestProject(creator.id);
      const { token: authToken, user: invitee } = await getTestToken('invitee@example.com');

      // Create pending invitation
      const invitation = await db.pendingInvitation.create({
        data: {
          email: 'invitee@example.com',
          invitedById: creator.id,
          projectId: project.id,
          role: 'CONTRIBUTOR',
          token: '12345678-1234-1234-1234-123456789014',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      const response = await app.request(`/api/v1/invitations/${invitation.token}/accept`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('collaborator');
      expect(data).toHaveProperty('project');
      expect(data.collaborator).toMatchObject({
        userId: invitee.id,
        projectId: project.id,
        role: 'CONTRIBUTOR',
      });
    });

    it('should reject accepting invitation without authentication', async () => {
      const app = getTestApp();
      const db = getTestDb();
      const creator = await createTestUser();
      const project = await createTestProject(creator.id);

      const invitation = await db.pendingInvitation.create({
        data: {
          email: 'test@example.com',
          invitedById: creator.id,
          projectId: project.id,
          role: 'CONTRIBUTOR',
          token: '12345678-1234-1234-1234-123456789015',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      const response = await app.request(`/api/v1/invitations/${invitation.token}/accept`, {
        method: 'POST',
      });

      expect(response.status).toBe(401);
    });

    it('should reject accepting already accepted invitation', async () => {
      const app = getTestApp();
      const db = getTestDb();
      const creator = await createTestUser();
      const project = await createTestProject(creator.id);
      const { token: authToken } = await getTestToken('invitee2@example.com');

      const invitation = await db.pendingInvitation.create({
        data: {
          email: 'invitee2@example.com',
          invitedById: creator.id,
          projectId: project.id,
          role: 'CONTRIBUTOR',
          token: '12345678-1234-1234-1234-123456789016',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          acceptedAt: new Date(), // Already accepted
        },
      });

      const response = await app.request(`/api/v1/invitations/${invitation.token}/accept`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(409);

      const data = await response.json();
      expect(data.error.code).toBe('CONFLICT');
    });
  });

  describe('POST /api/v1/invitations/:token/decline', () => {
    it('should decline invitation successfully', async () => {
      const app = getTestApp();
      const db = getTestDb();
      const creator = await createTestUser();
      const project = await createTestProject(creator.id);

      const invitation = await db.pendingInvitation.create({
        data: {
          email: 'decline@example.com',
          invitedById: creator.id,
          projectId: project.id,
          role: 'CONTRIBUTOR',
          token: '12345678-1234-1234-1234-123456789017',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      const response = await app.request(`/api/v1/invitations/${invitation.token}/decline`, {
        method: 'POST',
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('message');
      expect(data.message).toBe('Invitation declined successfully');

      // Verify invitation is marked as declined
      const updated = await db.pendingInvitation.findUnique({
        where: { id: invitation.id },
      });

      expect(updated?.declinedAt).toBeTruthy();
    });

    it('should return 404 for non-existent invitation', async () => {
      const app = getTestApp();

      const response = await app.request('/api/v1/invitations/00000000-0000-0000-0000-000000000000/decline', {
        method: 'POST',
      });

      expect(response.status).toBe(404);
    });
  });
});
