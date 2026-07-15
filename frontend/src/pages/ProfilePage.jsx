import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchWithAuth } from '../api/client';
import { useToast } from '../context/ToastContext';
import TagInput from '../components/ui/TagInput';
import AutocompleteInput from '../components/ui/AutocompleteInput';
import { ROLE_SUGGESTIONS } from '../constants/suggestions';

function ProfilePage() {
  const { user, setUser } = useAuth();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    roleTitle: '', skills: [], emailNotifications: true, github: '', telegram: '', bio: '', openToOffers: false
  });

  useEffect(() => {
    if (user) {
      setFormData({
        roleTitle: user.roleTitle || '',
        skills: user.skills || [],
        emailNotifications: user.emailNotifications !== false, // default true
        github: user.github || '',
        telegram: user.telegram || '',
        bio: user.bio || '',
        openToOffers: user.openToOffers === true
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
        skills: formData.skills,
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
          <AutocompleteInput
            name="roleTitle"
            value={formData.roleTitle}
            onChange={handleChange}
            suggestions={ROLE_SUGGESTIONS}
            placeholder="Frontend, Backend, DevOps, Design..."
          />
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '0.375rem' }}>
            Введите свою роль или выберите из списка
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Навыки</label>
          <TagInput tags={formData.skills} onChange={(newSkills) => setFormData(prev => ({ ...prev, skills: newSkills }))} placeholder="Введите навык (например, React) и нажмите Enter..." />
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
            checked={!!formData.emailNotifications} 
            onChange={(e) => setFormData(prev => ({ ...prev, emailNotifications: e.target.checked }))} 
            style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--primary)', cursor: 'pointer' }}
          />
          <label htmlFor="emailNotifications" style={{ fontWeight: 500, cursor: 'pointer', userSelect: 'none' }}>
            Получать уведомления на почту (Email)
          </label>
        </div>



        <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>Сохранить</button>
      </form>
    </div>
  );
}

export default ProfilePage;
