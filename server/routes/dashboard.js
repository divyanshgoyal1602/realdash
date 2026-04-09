const router = require('express').Router();
const { getSummary, getTrends, getCategoryBreakdown } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

router.get('/summary', protect, getSummary);
router.get('/trends', protect, getTrends);
router.get('/category-breakdown', protect, getCategoryBreakdown);

module.exports = router;
