const express = require('express');
const { auth, adminAuth } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

const router = express.Router();

// Apply auth and admin auth to all routes
router.use(auth, adminAuth);

// Admin pages - Render
router.get('/', adminController.getDashboard);
router.get('/users', adminController.getUsersPage);
router.get('/links', adminController.getLinksPage);
router.get('/logs', adminController.getLogsPage);

// API routes for data
router.get('/users/data', adminController.getUsers);
router.get('/links/data', adminController.getAllLinks);
router.get('/logs/data', adminController.getLogs);

// User management
router.patch('/users/:id/toggle', adminController.toggleUser);
router.patch('/users/:id/role', adminController.changeUserRole);

// Link management
router.delete('/links/:id', adminController.deleteLink);
router.patch('/links/:id/toggle', adminController.toggleLink);

module.exports = router;