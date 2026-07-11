import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import FeedPage from './pages/FeedPage';
import ProjectPage from './pages/ProjectPage';
import NewProjectPage from './pages/NewProjectPage';
import EditProjectPage from './pages/EditProjectPage';
import ProfilePage from './pages/ProfilePage';
import UserPage from './pages/UserPage';
import LoginPage from './pages/LoginPage';
import OAuthCallbackPage from './pages/OAuthCallbackPage';
import DashboardPage from './pages/DashboardPage';
import MyApplicationsPage from './pages/MyApplicationsPage';
import BookmarksPage from './pages/BookmarksPage';
import NotificationsPage from './pages/NotificationsPage';
import MessagesPage from './pages/MessagesPage';
import AdminDashboard from './pages/AdminDashboard';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import { FiMenu, FiSun, FiMoon } from 'react-icons/fi';

// Mobile top bar with burger button
function MobileTopBar({ onOpen }) {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const titles = {
    '/': 'Лента',
    '/dashboard': 'Мои проекты',
    '/applications': 'Мои отклики',
    '/bookmarks': 'Сохранённое',
    '/profile': 'Профиль',
    '/new': 'Новый проект',
    '/login': 'Вход',
  };
  const title = titles[location.pathname] ?? 'Nucla';

  return (
    <div className="mobile-topbar">
      <button onClick={onOpen} className="mobile-topbar__btn">
        <FiMenu size={22} />
      </button>
      <span className="mobile-topbar__title">{title}</span>
      <button onClick={toggleTheme} className="mobile-topbar__btn">
        {theme === 'light' ? <FiMoon size={22} /> : <FiSun size={22} />}
      </button>
    </div>
  );
}

function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Close on resize to desktop
  useEffect(() => {
    const handler = () => {
      if (window.innerWidth > 768) setMobileOpen(false);
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const sidebarWidth = collapsed ? 64 : 240;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 29,
            backdropFilter: 'blur(2px)',
            animation: 'fadeIn 0.15s ease',
          }}
        />
      )}

      {/* Sidebar */}
      <div className={mobileOpen ? 'mobile-open-sidebar' : ''}>
        <Sidebar
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onToggle={() => setCollapsed(v => !v)}
          onCloseMobile={() => setMobileOpen(false)}
        />
      </div>

      {/* Main content */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          marginLeft: `${sidebarWidth}px`,
          transition: 'margin-left 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        className="main-content-area"
      >
        {/* Mobile top bar */}
        <MobileTopBar onOpen={() => setMobileOpen(true)} />

        <main>
          <Routes>
            <Route path="/" element={<FeedPage />} />
            <Route path="/project/:id" element={<ProjectPage />} />
            <Route path="/new" element={
              <ProtectedRoute><NewProjectPage /></ProtectedRoute>
            } />
            <Route path="/project/:id/edit" element={
              <ProtectedRoute><EditProjectPage /></ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute><ProfilePage /></ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute><DashboardPage /></ProtectedRoute>
            } />
            <Route path="/applications" element={
              <ProtectedRoute><MyApplicationsPage /></ProtectedRoute>
            } />
            <Route path="/notifications" element={
              <ProtectedRoute><NotificationsPage /></ProtectedRoute>
            } />
            <Route path="/messages" element={
              <ProtectedRoute><MessagesPage /></ProtectedRoute>
            } />
            <Route path="/messages/:id" element={
              <ProtectedRoute><MessagesPage /></ProtectedRoute>
            } />
            <Route path="/user/:id" element={<UserPage />} />
            <Route path="/bookmarks" element={
              <ProtectedRoute><BookmarksPage /></ProtectedRoute>
            } />
            <Route path="/admin" element={
              <AdminRoute><AdminDashboard /></AdminRoute>
            } />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/api/auth/google/callback" element={<OAuthCallbackPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <BrowserRouter>
              <Layout />
            </BrowserRouter>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
