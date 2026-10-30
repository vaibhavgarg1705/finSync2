'use strict';

const mongoose = require('mongoose');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const MatchSuggestion = require('../models/MatchSuggestion');
const Allocation = require('../models/Allocation');
const allocationService = require('./allocationService');
const scorePair = require('./matching/scorePair');
const { THRESHOLDS } = require('./matching/constants');
const { formatAmount, toDecimal, toDecimal128 } = require('../utils/decimal');
const { ApiError } = require('../utils/errors');

function normalizeId(value) {
  return String(value || '').trim().toUpperCase();
}

function normalizeInvoiceNumber(value) {
  return String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function normalizeName(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function invoiceNumberRegex(invoiceNumber) {
  const parts = String(invoiceNumber).toUpperCase().split(/[^A-Z0-9]+/).filter(Boolean);
  if (!parts.length) return null;
  const body = parts.map(escapeRegex).join('[\\s\\-_/.#]*');
  return new RegExp(`(^|[^A-Z0-9])${body}([^A-Z0-9]|$)`, 'i');
}

function buildPaymentView(document) {
  return {
    _id: document._id,
    paymentReference: document.paymentReference,
    customerId: normalizeId(document.customerId),
    customerName: document.customerName,
    customerNameNorm: normalizeName(document.customerName),
    amount: toDecimal(document.amount),
    transactionDate: document.transactionDate,
    invoiceReference: document.invoiceReference
      ? normalizeInvoiceNumber(document.invoiceReference)
      : null,
    descriptionRaw: document.description || '',
    descriptionNorm: normalizeInvoiceNumber(document.description || ''),
    currency: document.currency,
    importBatchId: document.importBatchId,
  };
}

function buildInvoiceView(document) {
  return {
    _id: document._id,
    invoiceNumber: document.invoiceNumber,
    invoiceNumberNorm: normalizeInvoiceNumber(document.invoiceNumber),
    searchKey: normalizeInvoiceNumber(document.invoiceNumber),
    numberRegex: invoiceNumberRegex(document.invoiceNumber),
    customerIdNorm: normalizeId(document.customerId),
    customerName: document.customerName,
    customerNameNorm: normalizeName(document.customerName),
    totalAmount: toDecimal(document.totalAmount),
    invoiceDate: document.invoiceDate,
    dueDate: document.dueDate,
    currency: document.currency,
    importBatchId: document.importBatchId,
  };
}

function confidenceFor(score) {
  if (score >= THRESHOLDS.STRONG) return 'HIGH';
  if (score >= THRESHOLDS.LIKELY) return 'MEDIUM';
  return 'LOW';
}

function categorizeCandidates(scored) {
  const ordered = [...scored].sort((a, b) => b.score - a.score);
  return ordered.map((candidate, index) => {
    const runnerUp = ordered[index + 1];
    const isAmbiguous = index === 0
      && candidate.score >= THRESHOLDS.LIKELY
      && runnerUp
      && candidate.score - runnerUp.score <= THRESHOLDS.AMBIGUOUS_DELTA;
    let category = 'WEAK';
    if (isAmbiguous) category = 'AMBIGUOUS';
    else if (candidate.flags.includes('EXACT_INVOICE_REFERENCE') && candidate.flags.includes('AMOUNT_EXACT')) {
      category = 'EXACT';
    } else if (candidate.score >= THRESHOLDS.STRONG) category = 'STRONG';
    else if (candidate.score >= THRESHOLDS.LIKELY) category = 'LIKELY';
    return { ...candidate, category, confidence: confidenceFor(candidate.score) };
  });
}

function candidatesFor(payment, invoices, byCustomer, byNumber) {
  const candidates = new Map();
  for (const invoice of byCustomer.get(payment.customerId) || []) {
    candidates.set(String(invoice._id), invoice);
  }
  if (payment.invoiceReference) {
    for (const invoice of byNumber.get(payment.invoiceReference) || []) {
      candidates.set(String(invoice._id), invoice);
    }
  }
  if (payment.descriptionNorm) {
    for (const invoice of invoices) {
      if (candidates.has(String(invoice._id))) continue;
      if (
        invoice.searchKey
        && payment.descriptionNorm.includes(invoice.searchKey)
        && invoice.numberRegex
        && invoice.numberRegex.test(payment.descriptionRaw)
      ) {
        candidates.set(String(invoice._id), invoice);
      }
    }
  }
  return [...candidates.values()];
}

async function runMatchingEngine({
  batchId = null,
  paymentIds = null,
  invoiceIds = null,
} = {}) {
  const paymentFilter = paymentIds && paymentIds.length
    ? { _id: { $in: paymentIds } }
    : batchId ? { importBatchId: batchId } : {};
  const invoiceFilter = invoiceIds && invoiceIds.length
    ? { _id: { $in: invoiceIds } }
    : {};
  const [paymentDocs, invoiceDocs] = await Promise.all([
    Payment.find(paymentFilter).lean(),
    Invoice.find({ ...invoiceFilter, currency: 'INR' }).lean(),
  ]);
  if (!paymentDocs.length || !invoiceDocs.length) {
    return {
      paymentCount: paymentDocs.length,
      invoiceCount: invoiceDocs.length,
      suggestionCount: 0,
      suggestions: [],
    };
  }

  const paymentViews = paymentDocs.map(buildPaymentView);
  const invoiceViews = invoiceDocs.map(buildInvoiceView);
  const [paymentAllocations, invoiceAllocations, rejected, confirmed] = await Promise.all([
    allocationService.allocatedByPayment(paymentDocs.map((payment) => payment._id)),
    allocationService.allocatedByInvoice(invoiceDocs.map((invoice) => invoice._id)),
    MatchSuggestion.find({
      status: 'REJECTED',
      paymentId: { $in: paymentDocs.map((payment) => payment._id) },
      invoiceId: { $in: invoiceDocs.map((invoice) => invoice._id) },
    }).select('paymentId invoiceId').lean(),
    Allocation.find({
      paymentId: { $in: paymentDocs.map((payment) => payment._id) },
      invoiceId: { $in: invoiceDocs.map((invoice) => invoice._id) },
    }).select('paymentId invoiceId').lean(),
  ]);

  const excludedPairs = new Set([
    ...rejected.map((pair) => `${pair.paymentId}:${pair.invoiceId}`),
    ...confirmed.map((pair) => `${pair.paymentId}:${pair.invoiceId}`),
  ]);
  const byCustomer = new Map();
  const byNumber = new Map();
  for (const invoice of invoiceViews) {
    if (!byCustomer.has(invoice.customerIdNorm)) byCustomer.set(invoice.customerIdNorm, []);
    byCustomer.get(invoice.customerIdNorm).push(invoice);
    if (!byNumber.has(invoice.invoiceNumberNorm)) byNumber.set(invoice.invoiceNumberNorm, []);
    byNumber.get(invoice.invoiceNumberNorm).push(invoice);
  }

  const suggestions = [];
  for (const payment of paymentViews) {
    const paymentRemaining = payment.amount.minus(
      paymentAllocations.get(String(payment._id)) || toDecimal(0),
    );
    if (!paymentRemaining.greaterThan(0)) continue;

    const scored = [];
    for (const invoice of candidatesFor(payment, invoiceViews, byCustomer, byNumber)) {
      const pairKey = `${payment._id}:${invoice._id}`;
      if (excludedPairs.has(pairKey) || payment.currency !== invoice.currency) continue;
      const invoiceRemaining = invoice.totalAmount.minus(
        invoiceAllocations.get(String(invoice._id)) || toDecimal(0),
      );
      if (!invoiceRemaining.greaterThan(0)) continue;
      const score = scorePair(payment, invoice, paymentRemaining, invoiceRemaining);
      if (score.score < THRESHOLDS.MIN_CANDIDATE) continue;
      scored.push({
        payment,
        invoice,
        score: score.score,
        flags: score.flags,
        explanation: score.explanation,
        suggestedAmount: paymentRemaining.lessThan(invoiceRemaining)
          ? paymentRemaining
          : invoiceRemaining,
      });
    }

    for (const candidate of categorizeCandidates(scored)) {
      suggestions.push({
        paymentId: candidate.payment._id,
        invoiceId: candidate.invoice._id,
        paymentReference: candidate.payment.paymentReference,
        invoiceNumber: candidate.invoice.invoiceNumber,
        score: candidate.score,
        confidence: candidate.confidence,
        category: candidate.category,
        suggestedAmount: toDecimal128(candidate.suggestedAmount),
        flags: candidate.flags,
        explanation: candidate.explanation,
        status: 'PENDING',
        importBatchId: batchId || candidate.payment.importBatchId || null,
      });
    }
  }

  await MatchSuggestion.deleteMany({
    paymentId: { $in: paymentDocs.map((payment) => payment._id) },
    invoiceId: { $in: invoiceDocs.map((invoice) => invoice._id) },
    status: 'PENDING',
  });
  if (suggestions.length) await MatchSuggestion.insertMany(suggestions, { ordered: false });

  return {
    paymentCount: paymentDocs.length,
    invoiceCount: invoiceDocs.length,
    suggestionCount: suggestions.length,
    suggestions: suggestions.map((suggestion) => ({
      ...suggestion,
      suggestedAmount: formatAmount(suggestion.suggestedAmount),
    })),
  };
}

function validateIds(ids, name) {
  if (ids === null || ids === undefined) return null;
  if (!Array.isArray(ids) || ids.some((id) => !mongoose.isValidObjectId(id))) {
    throw ApiError.badRequest('INVALID_IDS', `${name} must be an array of valid MongoDB IDs.`);
  }
  return ids.map((id) => new mongoose.Types.ObjectId(id));
}

module.exports = {
  categorizeCandidates,
  invoiceNumberRegex,
  normalizeInvoiceNumber,
  runMatchingEngine,
  validateIds,
};