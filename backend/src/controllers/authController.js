const User = require('../models/User');
const { getRedisClient } = require('../config/redis');

const register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User already exists',
        message: 'An account with this email already exists',
        statusCode: 409
      });
    }

    const user = new User({ email, password, name });
    const { accessToken, refreshToken } = user.generateTokens();
    await user.save();

    const redis = getRedisClient();
    if (redis) {
      await redis.setex(`session:${user._id}`, 3600, JSON.stringify({
        tokenVersion: user.tokenVersion
      }));
    }

    res.status(201).json({
      success: true,
      accessToken,
      refreshToken,
      user,
      expiresIn: '1h'
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'Invalid email or password',
        statusCode: 401
      });
    }

    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'Invalid email or password',
        statusCode: 401
      });
    }

    const { accessToken, refreshToken } = user.generateTokens();
    await user.save();

    const redis = getRedisClient();
    if (redis) {
      await redis.setex(`session:${user._id}`, 3600, JSON.stringify({
        tokenVersion: user.tokenVersion
      }));
    }

    res.json({
      success: true,
      accessToken,
      refreshToken,
      user,
      expiresIn: '1h'
    });
  } catch (error) {
    next(error);
  }
};

const refreshAccessToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: 'Refresh token required',
        message: 'Please provide a refresh token',
        statusCode: 401
      });
    }

    const users = await User.find({ refreshToken: { $exists: true } });
    
    let validUser = null;
    for (const user of users) {
      if (user.validateRefreshToken(refreshToken)) {
        validUser = user;
        break;
      }
    }

    if (!validUser) {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token',
        message: 'Refresh token is invalid or expired',
        statusCode: 401
      });
    }

    const { accessToken, refreshToken: newRefreshToken } = validUser.generateTokens();
    await validUser.save();

    const redis = getRedisClient();
    if (redis) {
      await redis.setex(`session:${validUser._id}`, 3600, JSON.stringify({
        tokenVersion: validUser.tokenVersion
      }));
    }
    
    res.json({
      success: true,
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: '1h'
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const token = req.token;
    const user = req.user;
    
    user.refreshToken = undefined;
    user.refreshTokenExpiry = undefined;
    await user.save();
    
    const redis = getRedisClient();
    if (redis && token) {
      const decoded = req.tokenDecoded;
      const ttl = Math.max(decoded.exp - Math.floor(Date.now() / 1000), 0);
      if (ttl > 0) {
        await redis.setex(`blacklist:${token}`, ttl, '1');
      }
      await redis.del(`session:${user._id}`);
    }
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

const logoutAllDevices = async (req, res, next) => {
  try {
    const user = req.user;
    
    user.revokeAllTokens();
    await user.save();
    
    const redis = getRedisClient();
    if (redis) {
      await redis.del(`session:${user._id}`);
    }
    
    res.json({
      success: true,
      message: 'Logged out from all devices successfully'
    });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = req.user;
    
    const isValidPassword = await user.validatePassword(currentPassword);
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        error: 'Invalid password',
        message: 'Current password is incorrect',
        statusCode: 400
      });
    }
    
    user.password = newPassword;
    const { accessToken, refreshToken } = user.generateTokens();
    await user.save();
    
    const redis = getRedisClient();
    if (redis) {
      await redis.del(`session:${user._id}`);
      await redis.setex(`session:${user._id}`, 3600, JSON.stringify({
        tokenVersion: user.tokenVersion
      }));
    }
    
    res.json({
      success: true,
      message: 'Password changed successfully. All other sessions have been terminated.',
      accessToken,
      refreshToken,
      expiresIn: '1h'
    });
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    const user = req.user;

    if (name) user.name = name;
    if (email) user.email = email;

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  refreshAccessToken,
  logout,
  logoutAllDevices,
  changePassword,
  getProfile,
  updateProfile
};
