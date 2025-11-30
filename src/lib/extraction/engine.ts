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

    // Extract GST number
    const gstNumber = this.extractGSTNumber(text);
    if (gstNumber) {
      // Store GST in notes if not already present, or append to existing notes
      if (extracted.notes) {
        extracted.notes = `${extracted.notes}\nGST: ${gstNumber}`;
      } else {
        extracted.notes = `GST: ${gstNumber}`;
      }
    }

    // Extract tax rate (especially GST percentage)
    const taxRate = this.extractTaxRate(text);
    if (taxRate !== null) {
      extracted.taxRate = taxRate;
      
      // Calculate tax amount if subtotal exists
      if (extracted.subtotal && extracted.subtotal > 0) {
        extracted.taxAmount = parseFloat(((extracted.subtotal * taxRate) / 100).toFixed(2));
        // Recalculate total with tax
        extracted.total = parseFloat((extracted.subtotal + extracted.taxAmount).toFixed(2));
      } else if (extracted.total && extracted.total > 0) {
        // If only total is known, calculate backwards
        const subtotal = extracted.total / (1 + taxRate / 100);
        extracted.subtotal = parseFloat(subtotal.toFixed(2));
        extracted.taxAmount = parseFloat((extracted.total - extracted.subtotal).toFixed(2));
      }
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
   * Handles multiple formats and ensures ALL items are extracted
   */
  private extractLineItems(text: string): Array<{ id: string; description: string; quantity: number; rate: number; amount: number }> {
    const lineItems: Array<{ id: string; description: string; quantity: number; rate: number; amount: number }> = [];
    const seenItems = new Set<string>(); // Track seen items to avoid duplicates
    
    // Pattern to match: [description] [amount with currency symbol]
    // Examples: "Logo redesign came to ₹3,200", "website banner set is ₹4,500"
    const patterns = [
      // Pattern: "description came to/is/for/was [currency]amount"
      /([A-Za-z][A-Za-z\s()]+?)\s+(?:came to|is|for|was|costs?|totals?)\s+([₹Rs$€]|INR|USD|EUR|rs)\s*(\d+(?:,\d+)*(?:\.\d{2})?)/gi,
      // Pattern: "description - [currency]amount" or "description: [currency]amount"
      /([A-Za-z][A-Za-z\s()]+?)\s*[-—–]\s*([₹Rs$€]|INR|USD|EUR|rs)\s*(\d+(?:,\d+)*(?:\.\d{2})?)/gi,
      // Pattern: "description: [currency]amount"
      /([A-Za-z][A-Za-z\s()]+?)\s*:\s*([₹Rs$€]|INR|USD|EUR|rs)\s*(\d+(?:,\d+)*(?:\.\d{2})?)/gi,
      // Pattern: "description [currency]amount" (no separator, but amount at end)
      /([A-Za-z][A-Za-z\s()]+?)\s+([₹Rs$€]|INR|USD|EUR|rs)\s*(\d+(?:,\d+)*(?:\.\d{2})?)(?:\s|$|,|\.|\n)/gi,
    ];

    for (const pattern of patterns) {
      // Reset regex lastIndex to ensure we check from the beginning each time
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const description = match[1].trim();
        const amountStr = match[3].replace(/,/g, '');
        const amount = parseFloat(amountStr);
        
        // Skip if description is too short or looks like it's not a real item
        // Also skip if amount looks like a phone number (> 100000) or is invalid
        if (description.length < 3 || 
            description.toLowerCase().includes('total') || 
            description.toLowerCase().includes('amount payable') ||
            description.toLowerCase().includes('overall') ||
            amount > 100000 || 
            isNaN(amount) || 
            amount <= 0) {
          continue;
        }
        
        // Create a unique key for this item to avoid duplicates
        const itemKey = `${description.toLowerCase()}-${amount}`;
        if (seenItems.has(itemKey)) {
          continue; // Skip duplicate
        }
        seenItems.add(itemKey);
        
        lineItems.push({
          id: `item-${lineItems.length + 1}`,
          description: description,
          quantity: 1,
          rate: amount,
          amount: amount,
        });
      }
    }

    // Also try to extract items from bullet points or numbered lists
    const bulletPattern = /(?:^|\n)[•\-\*]\s*([A-Za-z][A-Za-z\s()]+?)\s*[:—–-]?\s*([₹Rs$€]|INR|USD|EUR|rs)\s*(\d+(?:,\d+)*(?:\.\d{2})?)/gim;
    let bulletMatch;
    while ((bulletMatch = bulletPattern.exec(text)) !== null) {
      const description = bulletMatch[1].trim();
      const amountStr = bulletMatch[3].replace(/,/g, '');
      const amount = parseFloat(amountStr);
      
      if (description.length >= 3 && 
          !description.toLowerCase().includes('total') && 
          amount > 0 && 
          amount <= 100000 &&
          !isNaN(amount)) {
        const itemKey = `${description.toLowerCase()}-${amount}`;
        if (!seenItems.has(itemKey)) {
          seenItems.add(itemKey);
          lineItems.push({
            id: `item-${lineItems.length + 1}`,
            description: description,
            quantity: 1,
            rate: amount,
            amount: amount,
          });
        }
      }
    }

    // Log for debugging
    if (lineItems.length > 0) {
      console.log(`Regex extracted ${lineItems.length} items:`, lineItems.map(i => i.description));
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
   * Normalize date string to YYYY-MM-DD format
   * Handles various date formats including "15 April 2025", "10 Apr", "15/04/2025", etc.
   */
  private normalizeDate(dateStr: string): string | null {
    if (!dateStr || dateStr.trim() === '') return null;
    
    // If already in YYYY-MM-DD format, validate and return
    const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      const month = parseInt(isoMatch[2]);
      const day = parseInt(isoMatch[3]);
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        return dateStr;
      }
    }

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

    // Try text date format: "15 April 2025", "10 Apr", "15th April 2025"
    const textDatePattern = /\b(\d{1,2})(?:st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)(?:\s+(\d{4}))?\b/i;
    const textMatch = dateStr.match(textDatePattern);
    if (textMatch) {
      const day = parseInt(textMatch[1]);
      const monthName = textMatch[2].toLowerCase();
      const month = monthNames[monthName];
      const year = textMatch[3] ? parseInt(textMatch[3]) : new Date().getFullYear();
      
      if (month && day >= 1 && day <= 31) {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    }

    // Try numeric formats: DD/MM/YYYY, DD-MM-YYYY, MM/DD/YYYY
    const numericPattern = /\b(\d{1,2})[/-](\d{1,2})[/-](\d{4})\b/;
    const numericMatch = dateStr.match(numericPattern);
    if (numericMatch) {
      const first = parseInt(numericMatch[1]);
      const second = parseInt(numericMatch[2]);
      const year = parseInt(numericMatch[3]);
      
      // Try DD/MM/YYYY first (more common internationally)
      if (second >= 1 && second <= 12 && first >= 1 && first <= 31) {
        return `${year}-${String(second).padStart(2, '0')}-${String(first).padStart(2, '0')}`;
      }
      // Try MM/DD/YYYY
      if (first >= 1 && first <= 12 && second >= 1 && second <= 31) {
        return `${year}-${String(first).padStart(2, '0')}-${String(second).padStart(2, '0')}`;
      }
    }

    // Try YYYY-MM-DD
    const isoPattern = /\b(\d{4})-(\d{1,2})-(\d{1,2})\b/;
    const isoMatch2 = dateStr.match(isoPattern);
    if (isoMatch2) {
      const year = parseInt(isoMatch2[1]);
      const month = parseInt(isoMatch2[2]);
      const day = parseInt(isoMatch2[3]);
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    }

    return null;
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
    const ifscMatch = text.match(/\b([A-Z]{4}0[A-Z0-9]{6})\b/i);
    if (ifscMatch) {
      paymentInfo.ifscCode = ifscMatch[1].toUpperCase();
      
      // Extract bank name from IFSC code if not already found
      if (!paymentInfo.bankName) {
        const ifscPrefix = ifscMatch[1].substring(0, 4).toUpperCase();
        const bankMap: { [key: string]: string } = {
          'HDFC': 'HDFC Bank',
          'ICIC': 'ICICI Bank',
          'SBIN': 'State Bank of India',
          'AXIS': 'Axis Bank',
          'PNB': 'Punjab National Bank',
          'BARB': 'Bank of Baroda',
          'KKBK': 'Kotak Mahindra Bank',
          'UTIB': 'Axis Bank',
          'YESB': 'Yes Bank',
        };
        if (bankMap[ifscPrefix]) {
          paymentInfo.bankName = bankMap[ifscPrefix];
        }
      }
    }

    // Extract bank name (common Indian banks) - check text first
    const bankPatterns = [
      /\b(State Bank of India|SBI)\b/i,
      /\b(HDFC Bank|HDFC)\b/i,
      /\b(ICICI Bank|ICICI)\b/i,
      /\b(Axis Bank|Axis)\b/i,
      /\b(Punjab National Bank|PNB)\b/i,
      /\b(Bank of Baroda|BOB)\b/i,
      /\b(Kotak Mahindra Bank|Kotak)\b/i,
      /\b(Yes Bank|YES)\b/i,
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
   * Also handles variations like "GST: 22AAAAA0000A1Z5" or "GSTIN: 22AAAAA0000A1Z5"
   */
  extractGSTNumber(text: string): string | null {
    // Try patterns with GST/GSTIN prefix first (more specific)
    const gstWithPrefix = text.match(/\b(?:GST|GSTIN|GST\s*Number|GST\s*No\.?)\s*:?\s*(\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z0-9]{1}Z[A-Z0-9]{1})\b/i);
    if (gstWithPrefix) {
      return gstWithPrefix[1].toUpperCase();
    }
    
    // Fallback to general pattern (GST format anywhere in text)
    const gstMatch = text.match(/\b(\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z0-9]{1}Z[A-Z0-9]{1})\b/i);
    return gstMatch ? gstMatch[1].toUpperCase() : null;
  }

  /**
   * Extract tax rate from text, especially GST percentage patterns
   * Handles: "GST @18%", "18% GST", "GST 18%", "tax 5%", etc.
   */
  private extractTaxRate(text: string): number | null {
    // Patterns for GST percentage
    const gstPatterns = [
      // "GST @18%", "GST@18%", "GST @ 18%"
      /\bGST\s*@\s*(\d+(?:\.\d+)?)\s*%/i,
      // "18% GST", "18 % GST"
      /\b(\d+(?:\.\d+)?)\s*%\s*GST\b/i,
      // "GST 18%", "GST 18 %"
      /\bGST\s+(\d+(?:\.\d+)?)\s*%/i,
      // "GST of 18%", "GST of 18 %"
      /\bGST\s+of\s+(\d+(?:\.\d+)?)\s*%/i,
      // "18% tax", "tax 18%"
      /\b(\d+(?:\.\d+)?)\s*%\s*tax\b/i,
      /\btax\s+(\d+(?:\.\d+)?)\s*%/i,
      // "tax rate: 18%", "tax rate 18%"
      /\btax\s+rate\s*:?\s*(\d+(?:\.\d+)?)\s*%/i,
    ];

    for (const pattern of gstPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const rate = parseFloat(match[1]);
        if (!isNaN(rate) && rate >= 0 && rate <= 100) {
          return rate;
        }
      }
    }

    return null;
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
   * Looks for patterns like "from [Name]", "to [Name]", "client: [Name]", "Hi [Name]", "Mr./Ms. [Name]", "Bill it to: [Name]"
   */
  private extractClientName(text: string): string | null {
    const patterns = [
      // Bill it to pattern (most specific, handles company names)
      /(?:bill\s+it\s+to|bill\s+to|Bill\s+it\s+to|Bill\s+to|BILL\s+IT\s+TO|BILL\s+TO):\s*([A-Z][A-Za-z\s&.,()]+?)(?:\s*\n|\s*$|\.|,)/i,
      // For pattern
      /(?:for|For|FOR)\s+(?:the\s+)?([A-Z][A-Za-z\s&.,()]+?)(?:\s*\n|\s*$|\.|,|:)/i,
      // Greeting patterns: "Hi Mr. John Doe", "Hello Ms. Jane Smith", "Hi Ankit"
      /(?:Hi|Hello|Dear)\s+(?:Mr\.?|Ms\.?|Mrs\.?|Dr\.?)?\s*([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)/i,
      // From/To patterns
      /(?:from|From|FROM)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)(?:\s*\n|\s*$|,|\s+for\s+)/,
      /(?:to|To|TO)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)(?:\s*\n|\s*$|,)/,
      // Client/Name labels
      /(?:client|Client|CLIENT):\s*([A-Z][A-Za-z\s&.,()]+?)(?:\s*\n|\s*$|,)/i,
      /(?:name|Name|NAME):\s*([A-Z][A-Za-z\s&.,()]+?)(?:\s*\n|\s*$|,)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const name = match[1].trim();
        // Filter out very short matches or common false positives
        if (name.length >= 2 && !name.toLowerCase().match(/^(the|a|an|for|to|from)$/i)) {
          return name;
        }
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

    // Ultra-comprehensive prompt designed for maximum extraction accuracy
    const prompt = `You are an expert invoice data extraction system. Your ONLY job is to extract EVERY piece of invoice information from the text below and return it as valid JSON.

═══════════════════════════════════════════════════════════════
TEXT TO EXTRACT FROM:
═══════════════════════════════════════════════════════════════
${text}
═══════════════════════════════════════════════════════════════

STEP-BY-STEP EXTRACTION PROCESS:

STEP 1: CLIENT INFORMATION (Extract ALL available)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• clientName: Look for ANY of these patterns:
  ✓ "Bill it to: [Name]" or "Bill to: [Name]"
  ✓ "Client: [Name]" or "Customer: [Name]"
  ✓ "For: [Name]" or "For the [Name]"
  ✓ "Invoice for: [Name]"
  ✓ Company names (e.g., "Aurora Digital Pvt Ltd", "ABC Corp", "XYZ Inc")
  ✓ Names after greetings: "Hi [Name]", "Hello [Name]", "Dear [Name]"
  ✓ If ONLY a company name exists, use it as clientName
  ✓ Extract FULL name including "Pvt Ltd", "Inc", "LLC", etc.

• clientCompany: Only if different from clientName (rare, usually null)

• clientEmail: Any email pattern (text@domain.com)
  Examples: "john@example.com", "contact@company.co.in"

• clientPhone: Phone numbers in ANY format
  Examples: "+91 9876543210", "9876543210", "(987) 654-3210"
  Extract digits only, remove spaces/special chars

• clientAddress: Full address if mentioned
  Look for: street, city, state, zip, country

STEP 2: DATES (Parse ANY date format)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• invoiceDate: Invoice/issue date in YYYY-MM-DD format
• dueDate: Payment due date in YYYY-MM-DD format

DATE FORMATS TO HANDLE:
✓ "15 April 2025" → "2025-04-15"
✓ "10 Apr" or "10 Apr 2025" → "2025-04-10" (assume 2025 if year missing)
✓ "15/04/2025" or "15-04-2025" → "2025-04-15"
✓ "04/15/2025" (US format) → "2025-04-15"
✓ "15th April 2025" → "2025-04-15"
✓ "Due: 15 April" → "2025-04-15"
✓ "due date as 15 April 2025" → "2025-04-15"
✓ "before 10 Apr" → "2025-04-10"
✓ "Need it before 10 Apr if possible" → "2025-04-10"

IMPORTANT: If year is missing, use 2025 (current year)

STEP 3: LINE ITEMS (CRITICAL - Extract EVERY single item!)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Extract EVERY service/product mentioned. Handle ALL these formats:

FORMAT EXAMPLES:
1. "Logo refinement: ₹1,200"
   → {"description": "Logo refinement", "quantity": 1, "rate": 1200, "amount": 1200}

2. "Social media banner (3 variants): ₹2,500"
   → {"description": "Social media banner (3 variants)", "quantity": 1, "rate": 2500, "amount": 2500}

3. "Home page redesign was ₹4,200"
   → {"description": "Home page redesign", "quantity": 1, "rate": 4200, "amount": 4200}

4. "bug fix from last week was 1,150 rs"
   → {"description": "bug fix from last week", "quantity": 1, "rate": 1150, "amount": 1150}

5. "short banner — ₹900" or "short banner - ₹900"
   → {"description": "short banner", "quantity": 1, "rate": 900, "amount": 900}

6. "Logo design came to ₹3,200"
   → {"description": "Logo design", "quantity": 1, "rate": 3200, "amount": 3200}

7. "Website development for ₹15,000"
   → {"description": "Website development", "quantity": 1, "rate": 15000, "amount": 15000}

8. Bullet points or numbered lists:
   • Item 1: ₹500
   • Item 2: ₹750
   → Extract each as separate item

9. "3 × Logo design @ ₹1000 each"
   → {"description": "Logo design", "quantity": 3, "rate": 1000, "amount": 3000}

10. "Logo design (₹5000) and Banner (₹2000)"
    → Two separate items

LINE ITEM RULES:
✓ Extract EVERY item, even if format is unusual
✓ Include parentheses content in description: "(3 variants)" stays in description
✓ If quantity mentioned (e.g., "3 variants", "5 units"), extract it
✓ If quantity NOT mentioned, default to 1
✓ rate = price per unit
✓ amount = total for that item (rate × quantity)
✓ Remove currency symbols from amounts (₹1,200 → 1200)
✓ Handle commas in numbers (₹1,200 → 1200)

STEP 4: FINANCIAL INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• currency: Detect from symbols or text
  ₹, Rs, INR → "INR"
  $, USD, dollars → "USD"
  €, EUR, euros → "EUR"
  £, GBP, pounds → "GBP"
  Default to "INR" if unclear

• subtotal: Sum of ALL line items (calculate: items[0].amount + items[1].amount + ...)

• total: Look for explicit mentions:
  ✓ "Total amount payable: ₹X"
  ✓ "Total: ₹X"
  ✓ "So overall it should be around ₹X"
  ✓ "Total comes to ₹X"
  ✓ If only total mentioned without items, use that total
  ✓ If no explicit total, use subtotal

• taxRate: Percentage if mentioned - EXTRACT FROM GST PERCENTAGE PATTERNS:
  ✓ "GST @18%" → 18
  ✓ "18% GST" → 18
  ✓ "GST 18%" → 18
  ✓ "GST of 18%" → 18
  ✓ "tax 18%" → 18
  ✓ "18% tax" → 18
  ✓ "tax rate: 18%" → 18
  Look for ANY percentage mentioned with GST or tax keywords
  Extract the number (0-100 range)

• taxAmount: Tax amount if mentioned separately
  If taxRate is found but taxAmount is not mentioned, calculate it:
  taxAmount = (subtotal × taxRate) / 100
  Then update total: total = subtotal + taxAmount

STEP 5: PAYMENT INFORMATION (Extract ALL payment methods)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• upiId: UPI ID pattern (identifier@provider)
  Examples: "designpay@okaxis", "john@paytm", "merchant@upi"
  Format: [text]@[provider]

• bankName: Bank name
  From IFSC code: "HDFC0002211" → "HDFC Bank"
  From text: "HDFC Bank", "ICICI", "SBI", "Axis Bank", etc.

• accountNumber: Bank account number (9-18 digits)
  Examples: "442201998721", "12345678901234"
  Extract digits only

• ifscCode: IFSC code (format: XXXX0XXXXXX)
  Examples: "HDFC0002211", "ICIC0001234", "SBIN0001234"
  Must be exactly 11 characters: 4 letters + 0 + 6 alphanumeric

• accountHolderName: Account holder name
  Look for: "Name: [Name]", "Account holder: [Name]", "A/C Name: [Name]"
  Examples: "Pixelwave Studio", "John Doe"

STEP 6: GST INFORMATION (Extract if mentioned)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• gstNumber: GST/GSTIN number if mentioned in billing details or anywhere in text
  Format: 2 digits + 5 letters + 4 digits + 1 letter + 1 alphanumeric + Z + 1 alphanumeric
  Examples: "22AAAAA0000A1Z5", "29ABCDE1234F1Z6", "27ABCDE1234F1Z5"
  Look for patterns:
  ✓ "GST: 22AAAAA0000A1Z5"
  ✓ "GSTIN: 22AAAAA0000A1Z5"
  ✓ "GST Number: 22AAAAA0000A1Z5"
  ✓ "GST No.: 22AAAAA0000A1Z5"
  ✓ "GSTIN No: 22AAAAA0000A1Z5"
  ✓ In billing details: "Billing Details:\nGST: 22AAAAA0000A1Z5"
  ✓ Just the number in GST format anywhere: "22AAAAA0000A1Z5"
  ✓ Case insensitive - extract and convert to uppercase

STEP 7: ADDITIONAL INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• notes: Any additional context, terms, conditions, or descriptions
  Include: payment terms, delivery info, special instructions, GST number (if not in separate field), etc.
  If GST number is found, include it in notes as "GST: [number]"

═══════════════════════════════════════════════════════════════
CRITICAL EXTRACTION RULES (MUST FOLLOW):
═══════════════════════════════════════════════════════════════
1. ✅ Extract EVERY line item - missing items is a CRITICAL error
2. ✅ If text has a breakdown/list, extract EACH item separately
3. ✅ Handle ALL format variations (colons, dashes, "was", "came to", "for", etc.)
4. ✅ Parse dates in ANY format and convert to YYYY-MM-DD
5. ✅ For dates without year, assume 2025
6. ✅ Extract company names as clientName if "Bill it to:" pattern exists
7. ✅ Calculate subtotal from sum of ALL items
8. ✅ Use explicit total if provided, otherwise subtotal
9. ✅ Extract ALL payment methods mentioned (UPI, bank, etc.)
10. ✅ Include descriptions with parentheses as-is
11. ✅ Remove currency symbols and commas from amounts
12. ✅ Default quantity to 1 if not mentioned

═══════════════════════════════════════════════════════════════
EXAMPLE EXTRACTIONS:
═══════════════════════════════════════════════════════════════

Example 1:
Input: "Hi, please generate an invoice for the recent design work.

Breakdown:
Logo refinement: ₹1,200
Social media banner (3 variants): ₹2,500
Landing page adjustments: ₹1,800
Total amount payable: ₹5,500
Payment method: UPI (designpay@okaxis)
Alternate: Bank A/C 442201998721, IFSC HDFC0002211, Name: Pixelwave Studio
Please set the due date as 15 April 2025.
Bill it to: Aurora Digital Pvt Ltd."

Output:
{
  "clientName": "Aurora Digital Pvt Ltd",
  "clientCompany": null,
  "clientEmail": null,
  "clientPhone": null,
  "clientAddress": null,
  "invoiceDate": null,
  "dueDate": "2025-04-15",
  "items": [
    {"description": "Logo refinement", "quantity": 1, "rate": 1200, "amount": 1200},
    {"description": "Social media banner (3 variants)", "quantity": 1, "rate": 2500, "amount": 2500},
    {"description": "Landing page adjustments", "quantity": 1, "rate": 1800, "amount": 1800}
  ],
  "currency": "INR",
  "subtotal": 5500,
  "total": 5500,
  "taxRate": null,
  "taxAmount": null,
  "upiId": "designpay@okaxis",
  "bankName": "HDFC Bank",
  "accountNumber": "442201998721",
  "ifscCode": "HDFC0002211",
  "accountHolderName": "Pixelwave Studio",
  "notes": null
}

Example 2:
Input: "For the website thing:
Home page redesign was ₹4,200
and that bug fix from last week was 1,150 rs (yep the hosting issue).
Also the short banner — you quoted ₹900 earlier, adding that too.
So overall it should be around ₹6,250 but let's keep it clean:
Total: ₹6,250
Need it before 10 Apr if possible."

Output:
{
  "clientName": null,
  "clientCompany": null,
  "clientEmail": null,
  "clientPhone": null,
  "clientAddress": null,
  "invoiceDate": null,
  "dueDate": "2025-04-10",
  "items": [
    {"description": "Home page redesign", "quantity": 1, "rate": 4200, "amount": 4200},
    {"description": "bug fix from last week (yep the hosting issue)", "quantity": 1, "rate": 1150, "amount": 1150},
    {"description": "short banner", "quantity": 1, "rate": 900, "amount": 900}
  ],
  "currency": "INR",
  "subtotal": 6250,
  "total": 6250,
  "taxRate": null,
  "taxAmount": null,
  "upiId": null,
  "bankName": null,
  "accountNumber": null,
  "ifscCode": null,
  "accountHolderName": null,
  "gstNumber": null,
  "notes": "For the website thing"
}

Example 3 (with GST):
Input: "Billing Details:
Client: NovaTech Global Solutions Pvt. Ltd.
Billing Contact: finance@novatechglobal.in
GST: 29ABCDE1234F1Z5
Address: Plot 14, Sector 5, Electronic City, Bengaluru – 560100"

Output:
{
  "clientName": "NovaTech Global Solutions Pvt. Ltd.",
  "clientCompany": null,
  "clientEmail": "finance@novatechglobal.in",
  "clientPhone": null,
  "clientAddress": "Plot 14, Sector 5, Electronic City, Bengaluru – 560100",
  "invoiceDate": null,
  "dueDate": null,
  "items": [],
  "currency": "INR",
  "subtotal": 0,
  "total": 0,
  "taxRate": null,
  "taxAmount": null,
  "upiId": null,
  "bankName": null,
  "accountNumber": null,
  "ifscCode": null,
  "accountHolderName": null,
  "gstNumber": "29ABCDE1234F1Z5",
  "notes": "GST: 29ABCDE1234F1Z5"
}

Example 4 (with GST percentage):
Input: "Logo design: ₹10,000
Website development: ₹25,000
GST @18%
Total amount payable: ₹41,300"

Output:
{
  "clientName": null,
  "clientCompany": null,
  "items": [
    {"description": "Logo design", "quantity": 1, "rate": 10000, "amount": 10000},
    {"description": "Website development", "quantity": 1, "rate": 25000, "amount": 25000}
  ],
  "currency": "INR",
  "subtotal": 35000,
  "taxRate": 18,
  "taxAmount": 6300,
  "total": 41300,
  "gstNumber": null,
  "notes": null
}

═══════════════════════════════════════════════════════════════
OUTPUT FORMAT (Return ONLY valid JSON, no markdown, no explanations):
═══════════════════════════════════════════════════════════════
{
  "clientName": "string or null",
  "clientCompany": "string or null",
  "clientEmail": "string or null",
  "clientPhone": "string or null",
  "clientAddress": "string or null",
  "invoiceDate": "YYYY-MM-DD or null",
  "dueDate": "YYYY-MM-DD or null",
  "items": [
    {
      "description": "string",
      "quantity": number,
      "rate": number,
      "amount": number
    }
  ],
  "currency": "INR or USD or EUR etc",
  "subtotal": number,
  "total": number,
  "taxRate": number or null,
  "taxAmount": number or null,
  "upiId": "string or null",
  "bankName": "string or null",
  "accountNumber": "string or null",
  "ifscCode": "string or null",
  "accountHolderName": "string or null",
  "gstNumber": "string or null",
  "notes": "string or null"
}

IMPORTANT RULES:
1. If GST number is found, include it in the "gstNumber" field AND also mention it in "notes" as "GST: [number]" for visibility.
2. If GST percentage is found (e.g., "GST @18%", "18% GST"), extract it as taxRate and calculate taxAmount:
   - taxRate = the percentage number (e.g., 18 for "18%")
   - taxAmount = (subtotal × taxRate) / 100
   - total = subtotal + taxAmount
3. Always calculate totals correctly when tax rate is present.

REMEMBER: Return ONLY the JSON object. No markdown code blocks, no explanations, no additional text. Just pure JSON.`;

    try {
      // Implement 15-second timeout for AI requests (increased for better reliability)
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('AI extraction timeout')), 15000);
      });

      const generationPromise = model.generateContent(prompt);

      const result = await Promise.race([generationPromise, timeoutPromise]);
      const response = await result.response;
      const responseText = response.text();

      // Parse the JSON response
      let extracted: any;
      try {
        // Remove markdown code blocks if present (handle various formats)
        let cleanedText = responseText
          .replace(/```json\n?/gi, '')
          .replace(/```\n?/g, '')
          .replace(/^json\s*/i, '')
          .trim();
        
        // Remove any leading/trailing whitespace and newlines
        cleanedText = cleanedText.trim();
        
        // Try to extract JSON if wrapped in other text
        const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          cleanedText = jsonMatch[0];
        }
        
        extracted = JSON.parse(cleanedText);
      } catch (parseError) {
        console.error('AI response parsing error:', parseError);
        console.error('Raw response:', responseText);
        throw new Error(`Failed to parse AI response as JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }

      // Map AI response to InvoiceData structure
      const invoiceData: Partial<InvoiceData> = {};

      // Client information
      if (extracted.clientName) invoiceData.clientName = String(extracted.clientName).trim();
      if (extracted.clientCompany) invoiceData.clientCompany = String(extracted.clientCompany).trim();
      if (extracted.clientEmail) invoiceData.clientEmail = String(extracted.clientEmail).trim();
      if (extracted.clientPhone) invoiceData.clientPhone = String(extracted.clientPhone).trim();
      if (extracted.clientAddress) invoiceData.clientAddress = String(extracted.clientAddress).trim();

      // Dates - normalize to YYYY-MM-DD format
      if (extracted.invoiceDate) {
        const normalizedDate = this.normalizeDate(String(extracted.invoiceDate).trim());
        if (normalizedDate) invoiceData.invoiceDate = normalizedDate;
      }
      if (extracted.dueDate) {
        const normalizedDate = this.normalizeDate(String(extracted.dueDate).trim());
        if (normalizedDate) invoiceData.dueDate = normalizedDate;
      }

      // Currency
      if (extracted.currency) {
        invoiceData.currency = String(extracted.currency).toUpperCase().trim();
      }

      // Line items - CRITICAL: Extract and map properly - NO LIMIT ON ITEMS
      if (extracted.items && Array.isArray(extracted.items) && extracted.items.length > 0) {
        // Process ALL items - no limit, no early stopping
        invoiceData.items = extracted.items.map((item: any, index: number) => {
          const description = item.description ? String(item.description).trim() : `Item ${index + 1}`;
          const quantity = typeof item.quantity === 'number' ? item.quantity : (typeof item.quantity === 'string' ? parseFloat(item.quantity) || 1 : 1);
          const rate = typeof item.rate === 'number' ? item.rate : (typeof item.rate === 'string' ? parseFloat(String(item.rate).replace(/,/g, '')) || 0 : 0);
          const amount = typeof item.amount === 'number' ? item.amount : (typeof item.amount === 'string' ? parseFloat(String(item.amount).replace(/,/g, '')) || (quantity * rate) : (quantity * rate));

          return {
            id: `item-${index + 1}`,
            description,
            quantity: Math.max(1, quantity), // Ensure at least 1
            rate: Math.max(0, rate),
            amount: Math.max(0, amount),
          };
        }).filter((item: any) => {
          // Only filter out truly invalid items (empty description or zero/negative amount)
          return item.description && item.description.trim().length > 0 && item.amount > 0;
        });
        
        // Log for debugging
        if (invoiceData.items && invoiceData.items.length > 0) {
          console.log(`AI extracted ${invoiceData.items.length} items:`, invoiceData.items.map(i => i.description));
        }
      } else if (extracted.total !== undefined && extracted.total !== null) {
        // If no items but total is provided, create a single item
        const total = typeof extracted.total === 'number' 
          ? extracted.total 
          : parseFloat(String(extracted.total).replace(/,/g, '')) || 0;
        
        if (total > 0) {
          invoiceData.items = [{
            id: 'item-1',
            description: extracted.notes || 'Service',
            quantity: 1,
            rate: total,
            amount: total,
          }];
        }
      }

      // Financial totals
      if (extracted.subtotal !== undefined && extracted.subtotal !== null) {
        invoiceData.subtotal = typeof extracted.subtotal === 'number' 
          ? extracted.subtotal 
          : parseFloat(String(extracted.subtotal).replace(/,/g, '')) || 0;
      } else if (invoiceData.items && invoiceData.items.length > 0) {
        // Calculate subtotal from items
        invoiceData.subtotal = invoiceData.items.reduce((sum, item) => sum + item.amount, 0);
      }

      if (extracted.total !== undefined && extracted.total !== null) {
        invoiceData.total = typeof extracted.total === 'number' 
          ? extracted.total 
          : parseFloat(String(extracted.total).replace(/,/g, '')) || 0;
      } else if (invoiceData.subtotal !== undefined) {
        invoiceData.total = invoiceData.subtotal;
      }

      // Tax information
      let taxRate: number | undefined = undefined;
      if (extracted.taxRate !== undefined && extracted.taxRate !== null) {
        taxRate = typeof extracted.taxRate === 'number' 
          ? extracted.taxRate 
          : parseFloat(String(extracted.taxRate)) || 0;
        invoiceData.taxRate = taxRate;
      } else {
        // Try to extract tax rate from text using regex as fallback
        const extractedRate = this.extractTaxRate(text);
        if (extractedRate !== null) {
          taxRate = extractedRate;
          invoiceData.taxRate = taxRate;
        }
      }

      // Calculate tax amount if tax rate is available
      if (taxRate !== undefined && taxRate > 0) {
        if (extracted.taxAmount !== undefined && extracted.taxAmount !== null) {
          invoiceData.taxAmount = typeof extracted.taxAmount === 'number' 
            ? extracted.taxAmount 
            : parseFloat(String(extracted.taxAmount).replace(/,/g, '')) || 0;
        } else if (invoiceData.subtotal !== undefined && invoiceData.subtotal > 0) {
          // Calculate tax amount from subtotal and tax rate
          invoiceData.taxAmount = parseFloat(((invoiceData.subtotal * taxRate) / 100).toFixed(2));
          // Update total to include tax
          invoiceData.total = parseFloat((invoiceData.subtotal + invoiceData.taxAmount).toFixed(2));
        } else if (invoiceData.total !== undefined && invoiceData.total > 0) {
          // If only total is known, calculate backwards
          const subtotal = invoiceData.total / (1 + taxRate / 100);
          invoiceData.subtotal = parseFloat(subtotal.toFixed(2));
          invoiceData.taxAmount = parseFloat((invoiceData.total - invoiceData.subtotal).toFixed(2));
        }
      } else if (extracted.taxAmount !== undefined && extracted.taxAmount !== null) {
        // Tax amount mentioned but no rate
        invoiceData.taxAmount = typeof extracted.taxAmount === 'number' 
          ? extracted.taxAmount 
          : parseFloat(String(extracted.taxAmount).replace(/,/g, '')) || 0;
      }

      // Payment info
      const paymentInfo: Partial<PaymentInfo> = {};
      if (extracted.upiId) paymentInfo.upiId = String(extracted.upiId).trim();
      if (extracted.bankName) paymentInfo.bankName = String(extracted.bankName).trim();
      if (extracted.accountNumber) paymentInfo.accountNumber = String(extracted.accountNumber).trim();
      if (extracted.ifscCode) paymentInfo.ifscCode = String(extracted.ifscCode).trim().toUpperCase();
      if (extracted.accountHolderName) paymentInfo.accountHolderName = String(extracted.accountHolderName).trim();

      if (Object.keys(paymentInfo).length > 0) {
        invoiceData.paymentInfo = paymentInfo;
      }

      // GST Number
      let gstNumber: string | null = null;
      if (extracted.gstNumber) {
        gstNumber = String(extracted.gstNumber).trim().toUpperCase();
      } else {
        // Also try to extract GST from text using regex as fallback
        gstNumber = this.extractGSTNumber(text);
      }
      
      // Notes - include GST if found
      let notes = extracted.notes ? String(extracted.notes).trim() : '';
      if (gstNumber) {
        if (notes) {
          // Check if GST is already in notes
          if (!notes.toUpperCase().includes('GST') || !notes.includes(gstNumber)) {
            notes = `${notes}\nGST: ${gstNumber}`;
          }
        } else {
          notes = `GST: ${gstNumber}`;
        }
      }
      if (notes) {
        invoiceData.notes = notes;
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

    // Handle items: prefer AI items if available and valid, otherwise use regex items
    // CRITICAL: No limit on number of items - preserve ALL items
    if (aiResults.items && Array.isArray(aiResults.items) && aiResults.items.length > 0) {
      merged.items = aiResults.items;
      console.log(`Merge: Using ${aiResults.items.length} AI items`);
    } else if (regexResults.items && Array.isArray(regexResults.items) && regexResults.items.length > 0) {
      merged.items = regexResults.items;
      console.log(`Merge: Using ${regexResults.items.length} regex items`);
    } else {
      merged.items = [];
      console.log('Merge: No items found from either source');
    }

    // Ensure dueDate is preserved (prefer AI, then regex, then keep existing)
    if (aiResults.dueDate) {
      merged.dueDate = aiResults.dueDate;
    } else if (regexResults.dueDate && !merged.dueDate) {
      merged.dueDate = regexResults.dueDate;
    }

    // Ensure taxRate is preserved (prefer AI, then regex)
    if (aiResults.taxRate !== undefined && aiResults.taxRate !== null) {
      merged.taxRate = aiResults.taxRate;
    } else if (regexResults.taxRate !== undefined && regexResults.taxRate !== null && !merged.taxRate) {
      merged.taxRate = regexResults.taxRate;
    }

    // Ensure taxAmount is preserved (prefer AI, then regex)
    if (aiResults.taxAmount !== undefined && aiResults.taxAmount !== null) {
      merged.taxAmount = aiResults.taxAmount;
    } else if (regexResults.taxAmount !== undefined && regexResults.taxAmount !== null && !merged.taxAmount) {
      merged.taxAmount = regexResults.taxAmount;
    }

    // Recalculate totals if items and tax rate are present
    if (merged.items && merged.items.length > 0 && merged.taxRate && merged.taxRate > 0) {
      const subtotal = merged.items.reduce((sum, item) => sum + item.amount, 0);
      merged.subtotal = subtotal;
      
      // Recalculate tax amount from tax rate
      if (!merged.taxAmount || merged.taxAmount === 0) {
        merged.taxAmount = parseFloat(((subtotal * merged.taxRate) / 100).toFixed(2));
      }
      
      // Update total
      merged.total = parseFloat((subtotal + (merged.taxAmount || 0)).toFixed(2));
    }

    // Merge payment info specially to combine fields from both sources
    if (regexResults.paymentInfo || aiResults.paymentInfo) {
      merged.paymentInfo = {
        ...regexResults.paymentInfo,
        ...aiResults.paymentInfo,
      };
    }

    // Recalculate totals if items are present
    if (merged.items && merged.items.length > 0) {
      const subtotal = merged.items.reduce((sum, item) => sum + item.amount, 0);
      merged.subtotal = subtotal;
      
      // If AI provided a total, use it; otherwise calculate from subtotal + tax
      if (aiResults.total !== undefined && aiResults.total !== null) {
        merged.total = aiResults.total;
      } else {
        const taxAmount = merged.taxAmount || 0;
        merged.total = subtotal + taxAmount;
      }
    } else if (merged.total === undefined && merged.subtotal !== undefined) {
      // If no items but subtotal exists, use it as total
      merged.total = merged.subtotal;
    }

    // Ensure currency has a default
    if (!merged.currency) {
      merged.currency = 'INR';
    }

    // Ensure date has a default (current date)
    if (!merged.invoiceDate) {
      merged.invoiceDate = new Date().toISOString().split('T')[0];
    }

    // Ensure items array exists
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

    // Ensure invoice date has a default (current date) - but preserve dueDate if it exists
    if (!merged.invoiceDate) {
      merged.invoiceDate = new Date().toISOString().split('T')[0];
    }

    // Ensure items array exists and is valid
    if (!merged.items || !Array.isArray(merged.items)) {
      merged.items = [];
    }

    // Recalculate subtotal from items if items exist but subtotal doesn't match
    if (merged.items.length > 0) {
      const calculatedSubtotal = merged.items.reduce((sum, item) => sum + (item.amount || 0), 0);
      if (!merged.subtotal || Math.abs(merged.subtotal - calculatedSubtotal) > 0.01) {
        merged.subtotal = calculatedSubtotal;
      }
      
      // Recalculate tax amount if tax rate is present
      if (merged.taxRate !== undefined && merged.taxRate !== null && merged.taxRate > 0) {
        const calculatedTaxAmount = (merged.subtotal * merged.taxRate) / 100;
        merged.taxAmount = parseFloat(calculatedTaxAmount.toFixed(2));
      }
      
      // If total is not set or doesn't match, calculate it
      if (!merged.total || (merged.subtotal && Math.abs(merged.total - (merged.subtotal + (merged.taxAmount || 0))) > 0.01)) {
        merged.total = merged.subtotal + (merged.taxAmount || 0);
      }
    }

    // Ensure taxRate is preserved (don't override if it exists)
    // taxRate can be 0, so we check for undefined/null specifically
    if (merged.taxRate === undefined || merged.taxRate === null) {
      // Don't set default, let it be undefined if not extracted
    }

    return merged;
  }
}
