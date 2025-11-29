/**
 * NumberingService Tests
 */

import { NumberingService } from '../service';
import { storageService } from '@/lib/storage/service';

describe('NumberingService', () => {
  let numberingService: NumberingService;

  beforeEach(() => {
    numberingService = new NumberingService();
    // Clear storage before each test
    storageService.clear();
  });

  afterEach(() => {
    // Clean up after each test
    storageService.clear();
  });

  describe('formatInvoiceNumber', () => {
    it('should format invoice number with zero-padded sequence', () => {
      expect(numberingService.formatInvoiceNumber(2024, 1)).toBe('INV-2024-001');
      expect(numberingService.formatInvoiceNumber(2024, 42)).toBe('INV-2024-042');
      expect(numberingService.formatInvoiceNumber(2024, 999)).toBe('INV-2024-999');
    });

    it('should handle large sequence numbers', () => {
      expect(numberingService.formatInvoiceNumber(2024, 1234)).toBe('INV-2024-1234');
    });
  });

  describe('parseInvoiceNumber', () => {
    it('should parse valid invoice number', () => {
      const result = numberingService.parseInvoiceNumber('INV-2024-001');
      expect(result).toEqual({ year: 2024, sequence: 1 });
    });

    it('should parse invoice number with larger sequence', () => {
      const result = numberingService.parseInvoiceNumber('INV-2024-042');
      expect(result).toEqual({ year: 2024, sequence: 42 });
    });

    it('should throw error for invalid format', () => {
      expect(() => numberingService.parseInvoiceNumber('INVALID')).toThrow(
        'Invalid invoice number format'
      );
    });

    it('should throw error for missing parts', () => {
      expect(() => numberingService.parseInvoiceNumber('INV-2024')).toThrow(
        'Invalid invoice number format'
      );
    });
  });

  describe('generateNext', () => {
    it('should generate first invoice number when none exists', () => {
      const currentYear = new Date().getFullYear();
      const result = numberingService.generateNext();
      expect(result).toBe(`INV-${currentYear}-001`);
    });

    it('should increment sequence for same year', () => {
      const currentYear = new Date().getFullYear();
      storageService.saveLastInvoiceNumber(`INV-${currentYear}-001`);
      
      const result = numberingService.generateNext();
      expect(result).toBe(`INV-${currentYear}-002`);
    });

    it('should reset sequence for new year', () => {
      const currentYear = new Date().getFullYear();
      const lastYear = currentYear - 1;
      storageService.saveLastInvoiceNumber(`INV-${lastYear}-999`);
      
      const result = numberingService.generateNext();
      expect(result).toBe(`INV-${currentYear}-001`);
    });

    it('should persist generated number to storage', () => {
      const currentYear = new Date().getFullYear();
      const result = numberingService.generateNext();
      
      const stored = storageService.getLastInvoiceNumber();
      expect(stored).toBe(result);
      expect(stored).toBe(`INV-${currentYear}-001`);
    });

    it('should generate sequential numbers', () => {
      const currentYear = new Date().getFullYear();
      
      const first = numberingService.generateNext();
      expect(first).toBe(`INV-${currentYear}-001`);
      
      const second = numberingService.generateNext();
      expect(second).toBe(`INV-${currentYear}-002`);
      
      const third = numberingService.generateNext();
      expect(third).toBe(`INV-${currentYear}-003`);
    });
  });
});
