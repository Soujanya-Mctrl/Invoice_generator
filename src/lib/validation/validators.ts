/**
 * Validation Utilities
 * Provides validation functions for invoice data, vendor profiles, and file uploads
 */

import { InvoiceData } from '@/types/invoice';
import { VendorProfile } from '@/types/vendor';
import { ErrorResponse } from '@/types/error';

/**
 * Validates GST number format
 * Format: 2 digits, 5 letters, 4 digits, 1 letter, 1 alphanumeric, Z, 1 alphanumeric
 * Example: 22AAAAA0000A1Z5
 * 
 * @param gstNumber - The GST number to validate
 * @returns true if valid, false otherwise
 */
export function validateGSTNumber(gstNumber: string): boolean {
  if (!gstNumber || typeof gstNumber !== 'string') {
    return false;
  }

  // GST format: 2 digits + 5 letters + 4 digits + 1 letter + 1 alphanumeric + Z + 1 alphanumeric
  const gstRegex = /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z0-9]{1}Z[A-Z0-9]{1}$/;
  return gstRegex.test(gstNumber.trim().toUpperCase());
}

/**
 * Validates invoice data for completeness and correctness
 * Checks required fields and data integrity
 * 
 * @param invoiceData - The invoice data to validate
 * @returns ErrorResponse if validation fails, null if valid
 */
export function validateInvoiceData(invoiceData: Partial<InvoiceData>): ErrorResponse | null {
  const errors: Record<string, string> = {};

  // Validate required fields
  if (!invoiceData.clientName || invoiceData.clientName.trim() === '') {
    errors.clientName = 'Client name is required';
  }

  if (!invoiceData.items || invoiceData.items.length === 0) {
    errors.items = 'At least one line item is required';
  } else {
    // Validate each line item
    invoiceData.items.forEach((item, index) => {
      if (!item.description || item.description.trim() === '') {
        errors[`items[${index}].description`] = 'Line item description is required';
      }
      if (typeof item.quantity !== 'number' || item.quantity <= 0) {
        errors[`items[${index}].quantity`] = 'Line item quantity must be greater than 0';
      }
      if (typeof item.rate !== 'number' || item.rate < 0) {
        errors[`items[${index}].rate`] = 'Line item rate must be non-negative';
      }
    });
  }

  if (!invoiceData.currency || invoiceData.currency.trim() === '') {
    errors.currency = 'Currency is required';
  }

  if (typeof invoiceData.subtotal !== 'number' || invoiceData.subtotal < 0) {
    errors.subtotal = 'Subtotal must be a non-negative number';
  }

  if (typeof invoiceData.total !== 'number' || invoiceData.total < 0) {
    errors.total = 'Total must be a non-negative number';
  }

  // Validate tax rate if provided
  if (invoiceData.taxRate !== undefined && invoiceData.taxRate !== null) {
    if (typeof invoiceData.taxRate !== 'number' || invoiceData.taxRate < 0 || invoiceData.taxRate > 100) {
      errors.taxRate = 'Tax rate must be between 0 and 100';
    }
  }

  // Validate email format if provided
  if (invoiceData.clientEmail && invoiceData.clientEmail.trim() !== '') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(invoiceData.clientEmail)) {
      errors.clientEmail = 'Invalid email format';
    }
  }

  // Validate invoice date format if provided
  if (invoiceData.invoiceDate) {
    const date = new Date(invoiceData.invoiceDate);
    if (isNaN(date.getTime())) {
      errors.invoiceDate = 'Invalid invoice date format';
    }
  }

  // Validate due date format if provided
  if (invoiceData.dueDate) {
    const date = new Date(invoiceData.dueDate);
    if (isNaN(date.getTime())) {
      errors.dueDate = 'Invalid due date format';
    }
  }

  // If there are validation errors, return error response
  if (Object.keys(errors).length > 0) {
    return {
      errorCode: 'INVALID_INPUT',
      message: 'Invoice data validation failed',
      details: errors
    };
  }

  return null;
}

/**
 * Validates vendor profile data
 * Checks required fields and format validation
 * 
 * @param vendorProfile - The vendor profile to validate
 * @returns ErrorResponse if validation fails, null if valid
 */
export function validateVendorProfile(vendorProfile: Partial<VendorProfile>): ErrorResponse | null {
  const errors: Record<string, string> = {};

  // Validate required fields
  if (!vendorProfile.name || vendorProfile.name.trim() === '') {
    errors.name = 'Vendor name is required';
  }

  if (!vendorProfile.email || vendorProfile.email.trim() === '') {
    errors.email = 'Email is required';
  } else {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(vendorProfile.email)) {
      errors.email = 'Invalid email format';
    }
  }

  if (!vendorProfile.phone || vendorProfile.phone.trim() === '') {
    errors.phone = 'Phone number is required';
  }

  if (!vendorProfile.address || vendorProfile.address.trim() === '') {
    errors.address = 'Address is required';
  }

  // Validate GST number format if provided
  if (vendorProfile.gstNumber && vendorProfile.gstNumber.trim() !== '') {
    if (!validateGSTNumber(vendorProfile.gstNumber)) {
      errors.gstNumber = 'Invalid GST number format. Expected format: 22AAAAA0000A1Z5';
    }
  }

  // Validate UPI ID format if provided
  if (vendorProfile.upiId && vendorProfile.upiId.trim() !== '') {
    const upiRegex = /^[\w.-]+@[\w.-]+$/;
    if (!upiRegex.test(vendorProfile.upiId)) {
      errors.upiId = 'Invalid UPI ID format. Expected format: identifier@provider';
    }
  }

  // Validate IFSC code format if provided
  if (vendorProfile.ifscCode && vendorProfile.ifscCode.trim() !== '') {
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!ifscRegex.test(vendorProfile.ifscCode.toUpperCase())) {
      errors.ifscCode = 'Invalid IFSC code format. Expected format: XXXX0XXXXXX';
    }
  }

  // If there are validation errors, return error response
  if (Object.keys(errors).length > 0) {
    return {
      errorCode: 'INVALID_INPUT',
      message: 'Vendor profile validation failed',
      details: errors
    };
  }

  return null;
}

/**
 * Validates file upload for logo images
 * Checks file type and size constraints
 * 
 * @param file - The file to validate
 * @param maxSizeKB - Maximum file size in kilobytes (default: 500KB)
 * @returns ErrorResponse if validation fails, null if valid
 */
export function validateFileUpload(file: File, maxSizeKB: number = 500): ErrorResponse | null {
  // Validate file exists
  if (!file) {
    return {
      errorCode: 'INVALID_INPUT',
      message: 'No file provided',
      details: { file: 'File is required' }
    };
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml'];
  if (!allowedTypes.includes(file.type)) {
    return {
      errorCode: 'INVALID_FILE_TYPE',
      message: 'Invalid file type',
      details: {
        fileType: `File type must be one of: ${allowedTypes.join(', ')}. Received: ${file.type}`
      }
    };
  }

  // Validate file size
  const maxSizeBytes = maxSizeKB * 1024;
  if (file.size > maxSizeBytes) {
    return {
      errorCode: 'FILE_TOO_LARGE',
      message: 'File size exceeds limit',
      details: {
        fileSize: `File size must be less than ${maxSizeKB}KB. Current size: ${Math.round(file.size / 1024)}KB`
      }
    };
  }

  return null;
}
