import {
  Invoice,
  InvoiceStatus,
  Payment,
  PaymentMethod,
  PaymentStatus,
  calculateInvoiceTotal,
  generateReceipt,
  processPayment
} from '../src';

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
    expect(() => calculateInvoiceTotal([{ description: '   ', quantity: 1, unitPrice: 10 }], 0.07)).toThrow(
      'Invoice item description is required.'
    );
    expect(() => calculateInvoiceTotal([{ description: 'Bad item', quantity: -1, unitPrice: 10 }], 0.07)).toThrow(
      'Invoice item quantity cannot be negative.'
    );
    expect(() => calculateInvoiceTotal([{ description: 'Bad item', quantity: 1, unitPrice: -10 }], 0.07)).toThrow(
      'Invoice item unit price cannot be negative.'
    );
    expect(() => calculateInvoiceTotal([{ description: 'Bad item', quantity: 1, unitPrice: 10 }], -0.01)).toThrow(
      'Tax rate cannot be negative.'
    );
    expect(() => calculateInvoiceTotal([{ description: 'Bad item', quantity: Number.POSITIVE_INFINITY, unitPrice: 10 }], 0.07)).toThrow(
      'Invoice item quantity must be a finite number.'
    );
  });

  it('handles very large invoice amounts without losing cents', () => {
    const totals = calculateInvoiceTotal([{ description: 'Annual platform fee', quantity: 3, unitPrice: 999999.99 }], 0.07);

    expect(totals.subtotal).toBe(2999999.97);
    expect(totals.tax).toBe(210000);
    expect(totals.total).toBe(3209999.97);
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

  it('keeps invoice pending when the remaining balance is still at least the invoice total', () => {
    const result = processPayment(createInvoice({ outstandingAmount: 1200 }), 100, PaymentMethod.Cash);

    expect(result.invoice.outstandingAmount).toBe(1100);
    expect(result.invoice.status).toBe(InvoiceStatus.Pending);
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
    expect(() => processPayment(createInvoice(), Number.POSITIVE_INFINITY, PaymentMethod.Cash)).toThrow(
      'Payment amount must be a finite number.'
    );
  });

  it('rejects invalid invoice state before processing payment', () => {
    expect(() => processPayment(createInvoice({ id: '' }), 10, PaymentMethod.Cash)).toThrow(
      'Invoice id is required.'
    );
    expect(() => processPayment(createInvoice({ totalAmount: Number.POSITIVE_INFINITY }), 10, PaymentMethod.Cash)).toThrow(
      'Invoice total amount must be a finite number.'
    );
    expect(() =>
      processPayment(createInvoice({ outstandingAmount: Number.POSITIVE_INFINITY }), 10, PaymentMethod.Cash)
    ).toThrow('Invoice outstanding amount must be a finite number.');
  });
});

describe('generateReceipt', () => {
  function createPaidInvoice(): Invoice {
    const totals = calculateInvoiceTotal(
      [
        { id: 'monthly-fee', description: 'Monthly Fee', quantity: 1, unitPrice: 500 },
        { id: 'activity-fee', description: 'Activity Fee', quantity: 2, unitPrice: 25.5 }
      ],
      0.07
    );

    return {
      id: 'invoice-1',
      invoiceNumber: 'INV-001',
      invoiceDate: new Date('2026-04-25T00:00:00.000Z'),
      items: totals.items,
      totalAmount: totals.total,
      totalTax: totals.tax,
      outstandingAmount: 89.57,
      status: InvoiceStatus.PartiallyPaid
    };
  }

  function createPayment(overrides: Partial<Payment> = {}): Payment {
    return {
      id: 'payment-1',
      invoiceId: 'invoice-1',
      paymentMethod: PaymentMethod.Cash,
      amount: 500,
      paymentDate: new Date('2026-04-25T01:00:00.000Z'),
      referenceNumber: 'CASH-20260425010000',
      status: PaymentStatus.Completed,
      ...overrides
    };
  }

  it('generates a receipt with payment reference and remaining balance', () => {
    const receipt = generateReceipt(createPayment(), createPaidInvoice());

    expect(receipt.paymentId).toBe('payment-1');
    expect(receipt.receiptNumber).toMatch(/^RCPT-\d{14}$/);
    expect(receipt.totalPaid).toBe(500);
    expect(receipt.remainingBalance).toBe(89.57);
  });

  it('allocates payment to invoice items in order', () => {
    const receipt = generateReceipt(createPayment({ amount: 560 }), createPaidInvoice());

    expect(receipt.items).toEqual([
      {
        invoiceItemId: 'monthly-fee',
        description: 'Monthly Fee',
        allocatedAmount: 535
      },
      {
        invoiceItemId: 'activity-fee',
        description: 'Activity Fee',
        allocatedAmount: 25
      }
    ]);
  });

  it('rejects receipts when payment and invoice do not match', () => {
    expect(() => generateReceipt(createPayment({ invoiceId: 'invoice-2' }), createPaidInvoice())).toThrow(
      'Payment invoice id must match the invoice.'
    );
  });

  it('rejects receipts with missing payment identifiers', () => {
    expect(() => generateReceipt(createPayment({ id: '' }), createPaidInvoice())).toThrow('Payment id is required.');
    expect(() => generateReceipt(createPayment({ invoiceId: '' }), createPaidInvoice())).toThrow(
      'Payment invoice id is required.'
    );
  });
});
