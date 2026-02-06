/**
 * Zod validation schemas for Ideas module.
 * Provides runtime type validation for request payloads.
 */

import { z } from 'zod';
import { IdeaStatus } from '@prisma/client';

/**
 * Schema for creating a new idea
 */
export const createIdeaSchema = z.object({
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
  lookingFor: z
    .string()
    .min(1, 'Looking for information is required')
    .max(5000, 'Looking for must be less than 5000 characters')
    .trim(),
});

/**
 * Schema for updating an existing idea
 * All fields are optional
 */
export const updateIdeaSchema = z.object({
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
  lookingFor: z
    .string()
    .min(1, 'Looking for must not be empty')
    .max(5000, 'Looking for must be less than 5000 characters')
    .trim()
    .optional(),
  status: z.nativeEnum(IdeaStatus).optional(),
});

/**
 * Schema for expressing interest in an idea
 */
export const expressInterestSchema = z.object({
  message: z
    .string()
    .max(1000, 'Message must be less than 1000 characters')
    .trim()
    .optional(),
});

/**
 * Schema for graduating an idea to a project
 */
export const graduateIdeaSchema = z.object({
  projectId: z.string().uuid('Project ID must be a valid UUID').optional(),
});

/**
 * Schema for idea list query parameters
 */
export const ideaListQuerySchema = z.object({
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
  status: z.nativeEnum(IdeaStatus).optional(),
  creatorId: z.string().uuid().optional(),
});

/**
 * Type inference for validated create idea request
 */
export type ValidatedCreateIdeaRequest = z.infer<typeof createIdeaSchema>;

/**
 * Type inference for validated update idea request
 */
export type ValidatedUpdateIdeaRequest = z.infer<typeof updateIdeaSchema>;

/**
 * Type inference for validated express interest request
 */
export type ValidatedExpressInterestRequest = z.infer<typeof expressInterestSchema>;

/**
 * Type inference for validated graduate idea request
 */
export type ValidatedGraduateIdeaRequest = z.infer<typeof graduateIdeaSchema>;

/**
 * Type inference for validated idea list query
 */
export type ValidatedIdeaListQuery = z.infer<typeof ideaListQuerySchema>;
