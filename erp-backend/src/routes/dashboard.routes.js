const express = require('express');
const router = express.Router();
const { getDashboard, getProductivity } = require('../controllers/dashboard.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect);

router.get('/',             getDashboard);
router.get('/productivity', authorize('Admin', 'Manager'), getProductivity);

module.exports = router;
