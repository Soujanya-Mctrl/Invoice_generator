'use client';

import { useState, useEffect } from 'react';
import TextInput from '@/components/TextInput';
import InvoiceForm from '@/components/InvoiceForm';
import InvoicePreview from '@/components/InvoicePreview';
import VendorProfile from '@/components/VendorProfile';
import Toast, { ToastType } from '@/components/Toast';
import ErrorDisplay from '@/components/ErrorDisplay';
import { InvoiceData, VendorProfile as VendorProfileType, ExtractResponse } from '@/types';
import { ErrorResponse } from '@/types/error';
import { storageService } from '@/lib/storage/service';
import { numberingService } from '@/lib/numbering/service';

type WorkflowStep = 'input' | 'edit' | 'preview';

interface ToastMessage {
  type: ToastType;
  message: string;
}

/**
 * Main Invoice Generator Page
 * 
 * Orchestrates the three-step workflow:
 * 1. Input: Paste payment text
 * 2. Edit: Review and modify extracted invoice data
 * 3. Preview: View and download PDF invoice
 * 
 * Features:
 * - State management for workflow steps
 * - API calls to /api/extract and /api/generate
 * - Loading states during extraction and generation
 * - Error handling with toast notifications
 * - Vendor profile management (accessible from all steps)
 * - Mobile-responsive design
 * 
 * Requirements: 1.1, 1.2, 1.3, 4.1, 5.1, 6.5, 11.5
 */
