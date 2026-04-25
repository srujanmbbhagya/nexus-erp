const asyncHandler = require('express-async-handler');
const User = require('../models/User.model');
const Project = require('../models/Project.model');
const Task = require('../models/Task.model');

// @desc    Get all users (Admin / Manager only)
// @route   GET /api/users
// @access  Private/Admin/Manager
const getAllUsers = asyncHandler(async (req, res) => {
  const { role, search, page = 1, limit = 20 } = req.query;

  const filter = { isActive: true };
  if (role) filter.role = role;
  if (search) filter.$or = [
    { name: { $regex: search, $options: 'i' } },
    { email: { $regex: search, $options: 'i' } }
  ];

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const total = await User.countDocuments(filter);
  const users = await User.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  res.json({
    success: true,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit),
    users
  });
});

// @desc    Get single user by ID
// @route   GET /api/users/:id
// @access  Private
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) { res.status(404); throw new Error('User not found'); }

  // Get stats for this user
  const assignedTasks = await Task.find({ assignedTo: user._id });
  const projects = await Project.find({ members: user._id });

  res.json({
    success: true,
    user,
    stats: {
      totalTasks: assignedTasks.length,
      doneTasks: assignedTasks.filter(t => t.status === 'Done').length,
      inProgressTasks: assignedTasks.filter(t => t.status === 'In Progress').length,
      totalProjects: projects.length
    }
  });
});

// @desc    Update user role (Admin only)
// @route   PUT /api/users/:id/role
// @access  Private/Admin
const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!['Admin', 'Manager', 'Developer'].includes(role)) {
    res.status(400); throw new Error('Invalid role');
  }

  // Prevent admin from demoting themselves
  if (req.params.id === req.user._id.toString() && role !== 'Admin') {
    res.status(400); throw new Error('You cannot change your own role');
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role },
    { new: true, runValidators: true }
  );

  if (!user) { res.status(404); throw new Error('User not found'); }
  res.json({ success: true, message: `Role updated to ${role}`, user });
});

// @desc    Deactivate / reactivate user (Admin only)
// @route   PATCH /api/users/:id/status
// @access  Private/Admin
const toggleUserStatus = asyncHandler(async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    res.status(400); throw new Error('You cannot deactivate yourself');
  }

  const user = await User.findById(req.params.id);
  if (!user) { res.status(404); throw new Error('User not found'); }

  user.isActive = !user.isActive;
  await user.save();

  res.json({
    success: true,
    message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
    user
  });
});

// @desc    Delete user (Admin only)
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    res.status(400); throw new Error('You cannot delete yourself');
  }

  const user = await User.findById(req.params.id);
  if (!user) { res.status(404); throw new Error('User not found'); }

  // Remove user from all project members
  await Project.updateMany({ members: user._id }, { $pull: { members: user._id } });

  await user.deleteOne();
  res.json({ success: true, message: 'User deleted successfully' });
});

module.exports = { getAllUsers, getUserById, updateUserRole, toggleUserStatus, deleteUser };
