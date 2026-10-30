'use strict';

const Allocation = require('../models/Allocation');
const { ApiError } = require('../utils/errors');
const { toDecimal, toDecimal128 } = require('../utils/decimal');

async function allocatedBy(field, ids, session) {
  if (!ids || ids.length === 0) return new Map();
  const rows = await Allocation.aggregate([
    { $match: { [field]: { $in: ids } } },
    { $group: { _id: `$${field}`, total: { $sum: '$amount' } } },
  ]).session(session || null);
  return new Map(rows.map((row) => [String(row._id), toDecimal(row.total)]));
}

function allocatedByPayment(paymentIds, session) {
  return allocatedBy('paymentId', paymentIds, session);
}

function allocatedByInvoice(invoiceIds, session) {
  return allocatedBy('invoiceId', invoiceIds, session);
}

async function computePaymentAllocated(paymentId, session) {
  const totals = await allocatedByPayment([paymentId], session);
  return totals.get(String(paymentId)) || toDecimal(0);
}

async function computeInvoiceAllocated(invoiceId, session) {
  const totals = await allocatedByInvoice([invoiceId], session);
  return totals.get(String(invoiceId)) || toDecimal(0);
}

async function assertAllocatable({ payment, invoice, amount, session }) {
  const allocationAmount = toDecimal(amount);
  if (!allocationAmount.greaterThan(0)) {
    throw new ApiError(422, 'AMOUNT_NOT_POSITIVE', 'Allocation amount must be greater than zero.');
  }
  const [paymentAllocated, invoiceAllocated] = await Promise.all([
    computePaymentAllocated(payment._id, session),
    computeInvoiceAllocated(invoice._id, session),
  ]);
  const paymentRemaining = toDecimal(payment.amount).minus(paymentAllocated);
  const invoiceRemaining = toDecimal(invoice.totalAmount).minus(invoiceAllocated);
  if (allocationAmount.greaterThan(paymentRemaining)) {
    throw new ApiError(409, 'PAYMENT_OVER_ALLOCATED', 'Allocation exceeds the payment balance.', {
      remainingAmount: paymentRemaining.toFixed(2),
    });
  }
  if (allocationAmount.greaterThan(invoiceRemaining)) {
    throw new ApiError(409, 'INVOICE_OVER_ALLOCATED', 'Allocation exceeds the invoice balance.', {
      remainingAmount: invoiceRemaining.toFixed(2),
    });
  }
}

async function allocate({ payment, invoice, amount, source, suggestionId = null, explanation = '', session }) {
  await assertAllocatable({ payment, invoice, amount, session });
  const allocation = new Allocation({
    paymentId: payment._id,
    invoiceId: invoice._id,
    amount: toDecimal128(amount),
    source,
    suggestionId,
    explanation,
  });
  await allocation.save(session ? { session } : undefined);
  return allocation;
}

module.exports = {
  allocate,
  allocatedByInvoice,
  allocatedByPayment,
  assertAllocatable,
  computeInvoiceAllocated,
  computePaymentAllocated,
};