export default function Home() {
  // Workflow state
  const [step, setStep] = useState<WorkflowStep>('input');
  const [paymentText, setPaymentText] = useState('');
  
  // Data state
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [vendorProfile, setVendorProfile] = useState<VendorProfileType | null>(null);
  
  // Loading states
  const [isExtracting, setIsExtracting] = useState(false);
  
  // Error and notification state
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [error, setError] = useState<ErrorResponse | null>(null);
  const [extractionWarning, setExtractionWarning] = useState<ErrorResponse | null>(null);
  const [aiServiceStatus, setAiServiceStatus] = useState<'available' | 'unavailable' | 'unknown'>('unknown');

  // Load vendor profile on mount
  useEffect(() => {
    const savedProfile = storageService.getVendorProfile();
    if (savedProfile) {
      setVendorProfile(savedProfile);
    }
  }, []);

  // Show toast notification
  const showToast = (type: ToastType, message: string) => {
    setToast({ type, message });
  };

  // Handle text extraction
  const handleExtract = async () => {
    if (!paymentText.trim()) {
      showToast('error', 'Please enter payment text to extract');
      return;
    }

    setIsExtracting(true);
    setError(null);
    setExtractionWarning(null);

    try {
      // Notify user that data is being sent to external service (Gemini)
      showToast('info', 'Sending data to AI service for enhanced extraction...');

      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: paymentText,
          useAI: true, // Enable AI extraction
        }),
      });

      const result: ExtractResponse = await response.json();

      // Check AI service status
      if (result.error?.errorCode === 'AI_SERVICE_UNAVAILABLE') {
        setAiServiceStatus('unavailable');
        showToast('warning', 'AI service unavailable. Using regex-based extraction.');
      } else if (result.extractionMethod === 'ai' || result.extractionMethod === 'hybrid') {
        setAiServiceStatus('available');
      }

      // Check if extraction returned data
      if (!result.data) {
        // No data extracted at all - critical error, don't proceed
        const extractionError = result.error || {
          errorCode: 'EXTRACTION_INCOMPLETE' as const,
          message: 'Failed to extract invoice data from the provided text',
        };
        setError(extractionError);
        showToast('error', extractionError.message);
        return; // Stay on input step
      }

      // Generate invoice number
      const invoiceNumber = numberingService.generateNext();
      const today = new Date().toISOString().split('T')[0];

      // Create complete invoice data with extracted fields
      const newInvoiceData: InvoiceData = {
        invoiceNumber,
        invoiceDate: today,
        dueDate: result.data.dueDate || '',
        clientName: result.data.clientName || '',
        clientCompany: result.data.clientCompany || '',
        clientEmail: result.data.clientEmail || '',
        clientPhone: result.data.clientPhone || '',
        clientAddress: result.data.clientAddress || '',
        items: result.data.items && result.data.items.length > 0 
          ? result.data.items 
          : [{
              id: `item-${Date.now()}`,
              description: '',
              quantity: 1,
              rate: 0,
              amount: 0,
            }],
        currency: result.data.currency || 'INR',
        subtotal: result.data.subtotal || 0,
        taxRate: result.data.taxRate || 0,
        taxAmount: result.data.taxAmount || 0,
        total: result.data.total || 0,
        paymentInfo: result.data.paymentInfo || undefined,
        notes: result.data.notes || '',
      };

      setInvoiceData(newInvoiceData);
      
      // Clear any previous errors before proceeding
      setError(null);
      
      // Proceed to edit step
      setStep('edit');
      
      // Show extraction warnings if fields are incomplete
      if (!result.success && result.error?.errorCode === 'EXTRACTION_INCOMPLETE') {
        setExtractionWarning(result.error);
        showToast('warning', 'Some fields could not be extracted. Please review and complete the form.');
      } else {
        // Show success message with extraction method
        const methodText = result.extractionMethod === 'ai' 
          ? 'AI-enhanced extraction' 
          : result.extractionMethod === 'hybrid'
          ? 'Hybrid extraction (AI + Regex)'
          : 'Regex extraction';
        showToast('success', `Invoice data extracted successfully using ${methodText}`);
      }
    } catch (error) {
      console.error('Extraction error:', error);
      const networkError: ErrorResponse = {
        errorCode: 'NETWORK_ERROR',
        message: 'Network error. Please check your connection and try again.',
      };
      setError(networkError);
      showToast('error', networkError.message);
    } finally {
      setIsExtracting(false);
    }
  };

  // Handle invoice data changes
  const handleInvoiceChange = (data: InvoiceData) => {
    setInvoiceData(data);
  };

  // Handle preview navigation
  const handlePreview = () => {
    if (!invoiceData) {
      const error: ErrorResponse = {
        errorCode: 'INVALID_INPUT',
        message: 'No invoice data available',
      };
      setError(error);
      showToast('error', error.message);
      return;
    }

    if (!vendorProfile) {
      const error: ErrorResponse = {
        errorCode: 'INVALID_INPUT',
        message: 'Please complete your vendor profile before previewing',
      };
      setError(error);
      showToast('error', error.message);
      return;
    }

    setError(null);
    setExtractionWarning(null);
    setStep('preview');
  };

  // Handle edit navigation (from preview)
  const handleEdit = () => {
    setStep('edit');
  };

  // Handle PDF generation (download)
  // Note: PDF generation is handled by InvoicePreview component's PDFDownloadLink
  // This function is kept for potential future API-based generation
  const handleGenerate = async () => {
    if (!invoiceData || !vendorProfile) {
      const error: ErrorResponse = {
        errorCode: 'INVALID_INPUT',
        message: 'Missing invoice data or vendor profile',
      };
      setError(error);
      showToast('error', error.message);
      return;
    }

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoiceData,
          vendorProfile,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Invoice_${invoiceData.invoiceNumber.replace(/[^a-zA-Z0-9-]/g, '_')}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        showToast('success', 'Invoice PDF generated successfully');
      } else {
        const errorData = await response.json();
        if (errorData.error) {
          setError(errorData.error);
        }
        showToast('error', errorData.error?.message || 'Failed to generate PDF');
      }
    } catch (error) {
      console.error('Generation error:', error);
      const networkError: ErrorResponse = {
        errorCode: 'NETWORK_ERROR',
        message: 'Network error. Please check your connection and try again.',
      };
      setError(networkError);
      showToast('error', networkError.message);
    }
  };

  // Handle vendor profile changes
  const handleVendorProfileChange = (profile: VendorProfileType) => {
    setVendorProfile(profile);
  };

  // Handle logo upload
  const handleLogoUpload = async (file: File) => {
    // Logo is handled by VendorProfile component
    // This is just a placeholder for the API call if needed
    console.log('Logo uploaded:', file.name);
  };

  // Handle starting over
  const handleStartOver = () => {
    setPaymentText('');
    setInvoiceData(null);
    setError(null);
    setExtractionWarning(null);
    setStep('input');
    showToast('info', 'Starting new invoice');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto responsive-padding py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="w-full sm:w-auto">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                Invoice Generator
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                Convert payment text to professional PDF invoices
              </p>
            </div>
            
            {/* Step indicator - horizontal on desktop, compact on mobile */}
            <div className="flex sm:hidden items-center gap-2 text-xs w-full justify-center">
              <div className={`px-2 py-1 rounded-full flex-1 text-center ${
                step === 'input' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                Input
              </div>
              <div className="w-4 h-px bg-gray-300" />
              <div className={`px-2 py-1 rounded-full flex-1 text-center ${
                step === 'edit' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                Edit
              </div>
              <div className="w-4 h-px bg-gray-300" />
              <div className={`px-2 py-1 rounded-full flex-1 text-center ${
                step === 'preview' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                Preview
              </div>
            </div>
            
            {/* Desktop step indicator */}
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <div className={`px-3 py-1 rounded-full ${
                step === 'input' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                1. Input
              </div>
              <div className="w-8 h-px bg-gray-300" />
              <div className={`px-3 py-1 rounded-full ${
                step === 'edit' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                2. Edit
              </div>
              <div className="w-8 h-px bg-gray-300" />
              <div className={`px-3 py-1 rounded-full ${
                step === 'preview' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                3. Preview
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto responsive-padding py-4 sm:py-6 lg:py-8">
        {/* Vendor Profile - Accessible from all steps */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <VendorProfile
            profile={vendorProfile}
            onChange={handleVendorProfileChange}
            onLogoUpload={handleLogoUpload}
          />
        </div>

        {/* AI Service Status Banner */}
        {aiServiceStatus === 'unavailable' && (
          <div className="mb-6">
            <ErrorDisplay
              error={{
                errorCode: 'AI_SERVICE_UNAVAILABLE',
                message: 'AI extraction service is currently unavailable',
              }}
              inline
            />
          </div>
        )}

        {/* Global Error Display */}
        {error && step === 'input' && (
          <div className="mb-6">
            <ErrorDisplay
              error={error}
              onDismiss={() => setError(null)}
            />
          </div>
        )}

        {/* Step Content */}
        <div className="space-y-8">
          {step === 'input' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <TextInput
                value={paymentText}
                onChange={setPaymentText}
                onExtract={handleExtract}
                isLoading={isExtracting}
              />
            </div>
          )}

          {step === 'edit' && invoiceData && (
            <div>
              {/* Extraction Warning */}
              {extractionWarning && (
                <div className="mb-6">
                  <ErrorDisplay
                    error={extractionWarning}
                    onDismiss={() => setExtractionWarning(null)}
                  />
                </div>
              )}

              {/* Global Error Display */}
              {error && (
                <div className="mb-6">
                  <ErrorDisplay
                    error={error}
                    onDismiss={() => setError(null)}
                  />
                </div>
              )}

              <InvoiceForm
                data={invoiceData}
                onChange={handleInvoiceChange}
                onPreview={handlePreview}
                vendorProfile={vendorProfile}
              />
              
              {/* Navigation buttons */}
              <div className="mt-4 sm:mt-6 flex justify-between">
                <button
                  type="button"
                  onClick={handleStartOver}
                  className="touch-target px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors"
                >
                  Start Over
                </button>
              </div>
            </div>
          )}

          {step === 'preview' && invoiceData && vendorProfile && (
            <div>
              {/* Global Error Display */}
              {error && (
                <div className="mb-6">
                  <ErrorDisplay
                    error={error}
                    onDismiss={() => setError(null)}
                  />
                </div>
              )}

              <InvoicePreview
                data={invoiceData}
                vendorProfile={vendorProfile}
                onGenerate={handleGenerate}
                onEdit={handleEdit}
              />
              
              {/* Navigation buttons */}
              <div className="mt-4 sm:mt-6 flex justify-between">
                <button
                  type="button"
                  onClick={handleStartOver}
                  className="touch-target px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors"
                >
                  Create New Invoice
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Toast Notification */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
