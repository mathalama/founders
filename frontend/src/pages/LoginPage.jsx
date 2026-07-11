import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_BASE_URL } from '../api/client';
import { useAuth } from '../context/AuthContext';

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const { user } = useAuth();

  useEffect(() => {
    // If the user is already authenticated (AuthContext fetched /me successfully), go to home
    if (user) {
      navigate('/');
    }

    const searchParams = new URLSearchParams(location.search);
    const error = searchParams.get('error');
    if (error === 'banned') {
      // The backend handled the cookie, but we can call logout to be safe
      fetch(`${API_BASE_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => {});
    }
  }, [user, location, navigate]);

  const searchParams = new URLSearchParams(location.search);
  const error = searchParams.get('error');

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE_URL}/api/auth/google/login`;
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div className="bento-card" style={{ width: '100%', maxWidth: '400px', textAlign: 'center', padding: '3rem 2rem' }}>
        <h1 style={{ marginBottom: '1rem' }}>Вход</h1>
        {error === 'banned' && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl mb-6 text-sm">
            Ваш аккаунт был заблокирован администратором за нарушение правил платформы.
          </div>
        )}
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          Войдите через Google, чтобы откликаться на проекты и создавать свои.
        </p>
        <button onClick={handleGoogleLogin} className="btn btn-primary" style={{ width: '100%', padding: '0.75rem', fontSize: '1rem' }}>
          Войти через Google
        </button>
      </div>
    </div>
  );
}

export default LoginPage;
