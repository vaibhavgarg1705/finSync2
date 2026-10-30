'use strict';

const mongoose = require('mongoose');
const { decimalTransform } = require('../utils/decimal');

const allocationSchema = new mongoose.Schema({
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', required: true, index: true },
  invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true, index: true },
  amount: { type: mongoose.Schema.Types.Decimal128, required: true },
  source: { type: String, enum: ['MANUAL', 'SUGGESTION'], required: true },
  suggestionId: { type: mongoose.Schema.Types.ObjectId, ref: 'MatchSuggestion', default: null },
  explanation: { type: String, trim: true, default: '' },
  createdAt: { type: Date, default: Date.now, immutable: true },
}, {
  versionKey: false,
  toJSON: { transform: decimalTransform },
  toObject: { transform: decimalTransform },
});

module.exports = mongoose.models.Allocation || mongoose.model('Allocation', allocationSchema);