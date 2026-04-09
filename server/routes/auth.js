const router = require('express').Router();
const {
  register, adminRegister, generateInvite,
  login, getMe, getUsers, updateUser,
  deleteUser, resetPassword, changePassword,
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

// Public
router.post('/register', register);
router.post('/login', login);

// Own account
router.get('/me', protect, getMe);
router.patch('/change-password', protect, changePassword);

// Admin - create & invite
router.post('/admin-register', protect, authorize('superadmin', 'ministry'), adminRegister);
router.post('/generate-invite', protect, authorize('superadmin', 'ministry', 'office_admin'), generateInvite);

// Admin - user CRUD
router.get('/users', protect, authorize('superadmin', 'ministry', 'office_admin'), getUsers);
router.put('/users/:id', protect, authorize('superadmin', 'ministry'), updateUser);
router.delete('/users/:id', protect, authorize('superadmin'), deleteUser);
router.patch('/users/:id/reset-password', protect, authorize('superadmin', 'ministry'), resetPassword);
router.patch('/users/:id/approve', protect, authorize('superadmin', 'ministry'), async (req, res) => {
  try {
    const user = await require('../models/User').findByIdAndUpdate(
      req.params.id, { isActive: true }, { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User approved', user });
  } catch (err) { res.status(500).json({ message: err.message }); }
});
router.patch('/users/:id/reject', protect, authorize('superadmin', 'ministry'), async (req, res) => {
  try {
    await require('../models/User').findByIdAndDelete(req.params.id);
    res.json({ message: 'User registration rejected and removed' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
