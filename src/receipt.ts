import { Invoice, InvoiceItem, Payment, Receipt, ReceiptItem } from './models';
import { roundMoney } from './money';
import { createId, createReceiptNumber } from './references';
import { validateInvoice, validatePayment } from './validation';

export function generateReceipt(payment: Payment, invoice: Invoice): Receipt {
  validatePayment(payment);
  validateInvoice(invoice);

  if (payment.invoiceId !== invoice.id) {
    throw new Error('Payment invoice id must match the invoice.');
  }

  const receiptDate = new Date();

  return {
    id: createId('rcpt'),
    paymentId: payment.id,
    receiptNumber: createReceiptNumber(receiptDate),
    receiptDate,
    totalPaid: roundMoney(payment.amount),
    remainingBalance: roundMoney(invoice.outstandingAmount),
    items: allocatePaymentToItems(payment.amount, invoice.items)
  };
}

function allocatePaymentToItems(paymentAmount: number, items: InvoiceItem[]): ReceiptItem[] {
  let remainingPayment = roundMoney(paymentAmount);

  return items.map((item) => {
    const itemTotal = roundMoney(item.lineTotal + item.taxAmount);
    const allocatedAmount = roundMoney(Math.min(Math.max(remainingPayment, 0), itemTotal));
    remainingPayment = roundMoney(remainingPayment - allocatedAmount);

    return {
      invoiceItemId: item.id,
      description: item.description,
      allocatedAmount
    };
  });
}
