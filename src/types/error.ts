/**
 * Error Response Types
 * Defines standardized error codes and response structures
 */

export type ErrorCode =
  | 'EXTRACTION_INCOMPLETE'
  | 'INVALID_INPUT'
  | 'PDF_GENERATION_FAILED'
  | 'AI_SERVICE_UNAVAILABLE'
  | 'STORAGE_QUOTA_EXCEEDED'
  | 'INVALID_FILE_TYPE'
  | 'FILE_TOO_LARGE'
  | 'NETWORK_ERROR';

export interface ErrorResponse {
  errorCode: ErrorCode;
  message: string;
  details?: Record<string, string>;
}
