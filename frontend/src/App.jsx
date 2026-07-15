import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';

// Lazy-load helper with auto-retry on chunk loading failure (e.g. after a new deployment)
const lazyWithRetry = (componentImport) => {
  return lazy(async () => {
    try {
      return await componentImport();
    } catch (error) {
      console.error("Failed to load chunk, forcing page reload...", error);
      window.location.reload();
      return new Promise(() => {}); // prevent further execution/rendering during reload
    }
  });
};

// Lazy-loaded pages
const FeedPage = lazyWithRetry(() => import('./pages/FeedPage'));
const OnboardingPage = lazyWithRetry(() => import('./pages/OnboardingPage'));
const OAuthCallbackPage = lazyWithRetry(() => import('./pages/OAuthCallbackPage'));
const ProjectPage = lazyWithRetry(() => import('./pages/ProjectPage'));
const NewProjectPage = lazyWithRetry(() => import('./pages/NewProjectPage'));
const EditProjectPage = lazyWithRetry(() => import('./pages/EditProjectPage'));
const ProfilePage = lazyWithRetry(() => import('./pages/ProfilePage'));
const UserPage = lazyWithRetry(() => import('./pages/UserPage'));
const DashboardPage = lazyWithRetry(() => import('./pages/DashboardPage'));
const MyApplicationsPage = lazyWithRetry(() => import('./pages/MyApplicationsPage'));
const BookmarksPage = lazyWithRetry(() => import('./pages/BookmarksPage'));
const NotificationsPage = lazyWithRetry(() => import('./pages/NotificationsPage'));
const MessagesPage = lazyWithRetry(() => import('./pages/MessagesPage'));
const AdminDashboard = lazyWithRetry(() => import('./pages/AdminDashboard'));
const ThreadsPage = lazyWithRetry(() => import('./pages/ThreadsPage'));
const RegisterPage = lazyWithRetry(() => import('./pages/RegisterPage'));
const VerifyPage = lazyWithRetry(() => import('./pages/VerifyPage'));
const ForgotPasswordPage = lazyWithRetry(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazyWithRetry(() => import('./pages/ResetPasswordPage'));
const TermsPage = lazyWithRetry(() => import('./pages/TermsPage'));
const PrivacyPage = lazyWithRetry(() => import('./pages/PrivacyPage'));
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import { FiMenu, FiSun, FiMoon } from 'react-icons/fi';
import { SocketProvider } from './hooks/useRealtime';
import { useNavigate } from 'react-router-dom';

// Mobile top bar with burger button
function MobileTopBar({ onOpen }) {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const titles = {
    '/': 'Лента',
    '/threads': 'Обсуждения',
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
      <button onClick={onOpen} className="mobile-topbar__btn" aria-label="Открыть меню">
        <FiMenu size={22} />
      </button>
      <span className="mobile-topbar__title">{title}</span>
      <button onClick={toggleTheme} className="mobile-topbar__btn" aria-label="Переключить тему">
        {theme === 'light' ? <FiMoon size={22} /> : <FiSun size={22} />}
      </button>
    </div>
  );
}

// Simple page loader for Suspense
function PageLoader() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--accent)', animation: 'app-spin 1s linear infinite' }} />
      <style>{`
        @keyframes app-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  // Redirect to onboarding if profile is empty
  useEffect(() => {
    if (!isLoading && user && (!user.roleTitle || user.roleTitle.trim() === '')) {
      if (location.pathname !== '/onboarding' && location.pathname !== '/api/auth/google/callback') {
        navigate('/onboarding');
      }
    }
  }, [user, isLoading, location.pathname, navigate]);

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

  const isAuthRoute = ['/login', '/register', '/verify', '/forgot-password', '/reset-password', '/terms', '/privacy'].includes(location.pathname);

  if (isAuthRoute) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
        <main style={{ flex: 1, padding: 0 }}>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/verify" element={<VerifyPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    );
  }

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
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<FeedPage />} />
              <Route path="/threads" element={<ThreadsPage />} />
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
              <Route path="/onboarding" element={
                <ProtectedRoute><OnboardingPage /></ProtectedRoute>
              } />
              <Route path="/api/auth/google/callback" element={<OAuthCallbackPage />} />
            </Routes>
          </Suspense>
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
          <SocketProvider>
            <ToastProvider>
              <BrowserRouter>
                <Layout />
              </BrowserRouter>
            </ToastProvider>
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
