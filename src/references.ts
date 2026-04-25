import { PaymentMethod } from './models';

export function createId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function createReferenceNumber(paymentMethod: PaymentMethod, date: Date): string {
  const methodPrefix = paymentMethod === PaymentMethod.BankTransfer ? 'BANK' : 'CASH';
  const timestamp = createTimestamp(date);

  return `${methodPrefix}-${timestamp}`;
}

export function createReceiptNumber(date: Date): string {
  return `RCPT-${createTimestamp(date)}`;
}

function createTimestamp(date: Date): string {
  return date.toISOString().replace(/\D/g, '').slice(0, 14);
}
