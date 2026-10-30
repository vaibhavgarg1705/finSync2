'use strict';

const reconciliationService = require('../services/reconciliationService');
const { ApiError } = require('../utils/errors');
const { parseMoney } = require('../utils/decimal');

function requestAmount(value) {
  if (typeof value !== 'string' && typeof value !== 'number') {
    throw ApiError.badRequest('INVALID_AMOUNT', 'amount must be a decimal string or number.');
  }
  const parsed = parseMoney(value);
  if (!parsed) throw ApiError.badRequest('INVALID_AMOUNT', 'amount must be a valid monetary amount.');
  return parsed;
}

function optionalText(value, fieldName, maxLength = 2000) {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string' || value.length > maxLength) {
    throw ApiError.badRequest('INVALID_INPUT', `${fieldName} must be a string no longer than ${maxLength} characters.`);
  }
  return value.trim();
}

async function runMatching(req, res) {
  const { batchId = null, paymentIds = null, invoiceIds = null } = req.body || {};
  if (batchId !== null && (typeof batchId !== 'string' || !batchId.trim())) {
    throw ApiError.badRequest('INVALID_BATCH_ID', 'batchId must be a non-empty string.');
  }
  const result = await reconciliationService.runMatching({
    batchId: batchId ? batchId.trim() : null,
    paymentIds,
    invoiceIds,
  });
  res.json({ success: true, data: result });
}

async function getSuggestions(req, res) {
  const suggestions = await reconciliationService.getSuggestions({
    batchId: req.query.batchId || null,
    status: req.query.status === undefined ? 'PENDING' : req.query.status,
    limit: req.query.limit || 100,
  });
  res.json({ success: true, data: suggestions });
}

async function confirmSuggestion(req, res) {
  const body = req.body || {};
  const result = await reconciliationService.confirmSuggestion({
    suggestionId: req.params.id,
    amount: body.amount === undefined || body.amount === null ? undefined : requestAmount(body.amount),
    decisionNote: optionalText(body.decisionNote, 'decisionNote'),
  });
  res.json({ success: true, data: result });
}

async function rejectSuggestion(req, res) {
  const result = await reconciliationService.rejectSuggestion({
    suggestionId: req.params.id,
    decisionNote: optionalText((req.body || {}).decisionNote, 'decisionNote'),
  });
  res.json({ success: true, data: result });
}

async function createManualAllocation(req, res) {
  const body = req.body || {};
  const allocation = await reconciliationService.createManualAllocation({
    paymentId: body.paymentId,
    invoiceId: body.invoiceId,
    amount: requestAmount(body.amount),
    explanation: optionalText(body.explanation, 'explanation'),
  });
  res.status(201).json({ success: true, data: allocation });
}

async function getBalances(req, res) {
  const data = await reconciliationService.getBalances({ batchId: req.query.batchId || null });
  res.json({ success: true, data });
}

module.exports = {
  confirmSuggestion,
  createManualAllocation,
  getBalances,
  getSuggestions,
  rejectSuggestion,
  runMatching,
};