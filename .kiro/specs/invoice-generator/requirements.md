# Requirements Document

## Introduction

The Invoice Generator System is a local web application that converts unstructured payment-related text (from emails, chat messages, SMS, or notes) into professional PDF invoices. The system extracts relevant invoice fields using pattern matching and AI, allows users to edit the extracted data, and generates downloadable PDF invoices. All processing occurs locally without requiring external databases or deployment.

## Glossary

- **Invoice Generator System**: The web application that converts payment text to PDF invoices
- **Payment Text**: Unstructured text containing payment-related information from various sources (email, chat, SMS, notes)
- **Vendor Profile**: Stored information about the invoice issuer including name, address, GST number, payment details, and logo
- **Invoice Fields**: Structured data elements required for an invoice (client name, company, service description, amount, currency, due date, payment information)
- **Extraction Engine**: The component that uses regex patterns and AI (Gemini Flash) to parse payment text
- **PDF Generator**: The component that creates formatted PDF documents from invoice data
- **Local Storage**: Browser-based storage mechanism for persisting vendor profiles without a database
- **Invoice Number**: A unique identifier for each invoice following the format INV-YYYY-### where YYYY is the year and ### is a sequential number

## Constraints

- The Invoice Generator System SHALL use Gemini API as an optional enhancement with mandatory regex-based fallback
- The Invoice Generator System SHALL operate within browser local storage limitations of approximately 5 megabytes
- The PDF Generator SHALL function without requiring internet connectivity after initial page load
- The Invoice Generator System SHALL support modern browsers (Chrome, Firefox, Safari, Edge) released within the last 2 years
- The Invoice Generator System SHALL maintain invoice numbering sequence across browser sessions using local storage

## Out of Scope

The following features are explicitly excluded from this version to maintain a focused MVP:

- **Multi-user authentication and login system** - The application is designed for single-user local operation
- **Cloud synchronization** - All data remains local; no cloud backup or sync across devices
- **Database integration** - No SQL or NoSQL database; local storage only
- **Recurring invoices** - No automated scheduling or recurring invoice generation
- **Invoice history and search** - No persistent invoice archive or search functionality
- **Multiple invoice templates** - Single professional template only
- **Email integration** - No direct email sending from the application
- **Payment tracking** - No payment status tracking or reminders
- **Multi-currency conversion** - Currency is extracted but not converted
- **Client management system** - No dedicated client database or CRM features

## Requirements

### Requirement 1

**User Story:** As a freelancer, I want to paste payment-related text into the system, so that I can quickly extract invoice information without manual data entry.

#### Acceptance Criteria

1. WHEN a user pastes text into the input field, THE Invoice Generator System SHALL accept and display the text
2. WHEN a user clicks the extract button, THE Invoice Generator System SHALL process the payment text and extract invoice fields
3. WHEN extraction completes, THE Invoice Generator System SHALL display the extracted fields in editable form fields
4. WHEN the payment text contains an amount with currency symbol, THE Invoice Generator System SHALL extract both the numeric amount and currency code
5. WHEN the payment text contains a date, THE Invoice Generator System SHALL extract and parse the date into a standard format

### Requirement 2

**User Story:** As a user, I want the system to automatically identify key invoice information from unstructured text, so that I can save time on manual data entry.

#### Acceptance Criteria

1. WHEN the Extraction Engine processes payment text, THE Invoice Generator System SHALL identify client name, company name, service description, amount, currency, due date, and payment information
2. WHEN the payment text contains UPI IDs, THE Invoice Generator System SHALL extract and format the UPI payment information
3. WHEN the payment text contains bank account details, THE Invoice Generator System SHALL extract account number, IFSC code, and bank name
4. WHEN regex patterns fail to extract complete information, THE Invoice Generator System SHALL use Gemini Flash API to improve extraction accuracy
5. WHEN extraction produces ambiguous results, THE Invoice Generator System SHALL populate fields with the most likely values

### Requirement 3

**User Story:** As a business owner, I want to store my vendor profile information, so that I can reuse it across multiple invoices without re-entering data.

#### Acceptance Criteria

1. WHEN a user enters vendor information, THE Invoice Generator System SHALL store the data in browser local storage
2. WHEN a user uploads a vendor logo, THE Invoice Generator System SHALL store the logo image in local storage
3. WHEN the system loads, THE Invoice Generator System SHALL retrieve and populate vendor information from local storage
4. WHEN a user updates vendor profile fields, THE Invoice Generator System SHALL persist the changes to local storage immediately
5. WHERE vendor information includes GST number, THE Invoice Generator System SHALL validate the GST format before storing

### Requirement 4

