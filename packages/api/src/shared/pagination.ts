/**
 * Cursor-based pagination utilities for the API.
 * Provides type-safe cursor encoding/decoding and response creation helpers.
 */

/**
 * Query parameters for cursor-based pagination
 */
export interface CursorPaginationQuery {
  cursor?: string;
  limit?: number;
}

/**
 * Response format for cursor-based pagination
 */
export interface CursorPaginationResponse<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * Internal cursor structure
 * Combines createdAt timestamp and id for stable pagination
 */
interface CursorData {
  id: string;
  createdAt: Date;
}

/**
 * Encodes a cursor from id and createdAt timestamp
 * Uses base64 encoding for a clean, URL-safe cursor string
 *
 * @param id - Resource ID
 * @param createdAt - Created timestamp
 * @returns Base64-encoded cursor string
 */
export function encodeCursor(id: string, createdAt: Date): string {
  const cursorData: CursorData = {
    id,
    createdAt,
  };

  const json = JSON.stringify({
    id: cursorData.id,
    createdAt: cursorData.createdAt.toISOString(),
  });

  return Buffer.from(json).toString('base64');
}

/**
 * Decodes a cursor string back to id and createdAt
 * Handles invalid cursor formats gracefully
 *
 * @param cursor - Base64-encoded cursor string
 * @returns Decoded cursor data with id and createdAt
 * @throws Error if cursor is malformed or invalid
 */
export function decodeCursor(cursor: string): CursorData {
  try {
    const json = Buffer.from(cursor, 'base64').toString('utf-8');
    const parsed = JSON.parse(json);

    if (!parsed.id || !parsed.createdAt) {
      throw new Error('Invalid cursor format: missing required fields');
    }

    return {
      id: parsed.id,
      createdAt: new Date(parsed.createdAt),
    };
  } catch (error) {
    throw new Error(`Failed to decode cursor: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Creates a paginated response from a list of items
 * Automatically determines hasMore by fetching limit + 1 items
 *
 * @param items - Array of items (should be fetched with limit + 1)
 * @param limit - Requested page size
 * @param getCursor - Function to extract cursor data from an item
 * @returns Cursor-based pagination response
 */
export function createPaginatedResponse<T>(
  items: T[],
  limit: number,
  getCursor: (item: T) => { id: string; createdAt: Date }
): CursorPaginationResponse<T> {
  // Check if there are more items beyond the requested limit
  const hasMore = items.length > limit;

  // Trim to the requested limit
  const data = hasMore ? items.slice(0, limit) : items;

  // Generate nextCursor from the last item if there are more items
  let nextCursor: string | null = null;
  if (hasMore && data.length > 0) {
    const lastItem = data[data.length - 1];
    const cursorData = getCursor(lastItem);
    nextCursor = encodeCursor(cursorData.id, cursorData.createdAt);
  }

  return {
    data,
    nextCursor,
    hasMore,
  };
}
