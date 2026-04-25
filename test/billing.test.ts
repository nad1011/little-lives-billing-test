import { Invoice, InvoiceStatus, PaymentMethod, PaymentStatus, calculateInvoiceTotal, processPayment } from '../src';

describe('calculateInvoiceTotal', () => {
  it('calculates subtotal, tax, and total for the GST example', () => {
    const totals = calculateInvoiceTotal(
      [
        { description: 'Monthly Fee', quantity: 1, unitPrice: 500 },
        { description: 'Activity Fee', quantity: 2, unitPrice: 25.5 }
      ],
      0.07
    );

    expect(totals.subtotal).toBe(551);
    expect(totals.tax).toBe(38.57);
    expect(totals.total).toBe(589.57);
    expect(totals.items).toEqual([
      {
        id: 'item-1',
        description: 'Monthly Fee',
        quantity: 1,
        unitPrice: 500,
        lineTotal: 500,
        taxRate: 0.07,
        taxAmount: 35
      },
      {
        id: 'item-2',
        description: 'Activity Fee',
        quantity: 2,
        unitPrice: 25.5,
        lineTotal: 51,
        taxRate: 0.07,
        taxAmount: 3.57
      }
    ]);
  });

  it('allows zero amount invoices', () => {
    const totals = calculateInvoiceTotal([{ description: 'No charge', quantity: 0, unitPrice: 100 }], 0.07);

    expect(totals.subtotal).toBe(0);
    expect(totals.tax).toBe(0);
    expect(totals.total).toBe(0);
  });

  it('rejects invalid invoice amounts', () => {
    expect(() => calculateInvoiceTotal([{ description: 'Bad item', quantity: -1, unitPrice: 10 }], 0.07)).toThrow(
      'Invoice item quantity cannot be negative.'
    );
    expect(() => calculateInvoiceTotal([{ description: 'Bad item', quantity: 1, unitPrice: -10 }], 0.07)).toThrow(
      'Invoice item unit price cannot be negative.'
    );
    expect(() => calculateInvoiceTotal([{ description: 'Bad item', quantity: 1, unitPrice: 10 }], -0.01)).toThrow(
      'Tax rate cannot be negative.'
    );
  });
});

describe('processPayment', () => {
  function createInvoice(overrides: Partial<Invoice> = {}): Invoice {
    return {
      id: 'invoice-1',
      invoiceNumber: 'INV-001',
      invoiceDate: new Date('2026-04-25T00:00:00.000Z'),
      items: [],
      totalAmount: 1000,
      totalTax: 0,
      outstandingAmount: 1000,
      status: InvoiceStatus.Pending,
      ...overrides
    };
  }

  it('tracks partial payments and overpayments for the same invoice', () => {
    const firstResult = processPayment(createInvoice(), 300, PaymentMethod.Cash);

    expect(firstResult.invoice.outstandingAmount).toBe(700);
    expect(firstResult.invoice.status).toBe(InvoiceStatus.PartiallyPaid);
    expect(firstResult.payment).toMatchObject({
      invoiceId: 'invoice-1',
      paymentMethod: PaymentMethod.Cash,
      amount: 300,
      status: PaymentStatus.Completed
    });
    expect(firstResult.payment.referenceNumber).toMatch(/^CASH-\d{14}$/);

    const secondResult = processPayment(firstResult.invoice, 750, PaymentMethod.BankTransfer);

    expect(secondResult.invoice.outstandingAmount).toBe(-50);
    expect(secondResult.invoice.status).toBe(InvoiceStatus.Overpaid);
    expect(secondResult.payment.paymentMethod).toBe(PaymentMethod.BankTransfer);
    expect(secondResult.payment.referenceNumber).toMatch(/^BANK-\d{14}$/);
  });

  it('marks an invoice as paid when the outstanding balance reaches zero', () => {
    const result = processPayment(createInvoice(), 1000, PaymentMethod.BankTransfer);

    expect(result.invoice.outstandingAmount).toBe(0);
    expect(result.invoice.status).toBe(InvoiceStatus.Paid);
  });

  it('rejects invalid payment amounts and methods', () => {
    expect(() => processPayment(createInvoice(), -1, PaymentMethod.Cash)).toThrow(
      'Payment amount must be greater than zero.'
    );
    expect(() => processPayment(createInvoice(), 0, PaymentMethod.Cash)).toThrow(
      'Payment amount must be greater than zero.'
    );
    expect(() => processPayment(createInvoice(), 10, 'card' as PaymentMethod)).toThrow(
      'Unsupported payment method: card.'
    );
  });
});
``
