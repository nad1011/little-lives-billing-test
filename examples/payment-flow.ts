import {
  Invoice,
  InvoiceStatus,
  PaymentMethod,
  calculateInvoiceTotal,
  generateReceipt,
  processPayment
} from '../src';

const taxRate = 0.07;
const totals = calculateInvoiceTotal(
  [
    { id: 'monthly-fee', description: 'Monthly Fee', quantity: 1, unitPrice: 500 },
    { id: 'activity-fee', description: 'Activity Fee', quantity: 2, unitPrice: 25.5 }
  ],
  taxRate
);

let invoice: Invoice = {
  id: 'invoice-1',
  invoiceNumber: 'INV-001',
  invoiceDate: new Date('2026-04-25T00:00:00.000Z'),
  items: totals.items,
  totalAmount: totals.total,
  totalTax: totals.tax,
  outstandingAmount: totals.total,
  status: InvoiceStatus.Pending
};

const firstPayment = processPayment(invoice, 300, PaymentMethod.Cash);
invoice = firstPayment.invoice;

const firstReceipt = generateReceipt(firstPayment.payment, invoice);

const secondPayment = processPayment(invoice, 300, PaymentMethod.BankTransfer);
invoice = secondPayment.invoice;

const secondReceipt = generateReceipt(secondPayment.payment, invoice);

console.log('Invoice totals');
console.table({
  subtotal: totals.subtotal,
  tax: totals.tax,
  total: totals.total
});

console.log('Payment flow');
console.table([
  {
    method: firstPayment.payment.paymentMethod,
    paid: firstReceipt.totalPaid,
    remaining: firstReceipt.remainingBalance,
    status: firstPayment.invoice.status
  },
  {
    method: secondPayment.payment.paymentMethod,
    paid: secondReceipt.totalPaid,
    remaining: secondReceipt.remainingBalance,
    status: secondPayment.invoice.status
  }
]);

console.log('Latest receipt allocation');
console.table(secondReceipt.items);
