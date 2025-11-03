const Redis = require('ioredis');

let redisClient;

const connectRedis = async () => {
  try {
    redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    redisClient.on('connect', () => {
      console.log('Redis connected successfully');
    });

    redisClient.on('error', (err) => {
      console.error('Redis connection error:', err);
    });

    await redisClient.ping();
  } catch (error) {
    console.error('Redis initialization error:', error);
  }
};

const getRedisClient = () => redisClient;

module.exports = { connectRedis, getRedisClient };