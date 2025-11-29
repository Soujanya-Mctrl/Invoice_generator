/**
 * Vendor API Route Tests
 * Tests for vendor profile validation endpoint
 */

import { validateVendorProfile } from '@/lib/validation/validators';
import type { VendorProfile } from '@/types/vendor';

// Test the validation logic that the API route uses
// Note: API routes in Next.js run on the server and are tested via integration tests
// Here we test the core validation logic

describe('Vendor API Route Validation Logic', () => {
  const validVendorProfile: VendorProfile = {
    name: 'Jane Smith',
    companyName: 'Smith Consulting',
    email: 'jane@example.com',
    phone: '+919876543210',
    address: '123 Main St, City, State 12345',
    gstNumber: '22AAAAA0000A1Z5',
    upiId: 'jane@upi',
    bankName: 'Test Bank',
    accountNumber: '1234567890',
    ifscCode: 'TEST0123456',
    accountHolderName: 'Jane Smith',
  };

  describe('Vendor Profile Validation', () => {
    it('should validate and accept valid vendor profile', () => {
      const result = validateVendorProfile(validVendorProfile);
      expect(result).toBeNull();
    });

    it('should reject profile without required name', () => {
      const invalidProfile = { ...validVendorProfile, name: '' };
      const result = validateVendorProfile(invalidProfile);
      
      expect(result).not.toBeNull();
      expect(result?.errorCode).toBe('INVALID_INPUT');
      expect(result?.details?.name).toContain('required');
    });

    it('should reject profile without required email', () => {
      const invalidProfile = { ...validVendorProfile, email: '' };
      const result = validateVendorProfile(invalidProfile);
      
      expect(result).not.toBeNull();
      expect(result?.errorCode).toBe('INVALID_INPUT');
      expect(result?.details?.email).toContain('required');
    });

    it('should reject profile with invalid email format', () => {
      const invalidProfile = { ...validVendorProfile, email: 'invalid-email' };
      const result = validateVendorProfile(invalidProfile);
      
      expect(result).not.toBeNull();
      expect(result?.errorCode).toBe('INVALID_INPUT');
      expect(result?.details?.email).toContain('Invalid email format');
    });

    it('should reject profile without required phone', () => {
      const invalidProfile = { ...validVendorProfile, phone: '' };
      const result = validateVendorProfile(invalidProfile);
      
      expect(result).not.toBeNull();
      expect(result?.errorCode).toBe('INVALID_INPUT');
      expect(result?.details?.phone).toContain('required');
    });

    it('should reject profile without required address', () => {
      const invalidProfile = { ...validVendorProfile, address: '' };
      const result = validateVendorProfile(invalidProfile);
      
      expect(result).not.toBeNull();
      expect(result?.errorCode).toBe('INVALID_INPUT');
      expect(result?.details?.address).toContain('required');
    });

    it('should reject profile with invalid GST number format', () => {
      const invalidProfile = { ...validVendorProfile, gstNumber: 'INVALID-GST' };
      const result = validateVendorProfile(invalidProfile);
      
      expect(result).not.toBeNull();
      expect(result?.errorCode).toBe('INVALID_INPUT');
      expect(result?.details?.gstNumber).toContain('Invalid GST number format');
    });

    it('should reject profile with invalid UPI ID format', () => {
      const invalidProfile = { ...validVendorProfile, upiId: 'invalid-upi-no-at-sign' };
      const result = validateVendorProfile(invalidProfile);
      
      expect(result).not.toBeNull();
      expect(result?.errorCode).toBe('INVALID_INPUT');
      expect(result?.details?.upiId).toContain('Invalid UPI ID format');
    });

    it('should reject profile with invalid IFSC code format', () => {
      const invalidProfile = { ...validVendorProfile, ifscCode: 'INVALID' };
      const result = validateVendorProfile(invalidProfile);
      
      expect(result).not.toBeNull();
      expect(result?.errorCode).toBe('INVALID_INPUT');
      expect(result?.details?.ifscCode).toContain('Invalid IFSC code format');
    });

    it('should accept profile with optional fields omitted', () => {
      const minimalProfile: Partial<VendorProfile> = {
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+919876543210',
        address: '123 Main St',
      };
      const result = validateVendorProfile(minimalProfile);
      
      expect(result).toBeNull();
    });

    it('should accept profile with valid GST number', () => {
      const profileWithGST = { ...validVendorProfile, gstNumber: '22AAAAA0000A1Z5' };
      const result = validateVendorProfile(profileWithGST);
      
      expect(result).toBeNull();
    });

    it('should accept profile with valid UPI ID', () => {
      const profileWithUPI = { ...validVendorProfile, upiId: 'user@paytm' };
      const result = validateVendorProfile(profileWithUPI);
      
      expect(result).toBeNull();
    });

    it('should accept profile with valid IFSC code', () => {
      const profileWithIFSC = { ...validVendorProfile, ifscCode: 'SBIN0001234' };
      const result = validateVendorProfile(profileWithIFSC);
      
      expect(result).toBeNull();
    });

    it('should validate multiple errors at once', () => {
      const invalidProfile: Partial<VendorProfile> = {
        name: '',
        email: 'invalid-email',
        phone: '',
        address: '',
        gstNumber: 'INVALID',
      };
      const result = validateVendorProfile(invalidProfile);
      
      expect(result).not.toBeNull();
      expect(result?.errorCode).toBe('INVALID_INPUT');
      expect(Object.keys(result?.details || {})).toHaveLength(5);
    });
  });
});
