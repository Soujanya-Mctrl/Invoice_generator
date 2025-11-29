/**
 * PDFGenerator Unit Tests
 */

import { PDFGenerator } from '../generator';
import type { InvoiceData, VendorProfile } from '@/types';

describe('PDFGenerator', () => {
  const mockVendorProfile: VendorProfile = {
    name: 'John Doe',
    companyName: 'Acme Corp',
    email: 'john@acme.com',
    phone: '+919876543210',
    address: '123 Main St, Mumbai, Maharashtra 400001',
    gstNumber: '27AAPFU0939F1ZV',
    upiId: 'john@upi',
    bankName: 'HDFC Bank',
    accountNumber: '1234567890',
    ifscCode: 'HDFC0001234',
    accountHolderName: 'John Doe',
  };

  const mockInvoiceData: InvoiceData = {
    invoiceNumber: 'INV-2024-001',
    invoiceDate: '2024-01-15',
    dueDate: '2024-02-15',
    clientName: 'Jane Smith',
    clientCompany: 'Tech Solutions Inc',
    clientEmail: 'jane@techsolutions.com',
    clientPhone: '+919876543211',
    clientAddress: '456 Park Ave, Delhi 110001',
    items: [
      {
        id: '1',
        description: 'Web Development Services',
        quantity: 10,
        rate: 5000,
        amount: 50000,
      },
      {
        id: '2',
        description: 'UI/UX Design',
        quantity: 5,
        rate: 3000,
        amount: 15000,
      },
    ],
    currency: 'INR',
    subtotal: 65000,
    taxRate: 18,
    taxAmount: 11700,
    total: 76700,
    paymentInfo: {
      upiId: 'john@upi',
      bankName: 'HDFC Bank',
      accountNumber: '1234567890',
      ifscCode: 'HDFC0001234',
      accountHolderName: 'John Doe',
    },
    notes: 'Payment due within 30 days',
  };

  describe('generateInvoice', () => {
    it('should generate a PDF blob from valid invoice data', async () => {
      const blob = await PDFGenerator.generateInvoice(
        mockInvoiceData,
        mockVendorProfile
      );

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/pdf');
      expect(blob.size).toBeGreaterThan(0);
    });

    it('should generate PDF without optional fields', async () => {
      const minimalInvoiceData: InvoiceData = {
        invoiceNumber: 'INV-2024-002',
        invoiceDate: '2024-01-15',
        clientName: 'Jane Smith',
        items: [
          {
            id: '1',
            description: 'Consulting Services',
            quantity: 1,
            rate: 10000,
            amount: 10000,
          },
        ],
        currency: 'INR',
        subtotal: 10000,
        total: 10000,
      };

      const minimalVendor: VendorProfile = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+919876543210',
        address: '123 Main St',
      };

      const blob = await PDFGenerator.generateInvoice(
        minimalInvoiceData,
        minimalVendor
      );

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/pdf');
      expect(blob.size).toBeGreaterThan(0);
    });

    it('should handle PDF generation errors gracefully', async () => {
      const invalidData = {} as InvoiceData;
      const invalidVendor = {} as VendorProfile;

      await expect(
        PDFGenerator.generateInvoice(invalidData, invalidVendor)
      ).rejects.toThrow('PDF generation failed');
    });
  });

  describe('generateInvoiceDataUrl', () => {
    it('should generate a PDF data URL', async () => {
      const dataUrl = await PDFGenerator.generateInvoiceDataUrl(
        mockInvoiceData,
        mockVendorProfile
      );

      expect(dataUrl).toMatch(/^data:application\/pdf;base64,/);
      expect(dataUrl.length).toBeGreaterThan(0);
    });
  });

  describe('validateInvoiceData', () => {
    it('should validate complete invoice data', () => {
      expect(PDFGenerator.validateInvoiceData(mockInvoiceData)).toBe(true);
    });

    it('should throw error for missing invoice number', () => {
      const invalidData = { ...mockInvoiceData, invoiceNumber: '' };
      expect(() => PDFGenerator.validateInvoiceData(invalidData)).toThrow(
        'Invoice number is required'
      );
    });

    it('should throw error for missing invoice date', () => {
      const invalidData = { ...mockInvoiceData, invoiceDate: '' };
      expect(() => PDFGenerator.validateInvoiceData(invalidData)).toThrow(
        'Invoice date is required'
      );
    });

    it('should throw error for missing client name', () => {
      const invalidData = { ...mockInvoiceData, clientName: '' };
      expect(() => PDFGenerator.validateInvoiceData(invalidData)).toThrow(
        'Client name is required'
      );
    });

    it('should throw error for empty line items', () => {
      const invalidData = { ...mockInvoiceData, items: [] };
      expect(() => PDFGenerator.validateInvoiceData(invalidData)).toThrow(
        'At least one line item is required'
      );
    });

    it('should throw error for invalid total', () => {
      const invalidData = { ...mockInvoiceData, total: -100 };
      expect(() => PDFGenerator.validateInvoiceData(invalidData)).toThrow(
        'Valid total amount is required'
      );
    });
  });

  describe('validateVendorProfile', () => {
    it('should validate complete vendor profile', () => {
      expect(PDFGenerator.validateVendorProfile(mockVendorProfile)).toBe(true);
    });

    it('should throw error for missing vendor name', () => {
      const invalidVendor = { ...mockVendorProfile, name: '' };
      expect(() => PDFGenerator.validateVendorProfile(invalidVendor)).toThrow(
        'Vendor name is required'
      );
    });

    it('should throw error for missing vendor email', () => {
      const invalidVendor = { ...mockVendorProfile, email: '' };
      expect(() => PDFGenerator.validateVendorProfile(invalidVendor)).toThrow(
        'Vendor email is required'
      );
    });

    it('should throw error for missing vendor phone', () => {
      const invalidVendor = { ...mockVendorProfile, phone: '' };
      expect(() => PDFGenerator.validateVendorProfile(invalidVendor)).toThrow(
        'Vendor phone is required'
      );
    });

    it('should throw error for missing vendor address', () => {
      const invalidVendor = { ...mockVendorProfile, address: '' };
      expect(() => PDFGenerator.validateVendorProfile(invalidVendor)).toThrow(
        'Vendor address is required'
      );
    });
  });
});
