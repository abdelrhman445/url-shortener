const Link = require('../models/Link');
const Click = require('../models/Click');
const { validationResult } = require('express-validator');
const Log = require('../models/Log');
const shortid = require('shortid');

exports.getDashboard = async (req, res) => {
  try {
    const links = await Link.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 })
      .limit(10);
    
    const totalClicks = await Link.aggregate([
      { $match: { createdBy: req.user._id } },
      { $group: { _id: null, total: { $sum: '$clicks' } } }
    ]);

    res.render('dashboard/index', { 
      user: req.user, 
      links,
      totalClicks: totalClicks[0]?.total || 0,
      baseUrl: process.env.BASE_URL || 'http://localhost:3000'
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).render('500');
  }
};

exports.getUserLinks = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const links = await Link.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Link.countDocuments({ createdBy: req.user._id });
    const pages = Math.ceil(total / limit);

    res.json({
      success: true,
      links,
      page,
      pages,
      total
    });
  } catch (error) {
    console.error('Get user links error:', error);
    res.status(500).json({ error: 'خطأ في السيرفر' });
  }
};

exports.createLink = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { originalUrl } = req.body;

    // Check if user has reached link limit
    const userLinksCount = await Link.countDocuments({ createdBy: req.user._id });
    if (userLinksCount >= req.user.maxLinks) {
      return res.status(400).json({ 
        error: `لقد وصلت إلى الحد الأقصى لعدد الروابط (${req.user.maxLinks})` 
      });
    }

    // Validate URL format
    try {
      new URL(originalUrl);
    } catch (error) {
      return res.status(400).json({ error: 'رابط غير صالح' });
    }

    const link = await Link.create({
      originalUrl,
      createdBy: req.user._id,
      shortId: shortid.generate()
    });

    // Log the action
    await Log.create({
      action: 'CREATE_LINK',
      userId: req.user._id,
      userEmail: req.user.email,
      details: { 
        linkId: link._id, 
        shortId: link.shortId,
        originalUrl: link.originalUrl 
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(201).json({
      success: true,
      link: {
        shortId: link.shortId,
        originalUrl: link.originalUrl,
        clicks: link.clicks,
        createdAt: link.createdAt,
        _id: link._id,
        // إرجاع رابط المعاينة الجديد
        previewUrl: `${process.env.BASE_URL || 'http://localhost:3000'}/r/${link.shortId}`,
        directUrl: `${process.env.BASE_URL || 'http://localhost:3000'}/go/${link.shortId}`
      }
    });
  } catch (error) {
    console.error('Create link error:', error);
    res.status(500).json({ error: 'خطأ في السيرفر' });
  }
};

exports.deleteLink = async (req, res) => {
  try {
    const link = await Link.findOne({ _id: req.params.id, createdBy: req.user._id });
    
    if (!link) {
      return res.status(404).json({ error: 'الرابط غير موجود' });
    }

    await Link.deleteOne({ _id: req.params.id });
    await Click.deleteMany({ link: req.params.id });

    // Log the action
    await Log.create({
      action: 'DELETE_LINK',
      userId: req.user._id,
      userEmail: req.user.email,
      details: { linkId: req.params.id },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({ 
      success: true, 
      message: 'تم حذف الرابط بنجاح' 
    });
  } catch (error) {
    console.error('Delete link error:', error);
    res.status(500).json({ error: 'خطأ في السيرفر' });
  }
};

exports.getLinkAnalytics = async (req, res) => {
  try {
    const link = await Link.findOne({ 
      _id: req.params.id, 
      createdBy: req.user._id 
    });
    
    if (!link) {
      return res.status(404).json({ error: 'الرابط غير موجود' });
    }

    const clicks = await Click.find({ link: req.params.id })
      .sort({ createdAt: -1 })
      .limit(50);
    
    const totalClicks = await Click.countDocuments({ link: req.params.id });

    // Get clicks by browser
    const clicksByBrowser = await Click.aggregate([
      { $match: { link: link._id } },
      { $group: { _id: '$browser', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get clicks by day for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const clicksByDay = await Click.aggregate([
      {
        $match: {
          link: link._id,
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      link,
      analytics: {
        totalClicks,
        clicks,
        clicksByBrowser,
        clicksByDay
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'خطأ في السيرفر' });
  }
};
