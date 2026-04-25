import React from 'react';
import { useApp } from '../context/AppContext';

export default function Team() {
  const { users, projects } = useApp();

  const getUserStats = (userId) => {
    const assignedTasks = projects.flatMap(p => p.tasks).filter(t => t.assignedTo === userId);
    const doneTasks = assignedTasks.filter(t => t.status === 'Done');
    const inProjects = projects.filter(p => p.members.includes(userId));
    return {
      total: assignedTasks.length,
      done: doneTasks.length,
      projects: inProjects.length,
      completion: assignedTasks.length ? Math.round((doneTasks.length / assignedTasks.length) * 100) : 0,
    };
  };

  const getRoleClass = (role) => {
    if (role === 'Admin') return 'role-admin';
    if (role === 'Manager') return 'role-manager';
    return 'role-developer';
  };

  const getRoleColor = (role) => {
    if (role === 'Admin') return 'var(--accent-crimson)';
    if (role === 'Manager') return 'var(--accent-amber)';
    return 'var(--accent-electric)';
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-sub">Organization</div>
        <div className="header-actions">
          <h1 className="page-title">TEAM</h1>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
            {users.length} MEMBERS
          </div>
        </div>
      </div>

      <div className="page-body">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16, marginBottom: 32 }}>
          {users.map((member, i) => {
            const stats = getUserStats(member.id);
            return (
              <div key={member.id} className="card animate-fade" style={{ animationDelay: `${i * 0.1}s`, padding: 24, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: getRoleColor(member.role) }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 8,
                    background: `linear-gradient(135deg, ${getRoleColor(member.role)}22, transparent)`,
                    border: `1px solid ${getRoleColor(member.role)}44`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-display)', fontSize: 22, color: getRoleColor(member.role),
                    flexShrink: 0,
                  }}>
                    {member.avatar}
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{member.name}</div>
                    <span className={`role-badge ${getRoleClass(member.role)}`}>{member.role}</span>
                  </div>
                </div>

                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
                  {member.email}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 16 }}>
                  {[
                    { label: 'Tasks', value: stats.total, color: 'var(--text-primary)' },
                    { label: 'Done', value: stats.done, color: 'var(--accent-emerald)' },
                    { label: 'Projects', value: stats.projects, color: 'var(--accent-electric)' },
                  ].map(s => (
                    <div key={s.label} style={{ background: 'var(--bg-elevated)', borderRadius: 4, padding: 10, textAlign: 'center' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: s.color, lineHeight: 1 }}>{s.value}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.1em', marginTop: 3 }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>Completion Rate</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: getRoleColor(member.role) }}>{stats.completion}%</span>
                  </div>
                  <div className="progress-bar" style={{ width: '100%', height: 3 }}>
                    <div className="progress-fill" style={{ width: `${stats.completion}%`, background: getRoleColor(member.role) }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Projects table */}
        <div style={{ marginBottom: 8, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>PROJECT ASSIGNMENTS</div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Project</th>
                <th>Status</th>
                <th>Members</th>
                <th>Tasks</th>
                <th>Progress</th>
              </tr>
            </thead>
            <tbody>
              {projects.map(p => {
                const done = p.tasks.filter(t => t.status === 'Done').length;
                const pct = p.tasks.length ? Math.round((done / p.tasks.length) * 100) : 0;
                return (
                  <tr key={p.id}>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{p.name}</td>
                    <td>
                      <span className={`badge ${p.status === 'Done' ? 'badge-done' : p.status === 'In Progress' ? 'badge-progress' : 'badge-todo'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {p.members.map((_, i) => (
                          <div key={i} className="member-avatar" style={{ marginLeft: 0, fontSize: 9 }}>
                            {['AS', 'PN', 'KD'][i]}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{done}/{p.tasks.length}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${pct}%` }} />
                        </div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent-electric)', minWidth: 32 }}>{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
