# Implementation Plan

- [-] 1. Set up Next.js project structure and dependencies











  - Initialize Next.js 14+ project with TypeScript and App Router
  - Install core dependencies: Tailwind CSS, ShadCN UI, @react-pdf/renderer, @google/generative-ai
  - Install dev dependencies: Jest, @testing-library/react, fast-check
  - Configure Tailwind CSS and create base styles
  - Set up TypeScript configuration for strict type checking
  - Create src/ folder structure: src/app/, src/components/, src/lib/, src/types/
  - Create .gitignore file (node_modules, .next, .env.local, .DS_Store)
  - Create .env.example file with GEMINI_API_KEY placeholder
  - Initialize git repository and create initial commit
  - _Requirements: All requirements depend on proper project setup_

- [ ] 2. Define core data models and types
  - Create TypeScript interfaces for InvoiceData, LineItem, PaymentInfo in src/types/invoice.ts
  - Create TypeScript interface for VendorProfile in src/types/vendor.ts
  - Create TypeScript type for ErrorResponse and ErrorCode enum in src/types/error.ts
  - Create TypeScript interfaces for API request/response types in src/types/api.ts
  - Export all types from src/types/index.ts
  - _Requirements: 1.1, 2.1, 3.1, 8.1, 8.2, 14.1_

- [ ] 3. Implement storage service for localStorage operations
  - Create StorageService class in src/lib/storage/service.ts
  - Implement saveVendorProfile and getVendorProfile methods
  - Implement saveLogo and getLogo methods for base64 image storage
  - Implement getLastInvoiceNumber and saveLastInvoiceNumber methods
  - Add error handling for QuotaExceededError
  - Add clear method to remove all stored data
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ]* 3.1 Write property test for vendor profile round-trip
  - **Property 7: Vendor profile round-trip**
  - **Validates: Requirements 3.1, 3.3, 8.3**

- [ ]* 3.2 Write property test for logo upload round-trip
  - **Property 8: Logo upload round-trip**
  - **Validates: Requirements 3.2, 8.5**

- [ ]* 3.3 Write property test for vendor profile updates persist
  - **Property 9: Vendor profile updates persist**
  - **Validates: Requirements 3.4**

- [ ] 4. Implement invoice numbering service
  - Create NumberingService class in src/lib/numbering/service.ts
  - Implement generateNext method
  - Implement parseInvoiceNumber to extract year and sequence
  - Implement formatInvoiceNumber to create INV-YYYY-### format
  - Add logic for year rollover (reset to 001 on new year)
  - Add logic for sequence increment within same year
  - Integrate with StorageService for persistence
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ]* 4.1 Write property test for invoice number format
  - **Property 18: PDF includes invoice number**
  - **Validates: Requirements 6.2, 10.1**

- [ ]* 4.2 Write property test for invoice number sequence increment
  - **Property 27: Invoice number sequence increment**
  - **Validates: Requirements 10.3**

- [ ]* 4.3 Write property test for invoice number year rollover
  - **Property 28: Invoice number year rollover**
  - **Validates: Requirements 10.2**

- [ ]* 4.4 Write property test for invoice number uniqueness
  - **Property 30: Invoice number uniqueness**
  - **Validates: Requirements 10.5**

- [ ]* 4.5 Write property test for invoice number persistence
  - **Property 29: Invoice number persistence**
  - **Validates: Requirements 10.4**

- [ ] 5. Build extraction engine with regex patterns
  - Create ExtractionEngine class in src/lib/extraction/engine.ts
  - Implement extractWithRegex method
  - Implement regex patterns for amount extraction (₹, Rs, INR, $, USD, €, EUR)
  - Implement regex patterns for currency detection
  - Implement regex patterns for date extraction (multiple formats)
  - Implement regex patterns for UPI ID extraction (identifier@provider)
  - Implement regex patterns for bank account and IFSC code extraction
  - Implement regex patterns for GST number extraction
  - Implement regex patterns for email and phone extraction
  - Create helper function to merge extracted fields into InvoiceData structure
  - _Requirements: 1.4, 1.5, 2.1, 2.2, 2.3_

