/**
 * Validation Utilities Unit Tests
 */

import {
  validateGSTNumber,
  validateInvoiceData,
  validateVendorProfile,
  validateFileUpload
} from '../validators';
import type { InvoiceData, VendorProfile } from '@/types';

describe('validateGSTNumber', () => {
  it('should validate correct GST number format', () => {
    expect(validateGSTNumber('22AAAAA0000A1Z5')).toBe(true);
    expect(validateGSTNumber('27AAPFU0939F1ZV')).toBe(true);
    expect(validateGSTNumber('09ABCDE1234F1Z9')).toBe(true);
  });

  it('should accept GST numbers with lowercase letters', () => {
    expect(validateGSTNumber('22aaaaa0000a1z5')).toBe(true);
  });

  it('should reject invalid GST number formats', () => {
    expect(validateGSTNumber('22AAAAA0000A1Z')).toBe(false); // Too short
    expect(validateGSTNumber('22AAAAA0000A1Z55')).toBe(false); // Too long
    expect(validateGSTNumber('2AAAAAA0000A1Z5')).toBe(false); // Wrong digit count
    expect(validateGSTNumber('22AAAA00000A1Z5')).toBe(false); // Wrong letter count
    expect(validateGSTNumber('22AAAAA0000A1X5')).toBe(false); // Missing Z
    expect(validateGSTNumber('ABAAAAA0000A1Z5')).toBe(false); // Letters instead of digits
  });

  it('should reject empty or null values', () => {
    expect(validateGSTNumber('')).toBe(false);
    expect(validateGSTNumber(null as any)).toBe(false);
    expect(validateGSTNumber(undefined as any)).toBe(false);
  });

  it('should handle whitespace', () => {
    expect(validateGSTNumber('  22AAAAA0000A1Z5  ')).toBe(true);
  });
});

describe('validateInvoiceData', () => {
  const validInvoiceData: InvoiceData = {
    invoiceNumber: 'INV-2024-001',
    invoiceDate: '2024-01-15',
    clientName: 'John Doe',
    clientCompany: 'Acme Corp',
    clientEmail: 'john@example.com',
    items: [
      {
        id: '1',
        description: 'Web Development',
        quantity: 1,
        rate: 5000,
        amount: 5000
      }
    ],
    currency: 'INR',
    subtotal: 5000,
    taxRate: 18,
    taxAmount: 900,
    total: 5900
  };

  it('should validate correct invoice data', () => {
    const result = validateInvoiceData(validInvoiceData);
    expect(result).toBeNull();
  });

  it('should reject invoice without client name', () => {
    const invalidData = { ...validInvoiceData, clientName: '' };
    const result = validateInvoiceData(invalidData);
    
    expect(result).not.toBeNull();
    expect(result?.errorCode).toBe('INVALID_INPUT');
    expect(result?.details?.clientName).toBe('Client name is required');
  });

  it('should reject invoice without line items', () => {
    const invalidData = { ...validInvoiceData, items: [] };
    const result = validateInvoiceData(invalidData);
    
    expect(result).not.toBeNull();
    expect(result?.errorCode).toBe('INVALID_INPUT');
    expect(result?.details?.items).toBe('At least one line item is required');
  });

  it('should reject line items with invalid quantity', () => {
    const invalidData = {
      ...validInvoiceData,
      items: [{ ...validInvoiceData.items[0], quantity: 0 }]
    };
    const result = validateInvoiceData(invalidData);
    
    expect(result).not.toBeNull();
    expect(result?.details?.['items[0].quantity']).toBe('Line item quantity must be greater than 0');
  });

  it('should reject line items with negative rate', () => {
    const invalidData = {
      ...validInvoiceData,
      items: [{ ...validInvoiceData.items[0], rate: -100 }]
    };
    const result = validateInvoiceData(invalidData);
    
    expect(result).not.toBeNull();
    expect(result?.details?.['items[0].rate']).toBe('Line item rate must be non-negative');
  });

  it('should reject line items without description', () => {
    const invalidData = {
      ...validInvoiceData,
      items: [{ ...validInvoiceData.items[0], description: '' }]
    };
    const result = validateInvoiceData(invalidData);
    
    expect(result).not.toBeNull();
    expect(result?.details?.['items[0].description']).toBe('Line item description is required');
  });

  it('should reject invoice without currency', () => {
    const invalidData = { ...validInvoiceData, currency: '' };
    const result = validateInvoiceData(invalidData);
    
    expect(result).not.toBeNull();
    expect(result?.details?.currency).toBe('Currency is required');
  });

  it('should reject negative subtotal', () => {
    const invalidData = { ...validInvoiceData, subtotal: -100 };
    const result = validateInvoiceData(invalidData);
    
    expect(result).not.toBeNull();
    expect(result?.details?.subtotal).toBe('Subtotal must be a non-negative number');
  });

  it('should reject negative total', () => {
    const invalidData = { ...validInvoiceData, total: -100 };
    const result = validateInvoiceData(invalidData);
    
    expect(result).not.toBeNull();
    expect(result?.details?.total).toBe('Total must be a non-negative number');
  });

  it('should reject invalid tax rate', () => {
    const invalidData = { ...validInvoiceData, taxRate: 150 };
    const result = validateInvoiceData(invalidData);
    
    expect(result).not.toBeNull();
    expect(result?.details?.taxRate).toBe('Tax rate must be between 0 and 100');
  });

  it('should reject invalid email format', () => {
    const invalidData = { ...validInvoiceData, clientEmail: 'invalid-email' };
    const result = validateInvoiceData(invalidData);
    
    expect(result).not.toBeNull();
    expect(result?.details?.clientEmail).toBe('Invalid email format');
  });

  it('should accept valid email formats', () => {
    const validData = { ...validInvoiceData, clientEmail: 'test@example.com' };
    const result = validateInvoiceData(validData);
    
    expect(result).toBeNull();
  });

  it('should reject invalid invoice date', () => {
    const invalidData = { ...validInvoiceData, invoiceDate: 'invalid-date' };
    const result = validateInvoiceData(invalidData);
    
    expect(result).not.toBeNull();
    expect(result?.details?.invoiceDate).toBe('Invalid invoice date format');
  });

  it('should reject invalid due date', () => {
    const invalidData = { ...validInvoiceData, dueDate: 'not-a-date' };
    const result = validateInvoiceData(invalidData);
    
    expect(result).not.toBeNull();
    expect(result?.details?.dueDate).toBe('Invalid due date format');
  });

  it('should accept invoice with optional fields missing', () => {
    const minimalData: Partial<InvoiceData> = {
      clientName: 'John Doe',
      items: [
        {
          id: '1',
          description: 'Service',
          quantity: 1,
          rate: 1000,
          amount: 1000
        }
      ],
      currency: 'INR',
      subtotal: 1000,
      total: 1000
    };
    
    const result = validateInvoiceData(minimalData);
    expect(result).toBeNull();
  });
});

