const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User.model');

// Protect routes — verify JWT
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token provided');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      res.status(401);
      throw new Error('User not found');
    }

    if (!req.user.isActive) {
      res.status(401);
      throw new Error('Account is deactivated');
    }

    next();
  } catch (error) {
    res.status(401);
    throw new Error('Not authorized, token invalid or expired');
  }
});

// Role-based access control
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      res.status(403);
      throw new Error(`Role '${req.user.role}' is not authorized for this action`);
    }
    next();
  };
};

// Check if user is project member or admin/manager
const projectMember = asyncHandler(async (req, res, next) => {
  const Project = require('../models/Project.model');
  const project = await Project.findById(req.params.projectId || req.params.id);

  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  const isMember = project.members.some(m => m.toString() === req.user._id.toString());
  const isCreator = project.createdBy.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'Admin';

  if (!isMember && !isCreator && !isAdmin) {
    res.status(403);
    throw new Error('Not authorized — you are not a member of this project');
  }

  req.project = project;
  next();
});

module.exports = { protect, authorize, projectMember };
