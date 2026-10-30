'use strict';

const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const allocationService = require('./allocationService');
const { toDecimal, formatAmount } = require('../utils/decimal');

function invoiceStatus(outstanding, dueDate, today) {
  if (outstanding.lessThan(0)) return 'OVERPAID';
  if (outstanding.equals(0)) return 'PAID';
  if (dueDate < today) return 'OVERDUE';
  return 'OUTSTANDING';
}

async function getBalances({ batchId = null } = {}) {
  const invoiceFilter = batchId ? { importBatchId: batchId } : {};
  const paymentFilter = batchId ? { importBatchId: batchId } : {};
  const [invoices, payments] = await Promise.all([
    Invoice.find(invoiceFilter).sort({ invoiceDate: 1, invoiceNumber: 1 }).lean(),
    Payment.find(paymentFilter).lean(),
  ]);

  const [invoiceAllocations, paymentAllocations] = await Promise.all([
    allocationService.allocatedByInvoice(invoices.map((invoice) => invoice._id)),
    allocationService.allocatedByPayment(payments.map((payment) => payment._id)),
  ]);

  let totalInvoiced = toDecimal(0);
  let totalPaymentsReceived = toDecimal(0);
  let totalAllocated = toDecimal(0);
  let totalOutstanding = toDecimal(0);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const invoiceBalances = invoices.map((invoice) => {
    const total = toDecimal(invoice.totalAmount);
    const allocated = invoiceAllocations.get(String(invoice._id)) || toDecimal(0);
    const outstanding = total.minus(allocated);
    const due = new Date(invoice.dueDate);
    const dueUtc = new Date(Date.UTC(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate()));
    const daysOverdue = outstanding.greaterThan(0) && dueUtc < today
      ? Math.floor((today - dueUtc) / 86400000)
      : 0;
    totalInvoiced = totalInvoiced.plus(total);
    totalOutstanding = totalOutstanding.plus(outstanding.greaterThan(0) ? outstanding : 0);
    return {
      invoiceId: String(invoice._id),
      invoiceNumber: invoice.invoiceNumber,
      customerId: invoice.customerId,
      customerName: invoice.customerName,
      invoiceDate: invoice.invoiceDate,
      dueDate: invoice.dueDate,
      totalAmount: formatAmount(total),
      allocatedAmount: formatAmount(allocated),
      outstandingAmount: formatAmount(outstanding),
      status: invoiceStatus(outstanding, dueUtc, today),
      daysOverdue,
    };
  });

  for (const payment of payments) {
    totalPaymentsReceived = totalPaymentsReceived.plus(toDecimal(payment.amount));
    totalAllocated = totalAllocated.plus(
      paymentAllocations.get(String(payment._id)) || toDecimal(0),
    );
  }

  const unallocatedPayments = totalPaymentsReceived.minus(totalAllocated);
  return {
    currency: 'INR',
    totals: {
      totalInvoiced: formatAmount(totalInvoiced),
      totalPaymentsReceived: formatAmount(totalPaymentsReceived),
      totalAllocated: formatAmount(totalAllocated),
      totalOutstanding: formatAmount(totalOutstanding),
      totalUnallocatedPayments: formatAmount(unallocatedPayments),
      invoiceCount: invoices.length,
      paymentCount: payments.length,
    },
    invoices: invoiceBalances,
  };
}

module.exports = { getBalances };