import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchWithAuth } from '../api/client';

function NewProjectPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '', description: '', category: '', stage: '', city: '', website: '', github: '', telegram: ''
  });
  const [roles, setRoles] = useState([{ title: '', skills: '', slots: 1 }]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const addRole = () => setRoles([...roles, { title: '', skills: '', slots: 1 }]);
  
  const updateRole = (index, field, value) => {
    const newRoles = [...roles];
    newRoles[index][field] = value;
    setRoles(newRoles);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData, roles: roles.filter(r => r.title.trim() !== '') };
      const res = await fetchWithAuth('/api/projects', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        navigate(`/project/${data.id}`);
      } else {
        const err = await res.text();
        alert('Ошибка: ' + err);
      }
    } catch (err) {
      console.error(err);
      alert('Ошибка при сохранении проекта');
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '2rem' }}>Создать проект</h1>
      <form onSubmit={handleSubmit} className="bento-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Название проекта *</label>
          <input required name="title" value={formData.title} onChange={handleChange} className="input" placeholder="Название" />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Описание *</label>
          <textarea required name="description" value={formData.description} onChange={handleChange} className="textarea" rows="4" placeholder="Краткое описание"></textarea>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Категория *</label>
            <select required name="category" value={formData.category} onChange={handleChange} className="select">
              <option value="">Выберите...</option>
              <option value="AI">AI</option>
              <option value="SaaS">SaaS</option>
              <option value="EdTech">EdTech</option>
              <option value="FinTech">FinTech</option>
              <option value="E-commerce">E-commerce</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Стадия *</label>
            <select required name="stage" value={formData.stage} onChange={handleChange} className="select">
              <option value="">Выберите...</option>
              <option value="Идея">Идея</option>
              <option value="MVP">MVP</option>
              <option value="Есть пользователи">Есть пользователи</option>
              <option value="Есть выручка">Есть выручка</option>
            </select>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Город *</label>
          <select required name="city" value={formData.city} onChange={handleChange} className="select">
            <option value="">Выберите...</option>
            <option value="Astana">Astana</option>
            <option value="Almaty">Almaty</option>
            <option value="Remote">Remote</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Сайт (необязательно)</label>
            <input name="website" value={formData.website} onChange={handleChange} className="input" placeholder="https://" />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>GitHub (необязательно)</label>
            <input name="github" value={formData.github} onChange={handleChange} className="input" placeholder="https://github.com/..." />
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />

        <div>
          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', fontWeight: 500 }}>
            Открытые роли
            <button type="button" onClick={addRole} className="btn btn-outline" style={{ padding: '0.25rem 0.75rem' }}>+ Добавить</button>
          </label>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {roles.map((role, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ flex: 2 }}>
                  <input className="input" placeholder="Роль (напр. Frontend Dev)" value={role.title} onChange={e => updateRole(idx, 'title', e.target.value)} />
                </div>
                <div style={{ flex: 2 }}>
                  <input className="input" placeholder="Навыки (через запятую)" value={role.skills} onChange={e => updateRole(idx, 'skills', e.target.value)} />
                </div>
                <div style={{ flex: 1 }}>
                  <input type="number" className="input" placeholder="Мест" min="1" value={role.slots} onChange={e => updateRole(idx, 'slots', parseInt(e.target.value))} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Твой Telegram для связи *</label>
          <input required name="telegram" value={formData.telegram} onChange={handleChange} className="input" placeholder="@username" />
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Это единственный канал, куда будут приходить отклики.</div>
        </div>

        <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', padding: '0.75rem' }}>Опубликовать</button>
      </form>
    </div>
  );
}

export default NewProjectPage;