- [ ]* 5.1 Write property test for extraction returns structured data
  - **Property 1: Extraction returns structured data**
  - **Validates: Requirements 2.1**

- [ ]* 5.2 Write property test for currency and amount extraction
  - **Property 2: Currency and amount extraction**
  - **Validates: Requirements 1.4**

- [ ]* 5.3 Write property test for date parsing normalization
  - **Property 3: Date parsing normalization**
  - **Validates: Requirements 1.5**

- [ ]* 5.4 Write property test for UPI ID extraction
  - **Property 4: UPI ID extraction**
  - **Validates: Requirements 2.2**

- [ ]* 5.5 Write property test for bank details extraction
  - **Property 5: Bank details extraction**
  - **Validates: Requirements 2.3**

- [ ] 6. Add AI-enhanced extraction with Gemini Flash
  - Install and configure @google/generative-ai SDK
  - Create extractWithAI method using Gemini Flash model
  - Design structured prompt requesting JSON response with invoice fields
  - Implement 8-second timeout for AI requests
  - Implement mergeResults method to combine regex and AI extraction
  - Add fallback logic to use regex results if AI fails
  - _Requirements: 2.4, 7.4, 11.2_

- [ ]* 6.1 Write property test for AI fallback on incomplete extraction
  - **Property 6: AI fallback on incomplete extraction**
  - **Validates: Requirements 2.4**

- [ ]* 6.2 Write property test for regex extraction fallback
  - **Property 24: Regex extraction fallback**
  - **Validates: Requirements 7.4**

- [ ]* 6.3 Write property test for AI timeout fallback
  - **Property 31: AI timeout fallback**
  - **Validates: Requirements 11.2**

- [ ] 7. Create validation utilities
  - Create validation utilities in src/lib/validation/validators.ts
  - Create validateGSTNumber function with regex pattern validation
  - Create validateInvoiceData function to check required fields
  - Create validateVendorProfile function
  - Create validateFileUpload function for image type and size checks
  - Return structured error responses with field-specific messages
  - _Requirements: 3.5, 4.5, 14.3_

- [ ]* 7.1 Write property test for GST number validation
  - **Property 10: GST number validation**
  - **Validates: Requirements 3.5**

- [ ]* 7.2 Write property test for form validation enables generation
  - **Property 13: Form validation enables generation**
  - **Validates: Requirements 4.5**

- [ ]* 7.3 Write property test for invalid input error
  - **Property 35: Invalid input error**
  - **Validates: Requirements 14.3**

- [ ] 8. Implement PDF generator with react-pdf
  - Create PDFGenerator class in src/lib/pdf/generator.ts
  - Create InvoiceDocument component in src/lib/pdf/InvoiceDocument.tsx
  - Design PDF layout with header section (logo, vendor details, invoice number, date)
  - Design client information section
  - Design line items table with columns (description, quantity, rate, amount)
  - Design totals section (subtotal, tax, total)
  - Design footer with payment instructions (UPI/bank details)
  - Apply professional styling with proper fonts, spacing, and borders
  - Handle conditional rendering (logo, tax, payment info)
  - Return PDF as Blob
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ]* 8.1 Write property test for PDF generation completeness
  - **Property 17: PDF generation completeness**
  - **Validates: Requirements 6.1, 6.4, 9.1**

- [ ]* 8.2 Write property test for PDF includes invoice date
  - **Property 19: PDF includes invoice date**
  - **Validates: Requirements 6.3**

- [ ]* 8.3 Write property test for PDF line items table structure
  - **Property 20: PDF line items table structure**
  - **Validates: Requirements 9.2**

- [ ]* 8.4 Write property test for PDF tax display
  - **Property 21: PDF tax display**
  - **Validates: Requirements 9.3**

- [ ]* 8.5 Write property test for PDF payment instructions
  - **Property 22: PDF payment instructions**
  - **Validates: Requirements 9.4**

- [ ]* 8.6 Write property test for PDF logo inclusion
  - **Property 23: PDF logo inclusion**
  - **Validates: Requirements 9.5**

