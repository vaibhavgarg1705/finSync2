# Invoice Reconciliation API

A Node.js and MongoDB API for importing invoices and payments, suggesting matches,
confirming allocations, and viewing outstanding balances. All monetary values are
stored as MongoDB `Decimal128` and returned as decimal strings.

## Setup

1. Install Node.js 18 or newer.
2. Copy `.env.example` to `.env` and set `MONGODB_URI` if needed.
3. Start MongoDB (`docker compose up -d mongo`).
4. Run `npm install`, `npm run db:indexes`, then `npm start`.

Transactions are disabled by default so local standalone MongoDB works. Set
`USE_TRANSACTIONS=true` when connected to a replica set or sharded cluster.

## CSV format

Invoice CSV headers: `invoiceNumber,customerId,customerName,invoiceDate,dueDate,totalAmount,currency`

Payment CSV headers: `paymentReference,customerId,customerName,amount,transactionDate,invoiceReference,description,currency`

Dates accept ISO `YYYY-MM-DD` and `DD/MM/YYYY` (also `DD-MM-YYYY`).
Amounts accept decimal numbers, commas, currency symbols, and parenthesized
negative values; imports reject negative amounts. Only INR is currently supported.

## API

The API is mounted at `/api`; `GET /health` checks process health.

* `POST /api/import/invoices` and `POST /api/import/payments`: CSV text body
  (`text/csv`) or JSON `{ "csv": "...", "batchId": "optional-id" }`.
* `POST /api/reconciliation/match`: JSON `{ "batchId": "...", "paymentIds": [], "invoiceIds": [] }`.
* `GET /api/reconciliation/suggestions?batchId=...&status=PENDING`
* `POST /api/reconciliation/suggestions/:id/confirm`: JSON
  `{ "amount": "125.00", "decisionNote": "optional" }`.
* `POST /api/reconciliation/suggestions/:id/reject`: JSON `{ "decisionNote": "optional" }`.
* `GET /api/reconciliation/balances?batchId=...`

`batchId` scopes the payments to match; invoices are searched across imported
batches unless `invoiceIds` is supplied. When neither a batch nor IDs are
provided, matching considers all payments and invoices. A rejected payment/invoice pair is not suggested again, and an existing
allocation excludes that pair from future suggestions.
Pass the same `batchId` when importing invoices and payments if you want batch
balance totals to include both uploads; each upload otherwise receives its own ID.
