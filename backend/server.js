const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/subtrak', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

try {
  const authRoutes = require('./src/routes/authRoutes');
  const subscriptionRoutes = require('./src/routes/subscriptionRoutes');
  const analyticsRoutes = require('./src/routes/analyticsRoutes');
  
  app.use('/api/auth', authRoutes);
  app.use('/api/subscriptions', subscriptionRoutes);
  app.use('/api/analytics', analyticsRoutes);
} catch (error) {
  console.error('Error loading routes:', error.message);
}

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

app.use((err, req, res, next) => {
  const error = { ...err };
  error.message = err.message;

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error',
    message: error.message || 'An unexpected error occurred',
    statusCode: error.statusCode || 500
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    
    try {
      const { connectRedis } = require('./src/config/redis');
      await connectRedis();
    } catch (redisError) {
      console.warn('Redis connection failed, continuing without cache:', redisError.message);
    }
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();