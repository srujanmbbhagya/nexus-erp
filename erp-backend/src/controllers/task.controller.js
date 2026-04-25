const asyncHandler = require('express-async-handler');
const Task = require('../models/Task.model');
const Project = require('../models/Project.model');
const path = require('path');
const fs = require('fs');

const checkProjectAccess = async (projectId, userId, role) => {
  const project = await Project.findById(projectId);
  if (!project) return { ok: false, code: 404, msg: 'Project not found' };
  if (role === 'Admin') return { ok: true, project };
  const isMember = project.members.some(m => m.toString() === userId.toString());
  const isCreator = project.createdBy.toString() === userId.toString();
  if (!isMember && !isCreator) return { ok: false, code: 403, msg: 'Not a project member' };
  return { ok: true, project };
};

// GET /api/tasks/project/:projectId
const getTasksByProject = asyncHandler(async (req, res) => {
  const { status, priority, assignedTo, search, page = 1, limit = 50 } = req.query;
  const { projectId } = req.params;
  const access = await checkProjectAccess(projectId, req.user._id, req.user.role);
  if (!access.ok) { res.status(access.code); throw new Error(access.msg); }
  const filter = { project: projectId };
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (assignedTo) filter.assignedTo = assignedTo;
  if (search) filter.$or = [{ title: { $regex: search, $options: 'i' } }, { description: { $regex: search, $options: 'i' } }];
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const total = await Task.countDocuments(filter);
  const tasks = await Task.find(filter)
    .populate('assignedTo', 'name email avatar role')
    .populate('createdBy', 'name email avatar')
    .populate('comments.author', 'name avatar role')
    .sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit));
  res.json({ success: true, total, page: parseInt(page), tasks });
});

// GET /api/tasks
const getAllTasks = asyncHandler(async (req, res) => {
  const { status, priority, assignedTo, search, page = 1, limit = 100 } = req.query;
  let projectFilter = {};
  if (req.user.role === 'Developer') {
    const myProjects = await Project.find({ $or: [{ members: req.user._id }, { createdBy: req.user._id }] }).select('_id');
    projectFilter = { project: { $in: myProjects.map(p => p._id) } };
  }
  const filter = { ...projectFilter };
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (assignedTo) filter.assignedTo = assignedTo === 'me' ? req.user._id : assignedTo;
  if (search) filter.$or = [{ title: { $regex: search, $options: 'i' } }, { description: { $regex: search, $options: 'i' } }];
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const total = await Task.countDocuments(filter);
  const tasks = await Task.find(filter)
    .populate('assignedTo', 'name email avatar role')
    .populate('createdBy', 'name email avatar')
    .populate('project', 'name status')
    .sort({ priority: -1, createdAt: -1 }).skip(skip).limit(parseInt(limit));
  res.json({ success: true, total, page: parseInt(page), tasks });
});

// GET /api/tasks/:id
const getTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id)
    .populate('assignedTo', 'name email avatar role')
    .populate('createdBy', 'name email avatar')
    .populate('comments.author', 'name avatar role')
    .populate('project', 'name status');
  if (!task) { res.status(404); throw new Error('Task not found'); }
  res.json({ success: true, task });
});

// POST /api/tasks/project/:projectId
const createTask = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const access = await checkProjectAccess(projectId, req.user._id, req.user.role);
  if (!access.ok) { res.status(access.code); throw new Error(access.msg); }
  const { title, description, status, priority, deadline, assignedTo } = req.body;
  if (assignedTo) {
    const isMember = access.project.members.some(m => m.toString() === assignedTo);
    if (!isMember) { res.status(400); throw new Error('Assignee must be a project member'); }
  }
  const task = await Task.create({ title, description, status, priority, deadline, assignedTo: assignedTo || null, project: projectId, createdBy: req.user._id });
  const populated = await Task.findById(task._id)
    .populate('assignedTo', 'name email avatar role')
    .populate('createdBy', 'name email avatar')
    .populate('project', 'name status');
  res.status(201).json({ success: true, message: 'Task created', task: populated });
});

// PUT /api/tasks/:id
const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) { res.status(404); throw new Error('Task not found'); }
  const { title, description, status, priority, deadline, assignedTo } = req.body;
  const updated = await Task.findByIdAndUpdate(req.params.id,
    { ...(title !== undefined && { title }), ...(description !== undefined && { description }), ...(status !== undefined && { status }), ...(priority !== undefined && { priority }), ...(deadline !== undefined && { deadline }), ...(assignedTo !== undefined && { assignedTo: assignedTo || null }) },
    { new: true, runValidators: true })
    .populate('assignedTo', 'name email avatar role')
    .populate('createdBy', 'name email avatar')
    .populate('comments.author', 'name avatar role')
    .populate('project', 'name status');
  res.json({ success: true, message: 'Task updated', task: updated });
});

// PATCH /api/tasks/:id/status
const updateTaskStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['Todo', 'In Progress', 'Done'].includes(status)) { res.status(400); throw new Error('Invalid status'); }
  const task = await Task.findByIdAndUpdate(req.params.id, { status }, { new: true })
    .populate('assignedTo', 'name email avatar').populate('project', 'name');
  if (!task) { res.status(404); throw new Error('Task not found'); }
  res.json({ success: true, message: `Status → ${status}`, task });
});

// PATCH /api/tasks/:id/assign
const assignTask = asyncHandler(async (req, res) => {
  const { assignedTo } = req.body;
  const task = await Task.findById(req.params.id);
  if (!task) { res.status(404); throw new Error('Task not found'); }
  const updated = await Task.findByIdAndUpdate(req.params.id, { assignedTo: assignedTo || null }, { new: true })
    .populate('assignedTo', 'name email avatar role');
  res.json({ success: true, message: 'Task assigned', task: updated });
});

// DELETE /api/tasks/:id
const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) { res.status(404); throw new Error('Task not found'); }
  const canDelete = req.user.role === 'Admin' || req.user.role === 'Manager' || task.createdBy.toString() === req.user._id.toString();
  if (!canDelete) { res.status(403); throw new Error('Not authorized'); }
  if (task.attachments && task.attachments.length > 0) {
    task.attachments.forEach(file => { const fp = path.join(__dirname, '../../uploads', file.filename); if (fs.existsSync(fp)) fs.unlinkSync(fp); });
  }
  await task.deleteOne();
  res.json({ success: true, message: 'Task deleted', id: req.params.id });
});

// POST /api/tasks/:id/comments
const addComment = asyncHandler(async (req, res) => {
  const { text } = req.body;
  const task = await Task.findByIdAndUpdate(req.params.id, { $push: { comments: { text: text.trim(), author: req.user._id } } }, { new: true })
    .populate('comments.author', 'name avatar role');
  if (!task) { res.status(404); throw new Error('Task not found'); }
  res.status(201).json({ success: true, comment: task.comments[task.comments.length - 1] });
});

// DELETE /api/tasks/:id/comments/:commentId
const deleteComment = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) { res.status(404); throw new Error('Task not found'); }
  const comment = task.comments.id(req.params.commentId);
  if (!comment) { res.status(404); throw new Error('Comment not found'); }
  if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'Admin') { res.status(403); throw new Error('Not authorized'); }
  task.comments.pull(req.params.commentId);
  await task.save();
  res.json({ success: true, message: 'Comment deleted' });
});

module.exports = { getTasksByProject, getAllTasks, getTask, createTask, updateTask, updateTaskStatus, assignTask, deleteTask, addComment, deleteComment };