**User Story:** As a user, I want to edit extracted invoice fields before generating the PDF, so that I can correct any extraction errors or add missing information.

#### Acceptance Criteria

1. WHEN extraction completes, THE Invoice Generator System SHALL display all invoice fields in editable input controls
2. WHEN a user modifies any field value, THE Invoice Generator System SHALL update the field data immediately
3. WHEN a user adds line items, THE Invoice Generator System SHALL recalculate the total amount automatically
4. WHERE tax is applicable, WHEN a user enters a tax percentage, THE Invoice Generator System SHALL calculate and display the tax amount
5. WHEN all required fields contain valid data, THE Invoice Generator System SHALL enable the PDF generation button

### Requirement 5

**User Story:** As a user, I want to preview the invoice before downloading, so that I can verify the layout and content are correct.

#### Acceptance Criteria

1. WHEN a user clicks the preview button, THE Invoice Generator System SHALL render a visual representation of the invoice PDF
2. WHEN the preview displays, THE Invoice Generator System SHALL show all invoice fields in their final formatted positions
3. WHEN a user makes edits after previewing, THE Invoice Generator System SHALL update the preview automatically
4. WHEN the vendor logo exists, THE Invoice Generator System SHALL display the logo in the preview at the correct size and position
5. WHEN the preview renders, THE Invoice Generator System SHALL apply professional formatting including proper spacing and alignment

### Requirement 6

**User Story:** As a user, I want to generate and download a professional PDF invoice, so that I can send it to clients for payment.

#### Acceptance Criteria

1. WHEN a user clicks the generate button, THE Invoice Generator System SHALL create a PDF document containing all invoice data
2. WHEN the PDF generates, THE Invoice Generator System SHALL include an automatically generated invoice number
3. WHEN the PDF generates, THE Invoice Generator System SHALL include the current date as the invoice date
4. WHEN the PDF generates, THE Invoice Generator System SHALL format the document with clear sections for vendor details, client details, line items, and payment information
5. WHEN PDF generation completes, THE Invoice Generator System SHALL trigger a browser download of the PDF file

### Requirement 7

**User Story:** As a user, I want the system to work entirely locally without requiring internet connectivity or external databases, so that my financial data remains private and secure.

#### Acceptance Criteria

1. WHEN the application loads, THE Invoice Generator System SHALL function without requiring database connections
2. WHEN a user generates an invoice, THE Invoice Generator System SHALL process all data locally in the browser
3. WHEN vendor profiles are saved, THE Invoice Generator System SHALL store data only in browser local storage
4. WHERE Gemini API is used for extraction, WHEN the API is unavailable, THE Invoice Generator System SHALL fall back to regex-based extraction
5. WHEN the application runs, THE Invoice Generator System SHALL not transmit invoice data to external servers except for optional AI extraction requests

### Requirement 8

**User Story:** As a developer, I want the system to provide RESTful API endpoints, so that the frontend can interact with backend services in a standard way.

#### Acceptance Criteria

1. WHEN a POST request is sent to /api/extract with payment text, THE Invoice Generator System SHALL return extracted invoice fields as JSON
2. WHEN a POST request is sent to /api/generate with invoice data, THE Invoice Generator System SHALL return a generated PDF file
3. WHEN a POST request is sent to /api/vendor with vendor details, THE Invoice Generator System SHALL store the vendor profile and return success status
4. WHEN a POST request is sent to /api/numbering/next, THE Invoice Generator System SHALL generate and return the next sequential invoice number
5. WHEN a POST request is sent to /api/upload/logo with an image file, THE Invoice Generator System SHALL store the logo and return the storage reference

### Requirement 9

**User Story:** As a user, I want the invoice to include all standard invoice elements, so that it meets professional and legal requirements.

#### Acceptance Criteria

1. WHEN the PDF generates, THE Invoice Generator System SHALL include invoice number, invoice date, vendor details, and client details
2. WHEN the PDF generates, THE Invoice Generator System SHALL display line items with descriptions and amounts in a tabular format
3. WHERE tax is applicable, WHEN the PDF generates, THE Invoice Generator System SHALL show tax calculation and total amount including tax
4. WHEN the PDF generates, THE Invoice Generator System SHALL include payment instructions with UPI ID or bank account details
5. WHEN the PDF generates, THE Invoice Generator System SHALL display the vendor logo if one has been uploaded

### Requirement 10

**User Story:** As a user, I want invoice numbers to be generated automatically in a consistent format, so that I can maintain proper invoice sequencing and records.

#### Acceptance Criteria

