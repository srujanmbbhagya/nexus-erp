import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext(null);

// Mock data
const MOCK_USERS = [
  { id: 1, name: 'Arjun Sharma', email: 'admin@erp.com', password: 'admin123', role: 'Admin', avatar: 'AS' },
  { id: 2, name: 'Priya Nair', email: 'manager@erp.com', password: 'manager123', role: 'Manager', avatar: 'PN' },
  { id: 3, name: 'Kiran Dev', email: 'dev@erp.com', password: 'dev123', role: 'Developer', avatar: 'KD' },
];

const INITIAL_PROJECTS = [
  {
    id: 1, name: 'E-Commerce Platform', description: 'Full-stack marketplace with payment integration and real-time inventory tracking.',
    deadline: '2026-06-30', status: 'In Progress', members: [1, 2, 3], createdBy: 1,
    tasks: [
      { id: 1, title: 'Design database schema', description: 'Create MongoDB schemas for products, orders, users', priority: 'High', deadline: '2026-05-10', status: 'Done', assignedTo: 3 },
      { id: 2, title: 'Build REST API endpoints', description: 'Implement CRUD endpoints for all resources', priority: 'High', deadline: '2026-05-20', status: 'In Progress', assignedTo: 3 },
      { id: 3, title: 'Implement payment gateway', description: 'Integrate Razorpay for checkout', priority: 'High', deadline: '2026-06-01', status: 'Todo', assignedTo: 2 },
      { id: 4, title: 'Frontend product listing', description: 'Build product grid with filters', priority: 'Medium', deadline: '2026-05-25', status: 'Todo', assignedTo: 1 },
    ]
  },
  {
    id: 2, name: 'Analytics Dashboard', description: 'Real-time business intelligence dashboard with custom reporting engine.',
    deadline: '2026-05-15', status: 'Todo', members: [1, 2], createdBy: 2,
    tasks: [
      { id: 5, title: 'Data pipeline setup', description: 'Set up ETL pipeline for analytics data', priority: 'High', deadline: '2026-05-01', status: 'In Progress', assignedTo: 1 },
      { id: 6, title: 'Chart components', description: 'Build reusable chart library', priority: 'Medium', deadline: '2026-05-08', status: 'Todo', assignedTo: 2 },
    ]
  },
  {
    id: 3, name: 'Mobile App — iOS/Android', description: 'Cross-platform React Native app for field operations and offline support.',
    deadline: '2026-08-31', status: 'In Progress', members: [1, 3], createdBy: 1,
    tasks: [
      { id: 7, title: 'Navigation setup', description: 'Configure React Navigation stack', priority: 'Low', deadline: '2026-06-15', status: 'Done', assignedTo: 3 },
      { id: 8, title: 'Offline sync mechanism', description: 'Implement local storage with sync', priority: 'High', deadline: '2026-07-20', status: 'Todo', assignedTo: 3 },
    ]
  },
];

export function AppProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('erp_user')); } catch { return null; }
  });

  const [projects, setProjects] = useState(() => {
    try { return JSON.parse(localStorage.getItem('erp_projects')) || INITIAL_PROJECTS; } catch { return INITIAL_PROJECTS; }
  });

  const [users] = useState(MOCK_USERS);
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    localStorage.setItem('erp_projects', JSON.stringify(projects));
  }, [projects]);

  const login = (email, password) => {
    const found = MOCK_USERS.find(u => u.email === email && u.password === password);
    if (found) {
      const { password: _, ...safeUser } = found;
      setUser(safeUser);
      localStorage.setItem('erp_user', JSON.stringify(safeUser));
      return { success: true };
    }
    return { success: false, error: 'Invalid credentials' };
  };

  const register = (name, email, password, role) => {
    if (MOCK_USERS.find(u => u.email === email)) {
      return { success: false, error: 'Email already registered' };
    }
    const newUser = {
      id: Date.now(), name, email, role: role || 'Developer',
      avatar: name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    };
    setUser(newUser);
    localStorage.setItem('erp_user', JSON.stringify(newUser));
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('erp_user');
    setActiveView('dashboard');
    setSelectedProject(null);
  };

  // Project CRUD
  const createProject = (data) => {
    const newProject = {
      id: Date.now(), ...data, members: [user.id], createdBy: user.id, tasks: [],
    };
    setProjects(prev => [newProject, ...prev]);
    return newProject;
  };

  const updateProject = (id, data) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
  };

  const deleteProject = (id) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    if (selectedProject?.id === id) { setSelectedProject(null); setActiveView('projects'); }
  };

  // Task CRUD
  const createTask = (projectId, data) => {
    const newTask = { id: Date.now(), ...data };
    setProjects(prev => prev.map(p =>
      p.id === projectId ? { ...p, tasks: [...p.tasks, newTask] } : p
    ));
    if (selectedProject?.id === projectId) {
      setSelectedProject(prev => ({ ...prev, tasks: [...prev.tasks, newTask] }));
    }
  };

  const updateTask = (projectId, taskId, data) => {
    setProjects(prev => prev.map(p =>
      p.id === projectId
        ? { ...p, tasks: p.tasks.map(t => t.id === taskId ? { ...t, ...data } : t) }
        : p
    ));
    if (selectedProject?.id === projectId) {
      setSelectedProject(prev => ({
        ...prev,
        tasks: prev.tasks.map(t => t.id === taskId ? { ...t, ...data } : t)
      }));
    }
  };

  const deleteTask = (projectId, taskId) => {
    setProjects(prev => prev.map(p =>
      p.id === projectId ? { ...p, tasks: p.tasks.filter(t => t.id !== taskId) } : p
    ));
    if (selectedProject?.id === projectId) {
      setSelectedProject(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== taskId) }));
    }
  };

  const openProject = (project) => {
    setSelectedProject(project);
    setActiveView('project-detail');
  };

  // Computed stats
  const allTasks = projects.flatMap(p => p.tasks);
  const stats = {
    totalProjects: projects.length,
    activeProjects: projects.filter(p => p.status === 'In Progress').length,
    totalTasks: allTasks.length,
    doneTasks: allTasks.filter(t => t.status === 'Done').length,
    pendingTasks: allTasks.filter(t => t.status !== 'Done').length,
    highPriorityTasks: allTasks.filter(t => t.priority === 'High' && t.status !== 'Done').length,
  };

  return (
    <AppContext.Provider value={{
      user, users, projects, stats, activeView, selectedProject,
      login, logout, register,
      setActiveView, openProject, setSelectedProject,
      createProject, updateProject, deleteProject,
      createTask, updateTask, deleteTask,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
