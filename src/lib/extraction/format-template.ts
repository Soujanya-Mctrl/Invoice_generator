/**
 * Invoice Text Format Template
 * A simple format that users can follow for easy extraction
 */

export const INVOICE_FORMAT_TEMPLATE = `Client: John Doe
Company: Acme Corp
Email: john@example.com
Phone: 9876543210

Items:
- Logo design: ₹5,000
- Website development: ₹15,000
- SEO optimization: ₹3,000

Due Date: 15th March 2025

Payment:
UPI: merchant@paytm
Bank: HDFC Bank
Account: 1234567890
IFSC: HDFC0001234`;

export const INVOICE_FORMAT_EXAMPLE = `Client: Ankit Sharma
Company: Tech Solutions
Email: ankit@example.com
Phone: 9876543210
Address: Mumbai, India

Items:
- Logo redesign: ₹3,200
- Website banner: ₹4,500

Due Date: 12th March 2025`;

export const INVOICE_FORMAT_GUIDE = {
  title: "Simple Format Guide",
  description: "Use this format for best results:",
  sections: [
    {
      label: "Client Info",
      format: "Client: [Name]\nCompany: [Company Name] (optional)\nEmail: [email] (optional)\nPhone: [phone] (optional)"
    },
    {
      label: "Line Items",
      format: "Items:\n- [Description]: ₹[Amount]\n- [Description]: ₹[Amount]"
    },
    {
      label: "Due Date",
      format: "Due Date: [Date]"
    },
    {
      label: "Payment Info",
      format: "UPI: [upi@id] (optional)\nBank: [Bank Name] (optional)\nAccount: [Number] (optional)\nIFSC: [Code] (optional)"
    }
  ]
};

/**
 * Extract invoice data from structured format
 */
export function extractFromStructuredFormat(text: string): {
  clientName?: string;
  clientCompany?: string;
  clientEmail?: string;
  clientPhone?: string;
  items?: Array<{ description: string; amount: number }>;
  dueDate?: string;
  upiId?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
} {
  const result: any = {};

  // Extract client name
  const clientMatch = text.match(/Client:\s*(.+)/i);
  if (clientMatch) result.clientName = clientMatch[1].trim();

  // Extract company
  const companyMatch = text.match(/Company:\s*(.+)/i);
  if (companyMatch) result.clientCompany = companyMatch[1].trim();

  // Extract email
  const emailMatch = text.match(/Email:\s*(.+)/i);
  if (emailMatch) result.clientEmail = emailMatch[1].trim();

  // Extract phone
  const phoneMatch = text.match(/Phone:\s*(.+)/i);
  if (phoneMatch) result.clientPhone = phoneMatch[1].trim();

  // Extract items
  const itemsSection = text.match(/Items:([\s\S]*?)(?=\n\n|Due Date:|Payment:|$)/i);
  if (itemsSection) {
    const items: Array<{ description: string; amount: number }> = [];
    const itemLines = itemsSection[1].match(/[-•]\s*(.+?):\s*[₹Rs$€]?\s*(\d+(?:,\d+)*(?:\.\d{2})?)/gi);
    
    if (itemLines) {
      itemLines.forEach(line => {
        const match = line.match(/[-•]\s*(.+?):\s*[₹Rs$€]?\s*(\d+(?:,\d+)*(?:\.\d{2})?)/i);
        if (match) {
          const description = match[1].trim();
          const amount = parseFloat(match[2].replace(/,/g, ''));
          items.push({ description, amount });
        }
      });
    }
    
    if (items.length > 0) result.items = items;
  }

  // Extract due date
  const dueDateMatch = text.match(/Due Date:\s*(.+)/i);
  if (dueDateMatch) result.dueDate = dueDateMatch[1].trim();

  // Extract UPI
  const upiMatch = text.match(/UPI:\s*(.+)/i);
  if (upiMatch) result.upiId = upiMatch[1].trim();

  // Extract bank name
  const bankMatch = text.match(/Bank:\s*(.+)/i);
  if (bankMatch) result.bankName = bankMatch[1].trim();

  // Extract account number
  const accountMatch = text.match(/Account:\s*(.+)/i);
  if (accountMatch) result.accountNumber = accountMatch[1].trim();

  // Extract IFSC
  const ifscMatch = text.match(/IFSC:\s*(.+)/i);
  if (ifscMatch) result.ifscCode = ifscMatch[1].trim();

  return result;
}
