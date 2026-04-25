import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';

function TaskModal({ onClose, editTask, projectId }) {
  const { createTask, updateTask } = useApp();
  const [form, setForm] = useState(editTask || { title: '', description: '', priority: 'Medium', deadline: '', status: 'Todo', assignedTo: '' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title) { toast.error('Task title required', { className: 'toast-custom' }); return; }
    if (editTask) { updateTask(projectId, editTask.id, form); toast.success('Task updated', { className: 'toast-custom' }); }
    else { createTask(projectId, form); toast.success('Task created', { className: 'toast-custom', icon: '✓' }); }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{editTask ? 'EDIT TASK' : 'NEW TASK'}</div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">Task Title</label>
            <input className="input" placeholder="e.g. Implement auth middleware" value={form.title} onChange={e => set('title', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="label">Description</label>
            <textarea className="input" placeholder="Task details..." value={form.description} onChange={e => set('description', e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="label">Priority</label>
              <select className="input" value={form.priority} onChange={e => set('priority', e.target.value)}>
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </div>
            <div className="form-group">
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
                <option>Todo</option>
                <option>In Progress</option>
                <option>Done</option>
              </select>
            </div>
            <div className="form-group">
              <label className="label">Deadline</label>
              <input className="input" type="date" value={form.deadline} onChange={e => set('deadline', e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">{editTask ? 'Update' : 'Create Task'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProjectDetail() {
  const { selectedProject, projects, updateTask, deleteTask, user, setActiveView } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [filter, setFilter] = useState('All');

  // always get fresh project data
  const project = projects.find(p => p.id === selectedProject?.id) || selectedProject;

  if (!project) {
    return (
      <div className="page-body">
        <div className="empty-state">
          <h3>No Project Selected</h3>
          <button className="btn btn-primary" onClick={() => setActiveView('projects')}>Back to Projects</button>
        </div>
      </div>
    );
  }

  const tasks = project.tasks || [];
  const filtered = filter === 'All' ? tasks : tasks.filter(t => t.status === filter);
  const doneTasks = tasks.filter(t => t.status === 'Done').length;
  const progress = tasks.length ? Math.round((doneTasks / tasks.length) * 100) : 0;

  const toggleStatus = (task) => {
    const newStatus = task.status === 'Done' ? 'Todo' : 'Done';
    updateTask(project.id, task.id, { status: newStatus });
  };

  const handleDelete = (taskId) => {
    if (window.confirm('Delete this task?')) {
      deleteTask(project.id, taskId);
      toast.success('Task deleted', { className: 'toast-custom' });
    }
  };

  const getStatusClass = (s) => s === 'Done' ? 'badge-done' : s === 'In Progress' ? 'badge-progress' : 'badge-todo';
  const getPriorityClass = (p) => `badge-${p?.toLowerCase()}`;

  return (
    <div>
      <div className="page-header">
        <div className="page-sub">Project Detail</div>
        <div className="header-actions">
          <div>
            <h1 className="page-title" style={{ fontSize: 28, letterSpacing: '0.03em' }}>{project.name}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
              <span className={`badge ${getStatusClass(project.status)}`}>{project.status}</span>
              {project.deadline && (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
                  DUE {format(parseISO(project.deadline), 'dd MMM yyyy').toUpperCase()}
                </span>
              )}
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
                {progress}% complete
              </span>
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => { setEditTask(null); setShowModal(true); }}>
            + Add Task
          </button>
        </div>
        <div style={{ paddingBottom: 0 }}>
          <div className="progress-bar" style={{ width: '100%', height: 2, marginBottom: 16 }}>
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <div className="page-body">
        {/* Project info bar */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>DESCRIPTION</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{project.description || 'No description.'}</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 24 }}>
            {[
              { label: 'TOTAL', value: tasks.length, color: 'var(--text-primary)' },
              { label: 'DONE', value: doneTasks, color: 'var(--accent-emerald)' },
              { label: 'TODO', value: tasks.filter(t => t.status === 'Todo').length, color: 'var(--text-muted)' },
              { label: 'WIP', value: tasks.filter(t => t.status === 'In Progress').length, color: 'var(--accent-amber)' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.15em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div className="filters">
            {['All', 'Todo', 'In Progress', 'Done'].map(f => (
              <button key={f} className={`filter-chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                {f} {f === 'All' ? `(${tasks.length})` : `(${tasks.filter(t => t.status === f).length})`}
              </button>
            ))}
          </div>
        </div>

        {/* Tasks list */}
        {filtered.length === 0 ? (
          <div className="empty-state">
            <h3>No Tasks</h3>
            <p>Add your first task to this project</p>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Task</button>
          </div>
        ) : (
          <div>
            {filtered.map((task, i) => (
              <div key={task.id} className="task-item" style={{ animationDelay: `${i * 0.04}s` }}>
                <div className={`task-check ${task.status === 'Done' ? 'done' : ''}`} onClick={() => toggleStatus(task)}>
                  {task.status === 'Done' && (
                    <svg width="10" height="10" fill="none" stroke="var(--bg-void)" strokeWidth="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className={`task-title ${task.status === 'Done' ? 'done' : ''}`}>{task.title}</div>
                  {task.description && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                      {task.description.length > 80 ? task.description.slice(0, 80) + '...' : task.description}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
                  <span className={`badge ${getPriorityClass(task.priority)}`}>{task.priority}</span>
                  <span className={`badge ${getStatusClass(task.status)}`}>{task.status}</span>
                  {task.deadline && (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
                      {format(parseISO(task.deadline), 'dd MMM')}
                    </span>
                  )}
                  <button className="btn btn-ghost btn-sm" onClick={() => { setEditTask(task); setShowModal(true); }}>Edit</button>
                  {user?.role === 'Admin' && (
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(task.id)}>Del</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <TaskModal onClose={() => { setShowModal(false); setEditTask(null); }} editTask={editTask} projectId={project.id} />
      )}
    </div>
  );
}
