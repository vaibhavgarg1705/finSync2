'use strict';

const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const controller = require('../controllers/reconciliationController');

const router = express.Router();

router.post('/match', asyncHandler(controller.runMatching));
router.get('/suggestions', asyncHandler(controller.getSuggestions));
router.post('/suggestions/:id/confirm', asyncHandler(controller.confirmSuggestion));
router.post('/suggestions/:id/reject', asyncHandler(controller.rejectSuggestion));
router.post('/allocations', asyncHandler(controller.createManualAllocation));
router.get('/balances', asyncHandler(controller.getBalances));

module.exports = router;