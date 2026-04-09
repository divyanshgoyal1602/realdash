const router = require('express').Router();
const Office = require('../models/Office');

// Public endpoint to list active offices (used on the registration page)
router.get('/offices', async (_req, res) => {
  try {
    const offices = await Office.find({ isActive: true }).sort({ name: 1 });
    res.json({ offices });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

