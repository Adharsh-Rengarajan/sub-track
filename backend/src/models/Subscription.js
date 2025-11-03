const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  currency: {
    type: String,
    enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
    default: 'USD',
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'quarterly', 'semi-annual', 'yearly'],
    required: true,
  },
  nextRenewal: {
    type: Date,
    required: true,
  },
  category: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50,
  },
  description: {
    type: String,
    maxlength: 500,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  reminderDays: {
    type: Number,
    default: 3,
    min: 0,
    max: 30,
  },
  autoRenew: {
    type: Boolean,
    default: true,
  },
  paymentMethod: {
    type: String,
    maxlength: 100,
  },
  lastNotified: {
    type: Date,
  },
}, {
  timestamps: true,
});

subscriptionSchema.methods.calculateNextRenewal = function() {
  const currentDate = new Date(this.nextRenewal);
  
  switch (this.billingCycle) {
    case 'monthly':
      currentDate.setMonth(currentDate.getMonth() + 1);
      break;
    case 'quarterly':
      currentDate.setMonth(currentDate.getMonth() + 3);
      break;
    case 'semi-annual':
      currentDate.setMonth(currentDate.getMonth() + 6);
      break;
    case 'yearly':
      currentDate.setFullYear(currentDate.getFullYear() + 1);
      break;
  }
  
  return currentDate;
};

subscriptionSchema.index({ userId: 1, nextRenewal: 1 });
subscriptionSchema.index({ userId: 1, category: 1 });
subscriptionSchema.index({ userId: 1, isActive: 1 });

module.exports = mongoose.model('Subscription', subscriptionSchema);