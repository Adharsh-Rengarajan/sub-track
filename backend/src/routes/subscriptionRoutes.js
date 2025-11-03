const express = require('express');
const { body, query, param } = require('express-validator');
const router = express.Router();
const auth = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const {
  getSubscriptions,
  createSubscription,
  getSubscription,
  updateSubscription,
  deleteSubscription
} = require('../controllers/subscriptionController');

router.use(auth);

router.get('/', [
  query('isActive').optional().isBoolean(),
  query('category').optional().isLength({ max: 50 }),
  query('sort').optional().isIn(['name', 'amount', 'nextRenewal', 'createdAt']),
  query('order').optional().isIn(['asc', 'desc']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  handleValidationErrors
], getSubscriptions);

router.post('/', [
  body('name').trim().notEmpty().isLength({ max: 100 }),
  body('amount').isFloat({ min: 0 }),
  body('currency').optional().isIn(['USD', 'EUR', 'GBP', 'CAD', 'AUD']),
  body('billingCycle').isIn(['monthly', 'quarterly', 'semi-annual', 'yearly']),
  body('nextRenewal').isISO8601(),
  body('category').trim().notEmpty().isLength({ max: 50 }),
  body('description').optional().isLength({ max: 500 }),
  body('isActive').optional().isBoolean(),
  body('reminderDays').optional().isInt({ min: 0, max: 30 }),
  body('autoRenew').optional().isBoolean(),
  body('paymentMethod').optional().isLength({ max: 100 }),
  handleValidationErrors
], createSubscription);

router.get('/:id', [
  param('id').isMongoId(),
  handleValidationErrors
], getSubscription);

router.put('/:id', [
  param('id').isMongoId(),
  body('name').optional().trim().notEmpty().isLength({ max: 100 }),
  body('amount').optional().isFloat({ min: 0 }),
  body('currency').optional().isIn(['USD', 'EUR', 'GBP', 'CAD', 'AUD']),
  body('billingCycle').optional().isIn(['monthly', 'quarterly', 'semi-annual', 'yearly']),
  body('nextRenewal').optional().isISO8601(),
  body('category').optional().trim().notEmpty().isLength({ max: 50 }),
  body('description').optional().isLength({ max: 500 }),
  body('isActive').optional().isBoolean(),
  body('reminderDays').optional().isInt({ min: 0, max: 30 }),
  body('autoRenew').optional().isBoolean(),
  body('paymentMethod').optional().isLength({ max: 100 }),
  handleValidationErrors
], updateSubscription);

router.delete('/:id', [
  param('id').isMongoId(),
  handleValidationErrors
], deleteSubscription);

module.exports = router;