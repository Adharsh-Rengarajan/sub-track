const { getRedisClient } = require('../config/redis');

class CacheService {
  static async get(key) {
    try {
      const redis = getRedisClient();
      if (!redis) return null;
      
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  static async set(key, value, ttl = 3600) {
    try {
      const redis = getRedisClient();
      if (!redis) return false;
      
      await redis.setex(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  static async del(key) {
    try {
      const redis = getRedisClient();
      if (!redis) return false;
      
      await redis.del(key);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  static async invalidatePattern(pattern) {
    try {
      const redis = getRedisClient();
      if (!redis) return false;
      
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
      return true;
    } catch (error) {
      console.error('Cache invalidate error:', error);
      return false;
    }
  }
}

module.exports = CacheService;