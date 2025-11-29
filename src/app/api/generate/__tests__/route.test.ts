/**
 * Generate API Route Tests
 * Basic validation tests for the PDF generation API endpoint
 */

import { PDFGenerator } from '@/lib/pdf/generator';
import { numberingService } from '@/lib/numbering/service';
import { storageService } from '@/lib/storage/service';
import type { InvoiceData, VendorProfile } from '@/types';

describe('Generate API Route Logic', () => {
  beforeEach(() => {
    // Clear storage before each test
    storageService.clear();
  });

  afterEach(() => {
    // Clean up after each test
    storageService.clear();
  });

  const validInvoiceData: InvoiceData = {
    invoiceNumber: 'INV-2024-001',
    invoiceDate: '2024-01-15',
    clientName: 'John Doe',
    clientCompany: 'Acme Corp',
    items: [
      {
        id: '1',
        description: 'Web Development Services',
        quantity: 10,
        rate: 100,
        amount: 1000,
      },
    ],
    currency: 'INR',
    subtotal: 1000,
    total: 1000,
  };

  const validVendorProfile: VendorProfile = {
    name: 'Jane Smith',
    companyName: 'Smith Consulting',
    email: 'jane@example.com',
    phone: '+919876543210',
    address: '123 Main St, City, State 12345',
  };

  describe('Invoice Data Validation', () => {
    it('should validate complete invoice data', () => {
      expect(() => PDFGenerator.validateInvoiceData(validInvoiceData)).not.toThrow();
    });

    it('should reject invoice without invoice number', () => {
      const invalidData = { ...validInvoiceData, invoiceNumber: '' };
      expect(() => PDFGenerator.validateInvoiceData(invalidData)).toThrow('Invoice number is required');
    });

    it('should reject invoice without client name', () => {
      const invalidData = { ...validInvoiceData, clientName: '' };
      expect(() => PDFGenerator.validateInvoiceData(invalidData)).toThrow('Client name is required');
    });

    it('should reject invoice without line items', () => {
      const invalidData = { ...validInvoiceData, items: [] };
      expect(() => PDFGenerator.validateInvoiceData(invalidData)).toThrow('At least one line item is required');
    });

    it('should reject invoice with negative total', () => {
      const invalidData = { ...validInvoiceData, total: -100 };
      expect(() => PDFGenerator.validateInvoiceData(invalidData)).toThrow('Valid total amount is required');
    });
  });

  describe('Vendor Profile Validation', () => {
    it('should validate complete vendor profile', () => {
      expect(() => PDFGenerator.validateVendorProfile(validVendorProfile)).not.toThrow();
    });

    it('should reject vendor without name', () => {
      const invalidVendor = { ...validVendorProfile, name: '' };
      expect(() => PDFGenerator.validateVendorProfile(invalidVendor)).toThrow('Vendor name is required');
    });

    it('should reject vendor without email', () => {
      const invalidVendor = { ...validVendorProfile, email: '' };
      expect(() => PDFGenerator.validateVendorProfile(invalidVendor)).toThrow('Vendor email is required');
    });

    it('should reject vendor without phone', () => {
      const invalidVendor = { ...validVendorProfile, phone: '' };
      expect(() => PDFGenerator.validateVendorProfile(invalidVendor)).toThrow('Vendor phone is required');
    });

    it('should reject vendor without address', () => {
      const invalidVendor = { ...validVendorProfile, address: '' };
      expect(() => PDFGenerator.validateVendorProfile(invalidVendor)).toThrow('Vendor address is required');
    });
  });

  describe('Invoice Number Generation', () => {
    it('should generate invoice number when empty', () => {
      const invoiceNumber = numberingService.generateNext();
      expect(invoiceNumber).toMatch(/^INV-\d{4}-\d{3}$/);
    });

    it('should persist generated invoice number', () => {
      const invoiceNumber = numberingService.generateNext();
      const stored = storageService.getLastInvoiceNumber();
      expect(stored).toBe(invoiceNumber);
    });
  });

  describe('PDF Generation', () => {
    it('should generate PDF blob from valid data', async () => {
      const blob = await PDFGenerator.generateInvoice(validInvoiceData, validVendorProfile);
      
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/pdf');
      expect(blob.size).toBeGreaterThan(0);
    });

    it('should generate PDF even with minimal data', async () => {
      // PDFGenerator itself doesn't validate - validation happens in the API route
      const minimalData = {
        ...validInvoiceData,
        clientCompany: undefined,
      };
      
      const blob = await PDFGenerator.generateInvoice(minimalData, validVendorProfile);
      expect(blob).toBeInstanceOf(Blob);
    });
  });
});
