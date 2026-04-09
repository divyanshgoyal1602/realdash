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

module.exports = router;
