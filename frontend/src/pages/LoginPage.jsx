import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { API_BASE_URL } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { FcGoogle } from 'react-icons/fc';
import logoImg from '../assets/logo.webp';

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const { user, setUser } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // If the user is already authenticated, go to home
    if (user) {
      navigate('/');
    }

    const searchParams = new URLSearchParams(location.search);
    const error = searchParams.get('error');
    if (error === 'banned') {
      fetch(`${API_BASE_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => {});
    }
  }, [user, location, navigate]);

  const searchParams = new URLSearchParams(location.search);
  const error = searchParams.get('error');

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE_URL}/api/auth/google/login`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Заполните все поля', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        showToast('Вход выполнен!', 'success');
        navigate('/');
      } else {
        const errText = await res.text();
        if (errText.includes('подтвердите вашу почту')) {
          showToast('Почта не подтверждена. Перенаправляем на страницу верификации...', 'warning');
          sessionStorage.setItem('verify_email', email);
          navigate('/verify');
        } else {
          showToast(errText || 'Неверные данные входа', 'error');
        }
      }
    } catch (err) {
      console.error(err);
      showToast('Ошибка при авторизации', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '1.5rem' }}>
      <div className="bento-card" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
          <img src={logoImg} alt="Nucla Logo" style={{ width: '48px', height: '48px', borderRadius: '10px' }} />
        </div>
        <h1 style={{ marginBottom: '0.5rem', textAlign: 'center' }}>Вход в Nucla</h1>
        
        {error === 'banned' && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl mb-6 text-sm">
            Ваш аккаунт был заблокирован администратором за нарушение правил платформы.
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.375rem', fontWeight: 500, fontSize: 'var(--text-sm)' }}>Email</label>
            <input 
              required 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="input" 
              placeholder="email@example.com" 
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
              <label style={{ fontWeight: 500, fontSize: 'var(--text-sm)' }}>Пароль</label>
              <Link to="/forgot-password" style={{ color: 'var(--accent)', fontSize: 'var(--text-xs)', fontWeight: 500 }}>
                Забыли пароль?
              </Link>
            </div>
            <input 
              required 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="input" 
              placeholder="Пароль" 
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Вход...' : 'Войти'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0', color: 'var(--text-secondary)' }}>
          <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border)' }} />
          <span style={{ padding: '0 0.75rem', fontSize: 'var(--text-xs)' }}>ИЛИ</span>
          <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border)' }} />
        </div>

        <button 
          onClick={handleGoogleLogin} 
          className="btn btn-outline" 
          style={{ width: '100%', padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
        >
          <FcGoogle size={20} /> Войти через Google
        </button>

        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
          Нет аккаунта?{' '}
          <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 600 }}>
            Регистрация
          </Link>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
