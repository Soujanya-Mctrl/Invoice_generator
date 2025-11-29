import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorDisplay from '../ErrorDisplay';
import { ErrorResponse } from '@/types/error';

describe('ErrorDisplay Component', () => {
  const mockOnDismiss = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders error message correctly', () => {
    const error: ErrorResponse = {
      errorCode: 'INVALID_INPUT',
      message: 'Invalid input provided',
    };

    render(<ErrorDisplay error={error} />);

    expect(screen.getByText('Invalid input provided')).toBeInTheDocument();
    expect(screen.getByText('Error Code: INVALID_INPUT')).toBeInTheDocument();
  });

  it('displays field-specific details when provided', () => {
    const error: ErrorResponse = {
      errorCode: 'INVALID_INPUT',
      message: 'Validation failed',
      details: {
        email: 'Invalid email format',
        phone: 'Phone number is required',
      },
    };

    render(<ErrorDisplay error={error} />);

    expect(screen.getByText('Validation failed')).toBeInTheDocument();
    expect(screen.getByText(/email:/i)).toBeInTheDocument();
    expect(screen.getByText(/Invalid email format/i)).toBeInTheDocument();
    expect(screen.getByText(/phone:/i)).toBeInTheDocument();
    expect(screen.getByText(/Phone number is required/i)).toBeInTheDocument();
  });

  it('shows appropriate suggestion for EXTRACTION_INCOMPLETE error', () => {
    const error: ErrorResponse = {
      errorCode: 'EXTRACTION_INCOMPLETE',
      message: 'Could not extract all fields',
    };

    render(<ErrorDisplay error={error} />);

    expect(
      screen.getByText(/Try pasting more detailed payment information/i)
    ).toBeInTheDocument();
  });

  it('shows appropriate suggestion for AI_SERVICE_UNAVAILABLE error', () => {
    const error: ErrorResponse = {
      errorCode: 'AI_SERVICE_UNAVAILABLE',
      message: 'AI service is unavailable',
    };

    render(<ErrorDisplay error={error} />);

    expect(
      screen.getByText(/Using regex-based extraction as fallback/i)
    ).toBeInTheDocument();
  });

  it('shows appropriate suggestion for STORAGE_QUOTA_EXCEEDED error', () => {
    const error: ErrorResponse = {
      errorCode: 'STORAGE_QUOTA_EXCEEDED',
      message: 'Storage quota exceeded',
    };

    render(<ErrorDisplay error={error} />);

    expect(
      screen.getByText(/Try removing the logo or clearing browser data/i)
    ).toBeInTheDocument();
  });

  it('shows appropriate suggestion for INVALID_FILE_TYPE error', () => {
    const error: ErrorResponse = {
      errorCode: 'INVALID_FILE_TYPE',
      message: 'Invalid file type',
    };

    render(<ErrorDisplay error={error} />);

    expect(
      screen.getByText(/Please upload an image file/i)
    ).toBeInTheDocument();
  });

  it('shows appropriate suggestion for FILE_TOO_LARGE error', () => {
    const error: ErrorResponse = {
      errorCode: 'FILE_TOO_LARGE',
      message: 'File too large',
    };

    render(<ErrorDisplay error={error} />);

    expect(
      screen.getByText(/Please upload an image smaller than 500KB/i)
    ).toBeInTheDocument();
  });

  it('applies error severity styling for error codes', () => {
    const error: ErrorResponse = {
      errorCode: 'PDF_GENERATION_FAILED',
      message: 'PDF generation failed',
    };

    render(<ErrorDisplay error={error} />);

    const container = screen.getByRole('alert');
    expect(container).toHaveClass('bg-red-50');
  });

  it('applies warning severity styling for warning codes', () => {
    const error: ErrorResponse = {
      errorCode: 'EXTRACTION_INCOMPLETE',
      message: 'Extraction incomplete',
    };

    render(<ErrorDisplay error={error} />);

    const container = screen.getByRole('status');
    expect(container).toHaveClass('bg-yellow-50');
  });

  it('applies info severity styling for AI_SERVICE_UNAVAILABLE', () => {
    const error: ErrorResponse = {
      errorCode: 'AI_SERVICE_UNAVAILABLE',
      message: 'AI service unavailable',
    };

    render(<ErrorDisplay error={error} />);

    const container = screen.getByRole('status');
    expect(container).toHaveClass('bg-blue-50');
  });

  it('calls onDismiss when dismiss button is clicked', () => {
    const error: ErrorResponse = {
      errorCode: 'INVALID_INPUT',
      message: 'Invalid input',
    };

    render(<ErrorDisplay error={error} onDismiss={mockOnDismiss} />);

    const dismissButton = screen.getByLabelText('Dismiss error');
    fireEvent.click(dismissButton);

    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
  });

  it('does not show dismiss button when onDismiss is not provided', () => {
    const error: ErrorResponse = {
      errorCode: 'INVALID_INPUT',
      message: 'Invalid input',
    };

    render(<ErrorDisplay error={error} />);

    expect(screen.queryByLabelText('Dismiss error')).not.toBeInTheDocument();
  });

  it('renders inline variant with simplified styling', () => {
    const error: ErrorResponse = {
      errorCode: 'INVALID_INPUT',
      message: 'Invalid input',
    };

    render(<ErrorDisplay error={error} inline />);

    expect(screen.getByText('Invalid input')).toBeInTheDocument();
    // Inline variant should not show error code
    expect(screen.queryByText(/Error Code:/i)).not.toBeInTheDocument();
  });

  it('has correct ARIA attributes for error severity', () => {
    const error: ErrorResponse = {
      errorCode: 'INVALID_INPUT',
      message: 'Invalid input',
    };

    render(<ErrorDisplay error={error} />);

    const container = screen.getByRole('alert');
    expect(container).toHaveAttribute('aria-live', 'assertive');
    expect(container).toHaveAttribute('aria-atomic', 'true');
  });

  it('has correct ARIA attributes for non-error severity', () => {
    const error: ErrorResponse = {
      errorCode: 'AI_SERVICE_UNAVAILABLE',
      message: 'AI unavailable',
    };

    render(<ErrorDisplay error={error} />);

    const container = screen.getByRole('status');
    expect(container).toHaveAttribute('aria-live', 'polite');
    expect(container).toHaveAttribute('aria-atomic', 'true');
  });

  it('applies custom className when provided', () => {
    const error: ErrorResponse = {
      errorCode: 'INVALID_INPUT',
      message: 'Invalid input',
    };

    render(<ErrorDisplay error={error} className="custom-class" />);

    const container = screen.getByRole('alert');
    expect(container).toHaveClass('custom-class');
  });
});
