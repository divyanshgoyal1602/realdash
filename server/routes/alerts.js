const router = require('express').Router();
const Alert = require('../models/Alert');
const { protect, authorize } = require('../middleware/auth');

// GET alerts
router.get('/', protect, async (req, res) => {
  try {
    const filter = {};
    if (['office_admin', 'office_staff'].includes(req.user.role) && req.user.office) {
      filter.$or = [{ office: req.user.office._id }, { office: null }];
    }
    const rawAlerts = await Alert.find(filter)
      .populate('office', 'name code')
      .sort({ createdAt: -1 })
      .limit(50);

    // Compute per-user isRead from the readBy array
    const userId = req.user._id.toString();
    const alerts = rawAlerts.map((a) => ({
      ...a.toObject(),
      isRead: a.readBy.some((id) => id.toString() === userId),
    }));

    res.json({ alerts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create alert
router.post('/', protect, authorize('superadmin', 'ministry', 'office_admin'), async (req, res) => {
  try {
    const alert = await Alert.create(req.body);
    req.app.get('io').emit('alert:new', alert);
    res.status(201).json({ alert });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PATCH mark as read
router.patch('/:id/read', protect, async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { isRead: true, $addToSet: { readBy: req.user._id } },
      { new: true }
    );
    res.json({ alert });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH mark all read
router.patch('/mark-all-read', protect, async (req, res) => {
  try {
    // Only update alerts this user hasn't read yet
    await Alert.updateMany(
      { readBy: { $ne: req.user._id } },
      { $addToSet: { readBy: req.user._id } }
    );
    res.json({ message: 'All alerts marked as read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE alert (superadmin / ministry only)
router.delete('/:id', protect, authorize('superadmin', 'ministry'), async (req, res) => {
  try {
    await Alert.findByIdAndDelete(req.params.id);
    res.json({ message: 'Alert deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

