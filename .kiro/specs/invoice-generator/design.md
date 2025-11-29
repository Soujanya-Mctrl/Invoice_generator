# Design Document

## Overview

The Invoice Generator is a Next.js web application that transforms unstructured payment text into professional PDF invoices through a four-stage pipeline: extraction, editing, preview, and download. The system operates entirely in the browser with optional AI enhancement, using local storage for persistence and ensuring complete data privacy.

The architecture follows a clean separation between the Next.js frontend (UI components), API routes (business logic), and utility modules (extraction, PDF generation, storage). This design enables rapid development while maintaining testability and extensibility.

## Architecture

### High-Level Architecture

```mermaid
graph TB
    subgraph "Browser"
        UI[Next.js UI Components]
        LS[Local Storage]
    end
    
    subgraph "Next.js API Routes"
        Extract[/api/extract]
        Generate[/api/generate]
        Vendor[/api/vendor]
        Number[/api/numbering/next]
        Logo[/api/upload/logo]
    end
    
    subgraph "Core Services"
        ExtractionEngine[Extraction Engine]
        PDFGenerator[PDF Generator]
        StorageService[Storage Service]
        NumberingService[Numbering Service]
    end
    
    subgraph "External Services"
        Gemini[Gemini Flash API]
    end
    
    UI -->|POST payment text| Extract
    UI -->|POST invoice data| Generate
    UI -->|POST vendor data| Vendor
    UI -->|POST| Number
    UI -->|POST logo file| Logo
    
    Extract --> ExtractionEngine
    ExtractionEngine -.->|optional| Gemini
    ExtractionEngine -->|fallback| ExtractionEngine
    
    Generate --> PDFGenerator
    Vendor --> StorageService
    Number --> NumberingService
    Logo --> StorageService
    
    StorageService <--> LS
    NumberingService <--> LS
    
    Generate -->|PDF blob| UI
    Extract -->|JSON fields| UI
```

### Technology Stack

- **Frontend Framework**: Next.js 14+ with App Router
- **Styling**: Tailwind CSS with ShadCN UI components
- **PDF Generation**: react-pdf/renderer (React-based PDF creation)
- **Text Extraction**: 
  - Regex patterns for structured data (amounts, dates, UPI, bank details)
  - Google Gemini Flash API for AI-enhanced extraction
- **Storage**: Browser localStorage API
- **API Layer**: Next.js API routes (serverless functions)
- **Type Safety**: TypeScript throughout

### Design Principles

1. **Privacy First**: All data processing occurs locally; external API calls are optional and transparent
2. **Progressive Enhancement**: Regex extraction works offline; AI enhancement is optional
3. **Minimal Dependencies**: Use native browser APIs where possible
4. **Responsive Design**: Mobile-first approach with touch-friendly controls
5. **Fast Feedback**: Immediate validation and preview updates

## Components and Interfaces

### Frontend Components

#### 1. Main Invoice Generator Page (`app/page.tsx`)

The primary user interface orchestrating the entire workflow.

```typescript
interface InvoiceGeneratorPageProps {}

interface InvoiceGeneratorState {
  step: 'input' | 'edit' | 'preview';
  paymentText: string;
  extractedData: InvoiceData | null;
  isExtracting: boolean;
  isGenerating: boolean;
  error: ErrorResponse | null;
}
```

**Responsibilities:**
- Manage workflow state transitions
- Coordinate between child components
- Handle API calls to backend routes
- Display error messages

#### 2. Text Input Component (`components/TextInput.tsx`)

Accepts payment text from user.

```typescript
interface TextInputProps {
  value: string;
  onChange: (text: string) => void;
  onExtract: () => void;
  isLoading: boolean;
}
```

**Features:**
- Large textarea for pasting payment text
- Character count display
- Extract button with loading state
- Clear button

#### 3. Invoice Form Component (`components/InvoiceForm.tsx`)

Editable form for invoice fields.

