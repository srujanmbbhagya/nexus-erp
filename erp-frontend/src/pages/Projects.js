import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Icon } from '../components/Sidebar';
import toast from 'react-hot-toast';
import { format, parseISO, isPast } from 'date-fns';

function ProjectModal({ onClose, editProject }) {
  const { createProject, updateProject } = useApp();
  const [form, setForm] = useState(editProject || { name: '', description: '', deadline: '', status: 'Todo' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.deadline) { toast.error('Name and deadline required', { className: 'toast-custom' }); return; }
    if (editProject) { updateProject(editProject.id, form); toast.success('Project updated', { className: 'toast-custom' }); }
    else { createProject(form); toast.success('Project created', { className: 'toast-custom', icon: '⚡' }); }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{editProject ? 'EDIT PROJECT' : 'NEW PROJECT'}</div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">Project Name</label>
            <input className="input" placeholder="e.g. E-Commerce Platform" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="label">Description</label>
            <textarea className="input" placeholder="What does this project do?" value={form.description} onChange={e => set('description', e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="label">Deadline</label>
              <input className="input" type="date" value={form.deadline} onChange={e => set('deadline', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
                <option>Todo</option>
                <option>In Progress</option>
                <option>Done</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">{editProject ? 'Update' : 'Create Project'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Projects() {
  const { projects, openProject, deleteProject, user } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  const filtered = projects.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'All' || p.status === filter;
    return matchSearch && matchFilter;
  });

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (window.confirm('Delete this project?')) {
      deleteProject(id);
      toast.success('Project deleted', { className: 'toast-custom' });
    }
  };

  const handleEdit = (e, project) => {
    e.stopPropagation();
    setEditProject(project);
    setShowModal(true);
  };

  const getStatusClass = (status) => {
    if (status === 'Done') return 'badge-done';
    if (status === 'In Progress') return 'badge-progress';
    return 'badge-todo';
  };

  const getDeadlineColor = (deadline) => {
    try { return isPast(parseISO(deadline)) ? 'var(--accent-crimson)' : 'var(--text-muted)'; }
    catch { return 'var(--text-muted)'; }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-sub">Workspace</div>
        <div className="header-actions">
          <h1 className="page-title">PROJECTS</h1>
          <div className="flex gap-3 items-center" style={{ flexWrap: 'wrap' }}>
            <div className="search-input">
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input placeholder="Search projects..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button className="btn btn-primary" onClick={() => { setEditProject(null); setShowModal(true); }}>
              + New Project
            </button>
          </div>
        </div>
        <div className="filters" style={{ paddingBottom: 16 }}>
          {['All', 'Todo', 'In Progress', 'Done'].map(f => (
            <button key={f} className={`filter-chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="page-body">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24"><path d="M3 7a2 2 0 012-2h3l2 3h9a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/></svg>
            <h3>No Projects Found</h3>
            <p>Create your first project to get started</p>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Project</button>
          </div>
        ) : (
          <div className="projects-grid">
            {filtered.map((project, i) => {
              const doneTasks = project.tasks.filter(t => t.status === 'Done').length;
              const progress = project.tasks.length ? Math.round((doneTasks / project.tasks.length) * 100) : 0;
              return (
                <div key={project.id} className="project-card" onClick={() => openProject(project)}
                  style={{ animationDelay: `${i * 0.05}s` }}>
                  <div className="project-number">
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <span className={`badge ${getStatusClass(project.status)}`} style={{ marginBottom: 10, display: 'inline-flex' }}>
                    {project.status}
                  </span>
                  <div className="project-name">{project.name}</div>
                  <div className="project-desc">{project.description || 'No description provided.'}</div>

                  <div className="project-meta">
                    <div className="meta-item">
                      <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      <span style={{ color: getDeadlineColor(project.deadline) }}>
                        {project.deadline ? format(parseISO(project.deadline), 'dd MMM yyyy') : 'No deadline'}
                      </span>
                    </div>
                    <div className="meta-item">
                      <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
                      {doneTasks}/{project.tasks.length} tasks
                    </div>
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>Progress</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent-electric)' }}>{progress}%</span>
                    </div>
                    <div className="progress-bar" style={{ width: '100%' }}>
                      <div className="progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                  </div>

                  <div className="project-footer">
                    <div className="member-avatars">
                      {project.members.slice(0, 3).map((_, i) => (
                        <div key={i} className="member-avatar">
                          {['AS', 'PN', 'KD'][i] || '?'}
                        </div>
                      ))}
                      {project.members.length > 3 && (
                        <div className="member-avatar" style={{ background: 'var(--bg-elevated)' }}>
                          +{project.members.length - 3}
                        </div>
                      )}
                    </div>
                    {(user?.role === 'Admin' || user?.role === 'Manager') && (
                      <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                        <button className="btn btn-ghost btn-sm" onClick={e => handleEdit(e, project)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={e => handleDelete(e, project.id)}>Del</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <ProjectModal onClose={() => { setShowModal(false); setEditProject(null); }} editProject={editProject} />
      )}
    </div>
  );
}
