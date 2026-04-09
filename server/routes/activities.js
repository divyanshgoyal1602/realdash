const router = require('express').Router();
const {
  getActivities,
  createActivity,
  updateActivity,
  deleteActivity,
} = require('../controllers/activityController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, getActivities);
router.post('/', protect, authorize('superadmin', 'ministry', 'office_admin', 'office_staff'), createActivity);
router.put('/:id', protect, authorize('superadmin', 'ministry', 'office_admin', 'office_staff'), updateActivity);
router.delete('/:id', protect, authorize('superadmin', 'ministry', 'office_admin'), deleteActivity);

module.exports = router;
