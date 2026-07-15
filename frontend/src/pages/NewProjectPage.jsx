import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchWithAuth } from '../api/client';
import RichTextEditor from '../components/RichTextEditor';
import { FiTrash2 } from 'react-icons/fi';
import AutocompleteInput from '../components/ui/AutocompleteInput';
import {
  CATEGORY_SUGGESTIONS,
  STAGE_SUGGESTIONS,
  CITY_SUGGESTIONS,
  ROLE_SUGGESTIONS
} from '../constants/suggestions';

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

  const removeRole = (index) => {
    if (roles.length > 1) {
      setRoles(roles.filter((_, idx) => idx !== index));
    } else {
      setRoles([{ title: '', skills: '', slots: 1 }]);
    }
  };

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
          <RichTextEditor value={formData.description} onChange={(val) => setFormData({ ...formData, description: val })} placeholder="Краткое описание" />
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Категория *</label>
            <AutocompleteInput required name="category" value={formData.category} onChange={handleChange} suggestions={CATEGORY_SUGGESTIONS} placeholder="Выберите или введите..." />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Стадия *</label>
            <AutocompleteInput required name="stage" value={formData.stage} onChange={handleChange} suggestions={STAGE_SUGGESTIONS} placeholder="Выберите или введите..." />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Город *</label>
          <AutocompleteInput required name="city" value={formData.city} onChange={handleChange} suggestions={CITY_SUGGESTIONS} placeholder="Выберите или введите свой..." />
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
              <div
                key={idx}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  padding: '1rem',
                  background: 'var(--surface-raised)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                }}
              >
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <AutocompleteInput
                      name="title"
                      placeholder="Роль (напр. Frontend Dev)"
                      value={role.title}
                      onChange={e => updateRole(idx, 'title', e.target.value)}
                      suggestions={ROLE_SUGGESTIONS}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 500 }}>Мест:</span>
                    <input
                      type="number"
                      className="input"
                      min="1"
                      value={role.slots}
                      onChange={e => updateRole(idx, 'slots', parseInt(e.target.value) || 1)}
                      style={{ width: '64px', textAlign: 'center', padding: '0.625rem 0.375rem' }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeRole(idx)}
                    className="btn btn-ghost btn-sm"
                    style={{ color: 'var(--danger)', padding: '0.5rem' }}
                    title="Удалить роль"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
                <div>
                  <textarea
                    className="textarea"
                    placeholder="Требования к опыту, стек технологий, задачи..."
                    rows={2}
                    value={role.skills}
                    onChange={e => updateRole(idx, 'skills', e.target.value)}
                    style={{ minHeight: '60px' }}
                  />
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
