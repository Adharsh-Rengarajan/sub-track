const Subscription = require('../models/Subscription');

class AnalyticsService {
  static async calculateSpendingSummary(userId, currency = 'USD') {
    const subscriptions = await Subscription.find({ 
      userId, 
      isActive: true,
      currency 
    });

    const monthly = {};
    const yearly = {};
    let monthlyTotal = 0;
    let yearlyTotal = 0;

    const categoryTotals = {};

    subscriptions.forEach(sub => {
      let monthlyAmount = 0;
      
      switch (sub.billingCycle) {
        case 'monthly':
          monthlyAmount = sub.amount;
          break;
        case 'quarterly':
          monthlyAmount = sub.amount / 3;
          break;
        case 'semi-annual':
          monthlyAmount = sub.amount / 6;
          break;
        case 'yearly':
          monthlyAmount = sub.amount / 12;
          break;
      }

      monthlyTotal += monthlyAmount;
      yearlyTotal += monthlyAmount * 12;

      if (!categoryTotals[sub.category]) {
        categoryTotals[sub.category] = 0;
      }
      categoryTotals[sub.category] += monthlyAmount;
    });

    return {
      monthly: {
        total: Math.round(monthlyTotal * 100) / 100,
        activeSubscriptions: subscriptions.length,
        byCategory: Object.fromEntries(
          Object.entries(categoryTotals).map(([k, v]) => [k, Math.round(v * 100) / 100])
        )
      },
      yearly: {
        total: Math.round(yearlyTotal * 100) / 100,
        projectedTotal: Math.round(yearlyTotal * 1.1 * 100) / 100,
        savings: Math.round(yearlyTotal * 0.1 * 100) / 100
      },
      currency
    };
  }

  static async getCategoryBreakdown(userId, period = 'monthly') {
    const subscriptions = await Subscription.find({ 
      userId, 
      isActive: true 
    });

    const categories = {};
    let totalSpend = 0;

    subscriptions.forEach(sub => {
      if (!categories[sub.category]) {
        categories[sub.category] = {
          name: sub.category,
          count: 0,
          monthlySpend: 0,
          yearlySpend: 0,
          subscriptions: []
        };
      }

      let monthlyAmount = 0;
      
      switch (sub.billingCycle) {
        case 'monthly':
          monthlyAmount = sub.amount;
          break;
        case 'quarterly':
          monthlyAmount = sub.amount / 3;
          break;
        case 'semi-annual':
          monthlyAmount = sub.amount / 6;
          break;
        case 'yearly':
          monthlyAmount = sub.amount / 12;
          break;
      }

      categories[sub.category].count++;
      categories[sub.category].monthlySpend += monthlyAmount;
      categories[sub.category].yearlySpend += monthlyAmount * 12;
      categories[sub.category].subscriptions.push(sub.name);
      
      totalSpend += period === 'monthly' ? monthlyAmount : monthlyAmount * 12;
    });

    const categoryArray = Object.values(categories).map(cat => ({
      ...cat,
      monthlySpend: Math.round(cat.monthlySpend * 100) / 100,
      yearlySpend: Math.round(cat.yearlySpend * 100) / 100,
      percentage: Math.round((period === 'monthly' ? cat.monthlySpend : cat.yearlySpend) / totalSpend * 1000) / 10
    }));

    return { categories: categoryArray };
  }

  static async detectDuplicates(userId, threshold = 0.7) {
    const subscriptions = await Subscription.find({ 
      userId, 
      isActive: true 
    });

    const grouped = {};
    
    subscriptions.forEach(sub => {
      if (!grouped[sub.category]) {
        grouped[sub.category] = [];
      }
      grouped[sub.category].push(sub);
    });

    const potentialDuplicates = [];

    Object.entries(grouped).forEach(([category, subs]) => {
      if (subs.length > 1) {
        const similarity = this.calculateSimilarity(subs);
        
        if (similarity >= threshold) {
          const lowestAmount = Math.min(...subs.map(s => s.amount));
          
          potentialDuplicates.push({
            category,
            subscriptions: subs,
            similarityScore: similarity,
            potentialSavings: Math.round(lowestAmount * 100) / 100
          });
        }
      }
    });

    return { potentialDuplicates };
  }

  static calculateSimilarity(subscriptions) {
    if (subscriptions.length < 2) return 0;
    
    const names = subscriptions.map(s => s.name.toLowerCase());
    let totalSimilarity = 0;
    let comparisons = 0;
    
    for (let i = 0; i < names.length; i++) {
      for (let j = i + 1; j < names.length; j++) {
        const similarity = this.stringSimilarity(names[i], names[j]);
        totalSimilarity += similarity;
        comparisons++;
      }
    }
    
    return comparisons > 0 ? totalSimilarity / comparisons : 0;
  }

  static stringSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) {
      return 1.0;
    }
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  static levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  static async getUpcomingRenewals(userId, days = 7, includeInactive = false) {
    const filter = { userId };
    if (!includeInactive) {
      filter.isActive = true;
    }

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    filter.nextRenewal = {
      $gte: new Date(),
      $lte: endDate
    };

    const subscriptions = await Subscription.find(filter).sort('nextRenewal');

    let totalAmount = 0;
    const renewals = subscriptions.map(sub => {
      totalAmount += sub.amount;
      
      const daysUntil = Math.ceil(
        (sub.nextRenewal - new Date()) / (1000 * 60 * 60 * 24)
      );

      return {
        subscription: sub,
        daysUntilRenewal: daysUntil,
        renewalDate: sub.nextRenewal,
        estimatedCharge: sub.amount
      };
    });

    return {
      renewals,
      totalAmount: Math.round(totalAmount * 100) / 100
    };
  }
}

module.exports = AnalyticsService;