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

type WorkflowStep = 'profile-setup' | 'input' | 'edit' | 'preview';

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
  const [step, setStep] = useState<WorkflowStep>('profile-setup');
  const [paymentText, setPaymentText] = useState('');
  const [showProfileModal, setShowProfileModal] = useState(false);
  
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
      setStep('input'); // Skip profile setup if profile exists
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

  // Handle profile setup completion
  const handleProfileSetupComplete = () => {
    if (!vendorProfile) {
      showToast('error', 'Please complete your vendor profile');
      return;
    }
    setStep('input');
    showToast('success', 'Vendor profile saved successfully');
  };

  // Handle edit profile
  const handleEditProfile = () => {
    setShowProfileModal(true);
  };

  // Handle close profile modal
  const handleCloseProfileModal = () => {
    setShowProfileModal(false);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto responsive-padding py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                  Invoice Generator
                </h1>
                <p className="text-xs sm:text-sm text-gray-600">
                  Professional invoices in seconds
                </p>
              </div>
            </div>
            
            {/* Profile Icon - Only show after profile setup */}
            {step !== 'profile-setup' && vendorProfile && (
              <button
                onClick={handleEditProfile}
                className="touch-target flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-lg transition-colors"
                title="Edit Vendor Profile"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {vendorProfile.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-gray-900">{vendorProfile.name}</p>
                  <p className="text-xs text-gray-600">{vendorProfile.companyName || 'Edit Profile'}</p>
                </div>
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            )}
          </div>
          
          {/* Step indicator - Only show after profile setup */}
          {step !== 'profile-setup' && (
            <div className="mt-4 flex items-center justify-center gap-2 text-xs sm:text-sm">
              <div className={`px-3 py-1.5 rounded-full transition-all ${
                step === 'input' 
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                <span className="hidden sm:inline">1. </span>Input
              </div>
              <div className="w-6 sm:w-8 h-px bg-gray-300" />
              <div className={`px-3 py-1.5 rounded-full transition-all ${
                step === 'edit' 
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                <span className="hidden sm:inline">2. </span>Edit
              </div>
              <div className="w-6 sm:w-8 h-px bg-gray-300" />
              <div className={`px-3 py-1.5 rounded-full transition-all ${
                step === 'preview' 
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                <span className="hidden sm:inline">3. </span>Preview
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto responsive-padding py-4 sm:py-6 lg:py-8">
        {/* Step Content */}
        <div className="space-y-6">
          {/* Profile Setup Step */}
          {step === 'profile-setup' && (
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  Welcome! Let's Set Up Your Profile
                </h2>
                <p className="text-gray-600">
                  This information will appear on all your invoices
                </p>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sm:p-8">
                <VendorProfile
                  profile={vendorProfile}
                  onChange={handleVendorProfileChange}
                  onLogoUpload={handleLogoUpload}
                  isSetupMode={true}
                />
                
                <div className="mt-8 flex justify-center">
                  <button
                    onClick={handleProfileSetupComplete}
                    disabled={!vendorProfile}
                    className="touch-target px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 active:from-blue-800 active:to-purple-800 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                  >
                    Continue to Invoice Generator
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* AI Service Status Banner */}
          {step !== 'profile-setup' && aiServiceStatus === 'unavailable' && (
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

          {step === 'input' && (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sm:p-8">
              <div className="mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                  Paste Payment Details
                </h2>
                <p className="text-gray-600 text-sm sm:text-base">
                  Copy and paste payment information from emails, messages, or notes
                </p>
              </div>
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

      {/* Profile Edit Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                Edit Vendor Profile
              </h2>
              <button
                onClick={handleCloseProfileModal}
                className="touch-target p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <VendorProfile
                profile={vendorProfile}
                onChange={handleVendorProfileChange}
                onLogoUpload={handleLogoUpload}
                isSetupMode={false}
              />
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={handleCloseProfileModal}
                  className="touch-target px-6 py-2.5 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 active:bg-gray-400 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleCloseProfileModal();
                    showToast('success', 'Profile updated successfully');
                  }}
                  className="touch-target px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 active:from-blue-800 active:to-purple-800 transition-all shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
