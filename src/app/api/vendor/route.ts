/**
 * Vendor Profile API Route
 * POST /api/vendor
 * Validates and confirms vendor profile data
 * Note: Actual storage happens client-side in localStorage
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateVendorProfile } from '@/lib/validation/validators';
import type { VendorProfile } from '@/types/vendor';
import type { ErrorResponse } from '@/types/error';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate that profile data is present
    if (!body.profile || typeof body.profile !== 'object') {
      const errorResponse: ErrorResponse = {
        errorCode: 'INVALID_INPUT',
        message: 'Request body must contain valid profile data',
        details: {
          profile: 'profile field is required and must be an object',
        },
      };

      return NextResponse.json(
        { success: false, error: errorResponse },
        { status: 400 }
      );
    }

    const profile: Partial<VendorProfile> = body.profile;

    // Validate vendor profile data
    const validationError = validateVendorProfile(profile);
    if (validationError) {
      return NextResponse.json(
        { success: false, error: validationError },
        { status: 400 }
      );
    }

    // Check for potential storage quota issues
    // Estimate the size of the profile data
    const profileSize = JSON.stringify(profile).length;
    const estimatedSizeKB = profileSize / 1024;

    // Warn if profile data is very large (> 1MB)
    if (estimatedSizeKB > 1024) {
      const errorResponse: ErrorResponse = {
        errorCode: 'STORAGE_QUOTA_EXCEEDED',
        message: 'Vendor profile data is too large for localStorage',
        details: {
          size: `Profile data size (${Math.round(estimatedSizeKB)}KB) exceeds recommended limit`,
          recommendation: 'Please reduce the size of your profile data or remove the logo',
        },
      };

      return NextResponse.json(
        { success: false, error: errorResponse },
        { status: 413 }
      );
    }

    // Validation successful - return success response
    // Note: Actual storage happens client-side
    return NextResponse.json(
      {
        success: true,
        message: 'Vendor profile validated successfully',
        profile: profile as VendorProfile,
      },
      { status: 200 }
    );
  } catch (error) {
    // Handle unexpected errors
    console.error('Vendor API error:', error);

    const errorResponse: ErrorResponse = {
      errorCode: 'NETWORK_ERROR',
      message: 'An unexpected error occurred while processing vendor profile',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    };

    return NextResponse.json(
      { success: false, error: errorResponse },
      { status: 500 }
    );
  }
}
