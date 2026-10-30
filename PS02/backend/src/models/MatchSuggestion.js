'use strict';

const mongoose = require('mongoose');
const { decimalTransform } = require('../utils/decimal');

const matchSuggestionSchema = new mongoose.Schema({
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', required: true, index: true },
  invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true, index: true },
  paymentReference: { type: String, required: true },
  invoiceNumber: { type: String, required: true },
  score: { type: Number, required: true, min: 0, max: 100 },
  confidence: { type: String, enum: ['HIGH', 'MEDIUM', 'LOW'], required: true },
  category: { type: String, enum: ['EXACT', 'STRONG', 'LIKELY', 'AMBIGUOUS', 'WEAK'], required: true },
  suggestedAmount: { type: mongoose.Schema.Types.Decimal128, required: true },
  flags: { type: [String], default: [] },
  explanation: { type: [String], default: [] },
  status: {
    type: String,
    enum: ['PENDING', 'CONFIRMED', 'REJECTED'],
    default: 'PENDING',
    required: true,
    index: true,
  },
  decisionNote: { type: String, trim: true, default: '' },
  importBatchId: { type: String, default: null, index: true },
}, {
  timestamps: true,
  toJSON: { transform: decimalTransform },
  toObject: { transform: decimalTransform },
});

matchSuggestionSchema.index({ paymentId: 1, invoiceId: 1 }, { unique: true });
matchSuggestionSchema.index({ importBatchId: 1, status: 1, score: -1 });

module.exports = mongoose.models.MatchSuggestion
  || mongoose.model('MatchSuggestion', matchSuggestionSchema);