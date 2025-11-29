'use client';

import React, { useState, useEffect } from 'react';
import { VendorProfile as VendorProfileType } from '@/types';
import { ErrorResponse } from '@/types/error';
import { storageService } from '@/lib/storage/service';
import { validateGSTNumber } from '@/lib/validation/validators';
import ErrorDisplay from '@/components/ErrorDisplay';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X } from 'lucide-react';

interface VendorProfileProps {
  profile: VendorProfileType | null;
  onChange: (profile: VendorProfileType) => void;
  onLogoUpload: (file: File) => void;
  isSetupMode?: boolean;
}

/**
 * VendorProfile Component
 * 
 * Collapsible panel for managing vendor information including:
 * - Basic details (name, company, email, phone, address, GST)
 * - Payment details (UPI ID, bank account, IFSC, account holder name)
 * - Logo upload with preview
 * 
 * Features:
 * - Loads existing profile from localStorage on mount
 * - Auto-saves changes to localStorage
 * - Validates GST number format
 * - Logo preview and removal
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */
export default function VendorProfile({
  profile,
  onChange,
  onLogoUpload,
  isSetupMode = false,
}: VendorProfileProps) {
  const [localProfile, setLocalProfile] = useState<VendorProfileType | null>(profile);
  const [gstError, setGstError] = useState<string>('');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [error, setError] = useState<ErrorResponse | null>(null);

  // Load existing profile from localStorage on mount
  useEffect(() => {
    const savedProfile = storageService.getVendorProfile();
    if (savedProfile) {
      setLocalProfile(savedProfile);
      onChange(savedProfile);
    }

    const savedLogo = storageService.getLogo();
    if (savedLogo) {
      setLogoPreview(savedLogo);
    }
  }, []);

  // Update local profile when prop changes
  useEffect(() => {
    if (profile) {
      setLocalProfile(profile);
      if (profile.logoUrl) {
        setLogoPreview(profile.logoUrl);
      }
    }
  }, [profile]);

  // Auto-save changes to localStorage
  const handleFieldChange = (field: keyof VendorProfileType, value: string) => {
    const updatedProfile = {
      ...localProfile,
      [field]: value,
    } as VendorProfileType;

    setLocalProfile(updatedProfile);
    
    // Validate GST number if it's being changed
    if (field === 'gstNumber' && value.trim() !== '') {
      if (!validateGSTNumber(value)) {
        setGstError('Invalid GST format. Expected: 22AAAAA0000A1Z5');
      } else {
        setGstError('');
      }
    }

    // Save to localStorage
    try {
      storageService.saveVendorProfile(updatedProfile);
      onChange(updatedProfile);
      setError(null); // Clear any previous errors
    } catch (error) {
      console.error('Error saving vendor profile:', error);
      
      // Check if it's a quota exceeded error
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        setError({
          errorCode: 'STORAGE_QUOTA_EXCEEDED',
          message: 'Storage quota exceeded. Unable to save vendor profile.',
        });
      } else {
        setError({
          errorCode: 'NETWORK_ERROR',
          message: 'Failed to save vendor profile. Please try again.',
        });
      }
    }
  };

  // Handle logo file selection
  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml'];
      if (!validTypes.includes(file.type)) {
        setError({
          errorCode: 'INVALID_FILE_TYPE',
          message: 'Invalid file type. Please upload a JPEG, PNG, or SVG image.',
        });
        return;
      }

      // Validate file size (500KB = 512000 bytes)
      const maxSize = 512000;
      if (file.size > maxSize) {
        setError({
          errorCode: 'FILE_TOO_LARGE',
          message: `File size exceeds 500KB limit. Current size: ${Math.round(file.size / 1024)}KB`,
        });
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setLogoPreview(dataUrl);
        
        // Save to localStorage
        try {
          storageService.saveLogo(dataUrl);
          
          // Update profile with logo URL
          const updatedProfile = {
            ...localProfile,
            logoUrl: dataUrl,
          } as VendorProfileType;
          setLocalProfile(updatedProfile);
          storageService.saveVendorProfile(updatedProfile);
          onChange(updatedProfile);
          setError(null); // Clear any previous errors
        } catch (error) {
          console.error('Error saving logo:', error);
          
          // Check if it's a quota exceeded error
          if (error instanceof Error && error.name === 'QuotaExceededError') {
            setError({
              errorCode: 'STORAGE_QUOTA_EXCEEDED',
              message: 'Storage quota exceeded. Unable to save logo.',
            });
          } else {
            setError({
              errorCode: 'NETWORK_ERROR',
              message: 'Failed to save logo. Please try again.',
            });
          }
        }
      };
      reader.readAsDataURL(file);
      
      // Call the onLogoUpload handler
      onLogoUpload(file);
    }
  };

  // Handle logo removal
  const handleLogoRemove = () => {
    setLogoPreview(null);
    
    const updatedProfile = {
      ...localProfile,
      logoUrl: undefined,
    } as VendorProfileType;
    
    setLocalProfile(updatedProfile);
    
    try {
      storageService.saveLogo('');
      storageService.saveVendorProfile(updatedProfile);
      onChange(updatedProfile);
    } catch (error) {
      console.error('Error removing logo:', error);
    }
  };

  return (
    <div className="w-full">
      <div className="space-y-4 sm:space-y-6">
            {/* Error Display */}
            {error && (
              <ErrorDisplay
                error={error}
                onDismiss={() => setError(null)}
              />
            )}

            {/* Logo Upload Section */}
            <div className="space-y-2">
              <Label htmlFor="logo-upload">Company Logo</Label>
              <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                {logoPreview ? (
                  <div className="relative mx-auto sm:mx-0">
                    <img
                      src={logoPreview}
                      alt="Company logo"
                      className="w-24 h-24 object-contain border border-gray-300 rounded"
                    />
                    <button
                      type="button"
                      onClick={handleLogoRemove}
                      className="touch-target absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 active:bg-red-700"
                      aria-label="Remove logo"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded flex items-center justify-center mx-auto sm:mx-0">
                    <Upload className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 w-full">
                  <Input
                    id="logo-upload"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/svg+xml"
                    onChange={handleLogoChange}
                    className="mobile-input cursor-pointer touch-manipulation"
                  />
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    PNG, JPG, or SVG. Max 500KB.
                  </p>
                </div>
              </div>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="vendor-name">
                  Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="vendor-name"
                  type="text"
                  value={localProfile?.name || ''}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  placeholder="Your name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vendor-company">Company Name</Label>
                <Input
                  id="vendor-company"
                  type="text"
                  value={localProfile?.companyName || ''}
                  onChange={(e) => handleFieldChange('companyName', e.target.value)}
                  placeholder="Company name (optional)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vendor-email">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="vendor-email"
                  type="email"
                  value={localProfile?.email || ''}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  placeholder="email@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vendor-phone">
                  Phone <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="vendor-phone"
                  type="tel"
                  value={localProfile?.phone || ''}
                  onChange={(e) => handleFieldChange('phone', e.target.value)}
                  placeholder="+91 1234567890"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendor-address">
                Address <span className="text-red-500">*</span>
              </Label>
              <textarea
                id="vendor-address"
                value={localProfile?.address || ''}
                onChange={(e) => handleFieldChange('address', e.target.value)}
                placeholder="Full business address"
                className="mobile-input w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px] resize-y touch-manipulation"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendor-gst">GST Number</Label>
              <Input
                id="vendor-gst"
                type="text"
                value={localProfile?.gstNumber || ''}
                onChange={(e) => handleFieldChange('gstNumber', e.target.value.toUpperCase())}
                placeholder="22AAAAA0000A1Z5"
                maxLength={15}
              />
              {gstError && (
                <p className="text-sm text-red-500">{gstError}</p>
              )}
              <p className="text-sm text-gray-500">
                Format: 2 digits, 5 letters, 4 digits, 1 letter, 1 alphanumeric, Z, 1 alphanumeric
              </p>
            </div>

            {/* Payment Details */}
            <div className="pt-3 sm:pt-4 border-t border-gray-200">
              <h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-4">Payment Details</h3>
              
              <div className="space-y-3 sm:space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="vendor-upi">UPI ID</Label>
                  <Input
                    id="vendor-upi"
                    type="text"
                    value={localProfile?.upiId || ''}
                    onChange={(e) => handleFieldChange('upiId', e.target.value)}
                    placeholder="yourname@upi"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vendor-bank">Bank Name</Label>
                    <Input
                      id="vendor-bank"
                      type="text"
                      value={localProfile?.bankName || ''}
                      onChange={(e) => handleFieldChange('bankName', e.target.value)}
                      placeholder="Bank name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vendor-account-holder">Account Holder Name</Label>
                    <Input
                      id="vendor-account-holder"
                      type="text"
                      value={localProfile?.accountHolderName || ''}
                      onChange={(e) => handleFieldChange('accountHolderName', e.target.value)}
                      placeholder="Account holder name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vendor-account">Account Number</Label>
                    <Input
                      id="vendor-account"
                      type="text"
                      value={localProfile?.accountNumber || ''}
                      onChange={(e) => handleFieldChange('accountNumber', e.target.value)}
                      placeholder="1234567890"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vendor-ifsc">IFSC Code</Label>
                    <Input
                      id="vendor-ifsc"
                      type="text"
                      value={localProfile?.ifscCode || ''}
                      onChange={(e) => handleFieldChange('ifscCode', e.target.value.toUpperCase())}
                      placeholder="ABCD0123456"
                      maxLength={11}
                    />
                  </div>
                </div>
              </div>
            </div>

        {!isSetupMode && (
          <div className="pt-3 sm:pt-4 border-t border-gray-200">
            <p className="text-xs sm:text-sm text-gray-500">
              <span className="text-red-500">*</span> Required fields
            </p>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              All changes are automatically saved to your browser's local storage.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
