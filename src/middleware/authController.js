const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const Log = require('../models/Log');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'fallback-secret', {
    expiresIn: '30d',
  });
};

exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'البريد الإلكتروني مسجل مسبقاً' });
    }

    const user = await User.create({ name, email, password });

    // Log the action
    await Log.create({
      action: 'REGISTER',
      userId: user._id,
      userEmail: user.email,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    const token = generateToken(user._id);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في السيرفر' });
  }
};

exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.correctPassword(password, user.password))) {
      return res.status(401).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
    }

    if (!user.isActive) {
      return res.status(401).json({ error: 'الحساب معطل' });
    }

    // Log the action
    await Log.create({
      action: 'LOGIN',
      userId: user._id,
      userEmail: user.email,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    const token = generateToken(user._id);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في السيرفر' });
  }
};

exports.logout = async (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0)
  });
  res.json({ success: true, message: 'تم تسجيل الخروج بنجاح' });
};

exports.getMe = async (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
};