- [ ] 9. Create API route for text extraction
  - Create POST route handler in src/app/api/extract/route.ts
  - Validate request body contains text field
  - Call ExtractionEngine.extractWithRegex
  - Optionally call ExtractionEngine.extractWithAI if useAI flag is true
  - Merge results and return ExtractResponse with success, data, extractionMethod
  - Handle errors and return appropriate error codes (EXTRACTION_INCOMPLETE, AI_SERVICE_UNAVAILABLE)
  - _Requirements: 1.2, 8.1, 14.2, 14.5_

- [ ]* 9.1 Write property test for extract API response structure
  - **Property 25: Extract API response structure**
  - **Validates: Requirements 8.1**

- [ ]* 9.2 Write property test for extraction incomplete error
  - **Property 34: Extraction incomplete error**
  - **Validates: Requirements 14.2**

- [ ]* 9.3 Write property test for AI service unavailable error with fallback
  - **Property 37: AI service unavailable error with fallback**
  - **Validates: Requirements 14.5**

- [ ] 10. Create API route for PDF generation
  - Create POST route handler in src/app/api/generate/route.ts
  - Validate request body contains invoiceData and vendorProfile
  - Generate invoice number if not provided using NumberingService
  - Call PDFGenerator.generateInvoice
  - Return PDF blob with appropriate headers (Content-Type: application/pdf)
  - Handle errors and return PDF_GENERATION_FAILED error code
  - _Requirements: 6.1, 8.2, 14.4_

- [ ]* 10.1 Write property test for generate API returns PDF
  - **Property 26: Generate API returns PDF**
  - **Validates: Requirements 8.2**

- [ ]* 10.2 Write property test for PDF generation failure error
  - **Property 36: PDF generation failure error**
  - **Validates: Requirements 14.4**

- [ ] 11. Create API route for vendor profile management
  - Create POST route handler in src/app/api/vendor/route.ts
  - Validate vendor profile data
  - Call StorageService.saveVendorProfile
  - Return success response
  - Handle storage errors (STORAGE_QUOTA_EXCEEDED)
  - _Requirements: 3.1, 8.3_

- [ ] 12. Create API route for invoice numbering
  - Create POST route handler in src/app/api/numbering/next/route.ts
  - Call NumberingService.generateNext
  - Return invoice number in response
  - Handle errors gracefully
  - _Requirements: 8.4, 10.1, 10.2, 10.3_

- [ ] 13. Create API route for logo upload
  - Create POST route handler in src/app/api/upload/logo/route.ts
  - Validate file type (image/jpeg, image/png, image/svg+xml)
  - Validate file size (< 500KB)
  - Convert file to base64 data URL
  - Call StorageService.saveLogo
  - Return logo URL in response
  - Handle errors (INVALID_FILE_TYPE, FILE_TOO_LARGE)
  - _Requirements: 3.2, 8.5_

- [ ] 14. Build text input component
  - Create TextInput component in src/components/TextInput.tsx
  - Add large textarea for payment text
  - Add character count display
  - Add extract button with loading state
  - Add clear button
  - Implement onChange handler for text updates
  - Implement onExtract handler for extraction trigger
  - Style with Tailwind CSS for clean, minimal design
  - _Requirements: 1.1_

- [ ] 15. Build vendor profile component
  - Create VendorProfile component in src/components/VendorProfile.tsx
  - Create as collapsible panel using ShadCN Collapsible
  - Add form fields for name, company, email, phone, address, GST number
  - Add payment details fields (UPI ID, bank account, IFSC, account holder name)
  - Add logo upload with file input and preview
  - Implement onChange handler to update vendor profile
  - Implement onLogoUpload handler
  - Load existing profile from localStorage on mount
  - Auto-save changes to localStorage
  - Style with Tailwind CSS and ShadCN UI components
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 16. Build invoice form component with line item management
  - Create InvoiceForm component in src/components/InvoiceForm.tsx
  - Add fields for client name, company, email, phone, address
  - Add fields for invoice number, invoice date, due date
  - Add line items section with add/remove buttons
  - Implement line item fields (description, quantity, rate, amount)
  - Add tax rate field with percentage input
  - Display calculated subtotal, tax amount, and total
  - Implement real-time total calculation on field changes
  - Add validation feedback for required fields
  - Add preview button
  - Integrate vendor profile data
  - Style with Tailwind CSS and ShadCN UI components
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ]* 16.1 Write property test for line item total calculation
  - **Property 11: Line item total calculation**
  - **Validates: Requirements 4.3**

