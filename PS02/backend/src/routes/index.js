'use strict';

const express = require('express');
const importRoutes = require('./importRoutes');
const reconciliationRoutes = require('./reconciliationRoutes');

const router = express.Router();

router.use('/import', importRoutes);
router.use('/reconciliation', reconciliationRoutes);

module.exports = router;