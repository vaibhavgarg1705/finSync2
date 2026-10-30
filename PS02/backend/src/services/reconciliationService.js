'use strict';

const mongoose = require('mongoose');
const config = require('../config/env');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const MatchSuggestion = require('../models/MatchSuggestion');
const allocationService = require('./allocationService');
const matchingEngine = require('./matchingEngine');
const balanceService = require('./balanceService');
const { ApiError } = require('../utils/errors');
const { formatAmount, toDecimal } = require('../utils/decimal');

async function withTransaction(operation) {
  if (!config.useTransactions) return operation(null);
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await operation(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
}

function assertObjectId(id, label) {
  if (!mongoose.isValidObjectId(id)) {
    throw ApiError.badRequest('INVALID_ID', `${label} must be a valid MongoDB ID.`);
  }
}

async function runMatching({ batchId = null, paymentIds = null, invoiceIds = null } = {}) {
  return matchingEngine.runMatchingEngine({
    batchId,
    paymentIds: matchingEngine.validateIds(paymentIds, 'paymentIds'),
    invoiceIds: matchingEngine.validateIds(invoiceIds, 'invoiceIds'),
  });
}

async function getSuggestions({ batchId = null, status = 'PENDING', limit = 100 } = {}) {
  const filter = {};
  if (batchId) filter.importBatchId = batchId;
  if (status) {
    const normalizedStatus = String(status).toUpperCase();
    if (!['PENDING', 'CONFIRMED', 'REJECTED'].includes(normalizedStatus)) {
      throw ApiError.badRequest('INVALID_STATUS', 'Status must be PENDING, CONFIRMED, or REJECTED.');
    }
    filter.status = normalizedStatus;
  }
  const parsedLimit = Number(limit);
  if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 500) {
    throw ApiError.badRequest('INVALID_LIMIT', 'Limit must be an integer between 1 and 500.');
  }
  const suggestions = await MatchSuggestion.find(filter)
    .sort({ score: -1, createdAt: -1 })
    .limit(parsedLimit)
    .populate('paymentId', 'paymentReference customerId customerName amount transactionDate')
    .populate('invoiceId', 'invoiceNumber customerId customerName totalAmount dueDate')
    .lean();
  return suggestions.map((suggestion) => ({
    ...suggestion,
    suggestedAmount: formatAmount(suggestion.suggestedAmount),
    paymentId: suggestion.paymentId && {
      ...suggestion.paymentId,
      amount: formatAmount(suggestion.paymentId.amount),
    },
    invoiceId: suggestion.invoiceId && {
      ...suggestion.invoiceId,
      totalAmount: formatAmount(suggestion.invoiceId.totalAmount),
    },
  }));
}

async function confirmSuggestion({ suggestionId, amount, decisionNote = '' }) {
  assertObjectId(suggestionId, 'suggestionId');
  return withTransaction(async (session) => {
    const suggestionQuery = MatchSuggestion.findById(suggestionId);
    if (session) suggestionQuery.session(session);
    const suggestion = await suggestionQuery;
    if (!suggestion) throw new ApiError(404, 'SUGGESTION_NOT_FOUND', 'Match suggestion was not found.');
    if (suggestion.status === 'CONFIRMED') {
      throw new ApiError(409, 'ALREADY_CONFIRMED', 'This suggestion has already been confirmed.');
    }
    if (suggestion.status === 'REJECTED') {
      throw new ApiError(409, 'SUGGESTION_REJECTED', 'A rejected suggestion cannot be confirmed.');
    }

    const [payment, invoice] = await Promise.all([
      Payment.findById(suggestion.paymentId).session(session || null),
      Invoice.findById(suggestion.invoiceId).session(session || null),
    ]);
    if (!payment || !invoice) {
      throw new ApiError(404, 'MATCH_RECORD_NOT_FOUND', 'The payment or invoice for this suggestion no longer exists.');
    }
    if (payment.currency !== invoice.currency) {
      throw new ApiError(422, 'CURRENCY_MISMATCH', 'Payment and invoice currencies do not match.');
    }

    const allocationAmount = amount === undefined || amount === null
      ? toDecimal(suggestion.suggestedAmount)
      : toDecimal(amount);
    const allocation = await allocationService.allocate({
      payment,
      invoice,
      amount: allocationAmount,
      source: 'SUGGESTION',
      suggestionId: suggestion._id,
      explanation: suggestion.explanation.join(' '),
      session,
    });
    suggestion.status = 'CONFIRMED';
    suggestion.decisionNote = decisionNote;
    await suggestion.save(session ? { session } : undefined);
    return { suggestion, allocation };
  });
}

async function rejectSuggestion({ suggestionId, decisionNote = '' }) {
  assertObjectId(suggestionId, 'suggestionId');
  return withTransaction(async (session) => {
    const query = MatchSuggestion.findById(suggestionId);
    if (session) query.session(session);
    const suggestion = await query;
    if (!suggestion) throw new ApiError(404, 'SUGGESTION_NOT_FOUND', 'Match suggestion was not found.');
    if (suggestion.status === 'CONFIRMED') {
      throw new ApiError(409, 'ALREADY_CONFIRMED', 'A confirmed suggestion cannot be rejected.');
    }
    if (suggestion.status === 'REJECTED') {
      throw new ApiError(409, 'ALREADY_REJECTED', 'This suggestion has already been rejected.');
    }
    suggestion.status = 'REJECTED';
    suggestion.decisionNote = decisionNote;
    await suggestion.save(session ? { session } : undefined);
    return suggestion;
  });
}

async function createManualAllocation({ paymentId, invoiceId, amount, explanation = '' }) {
  assertObjectId(paymentId, 'paymentId');
  assertObjectId(invoiceId, 'invoiceId');
  return withTransaction(async (session) => {
    const [payment, invoice] = await Promise.all([
      Payment.findById(paymentId).session(session || null),
      Invoice.findById(invoiceId).session(session || null),
    ]);
    if (!payment || !invoice) {
      throw new ApiError(404, 'MATCH_RECORD_NOT_FOUND', 'Payment or invoice was not found.');
    }
    if (payment.currency !== invoice.currency) {
      throw new ApiError(422, 'CURRENCY_MISMATCH', 'Payment and invoice currencies do not match.');
    }
    return allocationService.allocate({
      payment,
      invoice,
      amount,
      source: 'MANUAL',
      explanation,
      session,
    });
  });
}

function getBalances(options) {
  return balanceService.getBalances(options);
}

module.exports = {
  confirmSuggestion,
  createManualAllocation,
  getBalances,
  getSuggestions,
  rejectSuggestion,
  runMatching,
};