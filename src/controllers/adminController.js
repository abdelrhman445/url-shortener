const User = require('../models/User');
const Link = require('../models/Link');
const Click = require('../models/Click');
const Log = require('../models/Log');

// Helper function for admin dashboard
function getActionText(action) {
    const actions = {
        'REGISTER': 'تسجيل جديد',
        'LOGIN': 'تسجيل دخول',
        'CREATE_LINK': 'إنشاء رابط',
        'DELETE_LINK': 'حذف رابط',
        'ACTIVATE_USER': 'تفعيل مستخدم',
        'DEACTIVATE_USER': 'تعطيل مستخدم',
        'CHANGE_ROLE': 'تغيير دور',
        'ADMIN_DELETE_LINK': 'حذف رابط (أدمن)',
        'ACTIVATE_LINK': 'تفعيل رابط',
        'DEACTIVATE_LINK': 'تعطيل رابط'
    };
    return actions[action] || action;
}

// Helper function for action details
function getActionDetails(action, details) {
    if (!details) return '-';
    
    switch(action) {
        case 'CREATE_LINK':
            return `إنشاء رابط: ${details.shortId}`;
        case 'DELETE_LINK':
        case 'ADMIN_DELETE_LINK':
            return `حذف رابط: ${details.linkId}`;
        case 'ACTIVATE_USER':
        case 'DEACTIVATE_USER':
            return `المستخدم: ${details.targetUserEmail}`;
        case 'CHANGE_ROLE':
            return `من ${details.oldRole} إلى ${details.newRole}`;
        default:
            return JSON.stringify(details);
    }
}

// Dashboard Page
exports.getDashboard = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalLinks = await Link.countDocuments();
        const totalClicks = await Click.countDocuments();
        
        const recentUsers = await User.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('name email role createdAt isActive');
        
        const recentLinks = await Link.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('createdBy', 'name email');

        const recentLogs = await Log.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('userId', 'name email');

        res.render('admin/dashboard', {
            user: req.user,
            stats: { 
                totalUsers, 
                totalLinks, 
                totalClicks 
            },
            recentUsers,
            recentLinks,
            recentLogs,
            baseUrl: process.env.BASE_URL || 'http://localhost:3000',
            getActionText: getActionText,
            getActionDetails: getActionDetails
        });
    } catch (error) {
        console.error('Admin dashboard error:', error);
        res.status(500).render('500');
    }
};

// Users Page
exports.getUsersPage = async (req, res) => {
    try {
        res.render('admin/users', {
            user: req.user,
            baseUrl: process.env.BASE_URL || 'http://localhost:3000'
        });
    } catch (error) {
        console.error('Get users page error:', error);
        res.status(500).render('500');
    }
};

// Links Page
exports.getLinksPage = async (req, res) => {
    try {
        res.render('admin/links', {
            user: req.user,
            baseUrl: process.env.BASE_URL || 'http://localhost:3000'
        });
    } catch (error) {
        console.error('Get links page error:', error);
        res.status(500).render('500');
    }
};

// Logs Page
exports.getLogsPage = async (req, res) => {
    try {
        res.render('admin/logs', {
            user: req.user
        });
    } catch (error) {
        console.error('Get logs page error:', error);
        res.status(500).render('500');
    }
};

// Get Users Data (API)
exports.getUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';

        let query = {};
        if (search) {
            query = {
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ]
            };
        }

        const users = await User.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .select('-password');

        const total = await User.countDocuments(query);
        const pages = Math.ceil(total / limit);

        res.json({
            success: true,
            users,
            page,
            pages,
            total
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'خطأ في السيرفر' });
    }
};

// Get All Links Data (API)
exports.getAllLinks = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';

        let query = {};
        if (search) {
            query = {
                $or: [
                    { originalUrl: { $regex: search, $options: 'i' } },
                    { shortId: { $regex: search, $options: 'i' } }
                ]
            };
        }

        const links = await Link.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('createdBy', 'name email');

        const total = await Link.countDocuments(query);
        const pages = Math.ceil(total / limit);

        res.json({
            success: true,
            links,
            page,
            pages,
            total,
            baseUrl: process.env.BASE_URL || 'http://localhost:3000'
        });
    } catch (error) {
        console.error('Get links error:', error);
        res.status(500).json({ error: 'خطأ في السيرفر' });
    }
};

