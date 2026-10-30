'use strict';

const app = require('./app');
const config = require('./config/env');
const { connectDatabase } = require('./config/db');

async function startServer() {
  await connectDatabase();
  const server = app.listen(config.port, () => {
    console.log(`Invoice reconciliation API listening on port ${config.port}`);
  });

  const shutdown = () => {
    server.close(async (error) => {
      if (error) {
        console.error('HTTP server shutdown failed.', error);
        process.exitCode = 1;
      }
      const mongoose = require('mongoose');
      await mongoose.disconnect();
    });
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
  return server;
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error('Failed to start invoice reconciliation API.', error);
    process.exitCode = 1;
  });
}

module.exports = { startServer };