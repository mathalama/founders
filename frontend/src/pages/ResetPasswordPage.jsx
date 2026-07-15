import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { API_BASE_URL } from '../api/client';
import { useToast } from '../context/ToastContext';
import logoImg from '../assets/logo.png';

function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tokenParam = searchParams.get('token');
    const emailParam = searchParams.get('email');

    if (tokenParam && emailParam) {
      setToken(tokenParam);
      setEmail(emailParam);
    } else {
      showToast('Недействительная ссылка для сброса пароля', 'error');
      navigate('/login');
    }
  }, [location, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      showToast('Пароли не совпадают', 'error');
      return;
    }

    if (password.length < 6) {
      showToast('Пароль должен содержать минимум 6 символов', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, newPassword: password }),
      });

      if (res.ok) {
        showToast('Пароль успешно изменен!', 'success');
        navigate('/login');
      } else {
        const errText = await res.text();
        showToast(errText || 'Ошибка сброса пароля', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Ошибка соединения', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '1.5rem' }}>
      <div className="bento-card" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem 2rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
          <img src={logoImg} alt="Nucla Logo" style={{ width: '48px', height: '48px', borderRadius: '10px' }} />
        </div>
        <h1 style={{ marginBottom: '0.5rem' }}>Установка нового пароля</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: 'var(--text-sm)' }}>
          Для аккаунта <strong>{email}</strong>
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'left' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.375rem', fontWeight: 500, fontSize: 'var(--text-sm)' }}>Новый пароль</label>
            <input 
              required 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="input" 
              placeholder="Минимум 6 символов" 
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.375rem', fontWeight: 500, fontSize: 'var(--text-sm)' }}>Подтвердите новый пароль</label>
            <input 
              required 
              type="password" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              className="input" 
              placeholder="Повторите новый пароль" 
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Сохранение...' : 'Сбросить пароль'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ResetPasswordPage;
