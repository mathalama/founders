import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API_BASE_URL } from '../api/client';
import { useToast } from '../context/ToastContext';
import logoImg from '../assets/logo.webp';

function RegisterPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      showToast('Пароли не совпадают', 'error');
      return;
    }

    if (formData.password.length < 6) {
      showToast('Пароль должен содержать минимум 6 символов', 'error');
      return;
    }

    if (!agreed) {
      showToast('Вы должны принять условия использования и политику конфиденциальности', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password
        })
      });

      if (res.ok) {
        showToast('Код верификации отправлен на почту!', 'success');
        sessionStorage.setItem('verify_email', formData.email);
        navigate('/verify');
      } else {
        const errText = await res.text();
        showToast(errText || 'Ошибка при регистрации', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Ошибка соединения с сервером', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '1.5rem' }}>
      <div className="bento-card" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
          <img src={logoImg} alt="Nucla Logo" style={{ width: '48px', height: '48px', borderRadius: '10px' }} />
        </div>
        <h1 style={{ marginBottom: '0.5rem', textAlign: 'center' }}>Регистрация</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', textAlign: 'center', fontSize: 'var(--text-sm)' }}>
          Создайте аккаунт, чтобы начать поиск кофаундеров.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.375rem', fontWeight: 500, fontSize: 'var(--text-sm)' }}>Имя *</label>
            <input 
              required 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              className="input" 
              placeholder="Александр" 
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.375rem', fontWeight: 500, fontSize: 'var(--text-sm)' }}>Email *</label>
            <input 
              required 
              type="email" 
              name="email" 
              value={formData.email} 
              onChange={handleChange} 
              className="input" 
              placeholder="alex@example.com" 
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.375rem', fontWeight: 500, fontSize: 'var(--text-sm)' }}>Пароль *</label>
            <input 
              required 
              type="password" 
              name="password" 
              value={formData.password} 
              onChange={handleChange} 
              className="input" 
              placeholder="Минимум 6 символов" 
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.375rem', fontWeight: 500, fontSize: 'var(--text-sm)' }}>Подтвердите пароль *</label>
            <input 
              required 
              type="password" 
              name="confirmPassword" 
              value={formData.confirmPassword} 
              onChange={handleChange} 
              className="input" 
              placeholder="Повторите ввод пароля" 
            />
          </div>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer', fontSize: 'var(--text-xs)', marginTop: '0.25rem' }}>
            <input 
              type="checkbox" 
              required 
              checked={agreed} 
              onChange={e => setAgreed(e.target.checked)} 
              style={{ marginTop: '0.2rem', accentColor: 'var(--primary)' }} 
            />
            <span style={{ color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              Я принимаю{' '}
              <Link to="/terms" target="_blank" style={{ color: 'var(--accent)', fontWeight: 500, textDecoration: 'underline' }}>
                Условия использования
              </Link>{' '}
              и{' '}
              <Link to="/privacy" target="_blank" style={{ color: 'var(--accent)', fontWeight: 500, textDecoration: 'underline' }}>
                Политику конфиденциальности
              </Link>
            </span>
          </label>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
          Уже есть аккаунт?{' '}
          <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>
            Войти
          </Link>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
