/**
 * AgriSense AI — API Response Types
 * =====================================
 * Shared types for all API responses.
 */

/** Standard paginated response envelope. */
export interface PaginatedResponse<T> {
  total: number;
  page: number;
  page_size: number;
  items: T[];
}

/** Standard error response from the API. */
export interface ApiError {
  error: string;
  detail: string;
  details?: Record<string, unknown>;
}
