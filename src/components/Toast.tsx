'use client';

import { useEffect } from 'react';
import { X, CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
  type: ToastType;
  message: string;
  onClose: () => void;
  duration?: number;
  autoClose?: boolean;
}

/**
 * Toast Component
 * 
 * Displays transient notification messages with appropriate styling and icons.
 * 
 * Features:
 * - Auto-dismiss after specified duration (default: 5 seconds)
 * - Manual close button
 * - Different styles for success, error, info, and warning
 * - Slide-in animation
 * - Accessible with ARIA attributes
 * 
 * Requirements: 11.5, 14.1, 14.2, 14.3, 14.4, 14.5
 */
export default function Toast({
  type,
  message,
  onClose,
  duration = 5000,
  autoClose = true,
}: ToastProps) {
  // Auto-dismiss after duration
  useEffect(() => {
    if (autoClose && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [autoClose, duration, onClose]);

  // Get icon based on type
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5" />;
      case 'error':
        return <XCircle className="h-5 w-5" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />;
      case 'info':
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  // Get styles based on type
  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-600 text-white';
      case 'error':
        return 'bg-red-600 text-white';
      case 'warning':
        return 'bg-yellow-600 text-white';
      case 'info':
      default:
        return 'bg-blue-600 text-white';
    }
  };

  // Get ARIA role based on type
  const getRole = () => {
    return type === 'error' ? 'alert' : 'status';
  };

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5 max-w-md`}
      role={getRole()}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
    >
      <div className={`px-6 py-4 rounded-lg shadow-lg ${getStyles()}`}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">{getIcon()}</div>
          <div className="flex-1">
            <p className="text-sm font-medium">{message}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex-shrink-0 ml-4 hover:opacity-80 transition-opacity"
            aria-label="Close notification"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
