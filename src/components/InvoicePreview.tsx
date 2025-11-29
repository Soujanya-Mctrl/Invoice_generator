'use client';

import { useState } from 'react';
import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer';
import { InvoiceDocument } from '@/lib/pdf/InvoiceDocument';
import { InvoiceData, VendorProfile } from '@/types';
import { Button } from '@/components/ui/button';
import { Download, Edit, Loader2 } from 'lucide-react';

interface InvoicePreviewProps {
  data: InvoiceData;
  vendorProfile: VendorProfile;
  onGenerate: () => void;
  onEdit: () => void;
}

/**
 * InvoicePreview Component
 * 
 * Visual preview of the PDF invoice with download and edit functionality.
 * 
 * Features:
 * - Real-time PDF preview using react-pdf PDFViewer
 * - Download button to save PDF
 * - Edit button to return to form
 * - Responsive scaling for mobile devices
 * - Auto-updates when invoice data changes
 * - Professional styling matching final PDF
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */
export default function InvoicePreview({
  data,
  vendorProfile,
  onGenerate: _onGenerate,
  onEdit,
}: InvoicePreviewProps) {
  const [isClient, setIsClient] = useState(false);

  // Ensure PDFViewer only renders on client side
  useState(() => {
    setIsClient(true);
  });

  // Generate filename for download
  const getFileName = () => {
    const invoiceNumber = data.invoiceNumber.replace(/[^a-zA-Z0-9-]/g, '_');
    const clientName = data.clientName.replace(/[^a-zA-Z0-9]/g, '_');
    return `Invoice_${invoiceNumber}_${clientName}.pdf`;
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-4">
        <div className="w-full sm:w-auto">
          <h2 className="text-xl sm:text-2xl font-bold">Invoice Preview</h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            Review your invoice before downloading
          </p>
        </div>

        <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2 sm:gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onEdit}
            size="default"
            className="touch-target w-full sm:w-auto"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Invoice
          </Button>

          {isClient && (
            <PDFDownloadLink
              document={<InvoiceDocument data={data} vendor={vendorProfile} />}
              fileName={getFileName()}
              className="touch-target inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 h-10 px-4 py-2 w-full sm:w-auto"
            >
              {({ loading }) =>
                loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Preparing...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </>
                )
              }
            </PDFDownloadLink>
          )}
        </div>
      </div>

      {/* Invoice Details Summary */}
      <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm">
          <div>
            <span className="font-medium text-gray-700">Invoice Number:</span>
            <p className="text-gray-900 mt-1">{data.invoiceNumber}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Client:</span>
            <p className="text-gray-900 mt-1">{data.clientName}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Date:</span>
            <p className="text-gray-900 mt-1">
              {new Date(data.invoiceDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Total:</span>
            <p className="text-gray-900 mt-1 font-semibold">
              {data.currency} {data.total.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* PDF Preview */}
      <div className="border border-gray-300 rounded-lg overflow-hidden bg-gray-100 pdf-preview-mobile">
        {isClient ? (
          <div 
            className="w-full" 
            style={{ 
              height: 'calc(100vh - 350px)', 
              minHeight: '400px',
              maxHeight: '800px'
            }}
          >
            <PDFViewer
              width="100%"
              height="100%"
              className="border-0"
              showToolbar={true}
            >
              <InvoiceDocument data={data} vendor={vendorProfile} />
            </PDFViewer>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 sm:h-96">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-sm sm:text-base text-gray-600">Loading preview...</p>
            </div>
          </div>
        )}
      </div>

      {/* Mobile-Friendly Note */}
      <div className="mt-3 sm:mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-xs sm:text-sm text-blue-800">
          <strong>Tip:</strong> On mobile devices, you can pinch to zoom and scroll through the preview.
          Use the download button to save or share the PDF.
        </p>
      </div>

      {/* Action Buttons (Bottom) */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
        <Button
          type="button"
          variant="outline"
          onClick={onEdit}
          size="lg"
          className="touch-target w-full sm:w-auto"
        >
          <Edit className="h-4 w-4 mr-2" />
          Back to Edit
        </Button>

        {isClient && (
          <PDFDownloadLink
            document={<InvoiceDocument data={data} vendor={vendorProfile} />}
            fileName={getFileName()}
            className="touch-target inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 h-11 px-8 py-2 w-full sm:w-auto"
          >
            {({ loading }) =>
              loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Preparing PDF...
                </>
              ) : (
                <>
                  <Download className="h-5 w-5 mr-2" />
                  Download Invoice
                </>
              )
            }
          </PDFDownloadLink>
        )}
      </div>
    </div>
  );
}
