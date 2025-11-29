/**
 * Vendor Profile Data Model
 * Defines the structure for vendor/business information
 */

export interface VendorProfile {
  name: string;
  companyName?: string;
  email: string;
  phone: string;
  address: string;
  gstNumber?: string;
  logoUrl?: string; // Base64 data URL
  
  // Payment details
  upiId?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  accountHolderName?: string;
}
