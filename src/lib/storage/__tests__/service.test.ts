/**
 * StorageService Unit Tests
 */

import { StorageService } from '../service';
import type { VendorProfile } from '@/types';

describe('StorageService', () => {
  let storageService: StorageService;
  let mockLocalStorage: { [key: string]: string };

  beforeEach(() => {
    // Create a fresh instance for each test
    storageService = new StorageService();
    
    // Mock localStorage with fresh state
    mockLocalStorage = {};
    
    // Setup localStorage mock
    Object.defineProperty(global, 'localStorage', {
      value: {
        getItem: (key: string) => mockLocalStorage[key] || null,
        setItem: (key: string, value: string) => {
          mockLocalStorage[key] = value;
        },
        removeItem: (key: string) => {
          delete mockLocalStorage[key];
        },
        clear: () => {
          mockLocalStorage = {};
        },
        length: 0,
        key: () => null,
      },
      writable: true,
    });
  });

  describe('saveVendorProfile and getVendorProfile', () => {
    it('should save and retrieve vendor profile', () => {
      const profile: VendorProfile = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+919876543210',
        address: '123 Main St, Mumbai',
        companyName: 'Acme Corp',
        gstNumber: '27AAPFU0939F1ZV',
      };

      storageService.saveVendorProfile(profile);
      const retrieved = storageService.getVendorProfile();

      expect(retrieved).toEqual(profile);
    });

    it('should return null when no profile exists', () => {
      const retrieved = storageService.getVendorProfile();
      expect(retrieved).toBeNull();
    });

    it('should handle QuotaExceededError when saving profile', () => {
      const profile: VendorProfile = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+919876543210',
        address: '123 Main St',
      };

      const quotaError = new Error('QuotaExceededError');
      quotaError.name = 'QuotaExceededError';
      
      // Override setItem to throw error
      global.localStorage.setItem = () => {
        throw quotaError;
      };

      expect(() => storageService.saveVendorProfile(profile)).toThrow(
        'Storage quota exceeded'
      );
    });
  });

  describe('saveLogo and getLogo', () => {
    it('should save and retrieve logo data URL', () => {
      const logoDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      storageService.saveLogo(logoDataUrl);
      const retrieved = storageService.getLogo();

      expect(retrieved).toBe(logoDataUrl);
    });

    it('should return null when no logo exists', () => {
      const retrieved = storageService.getLogo();
      expect(retrieved).toBeNull();
    });

    it('should handle QuotaExceededError when saving logo', () => {
      const logoDataUrl = 'data:image/png;base64,verylongstring';

      const quotaError = new Error('QuotaExceededError');
      quotaError.name = 'QuotaExceededError';
      
      // Override setItem to throw error
      global.localStorage.setItem = () => {
        throw quotaError;
      };

      expect(() => storageService.saveLogo(logoDataUrl)).toThrow(
        'Storage quota exceeded'
      );
    });
  });

  describe('getLastInvoiceNumber and saveLastInvoiceNumber', () => {
    it('should save and retrieve invoice number', () => {
      const invoiceNumber = 'INV-2024-001';

      storageService.saveLastInvoiceNumber(invoiceNumber);
      const retrieved = storageService.getLastInvoiceNumber();

      expect(retrieved).toBe(invoiceNumber);
    });

    it('should return null when no invoice number exists', () => {
      const retrieved = storageService.getLastInvoiceNumber();
      expect(retrieved).toBeNull();
    });

    it('should handle QuotaExceededError when saving invoice number', () => {
      const invoiceNumber = 'INV-2024-001';

      const quotaError = new Error('QuotaExceededError');
      quotaError.name = 'QuotaExceededError';
      
      // Override setItem to throw error
      global.localStorage.setItem = () => {
        throw quotaError;
      };

      expect(() => storageService.saveLastInvoiceNumber(invoiceNumber)).toThrow(
        'Storage quota exceeded'
      );
    });
  });

  describe('clear', () => {
    it('should remove all stored data', () => {
      const profile: VendorProfile = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+919876543210',
        address: '123 Main St',
      };
      const logoDataUrl = 'data:image/png;base64,abc123';
      const invoiceNumber = 'INV-2024-001';

      storageService.saveVendorProfile(profile);
      storageService.saveLogo(logoDataUrl);
      storageService.saveLastInvoiceNumber(invoiceNumber);

      storageService.clear();

      // Verify all data is removed
      expect(storageService.getVendorProfile()).toBeNull();
      expect(storageService.getLogo()).toBeNull();
      expect(storageService.getLastInvoiceNumber()).toBeNull();
    });
  });
});
