const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  tokenVersion: {
    type: String,
    default: () => Date.now().toString()
  },
  refreshToken: {
    type: String
  },
  refreshTokenExpiry: {
    type: Date
  },
  preferences: {
    currency: {
      type: String,
      enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
      default: 'USD',
    },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
    },
  },
}, {
  timestamps: true,
});

userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.refreshToken;
  delete user.tokenVersion;
  return user;
};

userSchema.methods.generateTokens = function() {
  this.tokenVersion = Date.now().toString();
  
  const accessToken = jwt.sign(
    { 
      _id: this._id, 
      email: this.email,
      version: this.tokenVersion
    },
    process.env.JWT_SECRET || 'your_jwt_secret_key_here',
    { expiresIn: process.env.JWT_EXPIRE || '1h' }
  );
  
  const refreshToken = crypto.randomBytes(32).toString('hex');
  const hashedRefreshToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
  
  this.refreshToken = hashedRefreshToken;
  this.refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  
  return { accessToken, refreshToken };
};

userSchema.methods.validateRefreshToken = function(refreshToken) {
  if (!this.refreshToken || !this.refreshTokenExpiry) {
    return false;
  }
  
  if (this.refreshTokenExpiry < new Date()) {
    return false;
  }
  
  const hashedToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
  return this.refreshToken === hashedToken;
};

userSchema.methods.validatePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.revokeAllTokens = function() {
  this.tokenVersion = Date.now().toString();
  this.refreshToken = undefined;
  this.refreshTokenExpiry = undefined;
};

userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
    this.tokenVersion = Date.now().toString();
  }
  next();
});

module.exports = mongoose.model('User', userSchema);
