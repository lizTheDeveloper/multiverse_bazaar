/**
 * Type-safe Prisma error handling utilities
 */

/**
 * Checks if an error is a Prisma "record not found" error (P2025)
 */
export function isPrismaNotFoundError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: string }).code === 'P2025'
  );
}

/**
 * Checks if an error is a Prisma unique constraint violation (P2002)
 */
export function isPrismaUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: string }).code === 'P2002'
  );
}

/**
 * Checks if an error is a Prisma foreign key constraint violation (P2003)
 */
export function isPrismaForeignKeyError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: string }).code === 'P2003'
  );
}

/**
 * Extracts a safe error message from an unknown error
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

/**
 * Checks if an error message contains a specific substring
 */
export function errorMessageIncludes(error: unknown, substring: string): boolean {
  return error instanceof Error && error.message.includes(substring);
}
