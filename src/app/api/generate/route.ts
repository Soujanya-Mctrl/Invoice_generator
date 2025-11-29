/**
 * Generate API Route
 * POST /api/generate
 * Generates a PDF invoice from invoice data and vendor profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { PDFGenerator } from '@/lib/pdf/generator';
import { numberingService } from '@/lib/numbering/service';
import type { GenerateRequest } from '@/types/api';
import type { ErrorResponse } from '@/types/error';

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body: GenerateRequest = await request.json();

    // Validate that invoiceData is present
    if (!body.invoiceData || typeof body.invoiceData !== 'object') {
      const errorResponse: ErrorResponse = {
        errorCode: 'INVALID_INPUT',
        message: 'Request body must contain valid invoiceData',
        details: {
          invoiceData: 'invoiceData field is required and must be an object',
        },
      };

      return NextResponse.json(
        { success: false, error: errorResponse },
        { status: 400 }
      );
    }

    // Validate that vendorProfile is present
    if (!body.vendorProfile || typeof body.vendorProfile !== 'object') {
      const errorResponse: ErrorResponse = {
        errorCode: 'INVALID_INPUT',
        message: 'Request body must contain valid vendorProfile',
        details: {
          vendorProfile: 'vendorProfile field is required and must be an object',
        },
      };

      return NextResponse.json(
        { success: false, error: errorResponse },
        { status: 400 }
      );
    }

    const { invoiceData, vendorProfile } = body;

    // Generate invoice number if not provided
    if (!invoiceData.invoiceNumber || invoiceData.invoiceNumber.trim() === '') {
      invoiceData.invoiceNumber = numberingService.generateNext();
    }

    // Validate invoice data
    try {
      PDFGenerator.validateInvoiceData(invoiceData);
    } catch (validationError) {
      const errorResponse: ErrorResponse = {
        errorCode: 'INVALID_INPUT',
        message: 'Invoice data validation failed',
        details: {
          validation: validationError instanceof Error ? validationError.message : 'Invalid invoice data',
        },
      };

      return NextResponse.json(
        { success: false, error: errorResponse },
        { status: 400 }
      );
    }

    // Validate vendor profile
    try {
      PDFGenerator.validateVendorProfile(vendorProfile);
    } catch (validationError) {
      const errorResponse: ErrorResponse = {
        errorCode: 'INVALID_INPUT',
        message: 'Vendor profile validation failed',
        details: {
          validation: validationError instanceof Error ? validationError.message : 'Invalid vendor profile',
        },
      };

      return NextResponse.json(
        { success: false, error: errorResponse },
        { status: 400 }
      );
    }

    // Generate the PDF
    try {
      const pdfBlob = await PDFGenerator.generateInvoice(invoiceData, vendorProfile);

      // Convert blob to buffer for Next.js response
      const arrayBuffer = await pdfBlob.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Return PDF with appropriate headers
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="invoice-${invoiceData.invoiceNumber}.pdf"`,
          'Content-Length': buffer.length.toString(),
        },
      });
    } catch (pdfError) {
      // PDF generation failed
      const errorResponse: ErrorResponse = {
        errorCode: 'PDF_GENERATION_FAILED',
        message: 'Failed to generate PDF invoice',
        details: {
          reason: pdfError instanceof Error ? pdfError.message : 'Unknown PDF generation error',
        },
      };

      return NextResponse.json(
        { success: false, error: errorResponse },
        { status: 500 }
      );
    }
  } catch (error) {
    // Handle unexpected errors
    console.error('Generate API error:', error);

    const errorResponse: ErrorResponse = {
      errorCode: 'NETWORK_ERROR',
      message: 'An unexpected error occurred during PDF generation',
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
