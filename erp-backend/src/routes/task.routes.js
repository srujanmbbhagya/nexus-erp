const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  getTasksByProject,
  getAllTasks,
  createTask,
  getTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  addComment,
  deleteComment,
  assignTask
} = require('../controllers/task.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const { taskRules, commentRules, validate } = require('../middleware/validation.middleware');
const upload = require('../middleware/upload.middleware');

router.use(protect);

// Global task list — used by "All Tasks" page
router.get('/', getAllTasks);

// Tasks nested under project: /api/projects/:projectId/tasks
router.route('/project/:projectId')
  .get(getTasksByProject)
  .post(taskRules, validate, createTask);

// Single task operations
router.route('/:id')
  .get(getTask)
  .put(taskRules, validate, updateTask)
  .delete(authorize('Admin', 'Manager'), deleteTask);

// Quick status update (used by Kanban drag)
router.patch('/:id/status', updateTaskStatus);

// Assign task to user
router.patch('/:id/assign', authorize('Admin', 'Manager'), assignTask);

// Comments on tasks
router.post('/:id/comments', commentRules, validate, addComment);
router.delete('/:id/comments/:commentId', deleteComment);

module.exports = router;