describe('validateVendorProfile', () => {
  const validProfile: VendorProfile = {
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '+919876543210',
    address: '456 Business St, Delhi',
    companyName: 'Smith Consulting',
    gstNumber: '07ABCDE1234F1Z9',
    upiId: 'jane@paytm',
    ifscCode: 'HDFC0001234'
  };

  it('should validate correct vendor profile', () => {
    const result = validateVendorProfile(validProfile);
    expect(result).toBeNull();
  });

  it('should reject profile without name', () => {
    const invalidProfile = { ...validProfile, name: '' };
    const result = validateVendorProfile(invalidProfile);
    
    expect(result).not.toBeNull();
    expect(result?.errorCode).toBe('INVALID_INPUT');
    expect(result?.details?.name).toBe('Vendor name is required');
  });

  it('should reject profile without email', () => {
    const invalidProfile = { ...validProfile, email: '' };
    const result = validateVendorProfile(invalidProfile);
    
    expect(result).not.toBeNull();
    expect(result?.details?.email).toBe('Email is required');
  });

  it('should reject profile with invalid email format', () => {
    const invalidProfile = { ...validProfile, email: 'not-an-email' };
    const result = validateVendorProfile(invalidProfile);
    
    expect(result).not.toBeNull();
    expect(result?.details?.email).toBe('Invalid email format');
  });

  it('should reject profile without phone', () => {
    const invalidProfile = { ...validProfile, phone: '' };
    const result = validateVendorProfile(invalidProfile);
    
    expect(result).not.toBeNull();
    expect(result?.details?.phone).toBe('Phone number is required');
  });

  it('should reject profile without address', () => {
    const invalidProfile = { ...validProfile, address: '' };
    const result = validateVendorProfile(invalidProfile);
    
    expect(result).not.toBeNull();
    expect(result?.details?.address).toBe('Address is required');
  });

  it('should reject invalid GST number format', () => {
    const invalidProfile = { ...validProfile, gstNumber: 'INVALID-GST' };
    const result = validateVendorProfile(invalidProfile);
    
    expect(result).not.toBeNull();
    expect(result?.details?.gstNumber).toContain('Invalid GST number format');
  });

  it('should accept profile without optional GST number', () => {
    const profileWithoutGST = { ...validProfile };
    delete profileWithoutGST.gstNumber;
    
    const result = validateVendorProfile(profileWithoutGST);
    expect(result).toBeNull();
  });

  it('should reject invalid UPI ID format', () => {
    const invalidProfile = { ...validProfile, upiId: 'invalid-upi' };
    const result = validateVendorProfile(invalidProfile);
    
    expect(result).not.toBeNull();
    expect(result?.details?.upiId).toContain('Invalid UPI ID format');
  });

  it('should accept valid UPI ID formats', () => {
    const profiles = [
      { ...validProfile, upiId: 'user@paytm' },
      { ...validProfile, upiId: 'test.user@okaxis' },
      { ...validProfile, upiId: 'user-name@ybl' }
    ];
    
    profiles.forEach(profile => {
      const result = validateVendorProfile(profile);
      expect(result).toBeNull();
    });
  });

  it('should reject invalid IFSC code format', () => {
    const invalidProfile = { ...validProfile, ifscCode: 'INVALID' };
    const result = validateVendorProfile(invalidProfile);
    
    expect(result).not.toBeNull();
    expect(result?.details?.ifscCode).toContain('Invalid IFSC code format');
  });

  it('should accept valid IFSC code formats', () => {
    const profiles = [
      { ...validProfile, ifscCode: 'HDFC0001234' },
      { ...validProfile, ifscCode: 'SBIN0012345' },
      { ...validProfile, ifscCode: 'ICIC0000001' }
    ];
    
    profiles.forEach(profile => {
      const result = validateVendorProfile(profile);
      expect(result).toBeNull();
    });
  });

  it('should accept minimal valid profile', () => {
    const minimalProfile: Partial<VendorProfile> = {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '9876543210',
      address: '123 Street'
    };
    
    const result = validateVendorProfile(minimalProfile);
    expect(result).toBeNull();
  });
});

