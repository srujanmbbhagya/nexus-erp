const asyncHandler = require('express-async-handler');
const Project = require('../models/Project.model');
const Task = require('../models/Task.model');
const User = require('../models/User.model');

// @desc    Get all projects (filtered by role)
// @route   GET /api/projects
// @access  Private
const getProjects = asyncHandler(async (req, res) => {
  const { status, search, page = 1, limit = 20 } = req.query;

  let filter = {};

  // Developers only see projects they're members of
  if (req.user.role === 'Developer') {
    filter.$or = [
      { members: req.user._id },
      { createdBy: req.user._id }
    ];
  }

  if (status) filter.status = status;
  if (search) filter.$or = [
    { name: { $regex: search, $options: 'i' } },
    { description: { $regex: search, $options: 'i' } }
  ];

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const total = await Project.countDocuments(filter);

  const projects = await Project.find(filter)
    .populate('createdBy', 'name email avatar role')
    .populate('members', 'name email avatar role')
    .populate({
      path: 'tasks',
      select: 'status priority title deadline'
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  // Attach computed stats to each project
  const enriched = projects.map(p => {
    const pObj = p.toObject();
    const tasks = pObj.tasks || [];
    pObj.stats = {
      total: tasks.length,
      done: tasks.filter(t => t.status === 'Done').length,
      inProgress: tasks.filter(t => t.status === 'In Progress').length,
      todo: tasks.filter(t => t.status === 'Todo').length,
      highPriority: tasks.filter(t => t.priority === 'High' && t.status !== 'Done').length
    };
    pObj.progress = tasks.length
      ? Math.round((pObj.stats.done / tasks.length) * 100)
      : 0;
    return pObj;
  });

  res.json({ success: true, total, page: parseInt(page), pages: Math.ceil(total / limit), projects: enriched });
});

// @desc    Get single project with full details
// @route   GET /api/projects/:id
// @access  Private
const getProjectById = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id)
    .populate('createdBy', 'name email avatar role')
    .populate('members', 'name email avatar role')
    .populate({
      path: 'tasks',
      populate: [
        { path: 'assignedTo', select: 'name email avatar role' },
        { path: 'createdBy', select: 'name email avatar' },
        { path: 'comments.author', select: 'name avatar role' }
      ]
    });

  if (!project) { res.status(404); throw new Error('Project not found'); }

  // Access check for developers
  if (req.user.role === 'Developer') {
    const isMember = project.members.some(m => m._id.toString() === req.user._id.toString());
    const isCreator = project.createdBy._id.toString() === req.user._id.toString();
    if (!isMember && !isCreator) {
      res.status(403); throw new Error('Not authorized — you are not a member of this project');
    }
  }

  const pObj = project.toObject();
  const tasks = pObj.tasks || [];
  pObj.stats = {
    total: tasks.length,
    done: tasks.filter(t => t.status === 'Done').length,
    inProgress: tasks.filter(t => t.status === 'In Progress').length,
    todo: tasks.filter(t => t.status === 'Todo').length,
    highPriority: tasks.filter(t => t.priority === 'High' && t.status !== 'Done').length
  };
  pObj.progress = tasks.length ? Math.round((pObj.stats.done / tasks.length) * 100) : 0;

  res.json({ success: true, project: pObj });
});

// @desc    Create project
// @route   POST /api/projects
// @access  Private/Admin/Manager
const createProject = asyncHandler(async (req, res) => {
  const { name, description, status, deadline, members } = req.body;

  // Validate members exist
  if (members && members.length > 0) {
    const validUsers = await User.find({ _id: { $in: members }, isActive: true });
    if (validUsers.length !== members.length) {
      res.status(400); throw new Error('One or more member IDs are invalid');
    }
  }

  const memberList = members || [];
  // Always include creator as member
  if (!memberList.includes(req.user._id.toString())) {
    memberList.unshift(req.user._id);
  }

  const project = await Project.create({
    name, description, status, deadline,
    createdBy: req.user._id,
    members: memberList
  });

  const populated = await Project.findById(project._id)
    .populate('createdBy', 'name email avatar role')
    .populate('members', 'name email avatar role');

  res.status(201).json({ success: true, message: 'Project created successfully', project: populated });
});

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private/Admin/Manager
const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) { res.status(404); throw new Error('Project not found'); }

  // Only creator, admin, or manager can update
  const canEdit = req.user.role === 'Admin' ||
    req.user.role === 'Manager' ||
    project.createdBy.toString() === req.user._id.toString();

  if (!canEdit) { res.status(403); throw new Error('Not authorized to update this project'); }

  const { name, description, status, deadline, members } = req.body;

  if (members && members.length > 0) {
    const validUsers = await User.find({ _id: { $in: members }, isActive: true });
    if (validUsers.length !== members.length) {
      res.status(400); throw new Error('One or more member IDs are invalid');
    }
  }

  const updated = await Project.findByIdAndUpdate(
    req.params.id,
    { name, description, status, deadline, ...(members && { members }) },
    { new: true, runValidators: true }
  )
    .populate('createdBy', 'name email avatar role')
    .populate('members', 'name email avatar role')
    .populate({ path: 'tasks', select: 'status priority title deadline' });

  res.json({ success: true, message: 'Project updated successfully', project: updated });
});

// @desc    Delete project (and all its tasks)
// @route   DELETE /api/projects/:id
// @access  Private/Admin
const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) { res.status(404); throw new Error('Project not found'); }

  if (req.user.role !== 'Admin' && project.createdBy.toString() !== req.user._id.toString()) {
    res.status(403); throw new Error('Only Admins or the project creator can delete a project');
  }

  // Cascade delete all tasks
  const deleted = await Task.deleteMany({ project: project._id });
  await project.deleteOne();

  res.json({ success: true, message: `Project deleted along with ${deleted.deletedCount} task(s)` });
});

// @desc    Add member to project
// @route   POST /api/projects/:id/members
// @access  Private/Admin/Manager
const addMember = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  if (!userId) { res.status(400); throw new Error('userId is required'); }

  const project = await Project.findById(req.params.id);
  if (!project) { res.status(404); throw new Error('Project not found'); }

  const user = await User.findById(userId);
  if (!user || !user.isActive) { res.status(404); throw new Error('User not found or inactive'); }

  if (project.members.includes(userId)) {
    res.status(400); throw new Error('User is already a member of this project');
  }

  project.members.push(userId);
  await project.save();

  const updated = await Project.findById(project._id).populate('members', 'name email avatar role');
  res.json({ success: true, message: `${user.name} added to project`, members: updated.members });
});

// @desc    Remove member from project
// @route   DELETE /api/projects/:id/members/:userId
// @access  Private/Admin/Manager
const removeMember = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) { res.status(404); throw new Error('Project not found'); }

  if (project.createdBy.toString() === req.params.userId) {
    res.status(400); throw new Error('Cannot remove the project creator');
  }

  project.members = project.members.filter(m => m.toString() !== req.params.userId);
  await project.save();

  // Unassign tasks from removed member
  await Task.updateMany(
    { project: project._id, assignedTo: req.params.userId },
    { $set: { assignedTo: null } }
  );

  res.json({ success: true, message: 'Member removed from project' });
});

module.exports = { getProjects, getProjectById, createProject, updateProject, deleteProject, addMember, removeMember };
