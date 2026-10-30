'use strict';

const { parse } = require('csv-parse/sync');
const { ApiError } = require('./errors');

function normalizeHeader(header) {
  return String(header).trim().replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function parseCsv(input) {
  if (typeof input !== 'string' || !input.trim()) {
    throw ApiError.badRequest('CSV_REQUIRED', 'Provide non-empty CSV text.');
  }
  try {
    return parse(input, {
      bom: true,
      columns: (headers) => headers.map(normalizeHeader),
      skip_empty_lines: true,
      trim: true,
      relax_column_count: false,
    });
  } catch (error) {
    throw ApiError.badRequest('INVALID_CSV', 'The CSV could not be parsed.', {
      message: error.message,
    });
  }
}

function parseDate(raw) {
  if (raw === null || raw === undefined || String(raw).trim() === '') return null;
  const value = String(raw).trim();
  let year;
  let month;
  let day;
  let match = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (match) {
    [, year, month, day] = match;
  } else {
    match = value.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/);
    if (!match) return null;
    [, day, month, year] = match;
  }
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (
    date.getUTCFullYear() !== Number(year)
    || date.getUTCMonth() !== Number(month) - 1
    || date.getUTCDate() !== Number(day)
  ) return null;
  return date;
}

module.exports = { normalizeHeader, parseCsv, parseDate };