// Get Logs Data (API)
exports.getLogs = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 20;
        const skip = (page - 1) * limit;

        const logs = await Log.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('userId', 'name email');

        const total = await Log.countDocuments();
        const pages = Math.ceil(total / limit);

        res.json({
            success: true,
            logs,
            page,
            pages,
            total
        });
    } catch (error) {
        console.error('Get logs error:', error);
        res.status(500).json({ error: 'خطأ في السيرفر' });
    }
};

// Toggle User Active/Inactive
exports.toggleUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({ error: 'المستخدم غير موجود' });
        }

        // Prevent self-deactivation
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ error: 'لا يمكنك تعطيل حسابك الخاص' });
        }

        user.isActive = !user.isActive;
        await user.save();

        // Log the action
        await Log.create({
            action: user.isActive ? 'ACTIVATE_USER' : 'DEACTIVATE_USER',
            userId: req.user._id,
            userEmail: req.user.email,
            details: { 
                targetUserId: user._id, 
                targetUserEmail: user.email 
            },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });

        res.json({ 
            success: true, 
            message: `تم ${user.isActive ? 'تفعيل' : 'تعطيل'} المستخدم بنجاح`,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isActive: user.isActive,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.error('Toggle user error:', error);
        res.status(500).json({ error: 'خطأ في السيرفر' });
    }
};

// Change User Role
exports.changeUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        
        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({ error: 'الدور غير صالح' });
        }

        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({ error: 'المستخدم غير موجود' });
        }

        // Prevent self-role change
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ error: 'لا يمكن تغيير دور حسابك الخاص' });
        }

        const oldRole = user.role;
        user.role = role;
        await user.save();

        // Log the action
        await Log.create({
            action: 'CHANGE_ROLE',
            userId: req.user._id,
            userEmail: req.user.email,
            details: { 
                targetUserId: user._id, 
                targetUserEmail: user.email, 
                oldRole, 
                newRole: role 
            },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });

        res.json({ 
            success: true, 
            message: `تم تغيير دور المستخدم إلى ${role === 'admin' ? 'مدير' : 'مستخدم'} بنجاح`,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isActive: user.isActive,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.error('Change role error:', error);
        res.status(500).json({ error: 'خطأ في السيرفر' });
    }
};

// Delete Link (Admin)
exports.deleteLink = async (req, res) => {
    try {
        const link = await Link.findById(req.params.id);
        
        if (!link) {
            return res.status(404).json({ error: 'الرابط غير موجود' });
        }

        // Get link info for logging before deletion
        const linkInfo = {
            id: link._id,
            shortId: link.shortId,
            originalUrl: link.originalUrl,
            createdBy: link.createdBy
        };

        await Link.deleteOne({ _id: req.params.id });
        await Click.deleteMany({ link: req.params.id });

        // Log the action
        await Log.create({
            action: 'ADMIN_DELETE_LINK',
            userId: req.user._id,
            userEmail: req.user.email,
            details: { 
                linkId: linkInfo.id,
                shortId: linkInfo.shortId,
                linkOwner: linkInfo.createdBy 
            },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });

        res.json({ 
            success: true, 
            message: 'تم حذف الرابط بنجاح' 
        });
    } catch (error) {
        console.error('Admin delete link error:', error);
        res.status(500).json({ error: 'خطأ في السيرفر' });
    }
};

// Toggle Link Active/Inactive
exports.toggleLink = async (req, res) => {
    try {
        const link = await Link.findById(req.params.id);
        
        if (!link) {
            return res.status(404).json({ error: 'الرابط غير موجود' });
        }

        link.isActive = !link.isActive;
        await link.save();

        // Log the action
        await Log.create({
            action: link.isActive ? 'ACTIVATE_LINK' : 'DEACTIVATE_LINK',
            userId: req.user._id,
            userEmail: req.user.email,
            details: { 
                linkId: link._id,
                shortId: link.shortId,
                linkOwner: link.createdBy 
            },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });

        res.json({ 
            success: true, 
            message: `تم ${link.isActive ? 'تفعيل' : 'إيقاف'} الرابط بنجاح`,
            link: {
                _id: link._id,
                shortId: link.shortId,
                originalUrl: link.originalUrl,
                clicks: link.clicks,
                isActive: link.isActive,
                createdAt: link.createdAt,
                lastClicked: link.lastClicked
            }
        });
    } catch (error) {
        console.error('Toggle link error:', error);
        res.status(500).json({ error: 'خطأ في السيرفر' });
    }
};

// Export helper functions for use in EJS templates
exports.getActionText = getActionText;
exports.getActionDetails = getActionDetails;