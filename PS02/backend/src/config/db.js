'use strict';

const mongoose = require('mongoose');
const config = require('./env');

async function connectDatabase() {
  try {
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 5000
    });

    console.log('✅ MongoDB connected successfully!');
    console.log('📦 Database:', mongoose.connection.name);
    console.log('🔗 Host:', mongoose.connection.host);

  } catch (error) {
    console.error('❌ MongoDB connection failed!');
    console.error('Reason:', error.message);
    throw error;
  }
}

module.exports = { connectDatabase };