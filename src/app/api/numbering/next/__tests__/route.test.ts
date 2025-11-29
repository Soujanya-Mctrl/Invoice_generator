/**
 * Numbering API Route Tests
 * Tests for the invoice numbering API endpoint logic
 */

import { numberingService } from '@/lib/numbering/service';
import { storageService } from '@/lib/storage/service';

describe('Numbering API Route Logic', () => {
  beforeEach(() => {
    // Clear storage before each test
    storageService.clear();
  });

  afterEach(() => {
    // Clean up after each test
    storageService.clear();
  });

  describe('Invoice Number Generation', () => {
    it('should generate first invoice number', () => {
      const invoiceNumber = numberingService.generateNext();

      expect(invoiceNumber).toMatch(/^INV-\d{4}-001$/);
    });

    it('should increment invoice number on subsequent calls', () => {
      // First call
      const invoiceNumber1 = numberingService.generateNext();
      expect(invoiceNumber1).toMatch(/^INV-\d{4}-001$/);

      // Second call
      const invoiceNumber2 = numberingService.generateNext();
      expect(invoiceNumber2).toMatch(/^INV-\d{4}-002$/);

      // Third call
      const invoiceNumber3 = numberingService.generateNext();
      expect(invoiceNumber3).toMatch(/^INV-\d{4}-003$/);
    });

    it('should persist invoice number across service calls', () => {
      const invoiceNumber = numberingService.generateNext();

      // Verify it's stored
      const stored = storageService.getLastInvoiceNumber();
      expect(stored).toBe(invoiceNumber);
    });

    it('should return correct format', () => {
      const invoiceNumber = numberingService.generateNext();

      expect(invoiceNumber).toMatch(/^INV-\d{4}-\d{3}$/);
      expect(typeof invoiceNumber).toBe('string');
    });

    it('should handle year rollover correctly', () => {
      // Set a previous year invoice number
      const lastYear = new Date().getFullYear() - 1;
      storageService.saveLastInvoiceNumber(`INV-${lastYear}-999`);

      const invoiceNumber = numberingService.generateNext();

      expect(invoiceNumber).toMatch(/^INV-\d{4}-001$/);
      
      // Verify it's the current year
      const currentYear = new Date().getFullYear();
      expect(invoiceNumber).toBe(`INV-${currentYear}-001`);
    });

    it('should continue sequence in same year', () => {
      const currentYear = new Date().getFullYear();
      storageService.saveLastInvoiceNumber(`INV-${currentYear}-005`);

      const invoiceNumber = numberingService.generateNext();

      expect(invoiceNumber).toBe(`INV-${currentYear}-006`);
    });

    it('should handle large sequence numbers', () => {
      const currentYear = new Date().getFullYear();
      storageService.saveLastInvoiceNumber(`INV-${currentYear}-998`);

      const invoiceNumber = numberingService.generateNext();

      expect(invoiceNumber).toBe(`INV-${currentYear}-999`);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully when storage fails', () => {
      // Mock the storageService to throw an error
      const originalSave = storageService.saveLastInvoiceNumber;
      storageService.saveLastInvoiceNumber = jest.fn(() => {
        throw new Error('Storage error');
      });

      expect(() => {
        numberingService.generateNext();
      }).toThrow('Storage error');

      // Restore original method
      storageService.saveLastInvoiceNumber = originalSave;
    });
  });
});
