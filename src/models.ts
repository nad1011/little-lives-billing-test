export enum InvoiceStatus {
  Draft = 'draft',
  Pending = 'pending',
  PartiallyPaid = 'partially_paid',
  Paid = 'paid',
  Overpaid = 'overpaid'
}

export enum PaymentMethod {
  Cash = 'cash',
  BankTransfer = 'bank_transfer'
}

export enum PaymentStatus {
  Pending = 'pending',
  Completed = 'completed',
  Failed = 'failed'
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  taxRate: number;
  taxAmount: number;
}

export type InvoiceItemInput = Omit<InvoiceItem, 'id' | 'lineTotal' | 'taxRate' | 'taxAmount'> &
  Partial<Pick<InvoiceItem, 'id'>>;

export interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: Date;
  items: InvoiceItem[];
  totalAmount: number;
  totalTax: number;
  outstandingAmount: number;
  status: InvoiceStatus;
}

export interface Payment {
  id: string;
  invoiceId: string;
  paymentMethod: PaymentMethod;
  amount: number;
  paymentDate: Date;
  referenceNumber: string;
  status: PaymentStatus;
}

export interface ReceiptItem {
  invoiceItemId: string;
  description: string;
  allocatedAmount: number;
}

export interface Receipt {
  id: string;
  paymentId: string;
  receiptNumber: string;
  receiptDate: Date;
  totalPaid: number;
  remainingBalance: number;
  items: ReceiptItem[];
}

export interface InvoiceTotals {
  subtotal: number;
  tax: number;
  total: number;
  items: InvoiceItem[];
}

export interface PaymentResult {
  invoice: Invoice;
  payment: Payment;
}
