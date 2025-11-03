const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const auth = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const {
  register,
  login,
  refreshAccessToken,
  logout,
  logoutAllDevices,
  changePassword,
  getProfile,
  updateProfile
} = require('../controllers/authController');

router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').trim().isLength({ min: 2, max: 50 }),
  handleValidationErrors
], register);

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  handleValidationErrors
], login);

router.post('/refresh', [
  body('refreshToken').notEmpty(),
  handleValidationErrors
], refreshAccessToken);

router.post('/logout', auth, logout);

router.post('/logout-all', auth, logoutAllDevices);

router.post('/change-password', auth, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 }),
  handleValidationErrors
], changePassword);

router.get('/profile', auth, getProfile);

router.put('/profile', auth, [
  body('email').optional().isEmail().normalizeEmail(),
  body('name').optional().trim().isLength({ min: 2, max: 50 }),
  handleValidationErrors
], updateProfile);

module.exports = router;