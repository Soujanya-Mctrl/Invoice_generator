/**
 * Numbering Service
 * Handles invoice number generation with year-based sequencing
 */

import { storageService } from '@/lib/storage/service';

/**
 * Invoice number format: INV-YYYY-###
 * - YYYY: 4-digit year
 * - ###: 3-digit zero-padded sequence number
 */
const INVOICE_NUMBER_PATTERN = /^INV-(\d{4})-(\d{3})$/;

/**
 * NumberingService class for managing invoice number generation
 */
export class NumberingService {
  /**
   * Generate the next invoice number in sequence
   * Handles year rollover and sequence increment
   * @returns The next invoice number in format INV-YYYY-###
   */
  generateNext(): string {
    const lastNumber = storageService.getLastInvoiceNumber();
    const currentYear = new Date().getFullYear();

    // If no previous invoice number exists, start with 001
    if (!lastNumber) {
      const newNumber = this.formatInvoiceNumber(currentYear, 1);
      storageService.saveLastInvoiceNumber(newNumber);
      return newNumber;
    }

    // Parse the last invoice number
    const { year, sequence } = this.parseInvoiceNumber(lastNumber);

    // Check if we need to rollover to a new year
    if (year < currentYear) {
      // New year - reset sequence to 001
      const newNumber = this.formatInvoiceNumber(currentYear, 1);
      storageService.saveLastInvoiceNumber(newNumber);
      return newNumber;
    }

    // Same year - increment sequence
    const nextSequence = sequence + 1;
    const newNumber = this.formatInvoiceNumber(currentYear, nextSequence);
    storageService.saveLastInvoiceNumber(newNumber);
    return newNumber;
  }

  /**
   * Parse an invoice number to extract year and sequence
   * @param invoiceNumber - The invoice number to parse (format: INV-YYYY-###)
   * @returns Object containing year and sequence number
   * @throws Error if invoice number format is invalid
   */
  parseInvoiceNumber(invoiceNumber: string): { year: number; sequence: number } {
    const match = invoiceNumber.match(INVOICE_NUMBER_PATTERN);

    if (!match) {
      throw new Error(
        `Invalid invoice number format: ${invoiceNumber}. Expected format: INV-YYYY-###`
      );
    }

    const year = parseInt(match[1], 10);
    const sequence = parseInt(match[2], 10);

    return { year, sequence };
  }

  /**
   * Format year and sequence into invoice number string
   * @param year - The 4-digit year
   * @param sequence - The sequence number (will be zero-padded to 3 digits)
   * @returns Formatted invoice number (INV-YYYY-###)
   */
  formatInvoiceNumber(year: number, sequence: number): string {
    // Zero-pad sequence to 3 digits
    const paddedSequence = sequence.toString().padStart(3, '0');
    return `INV-${year}-${paddedSequence}`;
  }
}

/**
 * Singleton instance of NumberingService
 */
export const numberingService = new NumberingService();
