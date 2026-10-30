'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { parseDate, normalizeHeader } = require('../src/utils/csv');
const {
  formatAmount,
  fromDecimal128,
  parseMoney,
  toDecimal,
  toDecimal128,
} = require('../src/utils/decimal');
const { nameSimilarity } = require('../src/utils/similarity');
const scorePair = require('../src/services/matching/scorePair');
const { categorizeCandidates, invoiceNumberRegex } = require('../src/services/matchingEngine');
const app = require('../src/app');
const importService = require('../src/services/importService');

test('money parsing preserves two decimal places and supports accounting negatives', () => {
  assert.equal(formatAmount(parseMoney('₹1,234.50')), '1234.50');
  assert.equal(formatAmount(parseMoney('(INR 12.30)')), '-12.30');
  assert.equal(parseMoney('not money'), null);
  assert.equal(formatAmount(fromDecimal128(toDecimal128('25.1'))), '25.10');
});

test('CSV headers and dates normalize deterministically', () => {
  assert.equal(normalizeHeader('Invoice Number'), 'invoicenumber');
  assert.equal(parseDate('31/01/2026').toISOString(), '2026-01-31T00:00:00.000Z');
  assert.equal(parseDate('2026-02-30'), null);
});

test('name comparison tolerates token order', () => {
  assert.ok(nameSimilarity('Acme Trading Limited', 'Trading Acme Limited') > 0.8);
});

test('invoice references match separators without matching partial numbers', () => {
  const pattern = invoiceNumberRegex('INV-1001/A');
  assert.match('Payment: INV 1001-A', pattern);
  assert.doesNotMatch('Payment: INV 10010/A', pattern);
});

test('scoring recognizes exact reference and exact remaining amount', () => {
  const payment = {
    invoiceReference: 'INV1001',
    customerId: 'CUST-01',
    customerName: 'Acme Industries',
    transactionDate: new Date('2026-01-20T00:00:00.000Z'),
    descriptionRaw: '',
  };
  const invoice = {
    invoiceNumberNorm: 'INV1001',
    customerIdNorm: 'CUST-01',
    customerName: 'Acme Industries',
    invoiceDate: new Date('2026-01-05T00:00:00.000Z'),
    dueDate: new Date('2026-02-04T00:00:00.000Z'),
  };
  const result = scorePair(payment, invoice, toDecimal('100.00'), toDecimal('100.00'));
  assert.equal(result.score, 100);
  assert.ok(result.flags.includes('EXACT_INVOICE_REFERENCE'));
  assert.ok(result.flags.includes('AMOUNT_EXACT'));
});

test('close top candidates are categorized as ambiguous', () => {
  const [top] = categorizeCandidates([
    { score: 78, flags: [] },
    { score: 72, flags: [] },
  ]);
  assert.equal(top.category, 'AMBIGUOUS');
});

test('import validation reports invalid data before attempting database writes', async () => {
  const csv = [
    'invoiceNumber,customerId,customerName,invoiceDate,dueDate,totalAmount',
    'INV-1,CUST-1,Acme,2026-01-01,2026-01-31,not-money',
  ].join('\n');
  await assert.rejects(
    importService.importInvoices({ csv, batchId: 'test-batch' }),
    (error) => error.status === 422 && error.details.errors.some((item) => item.field === 'totalamount'),
  );
});

test('health and not-found endpoints return API response shapes', async () => {
  const server = app.listen(0);
  try {
    const { port } = server.address();
    const health = await fetch(`http://127.0.0.1:${port}/health`);
    assert.equal(health.status, 200);
    assert.deepEqual(await health.json(), { success: true, status: 'ok' });

    const invalidImport = await fetch(`http://127.0.0.1:${port}/api/import/invoices`, {
      method: 'POST',
      headers: { 'content-type': 'text/csv' },
      body: 'invoiceNumber,customerId,customerName,invoiceDate,dueDate,totalAmount\nINV-1,C1,Acme,bad-date,2026-01-31,bad-amount',
    });
    assert.equal(invalidImport.status, 422);
    assert.equal((await invalidImport.json()).error.code, 'IMPORT_VALIDATION_FAILED');

    const missing = await fetch(`http://127.0.0.1:${port}/missing`);
    assert.equal(missing.status, 404);
    assert.equal((await missing.json()).error.code, 'NOT_FOUND');
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
