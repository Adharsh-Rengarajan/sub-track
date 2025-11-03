const SUGGESTED_CATEGORIES = [
  'Entertainment',
  'Software',
  'Education',
  'Fitness',
  'News',
  'Music',
  'Gaming',
  'Cloud Storage',
  'Other'
];

const BILLING_CYCLES = [
  'monthly',
  'quarterly',
  'semi-annual',
  'yearly'
];

const CURRENCIES = [
  'USD',
  'EUR',
  'GBP',
  'CAD',
  'AUD'
];

const CACHE_TTL = {
  SHORT: 300,
  MEDIUM: 600,
  LONG: 3600,
  DAY: 86400
};

const NOTIFICATION_TYPES = {
  RENEWAL_REMINDER: 'renewal_reminder',
  PAYMENT_FAILED: 'payment_failed',
  SUBSCRIPTION_EXPIRED: 'subscription_expired',
  DUPLICATE_DETECTED: 'duplicate_detected'
};

module.exports = {
  SUGGESTED_CATEGORIES,
  BILLING_CYCLES,
  CURRENCIES,
  CACHE_TTL,
  NOTIFICATION_TYPES
};