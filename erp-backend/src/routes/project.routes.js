const express = require('express');
const router = express.Router();

// Project Controller
const {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember
} = require('../controllers/project.controller');

// Task Controller (FIXED imports)
const {
  getTasksByProject,
  getTask, // ✅ correct name (NOT getTaskById)
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  addComment,
  deleteComment
} = require('../controllers/task.controller');

// Middleware
const { protect, authorize } = require('../middleware/auth.middleware');
const { projectRules, taskRules, commentRules, validate } = require('../middleware/validation.middleware');

router.use(protect);

// ── Project CRUD ──────────────────────────────────────────────
router.get('/', getProjects);
router.post('/', authorize('Admin', 'Manager'), projectRules, validate, createProject);

router.get('/:id', getProjectById);
router.put('/:id', authorize('Admin', 'Manager'), projectRules, validate, updateProject);
router.delete('/:id', authorize('Admin', 'Manager'), deleteProject);

// ── Project Members ────────────────────────────────────────────
router.post('/:id/members', authorize('Admin', 'Manager'), addMember);
router.delete('/:id/members/:userId', authorize('Admin', 'Manager'), removeMember);

// ── Nested Tasks ───────────────────────────────────────────────
router.get('/:projectId/tasks', getTasksByProject);
router.post('/:projectId/tasks', taskRules, validate, createTask);

router.get('/:projectId/tasks/:taskId', getTask); // ✅ FIXED
router.put('/:projectId/tasks/:taskId', taskRules, validate, updateTask);
router.patch('/:projectId/tasks/:taskId/status', updateTaskStatus);
router.delete('/:projectId/tasks/:taskId', deleteTask);

// ── Comments ───────────────────────────────────────────
router.post('/:projectId/tasks/:taskId/comments', commentRules, validate, addComment);
router.delete('/:projectId/tasks/:taskId/comments/:commentId', deleteComment);

module.exports = router;