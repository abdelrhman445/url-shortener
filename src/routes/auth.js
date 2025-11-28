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

// ==================== 🔧 إصلاح: إرجاع المسارات إلى وضعها الطبيعي ====================
// Render pages
router.get('/login', (req, res) => {
  console.log('✅ GET /login route accessed');
  res.render('auth/login');
});

router.get('/register', (req, res) => {
  console.log('✅ GET /register route accessed');
  res.render('auth/register');
});

router.get('/', (req, res) => {
  console.log('✅ Home route accessed');
  res.render('home');
});

// API routes - استخدام نفس المسارات بدون /api
router.post('/login', authLimiter, loginValidation, login);
router.post('/register', authLimiter, registerValidation, register);
router.post('/logout', auth, logout);
router.get('/me', auth, getMe);
// ==================== نهاية الإصلاح ====================

module.exports = router;
