import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchWithAuth } from '../api/client';
import { FiArrowRight, FiClock, FiCheckCircle, FiXCircle } from 'react-icons/fi';

function StatusIcon({ status }) {
  if (status === 'accepted') return <FiCheckCircle size={16} color="var(--success)" />;
  if (status === 'rejected') return <FiXCircle size={16} color="var(--danger)" />;
  return <FiClock size={16} color="var(--warning)" />;
}

function StatusLabel({ status }) {
  if (status === 'accepted') return 'Принят';
  if (status === 'rejected') return 'Отклонён';
  return 'На рассмотрении';
}

function MyApplicationsPage() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApps = async () => {
      try {
        const res = await fetchWithAuth('/api/applications/my');
        if (res.ok) {
          const data = await res.json();
          setApps(data || []);
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetchApps();
  }, []);

  if (loading) {
    return (
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <div className="skeleton skeleton-title" style={{ width: '40%', marginBottom: '2rem' }} />
        {[1, 2, 3].map(i => (
          <div key={i} className="skeleton-card" style={{ marginBottom: '0.875rem' }}>
            <div className="skeleton skeleton-title" style={{ width: '55%' }} />
            <div className="skeleton skeleton-text" />
            <div className="skeleton skeleton-text-sm" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '1.5rem' }}>Мои отклики</h1>

      {apps.length === 0 ? (
        <div className="bento-card">
          <div className="empty-state">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
              <path d="M8 16h48v32a4 4 0 01-4 4H12a4 4 0 01-4-4V16z" stroke="currentColor" strokeWidth="2" />
              <path d="M8 16l24 20 24-20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <h3>Ещё нет откликов</h3>
            <p>Найдите интересный проект и откликнитесь на открытую роль.</p>
            <Link to="/" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
              Смотреть проекты
            </Link>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }} className="animate-stagger">
          {apps.map(app => (
            <div
              key={app.id}
              className="bento-card"
              style={{
                borderLeft: `3px solid ${
                  app.status === 'accepted' ? 'var(--success)'
                  : app.status === 'rejected' ? 'var(--border)'
                  : 'var(--warning)'
                }`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div>
                  <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: '0.25rem' }}>
                    <Link to={`/project/${app.project_id}`} style={{ color: 'var(--text-primary)' }}>
                      {app.project_title}
                    </Link>
                  </h3>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                    Роль: <strong>{app.role_title}</strong>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <StatusIcon status={app.status} />
                  <span style={{
                    fontSize: 'var(--text-xs)',
                    fontWeight: 600,
                    color: app.status === 'accepted' ? 'var(--success)'
                      : app.status === 'rejected' ? 'var(--text-muted)'
                      : '#92400e',
                  }}>
                    <StatusLabel status={app.status} />
                  </span>
                </div>
              </div>

              <div style={{
                padding: '0.75rem',
                background: 'var(--bg)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--text-sm)',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                marginBottom: '0.75rem',
              }}>
                {app.message}
              </div>

              <Link
                to={`/project/${app.project_id}`}
                className="btn btn-ghost btn-sm"
                style={{ alignSelf: 'flex-start', gap: '0.25rem' }}
              >
                Перейти к проекту <FiArrowRight size={13} />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyApplicationsPage;
