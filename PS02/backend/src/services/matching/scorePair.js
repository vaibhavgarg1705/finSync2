'use strict';

const { nameSimilarity } = require('../../utils/similarity');
const { toDecimal } = require('../../utils/decimal');
const { WEIGHTS, THRESHOLDS, DATE_GRACE_DAYS } = require('./constants');

function daysBetween(left, right) {
  return Math.floor(Math.abs(left.getTime() - right.getTime()) / 86400000);
}

function scorePair(payment, invoice, paymentRemaining, invoiceRemaining) {
  let score = 0;
  const flags = [];
  const explanation = [];

  if (
    payment.invoiceReference
    && payment.invoiceReference === invoice.invoiceNumberNorm
  ) {
    score += WEIGHTS.EXACT_REFERENCE;
    flags.push('EXACT_INVOICE_REFERENCE');
    explanation.push('Payment invoice reference exactly matches the invoice number.');
  } else if (
    payment.descriptionRaw
    && invoice.numberRegex
    && invoice.numberRegex.test(payment.descriptionRaw)
  ) {
    score += WEIGHTS.DESCRIPTION_INVOICE_NUMBER;
    flags.push('INVOICE_NUMBER_IN_DESCRIPTION');
    explanation.push('Invoice number appears in the payment description.');
  }

  if (payment.customerId && payment.customerId === invoice.customerIdNorm) {
    score += WEIGHTS.CUSTOMER_ID;
    flags.push('CUSTOMER_ID_MATCH');
    explanation.push('Customer ID matches.');
  }

  const similarity = nameSimilarity(payment.customerName, invoice.customerName);
  if (similarity >= THRESHOLDS.NAME_HIGH) {
    score += WEIGHTS.NAME_SIM_HIGH;
    flags.push('CUSTOMER_NAME_HIGH_SIMILARITY');
    explanation.push('Customer names are highly similar.');
  } else if (similarity >= THRESHOLDS.NAME_MID) {
    score += WEIGHTS.NAME_SIM_MID;
    flags.push('CUSTOMER_NAME_SIMILARITY');
    explanation.push('Customer names are similar.');
  }

  const paidRemaining = toDecimal(paymentRemaining);
  const invoiceOpen = toDecimal(invoiceRemaining);
  if (paidRemaining.equals(invoiceOpen)) {
    score += WEIGHTS.AMOUNT_EXACT;
    flags.push('AMOUNT_EXACT');
    explanation.push('Remaining payment amount equals the invoice balance.');
  } else if (paidRemaining.greaterThan(0) && invoiceOpen.greaterThan(0)) {
    score += WEIGHTS.AMOUNT_PARTIAL;
    flags.push('AMOUNT_PARTIAL');
    explanation.push('Both the payment and invoice have an allocatable balance.');
  }

  const transactionDate = payment.transactionDate;
  if (
    transactionDate instanceof Date
    && invoice.invoiceDate instanceof Date
    && invoice.dueDate instanceof Date
    && transactionDate >= invoice.invoiceDate
    && transactionDate <= new Date(invoice.dueDate.getTime() + DATE_GRACE_DAYS * 86400000)
  ) {
    score += WEIGHTS.DATE_IN_GRACE;
    flags.push('DATE_IN_GRACE');
    explanation.push('Payment date falls between the invoice date and 30 days after its due date.');
  } else if (
    transactionDate instanceof Date
    && invoice.dueDate instanceof Date
    && daysBetween(transactionDate, invoice.dueDate) <= DATE_GRACE_DAYS
  ) {
    score += WEIGHTS.DATE_IN_GRACE;
    flags.push('DATE_NEAR_DUE_DATE');
    explanation.push('Payment date is within 30 days of the invoice due date.');
  }

  return {
    score: Math.min(score, 100),
    flags,
    explanation,
    nameSimilarity: Number(similarity.toFixed(3)),
  };
}

module.exports = scorePair;