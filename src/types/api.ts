/**
 * API Request and Response Types
 * Defines the interfaces for all API endpoints
 */

import { InvoiceData } from './invoice';
import { VendorProfile } from './vendor';
import { ErrorResponse } from './error';

// Extract API
export interface ExtractRequest {
  text: string;
  useAI?: boolean;
}

export interface ExtractResponse {
  success: boolean;
  data?: Partial<InvoiceData>;
  error?: ErrorResponse;
  extractionMethod: 'regex' | 'ai' | 'hybrid';
}

// Generate API
export interface GenerateRequest {
  invoiceData: InvoiceData;
  vendorProfile: VendorProfile;
}

export interface GenerateResponse {
  success: boolean;
  pdfBlob?: Blob;
  error?: ErrorResponse;
}

// Vendor API
export interface VendorRequest {
  profile: VendorProfile;
}

export interface VendorResponse {
  success: boolean;
  error?: ErrorResponse;
}

// Numbering API
export interface NumberingResponse {
  success: boolean;
  invoiceNumber?: string;
  error?: ErrorResponse;
}

// Logo Upload API
export interface LogoUploadRequest {
  file: File;
}

export interface LogoUploadResponse {
  success: boolean;
  logoUrl?: string;
  error?: ErrorResponse;
}
