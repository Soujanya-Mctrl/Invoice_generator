import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Toast from '../Toast';

describe('Toast Component', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders success toast with correct styling', () => {
    const { container } = render(
      <Toast
        type="success"
        message="Operation successful"
        onClose={mockOnClose}
        autoClose={false}
      />
    );

    expect(screen.getByText('Operation successful')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
    const innerDiv = container.querySelector('.bg-green-600');
    expect(innerDiv).toBeInTheDocument();
  });

  it('renders error toast with correct styling', () => {
    const { container } = render(
      <Toast
        type="error"
        message="Operation failed"
        onClose={mockOnClose}
        autoClose={false}
      />
    );

    expect(screen.getByText('Operation failed')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
    const innerDiv = container.querySelector('.bg-red-600');
    expect(innerDiv).toBeInTheDocument();
  });

  it('renders warning toast with correct styling', () => {
    const { container } = render(
      <Toast
        type="warning"
        message="Warning message"
        onClose={mockOnClose}
        autoClose={false}
      />
    );

    expect(screen.getByText('Warning message')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
    const innerDiv = container.querySelector('.bg-yellow-600');
    expect(innerDiv).toBeInTheDocument();
  });

  it('renders info toast with correct styling', () => {
    const { container } = render(
      <Toast
        type="info"
        message="Info message"
        onClose={mockOnClose}
        autoClose={false}
      />
    );

    expect(screen.getByText('Info message')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
    const innerDiv = container.querySelector('.bg-blue-600');
    expect(innerDiv).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(
      <Toast
        type="info"
        message="Test message"
        onClose={mockOnClose}
        autoClose={false}
      />
    );

    const closeButton = screen.getByLabelText('Close notification');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('auto-dismisses after specified duration', () => {
    render(
      <Toast
        type="info"
        message="Test message"
        onClose={mockOnClose}
        duration={3000}
        autoClose={true}
      />
    );

    expect(mockOnClose).not.toHaveBeenCalled();

    jest.advanceTimersByTime(3000);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('does not auto-dismiss when autoClose is false', () => {
    render(
      <Toast
        type="info"
        message="Test message"
        onClose={mockOnClose}
        autoClose={false}
      />
    );

    jest.advanceTimersByTime(10000);

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('uses default duration of 5000ms when not specified', () => {
    render(
      <Toast
        type="info"
        message="Test message"
        onClose={mockOnClose}
      />
    );

    jest.advanceTimersByTime(4999);
    expect(mockOnClose).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('has correct ARIA attributes for error type', () => {
    render(
      <Toast
        type="error"
        message="Error message"
        onClose={mockOnClose}
        autoClose={false}
      />
    );

    const toast = screen.getByRole('alert');
    expect(toast).toHaveAttribute('aria-live', 'assertive');
    expect(toast).toHaveAttribute('aria-atomic', 'true');
  });

  it('has correct ARIA attributes for non-error types', () => {
    render(
      <Toast
        type="success"
        message="Success message"
        onClose={mockOnClose}
        autoClose={false}
      />
    );

    const toast = screen.getByRole('status');
    expect(toast).toHaveAttribute('aria-live', 'polite');
    expect(toast).toHaveAttribute('aria-atomic', 'true');
  });
});
