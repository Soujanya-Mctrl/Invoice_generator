'use client';

import { useState, useEffect } from 'react';
import { InvoiceData, LineItem, VendorProfile } from '@/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Eye } from 'lucide-react';

interface InvoiceFormProps {
  data: InvoiceData;
  onChange: (data: InvoiceData) => void;
  onPreview: () => void;
  vendorProfile: VendorProfile | null;
}

/**
 * InvoiceForm Component
 * 
 * Editable form for invoice data including:
 * - Client information (name, company, email, phone, address)
 * - Invoice metadata (number, date, due date)
 * - Line items with add/remove functionality
 * - Tax calculation
 * - Real-time total updates
 * 
 * Features:
 * - Dynamic line item management
 * - Automatic total calculation
 * - Tax calculation based on percentage
 * - Validation feedback for required fields
 * - Integration with vendor profile data
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */
export default function InvoiceForm({
  data,
  onChange,
  onPreview,
}: InvoiceFormProps) {
  const [localData, setLocalData] = useState<InvoiceData>(data);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Update local data when prop changes
  useEffect(() => {
    setLocalData(data);
  }, [data]);

  // Calculate totals whenever line items or tax rate changes
  useEffect(() => {
    calculateTotals();
  }, [localData.items, localData.taxRate]);

  // Calculate subtotal, tax amount, and total
  const calculateTotals = () => {
    const subtotal = localData.items.reduce((sum, item) => sum + item.amount, 0);
    const taxRate = localData.taxRate || 0;
    const taxAmount = (subtotal * taxRate) / 100;
    const total = subtotal + taxAmount;

    const updatedData = {
      ...localData,
      subtotal: parseFloat(subtotal.toFixed(2)),
      taxAmount: parseFloat(taxAmount.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
    };

    setLocalData(updatedData);
    onChange(updatedData);
  };

  // Handle field changes
  const handleFieldChange = (field: keyof InvoiceData, value: any) => {
    const updatedData = {
      ...localData,
      [field]: value,
    };

    setLocalData(updatedData);
    onChange(updatedData);

    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Handle line item field changes
  const handleLineItemChange = (
    index: number,
    field: keyof LineItem,
    value: string | number
  ) => {
    const updatedItems = [...localData.items];
    const item = { ...updatedItems[index] };

    if (field === 'description') {
      item.description = value as string;
    } else if (field === 'quantity') {
      item.quantity = parseFloat(value as string) || 0;
      item.amount = parseFloat((item.quantity * item.rate).toFixed(2));
    } else if (field === 'rate') {
      item.rate = parseFloat(value as string) || 0;
      item.amount = parseFloat((item.quantity * item.rate).toFixed(2));
    }

    updatedItems[index] = item;

    const updatedData = {
      ...localData,
      items: updatedItems,
    };

    setLocalData(updatedData);
    onChange(updatedData);
  };

  // Add new line item
  const handleAddLineItem = () => {
    const newItem: LineItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      description: '',
      quantity: 1,
      rate: 0,
      amount: 0,
    };

    const updatedData = {
      ...localData,
      items: [...localData.items, newItem],
    };

    setLocalData(updatedData);
    onChange(updatedData);
  };

  // Remove line item
  const handleRemoveLineItem = (index: number) => {
    const updatedItems = localData.items.filter((_, i) => i !== index);

    const updatedData = {
      ...localData,
      items: updatedItems,
    };

    setLocalData(updatedData);
    onChange(updatedData);
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!localData.clientName.trim()) {
      errors.clientName = 'Client name is required';
    }

    if (localData.items.length === 0) {
      errors.items = 'At least one line item is required';
    } else {
      const hasInvalidItem = localData.items.some(
        (item) => !item.description.trim() || item.quantity <= 0 || item.rate <= 0
      );
      if (hasInvalidItem) {
        errors.items = 'All line items must have description, quantity > 0, and rate > 0';
      }
    }

    if (!localData.invoiceNumber.trim()) {
      errors.invoiceNumber = 'Invoice number is required';
    }

    if (!localData.invoiceDate) {
      errors.invoiceDate = 'Invoice date is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle preview button click
  const handlePreviewClick = () => {
    if (validateForm()) {
      onPreview();
    }
  };

  // Check if form is valid for enabling preview button
  const isFormValid = () => {
    return (
      localData.clientName.trim() !== '' &&
      localData.items.length > 0 &&
      localData.items.every(
        (item) => item.description.trim() !== '' && item.quantity > 0 && item.rate > 0
      ) &&
      localData.invoiceNumber.trim() !== '' &&
      localData.invoiceDate !== ''
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 bg-card rounded-lg shadow-sm border border-border">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Invoice Details</h2>

      {/* Invoice Metadata */}
      <div className="mb-6 sm:mb-8">
        <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Invoice Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          <div className="space-y-2">
            <Label htmlFor="invoice-number">
              Invoice Number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="invoice-number"
              type="text"
              value={localData.invoiceNumber}
              onChange={(e) => handleFieldChange('invoiceNumber', e.target.value)}
              placeholder="INV-2024-001"
              aria-invalid={!!validationErrors.invoiceNumber}
            />
            {validationErrors.invoiceNumber && (
              <p className="text-sm text-red-500">{validationErrors.invoiceNumber}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="invoice-date">
              Invoice Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="invoice-date"
              type="date"
              value={localData.invoiceDate}
              onChange={(e) => handleFieldChange('invoiceDate', e.target.value)}
              aria-invalid={!!validationErrors.invoiceDate}
            />
            {validationErrors.invoiceDate && (
              <p className="text-sm text-red-500">{validationErrors.invoiceDate}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="due-date">Due Date</Label>
            <Input
              id="due-date"
              type="date"
              value={localData.dueDate || ''}
              onChange={(e) => handleFieldChange('dueDate', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Client Information */}
      <div className="mb-6 sm:mb-8">
        <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Client Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <div className="space-y-2">
            <Label htmlFor="client-name">
              Client Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="client-name"
              type="text"
              value={localData.clientName}
              onChange={(e) => handleFieldChange('clientName', e.target.value)}
              placeholder="Client name"
              aria-invalid={!!validationErrors.clientName}
            />
            {validationErrors.clientName && (
              <p className="text-sm text-red-500">{validationErrors.clientName}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-company">Company Name</Label>
            <Input
              id="client-company"
              type="text"
              value={localData.clientCompany || ''}
              onChange={(e) => handleFieldChange('clientCompany', e.target.value)}
              placeholder="Company name (optional)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-email">Email</Label>
            <Input
              id="client-email"
              type="email"
              value={localData.clientEmail || ''}
              onChange={(e) => handleFieldChange('clientEmail', e.target.value)}
              placeholder="client@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-phone">Phone</Label>
            <Input
              id="client-phone"
              type="tel"
              value={localData.clientPhone || ''}
              onChange={(e) => handleFieldChange('clientPhone', e.target.value)}
              placeholder="+91 1234567890"
            />
          </div>
        </div>

        <div className="mt-3 sm:mt-4 space-y-2">
          <Label htmlFor="client-address">Address</Label>
          <textarea
            id="client-address"
            value={localData.clientAddress || ''}
            onChange={(e) => handleFieldChange('clientAddress', e.target.value)}
            placeholder="Client address"
            className="mobile-input w-full px-3 py-2 text-sm sm:text-base border border-input rounded-md bg-background text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] min-h-[80px] resize-y touch-manipulation"
          />
        </div>
      </div>

      {/* Line Items */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-4 gap-2">
          <h3 className="text-base sm:text-lg font-semibold">
            Line Items <span className="text-red-500">*</span>
          </h3>
          <Button
            type="button"
            onClick={handleAddLineItem}
            size="sm"
            variant="outline"
            className="touch-target w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Item
          </Button>
        </div>

        {validationErrors.items && (
          <p className="text-sm text-red-500 mb-4">{validationErrors.items}</p>
        )}

        <div className="space-y-3 sm:space-y-4">
          {localData.items.map((item, index) => (
            <div
              key={item.id}
              className="grid grid-cols-12 gap-2 sm:gap-3 items-start p-3 sm:p-4 border border-border rounded-lg bg-secondary/60 dark:bg-secondary"
            >
              <div className="col-span-12 md:col-span-5 space-y-2">
                <Label htmlFor={`item-description-${index}`}>Description</Label>
                <Input
                  id={`item-description-${index}`}
                  type="text"
                  value={item.description}
                  onChange={(e) =>
                    handleLineItemChange(index, 'description', e.target.value)
                  }
                  placeholder="Service or product description"
                />
              </div>

              <div className="col-span-4 md:col-span-2 space-y-2">
                <Label htmlFor={`item-quantity-${index}`}>Quantity</Label>
                <Input
                  id={`item-quantity-${index}`}
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.quantity}
                  onChange={(e) =>
                    handleLineItemChange(index, 'quantity', e.target.value)
                  }
                  placeholder="1"
                />
              </div>

              <div className="col-span-4 md:col-span-2 space-y-2">
                <Label htmlFor={`item-rate-${index}`}>Rate</Label>
                <Input
                  id={`item-rate-${index}`}
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.rate}
                  onChange={(e) =>
                    handleLineItemChange(index, 'rate', e.target.value)
                  }
                  placeholder="0.00"
                />
              </div>

              <div className="col-span-3 md:col-span-2 space-y-2">
                <Label>Amount</Label>
                <div className="h-9 px-3 py-2 text-sm border border-input rounded-md bg-secondary/80 dark:bg-input/30 flex items-center">
                  {item.amount.toFixed(2)}
                </div>
              </div>

              <div className="col-span-1 md:col-span-1 space-y-2">
                <Label className="invisible hidden sm:block">Remove</Label>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => handleRemoveLineItem(index)}
                  aria-label="Remove item"
                  disabled={localData.items.length === 1}
                  className="touch-target w-full sm:w-auto"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tax and Totals */}
      <div className="mb-6 sm:mb-8">
        <div className="max-w-md ml-auto space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Subtotal:</span>
            <span className="text-sm">
              {localData.currency} {localData.subtotal.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="tax-rate" className="text-sm font-medium">
              Tax Rate (%):
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="tax-rate"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={localData.taxRate || 0}
                onChange={(e) =>
                  handleFieldChange('taxRate', parseFloat(e.target.value) || 0)
                }
                placeholder="0"
                className="w-24"
              />
            </div>
          </div>

          {localData.taxRate && localData.taxRate > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Tax Amount:</span>
              <span className="text-sm">
                {localData.currency} {localData.taxAmount?.toFixed(2) || '0.00'}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <span className="text-lg font-bold">Total:</span>
            <span className="text-lg font-bold">
              {localData.currency} {localData.total.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Currency and Notes */}
      <div className="mb-6 sm:mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Input
              id="currency"
              type="text"
              value={localData.currency}
              onChange={(e) => handleFieldChange('currency', e.target.value.toUpperCase())}
              placeholder="INR"
              maxLength={3}
            />
            <p className="text-sm text-gray-500">ISO 4217 code (e.g., INR, USD, EUR)</p>
          </div>
        </div>

        <div className="mt-3 sm:mt-4 space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <textarea
            id="notes"
            value={localData.notes || ''}
            onChange={(e) => handleFieldChange('notes', e.target.value)}
            placeholder="Additional notes or terms (optional)"
            className="mobile-input w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px] resize-y touch-manipulation"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-gray-200">
        <Button
          type="button"
          onClick={handlePreviewClick}
          disabled={!isFormValid()}
          size="lg"
          className="touch-target w-full sm:w-auto"
        >
          <Eye className="h-4 w-4 mr-2" />
          Preview Invoice
        </Button>
      </div>

      {/* Validation Summary */}
      {Object.keys(validationErrors).length > 0 && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600 font-medium">
            Please fix the following errors before previewing:
          </p>
          <ul className="mt-2 text-sm text-red-600 list-disc list-inside">
            {Object.values(validationErrors).map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
