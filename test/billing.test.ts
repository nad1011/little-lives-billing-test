import { calculateInvoiceTotal } from '../src';

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
``
