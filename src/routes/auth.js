const express = require('express');
const { body } = require('express-validator');
const { register, login, logout, getMe } = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { error: 'محاولات تسجيل دخول كثيرة، حاول مرة أخرى بعد 15 دقيقة' }
});

// Validation rules
const registerValidation = [
  body('name').notEmpty().withMessage('الاسم مطلوب'),
  body('email').isEmail().withMessage('بريد إلكتروني صالح مطلوب'),
  body('password').isLength({ min: 6 }).withMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
];

const loginValidation = [
  body('email').isEmail().withMessage('بريد إلكتروني صالح مطلوب'),
  body('password').notEmpty().withMessage('كلمة المرور مطلوبة')
];

// ==================== 🔧 إصلاح: تعريف Routes بشكل صحيح ====================
// Render pages - يجب أن تكون قبل الـ API routes
router.get('/login', (req, res) => {
  console.log('✅ /login route accessed');
  res.render('auth/login');
});

router.get('/register', (req, res) => {
  console.log('✅ /register route accessed');
  res.render('auth/register');
});

router.get('/', (req, res) => {
  console.log('✅ Home route accessed');
  res.render('home');
});

// API routes
router.post('/api/register', authLimiter, registerValidation, register);
router.post('/api/login', authLimiter, loginValidation, login);
router.post('/api/logout', auth, logout);
router.get('/api/me', auth, getMe);
// ==================== نهاية الإصلاح ====================

module.exports = router;
