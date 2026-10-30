'use strict';

const mongoose = require('mongoose');
const { connectDatabase } = require('./config/db');
const Invoice = require('./models/Invoice');
const Payment = require('./models/Payment');
const MatchSuggestion = require('./models/MatchSuggestion');
const Allocation = require('./models/Allocation');

async function ensureIndexes() {
  await connectDatabase();
  try {
    await Promise.all([
      Invoice.createIndexes(),
      Payment.createIndexes(),
      MatchSuggestion.createIndexes(),
      Allocation.createIndexes(),
    ]);
    console.log('Database indexes ensured.');
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  ensureIndexes().catch((error) => {
    console.error('Failed to ensure database indexes.', error);
    process.exitCode = 1;
  });
}

module.exports = { ensureIndexes };