import { InvoiceItemInput, InvoiceTotals } from './models';
import { roundMoney } from './money';
import { validateInvoiceItem, validateTaxRate } from './validation';

export function calculateInvoiceTotal(items: InvoiceItemInput[], taxRate: number): InvoiceTotals {
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
