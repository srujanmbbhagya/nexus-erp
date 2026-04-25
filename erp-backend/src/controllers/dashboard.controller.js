const asyncHandler = require('express-async-handler');
const Project = require('../models/Project.model');
const Task = require('../models/Task.model');
const User = require('../models/User.model');

// @desc    Get full dashboard analytics
// @route   GET /api/dashboard
// @access  Private
const getDashboard = asyncHandler(async (req, res) => {
  let projectFilter = {};

  // Developers see only their projects
  if (req.user.role === 'Developer') {
    const myProjects = await Project.find({
      $or: [{ members: req.user._id }, { createdBy: req.user._id }]
    }).select('_id');
    projectFilter = { _id: { $in: myProjects.map(p => p._id) } };
  }

  // ── Project Stats ────────────────────────────────────
  const [totalProjects, todoProjects, inProgressProjects, doneProjects] = await Promise.all([
    Project.countDocuments(projectFilter),
    Project.countDocuments({ ...projectFilter, status: 'Todo' }),
    Project.countDocuments({ ...projectFilter, status: 'In Progress' }),
    Project.countDocuments({ ...projectFilter, status: 'Done' })
  ]);

  // ── Task Stats ───────────────────────────────────────
  let taskProjectFilter = {};
  if (req.user.role === 'Developer') {
    const myProjects = await Project.find({
      $or: [{ members: req.user._id }, { createdBy: req.user._id }]
    }).select('_id');
    taskProjectFilter = { project: { $in: myProjects.map(p => p._id) } };
  }

  const [totalTasks, todoTasks, inProgressTasks, doneTasks, highPriorityTasks] = await Promise.all([
    Task.countDocuments(taskProjectFilter),
    Task.countDocuments({ ...taskProjectFilter, status: 'Todo' }),
    Task.countDocuments({ ...taskProjectFilter, status: 'In Progress' }),
    Task.countDocuments({ ...taskProjectFilter, status: 'Done' }),
    Task.countDocuments({ ...taskProjectFilter, priority: 'High', status: { $ne: 'Done' } })
  ]);

  // ── Team Stats (Admin/Manager only) ─────────────────
  let teamStats = null;
  if (req.user.role !== 'Developer') {
    const totalUsers = await User.countDocuments({ isActive: true });
    const byRole = await User.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);
    teamStats = { totalUsers, byRole };
  }

  // ── Tasks by Priority ────────────────────────────────
  const tasksByPriority = await Task.aggregate([
    { $match: taskProjectFilter },
    { $group: { _id: '$priority', count: { $sum: 1 } } }
  ]);

  // ── Tasks by Status per Project ──────────────────────
  const projectsWithTasks = await Project.find(projectFilter)
    .populate({ path: 'tasks', select: 'status priority' })
    .select('name status tasks')
    .limit(10);

  const projectBreakdown = projectsWithTasks.map(p => ({
    name: p.name.length > 18 ? p.name.slice(0, 18) + '…' : p.name,
    status: p.status,
    total: p.tasks.length,
    done: p.tasks.filter(t => t.status === 'Done').length,
    inProgress: p.tasks.filter(t => t.status === 'In Progress').length,
    todo: p.tasks.filter(t => t.status === 'Todo').length,
    progress: p.tasks.length
      ? Math.round((p.tasks.filter(t => t.status === 'Done').length / p.tasks.length) * 100)
      : 0
  }));

  // ── Recent Activity (last 8 tasks updated) ───────────
  const recentTasks = await Task.find(taskProjectFilter)
    .populate('project', 'name')
    .populate('assignedTo', 'name avatar')
    .sort({ updatedAt: -1 })
    .limit(8)
    .select('title status priority updatedAt project assignedTo');

  // ── Upcoming Deadlines ───────────────────────────────
  const upcomingDeadlines = await Task.find({
    ...taskProjectFilter,
    deadline: { $gte: new Date(), $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    status: { $ne: 'Done' }
  })
    .populate('project', 'name')
    .populate('assignedTo', 'name avatar')
    .sort({ deadline: 1 })
    .limit(5)
    .select('title deadline priority status project assignedTo');

  // ── My Tasks (for logged-in user) ────────────────────
  const myTasks = await Task.find({ assignedTo: req.user._id, status: { $ne: 'Done' } })
    .populate('project', 'name')
    .sort({ priority: -1, deadline: 1 })
    .limit(5)
    .select('title status priority deadline project');

  res.json({
    success: true,
    data: {
      projects: {
        total: totalProjects,
        todo: todoProjects,
        inProgress: inProgressProjects,
        done: doneProjects
      },
      tasks: {
        total: totalTasks,
        todo: todoTasks,
        inProgress: inProgressTasks,
        done: doneTasks,
        highPriority: highPriorityTasks,
        completionRate: totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0
      },
      teamStats,
      tasksByPriority,
      projectBreakdown,
      recentTasks,
      upcomingDeadlines,
      myTasks
    }
  });
});

// @desc    Get per-user productivity stats
// @route   GET /api/dashboard/productivity
// @access  Private/Admin/Manager
const getProductivity = asyncHandler(async (req, res) => {
  const users = await User.find({ isActive: true }).select('name email avatar role');

  const productivity = await Promise.all(users.map(async (user) => {
    const tasks = await Task.find({ assignedTo: user._id });
    const done = tasks.filter(t => t.status === 'Done').length;
    const overdue = tasks.filter(t =>
      t.deadline && new Date(t.deadline) < new Date() && t.status !== 'Done'
    ).length;

    return {
      user: { _id: user._id, name: user.name, avatar: user.avatar, role: user.role },
      totalAssigned: tasks.length,
      done,
      pending: tasks.length - done,
      overdue,
      completionRate: tasks.length ? Math.round((done / tasks.length) * 100) : 0
    };
  }));

  // Sort by completion rate descending
  productivity.sort((a, b) => b.completionRate - a.completionRate);

  res.json({ success: true, productivity });
});

module.exports = { getDashboard, getProductivity };
