const calculateMonthlyAmount = (amount, billingCycle) => {
  switch (billingCycle) {
    case 'monthly':
      return amount;
    case 'quarterly':
      return amount / 3;
    case 'semi-annual':
      return amount / 6;
    case 'yearly':
      return amount / 12;
    default:
      return amount;
  }
};

const calculateNextRenewalDate = (currentDate, billingCycle) => {
  const nextDate = new Date(currentDate);
  
  switch (billingCycle) {
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case 'quarterly':
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
    case 'semi-annual':
      nextDate.setMonth(nextDate.getMonth() + 6);
      break;
    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
  }
  
  return nextDate;
};

const formatCurrency = (amount, currency = 'USD') => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  });
  
  return formatter.format(amount);
};

const getDaysUntilRenewal = (renewalDate) => {
  const now = new Date();
  const renewal = new Date(renewalDate);
  const diffTime = renewal - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

const validateSubscriptionDate = (date) => {
  const inputDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return inputDate >= today;
};

const generateCacheKey = (prefix, userId, params = {}) => {
  const paramString = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}:${value}`)
    .join(':');
    
  return paramString 
    ? `${prefix}:${userId}:${paramString}`
    : `${prefix}:${userId}`;
};

const sanitizeUser = (user) => {
  const userObj = user.toObject ? user.toObject() : user;
  delete userObj.password;
  delete userObj.refreshToken;
  delete userObj.tokenVersion;
  delete userObj.__v;
  
  return userObj;
};

const parseBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }
  return false;
};

const roundToTwoDecimals = (num) => {
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

const getDateRange = (period) => {
  const endDate = new Date();
  const startDate = new Date();
  
  switch (period) {
    case 'week':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case 'quarter':
      startDate.setMonth(startDate.getMonth() - 3);
      break;
    case 'year':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    default:
      startDate.setMonth(startDate.getMonth() - 1);
  }
  
  return { startDate, endDate };
};

module.exports = {
  calculateMonthlyAmount,
  calculateNextRenewalDate,
  formatCurrency,
  getDaysUntilRenewal,
  validateSubscriptionDate,
  generateCacheKey,
  sanitizeUser,
  parseBoolean,
  roundToTwoDecimals,
  getDateRange
};