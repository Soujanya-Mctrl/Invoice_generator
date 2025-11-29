# Invoice Generator

A local web application that converts unstructured payment-related text (from emails, chat messages, SMS, or notes) into professional PDF invoices. The system extracts relevant invoice fields using pattern matching and optional AI enhancement, allows you to edit the extracted data, and generates downloadable PDF invoices.

## ✨ Features

- **Smart Text Extraction**: Paste payment text and automatically extract invoice details
- **AI-Enhanced Parsing**: Optional Gemini AI integration for improved accuracy
- **Offline-First**: Works entirely in your browser with local storage
- **Professional PDFs**: Generate clean, formatted invoice PDFs
- **Vendor Profiles**: Save and reuse your business information
- **Auto-Numbering**: Automatic invoice number generation (INV-YYYY-###)
- **Mobile Responsive**: Works seamlessly on desktop, tablet, and mobile devices
- **Privacy-Focused**: All data stays local; no external databases

## 🚀 Quick Start

### Prerequisites

- Node.js 18.x or higher
- npm, yarn, pnpm, or bun package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd invoice-generator
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy the example environment file
   cp .env.example .env.local
   
   # Edit .env.local and add your Gemini API key (optional)
   # GEMINI_API_KEY=your_actual_api_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔑 Getting a Gemini API Key (Optional)

The Gemini API enhances extraction accuracy but is **not required**. The app works with regex-based extraction alone.

### Steps to obtain an API key:

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Create API Key"** or **"Get API Key"**
4. Copy the generated key
5. Paste it into your `.env.local` file:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   ```

**Note**: The Gemini API has a free tier with generous limits. Keep your API key secure and never commit `.env.local` to version control.

## 📖 How to Use

The Invoice Generator follows a simple four-stage workflow:

### 1. **Paste** - Input Payment Text

Paste any unstructured payment-related text into the input field. This could be from:
- Email messages
- Chat conversations (WhatsApp, Slack, etc.)
- SMS messages
- Notes or documents

**Example text:**
```
Hi, please send invoice for web development work.
Client: Acme Corp
Amount: ₹50,000
Payment via UPI: acme@paytm
Due by: 15/12/2024
```

### 2. **Extract** - Automatic Data Extraction

Click the **"Extract"** button. The system will:
- Parse the text using regex patterns
- Optionally enhance with AI (if Gemini API key is configured)
- Extract: client name, amount, currency, dates, payment details, etc.

### 3. **Edit** - Review and Modify

Review the extracted data in an editable form:
- Correct any extraction errors
- Add missing information
- Add line items with descriptions, quantities, and rates
- Set tax rates
- Configure vendor profile (your business details)
- Upload your logo

### 4. **Preview & Download** - Generate PDF

- Click **"Preview"** to see the formatted invoice
- Review all details
- Click **"Download"** to generate and save the PDF

The invoice will be automatically numbered (e.g., INV-2024-001) and ready to send to your client.

## 🏗️ Project Structure

```
invoice-generator/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   │   ├── extract/       # Text extraction endpoint
│   │   │   ├── generate/      # PDF generation endpoint
│   │   │   ├── numbering/     # Invoice numbering endpoint
│   │   │   ├── upload/        # Logo upload endpoint
│   │   │   └── vendor/        # Vendor profile endpoint
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Main invoice generator page
│   │   └── globals.css        # Global styles
│   │
│   ├── components/            # React components
│   │   ├── ui/               # ShadCN UI components
│   │   ├── ErrorDisplay.tsx  # Error message display
│   │   ├── InvoiceForm.tsx   # Invoice editing form
│   │   ├── InvoicePreview.tsx # PDF preview component
│   │   ├── TextInput.tsx     # Payment text input
│   │   ├── Toast.tsx         # Toast notifications
│   │   └── VendorProfile.tsx # Vendor profile management
│   │
│   ├── lib/                   # Core business logic
│   │   ├── extraction/       # Text extraction engine
│   │   ├── numbering/        # Invoice numbering service
│   │   ├── pdf/              # PDF generation
│   │   ├── storage/          # LocalStorage service
│   │   ├── validation/       # Input validation
│   │   └── utils.ts          # Utility functions
│   │
│   └── types/                 # TypeScript type definitions
│       ├── api.ts            # API request/response types
│       ├── error.ts          # Error types
│       ├── invoice.ts        # Invoice data types
│       ├── vendor.ts         # Vendor profile types
│       └── index.ts          # Type exports
│
├── .kiro/                     # Kiro specs (design docs)
├── public/                    # Static assets
├── .env.example              # Environment variable template
├── .env.local                # Your local environment (not in git)
├── next.config.ts            # Next.js configuration
├── tailwind.config.ts        # Tailwind CSS configuration
├── jest.config.js            # Jest testing configuration
└── package.json              # Project dependencies
```

## 🧪 Testing

The project includes comprehensive test coverage:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test Types

- **Unit Tests**: Test individual functions and components
- **Property-Based Tests**: Test properties across random inputs using fast-check
- **Integration Tests**: Test API routes and workflows

## 🔧 Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Run tests
npm test
```

### Git Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   ```bash
   # Edit files
   git add .
   git commit -m "feat: add your feature description"
   ```

3. **Push to remote**
   ```bash
   git push origin feature/your-feature-name
   ```

4. **Create a pull request**
   - Go to your repository on GitHub/GitLab
   - Click "New Pull Request"
   - Select your feature branch
   - Add description and submit

### Commit Message Convention

Follow conventional commits:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

## 🐛 Troubleshooting

### Common Issues

#### 1. **PDF Generation Fails**

**Problem**: Error when generating PDF or blank PDF output

**Solutions**:
- Clear browser cache and reload
- Check browser console for errors
- Ensure all required invoice fields are filled
- Try a different browser (Chrome, Firefox, Safari, Edge)

#### 2. **Extraction Not Working**

**Problem**: Text extraction returns empty or incomplete data

**Solutions**:
- Ensure the payment text contains recognizable patterns (amounts, names, etc.)
- Try adding more context to the text
- If using AI extraction, verify your Gemini API key is correct in `.env.local`
- Check that the API key has not exceeded its quota

#### 3. **LocalStorage Quota Exceeded**

**Problem**: Error saving vendor profile or logo

**Solutions**:
- Clear browser data for localhost:3000
- Reduce logo file size (compress image, use smaller dimensions)
- Remove old data from browser DevTools → Application → Local Storage

#### 4. **Module Not Found Errors**

**Problem**: Import errors or missing dependencies

**Solutions**:
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Or clear npm cache
npm cache clean --force
npm install
```

#### 5. **Port 3000 Already in Use**

**Problem**: Cannot start dev server because port is occupied

**Solutions**:
```bash
# Kill process on port 3000 (macOS/Linux)
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm run dev
```

#### 6. **Webpack/Build Errors**

**Problem**: Build fails with webpack errors

**Solutions**:
- Delete `.next` folder: `rm -rf .next`
- Rebuild: `npm run build`
- Check `next.config.ts` for configuration issues

#### 7. **API Key Not Working**

**Problem**: Gemini API returns errors

**Solutions**:
- Verify the API key is correctly copied (no extra spaces)
- Check API key is enabled at [Google AI Studio](https://aistudio.google.com/app/apikey)
- Verify you haven't exceeded the free tier quota
- Restart the dev server after adding the API key

#### 8. **Tests Failing**

**Problem**: Jest tests fail to run

**Solutions**:
```bash
# Clear Jest cache
npm test -- --clearCache

# Run tests with verbose output
npm test -- --verbose
```

### Getting Help

If you encounter issues not covered here:

1. Check the browser console for error messages
2. Review the [Next.js documentation](https://nextjs.org/docs)
3. Check [react-pdf documentation](https://react-pdf.org/)
4. Open an issue in the repository with:
   - Error message
   - Steps to reproduce
   - Browser and OS information
   - Screenshots if applicable

## 🔒 Privacy & Security

- **Local-First**: All invoice data is stored in your browser's local storage
- **No Database**: No external database or cloud storage
- **Optional AI**: Gemini API is optional; extraction works offline with regex
- **Secure Storage**: Sensitive data never leaves your device (except optional AI requests)
- **No Tracking**: No analytics or tracking scripts

### Data Storage

- Vendor profiles: Stored in browser localStorage
- Invoice numbers: Stored in browser localStorage
- Logos: Stored as base64 in browser localStorage
- Generated PDFs: Downloaded to your device, not stored

### Clearing Data

To clear all stored data:
1. Open browser DevTools (F12)
2. Go to Application → Local Storage
3. Select `http://localhost:3000`
4. Click "Clear All"

Or clear browser data for the site through browser settings.

## 🛠️ Technology Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: ShadCN UI (Radix UI primitives)
- **PDF Generation**: @react-pdf/renderer
- **AI Integration**: Google Generative AI (Gemini Flash)
- **Testing**: Jest, React Testing Library, fast-check
- **Storage**: Browser localStorage API

## 📝 License

This project is private and proprietary.

## 🤝 Contributing

This is a private project. If you have access and want to contribute:

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Submit a pull request

## 📧 Support

For questions or support, please contact the project maintainer.

---

**Built with ❤️ using Next.js and React**
