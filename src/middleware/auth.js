const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.cookies?.token || req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.redirect('/login');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user || !user.isActive) {
      return res.redirect('/login');
    }

    req.user = user;
    next();
  } catch (error) {
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