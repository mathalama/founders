import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API_BASE_URL } from '../api/client';
import { useToast } from '../context/ToastContext';
import logoImg from '../assets/logo.webp';

function ForgotPasswordPage() {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      showToast('Введите адрес почты', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setSubmitted(true);
        showToast('Ссылка для сброса пароля отправлена!', 'success');
      } else {
        const errText = await res.text();
        showToast(errText || 'Ошибка при восстановлении пароля', 'error');
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
        <h1 style={{ marginBottom: '0.5rem' }}>Восстановление пароля</h1>
        
        {submitted ? (
          <div>
            <p style={{ color: 'var(--text-secondary)', margin: '2rem 0', fontSize: 'var(--text-sm)', lineHeight: '1.6' }}>
              Ссылка для сброса пароля была отправлена на адрес <strong>{email}</strong>. 
              Пожалуйста, проверьте папку «Входящие» и «Спам».
            </p>
            <Link to="/login" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }}>
              Вернуться ко входу
            </Link>
          </div>
        ) : (
          <>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: 'var(--text-sm)' }}>
              Введите ваш адрес почты, чтобы получить ссылку для сброса пароля.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'left' }}>
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

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Отправка...' : 'Получить ссылку'}
              </button>
            </form>

            <div style={{ marginTop: '1.5rem' }}>
              <Link to="/login" style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', fontWeight: 500 }}>
                Вернуться на страницу входа
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
