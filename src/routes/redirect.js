const express = require('express');
const Link = require('../models/Link');
const Click = require('../models/Click');
const useragent = require('useragent');

const router = express.Router();

// صفحة وسيطة للريدايركت
router.get('/r/:shortId', async (req, res) => {
  try {
    const link = await Link.findOne({ shortId: req.params.shortId, isActive: true });
    
    if (!link) {
      return res.status(404).render('404');
    }

    res.render('redirect', {
      targetUrl: link.originalUrl,
      shortId: link.shortId,
      baseUrl: process.env.BASE_URL || 'http://localhost:3000'
    });
  } catch (error) {
    console.error('Redirect page error:', error);
    res.status(500).render('500');
  }
});

// الريدايركت الفعلي
router.get('/go/:shortId', async (req, res) => {
  try {
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

// للحفاظ على التوافق مع الروابط القديمة
router.get('/:shortId', async (req, res) => {
  try {
    const link = await Link.findOne({ shortId: req.params.shortId, isActive: true });
    
    if (!link) {
      return res.status(404).render('404');
    }

    // إعادة التوجيه إلى صفحة المعاينة بدلاً من الرابط المباشر
    res.redirect(`/r/${req.params.shortId}`);
  } catch (error) {
    console.error('Legacy redirect error:', error);
    res.status(500).render('500');
  }
});

module.exports = router;
