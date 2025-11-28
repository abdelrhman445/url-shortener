const express = require('express');
const Link = require('../models/Link');
const Click = require('../models/Click');
const useragent = require('useragent');

const router = express.Router();

// ==================== 🔧 إضافة: قائمة بالـ routes المحجوزة ====================
const reservedPaths = [
  'login', 'register', 'logout', 'dashboard', 'admin', 
  'api', 'health', 'favicon.ico', 'home'
];

router.get('/:shortId', async (req, res) => {
  try {
    // تحقق إذا كان المسار محجوزاً
    if (reservedPaths.includes(req.params.shortId)) {
      return next(); // انتقل للـ route التالي
    }

    const link = await Link.findOne({ shortId: req.params.shortId, isActive: true });
    
    if (!link) {
      return res.status(404).render('404');
    }

    // Update click count
    link.clicks += 1;
    link.lastClicked = new Date();
    await link.save();

    // Record click analytics
    const agent = useragent.parse(req.get('User-Agent'));
    
    await Click.create({
      link: link._id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      browser: agent.family,
      platform: agent.os.family,
      referrer: req.get('referer') || 'Direct'
    });

    res.redirect(link.originalUrl);
  } catch (error) {
    console.error('Redirect error:', error);
    res.status(500).render('500');
  }
});

module.exports = router;
