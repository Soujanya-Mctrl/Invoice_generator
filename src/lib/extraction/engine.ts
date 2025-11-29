/**
 * Extraction Engine
 * Extracts invoice data from unstructured payment text using regex patterns and AI
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { InvoiceData, PaymentInfo } from '@/types';
import { extractFromStructuredFormat } from './format-template';

/**
 * ExtractionEngine class for parsing payment text into structured invoice data
 */
export class ExtractionEngine {
  /**
   * Extract invoice data from payment text using regex patterns
   * @param text - Unstructured payment text
   * @returns Partial invoice data with extracted fields
   */
  extractWithRegex(text: string): Partial<InvoiceData> {
    const extracted: Partial<InvoiceData> = {};

    // Try structured format extraction first
    const structuredData = extractFromStructuredFormat(text);
    
    // If structured format found client name, use it
    if (structuredData.clientName) {
      extracted.clientName = structuredData.clientName;
    }
    if (structuredData.clientCompany) {
      extracted.clientCompany = structuredData.clientCompany;
    }
    if (structuredData.clientEmail) {
      extracted.clientEmail = structuredData.clientEmail;
    }
    if (structuredData.clientPhone) {
      extracted.clientPhone = structuredData.clientPhone;
    }
    
    // Use structured items if available
    if (structuredData.items && structuredData.items.length > 0) {
      extracted.items = structuredData.items.map((item, index) => ({
        id: `item-${index + 1}`,
        description: item.description,
        quantity: 1,
        rate: item.amount,
        amount: item.amount,
      }));
      
      const total = structuredData.items.reduce((sum, item) => sum + item.amount, 0);
      extracted.total = total;
      extracted.subtotal = total;
      
      const currency = this.extractCurrencyFromAmount(text);
      if (currency) {
        extracted.currency = currency;
      }
    } else {
      // Fallback to regex line item extraction
      const lineItems = this.extractLineItems(text);
      if (lineItems.length > 0) {
        extracted.items = lineItems;
        
        // Calculate total from line items
        const total = lineItems.reduce((sum, item) => sum + item.amount, 0);
        extracted.total = total;
        extracted.subtotal = total;
        
        // Get currency from first line item
        const firstItemCurrency = this.extractCurrencyFromAmount(text);
        if (firstItemCurrency) {
          extracted.currency = firstItemCurrency;
        }
      } else {
        // Fallback to single amount extraction if no line items found
        const { amount, currency } = this.extractAmount(text);
        if (amount !== null) {
          extracted.total = amount;
          extracted.subtotal = amount;
        }
        if (currency) {
          extracted.currency = currency;
        }
      }
    }
    
    // Use structured due date if available
    if (structuredData.dueDate) {
      // Try to parse the structured due date
      const parsedDates = this.extractDates(structuredData.dueDate);
      if (parsedDates.length > 0) {
        extracted.dueDate = parsedDates[0];
      }
    }

    // Extract dates
    const dates = this.extractDates(text);
    if (dates.length > 0) {
      extracted.invoiceDate = dates[0];
      if (dates.length > 1) {
        extracted.dueDate = dates[1];
      }
    }

    // Extract payment information
    const paymentInfo = this.extractPaymentInfo(text);
    if (Object.keys(paymentInfo).length > 0) {
      extracted.paymentInfo = paymentInfo;
    }

    // Extract contact information
    const email = this.extractEmail(text);
    if (email) {
      extracted.clientEmail = email;
    }

    const phone = this.extractPhone(text);
    if (phone) {
      extracted.clientPhone = phone;
    }

    // Extract client name (simple heuristic: look for "from" or "to" patterns)
    const clientName = this.extractClientName(text);
    if (clientName) {
      extracted.clientName = clientName;
    }

    return extracted;
  }

