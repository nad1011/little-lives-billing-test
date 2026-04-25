# Billing and Payment Processing

TypeScript implementation of an invoice, payment, and receipt workflow.

## What is included

- Invoice total calculation with line items, GST, and final totals.
- Payment processing for cash and bank transfer payments.
- Partial payment, full payment, and overpayment status handling.
- Receipt generation with invoice item allocation and remaining balance tracking.
- Jest tests for the required scenarios and edge cases.

## Folder structure

```text
src/
  index.ts        Public exports used by tests and examples
  models.ts       Domain interfaces, enums, and result types
  invoice.ts      Invoice calculation use case
  payment.ts      Payment processing use case
  receipt.ts      Receipt generation use case
  validation.ts   Shared input validation rules
  money.ts        Money rounding helper
  references.ts   Local ID and reference number helpers
test/
  billing.test.ts End-to-end unit coverage for the billing workflow
examples/
  payment-flow.ts Runnable example of the invoice/payment/receipt flow
```

## Commands

```bash
npm install
npm test
npm run build
npm run example
```

## Example

The runnable example in `examples/payment-flow.ts` creates an invoice, applies two payments, generates receipts, and prints the resulting balances.

```bash
npm run example
```

## Design decisions

- The code is organized around billing domain use cases instead of keeping all logic in one file.
- `src/index.ts` is the public API boundary, so callers do not need to know the internal folder layout.
- `InvoiceItemInput` is used for raw caller input before calculation, while `InvoiceItem` represents the calculated item with `lineTotal`, `taxRate`, and `taxAmount`.
- Money values are rounded to two decimal places after calculations.
- GST is passed into `calculateInvoiceTotal` so the rate is explicit in tests and callers.
- Overpayments are allowed because the requirement includes a negative outstanding balance example.
- The implementation is in-memory only. There is no database or payment gateway integration.
- IDs and references are generated locally for the exercise; production code would normally use stronger identifiers and persistence.

## Real-life production considerations

- Store monetary values as integer cents or use a decimal library to avoid floating-point edge cases.
- Persist invoices, payments, and receipts in a database with transaction boundaries.
- Make payment processing idempotent by requiring a caller-provided payment reference.
- Add audit fields such as `createdAt`, `updatedAt`, `createdBy`, and status transition history.
- Separate payment authorization/capture from invoice reconciliation when integrating a real payment gateway.
- Add currency, locale, tax jurisdiction, and refund/void handling.

## Known limitations

- This project does not handle currency conversion.
- Receipt allocation applies payment amounts to invoice items in order.
- There is no concurrency control because invoices are plain TypeScript objects in this test.
