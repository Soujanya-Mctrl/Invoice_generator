'use client';

import { ErrorResponse } from '@/types/error';
import { AlertCircle, AlertTriangle, XCircle, Info } from 'lucide-react';

export interface ErrorDisplayProps {
  error: ErrorResponse;
  onDismiss?: () => void;
  className?: string;
  inline?: boolean;
}

/**
 * ErrorDisplay Component
 * 
 * Displays structured error messages with appropriate styling and context.
 * 
 * Features:
 * - Displays error code and message
 * - Shows field-specific validation errors
 * - Different styles based on error severity
 * - Optional dismiss button
 * - Inline or block display modes
 * - Accessible with ARIA attributes
 * 
 * Error Types:
 * - EXTRACTION_INCOMPLETE: Warning style with suggestions
 * - INVALID_INPUT: Error style with field details
 * - PDF_GENERATION_FAILED: Error style
 * - AI_SERVICE_UNAVAILABLE: Info style (graceful degradation)
 * - STORAGE_QUOTA_EXCEEDED: Warning style
 * - INVALID_FILE_TYPE: Error style
 * - FILE_TOO_LARGE: Error style
 * - NETWORK_ERROR: Error style
 * 
 * Requirements: 11.5, 13.5, 14.1, 14.2, 14.3, 14.4, 14.5
 */
export default function ErrorDisplay({
  error,
  onDismiss,
  className = '',
  inline = false,
}: ErrorDisplayProps) {
  // Determine severity and styling based on error code
  const getSeverity = () => {
    switch (error.errorCode) {
      case 'AI_SERVICE_UNAVAILABLE':
        return 'info'; // Graceful degradation
      case 'EXTRACTION_INCOMPLETE':
      case 'STORAGE_QUOTA_EXCEEDED':
        return 'warning';
      case 'INVALID_INPUT':
      case 'PDF_GENERATION_FAILED':
      case 'INVALID_FILE_TYPE':
      case 'FILE_TOO_LARGE':
      case 'NETWORK_ERROR':
      default:
        return 'error';
    }
  };

  const severity = getSeverity();

  // Get icon based on severity
  const getIcon = () => {
    switch (severity) {
      case 'info':
        return <Info className="h-5 w-5" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />;
      case 'error':
      default:
        return <XCircle className="h-5 w-5" />;
    }
  };

  // Get styles based on severity
  // Use neutral surfaces that work in both light and dark mode,
  // and rely on icon colour to communicate severity.
  const getStyles = () => {
    if (inline) {
      // Full-width inline banners (like the AI status bar)
      return 'bg-secondary text-foreground border-border';
    }
    // Regular in-content cards
    return 'bg-card text-foreground border-border';
  };

  // Get icon color based on severity
  const getIconColor = () => {
    switch (severity) {
      case 'info':
        return 'text-primary';
      case 'warning':
        return 'text-yellow-500';
      case 'error':
      default:
        return 'text-destructive';
    }
  };

  // Get helpful suggestions based on error code
  const getSuggestion = () => {
    switch (error.errorCode) {
      case 'EXTRACTION_INCOMPLETE':
        return 'Try pasting more detailed payment information or manually fill in the missing fields.';
      case 'AI_SERVICE_UNAVAILABLE':
        return 'Using regex-based extraction as fallback. Results may be less accurate.';
      case 'INVALID_INPUT':
        return 'Please check the highlighted fields and correct any errors.';
      case 'PDF_GENERATION_FAILED':
        return 'Please verify all invoice data is complete and try again.';
      case 'STORAGE_QUOTA_EXCEEDED':
        return 'Try removing the logo or clearing browser data to free up space.';
      case 'INVALID_FILE_TYPE':
        return 'Please upload an image file (JPEG, PNG, or SVG).';
      case 'FILE_TOO_LARGE':
        return 'Please upload an image smaller than 500KB.';
      case 'NETWORK_ERROR':
        return 'Please check your internet connection and try again.';
      default:
        return null;
    }
  };

  const suggestion = getSuggestion();

  // Get ARIA role based on severity
  const getRole = () => {
    return severity === 'error' ? 'alert' : 'status';
  };

  return (
    <div
      className={`${
        inline ? 'p-3' : 'p-4'
      } border rounded-lg ${getStyles()} ${className}`}
      role={getRole()}
      aria-live={severity === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
    >
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 ${getIconColor()}`}>{getIcon()}</div>
        
        <div className="flex-1 min-w-0">
          {/* Error message */}
          <p className={`${inline ? 'text-sm' : 'text-sm font-medium'}`}>
            {error.message}
          </p>

          {/* Suggestion */}
          {suggestion && (
            <p className="mt-1 text-sm opacity-90">{suggestion}</p>
          )}

          {/* Field-specific details */}
          {error.details && Object.keys(error.details).length > 0 && (
            <div className="mt-3">
              <p className="text-sm font-medium mb-2">Details:</p>
              <ul className="text-sm space-y-1 list-disc list-inside">
                {Object.entries(error.details).map(([field, message]) => (
                  <li key={field}>
                    <span className="font-medium">{field}:</span> {message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Error code (for debugging) */}
          {!inline && (
            <p className="mt-2 text-xs opacity-70">
              Error Code: {error.errorCode}
            </p>
          )}
        </div>

        {/* Dismiss button */}
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="flex-shrink-0 hover:opacity-70 transition-opacity"
            aria-label="Dismiss error"
          >
            <AlertCircle className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}
