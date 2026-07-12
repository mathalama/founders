import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchWithAuth } from '../api/client';
import { useToast } from '../context/ToastContext';

function ProfilePage() {
  const { user, setUser } = useAuth();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    roleTitle: '', skills: '', experience: '', emailNotifications: true, github: '', telegram: '', bio: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        roleTitle: user.roleTitle || '',
        skills: user.skills ? user.skills.join(', ') : '',
        experience: user.experience || '',
        emailNotifications: user.emailNotifications !== false, // default true
        github: user.github || '',
        telegram: user.telegram || '',
        bio: user.bio || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ 
      ...formData, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        skills: formData.skills.split(',').map(s => s.trim()).filter(s => s !== ''),
        experience: formData.experience,
        emailNotifications: formData.emailNotifications
      };

      const res = await fetchWithAuth('/api/profile', {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const updatedUser = await res.json();
        setUser(updatedUser);
        showToast('Профиль успешно сохранён ✓', 'success');
      } else {
        showToast('Ошибка при сохранении профиля', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Ошибка соединения', 'error');
    }
  };

  if (!user) return null;

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '2rem' }}>Профиль</h1>
      <form onSubmit={handleSubmit} className="bento-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Имя *</label>
          <input disabled className="input" value={user.name} style={{ backgroundColor: 'var(--bg)' }} />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Email *</label>
          <input disabled className="input" value={user.email} style={{ backgroundColor: 'var(--bg)' }} />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Роль</label>
          <input
            list="role-suggestions"
            name="roleTitle"
            value={formData.roleTitle}
            onChange={handleChange}
            className="input"
            placeholder="Frontend, Backend, DevOps, Design..."
            autoComplete="off"
          />
          <datalist id="role-suggestions">
            <option value="Frontend Developer" />
            <option value="Backend Developer" />
            <option value="Full Stack Developer" />
            <option value="Mobile Developer" />
            <option value="DevOps / SRE" />
            <option value="Data Scientist" />
            <option value="ML Engineer" />
            <option value="UI/UX Designer" />
            <option value="Product Manager" />
            <option value="Marketing" />
            <option value="Founder / CEO" />
            <option value="Business Analyst" />
            <option value="QA Engineer" />
          </datalist>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '0.375rem' }}>
            Введите свою роль или выберите из списка
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Навыки (через запятую)</label>
          <input name="skills" value={formData.skills} onChange={handleChange} className="input" placeholder="React, TypeScript, Figma" />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Опыт</label>
          <input name="experience" type="text" value={formData.experience} onChange={handleChange} className="input" placeholder="Например: 3 года, Junior, Middle..." />
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>GitHub</label>
            <input name="github" value={formData.github} onChange={handleChange} className="input" placeholder="https://github.com/..." />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Telegram</label>
            <input name="telegram" value={formData.telegram} onChange={handleChange} className="input" placeholder="@username" />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>О себе</label>
          <textarea name="bio" value={formData.bio} onChange={handleChange} className="textarea" rows="3" placeholder="Пару слов о себе"></textarea>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
          <input 
            type="checkbox" 
            id="emailNotifications" 
            name="emailNotifications" 
            checked={formData.emailNotifications} 
            onChange={handleChange} 
            style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--primary)' }}
          />
          <label htmlFor="emailNotifications" style={{ fontWeight: 500, cursor: 'pointer' }}>
            Получать уведомления на почту (Email)
          </label>
        </div>

        <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'var(--bg)', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
          <h3 style={{ marginBottom: '0.5rem' }}>Web-Push Уведомления</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Включите уведомления, чтобы мгновенно узнавать о новых сообщениях и откликах, даже когда вкладка закрыта.
          </p>
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={async () => {
              try {
                if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
                  showToast('Ваш браузер не поддерживает Push-уведомления', 'error');
                  return;
                }
                
                const registration = await navigator.serviceWorker.ready;
                const permission = await Notification.requestPermission();
                
                if (permission !== 'granted') {
                  showToast('Вы заблокировали уведомления. Разрешите их в настройках браузера.', 'error');
                  return;
                }

                // Fetch VAPID public key from backend
                const keyRes = await fetchWithAuth('/api/notifications/push-key');
                if (!keyRes.ok) {
                  showToast('Не удалось получить ключ конфигурации push-уведомлений', 'error');
                  return;
                }
                const { publicKey: VAPID_PUBLIC_KEY } = await keyRes.json();
                if (!VAPID_PUBLIC_KEY) {
                  showToast('Ошибка конфигурации: VAPID ключ не найден на сервере', 'error');
                  return;
                }

                const urlBase64ToUint8Array = (base64String) => {
                  const padding = '='.repeat((4 - base64String.length % 4) % 4);
                  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
                  const rawData = window.atob(base64);
                  const outputArray = new Uint8Array(rawData.length);
                  for (let i = 0; i < rawData.length; ++i) {
                    outputArray[i] = rawData.charCodeAt(i);
                  }
                  return outputArray;
                };

                let subscription = await registration.pushManager.getSubscription();
                if (!subscription) {
                  subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
                  });
                }

                await fetchWithAuth('/api/notifications/subscribe', {
                  method: 'POST',
                  body: JSON.stringify(subscription),
                });
                
                showToast('Push-уведомления успешно включены!', 'success');
              } catch (error) {
                console.error('Error registering push:', error);
                showToast('Произошла ошибка при включении уведомлений', 'error');
              }
            }}
          >
            Включить Web-Push
          </button>
        </div>

        <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>Сохранить</button>
      </form>
    </div>
  );
}

export default ProfilePage;
