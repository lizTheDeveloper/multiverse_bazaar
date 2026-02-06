/**
 * Zod validation schemas for Projects module.
 * Provides runtime type validation for request payloads.
 */

import { z } from 'zod';
import { ProjectStatus } from '@prisma/client';

/**
 * URL validation helper
 * Validates that a string is a valid URL format
 */
const urlSchema = z.string().url('Must be a valid URL');

/**
 * Schema for creating a new project
 */
export const createProjectSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .trim(),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(5000, 'Description must be less than 5000 characters')
    .trim(),
  url: urlSchema.optional(),
  repoUrl: urlSchema.optional(),
  imageUrl: urlSchema.optional(),
  status: z.nativeEnum(ProjectStatus).optional().default(ProjectStatus.BUILDING),
});

/**
 * Schema for updating an existing project
 * All fields are optional
 */
export const updateProjectSchema = z.object({
  title: z
    .string()
    .min(1, 'Title must not be empty')
    .max(200, 'Title must be less than 200 characters')
    .trim()
    .optional(),
  description: z
    .string()
    .min(1, 'Description must not be empty')
    .max(5000, 'Description must be less than 5000 characters')
    .trim()
    .optional(),
  url: z.union([urlSchema, z.null()]).optional(),
  repoUrl: z.union([urlSchema, z.null()]).optional(),
  imageUrl: z.union([urlSchema, z.null()]).optional(),
  status: z.nativeEnum(ProjectStatus).optional(),
});

/**
 * Schema for project list query parameters
 */
export const projectListQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().int().positive().default(1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .pipe(z.number().int().positive().max(100).default(20)),
  status: z.nativeEnum(ProjectStatus).optional(),
  featured: z
    .string()
    .optional()
    .transform((val) => {
      if (val === undefined) return undefined;
      return val === 'true' || val === '1';
    })
    .pipe(z.boolean().optional()),
  creatorId: z.string().uuid().optional(),
});

/**
 * Type inference for validated create project request
 */
export type ValidatedCreateProjectRequest = z.infer<typeof createProjectSchema>;

/**
 * Type inference for validated update project request
 */
export type ValidatedUpdateProjectRequest = z.infer<typeof updateProjectSchema>;

/**
 * Type inference for validated project list query
 */
export type ValidatedProjectListQuery = z.infer<typeof projectListQuerySchema>;
