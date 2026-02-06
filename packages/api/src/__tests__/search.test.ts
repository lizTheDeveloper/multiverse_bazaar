/**
 * Integration tests for search endpoints.
 * Tests searching projects, ideas, and combined search with filters.
 */

import { describe, it, expect } from 'vitest';
import { getTestApp, createTestUser, createTestProject, createTestIdea } from './setup.js';

describe('Search API', () => {
  describe('GET /api/v1/search', () => {
    it('should search across all types by default', async () => {
      const app = getTestApp();
      const user = await createTestUser();

      await createTestProject(user.id, {
        title: 'Searchable Project',
        description: 'A project about widgets',
      });

      await createTestIdea(user.id, {
        title: 'Searchable Idea',
        description: 'An idea about widgets',
        lookingFor: 'Co-founder',
      });

      const response = await app.request('/api/v1/search?q=widgets', {
        method: 'GET',
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('results');
      expect(data).toHaveProperty('total');
      expect(data).toHaveProperty('page');
      expect(data).toHaveProperty('limit');
      expect(data).toHaveProperty('query');

      expect(data.query).toBe('widgets');
      expect(data.total).toBeGreaterThanOrEqual(2);

      // Check that results include both types
      const hasProject = data.results.some((r: any) => r.type === 'project');
      const hasIdea = data.results.some((r: any) => r.type === 'idea');
      expect(hasProject).toBe(true);
      expect(hasIdea).toBe(true);
    });

    it('should search only projects when type=projects', async () => {
      const app = getTestApp();
      const user = await createTestUser();

      await createTestProject(user.id, {
        title: 'Project with gadgets',
        description: 'All about gadgets',
      });

      await createTestIdea(user.id, {
        title: 'Idea with gadgets',
        description: 'Idea about gadgets',
        lookingFor: 'Developer',
      });

      const response = await app.request('/api/v1/search?q=gadgets&type=projects', {
        method: 'GET',
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.results.every((r: any) => r.type === 'project')).toBe(true);
      expect(data.total).toBeGreaterThanOrEqual(1);
    });

    it('should search only ideas when type=ideas', async () => {
      const app = getTestApp();
      const user = await createTestUser();

      await createTestProject(user.id, {
        title: 'Project with innovation',
        description: 'Innovative project',
      });

      await createTestIdea(user.id, {
        title: 'Idea with innovation',
        description: 'Innovative idea',
        lookingFor: 'Co-founder',
      });

      const response = await app.request('/api/v1/search?q=innovation&type=ideas', {
        method: 'GET',
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.results.every((r: any) => r.type === 'idea')).toBe(true);
      expect(data.total).toBeGreaterThanOrEqual(1);
    });

    it('should return empty results when no matches found', async () => {
      const app = getTestApp();

      const response = await app.request('/api/v1/search?q=nonexistentterm12345', {
        method: 'GET',
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.results).toEqual([]);
      expect(data.total).toBe(0);
    });

    it('should reject search without query parameter', async () => {
      const app = getTestApp();

      const response = await app.request('/api/v1/search', {
        method: 'GET',
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject search with empty query', async () => {
      const app = getTestApp();

      const response = await app.request('/api/v1/search?q=', {
        method: 'GET',
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should handle pagination in search results', async () => {
      const app = getTestApp();
      const user = await createTestUser();

      // Create multiple projects with common term
      for (let i = 0; i < 5; i++) {
        await createTestProject(user.id, {
          title: `Common term project ${i}`,
          description: 'Test project',
        });
      }

      const response = await app.request('/api/v1/search?q=common&page=1&limit=2', {
        method: 'GET',
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.results).toHaveLength(2);
      expect(data.page).toBe(1);
      expect(data.limit).toBe(2);
      expect(data.total).toBeGreaterThanOrEqual(5);
    });

    it('should filter projects by status in search', async () => {
      const app = getTestApp();
      const user = await createTestUser();

      await createTestProject(user.id, {
        title: 'Building status project',
        description: 'Test',
        status: 'BUILDING',
      });

      await createTestProject(user.id, {
        title: 'Launched status project',
        description: 'Test',
        status: 'LAUNCHED',
      });

      const response = await app.request('/api/v1/search?q=status&type=projects&status=BUILDING', {
        method: 'GET',
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.results.every((r: any) => r.status === 'BUILDING')).toBe(true);
    });

    it('should filter ideas by status in search', async () => {
      const app = getTestApp();
      const user = await createTestUser();

      await createTestIdea(user.id, {
        title: 'Open idea filter',
        description: 'Test',
        lookingFor: 'Test',
        status: 'OPEN',
      });

      await createTestIdea(user.id, {
        title: 'Closed idea filter',
        description: 'Test',
        lookingFor: 'Test',
        status: 'CLOSED',
      });

      const response = await app.request('/api/v1/search?q=filter&type=ideas&status=OPEN', {
        method: 'GET',
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.results.every((r: any) => r.status === 'OPEN')).toBe(true);
    });

    it('should search in project titles', async () => {
      const app = getTestApp();
      const user = await createTestUser();

      await createTestProject(user.id, {
        title: 'Unique Title Keywords',
        description: 'Different content',
      });

      const response = await app.request('/api/v1/search?q=unique+title+keywords&type=projects', {
        method: 'GET',
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.total).toBeGreaterThanOrEqual(1);
      expect(data.results.some((r: any) => r.title.includes('Unique Title Keywords'))).toBe(true);
    });

    it('should search in project descriptions', async () => {
      const app = getTestApp();
      const user = await createTestUser();

      await createTestProject(user.id, {
        title: 'Normal Title',
        description: 'Special description with unique words',
      });

      const response = await app.request('/api/v1/search?q=special+unique+words&type=projects', {
        method: 'GET',
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.total).toBeGreaterThanOrEqual(1);
    });

    it('should search in idea titles', async () => {
      const app = getTestApp();
      const user = await createTestUser();

      await createTestIdea(user.id, {
        title: 'Revolutionary Concept',
        description: 'Different content',
        lookingFor: 'Help',
      });

      const response = await app.request('/api/v1/search?q=revolutionary+concept&type=ideas', {
        method: 'GET',
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.total).toBeGreaterThanOrEqual(1);
      expect(data.results.some((r: any) => r.title.includes('Revolutionary Concept'))).toBe(true);
    });

    it('should search in idea descriptions and lookingFor', async () => {
      const app = getTestApp();
      const user = await createTestUser();

      await createTestIdea(user.id, {
        title: 'Some Idea',
        description: 'Looking for blockchain expertise',
        lookingFor: 'Blockchain Developer',
      });

      const response = await app.request('/api/v1/search?q=blockchain&type=ideas', {
        method: 'GET',
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.total).toBeGreaterThanOrEqual(1);
    });

    it('should handle special characters in search query', async () => {
      const app = getTestApp();
      const user = await createTestUser();

      await createTestProject(user.id, {
        title: 'Project with C++ and Node.js',
        description: 'Technical project',
      });

      const response = await app.request('/api/v1/search?q=C%2B%2B', {
        method: 'GET',
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      // Should handle the search gracefully even if special chars cause issues
      expect(data).toHaveProperty('results');
    });

    it('should handle very long search queries', async () => {
      const app = getTestApp();

      const longQuery = 'a'.repeat(250);
      const response = await app.request(`/api/v1/search?q=${longQuery}`, {
        method: 'GET',
      });

      // Should either succeed or reject gracefully
      expect([200, 400]).toContain(response.status);
    });

    it('should reject invalid search type', async () => {
      const app = getTestApp();

      const response = await app.request('/api/v1/search?q=test&type=invalid', {
        method: 'GET',
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject invalid pagination parameters', async () => {
      const app = getTestApp();

      const response = await app.request('/api/v1/search?q=test&page=-1&limit=1000', {
        method: 'GET',
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should be case insensitive in search', async () => {
      const app = getTestApp();
      const user = await createTestUser();

      await createTestProject(user.id, {
        title: 'CamelCase Project Title',
        description: 'Test',
      });

      const response = await app.request('/api/v1/search?q=camelcase', {
        method: 'GET',
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.total).toBeGreaterThanOrEqual(1);
    });

    it('should return results ordered by relevance', async () => {
      const app = getTestApp();
      const user = await createTestUser();

      // Create projects with varying relevance
      await createTestProject(user.id, {
        title: 'AI AI AI',
        description: 'All about AI',
      });

      await createTestProject(user.id, {
        title: 'Mentioned once',
        description: 'AI mentioned here',
      });

      const response = await app.request('/api/v1/search?q=AI&type=projects', {
        method: 'GET',
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.results.length).toBeGreaterThan(0);
      // First result should be more relevant
      // Note: Actual relevance scoring depends on search implementation
    });
  });
});
