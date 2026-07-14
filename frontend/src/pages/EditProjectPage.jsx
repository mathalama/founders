import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchWithAuth, API_BASE_URL } from '../api/client';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import {
  FiArrowLeft, FiPlus, FiTrash2, FiCheck, FiSave
} from 'react-icons/fi';
import RichTextEditor from '../components/RichTextEditor';

function EditProjectPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '', description: '', category: '', stage: '', city: '', website: '', github: '', telegram: '',
  });
  const [roles, setRoles] = useState([]);
  const [roadmap, setRoadmap] = useState([]);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/projects/${id}`);
        if (res.ok) {
          const data = await res.json();
          // Redirect if not owner
          if (user && data.ownerId && user.id !== data.ownerId) {
            navigate(`/project/${id}`);
            return;
          }
          setFormData({
            title: data.title || '',
            description: data.description || '',
            category: data.category || '',
            stage: data.stage || '',
            city: data.city || '',
            website: data.website || '',
            github: data.github || '',
            telegram: data.telegram || '',
          });
          setRoles(data.roles || []);
          setRoadmap(data.roadmap || []);
        }
      } catch (err) {
        showToast('Ошибка загрузки проекта', 'error');
      }
      setLoading(false);
    };
    if (user) fetchProject();
  }, [id, user]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Roles
  const addRole = () => setRoles(prev => [...prev, { id: `new-${Date.now()}`, title: '', skills: '', slots: 1, status: 'open' }]);
  const updateRole = (idx, field, val) => setRoles(prev => prev.map((r, i) => i === idx ? { ...r, [field]: val } : r));
  const removeRole = (idx) => setRoles(prev => prev.filter((_, i) => i !== idx));

  // Roadmap
  const addRoadmapItem = () => setRoadmap(prev => [...prev, { id: `new-${Date.now()}`, title: '', done: false, sortOrder: prev.length }]);
  const updateRoadmapItem = (idx, field, val) => setRoadmap(prev => prev.map((r, i) => i === idx ? { ...r, [field]: val } : r));
  const removeRoadmapItem = (idx) => setRoadmap(prev => prev.filter((_, i) => i !== idx));
  const toggleRoadmapDone = (idx) => setRoadmap(prev => prev.map((r, i) => i === idx ? { ...r, done: !r.done } : r));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formData,
        roles: roles.filter(r => r.title.trim()),
        roadmap: roadmap.filter(r => r.title.trim()),
      };
      const res = await fetchWithAuth(`/api/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        showToast('Проект успешно обновлён! ✓', 'success');
        navigate(`/project/${id}`);
      } else {
        const err = await res.text();
        showToast(`Ошибка: ${err}`, 'error');
      }
    } catch (err) {
      showToast('Ошибка соединения', 'error');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>
        <div className="skeleton skeleton-title" style={{ width: '40%', marginBottom: '2rem' }} />
        <div className="skeleton-card">
          {[1, 2, 3, 4].map(i => (
            <div key={i}>
              <div className="skeleton skeleton-text-sm" style={{ width: '25%', marginBottom: '0.375rem' }} />
              <div className="skeleton" style={{ height: '42px', marginBottom: '1rem', borderRadius: 'var(--radius-md)' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      {/* Back nav */}
      <Link to={`/project/${id}`} className="btn btn-ghost btn-sm" style={{ marginBottom: '1.5rem' }}>
        <FiArrowLeft size={15} /> Назад к проекту
      </Link>

      <h1 style={{ marginBottom: '2rem' }}>Редактировать проект</h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* Main info */}
        <div className="bento-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3>Основная информация</h3>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: 'var(--text-sm)' }}>
              Название *
            </label>
            <input required name="title" value={formData.title} onChange={handleChange} className="input" placeholder="Название проекта" />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: 'var(--text-sm)' }}>
              Описание *
            </label>
            <RichTextEditor value={formData.description} onChange={(val) => setFormData(prev => ({ ...prev, description: val }))} placeholder="Краткое описание проекта" />
          </div>

          <div style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 160px' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: 'var(--text-sm)' }}>Категория</label>
              <input list="category-suggestions" name="category" value={formData.category} onChange={handleChange} className="input" placeholder="Выберите или введите..." autoComplete="off" />
              <datalist id="category-suggestions">
                <option value="AI" />
                <option value="SaaS" />
                <option value="EdTech" />
                <option value="FinTech" />
                <option value="E-commerce" />
                <option value="HealthTech" />
                <option value="GameDev" />
                <option value="Web3" />
                <option value="Mobile" />
                <option value="Marketplace" />
                <option value="Social" />
              </datalist>
            </div>
            <div style={{ flex: '1 1 160px' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: 'var(--text-sm)' }}>Стадия</label>
              <input list="stage-suggestions" name="stage" value={formData.stage} onChange={handleChange} className="input" placeholder="Выберите или введите..." autoComplete="off" />
              <datalist id="stage-suggestions">
                <option value="Идея" />
                <option value="Прототип" />
                <option value="MVP" />
                <option value="Есть первые пользователи" />
                <option value="Есть выручка" />
                <option value="Масштабирование" />
              </datalist>
            </div>
            <div style={{ flex: '1 1 160px' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: 'var(--text-sm)' }}>Город</label>
              <input list="city-suggestions" name="city" value={formData.city} onChange={handleChange} className="input" placeholder="Выберите или введите свой..." autoComplete="off" />
              <datalist id="city-suggestions">
                <option value="Remote" />
                <option value="Astana" />
                <option value="Almaty" />
                <option value="Shymkent" />
                <option value="Aktau" />
                <option value="Aktobe" />
                <option value="Atyrau" />
                <option value="Karaganda" />
                <option value="Kokshetau" />
                <option value="Kostanay" />
                <option value="Kyzylorda" />
                <option value="Pavlodar" />
                <option value="Petropavl" />
                <option value="Semey" />
                <option value="Taldykorgan" />
                <option value="Taraz" />
                <option value="Turkestan" />
                <option value="Uralsk" />
                <option value="Oskemen" />
                <option value="Jezkazgan" />
                <option value="Konaev" />
                <option value="Abai Region" />
                <option value="Akmola Region" />
                <option value="Aktobe Region" />
                <option value="Almaty Region" />
                <option value="Atyrau Region" />
                <option value="East Kazakhstan Region" />
                <option value="Jambyl Region" />
                <option value="Jetisu Region" />
                <option value="Karaganda Region" />
                <option value="Kostanay Region" />
                <option value="Kyzylorda Region" />
                <option value="Mangystau Region" />
                <option value="North Kazakhstan Region" />
                <option value="Pavlodar Region" />
                <option value="Turkestan Region" />
                <option value="Ulytau Region" />
                <option value="West Kazakhstan Region" />
              </datalist>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: 'var(--text-sm)' }}>Сайт</label>
              <input name="website" value={formData.website} onChange={handleChange} className="input" placeholder="https://..." />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: 'var(--text-sm)' }}>GitHub</label>
              <input name="github" value={formData.github} onChange={handleChange} className="input" placeholder="https://github.com/..." />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: 'var(--text-sm)' }}>Telegram *</label>
            <input required name="telegram" value={formData.telegram} onChange={handleChange} className="input" placeholder="@username или https://t.me/..." />
          </div>
        </div>

        {/* Roadmap */}
        <div className="bento-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Roadmap</h3>
            <button type="button" onClick={addRoadmapItem} className="btn btn-outline btn-sm">
              <FiPlus size={14} /> Добавить этап
            </button>
          </div>
          {roadmap.length === 0 && (
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Нет этапов. Добавьте первый шаг.</p>
          )}
          {roadmap.map((item, idx) => (
            <div
              key={item.id || idx}
              style={{
                display: 'flex',
                gap: '0.625rem',
                alignItems: 'center',
                padding: '0.625rem 0.875rem',
                background: item.done ? 'var(--success-bg)' : 'var(--bg)',
                borderRadius: 'var(--radius-md)',
                border: `1px solid ${item.done ? 'var(--success)' : 'var(--border)'}`,
              }}
            >
              {/* Done toggle */}
              <button
                type="button"
                onClick={() => toggleRoadmapDone(idx)}
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  border: `2px solid ${item.done ? 'var(--success)' : 'var(--border)'}`,
                  background: item.done ? 'var(--success)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all var(--transition)',
                }}
              >
                {item.done && <FiCheck size={11} color="white" />}
              </button>
              <input
                className="input"
                style={{ flex: 1, background: 'transparent', border: 'none', padding: '0', textDecoration: item.done ? 'line-through' : 'none', color: item.done ? 'var(--text-muted)' : undefined }}
                value={item.title}
                placeholder="Название этапа..."
                onChange={e => updateRoadmapItem(idx, 'title', e.target.value)}
              />
              <button type="button" onClick={() => removeRoadmapItem(idx)} className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)', padding: '0.25rem' }}>
                <FiTrash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Roles */}
        <div className="bento-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Открытые роли</h3>
            <button type="button" onClick={addRole} className="btn btn-outline btn-sm">
              <FiPlus size={14} /> Добавить роль
            </button>
          </div>
          {roles.length === 0 && (
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Нет ролей. Добавьте кого ищете.</p>
          )}
          {roles.map((role, idx) => (
            <div
              key={role.id || idx}
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
                  <input
                    className="input"
                    placeholder="Название роли (Frontend, Backend...)"
                    value={role.title}
                    onChange={e => updateRole(idx, 'title', e.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 500 }}>Мест:</span>
                  <input
                    type="number"
                    className="input"
                    min="1"
                    value={role.slots || 1}
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

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <Link to={`/project/${id}`} className="btn btn-outline">Отмена</Link>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            <FiSave size={14} /> {saving ? 'Сохраняю...' : 'Сохранить изменения'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditProjectPage;
