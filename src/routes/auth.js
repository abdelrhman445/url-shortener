const express = require('express');
const { body } = require('express-validator');
const { register, login, logout, getMe } = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // زيادة الحد ليكون أكثر مرونة
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

// API routes
router.post('/register', authLimiter, registerValidation, register);
router.post('/login', authLimiter, loginValidation, login);
router.post('/logout', auth, logout);
router.get('/me', auth, getMe);

// Render pages
router.get('/login', (req, res) => res.render('auth/login'));
router.get('/register', (req, res) => res.render('auth/register'));
router.get('/', (req, res) => res.render('home'));
// تم إزالة route الـ logout من هنا لأنه موجود في server.js