```typescript
interface InvoiceFormProps {
  data: InvoiceData;
  onChange: (data: InvoiceData) => void;
  onPreview: () => void;
  vendorProfile: VendorProfile | null;
}
```

**Features:**
- Editable fields for all invoice data
- Vendor profile integration
- Line item management (add/remove)
- Tax calculation
- Real-time total updates
- Validation feedback

#### 4. Invoice Preview Component (`components/InvoicePreview.tsx`)

Visual preview of the PDF invoice.

```typescript
interface InvoicePreviewProps {
  data: InvoiceData;
  vendorProfile: VendorProfile;
  onGenerate: () => void;
  onEdit: () => void;
}
```

**Features:**
- Rendered preview using react-pdf Document component
- Download button
- Edit button to return to form
- Responsive scaling for mobile

#### 5. Vendor Profile Component (`components/VendorProfile.tsx`)

Manage vendor information.

```typescript
interface VendorProfileProps {
  profile: VendorProfile | null;
  onChange: (profile: VendorProfile) => void;
  onLogoUpload: (file: File) => void;
}
```

**Features:**
- Collapsible panel
- Form fields for vendor details
- Logo upload with preview
- Save to localStorage

### API Routes

#### 1. Extract Endpoint (`app/api/extract/route.ts`)

```typescript
// POST /api/extract
interface ExtractRequest {
  text: string;
  useAI?: boolean;
}

interface ExtractResponse {
  success: boolean;
  data?: InvoiceData;
  error?: ErrorResponse;
  extractionMethod: 'regex' | 'ai' | 'hybrid';
}
```

**Logic:**
1. Validate input text
2. Apply regex patterns for structured data
3. If `useAI` is true and Gemini API is available, enhance with AI
4. Merge regex and AI results
5. Return extracted fields

#### 2. Generate Endpoint (`app/api/generate/route.ts`)

```typescript
// POST /api/generate
interface GenerateRequest {
  invoiceData: InvoiceData;
  vendorProfile: VendorProfile;
}

interface GenerateResponse {
  success: boolean;
  pdfBlob?: Blob;
  error?: ErrorResponse;
}
```

**Logic:**
1. Validate invoice data completeness
2. Generate invoice number if not provided
3. Create PDF using react-pdf/renderer
4. Return PDF as blob

#### 3. Vendor Endpoint (`app/api/vendor/route.ts`)

```typescript
// POST /api/vendor
interface VendorRequest {
  profile: VendorProfile;
}

interface VendorResponse {
  success: boolean;
  error?: ErrorResponse;
}
```

**Logic:**
1. Validate vendor profile data
2. Store in localStorage (client-side operation)
3. Return success status

#### 4. Numbering Endpoint (`app/api/numbering/next/route.ts`)

```typescript
// POST /api/numbering/next
interface NumberingResponse {
  success: boolean;
  invoiceNumber?: string;
  error?: ErrorResponse;
}
```

