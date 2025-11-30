/**
 * Invoice PDF Document Component
 * React-PDF component for rendering professional invoice PDFs
 */

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from '@react-pdf/renderer';
import type { InvoiceData, VendorProfile } from '@/types';

interface InvoiceDocumentProps {
  data: InvoiceData;
  vendor: VendorProfile;
}

// Define styles for the PDF document
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 10,
    objectFit: 'contain',
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#1e293b',
  },
  vendorDetails: {
    fontSize: 9,
    color: '#64748b',
    lineHeight: 1.4,
  },
  invoiceTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  invoiceNumber: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clientInfo: {
    fontSize: 10,
    color: '#334155',
    lineHeight: 1.5,
  },
  table: {
    marginTop: 10,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    padding: 8,
    fontWeight: 'bold',
    fontSize: 9,
    color: '#1e293b',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#cbd5e1',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    fontSize: 9,
    color: '#334155',
  },
  tableColDescription: {
    flex: 3,
  },
  tableColQuantity: {
    flex: 1,
    textAlign: 'right',
  },
  tableColRate: {
    flex: 1.5,
    textAlign: 'right',
  },
  tableColAmount: {
    flex: 1.5,
    textAlign: 'right',
  },
  totalsSection: {
    marginTop: 10,
    alignItems: 'flex-end',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 200,
    paddingVertical: 4,
    fontSize: 10,
  },
  totalLabel: {
    color: '#64748b',
  },
  totalValue: {
    color: '#334155',
    fontWeight: 'bold',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 200,
    paddingVertical: 8,
    marginTop: 4,
    borderTopWidth: 2,
    borderTopColor: '#2563eb',
    fontSize: 12,
  },
  grandTotalLabel: {
    fontWeight: 'bold',
    color: '#1e293b',
  },
  grandTotalValue: {
    fontWeight: 'bold',
    color: '#2563eb',
  },
  footer: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  paymentTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  paymentDetails: {
    fontSize: 9,
    color: '#334155',
    lineHeight: 1.5,
  },
  notes: {
    marginTop: 20,
    fontSize: 9,
    color: '#64748b',
    fontStyle: 'italic',
  },
});

/**
 * Format currency amount using the user-specified code/symbol.
 *
 * We don't try to be clever here – whatever the user typed into the
 * `currency` field (e.g. "INR", "USD", "€", "₹") is what we render,
 * so the PDF is always consistent with the UI.
 */
const formatCurrency = (amount: number, currency: string): string => {
  const code = (currency || '').trim();

  if (!code) {
    return amount.toFixed(2);
  }

  // If it's an alphabetic ISO code (e.g. "INR", "USD") use a space
  // between the code and the number. For symbols (₹, €, $) no space.
  const needsSpace = /^[A-Za-z]{2,4}$/.test(code);
  const separator = needsSpace ? ' ' : '';

  return `${code}${separator}${amount.toFixed(2)}`;
};

/**
 * Format date to readable format
 */
const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
};

/**
 * Invoice Document Component
 */
export const InvoiceDocument: React.FC<InvoiceDocumentProps> = ({
  data,
  vendor,
}) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {vendor.logoUrl && (
              <Image src={vendor.logoUrl} style={styles.logo} />
            )}
            <Text style={styles.companyName}>
              {vendor.companyName || vendor.name}
            </Text>
            <Text style={styles.vendorDetails}>{vendor.address}</Text>
            <Text style={styles.vendorDetails}>{vendor.email}</Text>
            <Text style={styles.vendorDetails}>{vendor.phone}</Text>
            {vendor.gstNumber && (
              <Text style={styles.vendorDetails}>GST: {vendor.gstNumber}</Text>
            )}
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>
              Invoice #: {data.invoiceNumber}
            </Text>
            <Text style={styles.invoiceNumber}>
              Date: {formatDate(data.invoiceDate)}
            </Text>
            {data.dueDate && (
              <Text style={styles.invoiceNumber}>
                Due Date: {formatDate(data.dueDate)}
              </Text>
            )}
          </View>
        </View>

        {/* Client Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill To</Text>
          <Text style={styles.clientInfo}>{data.clientName}</Text>
          {data.clientCompany && (
            <Text style={styles.clientInfo}>{data.clientCompany}</Text>
          )}
          {data.clientAddress && (
            <Text style={styles.clientInfo}>{data.clientAddress}</Text>
          )}
          {data.clientEmail && (
            <Text style={styles.clientInfo}>{data.clientEmail}</Text>
          )}
          {data.clientPhone && (
            <Text style={styles.clientInfo}>{data.clientPhone}</Text>
          )}
        </View>

        {/* Line Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableColDescription}>Description</Text>
            <Text style={styles.tableColQuantity}>Qty</Text>
            <Text style={styles.tableColRate}>Rate</Text>
            <Text style={styles.tableColAmount}>Amount</Text>
          </View>
          {data.items.map((item) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={styles.tableColDescription}>{item.description}</Text>
              <Text style={styles.tableColQuantity}>{item.quantity}</Text>
              <Text style={styles.tableColRate}>
                {formatCurrency(item.rate, data.currency)}
              </Text>
              <Text style={styles.tableColAmount}>
                {formatCurrency(item.amount, data.currency)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals Section */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(data.subtotal, data.currency)}
            </Text>
          </View>
          {data.taxRate !== undefined && data.taxRate > 0 && (
            <>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Tax ({data.taxRate}%):</Text>
                <Text style={styles.totalValue}>
                  {formatCurrency(data.taxAmount || 0, data.currency)}
                </Text>
              </View>
            </>
          )}
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Total:</Text>
            <Text style={styles.grandTotalValue}>
              {formatCurrency(data.total, data.currency)}
            </Text>
          </View>
        </View>

        {/* Payment Instructions Footer */}
        {(data.paymentInfo || vendor.upiId || vendor.bankName) && (
          <View style={styles.footer}>
            <Text style={styles.paymentTitle}>Payment Instructions</Text>
            {(data.paymentInfo?.upiId || vendor.upiId) && (
              <Text style={styles.paymentDetails}>
                UPI ID: {data.paymentInfo?.upiId || vendor.upiId}
              </Text>
            )}
            {(data.paymentInfo?.bankName || vendor.bankName) && (
              <>
                <Text style={styles.paymentDetails}>
                  Bank: {data.paymentInfo?.bankName || vendor.bankName}
                </Text>
                <Text style={styles.paymentDetails}>
                  Account Number:{' '}
                  {data.paymentInfo?.accountNumber || vendor.accountNumber}
                </Text>
                <Text style={styles.paymentDetails}>
                  IFSC Code: {data.paymentInfo?.ifscCode || vendor.ifscCode}
                </Text>
                <Text style={styles.paymentDetails}>
                  Account Holder:{' '}
                  {data.paymentInfo?.accountHolderName ||
                    vendor.accountHolderName}
                </Text>
              </>
            )}
          </View>
        )}

        {/* Notes */}
        {data.notes && (
          <View style={styles.notes}>
            <Text>Notes: {data.notes}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
};
