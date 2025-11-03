const express = require('express');
const { query } = require('express-validator');
const router = express.Router();
const auth = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const {
  getSpendingSummary,
  getCategoryBreakdown,
  detectDuplicates,
  getUpcomingRenewals
} = require('../controllers/analyticsController');

router.use(auth);

router.get('/summary', [
  query('currency').optional().isIn(['USD', 'EUR', 'GBP', 'CAD', 'AUD']),
  handleValidationErrors
], getSpendingSummary);

router.get('/categories', [
  query('period').optional().isIn(['monthly', 'yearly']),
  handleValidationErrors
], getCategoryBreakdown);

router.get('/duplicates', [
  query('threshold').optional().isFloat({ min: 0, max: 1 }),
  handleValidationErrors
], detectDuplicates);

router.get('/upcoming', [
  query('days').optional().isInt({ min: 1, max: 90 }),
  query('includeInactive').optional().isBoolean(),
  handleValidationErrors
], getUpcomingRenewals);

module.exports = router;