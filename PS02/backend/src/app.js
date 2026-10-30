'use strict';

const express = require('express');
const routes = require('./routes');
const cors = require("cors");
const { ApiError } = require('./utils/errors');

const app = express();


app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173"
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  })
);


app.disable('x-powered-by');
app.use(express.text({ type: ['text/csv', 'application/csv'], limit: '5mb' }));
app.use(express.json({ limit: '5mb' }));

app.get('/health', (_req, res) => {
  res.json({ success: true, status: 'ok' });
});
app.use('/api', routes);

app.use((_req, _res, next) => {
  next(new ApiError(404, 'NOT_FOUND', 'The requested endpoint was not found.'));
});

app.use((error, _req, res, _next) => {
  if (error instanceof ApiError) {
    return res.status(error.status).json({
      success: false,
      error: { code: error.code, message: error.message, details: error.details },
    });
  }
  if (error && error.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_JSON', message: 'Request body contains invalid JSON.' },
    });
  }
  if (error && error.code === 11000) {
    return res.status(409).json({
      success: false,
      error: { code: 'DUPLICATE_RECORD', message: 'A record with the same reference already exists in this batch.' },
    });
  }
  if (error && error.name === 'ValidationError') {
    return res.status(422).json({
      success: false,
      error: { code: 'VALIDATION_FAILED', message: error.message },
    });
  }

  console.error(error);
  return res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected server error occurred.' },
  });
});

module.exports = app;