**Logic:**
1. Retrieve last invoice number from localStorage
2. Parse year and sequence
3. If new year, reset to 001
4. Otherwise, increment sequence
5. Return formatted number (INV-YYYY-###)

#### 5. Logo Upload Endpoint (`app/api/upload/logo/route.ts`)

```typescript
// POST /api/upload/logo
interface LogoUploadRequest {
  file: File;
}

interface LogoUploadResponse {
  success: boolean;
  logoUrl?: string;
  error?: ErrorResponse;
}
```

**Logic:**
1. Validate file type (image only)
2. Validate file size (< 500KB)
3. Convert to base64 data URL
4. Store in localStorage
5. Return data URL

### Core Services

#### 1. Extraction Engine (`lib/extraction/engine.ts`)

```typescript
interface ExtractionEngine {
  extractWithRegex(text: string): Partial<InvoiceData>;
  extractWithAI(text: string): Promise<Partial<InvoiceData>>;
  mergeResults(regex: Partial<InvoiceData>, ai: Partial<InvoiceData>): InvoiceData;
}
```

**Regex Patterns:**
- **Amount**: `/(?:Rs\.?|INR|₹)\s*(\d+(?:,\d+)*(?:\.\d{2})?)/gi`
- **Currency**: `/(?:Rs\.?|INR|₹|USD|\$|EUR|€)/gi`
- **Date**: `/(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/g`
- **UPI**: `/[\w.-]+@[\w.-]+/g`
- **Bank Account**: `/\b\d{9,18}\b/g`
- **IFSC**: `/[A-Z]{4}0[A-Z0-9]{6}/g`
- **GST**: `/\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}/g`
- **Email**: `/[\w.-]+@[\w.-]+\.\w+/g`
- **Phone**: `/(?:\+91|0)?[6-9]\d{9}/g`

**AI Integration:**
- Use Gemini Flash API with structured prompt
- Request JSON response with specific fields
- Timeout after 8 seconds
- Fall back to regex on failure

#### 2. PDF Generator (`lib/pdf/generator.ts`)

```typescript
interface PDFGenerator {
  generateInvoice(data: InvoiceData, vendor: VendorProfile): Promise<Blob>;
}
```

**PDF Structure:**
- Header: Vendor logo and details (left), Invoice number and date (right)
- Client section: Bill to information
- Line items: Table with description, quantity, rate, amount
- Tax section: Subtotal, tax calculation, total
- Footer: Payment instructions (UPI/bank details)
- Styling: Professional fonts, proper spacing, borders

**Implementation with react-pdf:**
```typescript
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';

const InvoiceDocument = ({ data, vendor }: Props) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      {/* Client Info */}
      {/* Line Items Table */}
      {/* Totals */}
      {/* Payment Info */}
    </Page>
  </Document>
);
```

#### 3. Storage Service (`lib/storage/service.ts`)

```typescript
interface StorageService {
  saveVendorProfile(profile: VendorProfile): void;
  getVendorProfile(): VendorProfile | null;
  saveLogo(dataUrl: string): void;
  getLogo(): string | null;
  getLastInvoiceNumber(): string | null;
  saveLastInvoiceNumber(number: string): void;
  clear(): void;
}
```

**Storage Keys:**
- `invoice_vendor_profile`: JSON string of vendor data
- `invoice_vendor_logo`: Base64 data URL
- `invoice_last_number`: Last used invoice number

**Error Handling:**
- Catch QuotaExceededError for storage limits
- Provide clear error messages
- Graceful degradation if storage unavailable

#### 4. Numbering Service (`lib/numbering/service.ts`)

```typescript
interface NumberingService {
  generateNext(): string;
  parseInvoiceNumber(number: string): { year: number; sequence: number };
  formatInvoiceNumber(year: number, sequence: number): string;
}
```

**Logic:**
```typescript
function generateNext(): string {
  const lastNumber = storageService.getLastInvoiceNumber();
  const currentYear = new Date().getFullYear();
  
  if (!lastNumber) {
    return `INV-${currentYear}-001`;
  }
  
  const { year, sequence } = parseInvoiceNumber(lastNumber);
  
  if (year < currentYear) {
    return `INV-${currentYear}-001`;
  }
  
  const nextSequence = sequence + 1;
  return formatInvoiceNumber(currentYear, nextSequence);
}
```

## Data Models

### InvoiceData

```typescript
interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string; // ISO 8601 format
  dueDate?: string;
  
  // Client information
  clientName: string;
  clientCompany?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  
  // Line items
  items: LineItem[];
  
  // Financial
  currency: string; // ISO 4217 code (INR, USD, EUR)
  subtotal: number;
  taxRate?: number; // Percentage
  taxAmount?: number;
  total: number;
  
  // Payment information
  paymentInfo?: PaymentInfo;
  
  // Notes
  notes?: string;
}

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface PaymentInfo {
  upiId?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  accountHolderName?: string;
}
```

### VendorProfile

```typescript
interface VendorProfile {
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
```

### ErrorResponse

```typescript
interface ErrorResponse {
  errorCode: ErrorCode;
  message: string;
  details?: Record<string, string>;
}

type ErrorCode =
  | 'EXTRACTION_INCOMPLETE'
  | 'INVALID_INPUT'
  | 'PDF_GENERATION_FAILED'
  | 'AI_SERVICE_UNAVAILABLE'
  | 'STORAGE_QUOTA_EXCEEDED'
  | 'INVALID_FILE_TYPE'
  | 'FILE_TOO_LARGE'
  | 'NETWORK_ERROR';
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Extraction returns structured data

*For any* payment text input, the extraction engine should return an object containing fields for client name, company name, service description, amount, currency, due date, and payment information (even if some fields are empty or null).

**Validates: Requirements 2.1**

### Property 2: Currency and amount extraction

*For any* payment text containing an amount with a currency symbol (₹, Rs, INR, $, USD, €, EUR), the extraction engine should identify and extract both the numeric amount and the currency code.

**Validates: Requirements 1.4**

### Property 3: Date parsing normalization

*For any* payment text containing dates in various formats (DD/MM/YYYY, DD-MM-YYYY, MM/DD/YYYY), the extraction engine should parse and normalize them to ISO 8601 format (YYYY-MM-DD).

**Validates: Requirements 1.5**

### Property 4: UPI ID extraction

*For any* payment text containing valid UPI ID patterns (format: identifier@provider), the extraction engine should extract the UPI ID.

**Validates: Requirements 2.2**

### Property 5: Bank details extraction

*For any* payment text containing bank account numbers (9-18 digits) and IFSC codes (format: XXXX0XXXXXX), the extraction engine should extract both the account number and IFSC code.

**Validates: Requirements 2.3**

### Property 6: AI fallback on incomplete extraction

*For any* payment text where regex extraction returns incomplete data (missing required fields), the system should invoke the Gemini API to enhance extraction results.

**Validates: Requirements 2.4**

### Property 7: Vendor profile round-trip

*For any* valid vendor profile data, saving to local storage and then retrieving should return equivalent data with all fields preserved.

**Validates: Requirements 3.1, 3.3, 8.3**

### Property 8: Logo upload round-trip

*For any* valid image file uploaded as a vendor logo, storing to local storage and then retrieving should return equivalent image data (as base64 data URL).

**Validates: Requirements 3.2, 8.5**

### Property 9: Vendor profile updates persist

*For any* vendor profile modification, the updated data should be immediately reflected in local storage when retrieved.

**Validates: Requirements 3.4**

### Property 10: GST number validation

*For any* GST number input, only strings matching the valid GST format (15 characters: 2 digits, 5 letters, 4 digits, 1 letter, 1 alphanumeric, Z, 1 alphanumeric) should be accepted for storage.

**Validates: Requirements 3.5**

### Property 11: Line item total calculation

*For any* set of line items with quantities and rates, the invoice total should equal the sum of all line item amounts (quantity × rate for each item).

**Validates: Requirements 4.3**

### Property 12: Tax calculation accuracy

*For any* subtotal amount and tax rate percentage, the calculated tax amount should equal (subtotal × tax rate / 100), and the total should equal (subtotal + tax amount).

**Validates: Requirements 4.4**

### Property 13: Form validation enables generation

*For any* invoice data where all required fields (client name, at least one line item, amounts) contain valid non-empty values, the PDF generation action should be enabled.

**Validates: Requirements 4.5**

### Property 14: Preview contains all invoice data

*For any* invoice data with vendor profile, the preview rendering should include all non-empty fields: invoice number, date, vendor details, client details, line items, totals, and payment information.

**Validates: Requirements 5.2**

### Property 15: Preview updates with edits

*For any* invoice data modification after preview is displayed, the preview should automatically re-render to reflect the updated data.

**Validates: Requirements 5.3**

### Property 16: Logo appears in preview

*For any* vendor profile with a logo URL, the preview should display the logo image.

**Validates: Requirements 5.4**

### Property 17: PDF generation completeness

*For any* valid invoice data and vendor profile, the generated PDF should contain all provided data including invoice number, date, vendor details, client details, all line items with amounts, and payment information.

**Validates: Requirements 6.1, 6.4, 9.1**

### Property 18: PDF includes invoice number

*For any* generated PDF, it should contain an invoice number in the format INV-YYYY-### where YYYY is a four-digit year and ### is a three-digit zero-padded sequence number.

**Validates: Requirements 6.2, 10.1**

### Property 19: PDF includes invoice date

*For any* generated PDF, it should contain an invoice date matching the current date or the specified invoice date.

**Validates: Requirements 6.3**

### Property 20: PDF line items table structure

*For any* invoice with line items, the generated PDF should display them in a tabular format with columns for description, quantity, rate, and amount.

**Validates: Requirements 9.2**

### Property 21: PDF tax display

*For any* invoice with a non-zero tax rate, the generated PDF should display the subtotal, tax rate, tax amount, and total amount including tax.

**Validates: Requirements 9.3**

### Property 22: PDF payment instructions

*For any* invoice with payment information (UPI ID or bank details), the generated PDF should include a payment instructions section displaying the provided payment details.

**Validates: Requirements 9.4**

### Property 23: PDF logo inclusion

*For any* vendor profile with an uploaded logo, the generated PDF should display the logo in the header section.

**Validates: Requirements 9.5**

### Property 24: Regex extraction fallback

*For any* payment text, if the Gemini API is unavailable or times out, the extraction engine should return results from regex-based extraction without failing.

**Validates: Requirements 7.4**

### Property 25: Extract API response structure

*For any* POST request to /api/extract with valid payment text, the response should be valid JSON containing a success boolean, optional data object with invoice fields, optional error object, and extractionMethod string.

**Validates: Requirements 8.1**

### Property 26: Generate API returns PDF

*For any* POST request to /api/generate with valid invoice data and vendor profile, the response should be a PDF blob with MIME type application/pdf.

**Validates: Requirements 8.2**

### Property 27: Invoice number sequence increment

*For any* sequence of calls to /api/numbering/next within the same calendar year, each call should return an invoice number with a sequence value exactly one greater than the previous call.

**Validates: Requirements 10.3**

### Property 28: Invoice number year rollover

*For any* invoice number generated in a new calendar year, if the previous invoice was from a prior year, the sequence number should reset to 001.

**Validates: Requirements 10.2**

### Property 29: Invoice number persistence

*For any* invoice number generated before a system restart, the next invoice number generated after restart should continue the sequence (same year) or reset appropriately (new year).

**Validates: Requirements 10.4**

### Property 30: Invoice number uniqueness

*For any* set of invoice numbers generated by the system, no two invoice numbers should be identical.

**Validates: Requirements 10.5**

### Property 31: AI timeout fallback

*For any* extraction request using Gemini API that exceeds 10 seconds, the system should automatically fall back to regex-based extraction and return results.

**Validates: Requirements 11.2**

### Property 32: Error handling stability

*For any* error condition encountered during processing (extraction, validation, PDF generation), the system should return a structured error response and continue functioning without crashing.

**Validates: Requirements 11.5**

### Property 33: Error response structure

*For any* API endpoint error, the response should be valid JSON containing an errorCode string and a message string.

**Validates: Requirements 14.1**

### Property 34: Extraction incomplete error

*For any* extraction that fails to detect required fields (client name or amount), the API should return error code EXTRACTION_INCOMPLETE with details of which fields are missing.

**Validates: Requirements 14.2**

### Property 35: Invalid input error

*For any* API request with invalid or malformed data, the response should return error code INVALID_INPUT with field-specific validation messages.

**Validates: Requirements 14.3**

### Property 36: PDF generation failure error

*For any* PDF generation failure (due to invalid data or rendering errors), the API should return error code PDF_GENERATION_FAILED with the specific failure reason.

**Validates: Requirements 14.4**

### Property 37: AI service unavailable error with fallback

*For any* extraction request when Gemini API is unavailable, the system should return error code AI_SERVICE_UNAVAILABLE in the response metadata while still providing regex-based extraction results.

**Validates: Requirements 14.5**


## Error Handling

### Error Categories

1. **Extraction Errors**
   - Incomplete extraction (missing required fields)
   - Invalid text format
   - AI service timeout or unavailability

2. **Validation Errors**
   - Invalid GST number format
   - Missing required invoice fields
   - Invalid file type for logo upload
   - File size exceeds limit

3. **Storage Errors**
   - LocalStorage quota exceeded
   - Storage unavailable (private browsing mode)

4. **PDF Generation Errors**
   - Invalid invoice data structure
   - Missing required vendor information
   - Rendering failures

5. **Network Errors**
   - Gemini API timeout
   - Network connectivity issues

### Error Handling Strategy

**Client-Side Error Handling:**
```typescript
try {
  const result = await extractInvoiceData(text);
  if (!result.success) {
    displayError(result.error);
  }
} catch (error) {
  displayError({
    errorCode: 'NETWORK_ERROR',
    message: 'Unable to process request. Please try again.'
  });
}
```

**API Error Responses:**
```typescript
// Consistent error response format
return NextResponse.json({
  success: false,
  error: {
    errorCode: 'EXTRACTION_INCOMPLETE',
    message: 'Could not extract all required fields',
    details: {
      missingFields: ['clientName', 'amount']
    }
  }
}, { status: 400 });
```

**Graceful Degradation:**
- If Gemini API fails, fall back to regex extraction
- If localStorage is full, warn user and allow in-memory operation
- If logo upload fails, allow invoice generation without logo
- If date parsing fails, use current date as default

**User-Friendly Error Messages:**
- Avoid technical jargon in user-facing messages
- Provide actionable suggestions (e.g., "Try pasting more detailed payment information")
- Show specific field errors in form validation
- Display toast notifications for transient errors

## Testing Strategy

### Unit Testing

**Framework:** Jest with React Testing Library

**Unit Test Coverage:**

1. **Extraction Engine Tests**
   - Test regex patterns with known input/output pairs
   - Test date parsing with various formats
   - Test currency extraction with different symbols
   - Test UPI and bank detail extraction
   - Test edge cases: empty strings, special characters, very long text

2. **Numbering Service Tests**
   - Test invoice number formatting
   - Test sequence increment logic
   - Test year rollover behavior
   - Test parsing of existing invoice numbers

3. **Storage Service Tests**
   - Test save and retrieve operations
   - Test handling of quota exceeded errors
   - Test data serialization/deserialization

4. **Validation Functions Tests**
   - Test GST number validation with valid and invalid formats
   - Test required field validation
   - Test file type and size validation

5. **Component Tests**
   - Test form field updates and validation
   - Test line item addition and removal
   - Test total calculation updates
   - Test error message display

**Example Unit Test:**
```typescript
describe('ExtractionEngine', () => {
  describe('extractAmount', () => {
    it('should extract INR amount with rupee symbol', () => {
      const text = 'Please pay ₹5,000.00 for services';
      const result = extractAmount(text);
      expect(result).toEqual({ amount: 5000.00, currency: 'INR' });
    });
    
    it('should extract USD amount with dollar sign', () => {
      const text = 'Total: $1,234.56';
      const result = extractAmount(text);
      expect(result).toEqual({ amount: 1234.56, currency: 'USD' });
    });
  });
});
```

### Property-Based Testing

**Framework:** fast-check (JavaScript property-based testing library)

**Configuration:** Each property test should run a minimum of 100 iterations to ensure thorough coverage of the input space.

**Property Test Coverage:**

Each property-based test MUST be tagged with a comment explicitly referencing the correctness property from this design document using the format: `**Feature: invoice-generator, Property {number}: {property_text}**`

1. **Extraction Properties**
   - Property 1: Extraction returns structured data
   - Property 2: Currency and amount extraction
   - Property 3: Date parsing normalization
   - Property 4: UPI ID extraction
   - Property 5: Bank details extraction

2. **Storage Properties**
   - Property 7: Vendor profile round-trip
   - Property 8: Logo upload round-trip
   - Property 9: Vendor profile updates persist

3. **Calculation Properties**
   - Property 11: Line item total calculation
   - Property 12: Tax calculation accuracy

4. **Numbering Properties**
   - Property 27: Invoice number sequence increment
   - Property 28: Invoice number year rollover
   - Property 30: Invoice number uniqueness

5. **PDF Generation Properties**
   - Property 17: PDF generation completeness
   - Property 20: PDF line items table structure
   - Property 21: PDF tax display

6. **Error Handling Properties**
   - Property 32: Error handling stability
   - Property 33: Error response structure
   - Property 37: AI service unavailable error with fallback

**Example Property Test:**
```typescript
import fc from 'fast-check';

/**
 * Feature: invoice-generator, Property 11: Line item total calculation
 * For any set of line items with quantities and rates, the invoice total 
 * should equal the sum of all line item amounts.
 */
describe('Property 11: Line item total calculation', () => {
  it('should calculate correct total for any set of line items', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            description: fc.string(),
            quantity: fc.integer({ min: 1, max: 1000 }),
            rate: fc.float({ min: 0.01, max: 100000, noNaN: true })
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (lineItems) => {
          const invoice = calculateInvoiceTotal(lineItems);
          const expectedTotal = lineItems.reduce(
            (sum, item) => sum + (item.quantity * item.rate),
            0
          );
          expect(invoice.total).toBeCloseTo(expectedTotal, 2);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

**Smart Generators for Property Tests:**

```typescript
// Generator for valid payment text with known structure
const paymentTextArbitrary = fc.record({
  clientName: fc.fullName(),
  amount: fc.float({ min: 1, max: 1000000 }),
  currency: fc.constantFrom('INR', 'USD', 'EUR'),
  upiId: fc.emailAddress().map(email => email.replace('@', '@upi')),
  date: fc.date()
}).map(data => 
  `Payment from ${data.clientName}
   Amount: ${data.currency} ${data.amount}
   UPI: ${data.upiId}
   Date: ${data.date.toLocaleDateString()}`
);

// Generator for valid GST numbers
const gstNumberArbitrary = fc.tuple(
  fc.integer({ min: 10, max: 99 }),
  fc.stringOf(fc.constantFrom('ABCDEFGHIJKLMNOPQRSTUVWXYZ'), { minLength: 5, maxLength: 5 }),
  fc.integer({ min: 1000, max: 9999 }),
  fc.constantFrom('ABCDEFGHIJKLMNOPQRSTUVWXYZ'),
  fc.alphaNumeric(),
  fc.constant('Z'),
  fc.alphaNumeric()
).map(([digits, letters, nums, letter1, alpha1, z, alpha2]) => 
  `${digits}${letters}${nums}${letter1}${alpha1}${z}${alpha2}`
);
```

### Integration Testing

**Scope:** Test API routes with actual service implementations

1. **API Route Tests**
   - Test /api/extract with various payment text samples
   - Test /api/generate with complete invoice data
   - Test /api/vendor with profile save/retrieve
   - Test /api/numbering/next for sequence generation
   - Test error responses for invalid inputs

2. **End-to-End Workflow Tests**
   - Test complete flow: paste text → extract → edit → preview → generate
   - Test vendor profile persistence across sessions
   - Test invoice numbering across multiple generations

**Example Integration Test:**
```typescript
describe('POST /api/extract', () => {
  it('should extract invoice data from payment text', async () => {
    const response = await fetch('/api/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'Payment from John Doe, Amount: ₹5000, UPI: john@paytm'
      })
    });
    
    const result = await response.json();
    expect(result.success).toBe(true);
    expect(result.data.clientName).toBe('John Doe');
    expect(result.data.amount).toBe(5000);
    expect(result.data.currency).toBe('INR');
  });
});
```

### Manual Testing Checklist

1. **Cross-Browser Testing**
   - Test on Chrome, Firefox, Safari, Edge
   - Verify localStorage functionality
   - Test PDF download on each browser

2. **Mobile Testing**
   - Test responsive layout on various screen sizes
   - Test touch interactions
   - Test paste functionality on mobile browsers
   - Test PDF download/share on mobile

3. **Real-World Payment Text**
   - Test with actual email payment notifications
   - Test with WhatsApp payment messages
   - Test with SMS payment confirmations
   - Test with various formats and languages

4. **Edge Cases**
   - Test with very long text (>10,000 characters)
   - Test with text containing no extractable data
   - Test with multiple amounts in same text
   - Test with ambiguous dates
   - Test localStorage quota limits

5. **Accessibility**
   - Test keyboard navigation
   - Test screen reader compatibility
   - Test color contrast
   - Test focus indicators

## Implementation Notes

### Next.js Configuration

```typescript
// next.config.js
module.exports = {
  reactStrictMode: true,
  env: {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  },
  webpack: (config) => {
    // Configure for react-pdf
    config.resolve.alias.canvas = false;
    return config;
  }
};
```

### Environment Variables

```bash
# .env.local
GEMINI_API_KEY=your_gemini_api_key_here
```

### Dependencies

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@react-pdf/renderer": "^3.1.0",
    "@google/generative-ai": "^0.1.0",
    "tailwindcss": "^3.3.0",
    "@radix-ui/react-*": "latest"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/react": "^18.2.0",
    "jest": "^29.0.0",
    "@testing-library/react": "^14.0.0",
    "fast-check": "^3.15.0"
  }
}
```

### Performance Optimizations

1. **Lazy Loading**
   - Lazy load PDF preview component
   - Lazy load Gemini API client

2. **Memoization**
   - Memoize extraction results
   - Memoize PDF preview rendering
   - Memoize total calculations

3. **Debouncing**
   - Debounce form field updates
   - Debounce preview re-renders

4. **Code Splitting**
   - Split PDF generation into separate chunk
   - Split AI extraction into separate chunk

### Security Considerations

1. **Input Sanitization**
   - Sanitize all user inputs before processing
   - Validate file uploads (type, size)
   - Escape special characters in PDF generation

2. **API Key Protection**
   - Store Gemini API key in environment variables
   - Never expose API key in client-side code
   - Use API routes as proxy for external calls

3. **Data Privacy**
   - Clear indication when data is sent to external services
   - Option to disable AI extraction
   - No server-side logging of invoice data

4. **LocalStorage Security**
   - Consider encrypting sensitive data
   - Implement data expiration for old invoices
   - Provide clear data deletion option

## Deployment Considerations

Since the application is designed to work locally without deployment, the focus is on easy setup:

1. **Local Development**
   ```bash
   npm install
   npm run dev
   ```

2. **Production Build**
   ```bash
   npm run build
   npm start
   ```

3. **Static Export (Optional)**
   - For completely offline usage, consider static export
   - Note: API routes won't work in static export
   - Would require refactoring to client-side only

4. **Docker Container (Optional)**
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm install
   COPY . .
   RUN npm run build
   EXPOSE 3000
   CMD ["npm", "start"]
   ```

This design provides a solid foundation for building a fast, privacy-focused invoice generator that works entirely locally while offering optional AI enhancement for improved extraction accuracy.
