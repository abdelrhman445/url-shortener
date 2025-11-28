const express = require('express');
const { auth } = require('../middleware/auth');
const linkController = require('../controllers/linkController');

const router = express.Router();

router.use(auth);

// Dashboard pages
router.get('/', linkController.getDashboard);
router.get('/links', linkController.getUserLinks);

// Link operations
router.post('/links', linkController.createLink);
router.delete('/links/:id', linkController.deleteLink);
router.get('/links/:id/analytics', linkController.getLinkAnalytics);

module.exports = router;