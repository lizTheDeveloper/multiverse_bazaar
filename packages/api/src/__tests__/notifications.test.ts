/**
 * Integration tests for notification endpoints.
 * Tests listing notifications, marking as read, and push token registration.
 */

import { describe, it, expect } from 'vitest';
import { getTestApp, getTestToken, createTestUser, getTestDb } from './setup.js';

describe('Notifications API', () => {
  describe('GET /api/v1/notifications', () => {
    it('should list user notifications with pagination', async () => {
      const app = getTestApp();
      const db = getTestDb();
      const { token, user } = await getTestToken();

      // Create test notifications
      await db.notification.create({
        data: {
          userId: user.id,
          type: 'UPVOTE',
          title: 'New upvote',
          body: 'Someone upvoted your project',
          read: false,
        },
      });

      await db.notification.create({
        data: {
          userId: user.id,
          type: 'COLLABORATION_INVITE',
          title: 'Collaboration invite',
          body: 'You were invited to collaborate',
          read: false,
        },
      });

      const response = await app.request('/api/v1/notifications', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('notifications');
      expect(data).toHaveProperty('total');
      expect(data).toHaveProperty('page');
      expect(data).toHaveProperty('limit');

      expect(data.notifications).toHaveLength(2);
      expect(data.total).toBe(2);
    });

    it('should filter unread notifications when unreadOnly=true', async () => {
      const app = getTestApp();
      const db = getTestDb();
      const { token, user } = await getTestToken();

      // Create read and unread notifications
      await db.notification.create({
        data: {
          userId: user.id,
          type: 'UPVOTE',
          title: 'Read notification',
          body: 'Already read',
          read: true,
        },
      });

      await db.notification.create({
        data: {
          userId: user.id,
          type: 'UPVOTE',
          title: 'Unread notification',
          body: 'Not yet read',
          read: false,
        },
      });

      const response = await app.request('/api/v1/notifications?unreadOnly=true', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.total).toBe(1);
      expect(data.notifications.every((n: any) => !n.read)).toBe(true);
    });

    it('should only return notifications for authenticated user', async () => {
      const app = getTestApp();
      const db = getTestDb();
      const user1 = await createTestUser();
      const { token, user: user2 } = await getTestToken();

      // Create notifications for different users
      await db.notification.create({
        data: {
          userId: user1.id,
          type: 'UPVOTE',
          title: 'User 1 notification',
          body: 'For user 1',
          read: false,
        },
      });

      await db.notification.create({
        data: {
          userId: user2.id,
          type: 'UPVOTE',
          title: 'User 2 notification',
          body: 'For user 2',
          read: false,
        },
      });

      const response = await app.request('/api/v1/notifications', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.total).toBe(1);
      expect(data.notifications[0].userId).toBe(user2.id);
    });

    it('should reject listing notifications without authentication', async () => {
      const app = getTestApp();

      const response = await app.request('/api/v1/notifications', {
        method: 'GET',
      });

      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('should handle pagination correctly', async () => {
      const app = getTestApp();
      const db = getTestDb();
      const { token, user } = await getTestToken();

      // Create multiple notifications
      for (let i = 0; i < 5; i++) {
        await db.notification.create({
          data: {
            userId: user.id,
            type: 'UPVOTE',
            title: `Notification ${i}`,
            body: `Body ${i}`,
            read: false,
          },
        });
      }

      const response = await app.request('/api/v1/notifications?page=1&limit=2', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.notifications).toHaveLength(2);
      expect(data.total).toBe(5);
      expect(data.page).toBe(1);
      expect(data.limit).toBe(2);
      expect(data.totalPages).toBe(3);
    });

    it('should return empty array when no notifications exist', async () => {
      const app = getTestApp();
      const { token } = await getTestToken();

      const response = await app.request('/api/v1/notifications', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.notifications).toEqual([]);
      expect(data.total).toBe(0);
    });
  });

  describe('PATCH /api/v1/notifications/:id/read', () => {
    it('should mark notification as read', async () => {
      const app = getTestApp();
      const db = getTestDb();
      const { token, user } = await getTestToken();

      const notification = await db.notification.create({
        data: {
          userId: user.id,
          type: 'UPVOTE',
          title: 'Test notification',
          body: 'Test body',
          read: false,
        },
      });

      const response = await app.request(`/api/v1/notifications/${notification.id}/read`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);

      // Verify notification is marked as read
      const updated = await db.notification.findUnique({
        where: { id: notification.id },
      });

      expect(updated?.read).toBe(true);
    });

    it('should reject marking notification from another user', async () => {
      const app = getTestApp();
      const db = getTestDb();
      const user1 = await createTestUser();
      const { token } = await getTestToken(); // Different user

      const notification = await db.notification.create({
        data: {
          userId: user1.id,
          type: 'UPVOTE',
          title: 'User 1 notification',
          body: 'Test',
          read: false,
        },
      });

      const response = await app.request(`/api/v1/notifications/${notification.id}/read`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.status).toBe(403);

      const data = await response.json();
      expect(data.error.code).toBe('FORBIDDEN');
    });

    it('should reject without authentication', async () => {
      const app = getTestApp();

      const response = await app.request('/api/v1/notifications/00000000-0000-0000-0000-000000000000/read', {
        method: 'PATCH',
      });

      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent notification', async () => {
      const app = getTestApp();
      const { token } = await getTestToken();

      const response = await app.request('/api/v1/notifications/00000000-0000-0000-0000-000000000000/read', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/v1/notifications/read-all', () => {
    it('should mark all notifications as read', async () => {
      const app = getTestApp();
      const db = getTestDb();
      const { token, user } = await getTestToken();

      // Create multiple unread notifications
      await db.notification.create({
        data: {
          userId: user.id,
          type: 'UPVOTE',
          title: 'Notification 1',
          body: 'Test',
          read: false,
        },
      });

      await db.notification.create({
        data: {
          userId: user.id,
          type: 'UPVOTE',
          title: 'Notification 2',
          body: 'Test',
          read: false,
        },
      });

      const response = await app.request('/api/v1/notifications/read-all', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);

      // Verify all notifications are marked as read
      const notifications = await db.notification.findMany({
        where: { userId: user.id },
      });

      expect(notifications.every(n => n.read)).toBe(true);
    });

    it('should only mark current user notifications as read', async () => {
      const app = getTestApp();
      const db = getTestDb();
      const user1 = await createTestUser();
      const { token, user: user2 } = await getTestToken();

      // Create notifications for both users
      await db.notification.create({
        data: {
          userId: user1.id,
          type: 'UPVOTE',
          title: 'User 1 notification',
          body: 'Test',
          read: false,
        },
      });

      await db.notification.create({
        data: {
          userId: user2.id,
          type: 'UPVOTE',
          title: 'User 2 notification',
          body: 'Test',
          read: false,
        },
      });

      await app.request('/api/v1/notifications/read-all', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Verify only user2's notifications are read
      const user1Notifications = await db.notification.findMany({
        where: { userId: user1.id },
      });

      const user2Notifications = await db.notification.findMany({
        where: { userId: user2.id },
      });

      expect(user1Notifications.every(n => !n.read)).toBe(true);
      expect(user2Notifications.every(n => n.read)).toBe(true);
    });

    it('should reject without authentication', async () => {
      const app = getTestApp();

      const response = await app.request('/api/v1/notifications/read-all', {
        method: 'POST',
      });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/notifications/unread-count', () => {
    it('should return unread notification count', async () => {
      const app = getTestApp();
      const db = getTestDb();
      const { token, user } = await getTestToken();

      // Create read and unread notifications
      await db.notification.create({
        data: {
          userId: user.id,
          type: 'UPVOTE',
          title: 'Read',
          body: 'Test',
          read: true,
        },
      });

      await db.notification.create({
        data: {
          userId: user.id,
          type: 'UPVOTE',
          title: 'Unread 1',
          body: 'Test',
          read: false,
        },
      });

      await db.notification.create({
        data: {
          userId: user.id,
          type: 'UPVOTE',
          title: 'Unread 2',
          body: 'Test',
          read: false,
        },
      });

      const response = await app.request('/api/v1/notifications/unread-count', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('count');
      expect(data.count).toBe(2);
    });

    it('should return 0 when no unread notifications', async () => {
      const app = getTestApp();
      const { token } = await getTestToken();

      const response = await app.request('/api/v1/notifications/unread-count', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.count).toBe(0);
    });

    it('should reject without authentication', async () => {
      const app = getTestApp();

      const response = await app.request('/api/v1/notifications/unread-count', {
        method: 'GET',
      });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/notifications/push-token', () => {
    it('should register push token for iOS', async () => {
      const app = getTestApp();
      const { token, user } = await getTestToken();

      const response = await app.request('/api/v1/notifications/push-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          token: 'ios-push-token-12345',
          platform: 'IOS',
        }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);

      // Verify token is stored
      const db = getTestDb();
      const pushToken = await db.pushToken.findFirst({
        where: {
          userId: user.id,
          token: 'ios-push-token-12345',
          platform: 'IOS',
        },
      });

      expect(pushToken).toBeDefined();
    });

    it('should register push token for Android', async () => {
      const app = getTestApp();
      const { token, user } = await getTestToken();

      const response = await app.request('/api/v1/notifications/push-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          token: 'android-push-token-12345',
          platform: 'ANDROID',
        }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('should update existing push token', async () => {
      const app = getTestApp();
      const db = getTestDb();
      const { token, user } = await getTestToken();

      // Register token first time
      await app.request('/api/v1/notifications/push-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          token: 'same-token-123',
          platform: 'IOS',
        }),
      });

      // Register same token again
      const response = await app.request('/api/v1/notifications/push-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          token: 'same-token-123',
          platform: 'IOS',
        }),
      });

      expect(response.status).toBe(200);

      // Should only have one record for this token
      const tokens = await db.pushToken.findMany({
        where: {
          userId: user.id,
          token: 'same-token-123',
        },
      });

      expect(tokens).toHaveLength(1);
    });

    it('should reject registration without authentication', async () => {
      const app = getTestApp();

      const response = await app.request('/api/v1/notifications/push-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: 'test-token',
          platform: 'IOS',
        }),
      });

      expect(response.status).toBe(401);
    });

    it('should reject registration with invalid platform', async () => {
      const app = getTestApp();
      const { token } = await getTestToken();

      const response = await app.request('/api/v1/notifications/push-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          token: 'test-token',
          platform: 'INVALID',
        }),
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject registration without token', async () => {
      const app = getTestApp();
      const { token } = await getTestToken();

      const response = await app.request('/api/v1/notifications/push-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          platform: 'IOS',
        }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/v1/notifications/push-token', () => {
    it('should unregister push token', async () => {
      const app = getTestApp();
      const db = getTestDb();
      const { token, user } = await getTestToken();

      // Register token first
      await db.pushToken.create({
        data: {
          userId: user.id,
          token: 'token-to-delete',
          platform: 'IOS',
        },
      });

      const response = await app.request('/api/v1/notifications/push-token', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          token: 'token-to-delete',
        }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);

      // Verify token is deleted
      const deletedToken = await db.pushToken.findFirst({
        where: {
          userId: user.id,
          token: 'token-to-delete',
        },
      });

      expect(deletedToken).toBeNull();
    });

    it('should return 404 when unregistering non-existent token', async () => {
      const app = getTestApp();
      const { token } = await getTestToken();

      const response = await app.request('/api/v1/notifications/push-token', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          token: 'non-existent-token',
        }),
      });

      expect(response.status).toBe(404);
    });

    it('should reject without authentication', async () => {
      const app = getTestApp();

      const response = await app.request('/api/v1/notifications/push-token', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: 'test-token',
        }),
      });

      expect(response.status).toBe(401);
    });
  });
});
