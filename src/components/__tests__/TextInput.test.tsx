/**
 * TextInput Component Unit Tests
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TextInput from '../TextInput';

describe('TextInput Component', () => {
  const mockOnChange = jest.fn();
  const mockOnExtract = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render textarea with placeholder', () => {
    render(
      <TextInput
        value=""
        onChange={mockOnChange}
        onExtract={mockOnExtract}
        isLoading={false}
      />
    );

    const textarea = screen.getByPlaceholderText(/paste payment details/i);
    expect(textarea).toBeInTheDocument();
  });

  it('should display character count', () => {
    render(
      <TextInput
        value="Test payment text"
        onChange={mockOnChange}
        onExtract={mockOnExtract}
        isLoading={false}
      />
    );

    expect(screen.getByText(/17 \/ 10000 characters/i)).toBeInTheDocument();
  });

  it('should call onChange when text is entered', () => {
    render(
      <TextInput
        value=""
        onChange={mockOnChange}
        onExtract={mockOnExtract}
        isLoading={false}
      />
    );

    const textarea = screen.getByPlaceholderText(/paste payment details/i);
    fireEvent.change(textarea, { target: { value: 'New payment text' } });

    expect(mockOnChange).toHaveBeenCalledWith('New payment text');
  });

  it('should show clear button when text is present', () => {
    render(
      <TextInput
        value="Some text"
        onChange={mockOnChange}
        onExtract={mockOnExtract}
        isLoading={false}
      />
    );

    const clearButton = screen.getByText(/clear/i);
    expect(clearButton).toBeInTheDocument();
  });

  it('should not show clear button when text is empty', () => {
    render(
      <TextInput
        value=""
        onChange={mockOnChange}
        onExtract={mockOnExtract}
        isLoading={false}
      />
    );

    const clearButton = screen.queryByText(/clear/i);
    expect(clearButton).not.toBeInTheDocument();
  });

  it('should clear text when clear button is clicked', () => {
    render(
      <TextInput
        value="Some text"
        onChange={mockOnChange}
        onExtract={mockOnExtract}
        isLoading={false}
      />
    );

    const clearButton = screen.getByText(/clear/i);
    fireEvent.click(clearButton);

    expect(mockOnChange).toHaveBeenCalledWith('');
  });

  it('should enable extract button when text is present', () => {
    render(
      <TextInput
        value="Payment text"
        onChange={mockOnChange}
        onExtract={mockOnExtract}
        isLoading={false}
      />
    );

    const extractButton = screen.getByRole('button', { name: /extract invoice data/i });
    expect(extractButton).not.toBeDisabled();
  });

  it('should disable extract button when text is empty', () => {
    render(
      <TextInput
        value=""
        onChange={mockOnChange}
        onExtract={mockOnExtract}
        isLoading={false}
      />
    );

    const extractButton = screen.getByRole('button', { name: /extract invoice data/i });
    expect(extractButton).toBeDisabled();
  });

  it('should disable extract button when text is only whitespace', () => {
    render(
      <TextInput
        value="   "
        onChange={mockOnChange}
        onExtract={mockOnExtract}
        isLoading={false}
      />
    );

    const extractButton = screen.getByRole('button', { name: /extract invoice data/i });
    expect(extractButton).toBeDisabled();
  });

  it('should call onExtract when extract button is clicked', () => {
    render(
      <TextInput
        value="Payment text"
        onChange={mockOnChange}
        onExtract={mockOnExtract}
        isLoading={false}
      />
    );

    const extractButton = screen.getByRole('button', { name: /extract invoice data/i });
    fireEvent.click(extractButton);

    expect(mockOnExtract).toHaveBeenCalledTimes(1);
  });

  it('should show loading state when isLoading is true', () => {
    render(
      <TextInput
        value="Payment text"
        onChange={mockOnChange}
        onExtract={mockOnExtract}
        isLoading={true}
      />
    );

    expect(screen.getByText(/extracting\.\.\./i)).toBeInTheDocument();
  });

  it('should disable textarea when loading', () => {
    render(
      <TextInput
        value="Payment text"
        onChange={mockOnChange}
        onExtract={mockOnExtract}
        isLoading={true}
      />
    );

    const textarea = screen.getByPlaceholderText(/paste payment details/i);
    expect(textarea).toBeDisabled();
  });

  it('should disable extract button when loading', () => {
    render(
      <TextInput
        value="Payment text"
        onChange={mockOnChange}
        onExtract={mockOnExtract}
        isLoading={true}
      />
    );

    const extractButton = screen.getByRole('button', { name: /extracting\.\.\./i });
    expect(extractButton).toBeDisabled();
  });

  it('should disable clear button when loading', () => {
    render(
      <TextInput
        value="Payment text"
        onChange={mockOnChange}
        onExtract={mockOnExtract}
        isLoading={true}
      />
    );

    const clearButton = screen.getByText(/clear/i);
    expect(clearButton).toBeDisabled();
  });

  it('should not call onExtract when loading', () => {
    render(
      <TextInput
        value="Payment text"
        onChange={mockOnChange}
        onExtract={mockOnExtract}
        isLoading={true}
      />
    );

    const extractButton = screen.getByRole('button', { name: /extracting\.\.\./i });
    fireEvent.click(extractButton);

    expect(mockOnExtract).not.toHaveBeenCalled();
  });

  it('should respect maxLength attribute', () => {
    render(
      <TextInput
        value=""
        onChange={mockOnChange}
        onExtract={mockOnExtract}
        isLoading={false}
      />
    );

    const textarea = screen.getByPlaceholderText(/paste payment details/i) as HTMLTextAreaElement;
    expect(textarea.maxLength).toBe(10000);
  });
});
