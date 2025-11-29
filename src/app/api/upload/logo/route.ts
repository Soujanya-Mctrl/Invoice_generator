/**
 * Logo Upload API Route
 * POST /api/upload/logo
 * Validates and converts uploaded logo to base64 data URL
 * Note: Actual storage happens client-side in localStorage
 */

import { NextRequest, NextResponse } from 'next/server';
import type { LogoUploadResponse } from '@/types/api';
import type { ErrorResponse } from '@/types/error';

// Maximum file size: 500KB
const MAX_FILE_SIZE = 500 * 1024; // 500KB in bytes

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/svg+xml',
];

export async function POST(request: NextRequest) {
  try {
    // Parse FormData from request
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    // Validate that file is present
    if (!file) {
      const errorResponse: ErrorResponse = {
        errorCode: 'INVALID_INPUT',
        message: 'No file provided',
        details: {
          file: 'file field is required',
        },
      };

      const response: LogoUploadResponse = {
        success: false,
        error: errorResponse,
      };

      return NextResponse.json(response, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      const errorResponse: ErrorResponse = {
        errorCode: 'INVALID_FILE_TYPE',
        message: 'Invalid file type. Only JPEG, PNG, and SVG images are allowed.',
        details: {
          fileType: file.type,
          allowedTypes: ALLOWED_MIME_TYPES.join(', '),
        },
      };

      const response: LogoUploadResponse = {
        success: false,
        error: errorResponse,
      };

      return NextResponse.json(response, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      const errorResponse: ErrorResponse = {
        errorCode: 'FILE_TOO_LARGE',
        message: `File size exceeds maximum limit of ${MAX_FILE_SIZE / 1024}KB`,
        details: {
          fileSize: `${Math.round(file.size / 1024)}KB`,
          maxSize: `${MAX_FILE_SIZE / 1024}KB`,
        },
      };

      const response: LogoUploadResponse = {
        success: false,
        error: errorResponse,
      };

      return NextResponse.json(response, { status: 413 });
    }

    // Convert file to base64 data URL
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    // Return success response with data URL
    // Note: Actual storage happens client-side using StorageService
    const response: LogoUploadResponse = {
      success: true,
      logoUrl: dataUrl,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    // Handle unexpected errors
    console.error('Logo upload API error:', error);

    const errorResponse: ErrorResponse = {
      errorCode: 'NETWORK_ERROR',
      message: 'An unexpected error occurred while processing the logo upload',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    };

    const response: LogoUploadResponse = {
      success: false,
      error: errorResponse,
    };

    return NextResponse.json(response, { status: 500 });
  }
}
