/**
 * Invoice Data Models
 * Defines the core data structures for invoice generation
 */

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface PaymentInfo {
  upiId?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  accountHolderName?: string;
}

export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string; // ISO 8601 format
  dueDate?: string;
  
  // Client information
  clientName: string;
  clientCompany?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  
  // Line items
  items: LineItem[];
  
  // Financial
  currency: string; // ISO 4217 code (INR, USD, EUR)
  subtotal: number;
  taxRate?: number; // Percentage
  taxAmount?: number;
  total: number;
  
  // Payment information
  paymentInfo?: PaymentInfo;
  
  // Notes
  notes?: string;
}
