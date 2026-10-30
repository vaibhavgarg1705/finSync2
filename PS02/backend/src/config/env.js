'use strict';

require('dotenv').config();

const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || '3000'),
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/invoice_reconciliation',
  useTransactions: process.env.USE_TRANSACTIONS === 'true',
};

if (!Number.isInteger(config.port) || config.port < 1 || config.port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535');
}

module.exports = config;