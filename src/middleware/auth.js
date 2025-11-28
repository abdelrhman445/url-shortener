const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    let token = req.cookies?.token;
    
    // إذا مفيش token في الكوكيز، نشوف في الـ header
    if (!token && req.headers.authorization) {
      token = req.headers.authorization.replace('Bearer ', '');
    }
    
    if (!token) {
      return res.redirect('/login');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user || !user.isActive) {
      // إذا المستخدم مش موجود أو مش نشط، نمسح الكوكي
      res.cookie('token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        expires: new Date(0),
        path: '/'
      });
      return res.redirect('/login');
    }

    req.user = user;
    next();
  } catch (error) {
    // إذا كان التوكن منتهي أو غير صالح، نمسح الكوكي ونوجه لل login
    res.cookie('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      expires: new Date(0),
      path: '/'
    });
    res.redirect('/login');
  }
};

const adminAuth = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).render('error', { 
        message: 'غير مصرح - تحتاج صلاحيات أدمن' 
      });
    }
    next();
  } catch (error) {
    res.status(500).render('error', { message: 'خطأ في التحقق من الصلاحيات' });
  }
};

module.exports = { auth, adminAuth };