1. WHEN the Invoice Generator System generates a new invoice number, THE system SHALL use the format INV-YYYY-### where YYYY is the current year and ### is a zero-padded sequential number
2. WHEN the Invoice Generator System generates the first invoice of a calendar year, THE system SHALL reset the sequential number to 001
3. WHEN the Invoice Generator System generates subsequent invoices in the same year, THE system SHALL increment the sequential number by one
4. WHEN the Invoice Generator System restarts, THE system SHALL retrieve the last used invoice number from local storage and continue the sequence
5. WHEN a user requests the next invoice number via API, THE Invoice Generator System SHALL return the next number in sequence without duplicates

## Non-Functional Requirements

### Requirement 11

**User Story:** As a user, I want the system to perform quickly and reliably, so that I can generate invoices efficiently without delays or errors.

#### Acceptance Criteria

1. WHEN the Extraction Engine processes payment text, THE Invoice Generator System SHALL complete extraction within 3 seconds for regex-based extraction
2. WHEN the Extraction Engine uses Gemini API, THE Invoice Generator System SHALL complete extraction within 10 seconds or fall back to regex
3. WHEN the PDF Generator creates an invoice, THE Invoice Generator System SHALL generate the PDF within 2 seconds
4. WHEN the user interface loads, THE Invoice Generator System SHALL display the initial page within 1 second on standard broadband connections
5. WHEN the Invoice Generator System encounters errors, THE system SHALL display clear error messages and maintain application stability

### Requirement 12

**User Story:** As a mobile user, I want to use the invoice generator on my phone or tablet, so that I can create invoices while on the go.

#### Acceptance Criteria

1. WHEN the application loads on a mobile device, THE Invoice Generator System SHALL display a responsive layout optimized for the screen size
2. WHEN a user interacts with form fields on a mobile device, THE Invoice Generator System SHALL provide touch-friendly input controls with appropriate sizing
3. WHEN a user pastes text on a mobile device, THE Invoice Generator System SHALL handle the paste operation correctly across different mobile browsers
4. WHEN the PDF preview displays on a mobile device, THE Invoice Generator System SHALL scale the preview to fit the screen width
5. WHEN a user downloads a PDF on a mobile device, THE Invoice Generator System SHALL trigger the appropriate download or share mechanism for the platform

### Requirement 13

**User Story:** As a privacy-conscious user, I want my financial data to remain secure and local, so that I can trust the system with sensitive invoice information.

#### Acceptance Criteria

1. WHEN the Invoice Generator System processes invoice data, THE system SHALL not transmit data to external servers except for optional Gemini API extraction requests
2. WHEN vendor profiles are stored, THE Invoice Generator System SHALL encrypt sensitive data in local storage using browser-native encryption capabilities
3. WHEN the user closes the browser, THE Invoice Generator System SHALL retain vendor profile data in local storage for future sessions
4. WHEN a user clears browser data, THE Invoice Generator System SHALL remove all stored vendor and invoice information
5. WHERE Gemini API is used, WHEN extraction requests are sent, THE Invoice Generator System SHALL inform the user that data is being sent to an external service

### Requirement 14

**User Story:** As a developer, I want standardized error responses from API endpoints, so that I can handle errors consistently in the frontend.

#### Acceptance Criteria

1. WHEN an API endpoint encounters an error, THE Invoice Generator System SHALL return a JSON response with errorCode and message fields
2. WHEN extraction fails to detect required fields, THE Invoice Generator System SHALL return error code EXTRACTION_INCOMPLETE with details of missing fields
3. WHEN invalid data is submitted to an endpoint, THE Invoice Generator System SHALL return error code INVALID_INPUT with field-specific validation messages
4. WHEN PDF generation fails, THE Invoice Generator System SHALL return error code PDF_GENERATION_FAILED with the failure reason
5. WHEN the Gemini API is unavailable, THE Invoice Generator System SHALL return error code AI_SERVICE_UNAVAILABLE and automatically fall back to regex extraction

## Future Enhancements

The following features may be considered for future versions after the MVP is validated:

- **Email forwarding** - Direct email sending of generated invoices to clients
- **Invoice history** - Searchable archive of previously generated invoices with filtering and export
- **Multiple templates** - Choice of different invoice designs and layouts
- **Recurring invoices** - Automated generation of recurring invoices on a schedule
- **Payment tracking** - Track invoice payment status and send reminders
- **Client management** - Dedicated client database with contact information and history
- **Cloud backup** - Optional cloud synchronization for cross-device access
- **Batch processing** - Generate multiple invoices from a list of payment texts
- **Custom branding** - Additional customization options for colors, fonts, and layouts
- **Export formats** - Support for additional formats like Excel or CSV
- **Multi-language support** - Internationalization for different languages and regions
- **Analytics dashboard** - Visual reports on invoicing activity and revenue
