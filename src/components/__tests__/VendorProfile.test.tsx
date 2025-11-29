/**
 * VendorProfile Component Unit Tests
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import VendorProfile from '../VendorProfile';
import { storageService } from '@/lib/storage/service';

// Mock the storage service
jest.mock('@/lib/storage/service', () => ({
  storageService: {
    getVendorProfile: jest.fn(),
    saveVendorProfile: jest.fn(),
    getLogo: jest.fn(),
    saveLogo: jest.fn(),
  },
}));

describe('VendorProfile Component', () => {
  const mockOnChange = jest.fn();
  const mockOnLogoUpload = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (storageService.getVendorProfile as jest.Mock).mockReturnValue(null);
    (storageService.getLogo as jest.Mock).mockReturnValue(null);
  });

  it('should render collapsible trigger button', () => {
    render(
      <VendorProfile
        profile={null}
        onChange={mockOnChange}
        onLogoUpload={mockOnLogoUpload}
      />
    );

    const triggerButton = screen.getByRole('button', { name: /vendor profile/i });
    expect(triggerButton).toBeInTheDocument();
  });

  it('should expand when trigger is clicked', () => {
    render(
      <VendorProfile
        profile={null}
        onChange={mockOnChange}
        onLogoUpload={mockOnLogoUpload}
      />
    );

    const triggerButton = screen.getByRole('button', { name: /vendor profile/i });
    fireEvent.click(triggerButton);

    // Check if form fields are visible
    expect(screen.getByLabelText(/^name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email/i)).toBeInTheDocument();
  });

  it('should load existing profile from localStorage on mount', () => {
    const mockProfile = {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+91 1234567890',
      address: '123 Main St',
    };

    (storageService.getVendorProfile as jest.Mock).mockReturnValue(mockProfile);

    render(
      <VendorProfile
        profile={null}
        onChange={mockOnChange}
        onLogoUpload={mockOnLogoUpload}
      />
    );

    expect(storageService.getVendorProfile).toHaveBeenCalled();
    expect(mockOnChange).toHaveBeenCalledWith(mockProfile);
  });

  it('should update field and save to localStorage when input changes', async () => {
    render(
      <VendorProfile
        profile={null}
        onChange={mockOnChange}
        onLogoUpload={mockOnLogoUpload}
      />
    );

    // Expand the collapsible
    const triggerButton = screen.getByRole('button', { name: /vendor profile/i });
    fireEvent.click(triggerButton);

    // Change the name field
    const nameInput = screen.getByLabelText(/^name/i);
    fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });

    await waitFor(() => {
      expect(storageService.saveVendorProfile).toHaveBeenCalled();
      expect(mockOnChange).toHaveBeenCalled();
    });
  });

  it('should validate GST number format', async () => {
    render(
      <VendorProfile
        profile={null}
        onChange={mockOnChange}
        onLogoUpload={mockOnLogoUpload}
      />
    );

    // Expand the collapsible
    const triggerButton = screen.getByRole('button', { name: /vendor profile/i });
    fireEvent.click(triggerButton);

    // Enter invalid GST number
    const gstInput = screen.getByLabelText(/gst number/i);
    fireEvent.change(gstInput, { target: { value: 'INVALID' } });

    await waitFor(() => {
      expect(screen.getByText(/invalid gst format/i)).toBeInTheDocument();
    });
  });

  it('should convert GST number to uppercase', async () => {
    render(
      <VendorProfile
        profile={null}
        onChange={mockOnChange}
        onLogoUpload={mockOnLogoUpload}
      />
    );

    // Expand the collapsible
    const triggerButton = screen.getByRole('button', { name: /vendor profile/i });
    fireEvent.click(triggerButton);

    // Enter lowercase GST number
    const gstInput = screen.getByLabelText(/gst number/i) as HTMLInputElement;
    fireEvent.change(gstInput, { target: { value: 'abc' } });

    expect(gstInput.value).toBe('ABC');
  });

  it('should display all required field indicators', () => {
    render(
      <VendorProfile
        profile={null}
        onChange={mockOnChange}
        onLogoUpload={mockOnLogoUpload}
      />
    );

    // Expand the collapsible
    const triggerButton = screen.getByRole('button', { name: /vendor profile/i });
    fireEvent.click(triggerButton);

    // Check for required field indicators (asterisks)
    const requiredFields = screen.getAllByText('*');
    expect(requiredFields.length).toBeGreaterThan(0);
  });

  it('should display payment details section', () => {
    render(
      <VendorProfile
        profile={null}
        onChange={mockOnChange}
        onLogoUpload={mockOnLogoUpload}
      />
    );

    // Expand the collapsible
    const triggerButton = screen.getByRole('button', { name: /vendor profile/i });
    fireEvent.click(triggerButton);

    expect(screen.getByText(/payment details/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/upi id/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/bank name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/account number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ifsc code/i)).toBeInTheDocument();
  });

  it('should convert IFSC code to uppercase', async () => {
    render(
      <VendorProfile
        profile={null}
        onChange={mockOnChange}
        onLogoUpload={mockOnLogoUpload}
      />
    );

    // Expand the collapsible
    const triggerButton = screen.getByRole('button', { name: /vendor profile/i });
    fireEvent.click(triggerButton);

    // Enter lowercase IFSC code
    const ifscInput = screen.getByLabelText(/ifsc code/i) as HTMLInputElement;
    fireEvent.change(ifscInput, { target: { value: 'abcd0123456' } });

    expect(ifscInput.value).toBe('ABCD0123456');
  });

  it('should display auto-save message', () => {
    render(
      <VendorProfile
        profile={null}
        onChange={mockOnChange}
        onLogoUpload={mockOnLogoUpload}
      />
    );

    // Expand the collapsible
    const triggerButton = screen.getByRole('button', { name: /vendor profile/i });
    fireEvent.click(triggerButton);

    expect(screen.getByText(/all changes are automatically saved/i)).toBeInTheDocument();
  });
});
