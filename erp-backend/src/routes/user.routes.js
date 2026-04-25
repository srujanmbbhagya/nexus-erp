const express = require('express');
const router = express.Router();
const {
  getAllUsers, getUserById, updateUserRole, toggleUserStatus, deleteUser
} = require('../controllers/user.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// All user routes require login
router.use(protect);

router.get('/',               authorize('Admin', 'Manager'), getAllUsers);
router.get('/:id',            getUserById);
router.put('/:id/role',       authorize('Admin'), updateUserRole);
router.patch('/:id/status',   authorize('Admin'), toggleUserStatus);
router.delete('/:id',         authorize('Admin'), deleteUser);

module.exports = router;
