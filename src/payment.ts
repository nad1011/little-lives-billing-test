import { Invoice, InvoiceStatus, PaymentMethod, PaymentResult, PaymentStatus } from './models';
import { roundMoney } from './money';
import { createId, createReferenceNumber } from './references';
import { assertPositiveFiniteNumber, validateInvoice, validatePaymentMethod } from './validation';

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

  const payment = {
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
