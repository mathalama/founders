import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchWithAuth } from '../api/client';
import { useToast } from '../context/ToastContext';

function ProfilePage() {
  const { user, setUser } = useAuth();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    roleTitle: '', skills: '', experience: 0, github: '', telegram: '', bio: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        roleTitle: user.roleTitle || '',
        skills: user.skills ? user.skills.join(', ') : '',
        experience: user.experience || 0,
        github: user.github || '',
        telegram: user.telegram || '',
        bio: user.bio || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        skills: formData.skills.split(',').map(s => s.trim()).filter(s => s !== ''),
        experience: parseInt(formData.experience) || 0
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
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Опыт (лет)</label>
          <input name="experience" type="number" min="0" value={formData.experience} onChange={handleChange} className="input" />
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

        <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>Сохранить</button>
      </form>
    </div>
  );
}

export default ProfilePage;
