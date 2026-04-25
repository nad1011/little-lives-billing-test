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

export function calculateInvoiceTotal(
  items: Array<Omit<InvoiceItem, 'id' | 'lineTotal' | 'taxRate' | 'taxAmount'> & Partial<Pick<InvoiceItem, 'id'>>>,
  taxRate: number
): InvoiceTotals {
  validateTaxRate(taxRate);

  const calculatedItems = items.map((item, index) => {
    validateInvoiceItem(item);

    const lineTotal = roundMoney(item.quantity * item.unitPrice);
    const taxAmount = roundMoney(lineTotal * taxRate);

    return {
      id: item.id ?? `item-${index + 1}`,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal,
      taxRate,
      taxAmount
    };
  });

  const subtotal = roundMoney(calculatedItems.reduce((sum, item) => sum + item.lineTotal, 0));
  const tax = roundMoney(calculatedItems.reduce((sum, item) => sum + item.taxAmount, 0));

  return {
    subtotal,
    tax,
    total: roundMoney(subtotal + tax),
    items: calculatedItems
  };
}

export function processPayment(
  invoice: Invoice,
  paymentAmount: number,
  paymentMethod: PaymentMethod
): PaymentResult {
  validateInvoice(invoice);
  assertPositiveFiniteNumber(paymentAmount, 'Payment amount');
  validatePaymentMethod(paymentMethod);

  const outstandingAmount = roundMoney(invoice.outstandingAmount - paymentAmount);
  const status = getInvoiceStatus(outstandingAmount, invoice.totalAmount);
  const timestamp = new Date();

  const payment: Payment = {
    id: createId('pay'),
    invoiceId: invoice.id,
    paymentMethod,
    amount: roundMoney(paymentAmount),
    paymentDate: timestamp,
    referenceNumber: createReferenceNumber(paymentMethod, timestamp),
    status: PaymentStatus.Completed
  };

  return {
    invoice: {
      ...invoice,
      outstandingAmount,
      status
    },
    payment
  };
}

function validateInvoiceItem(item: { description: string; quantity: number; unitPrice: number }): void {
  if (!item.description.trim()) {
    throw new Error('Invoice item description is required.');
  }

  assertNonNegativeFiniteNumber(item.quantity, 'Invoice item quantity');
  assertNonNegativeFiniteNumber(item.unitPrice, 'Invoice item unit price');
}

function validateTaxRate(taxRate: number): void {
  assertNonNegativeFiniteNumber(taxRate, 'Tax rate');
}

function validateInvoice(invoice: Invoice): void {
  if (!invoice.id.trim()) {
    throw new Error('Invoice id is required.');
  }

  assertNonNegativeFiniteNumber(invoice.totalAmount, 'Invoice total amount');

  if (!Number.isFinite(invoice.outstandingAmount)) {
    throw new Error('Invoice outstanding amount must be a finite number.');
  }
}

function validatePaymentMethod(paymentMethod: PaymentMethod): void {
  if (!Object.values(PaymentMethod).includes(paymentMethod)) {
    throw new Error(`Unsupported payment method: ${paymentMethod}.`);
  }
}

function assertNonNegativeFiniteNumber(value: number, fieldName: string): void {
  if (!Number.isFinite(value)) {
    throw new Error(`${fieldName} must be a finite number.`);
  }

  if (value < 0) {
    throw new Error(`${fieldName} cannot be negative.`);
  }
}

function assertPositiveFiniteNumber(value: number, fieldName: string): void {
  if (!Number.isFinite(value)) {
    throw new Error(`${fieldName} must be a finite number.`);
  }

  if (value <= 0) {
    throw new Error(`${fieldName} must be greater than zero.`);
  }
}

function getInvoiceStatus(outstandingAmount: number, totalAmount: number): InvoiceStatus {
  if (outstandingAmount < 0) {
    return InvoiceStatus.Overpaid;
  }

  if (outstandingAmount === 0) {
    return InvoiceStatus.Paid;
  }

  if (outstandingAmount < totalAmount) {
    return InvoiceStatus.PartiallyPaid;
  }

  return InvoiceStatus.Pending;
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function createId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function createReferenceNumber(paymentMethod: PaymentMethod, date: Date): string {
  const methodPrefix = paymentMethod === PaymentMethod.BankTransfer ? 'BANK' : 'CASH';
  const timestamp = date.toISOString().replace(/\D/g, '').slice(0, 14);

  return `${methodPrefix}-${timestamp}`;
}
