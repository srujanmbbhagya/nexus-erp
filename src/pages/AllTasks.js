import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { format, parseISO } from 'date-fns';

export default function AllTasks() {
  const { projects, updateTask, user } = useApp();
  const [filter, setFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [search, setSearch] = useState('');

  const allTasks = projects.flatMap(p =>
    p.tasks.map(t => ({ ...t, projectName: p.name, projectId: p.id }))
  );

  const filtered = allTasks.filter(t => {
    const matchStatus = filter === 'All' || t.status === filter;
    const matchPriority = priorityFilter === 'All' || t.priority === priorityFilter;
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.projectName.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchPriority && matchSearch;
  });

  const toggleStatus = (task) => {
    const newStatus = task.status === 'Done' ? 'Todo' : 'Done';
    updateTask(task.projectId, task.id, { status: newStatus });
  };

  const getStatusClass = (s) => s === 'Done' ? 'badge-done' : s === 'In Progress' ? 'badge-progress' : 'badge-todo';
  const getPriorityClass = (p) => `badge-${p?.toLowerCase()}`;

  return (
    <div>
      <div className="page-header">
        <div className="page-sub">Global View</div>
        <div className="header-actions">
          <h1 className="page-title">ALL TASKS</h1>
          <div className="search-input">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div style={{ paddingBottom: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div className="filters">
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginRight: 4 }}>STATUS</span>
            {['All', 'Todo', 'In Progress', 'Done'].map(f => (
              <button key={f} className={`filter-chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>{f}</button>
            ))}
          </div>
          <div className="filters">
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginRight: 4 }}>PRIORITY</span>
            {['All', 'High', 'Medium', 'Low'].map(p => (
              <button key={p} className={`filter-chip ${priorityFilter === p ? 'active' : ''}`} onClick={() => setPriorityFilter(p)}>{p}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="page-body">
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
          Showing {filtered.length} of {allTasks.length} tasks
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th style={{ width: 32 }}></th>
                <th>Task</th>
                <th>Project</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Deadline</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                    No tasks match the current filters
                  </td>
                </tr>
              ) : (
                filtered.map((task) => (
                  <tr key={`${task.projectId}-${task.id}`} style={{ cursor: 'pointer' }}>
                    <td>
                      <div
                        className={`task-check ${task.status === 'Done' ? 'done' : ''}`}
                        style={{ width: 16, height: 16 }}
                        onClick={() => toggleStatus(task)}
                      >
                        {task.status === 'Done' && (
                          <svg width="9" height="9" fill="none" stroke="var(--bg-void)" strokeWidth="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ color: task.status === 'Done' ? 'var(--text-muted)' : 'var(--text-primary)', fontWeight: 500, fontSize: 13, textDecoration: task.status === 'Done' ? 'line-through' : 'none' }}>
                        {task.title}
                      </div>
                      {task.description && (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                          {task.description.slice(0, 60)}{task.description.length > 60 ? '...' : ''}
                        </div>
                      )}
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent-electric)', background: '#00D4FF0A', border: '1px solid #00D4FF22', padding: '2px 8px', borderRadius: 2 }}>
                        {task.projectName}
                      </span>
                    </td>
                    <td><span className={`badge ${getPriorityClass(task.priority)}`}>{task.priority}</span></td>
                    <td><span className={`badge ${getStatusClass(task.status)}`}>{task.status}</span></td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                        {task.deadline ? format(parseISO(task.deadline), 'dd MMM yyyy') : '—'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
