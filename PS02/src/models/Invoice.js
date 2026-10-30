'use strict';

const mongoose = require('mongoose');
const { decimalTransform } = require('../utils/decimal');

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, trim: true },
  customerId: { type: String, required: true, trim: true, index: true },
  customerName: { type: String, required: true, trim: true },
  invoiceDate: { type: Date, required: true },
  dueDate: { type: Date, required: true },
  totalAmount: { type: mongoose.Schema.Types.Decimal128, required: true },
  currency: { type: String, required: true, enum: ['INR'], default: 'INR' },
  importBatchId: { type: String, required: true, index: true },
}, {
  timestamps: true,
  toJSON: { transform: decimalTransform },
  toObject: { transform: decimalTransform },
});

invoiceSchema.index({ invoiceNumber: 1, importBatchId: 1 }, { unique: true });

module.exports = mongoose.models.Invoice || mongoose.model('Invoice', invoiceSchema);