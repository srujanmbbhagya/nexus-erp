const { body, validationResult } = require('express-validator');

// Handle validation results
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(e => ({ field: e.path, message: e.msg }))
    });
  }
  next();
};

// Auth validators
const registerRules = [
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2–50 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['Admin', 'Manager', 'Developer']).withMessage('Invalid role'),
];

const loginRules = [
  body('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
  body('password').notEmpty().withMessage('Password is required'),
];

// Project validators
const projectRules = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Project name must be 2–100 characters'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  body('status').optional().isIn(['Todo', 'In Progress', 'Done']).withMessage('Invalid status'),
  body('deadline').optional().isISO8601().withMessage('Invalid deadline date'),
];

// Task validators
const taskRules = [
  body('title').trim().isLength({ min: 2, max: 150 }).withMessage('Task title must be 2–150 characters'),
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
  body('status').optional().isIn(['Todo', 'In Progress', 'Done']).withMessage('Invalid status'),
  body('priority').optional().isIn(['Low', 'Medium', 'High']).withMessage('Invalid priority'),
  body('deadline').optional().isISO8601().withMessage('Invalid deadline date'),
];

// Comment validators
const commentRules = [
  body('text').trim().isLength({ min: 1, max: 500 }).withMessage('Comment must be 1–500 characters'),
];

module.exports = {
  validate,
  registerRules, loginRules,
  projectRules, taskRules, commentRules
};
