const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getRedisClient } = require('../config/redis');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_here');
    
    const redis = getRedisClient();
    if (redis) {
      const isBlacklisted = await redis.get(`blacklist:${token}`);
      if (isBlacklisted) {
        throw new Error('Token has been revoked');
      }
    }
    
    const user = await User.findById(decoded._id);

    if (!user) {
      throw new Error();
    }
    
    if (user.tokenVersion && decoded.version !== user.tokenVersion) {
      throw new Error('Token version mismatch');
    }

    req.user = user;
    req.token = token;
    req.tokenDecoded = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Authentication token is missing or invalid',
      statusCode: 401
    });
  }
};

module.exports = auth;