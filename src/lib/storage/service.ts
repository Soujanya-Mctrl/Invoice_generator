/**
 * Storage Service
 * Handles localStorage operations for vendor profiles, logos, and invoice numbering
 */

import type { VendorProfile } from '@/types';

/**
 * Storage keys used for localStorage
 */
const STORAGE_KEYS = {
  VENDOR_PROFILE: 'invoice_vendor_profile',
  VENDOR_LOGO: 'invoice_vendor_logo',
  LAST_INVOICE_NUMBER: 'invoice_last_number',
} as const;

/**
 * StorageService class for managing localStorage operations
 */
export class StorageService {
  /**
   * Save vendor profile to localStorage
   * @param profile - The vendor profile to save
   * @throws Error if storage quota is exceeded
   */
  saveVendorProfile(profile: VendorProfile): void {
    try {
      const serialized = JSON.stringify(profile);
      localStorage.setItem(STORAGE_KEYS.VENDOR_PROFILE, serialized);
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        throw new Error('Storage quota exceeded. Please clear some data or reduce the size of your profile.');
      }
      throw error;
    }
  }

  /**
   * Retrieve vendor profile from localStorage
   * @returns The vendor profile or null if not found
   */
  getVendorProfile(): VendorProfile | null {
    try {
      const serialized = localStorage.getItem(STORAGE_KEYS.VENDOR_PROFILE);
      if (!serialized) {
        return null;
      }
      return JSON.parse(serialized) as VendorProfile;
    } catch (error) {
      console.error('Error retrieving vendor profile:', error);
      return null;
    }
  }

  /**
   * Save logo as base64 data URL to localStorage
   * @param dataUrl - The base64 data URL of the logo
   * @throws Error if storage quota is exceeded
   */
  saveLogo(dataUrl: string): void {
    try {
      localStorage.setItem(STORAGE_KEYS.VENDOR_LOGO, dataUrl);
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        throw new Error('Storage quota exceeded. Logo file is too large. Please use a smaller image.');
      }
      throw error;
    }
  }

  /**
   * Retrieve logo data URL from localStorage
   * @returns The logo data URL or null if not found
   */
  getLogo(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEYS.VENDOR_LOGO);
    } catch (error) {
      console.error('Error retrieving logo:', error);
      return null;
    }
  }

  /**
   * Get the last used invoice number from localStorage
   * @returns The last invoice number or null if not found
   */
  getLastInvoiceNumber(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEYS.LAST_INVOICE_NUMBER);
    } catch (error) {
      console.error('Error retrieving last invoice number:', error);
      return null;
    }
  }

  /**
   * Save the last used invoice number to localStorage
   * @param number - The invoice number to save
   * @throws Error if storage quota is exceeded
   */
  saveLastInvoiceNumber(number: string): void {
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_INVOICE_NUMBER, number);
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        throw new Error('Storage quota exceeded. Unable to save invoice number.');
      }
      throw error;
    }
  }

  /**
   * Clear all stored data from localStorage
   */
  clear(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.VENDOR_PROFILE);
      localStorage.removeItem(STORAGE_KEYS.VENDOR_LOGO);
      localStorage.removeItem(STORAGE_KEYS.LAST_INVOICE_NUMBER);
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }
}

/**
 * Singleton instance of StorageService
 */
export const storageService = new StorageService();