- [ ]* 16.2 Write property test for tax calculation accuracy
  - **Property 12: Tax calculation accuracy**
  - **Validates: Requirements 4.4**

- [ ] 17. Build invoice preview component
  - Create InvoicePreview component in src/components/InvoicePreview.tsx
  - Use react-pdf PDFViewer for preview rendering
  - Render preview with all invoice sections (header, client, items, totals, footer)
  - Add responsive scaling for mobile devices
  - Add download button to trigger PDF generation
  - Add edit button to return to form
  - Implement auto-update when invoice data changes
  - Style preview to match final PDF appearance
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ]* 17.1 Write property test for preview contains all invoice data
  - **Property 14: Preview contains all invoice data**
  - **Validates: Requirements 5.2**

- [ ]* 17.2 Write property test for preview updates with edits
  - **Property 15: Preview updates with edits**
  - **Validates: Requirements 5.3**

- [ ]* 17.3 Write property test for logo appears in preview
  - **Property 16: Logo appears in preview**
  - **Validates: Requirements 5.4**

- [ ] 18. Build main invoice generator page with workflow orchestration
  - Create main page component in src/app/page.tsx with state management
  - Implement three-step workflow: input → edit → preview
  - Add TextInput component for step 1 (input)
  - Add InvoiceForm component for step 2 (edit)
  - Add InvoicePreview component for step 3 (preview)
  - Add VendorProfile component (accessible from all steps)
  - Implement API calls to /api/extract
  - Implement API calls to /api/generate
  - Handle loading states during extraction and generation
  - Display error messages with toast notifications
  - Add navigation between steps
  - Style with Tailwind CSS for clean, minimal layout
  - Ensure mobile-responsive design
  - _Requirements: 1.1, 1.2, 1.3, 4.1, 5.1, 6.5, 11.5_

- [ ]* 18.1 Write property test for error handling stability
  - **Property 32: Error handling stability**
  - **Validates: Requirements 11.5**

- [ ]* 18.2 Write property test for error response structure
  - **Property 33: Error response structure**
  - **Validates: Requirements 14.1**

- [ ] 19. Add error handling and user feedback
  - Create ErrorDisplay component in src/components/ErrorDisplay.tsx
  - Create Toast component in src/components/Toast.tsx for notifications
  - Implement toast notifications for transient errors
  - Add inline validation errors in forms
  - Display extraction warnings when fields are incomplete
  - Show AI service status (available/unavailable)
  - Add user notification when data is sent to external service (Gemini)
  - Implement graceful degradation messages
  - Style error messages with appropriate colors and icons
  - _Requirements: 11.5, 13.5, 14.1, 14.2, 14.3, 14.4, 14.5_

- [ ] 20. Implement mobile responsiveness and touch optimization
  - Add responsive breakpoints for mobile, tablet, desktop
  - Optimize form fields for touch input (larger tap targets)
  - Ensure textarea is easily accessible on mobile keyboards
  - Make preview scrollable and zoomable on mobile
  - Test paste functionality on mobile browsers
  - Optimize PDF download/share for mobile platforms
  - Add mobile-specific styling adjustments
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ] 21. Add environment configuration and setup documentation
  - Configure next.config.js for react-pdf webpack settings and src/ directory
  - Update .env.example with clear instructions for GEMINI_API_KEY
  - Create comprehensive README.md with setup instructions
  - Document how to obtain Gemini API key from Google AI Studio
  - Add instructions for local development (npm install, npm run dev)
  - Document the four-stage workflow (paste → extract → edit → preview → download)
  - Add git workflow instructions (branching, commits, pushing)
  - Add troubleshooting section for common issues
  - Document project structure and folder organization
  - _Requirements: All requirements depend on proper configuration_

- [ ] 22. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
