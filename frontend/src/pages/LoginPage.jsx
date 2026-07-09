import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_BASE_URL } from '../api/client';

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if we came back from OAuth with a token
    const searchParams = new URLSearchParams(location.search);
    const token = searchParams.get('token');
    
    if (token) {
      localStorage.setItem('token', token);
      navigate('/');
    }
  }, [location, navigate]);

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE_URL}/api/auth/google/login`;
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div className="bento-card" style={{ width: '100%', maxWidth: '400px', textAlign: 'center', padding: '3rem 2rem' }}>
        <h1 style={{ marginBottom: '1rem' }}>Вход</h1>
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
