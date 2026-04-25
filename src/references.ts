import { randomUUID } from 'node:crypto';
import { PaymentMethod } from './models';

export function createId(prefix: string): string {
  return `${prefix}_${randomUUID()}`;
}

export function createReferenceNumber(paymentMethod: PaymentMethod, date: Date): string {
  const methodPrefix = paymentMethod === PaymentMethod.BankTransfer ? 'BANK' : 'CASH';
  const timestamp = createTimestamp(date);

  return `${methodPrefix}-${timestamp}-${createShortToken()}`;
}

export function createReceiptNumber(date: Date): string {
  return `RCPT-${createTimestamp(date)}-${createShortToken()}`;
}

function createTimestamp(date: Date): string {
  return date.toISOString().replace(/\D/g, '').slice(0, 17);
}

function createShortToken(): string {
  return randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();
}
