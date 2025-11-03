// src/controllers/subscriptionController.js
const Subscription = require('../models/Subscription');
const { getRedisClient } = require('../config/redis');

const getSubscriptions = async (req, res, next) => {
  try {
    const { isActive, category, sort = 'nextRenewal', order = 'asc', page = 1, limit = 10 } = req.query;
    const userId = req.user._id;

    const cacheKey = `subs:${userId}:${JSON.stringify(req.query)}`;
    
    const redis = getRedisClient();
    if (redis) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          return res.json(JSON.parse(cached));
        }
      } catch (cacheError) {
        console.error('Cache get error:', cacheError);
      }
    }

    const filter = { userId };
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (category) filter.category = category;

    const skip = (page - 1) * limit;
    const sortOrder = order === 'desc' ? -1 : 1;

    const [subscriptions, count] = await Promise.all([
      Subscription.find(filter)
        .sort({ [sort]: sortOrder })
        .skip(skip)
        .limit(parseInt(limit)),
      Subscription.countDocuments(filter)
    ]);

    const result = {
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      subscriptions
    };

    if (redis) {
      try {
        await redis.setex(cacheKey, 300, JSON.stringify(result));
      } catch (cacheError) {
        console.error('Cache set error:', cacheError);
      }
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

const createSubscription = async (req, res, next) => {
  try {
    const subscription = new Subscription({
      ...req.body,
      userId: req.user._id
    });

    await subscription.save();

    const redis = getRedisClient();
    if (redis) {
      try {
        const keys = await redis.keys(`subs:${req.user._id}:*`);
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      } catch (cacheError) {
        console.error('Cache invalidate error:', cacheError);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Subscription created successfully',
      subscription
    });
  } catch (error) {
    next(error);
  }
};

const getSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Subscription not found',
        statusCode: 404
      });
    }

    res.json({
      success: true,
      subscription
    });
  } catch (error) {
    next(error);
  }
};

const updateSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Subscription not found',
        statusCode: 404
      });
    }

    const redis = getRedisClient();
    if (redis) {
      try {
        const keys = await redis.keys(`subs:${req.user._id}:*`);
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      } catch (cacheError) {
        console.error('Cache invalidate error:', cacheError);
      }
    }

    res.json({
      success: true,
      message: 'Subscription updated successfully',
      subscription
    });
  } catch (error) {
    next(error);
  }
};

const deleteSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Subscription not found',
        statusCode: 404
      });
    }

    const redis = getRedisClient();
    if (redis) {
      try {
        const keys = await redis.keys(`subs:${req.user._id}:*`);
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      } catch (cacheError) {
        console.error('Cache invalidate error:', cacheError);
      }
    }

    res.json({
      success: true,
      message: 'Subscription deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSubscriptions,
  createSubscription,
  getSubscription,
  updateSubscription,
  deleteSubscription
};