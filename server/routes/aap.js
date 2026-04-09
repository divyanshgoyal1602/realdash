const router = require('express').Router();
const AAPTarget = require('../models/AAPTarget');
const { protect, authorize } = require('../middleware/auth');

// GET AAP targets
router.get('/', protect, async (req, res) => {
  try {
    const { officeId, financialYear } = req.query;
    const filter = {};
    if (officeId) filter.office = officeId;
    if (financialYear) filter.financialYear = financialYear;
    if (['office_admin', 'office_staff'].includes(req.user.role) && req.user.office) {
      filter.office = req.user.office._id;
    }
    const targets = await AAPTarget.find(filter).populate('office', 'name code city').sort({ category: 1 });
    res.json({ targets });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create AAP target
router.post('/', protect, authorize('superadmin', 'ministry', 'office_admin'), async (req, res) => {
  try {
    const target = await AAPTarget.create(req.body);
    res.status(201).json({ target });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update AAP target
router.put('/:id', protect, authorize('superadmin', 'ministry', 'office_admin'), async (req, res) => {
  try {
    const target = await AAPTarget.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!target) return res.status(404).json({ message: 'Target not found' });
    res.json({ target });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE AAP target
router.delete('/:id', protect, authorize('superadmin', 'ministry'), async (req, res) => {
  try {
    await AAPTarget.findByIdAndDelete(req.params.id);
    res.json({ message: 'Target deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
