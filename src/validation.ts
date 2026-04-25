import { Invoice, Payment, PaymentMethod } from './models';

export function validateInvoiceItem(item: { description: string; quantity: number; unitPrice: number }): void {
  if (!item.description.trim()) {
    throw new Error('Invoice item description is required.');
  }

  assertNonNegativeFiniteNumber(item.quantity, 'Invoice item quantity');
  assertNonNegativeFiniteNumber(item.unitPrice, 'Invoice item unit price');
}

export function validateTaxRate(taxRate: number): void {
  assertNonNegativeFiniteNumber(taxRate, 'Tax rate');
}

export function validateInvoice(invoice: Invoice): void {
  if (!invoice.id.trim()) {
    throw new Error('Invoice id is required.');
  }

  assertNonNegativeFiniteNumber(invoice.totalAmount, 'Invoice total amount');

  if (!Number.isFinite(invoice.outstandingAmount)) {
    throw new Error('Invoice outstanding amount must be a finite number.');
  }
}

export function validatePayment(payment: Payment): void {
  if (!payment.id.trim()) {
    throw new Error('Payment id is required.');
  }

  if (!payment.invoiceId.trim()) {
    throw new Error('Payment invoice id is required.');
  }

  assertPositiveFiniteNumber(payment.amount, 'Payment amount');
  validatePaymentMethod(payment.paymentMethod);
}

export function validatePaymentMethod(paymentMethod: PaymentMethod): void {
  if (!Object.values(PaymentMethod).includes(paymentMethod)) {
    throw new Error(`Unsupported payment method: ${paymentMethod}.`);
  }
}

export function assertNonNegativeFiniteNumber(value: number, fieldName: string): void {
  if (!Number.isFinite(value)) {
    throw new Error(`${fieldName} must be a finite number.`);
  }

  if (value < 0) {
    throw new Error(`${fieldName} cannot be negative.`);
  }
}

export function assertPositiveFiniteNumber(value: number, fieldName: string): void {
  if (!Number.isFinite(value)) {
    throw new Error(`${fieldName} must be a finite number.`);
  }

  if (value <= 0) {
    throw new Error(`${fieldName} must be greater than zero.`);
  }
}
