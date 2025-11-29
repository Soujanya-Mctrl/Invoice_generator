/**
 * Example usage of AI-enhanced extraction with fallback
 * This demonstrates how to use the ExtractionEngine with AI and fallback logic
 */

import { ExtractionEngine } from './engine';

/**
 * Example function showing how to use extraction with AI fallback
 */
export async function extractInvoiceDataWithFallback(
  text: string,
  useAI: boolean = true
): Promise<{ data: any; method: 'regex' | 'ai' | 'hybrid' }> {
  const engine = new ExtractionEngine();
  
  // Always extract with regex first
  const regexResults = engine.extractWithRegex(text);
  
  // If AI is enabled and API key is available, try AI extraction
  if (useAI && process.env.GEMINI_API_KEY) {
    try {
      const aiResults = await engine.extractWithAI(text);
      const merged = engine.mergeExtractionResults(regexResults, aiResults);
      return { data: merged, method: 'hybrid' };
    } catch (error) {
      // AI extraction failed, fall back to regex results
      console.warn('AI extraction failed, using regex fallback:', error);
      const merged = engine.mergeResults(regexResults);
      return { data: merged, method: 'regex' };
    }
  }
  
  // Use regex-only results
  const merged = engine.mergeResults(regexResults);
  return { data: merged, method: 'regex' };
}

/**
 * Example usage:
 * 
 * const paymentText = `
 *   Payment from John Doe
 *   Company: Acme Corp
 *   Amount: ₹15,000.00
 *   Date: 25/11/2024
 *   UPI: john@paytm
 *   Phone: 9876543210
 *   Email: john@example.com
 * `;
 * 
 * // With AI enhancement
 * const result = await extractInvoiceDataWithFallback(paymentText, true);
 * console.log('Extraction method:', result.method);
 * console.log('Extracted data:', result.data);
 * 
 * // Without AI (regex only)
 * const regexOnly = await extractInvoiceDataWithFallback(paymentText, false);
 * console.log('Regex-only data:', regexOnly.data);
 */
