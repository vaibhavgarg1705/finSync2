'use strict';

const Decimal = require('decimal.js');
const { Types } = require('mongoose');

Decimal.set({
  precision: 40,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -30,
  toExpPos: 40,
});

const SCALE = 2;
const ZERO = new Decimal(0);

function isDecimal128(value) {
  return value instanceof Types.Decimal128 || (value && value._bsontype === 'Decimal128');
}

function toDecimal(value) {
  if (value === null || value === undefined || value === '') return new Decimal(0);
  if (value instanceof Decimal) return value;
  if (isDecimal128(value)) return new Decimal(value.toString());
  if (typeof value === 'number' && !Number.isFinite(value)) {
    throw new Error('Invalid numeric value');
  }
  return new Decimal(String(value).replace(/,/g, '').trim());
}

function fromDecimal128(value) {
  return value == null ? new Decimal(0) : toDecimal(value);
}

function toDecimal128(value) {
  return Types.Decimal128.fromString(toDecimal(value).toFixed(SCALE));
}

function parseMoney(raw) {
  if (raw === null || raw === undefined) return null;
  let value = String(raw).trim();
  if (!value) return null;

  let negative = false;
  if (/^\(.*\)$/.test(value)) {
    negative = true;
    value = value.slice(1, -1);
  }
  value = value.replace(/[₹$,\s]/g, '').replace(/inr/ig, '');
  if (value.startsWith('-')) {
    negative = true;
    value = value.slice(1);
  } else if (value.startsWith('+')) {
    value = value.slice(1);
  }
  if (!/^\d+(?:\.\d+)?$/.test(value)) return null;

  const amount = new Decimal(value).toDecimalPlaces(SCALE, Decimal.ROUND_HALF_UP);
  return negative ? amount.negated() : amount;
}

function isPositive(value) {
  return toDecimal(value).greaterThan(ZERO);
}

function round2(value) {
  return toDecimal(value).toDecimalPlaces(SCALE, Decimal.ROUND_HALF_UP);
}

function formatAmount(value) {
  return toDecimal(value).toFixed(SCALE);
}

function decimalTransform(_doc, result) {
  for (const [key, value] of Object.entries(result)) {
    if (isDecimal128(value)) result[key] = value.toString();
  }
  return result;
}

module.exports = {
  Decimal,
  SCALE,
  ZERO,
  decimalTransform,
  formatAmount,
  fromDecimal128,
  isPositive,
  parseMoney,
  round2,
  toDecimal,
  toDecimal128,
};