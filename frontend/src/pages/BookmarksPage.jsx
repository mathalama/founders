import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchWithAuth } from '../api/client';
import { useToast } from '../context/ToastContext';
import { FiCpu, FiMapPin, FiTrendingUp, FiTrash2, FiArrowRight } from 'react-icons/fi';

function BookmarksPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchBookmarks = async () => {
      try {
        const res = await fetchWithAuth('/api/bookmarks');
        if (res.ok) {
          const data = await res.json();
          setProjects(data || []);
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetchBookmarks();
  }, []);

  const removeBookmark = async (id) => {
    try {
      await fetchWithAuth(`/api/projects/${id}/bookmark`, { method: 'POST' });
      setProjects(prev => prev.filter(p => p.id !== id));
      showToast('Проект удалён из закладок', 'info');
    } catch (err) {
      showToast('Ошибка при удалении закладки', 'error');
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div className="skeleton skeleton-title" style={{ width: '30%', marginBottom: '2rem' }} />
        <div className="bento-grid">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton-card">
              <div className="skeleton skeleton-title" />
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <div className="skeleton skeleton-badge" />
                <div className="skeleton skeleton-badge" />
              </div>
              <div className="skeleton skeleton-text" />
              <div className="skeleton skeleton-text-sm" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1>Сохранённое</h1>
        {projects.length > 0 && (
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
            {projects.length} {projects.length === 1 ? 'проект' : 'проектов'}
          </span>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="bento-card">
          <div className="empty-state">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
              <path d="M16 8h32v48l-16-12-16 12V8z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
              <path d="M24 24h16M24 32h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <h3>Нет сохранённых проектов</h3>
            <p>Нажмите «Сохранить» на странице проекта, чтобы добавить его сюда.</p>
            <Link to="/" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
              Найти проекты
            </Link>
          </div>
        </div>
      ) : (
        <div className="bento-grid animate-stagger">
          {projects.map((p, i) => (
            <div
              key={p.id}
              className="bento-card"
              style={{ display: 'flex', flexDirection: 'column', animationDelay: `${i * 60}ms` }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.875rem' }}>
                <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>{p.title}</h2>
                <button
                  onClick={() => removeBookmark(p.id)}
                  className="btn btn-ghost btn-sm"
                  style={{ color: 'var(--danger)', padding: '0.25rem' }}
                  title="Удалить из закладок"
                >
                  <FiTrash2 size={15} />
                </button>
              </div>

              <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '0.875rem' }}>
                <span className="badge"><FiCpu size={11} /> {p.category}</span>
                <span className="badge"><FiMapPin size={11} /> {p.city}</span>
                <span className="badge"><FiTrendingUp size={11} /> {p.stage}</span>
              </div>

              <p style={{
                flex: 1,
                color: 'var(--text-secondary)',
                fontSize: 'var(--text-sm)',
                lineHeight: 1.6,
                marginBottom: '1.25rem',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}>
                {p.description}
              </p>

              <Link to={`/project/${p.id}`} className="btn btn-primary btn-sm">
                Открыть проект <FiArrowRight size={13} />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default BookmarksPage;
