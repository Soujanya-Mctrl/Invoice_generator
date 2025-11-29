/**
 * Extract API Route
 * POST /api/extract
 * Extracts invoice data from unstructured payment text
 */

import { NextRequest, NextResponse } from 'next/server';
import { ExtractionEngine } from '@/lib/extraction/engine';
import type { ExtractRequest, ExtractResponse } from '@/types/api';
import type { ErrorResponse } from '@/types/error';

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body: ExtractRequest = await request.json();

    // Validate that text field is present
    if (!body.text || typeof body.text !== 'string') {
      const errorResponse: ErrorResponse = {
        errorCode: 'INVALID_INPUT',
        message: 'Request body must contain a valid text field',
        details: {
          text: 'Text field is required and must be a string',
        },
      };

      const response: ExtractResponse = {
        success: false,
        error: errorResponse,
        extractionMethod: 'regex',
      };

      return NextResponse.json(response, { status: 400 });
    }

    // Validate text is not empty
    if (body.text.trim().length === 0) {
      const errorResponse: ErrorResponse = {
        errorCode: 'INVALID_INPUT',
        message: 'Text field cannot be empty',
        details: {
          text: 'Please provide payment text to extract',
        },
      };

      const response: ExtractResponse = {
        success: false,
        error: errorResponse,
        extractionMethod: 'regex',
      };

      return NextResponse.json(response, { status: 400 });
    }

    const engine = new ExtractionEngine();

    // Extract with regex (always runs)
    const regexResults = engine.extractWithRegex(body.text);

    let finalResults = regexResults;
    let extractionMethod: 'regex' | 'ai' | 'hybrid' = 'regex';
    let aiError: ErrorResponse | null = null;

    // Check if regex extraction is incomplete (missing critical fields)
    const regexMissingFields: string[] = [];
    if (!regexResults.clientName) {
      regexMissingFields.push('clientName');
    }
    if (!regexResults.total && !regexResults.subtotal) {
      regexMissingFields.push('amount');
    }

    // Automatically use AI extraction if:
    // 1. useAI flag is explicitly true, OR
    // 2. Regex extraction is incomplete (missing required fields)
    const shouldUseAI = body.useAI === true || regexMissingFields.length > 0;

    if (shouldUseAI) {
      try {
        const aiResults = await engine.extractWithAI(body.text);
        
        // Merge results with AI taking precedence
        finalResults = engine.mergeExtractionResults(regexResults, aiResults);
        extractionMethod = 'hybrid';
      } catch (error) {
        // AI service unavailable - fall back to regex results
        console.error('AI extraction failed:', error);
        
        aiError = {
          errorCode: 'AI_SERVICE_UNAVAILABLE',
          message: 'AI extraction service is unavailable, using regex-based extraction',
          details: {
            reason: error instanceof Error ? error.message : 'Unknown error',
          },
        };
        
        // Keep regex results and continue
        extractionMethod = 'regex';
      }
    }

    // Merge results to ensure defaults are set
    const mergedResults = engine.mergeResults(finalResults);

    // Check if extraction is still incomplete after AI attempt
    const missingFields: string[] = [];
    
    if (!mergedResults.clientName) {
      missingFields.push('clientName');
    }
    
    if (!mergedResults.total && !mergedResults.subtotal) {
      missingFields.push('amount');
    }

    // If extraction is incomplete, return error but still include partial data
    if (missingFields.length > 0) {
      const errorResponse: ErrorResponse = {
        errorCode: 'EXTRACTION_INCOMPLETE',
        message: 'Could not extract all required fields from the payment text',
        details: {
          missingFields: missingFields.join(', '),
          suggestion: 'Please review and manually fill in the missing information',
        },
      };

      // If AI also failed, include that information
      if (aiError && errorResponse.details) {
        errorResponse.details.aiStatus = aiError.message;
      }

      const response: ExtractResponse = {
        success: false,
        data: mergedResults,
        error: errorResponse,
        extractionMethod,
      };

      return NextResponse.json(response, { status: 200 });
    }

    // Successful extraction
    const response: ExtractResponse = {
      success: true,
      data: mergedResults,
      extractionMethod,
    };

    // If AI failed but regex succeeded, include AI error in response metadata
    if (aiError) {
      response.error = aiError;
    }

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    // Handle unexpected errors
    console.error('Extract API error:', error);

    const errorResponse: ErrorResponse = {
      errorCode: 'NETWORK_ERROR',
      message: 'An unexpected error occurred during extraction',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    };

    const response: ExtractResponse = {
      success: false,
      error: errorResponse,
      extractionMethod: 'regex',
    };

    return NextResponse.json(response, { status: 500 });
  }
}
