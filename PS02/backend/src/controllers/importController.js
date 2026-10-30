'use strict';

const importService = require('../services/importService');
const { ApiError } = require('../utils/errors');

function requestCsv(req) {
  if (typeof req.body === 'string') return req.body;
  if (req.body && typeof req.body.csv === 'string') return req.body.csv;
  throw ApiError.badRequest('CSV_REQUIRED', 'Send CSV text as the request body or in the JSON csv property.');
}

function requestBatchId(req) {
  const batchId = req.body && typeof req.body === 'object' ? req.body.batchId : null;
  if (batchId !== undefined && batchId !== null && (typeof batchId !== 'string' || !batchId.trim())) {
    throw ApiError.badRequest('INVALID_BATCH_ID', 'batchId must be a non-empty string when supplied.');
  }
  return batchId ? batchId.trim() : importService.newBatchId();
}

async function importInvoices(req, res) {
  const result = await importService.importInvoices({
    csv: requestCsv(req),
    batchId: requestBatchId(req),
  });
  res.status(201).json({ success: true, data: result });
}

async function importPayments(req, res) {
  const result = await importService.importPayments({
    csv: requestCsv(req),
    batchId: requestBatchId(req),
  });
  res.status(201).json({ success: true, data: result });
}

module.exports = { importInvoices, importPayments };