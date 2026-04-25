import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import toast from 'react-hot-toast';

export default function AuthPage() {
  const { login, register } = useApp();
  const [tab, setTab] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'Developer' });
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 600)); // simulate latency

    if (tab === 'login') {
      const result = login(form.email, form.password);
      if (!result.success) {
        toast.error(result.error, { className: 'toast-custom' });
      } else {
        toast.success('Access granted', { className: 'toast-custom', icon: '⚡' });
      }
    } else {
      if (!form.name || !form.email || !form.password) {
        toast.error('All fields required', { className: 'toast-custom' });
        setLoading(false);
        return;
      }
      const result = register(form.name, form.email, form.password, form.role);
      if (!result.success) toast.error(result.error, { className: 'toast-custom' });
      else toast.success('Account created', { className: 'toast-custom', icon: '✓' });
    }
    setLoading(false);
  };

  const fillDemo = (type) => {
    const creds = {
      admin: { email: 'admin@erp.com', password: 'admin123' },
      manager: { email: 'manager@erp.com', password: 'manager123' },
      dev: { email: 'dev@erp.com', password: 'dev123' },
    };
    setForm(f => ({ ...f, ...creds[type] }));
    setTab('login');
  };

  return (
    <div className="auth-container">
      <div className="auth-bg-grid" />

      {/* Decorative corner text */}
      <div style={{ position: 'absolute', top: 24, left: 24, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.2em' }}>
        LEARNDEPTH ACADEMY // SCREENING ROUND 2
      </div>
      <div style={{ position: 'absolute', bottom: 24, right: 24, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.2em' }}>
        MERN STACK // v2.0
      </div>

      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-text">NEXUS ERP</div>
          <div className="auth-logo-sub">Project Intelligence System</div>
        </div>

        {/* Demo shortcuts */}
        <div style={{ marginBottom: 20 }}>
          <div className="label" style={{ marginBottom: 8 }}>Quick Demo Access</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {['admin', 'manager', 'dev'].map(type => (
              <button key={type} className="filter-chip" style={{ flex: 1, textAlign: 'center' }}
                onClick={() => fillDemo(type)}>
                {type.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="divider" />

        <div className="auth-tab-group">
          <button className={`auth-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => setTab('login')}>
            SIGN IN
          </button>
          <button className={`auth-tab ${tab === 'register' ? 'active' : ''}`} onClick={() => setTab('register')}>
            REGISTER
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {tab === 'register' && (
            <div className="form-group">
              <label className="label">Full Name</label>
              <input className="input" placeholder="John Smith" value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
          )}
          <div className="form-group">
            <label className="label">Email Address</label>
            <input className="input" type="email" placeholder="user@company.com" value={form.email} onChange={e => set('email', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="label">Password</label>
            <input className="input" type="password" placeholder="••••••••" value={form.password} onChange={e => set('password', e.target.value)} />
          </div>
          {tab === 'register' && (
            <div className="form-group">
              <label className="label">Role</label>
              <select className="input" value={form.role} onChange={e => set('role', e.target.value)}>
                <option>Developer</option>
                <option>Manager</option>
                <option>Admin</option>
              </select>
            </div>
          )}
          <button className="btn btn-primary w-full" type="submit" disabled={loading}
            style={{ justifyContent: 'center', marginTop: 8, height: 44 }}>
            {loading ? (
              <span style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>AUTHENTICATING...</span>
            ) : (
              tab === 'login' ? 'SIGN IN →' : 'CREATE ACCOUNT →'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
