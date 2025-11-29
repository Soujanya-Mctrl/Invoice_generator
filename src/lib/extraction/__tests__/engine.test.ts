/**
 * Tests for ExtractionEngine
 */

import { ExtractionEngine } from '../engine';

describe('ExtractionEngine', () => {
  let engine: ExtractionEngine;

  beforeEach(() => {
    engine = new ExtractionEngine();
  });

  describe('extractWithRegex', () => {
    it('should extract INR amount with rupee symbol', () => {
      const text = 'Please pay ₹5,000.00 for services';
      const result = engine.extractWithRegex(text);
      
      expect(result.total).toBe(5000.00);
      expect(result.currency).toBe('INR');
    });

    it('should extract USD amount with dollar sign', () => {
      const text = 'Total: $1,234.56';
      const result = engine.extractWithRegex(text);
      
      expect(result.total).toBe(1234.56);
      expect(result.currency).toBe('USD');
    });

    it('should extract EUR amount with euro symbol', () => {
      const text = 'Amount due: €999.99';
      const result = engine.extractWithRegex(text);
      
      expect(result.total).toBe(999.99);
      expect(result.currency).toBe('EUR');
    });

    it('should extract dates in DD/MM/YYYY format', () => {
      const text = 'Invoice date: 15/03/2024';
      const result = engine.extractWithRegex(text);
      
      expect(result.invoiceDate).toBe('2024-03-15');
    });

    it('should extract dates in YYYY-MM-DD format', () => {
      const text = 'Due date: 2024-12-31';
      const result = engine.extractWithRegex(text);
      
      expect(result.invoiceDate).toBe('2024-12-31');
    });

    it('should extract dates in text format with ordinal', () => {
      const text = 'Please pay by 12th March 2025';
      const result = engine.extractWithRegex(text);
      
      expect(result.invoiceDate).toBe('2025-03-12');
    });

    it('should extract UPI ID', () => {
      const text = 'Pay to: merchant@paytm';
      const result = engine.extractWithRegex(text);
      
      expect(result.paymentInfo?.upiId).toBe('merchant@paytm');
    });

    it('should extract bank account number', () => {
      const text = 'Account: 1234567890123';
      const result = engine.extractWithRegex(text);
      
      expect(result.paymentInfo?.accountNumber).toBe('1234567890123');
    });

    it('should extract IFSC code', () => {
      const text = 'IFSC: HDFC0001234';
      const result = engine.extractWithRegex(text);
      
      expect(result.paymentInfo?.ifscCode).toBe('HDFC0001234');
    });

    it('should extract email address', () => {
      const text = 'Contact: client@example.com';
      const result = engine.extractWithRegex(text);
      
      expect(result.clientEmail).toBe('client@example.com');
    });

    it('should extract phone number', () => {
      const text = 'Phone: +919876543210';
      const result = engine.extractWithRegex(text);
      
      expect(result.clientPhone).toBe('9876543210');
    });

    it('should extract client name from "from" pattern', () => {
      const text = 'Payment from John Doe for services';
      const result = engine.extractWithRegex(text);
      
      expect(result.clientName).toBe('John Doe');
    });

    it('should extract client name from greeting pattern', () => {
      const text = 'Hi Mr. Ankit Sharma, Here is the invoice for services';
      const result = engine.extractWithRegex(text);
      
      expect(result.clientName).toBe('Ankit Sharma');
    });

    it('should extract multiple fields from complex text', () => {
      const text = `
        Payment from Alice Smith
        Amount: ₹15,000.00
        Date: 25/11/2024
        UPI: alice@oksbi
        Phone: 9876543210
      `;
      const result = engine.extractWithRegex(text);
      
      expect(result.clientName).toBe('Alice Smith');
      expect(result.total).toBe(15000.00);
      expect(result.currency).toBe('INR');
      expect(result.invoiceDate).toBe('2024-11-25');
      expect(result.paymentInfo?.upiId).toBe('alice@oksbi');
      expect(result.clientPhone).toBe('9876543210');
    });

    it('should extract all fields from real-world payment text', () => {
      const text = 'Hi Ankit,Here\'s the final amount for the design work completed.Logo redesign came to ₹3,200 and the website banner set is ₹4,500.Total payable is ₹7,700.Please try to clear it by 12th March 2025.';
      const result = engine.extractWithRegex(text);
      
      expect(result.clientName).toBe('Ankit');
      expect(result.currency).toBe('INR');
      expect(result.invoiceDate).toBe('2025-03-12');
      
      // Should extract line items
      expect(result.items).toBeDefined();
      expect(result.items?.length).toBeGreaterThan(0);
      
      // Should calculate total from line items
      if (result.items && result.items.length > 0) {
        const calculatedTotal = result.items.reduce((sum, item) => sum + item.amount, 0);
        expect(result.total).toBe(calculatedTotal);
      }
    });

    it('should extract line items with descriptions and amounts', () => {
      const text = 'Logo redesign came to ₹3,200 and the website banner set is ₹4,500';
      const result = engine.extractWithRegex(text);
      
      expect(result.items).toBeDefined();
      expect(result.items?.length).toBe(2);
      
      if (result.items) {
        expect(result.items[0].description).toContain('Logo redesign');
        expect(result.items[0].amount).toBe(3200);
        
        expect(result.items[1].description).toContain('website banner set');
        expect(result.items[1].amount).toBe(4500);
        
        expect(result.total).toBe(7700);
      }
    });
  });

  describe('extractGSTNumber', () => {
    it('should extract valid GST number', () => {
      const text = 'GST: 29ABCDE1234F1Z5';
      const result = engine.extractGSTNumber(text);
      
      expect(result).toBe('29ABCDE1234F1Z5');
    });

    it('should return null for invalid GST format', () => {
      const text = 'GST: INVALID123';
      const result = engine.extractGSTNumber(text);
      
      expect(result).toBeNull();
    });
  });

  describe('mergeResults', () => {
    it('should add default currency if missing', () => {
      const extracted = { total: 1000 };
      const result = engine.mergeResults(extracted);
      
      expect(result.currency).toBe('INR');
    });

    it('should add default invoice date if missing', () => {
      const extracted = { total: 1000 };
      const result = engine.mergeResults(extracted);
      
      expect(result.invoiceDate).toBeDefined();
      expect(result.invoiceDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should initialize empty items array', () => {
      const extracted = { total: 1000 };
      const result = engine.mergeResults(extracted);
      
      expect(result.items).toEqual([]);
    });

    it('should preserve existing values', () => {
      const extracted = {
        total: 1000,
        currency: 'USD',
        invoiceDate: '2024-01-01',
        clientName: 'Test Client',
      };
      const result = engine.mergeResults(extracted);
      
      expect(result.currency).toBe('USD');
      expect(result.invoiceDate).toBe('2024-01-01');
      expect(result.clientName).toBe('Test Client');
    });
  });

  describe('mergeExtractionResults', () => {
    it('should prefer AI results over regex results', () => {
      const regexResults = {
        clientName: 'John',
        total: 1000,
        currency: 'INR',
      };
      const aiResults = {
        clientName: 'John Doe',
        clientCompany: 'Acme Corp',
      };
      
      const result = engine.mergeExtractionResults(regexResults, aiResults);
      
      expect(result.clientName).toBe('John Doe');
      expect(result.clientCompany).toBe('Acme Corp');
      expect(result.total).toBe(1000);
      expect(result.currency).toBe('INR');
    });

    it('should merge payment info from both sources', () => {
      const regexResults = {
        paymentInfo: {
          upiId: 'test@paytm',
          ifscCode: 'HDFC0001234',
        },
      };
      const aiResults = {
        paymentInfo: {
          bankName: 'HDFC Bank',
          accountNumber: '1234567890',
        },
      };
      
      const result = engine.mergeExtractionResults(regexResults, aiResults);
      
      expect(result.paymentInfo?.upiId).toBe('test@paytm');
      expect(result.paymentInfo?.ifscCode).toBe('HDFC0001234');
      expect(result.paymentInfo?.bankName).toBe('HDFC Bank');
      expect(result.paymentInfo?.accountNumber).toBe('1234567890');
    });

    it('should add defaults for missing fields', () => {
      const regexResults = { total: 1000 };
      const aiResults = { clientName: 'Test Client' };
      
      const result = engine.mergeExtractionResults(regexResults, aiResults);
      
      expect(result.currency).toBe('INR');
      expect(result.invoiceDate).toBeDefined();
      expect(result.items).toEqual([]);
    });
  });

  describe('extractWithAI', () => {
    it('should throw error when GEMINI_API_KEY is not configured', async () => {
      const originalKey = process.env.GEMINI_API_KEY;
      delete process.env.GEMINI_API_KEY;
      
      await expect(engine.extractWithAI('test text')).rejects.toThrow('GEMINI_API_KEY not configured');
      
      process.env.GEMINI_API_KEY = originalKey;
    });

    it('should handle timeout gracefully', async () => {
      // This test would require mocking the Gemini API
      // Skipping for now as it requires external API setup
    });
  });
});