  /**
   * Extract line items from text
   * Looks for patterns like "Logo redesign came to ₹3,200" or "website banner set is ₹4,500"
   */
  private extractLineItems(text: string): Array<{ id: string; description: string; quantity: number; rate: number; amount: number }> {
    const lineItems: Array<{ id: string; description: string; quantity: number; rate: number; amount: number }> = [];
    
    // Pattern to match: [description] [amount with currency symbol]
    // Examples: "Logo redesign came to ₹3,200", "website banner set is ₹4,500"
    const patterns = [
      // Pattern: "description came to/is/for [currency]amount"
      /([A-Za-z][A-Za-z\s]+?)\s+(?:came to|is|for|costs?|totals?)\s+([₹Rs$€]|INR|USD|EUR)\s*(\d+(?:,\d+)*(?:\.\d{2})?)/gi,
      // Pattern: "description - [currency]amount" or "description: [currency]amount"
      /([A-Za-z][A-Za-z\s]+?)\s*[-:]\s*([₹Rs$€]|INR|USD|EUR)\s*(\d+(?:,\d+)*(?:\.\d{2})?)/gi,
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const description = match[1].trim();
        const amountStr = match[3].replace(/,/g, '');
        const amount = parseFloat(amountStr);
        
        // Skip if description is too short or looks like it's not a real item
        // Also skip if amount looks like a phone number (> 100000)
        if (description.length < 3 || description.toLowerCase().includes('total') || amount > 100000) {
          continue;
        }
        
        lineItems.push({
          id: `item-${lineItems.length + 1}`,
          description: description,
          quantity: 1,
          rate: amount,
          amount: amount,
        });
      }
    }

