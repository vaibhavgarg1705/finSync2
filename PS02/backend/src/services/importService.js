'use strict';

const { randomUUID } = require('node:crypto');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const { ApiError } = require('../utils/errors');
const { parseCsv, parseDate } = require('../utils/csv');
const { parseMoney, toDecimal128 } = require('../utils/decimal');

function field(row, name) {
  return row[name] === undefined || row[name] === null ? '' : String(row[name]).trim();
}

function validateCommon(row, rowNumber, errors) {
  for (const key of ['customerid', 'customername']) {
    if (!field(row, key)) errors.push({ row: rowNumber, field: key, message: `${key} is required.` });
  }
  if (field(row, 'currency') && field(row, 'currency').toUpperCase() !== 'INR') {
    errors.push({ row: rowNumber, field: 'currency', message: 'Only INR currency is supported.' });
  }
}

function validateAmount(row, rowNumber, key, errors) {
  const amount = parseMoney(row[key]);
  if (!amount) {
    errors.push({ row: rowNumber, field: key, message: 'A valid amount is required.' });
  } else if (!amount.greaterThan(0)) {
    errors.push({ row: rowNumber, field: key, message: 'Amount must be greater than zero.' });
  }
  return amount;
}

function validateDate(row, rowNumber, key, errors) {
  const date = parseDate(row[key]);
  if (!date) errors.push({ row: rowNumber, field: key, message: 'A valid date is required.' });
  return date;
}

function assertUnique(documents, property, key, errors) {
  const seen = new Set();
  for (const [index, document] of documents.entries()) {
    const value = document[property];
    if (!value) continue;
    if (seen.has(value)) {
      errors.push({ row: index + 2, field: key, message: `Duplicate ${key} in this CSV.` });
    }
    seen.add(value);
  }
}

async function importInvoices({ csv, batchId }) {
  const rows = parseCsv(csv);
  const errors = [];
  const documents = rows.map((row, index) => {
    const rowNumber = index + 2;
    const invoiceNumber = field(row, 'invoicenumber');
    if (!invoiceNumber) errors.push({ row: rowNumber, field: 'invoicenumber', message: 'Invoice number is required.' });
    validateCommon(row, rowNumber, errors);
    const invoiceDate = validateDate(row, rowNumber, 'invoicedate', errors);
    const dueDate = validateDate(row, rowNumber, 'duedate', errors);
    if (invoiceDate && dueDate && dueDate < invoiceDate) {
      errors.push({ row: rowNumber, field: 'duedate', message: 'Due date cannot be before invoice date.' });
    }
    const amount = validateAmount(row, rowNumber, 'totalamount', errors);
    return {
      invoiceNumber,
      customerId: field(row, 'customerid'),
      customerName: field(row, 'customername'),
      invoiceDate,
      dueDate,
      totalAmount: amount && toDecimal128(amount),
      currency: field(row, 'currency').toUpperCase() || 'INR',
      importBatchId: batchId,
    };
  });

  assertUnique(documents, 'invoiceNumber', 'invoicenumber', errors);
  if (errors.length) throw new ApiError(422, 'IMPORT_VALIDATION_FAILED', 'Invoice CSV validation failed.', { errors });
  if (!documents.length) throw ApiError.badRequest('CSV_EMPTY', 'Invoice CSV contains no data rows.');

  const result = await Invoice.insertMany(documents, { ordered: true });
  return { batchId, count: result.length, invoices: result };
}

async function importPayments({ csv, batchId }) {
  const rows = parseCsv(csv);
  const errors = [];
  const documents = rows.map((row, index) => {
    const rowNumber = index + 2;
    const paymentReference = field(row, 'paymentreference');
    if (!paymentReference) errors.push({ row: rowNumber, field: 'paymentreference', message: 'Payment reference is required.' });
    validateCommon(row, rowNumber, errors);
    const transactionDate = validateDate(row, rowNumber, 'transactiondate', errors);
    const amount = validateAmount(row, rowNumber, 'amount', errors);
    return {
      paymentReference,
      customerId: field(row, 'customerid'),
      customerName: field(row, 'customername'),
      amount: amount && toDecimal128(amount),
      transactionDate,
      invoiceReference: field(row, 'invoicereference'),
      description: field(row, 'description'),
      currency: field(row, 'currency').toUpperCase() || 'INR',
      importBatchId: batchId,
    };
  });

  assertUnique(documents, 'paymentReference', 'paymentreference', errors);
  if (errors.length) throw new ApiError(422, 'IMPORT_VALIDATION_FAILED', 'Payment CSV validation failed.', { errors });
  if (!documents.length) throw ApiError.badRequest('CSV_EMPTY', 'Payment CSV contains no data rows.');

  const result = await Payment.insertMany(documents, { ordered: true });
  return { batchId, count: result.length, payments: result };
}

function newBatchId() {
  return randomUUID();
}

module.exports = { importInvoices, importPayments, newBatchId };
