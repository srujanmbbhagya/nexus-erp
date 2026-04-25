import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { format, parseISO } from 'date-fns';

export default function KanbanBoard() {
  const { projects, updateTask } = useApp();
  const [selectedProject, setSelectedProject] = useState('all');

  const allTasks = selectedProject === 'all'
    ? projects.flatMap(p => p.tasks.map(t => ({ ...t, projectName: p.name, projectId: p.id })))
    : (projects.find(p => p.id === parseInt(selectedProject))?.tasks || [])
        .map(t => ({ ...t, projectName: projects.find(p => p.id === parseInt(selectedProject))?.name, projectId: parseInt(selectedProject) }));

  const columns = [
    { id: 'Todo', label: 'TO DO', color: 'var(--text-muted)', bg: '#3D5A7322' },
    { id: 'In Progress', label: 'IN PROGRESS', color: 'var(--accent-amber)', bg: '#FFB80022' },
    { id: 'Done', label: 'DONE', color: 'var(--accent-emerald)', bg: '#00E5A022' },
  ];

  const moveTask = (task, newStatus) => {
    updateTask(task.projectId, task.id, { status: newStatus });
  };

  const getPriorityColor = (p) => p === 'High' ? 'var(--accent-crimson)' : p === 'Medium' ? 'var(--accent-amber)' : 'var(--accent-electric)';

  return (
    <div>
      <div className="page-header">
        <div className="page-sub">Visual Board</div>
        <div className="header-actions">
          <h1 className="page-title">KANBAN BOARD</h1>
          <select className="input" style={{ width: 200 }} value={selectedProject} onChange={e => setSelectedProject(e.target.value)}>
            <option value="all">All Projects</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>

      <div className="page-body">
        <div className="kanban-board">
          {columns.map(col => {
            const tasks = allTasks.filter(t => t.status === col.id);
            return (
              <div key={col.id} className="kanban-col">
                <div className="kanban-col-header">
                  <div className="kanban-col-title" style={{ color: col.color }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }} />
                    {col.label}
                  </div>
                  <div className="kanban-count" style={{ background: col.bg, color: col.color }}>
                    {tasks.length}
                  </div>
                </div>

                <div style={{ minHeight: 100 }}>
                  {tasks.length === 0 ? (
                    <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                      Empty
                    </div>
                  ) : (
                    tasks.map(task => (
                      <div key={task.id} className="kanban-card">
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3, flex: 1 }}>
                            {task.title}
                          </div>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: getPriorityColor(task.priority), flexShrink: 0, marginTop: 4 }} title={task.priority} />
                        </div>

                        {task.projectName && selectedProject === 'all' && (
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent-electric)', marginBottom: 8 }}>
                            {task.projectName}
                          </div>
                        )}

                        {task.description && (
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10, lineHeight: 1.4 }}>
                            {task.description.slice(0, 70)}{task.description.length > 70 ? '...' : ''}
                          </div>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          {task.deadline && (
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
                              {format(parseISO(task.deadline), 'dd MMM')}
                            </span>
                          )}
                          <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
                            {columns.filter(c => c.id !== col.id).map(c => (
                              <button
                                key={c.id}
                                className="filter-chip"
                                style={{ padding: '2px 8px', fontSize: 9 }}
                                onClick={() => moveTask(task, c.id)}
                                title={`Move to ${c.label}`}
                              >
                                → {c.label.split(' ')[0]}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
