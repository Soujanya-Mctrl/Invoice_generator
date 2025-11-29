/**
 * InvoiceForm Component Unit Tests
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import InvoiceForm from '../InvoiceForm';
import { InvoiceData } from '@/types';

describe('InvoiceForm Component', () => {
  const mockOnChange = jest.fn();
  const mockOnPreview = jest.fn();

  const mockInvoiceData: InvoiceData = {
    invoiceNumber: 'INV-2024-001',
    invoiceDate: '2024-01-15',
    dueDate: '2024-02-15',
    clientName: 'Test Client',
    clientCompany: 'Test Company',
    clientEmail: 'client@test.com',
    clientPhone: '+91 1234567890',
    clientAddress: '123 Test St',
    items: [
      {
        id: 'item-1',
        description: 'Test Service',
        quantity: 1,
        rate: 1000,
        amount: 1000,
      },
    ],
    currency: 'INR',
    subtotal: 1000,
    taxRate: 18,
    taxAmount: 180,
    total: 1180,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render invoice form with all sections', () => {
    render(
      <InvoiceForm
        data={mockInvoiceData}
        onChange={mockOnChange}
        onPreview={mockOnPreview}
        vendorProfile={null}
      />
    );

    expect(screen.getByText('Invoice Details')).toBeInTheDocument();
    expect(screen.getByText('Invoice Information')).toBeInTheDocument();
    expect(screen.getByText('Client Information')).toBeInTheDocument();
    expect(screen.getByText('Line Items')).toBeInTheDocument();
  });

  it('should display invoice metadata fields', () => {
    render(
      <InvoiceForm
        data={mockInvoiceData}
        onChange={mockOnChange}
        onPreview={mockOnPreview}
        vendorProfile={null}
      />
    );

    expect(screen.getByLabelText(/invoice number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/invoice date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/due date/i)).toBeInTheDocument();
  });

  it('should display client information fields', () => {
    render(
      <InvoiceForm
        data={mockInvoiceData}
        onChange={mockOnChange}
        onPreview={mockOnPreview}
        vendorProfile={null}
      />
    );

    expect(screen.getByLabelText(/^client name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/company name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/address/i)).toBeInTheDocument();
  });

  it('should populate form with provided data', () => {
    render(
      <InvoiceForm
        data={mockInvoiceData}
        onChange={mockOnChange}
        onPreview={mockOnPreview}
        vendorProfile={null}
      />
    );

    const invoiceNumberInput = screen.getByLabelText(/invoice number/i) as HTMLInputElement;
    const clientNameInput = screen.getByLabelText(/^client name/i) as HTMLInputElement;

    expect(invoiceNumberInput.value).toBe('INV-2024-001');
    expect(clientNameInput.value).toBe('Test Client');
  });

  it('should call onChange when field is updated', async () => {
    render(
      <InvoiceForm
        data={mockInvoiceData}
        onChange={mockOnChange}
        onPreview={mockOnPreview}
        vendorProfile={null}
      />
    );

    const clientNameInput = screen.getByLabelText(/^client name/i);
    fireEvent.change(clientNameInput, { target: { value: 'New Client Name' } });

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalled();
    });
  });

  it('should display line items', () => {
    render(
      <InvoiceForm
        data={mockInvoiceData}
        onChange={mockOnChange}
        onPreview={mockOnPreview}
        vendorProfile={null}
      />
    );

    expect(screen.getByDisplayValue('Test Service')).toBeInTheDocument();
    expect(screen.getByDisplayValue('1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('1000')).toBeInTheDocument();
  });

  it('should add new line item when Add Item button is clicked', async () => {
    render(
      <InvoiceForm
        data={mockInvoiceData}
        onChange={mockOnChange}
        onPreview={mockOnPreview}
        vendorProfile={null}
      />
    );

    const addButton = screen.getByRole('button', { name: /add item/i });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalled();
      const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
      expect(lastCall.items.length).toBe(2);
    });
  });

  it('should remove line item when remove button is clicked', async () => {
    const dataWithMultipleItems: InvoiceData = {
      ...mockInvoiceData,
      items: [
        ...mockInvoiceData.items,
        {
          id: 'item-2',
          description: 'Second Service',
          quantity: 2,
          rate: 500,
          amount: 1000,
        },
      ],
    };

    render(
      <InvoiceForm
        data={dataWithMultipleItems}
        onChange={mockOnChange}
        onPreview={mockOnPreview}
        vendorProfile={null}
      />
    );

    const removeButtons = screen.getAllByLabelText(/remove item/i);
    fireEvent.click(removeButtons[0]);

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalled();
      const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
      expect(lastCall.items.length).toBe(1);
    });
  });

  it('should calculate line item amount when quantity or rate changes', async () => {
    render(
      <InvoiceForm
        data={mockInvoiceData}
        onChange={mockOnChange}
        onPreview={mockOnPreview}
        vendorProfile={null}
      />
    );

    const quantityInput = screen.getByLabelText(/quantity/i);
    fireEvent.change(quantityInput, { target: { value: '2' } });

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalled();
      const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
      expect(lastCall.items[0].amount).toBe(2000);
    });
  });

  it('should display calculated subtotal, tax, and total', () => {
    render(
      <InvoiceForm
        data={mockInvoiceData}
        onChange={mockOnChange}
        onPreview={mockOnPreview}
        vendorProfile={null}
      />
    );

    const subtotalElements = screen.getAllByText(/subtotal:/i);
    expect(subtotalElements.length).toBeGreaterThan(0);
    expect(screen.getByText(/INR 1000.00/)).toBeInTheDocument();
    expect(screen.getByText(/tax amount:/i)).toBeInTheDocument();
    expect(screen.getByText(/INR 180.00/)).toBeInTheDocument();
    const totalElements = screen.getAllByText(/total:/i);
    expect(totalElements.length).toBeGreaterThan(0);
    expect(screen.getByText(/INR 1180.00/)).toBeInTheDocument();
  });

  it('should update tax amount when tax rate changes', async () => {
    render(
      <InvoiceForm
        data={mockInvoiceData}
        onChange={mockOnChange}
        onPreview={mockOnPreview}
        vendorProfile={null}
      />
    );

    const taxRateInput = screen.getByLabelText(/tax rate/i);
    fireEvent.change(taxRateInput, { target: { value: '10' } });

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalled();
    });
  });

  it('should enable preview button when form is valid', () => {
    render(
      <InvoiceForm
        data={mockInvoiceData}
        onChange={mockOnChange}
        onPreview={mockOnPreview}
        vendorProfile={null}
      />
    );

    const previewButton = screen.getByRole('button', { name: /preview invoice/i });
    expect(previewButton).not.toBeDisabled();
  });

  it('should disable preview button when required fields are missing', () => {
    const incompleteData: InvoiceData = {
      ...mockInvoiceData,
      clientName: '',
    };

    render(
      <InvoiceForm
        data={incompleteData}
        onChange={mockOnChange}
        onPreview={mockOnPreview}
        vendorProfile={null}
      />
    );

    const previewButton = screen.getByRole('button', { name: /preview invoice/i });
    expect(previewButton).toBeDisabled();
  });

  it('should call onPreview when preview button is clicked with valid data', () => {
    render(
      <InvoiceForm
        data={mockInvoiceData}
        onChange={mockOnChange}
        onPreview={mockOnPreview}
        vendorProfile={null}
      />
    );

    const previewButton = screen.getByRole('button', { name: /preview invoice/i });
    fireEvent.click(previewButton);

    expect(mockOnPreview).toHaveBeenCalled();
  });

  it('should not call onPreview when form has invalid data', () => {
    const invalidData: InvoiceData = {
      ...mockInvoiceData,
      clientName: '',
    };

    render(
      <InvoiceForm
        data={invalidData}
        onChange={mockOnChange}
        onPreview={mockOnPreview}
        vendorProfile={null}
      />
    );

    const previewButton = screen.getByRole('button', { name: /preview invoice/i });
    
    // Button should be disabled when form is invalid
    expect(previewButton).toBeDisabled();
    
    // Clicking disabled button should not call onPreview
    fireEvent.click(previewButton);
    expect(mockOnPreview).not.toHaveBeenCalled();
  });

  it('should display required field indicators', () => {
    render(
      <InvoiceForm
        data={mockInvoiceData}
        onChange={mockOnChange}
        onPreview={mockOnPreview}
        vendorProfile={null}
      />
    );

    const requiredIndicators = screen.getAllByText('*');
    expect(requiredIndicators.length).toBeGreaterThan(0);
  });

  it('should disable remove button when only one line item exists', () => {
    render(
      <InvoiceForm
        data={mockInvoiceData}
        onChange={mockOnChange}
        onPreview={mockOnPreview}
        vendorProfile={null}
      />
    );

    const removeButton = screen.getByLabelText(/remove item/i);
    expect(removeButton).toBeDisabled();
  });

  it('should convert currency to uppercase', async () => {
    render(
      <InvoiceForm
        data={mockInvoiceData}
        onChange={mockOnChange}
        onPreview={mockOnPreview}
        vendorProfile={null}
      />
    );

    const currencyInput = screen.getByLabelText(/currency/i) as HTMLInputElement;
    fireEvent.change(currencyInput, { target: { value: 'usd' } });

    await waitFor(() => {
      expect(currencyInput.value).toBe('USD');
    });
  });
});
