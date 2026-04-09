const router = require('express').Router();
const Office = require('../models/Office');
const { protect, authorize } = require('../middleware/auth');

// GET all offices
router.get('/', protect, async (req, res) => {
  try {
    const offices = await Office.find({ isActive: true }).sort({ name: 1 });
    res.json({ offices });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single office
router.get('/:id', protect, async (req, res) => {
  try {
    const office = await Office.findById(req.params.id);
    if (!office) return res.status(404).json({ message: 'Office not found' });
    res.json({ office });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create office
router.post('/', protect, authorize('superadmin', 'ministry'), async (req, res) => {
  try {
    const office = await Office.create(req.body);
    res.status(201).json({ office });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update office
router.put('/:id', protect, authorize('superadmin', 'ministry', 'office_admin'), async (req, res) => {
  try {
    const office = await Office.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!office) return res.status(404).json({ message: 'Office not found' });
    res.json({ office });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
