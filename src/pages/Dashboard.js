import React from 'react';
import { useApp } from '../context/AppContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

const StatCard = ({ label, value, color, desc, icon }) => (
  <div className={`stat-card ${color} animate-fade`}>
    <div className="stat-label">{label}</div>
    <div className="stat-value">{value}</div>
    <div className="stat-desc">{desc}</div>
    <div className="stat-icon" style={{ fontSize: 48 }}>{icon}</div>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-active)', borderRadius: 4, padding: '8px 14px' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ fontSize: 13, color: p.color, fontWeight: 600 }}>{p.name}: {p.value}</div>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { stats, projects, user } = useApp();

  const barData = projects.map(p => ({
    name: p.name.split(' ')[0],
    total: p.tasks.length,
    done: p.tasks.filter(t => t.status === 'Done').length,
    pending: p.tasks.filter(t => t.status !== 'Done').length,
  }));

  const pieData = [
    { name: 'Done', value: stats.doneTasks, color: '#00E5A0' },
    { name: 'In Progress', value: projects.flatMap(p => p.tasks).filter(t => t.status === 'In Progress').length, color: '#FFB800' },
    { name: 'Todo', value: projects.flatMap(p => p.tasks).filter(t => t.status === 'Todo').length, color: '#3D5A73' },
  ];

  const areaData = [
    { month: 'Jan', tasks: 4 }, { month: 'Feb', tasks: 7 }, { month: 'Mar', tasks: 5 },
    { month: 'Apr', tasks: 12 }, { month: 'May', tasks: 9 }, { month: 'Jun', tasks: 15 },
  ];

  const recentActivity = projects.flatMap(p =>
    p.tasks.map(t => ({ ...t, project: p.name }))
  ).slice(0, 6);

  return (
    <div>
      <div className="page-header">
        <div className="page-sub">Overview</div>
        <div className="header-actions">
          <div>
            <h1 className="page-title">DASHBOARD</h1>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
            Welcome back, <span style={{ color: 'var(--accent-electric)' }}>{user?.name?.split(' ')[0]}</span>
          </div>
        </div>
      </div>

      <div className="page-body">
        {/* Stats */}
        <div className="stats-grid">
          <StatCard label="Total Projects" value={stats.totalProjects} color="electric" desc={`${stats.activeProjects} active`} icon="⬡" />
          <StatCard label="Total Tasks" value={stats.totalTasks} color="amber" desc={`${stats.pendingTasks} pending`} icon="◈" />
          <StatCard label="Completed" value={stats.doneTasks} color="emerald" desc={`${Math.round((stats.doneTasks / Math.max(stats.totalTasks, 1)) * 100)}% completion rate`} icon="◉" />
          <StatCard label="High Priority" value={stats.highPriorityTasks} color="crimson" desc="Needs attention" icon="◬" />
        </div>

        {/* Charts row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 28 }}>
          <div className="chart-section" style={{ gridColumn: 'span 2' }}>
            <div className="chart-title">Tasks per Project</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} barGap={4}>
                <XAxis dataKey="name" tick={{ fontFamily: 'DM Mono', fontSize: 10, fill: '#3D5A73' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontFamily: 'DM Mono', fontSize: 10, fill: '#3D5A73' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="done" name="Done" fill="#00E5A0" radius={[2, 2, 0, 0]} />
                <Bar dataKey="pending" name="Pending" fill="#1E2A3A" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-section">
            <div className="chart-title">Task Status</div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
              {pieData.map((d, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color }} />
                  <span style={{ color: 'var(--text-secondary)', flex: 1 }}>{d.name}</span>
                  <span style={{ color: d.color, fontWeight: 600 }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Activity trend */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="chart-section">
            <div className="chart-title">Activity Trend</div>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={areaData}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#00D4FF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontFamily: 'DM Mono', fontSize: 10, fill: '#3D5A73' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="tasks" name="Tasks" stroke="#00D4FF" strokeWidth={2} fill="url(#grad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-section">
            <div className="chart-title">Recent Activity</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recentActivity.map((t, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: t.status === 'Done' ? 'var(--accent-emerald)' : t.status === 'In Progress' ? 'var(--accent-amber)' : 'var(--text-muted)', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{t.project}</div>
                  </div>
                  <span className={`badge badge-${t.priority?.toLowerCase()}`}>{t.priority}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
