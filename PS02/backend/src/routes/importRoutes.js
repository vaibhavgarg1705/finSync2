'use strict';

const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const controller = require('../controllers/importController');

const router = express.Router();

router.post('/invoices', asyncHandler(controller.importInvoices));
router.post('/payments', asyncHandler(controller.importPayments));

module.exports = router;