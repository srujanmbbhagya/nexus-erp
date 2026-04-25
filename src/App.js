import React from 'react';
import { Toaster } from 'react-hot-toast';
import { AppProvider, useApp } from './context/AppContext';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import AllTasks from './pages/AllTasks';
import KanbanBoard from './pages/KanbanBoard';
import Team from './pages/Team';
import Sidebar from './components/Sidebar';
import './index.css';

function AppInner() {
  const { user, activeView } = useApp();

  if (!user) return <AuthPage />;

  const renderPage = () => {
    switch (activeView) {
      case 'dashboard': return <Dashboard />;
      case 'projects': return <Projects />;
      case 'project-detail': return <ProjectDetail />;
      case 'tasks': return <AllTasks />;
      case 'kanban': return <KanbanBoard />;
      case 'team': return <Team />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-active)',
            fontFamily: 'Syne, sans-serif',
            fontSize: 13,
            borderRadius: 4,
          },
        }}
      />
    </AppProvider>
  );
}
