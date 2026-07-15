import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API_BASE_URL } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

function VerifyPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const { showToast } = useToast();
  
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const storedEmail = sessionStorage.getItem('verify_email');
    if (storedEmail) {
      setEmail(storedEmail);
    } else {
      showToast('Пожалуйста, введите почту для верификации', 'info');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (pin.length !== 6) {
      showToast('PIN-код должен состоять из 6 цифр', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/verify-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, pin }),
      });

      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        showToast('Почта успешно подтверждена!', 'success');
        sessionStorage.removeItem('verify_email');
        navigate('/');
      } else {
        const errText = await res.text();
        showToast(errText || 'Неверный или просроченный код', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Ошибка верификации', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      showToast('Введите адрес почты', 'error');
      return;
    }

    setIsResending(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/resend-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        showToast('Новый PIN-код отправлен!', 'success');
      } else {
        const errText = await res.text();
        showToast(errText || 'Ошибка отправки кода', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Ошибка соединения', 'error');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '1.5rem' }}>
      <div className="bento-card" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem 2rem', textAlign: 'center' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>Подтверждение почты</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: 'var(--text-sm)' }}>
          Мы отправили 6-значный код подтверждения на <strong>{email || 'вашу почту'}</strong>.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'left' }}>
          {!sessionStorage.getItem('verify_email') && (
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
          )}

          <div>
            <label style={{ display: 'block', marginBottom: '0.375rem', fontWeight: 500, fontSize: 'var(--text-sm)' }}>PIN-код</label>
            <input 
              required 
              type="text" 
              maxLength="6" 
              value={pin} 
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} 
              className="input" 
              placeholder="123456" 
              style={{ letterSpacing: '4px', textAlign: 'center', fontSize: '1.25rem', fontWeight: 'bold' }}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Проверка...' : 'Подтвердить почту'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
          Не получили код?{' '}
          <button 
            onClick={handleResend} 
            disabled={isResending} 
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--accent)', 
              fontWeight: 600, 
              cursor: 'pointer', 
              textDecoration: 'underline',
              padding: 0,
              fontFamily: 'inherit'
            }}
          >
            {isResending ? 'Отправка...' : 'Отправить повторно'}
          </button>
        </div>

        <div style={{ marginTop: '1.5rem' }}>
          <Link to="/login" style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', fontWeight: 500 }}>
            Вернуться на страницу входа
          </Link>
        </div>
      </div>
    </div>
  );
}

export default VerifyPage;
