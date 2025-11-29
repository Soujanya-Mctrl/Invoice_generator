/**
 * PDF Generator Service
 * Handles PDF generation using react-pdf/renderer
 */

import { pdf } from '@react-pdf/renderer';
import { InvoiceDocument } from './InvoiceDocument';
import type { InvoiceData, VendorProfile } from '@/types';

/**
 * PDF Generator Class
 * Provides methods to generate invoice PDFs
 */
export class PDFGenerator {
  /**
   * Generate an invoice PDF from invoice data and vendor profile
   * @param data - Invoice data containing all invoice information
   * @param vendor - Vendor profile with business details
   * @returns Promise resolving to PDF Blob
   */
  static async generateInvoice(
    data: InvoiceData,
    vendor: VendorProfile
  ): Promise<Blob> {
    try {
      // Create the PDF document using react-pdf
      const document = InvoiceDocument({ data, vendor });
      
      // Generate the PDF blob
      const blob = await pdf(document).toBlob();
      
      return blob;
    } catch (error) {
      throw new Error(
        `PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Generate an invoice PDF and return as data URL
   * @param data - Invoice data containing all invoice information
   * @param vendor - Vendor profile with business details
   * @returns Promise resolving to PDF data URL
   */
  static async generateInvoiceDataUrl(
    data: InvoiceData,
    vendor: VendorProfile
  ): Promise<string> {
    const blob = await this.generateInvoice(data, vendor);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert blob to data URL'));
        }
      };
      reader.onerror = () => reject(new Error('FileReader error'));
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Validate invoice data before PDF generation
   * @param data - Invoice data to validate
   * @returns true if valid, throws error otherwise
   */
  static validateInvoiceData(data: InvoiceData): boolean {
    if (!data.invoiceNumber) {
      throw new Error('Invoice number is required');
    }
    if (!data.invoiceDate) {
      throw new Error('Invoice date is required');
    }
    if (!data.clientName) {
      throw new Error('Client name is required');
    }
    if (!data.items || data.items.length === 0) {
      throw new Error('At least one line item is required');
    }
    if (data.total === undefined || data.total < 0) {
      throw new Error('Valid total amount is required');
    }
    return true;
  }

  /**
   * Validate vendor profile before PDF generation
   * @param vendor - Vendor profile to validate
   * @returns true if valid, throws error otherwise
   */
  static validateVendorProfile(vendor: VendorProfile): boolean {
    if (!vendor.name) {
      throw new Error('Vendor name is required');
    }
    if (!vendor.email) {
      throw new Error('Vendor email is required');
    }
    if (!vendor.phone) {
      throw new Error('Vendor phone is required');
    }
    if (!vendor.address) {
      throw new Error('Vendor address is required');
    }
    return true;
  }
}
