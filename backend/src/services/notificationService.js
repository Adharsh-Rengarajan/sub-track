const Subscription = require('../models/Subscription');
const User = require('../models/User');

class NotificationService {
  static async checkUpcomingRenewals() {
    try {
      const now = new Date();
      const checkDate = new Date();
      checkDate.setDate(checkDate.getDate() + 7);

      const subscriptions = await Subscription.find({
        isActive: true,
        nextRenewal: {
          $gte: now,
          $lte: checkDate
        },
        $or: [
          { lastNotified: null },
          { lastNotified: { $lt: new Date(now - 24 * 60 * 60 * 1000) } }
        ]
      }).populate('userId');

      for (const subscription of subscriptions) {
        const daysUntil = Math.ceil(
          (subscription.nextRenewal - now) / (1000 * 60 * 60 * 24)
        );

        if (daysUntil <= subscription.reminderDays) {
          await this.sendAlert(subscription.userId, subscription, daysUntil);
          subscription.lastNotified = now;
          await subscription.save();
        }
      }
    } catch (error) {
      console.error('Notification service error:', error);
    }
  }

  static async sendAlert(user, subscription, daysUntil) {
    console.log(`Alert: ${subscription.name} renews in ${daysUntil} days for ${user.email}`);
  }

  static scheduleNotifications() {
    setInterval(() => {
      this.checkUpcomingRenewals();
    }, 60 * 60 * 1000);
  }
}

module.exports = NotificationService;