describe('validateFileUpload', () => {
  it('should validate correct image file', () => {
    const file = new File(['dummy content'], 'logo.png', { type: 'image/png' });
    Object.defineProperty(file, 'size', { value: 100 * 1024 }); // 100KB
    
    const result = validateFileUpload(file);
    expect(result).toBeNull();
  });

  it('should accept JPEG files', () => {
    const file = new File(['dummy content'], 'logo.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'size', { value: 200 * 1024 }); // 200KB
    
    const result = validateFileUpload(file);
    expect(result).toBeNull();
  });

  it('should accept SVG files', () => {
    const file = new File(['<svg></svg>'], 'logo.svg', { type: 'image/svg+xml' });
    Object.defineProperty(file, 'size', { value: 50 * 1024 }); // 50KB
    
    const result = validateFileUpload(file);
    expect(result).toBeNull();
  });

  it('should reject file without file object', () => {
    const result = validateFileUpload(null as any);
    
    expect(result).not.toBeNull();
    expect(result?.errorCode).toBe('INVALID_INPUT');
    expect(result?.message).toBe('No file provided');
  });

  it('should reject invalid file type', () => {
    const file = new File(['dummy content'], 'document.pdf', { type: 'application/pdf' });
    Object.defineProperty(file, 'size', { value: 100 * 1024 });
    
    const result = validateFileUpload(file);
    
    expect(result).not.toBeNull();
    expect(result?.errorCode).toBe('INVALID_FILE_TYPE');
    expect(result?.details?.fileType).toContain('application/pdf');
  });

  it('should reject file exceeding size limit', () => {
    const file = new File(['dummy content'], 'logo.png', { type: 'image/png' });
    Object.defineProperty(file, 'size', { value: 600 * 1024 }); // 600KB
    
    const result = validateFileUpload(file);
    
    expect(result).not.toBeNull();
    expect(result?.errorCode).toBe('FILE_TOO_LARGE');
    expect(result?.details?.fileSize).toContain('500KB');
  });

  it('should accept custom size limit', () => {
    const file = new File(['dummy content'], 'logo.png', { type: 'image/png' });
    Object.defineProperty(file, 'size', { value: 800 * 1024 }); // 800KB
    
    // Should fail with default 500KB limit
    const resultDefault = validateFileUpload(file);
    expect(resultDefault).not.toBeNull();
    
    // Should pass with 1000KB limit
    const resultCustom = validateFileUpload(file, 1000);
    expect(resultCustom).toBeNull();
  });

  it('should reject file at exact size limit boundary', () => {
    const file = new File(['dummy content'], 'logo.png', { type: 'image/png' });
    Object.defineProperty(file, 'size', { value: 500 * 1024 + 1 }); // 500KB + 1 byte
    
    const result = validateFileUpload(file);
    
    expect(result).not.toBeNull();
    expect(result?.errorCode).toBe('FILE_TOO_LARGE');
  });

  it('should accept file at exact size limit', () => {
    const file = new File(['dummy content'], 'logo.png', { type: 'image/png' });
    Object.defineProperty(file, 'size', { value: 500 * 1024 }); // Exactly 500KB
    
    const result = validateFileUpload(file);
    expect(result).toBeNull();
  });
});
