/**
 * Numbering API Route
 * POST /api/numbering/next
 * Generates the next sequential invoice number
 */

import { NextRequest, NextResponse } from 'next/server';
import { numberingService } from '@/lib/numbering/service';
import type { NumberingResponse } from '@/types/api';
import type { ErrorResponse } from '@/types/error';

export async function POST(request: NextRequest) {
  try {
    // Generate the next invoice number
    const invoiceNumber = numberingService.generateNext();

    // Return success response with invoice number
    const response: NumberingResponse = {
      success: true,
      invoiceNumber,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    // Handle errors gracefully
    console.error('Numbering API error:', error);

    const errorResponse: ErrorResponse = {
      errorCode: 'NETWORK_ERROR',
      message: 'Failed to generate invoice number',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    };

    const response: NumberingResponse = {
      success: false,
      error: errorResponse,
    };

    return NextResponse.json(response, { status: 500 });
  }
}