    return lineItems;
  }

  /**
   * Extract currency from text
   */
  private extractCurrencyFromAmount(text: string): string | null {
    if (text.includes('₹') || text.includes('Rs') || text.includes('INR')) {
      return 'INR';
    }
    if (text.includes('$') || text.includes('USD')) {
      return 'USD';
    }
    if (text.includes('€') || text.includes('EUR')) {
      return 'EUR';
    }
    return null;
  }

  /**
   * Extract amount and currency from text
   * Supports: ₹, Rs, INR, $, USD, €, EUR
   */
  private extractAmount(text: string): { amount: number | null; currency: string | null } {
    // Patterns for different currencies with amounts
    const patterns = [
      // Indian Rupee patterns
      { regex: /₹\s*(\d+(?:,\d+)*(?:\.\d{2})?)/gi, currency: 'INR' },
      { regex: /Rs\.?\s*(\d+(?:,\d+)*(?:\.\d{2})?)/gi, currency: 'INR' },
      { regex: /INR\s*(\d+(?:,\d+)*(?:\.\d{2})?)/gi, currency: 'INR' },
      // US Dollar patterns
      { regex: /\$\s*(\d+(?:,\d+)*(?:\.\d{2})?)/gi, currency: 'USD' },
      { regex: /USD\s*(\d+(?:,\d+)*(?:\.\d{2})?)/gi, currency: 'USD' },
      // Euro patterns
      { regex: /€\s*(\d+(?:,\d+)*(?:\.\d{2})?)/gi, currency: 'EUR' },
      { regex: /EUR\s*(\d+(?:,\d+)*(?:\.\d{2})?)/gi, currency: 'EUR' },
    ];

    for (const pattern of patterns) {
      const match = pattern.regex.exec(text);
      if (match) {
        const amountStr = match[1].replace(/,/g, '');
        const amount = parseFloat(amountStr);
        return { amount, currency: pattern.currency };
      }
    }

    return { amount: null, currency: null };
  }

  /**
   * Extract dates from text and normalize to ISO 8601 format
   * Supports: DD/MM/YYYY, DD-MM-YYYY, MM/DD/YYYY, YYYY-MM-DD, "12th March 2025"
   */
  private extractDates(text: string): string[] {
    const dates: string[] = [];
    
    // Month name mapping
    const monthNames: { [key: string]: number } = {
      'january': 1, 'jan': 1,
      'february': 2, 'feb': 2,
      'march': 3, 'mar': 3,
      'april': 4, 'apr': 4,
      'may': 5,
      'june': 6, 'jun': 6,
      'july': 7, 'jul': 7,
      'august': 8, 'aug': 8,
      'september': 9, 'sep': 9, 'sept': 9,
      'october': 10, 'oct': 10,
      'november': 11, 'nov': 11,
      'december': 12, 'dec': 12,
    };
    
    // Pattern for text dates: "12th March 2025", "1st Jan 2024", etc.
    const textDatePattern = /\b(\d{1,2})(?:st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)\s+(\d{4})\b/gi;
    let match;
    while ((match = textDatePattern.exec(text)) !== null) {
      try {
        const day = parseInt(match[1]);
        const monthName = match[2].toLowerCase();
        const year = parseInt(match[3]);
        const month = monthNames[monthName];
        
        if (month && day >= 1 && day <= 31) {
          const isoDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          dates.push(isoDate);
        }
      } catch (e) {
        continue;
      }
    }
    
    // Pattern for various numeric date formats
    const datePatterns = [
      // DD/MM/YYYY or DD-MM-YYYY
      /\b(\d{1,2})[/-](\d{1,2})[/-](\d{4})\b/g,
      // YYYY-MM-DD (ISO format)
      /\b(\d{4})-(\d{1,2})-(\d{1,2})\b/g,
    ];

    for (const pattern of datePatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        try {
          let isoDate: string;
          
          if (match[1].length === 4) {
            // YYYY-MM-DD format
            const year = parseInt(match[1]);
            const month = parseInt(match[2]);
            const day = parseInt(match[3]);
            isoDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          } else {
            // DD/MM/YYYY or DD-MM-YYYY format (assuming DD/MM/YYYY)
            const day = parseInt(match[1]);
            const month = parseInt(match[2]);
            const year = parseInt(match[3]);
            
            // Validate date components
            if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
              isoDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            } else {
              continue;
            }
          }
          
          dates.push(isoDate);
        } catch (e) {
          // Skip invalid dates
          continue;
        }
      }
    }

    return dates;
  }

  /**
   * Extract payment information (UPI, bank details, GST)
   */
  private extractPaymentInfo(text: string): Partial<PaymentInfo> {
    const paymentInfo: Partial<PaymentInfo> = {};

    // Extract UPI ID (format: identifier@provider)
    const upiMatch = text.match(/\b([\w.-]+@[\w.-]+)\b/);
    if (upiMatch && !upiMatch[1].includes('.com') && !upiMatch[1].includes('.org')) {
      // Filter out email addresses (basic heuristic)
      paymentInfo.upiId = upiMatch[1];
    }

    // Extract bank account number (9-18 digits)
    const accountMatch = text.match(/\b(\d{9,18})\b/);
    if (accountMatch) {
      paymentInfo.accountNumber = accountMatch[1];
    }

    // Extract IFSC code (format: XXXX0XXXXXX)
    const ifscMatch = text.match(/\b([A-Z]{4}0[A-Z0-9]{6})\b/);
    if (ifscMatch) {
      paymentInfo.ifscCode = ifscMatch[1];
    }

    // Extract bank name (common Indian banks)
    const bankPatterns = [
      /\b(State Bank of India|SBI)\b/i,
      /\b(HDFC Bank|HDFC)\b/i,
      /\b(ICICI Bank|ICICI)\b/i,
      /\b(Axis Bank|Axis)\b/i,
      /\b(Punjab National Bank|PNB)\b/i,
      /\b(Bank of Baroda|BOB)\b/i,
      /\b(Kotak Mahindra Bank|Kotak)\b/i,
    ];

    for (const pattern of bankPatterns) {
      const match = text.match(pattern);
      if (match) {
        paymentInfo.bankName = match[1];
        break;
      }
    }

    return paymentInfo;
  }

  /**
   * Extract GST number from text
   * Format: 2 digits, 5 letters, 4 digits, 1 letter, 1 alphanumeric, Z, 1 alphanumeric
   */
  extractGSTNumber(text: string): string | null {
    const gstMatch = text.match(/\b(\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z0-9]{1}Z[A-Z0-9]{1})\b/);
    return gstMatch ? gstMatch[1] : null;
  }

  /**
   * Extract email address from text
   */
  private extractEmail(text: string): string | null {
    const emailMatch = text.match(/\b([\w.-]+@[\w.-]+\.[a-zA-Z]{2,})\b/);
    return emailMatch ? emailMatch[1] : null;
  }

  /**
   * Extract phone number from text
   * Supports Indian phone numbers with optional +91 or 0 prefix
   */
  private extractPhone(text: string): string | null {
    const phoneMatch = text.match(/(?:\+91|0)?([6-9]\d{9})\b/);
    return phoneMatch ? phoneMatch[1] : null;
  }

  /**
   * Extract client name using simple heuristics
   * Looks for patterns like "from [Name]", "to [Name]", "client: [Name]", "Hi [Name]", "Mr./Ms. [Name]"
   */
  private extractClientName(text: string): string | null {
    const patterns = [
      // Greeting patterns: "Hi Mr. John Doe", "Hello Ms. Jane Smith", "Hi Ankit"
      /(?:Hi|Hello|Dear)\s+(?:Mr\.?|Ms\.?|Mrs\.?|Dr\.?)?\s*([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)/i,
      // From/To patterns
      /(?:from|From|FROM)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)(?:\s*\n|\s*$|,|\s+for\s+)/,
      /(?:to|To|TO)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)(?:\s*\n|\s*$|,)/,
      // Client/Name labels
      /(?:client|Client|CLIENT):\s*([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)(?:\s*\n|\s*$|,)/,
      /(?:name|Name|NAME):\s*([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)(?:\s*\n|\s*$|,)/,
      // Bill to pattern
      /(?:bill\s+to|Bill\s+to|BILL\s+TO):\s*([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return null;
  }

  /**
   * Extract invoice data using Gemini Flash AI model
   * @param text - Unstructured payment text
   * @returns Promise resolving to partial invoice data with AI-extracted fields
   * @throws Error if AI extraction fails or times out
   */
  async extractWithAI(text: string): Promise<Partial<InvoiceData>> {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // Use Gemini 1.5 Flash model
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Design structured prompt requesting JSON response
    const prompt = `Extract invoice information from the following payment text and return it as a JSON object.

Payment Text:
${text}

Please extract the following fields if present:
- clientName: The name of the client/customer
- clientCompany: The company name if mentioned
- clientEmail: Email address
- clientPhone: Phone number
- clientAddress: Full address
- amount: The payment amount (numeric value only, no currency symbols)
- currency: Currency code (INR, USD, EUR, etc.)
- invoiceDate: Date in YYYY-MM-DD format
- dueDate: Due date in YYYY-MM-DD format if mentioned
- upiId: UPI ID for payment
- bankName: Bank name
- accountNumber: Bank account number
- ifscCode: IFSC code
- accountHolderName: Account holder name
- notes: Any additional notes or description of services

Return ONLY a valid JSON object with the extracted fields. If a field is not found, omit it from the response. Do not include any markdown formatting or explanations.`;

    try {
      // Implement 8-second timeout for AI requests
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('AI extraction timeout')), 8000);
      });

      const generationPromise = model.generateContent(prompt);

      const result = await Promise.race([generationPromise, timeoutPromise]);
      const response = await result.response;
      const responseText = response.text();

      // Parse the JSON response
      let extracted: any;
      try {
        // Remove markdown code blocks if present
        const cleanedText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        extracted = JSON.parse(cleanedText);
      } catch (parseError) {
        throw new Error('Failed to parse AI response as JSON');
      }

      // Map AI response to InvoiceData structure
      const invoiceData: Partial<InvoiceData> = {};

      if (extracted.clientName) invoiceData.clientName = extracted.clientName;
      if (extracted.clientCompany) invoiceData.clientCompany = extracted.clientCompany;
      if (extracted.clientEmail) invoiceData.clientEmail = extracted.clientEmail;
      if (extracted.clientPhone) invoiceData.clientPhone = extracted.clientPhone;
      if (extracted.clientAddress) invoiceData.clientAddress = extracted.clientAddress;
      if (extracted.currency) invoiceData.currency = extracted.currency;
      if (extracted.invoiceDate) invoiceData.invoiceDate = extracted.invoiceDate;
      if (extracted.dueDate) invoiceData.dueDate = extracted.dueDate;
      if (extracted.notes) invoiceData.notes = extracted.notes;

      // Handle amount
      if (extracted.amount !== undefined && extracted.amount !== null) {
        const amount = typeof extracted.amount === 'string' 
          ? parseFloat(extracted.amount.replace(/,/g, ''))
          : extracted.amount;
        invoiceData.total = amount;
        invoiceData.subtotal = amount;
      }

      // Handle payment info
      const paymentInfo: Partial<PaymentInfo> = {};
      if (extracted.upiId) paymentInfo.upiId = extracted.upiId;
      if (extracted.bankName) paymentInfo.bankName = extracted.bankName;
      if (extracted.accountNumber) paymentInfo.accountNumber = extracted.accountNumber;
      if (extracted.ifscCode) paymentInfo.ifscCode = extracted.ifscCode;
      if (extracted.accountHolderName) paymentInfo.accountHolderName = extracted.accountHolderName;

      if (Object.keys(paymentInfo).length > 0) {
        invoiceData.paymentInfo = paymentInfo;
      }

      return invoiceData;
    } catch (error) {
      // Re-throw with more context
      if (error instanceof Error) {
        throw new Error(`AI extraction failed: ${error.message}`);
      }
      throw new Error('AI extraction failed: Unknown error');
    }
  }

  /**
   * Merge regex and AI extraction results, preferring AI results when available
   * @param regexResults - Results from regex-based extraction
   * @param aiResults - Results from AI-based extraction
   * @returns Merged invoice data with AI results taking precedence
   */
  mergeExtractionResults(
    regexResults: Partial<InvoiceData>,
    aiResults: Partial<InvoiceData>
  ): Partial<InvoiceData> {
    // AI results take precedence, but we keep regex results as fallback
    const merged: Partial<InvoiceData> = {
      ...regexResults,
      ...aiResults,
    };

    // Merge payment info specially to combine fields from both sources
    if (regexResults.paymentInfo || aiResults.paymentInfo) {
      merged.paymentInfo = {
        ...regexResults.paymentInfo,
        ...aiResults.paymentInfo,
      };
    }

    // Ensure currency has a default
    if (!merged.currency) {
      merged.currency = 'INR';
    }

    // Ensure date has a default (current date)
    if (!merged.invoiceDate) {
      merged.invoiceDate = new Date().toISOString().split('T')[0];
    }

    // Initialize empty items array if not present
    if (!merged.items) {
      merged.items = [];
    }

    return merged;
  }

  /**
   * Merge extracted fields into a complete InvoiceData structure
   * Fills in defaults for missing required fields
   */
  mergeResults(extracted: Partial<InvoiceData>): Partial<InvoiceData> {
    const merged: Partial<InvoiceData> = {
      ...extracted,
    };

    // Ensure currency has a default
    if (!merged.currency) {
      merged.currency = 'INR';
    }

    // Ensure date has a default (current date)
    if (!merged.invoiceDate) {
      merged.invoiceDate = new Date().toISOString().split('T')[0];
    }

    // Initialize empty items array if not present
    if (!merged.items) {
      merged.items = [];
    }

    return merged;
  }
}
