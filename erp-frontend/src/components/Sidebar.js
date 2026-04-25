import React from 'react';
import { useApp } from '../context/AppContext';

const Icon = ({ name, size = 16 }) => {
  const icons = {
    dashboard: <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
    projects: <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M3 7a2 2 0 012-2h3l2 3h9a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/></svg>,
    tasks: <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>,
    team: <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
    kanban: <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="5" height="18" rx="1"/><rect x="10" y="3" width="5" height="13" rx="1"/><rect x="17" y="3" width="5" height="9" rx="1"/></svg>,
    logout: <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
    back: <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>,
  };
  return icons[name] || null;
};

export { Icon };

export default function Sidebar() {
  const { user, activeView, setActiveView, logout, selectedProject } = useApp();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'projects', label: 'Projects', icon: 'projects' },
    { id: 'tasks', label: 'All Tasks', icon: 'tasks' },
    { id: 'kanban', label: 'Kanban Board', icon: 'kanban' },
    { id: 'team', label: 'Team', icon: 'team' },
  ];

  const handleNav = (id) => {
    setActiveView(id);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-text">NEXUS</div>
        <div className="logo-sub">ERP // Project OS</div>
      </div>

      <nav className="nav-section">
        <div className="nav-label">Navigation</div>

        {selectedProject && (activeView === 'project-detail') && (
          <button className="nav-item" onClick={() => setActiveView('projects')}>
            <Icon name="back" />
            Back to Projects
          </button>
        )}

        {navItems.map(item => (
          <button
            key={item.id}
            className={`nav-item ${activeView === item.id ? 'active' : ''}`}
            onClick={() => handleNav(item.id)}
          >
            <Icon name={item.icon} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-card">
          <div className="avatar">{user?.avatar}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name}
            </div>
            <div className="user-role">{user?.role}</div>
          </div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={logout} title="Logout">
            <Icon name="logout" size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
