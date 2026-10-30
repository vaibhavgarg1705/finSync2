'use strict';

const mongoose = require('mongoose');
const { decimalTransform } = require('../utils/decimal');

const paymentSchema = new mongoose.Schema({
  paymentReference: { type: String, required: true, trim: true },
  customerId: { type: String, required: true, trim: true, index: true },
  customerName: { type: String, required: true, trim: true },
  amount: { type: mongoose.Schema.Types.Decimal128, required: true },
  transactionDate: { type: Date, required: true },
  invoiceReference: { type: String, trim: true, default: '' },
  description: { type: String, trim: true, default: '' },
  currency: { type: String, required: true, enum: ['INR'], default: 'INR' },
  importBatchId: { type: String, required: true, index: true },
}, {
  timestamps: true,
  toJSON: { transform: decimalTransform },
  toObject: { transform: decimalTransform },
});

paymentSchema.index({ paymentReference: 1, importBatchId: 1 }, { unique: true });

module.exports = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);