const asyncHandler = require('express-async-handler');
const User = require('../models/User.model');
const { sendTokenResponse } = require('../utils/token');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('Email already registered');
  }

  const user = await User.create({
    name,
    email,
    password,
    role: role || 'Developer',
    avatar: name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  });

  sendTokenResponse(user, 201, res, 'Account created successfully');
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Select password explicitly (it's hidden by default)
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  if (!user.isActive) {
    res.status(401);
    throw new Error('Your account has been deactivated. Contact an admin.');
  }

  sendTokenResponse(user, 200, res, 'Login successful');
});

// @desc    Get current logged-in user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({ success: true, user });
});

// @desc    Update profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const { name, email } = req.body;

  // Check if email is taken by another user
  if (email && email !== req.user.email) {
    const exists = await User.findOne({ email });
    if (exists) {
      res.status(400);
      throw new Error('Email already in use');
    }
  }

  const updated = await User.findByIdAndUpdate(
    req.user._id,
    {
      name: name || req.user.name,
      email: email || req.user.email,
      avatar: name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : req.user.avatar
    },
    { new: true, runValidators: true }
  );

  res.json({ success: true, message: 'Profile updated', user: updated });
});

// @desc    Change password
// @route   PUT /api/auth/password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400);
    throw new Error('Both current and new password are required');
  }

  if (newPassword.length < 6) {
    res.status(400);
    throw new Error('New password must be at least 6 characters');
  }

  const user = await User.findById(req.user._id).select('+password');
  const isMatch = await user.matchPassword(currentPassword);

  if (!isMatch) {
    res.status(401);
    throw new Error('Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();

  sendTokenResponse(user, 200, res, 'Password changed successfully');
});

module.exports = { register, login, getMe, updateProfile, changePassword };
