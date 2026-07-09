import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchWithAuth } from '../api/client';
import { useToast } from '../context/ToastContext';
import { FiUsers, FiMessageSquare, FiEdit, FiPlus, FiFolder, FiClock } from 'react-icons/fi';

// Status badge with color coding
function AppStatusBadge({ status }) {
  if (status === 'accepted') return <span className="badge badge--success">Принят ✓</span>;
  if (status === 'rejected') return <span className="badge">Отклонён</span>;
  return <span className="badge badge--warning">На рассмотрении</span>;
}

function RoleStatusBadge({ status }) {
  if (status === 'closed') return <span className="badge">Закрыта</span>;
  return <span className="badge badge--success">Открыта</span>;
}

// Stats widget
function StatCard({ label, value, sub, icon, accent = false }) {
  return (
    <div className="stat-card" style={{ borderLeft: accent ? '3px solid var(--accent)' : undefined }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="stat-card__label">{label}</div>
          <div className="stat-card__value" style={{ color: accent ? 'var(--accent)' : undefined }}>
            {value}
          </div>
          {sub && <div className="stat-card__sub">{sub}</div>}
        </div>
        {icon && (
          <div style={{ color: accent ? 'var(--accent)' : 'var(--text-muted)', opacity: 0.7 }}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

function DashboardPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetchWithAuth('/api/dashboard/projects');
        if (res.ok) {
          const data = await res.json();
          setProjects(data || []);
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetchDashboard();
  }, []);

  const updateRoleStatus = async (roleId, newStatus) => {
    try {
      const res = await fetchWithAuth(`/api/dashboard/roles/${roleId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setProjects(projects.map(p => ({
          ...p,
          roles: p.roles?.map(r => r.id === roleId ? { ...r, status: newStatus } : r),
        })));
        showToast(newStatus === 'closed' ? 'Роль закрыта' : 'Роль открыта снова', 'success');
      }
    } catch (err) {
      showToast('Ошибка при обновлении роли', 'error');
    }
  };

  const updateAppStatus = async (appId, newStatus) => {
    try {
      const res = await fetchWithAuth(`/api/dashboard/applications/${appId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setProjects(projects.map(p => ({
          ...p,
          applications: p.applications?.map(a => a.id === appId ? { ...a, status: newStatus } : a),
        })));
        showToast(
          newStatus === 'accepted' ? 'Отклик одобрен! 🎉' : 'Отклик отклонён',
          newStatus === 'accepted' ? 'success' : 'info'
        );
      }
    } catch (err) {
      showToast('Ошибка при обновлении статуса', 'error');
    }
  };

  // Computed stats
  const totalProjects = projects.length;
  const allApplications = projects.flatMap(p => p.applications || []);
  const totalApplications = allApplications.length;
  const pendingApplications = allApplications.filter(a => a.status === 'pending').length;

  if (loading) {
    return (
      <div style={{ maxWidth: '860px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton-card" style={{ height: '80px' }}>
              <div className="skeleton skeleton-text-sm" style={{ width: '60%' }} />
              <div className="skeleton skeleton-title" style={{ width: '30%' }} />
            </div>
          ))}
        </div>
        <div className="skeleton-card">
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-text" />
          <div className="skeleton skeleton-text-sm" />
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1>Мои проекты</h1>
        <Link to="/new" className="btn btn-primary btn-sm">
          <FiPlus size={14} /> Новый проект
        </Link>
      </div>

      {/* Stats widgets */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.875rem', marginBottom: '2rem' }}>
        <StatCard
          label="Проектов"
          value={totalProjects}
          icon={<FiFolder size={22} />}
        />
        <StatCard
          label="Всего откликов"
          value={totalApplications}
          icon={<FiMessageSquare size={22} />}
        />
        <StatCard
          label="На рассмотрении"
          value={pendingApplications}
          sub={pendingApplications > 0 ? 'Требуют внимания' : 'Всё обработано'}
          icon={<FiClock size={22} />}
          accent={pendingApplications > 0}
        />
      </div>

      {/* Projects list */}
      {projects.length === 0 ? (
        <div className="bento-card">
          <div className="empty-state">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
              <rect x="8" y="16" width="48" height="36" rx="4" stroke="currentColor" strokeWidth="2" />
              <path d="M20 8h24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M24 32h16M24 40h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <h3>Нет проектов</h3>
            <p>Создайте свой первый проект, чтобы найти команду.</p>
            <Link to="/new" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
              <FiPlus size={14} /> Создать проект
            </Link>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="animate-stagger">
          {projects.map(p => {
            const pendingApps = (p.applications || []).filter(a => a.status === 'pending').length;
            return (
              <div key={p.id} className="bento-card">
                {/* Project header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                  <div>
                    <h2 style={{ marginBottom: '0.375rem' }}>
                      <Link to={`/project/${p.id}`} style={{ color: 'inherit' }}>{p.title}</Link>
                    </h2>
                    <span className="badge">{p.stage}</span>
                  </div>
                  <Link to={`/project/${p.id}/edit`} className="btn btn-outline btn-sm">
                    <FiEdit size={13} /> Редактировать
                  </Link>
                </div>

                {/* Roles */}
                <h3 style={{ fontSize: 'var(--text-base)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                  <FiUsers size={16} /> Открытые роли
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                  {p.roles && p.roles.length > 0 ? p.roles.map(role => (
                    <div
                      key={role.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.625rem 0.875rem',
                        background: 'var(--bg)',
                        borderRadius: 'var(--radius-md)',
                        opacity: role.status === 'closed' ? 0.6 : 1,
                      }}
                    >
                      <span style={{ fontWeight: 500, fontSize: 'var(--text-sm)' }}>{role.title}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <RoleStatusBadge status={role.status} />
                        {role.status === 'open' ? (
                          <button
                            onClick={() => updateRoleStatus(role.id, 'closed')}
                            className="btn btn-outline btn-sm"
                          >
                            Закрыть
                          </button>
                        ) : (
                          <button
                            onClick={() => updateRoleStatus(role.id, 'open')}
                            className="btn btn-success btn-sm"
                          >
                            Открыть
                          </button>
                        )}
                      </div>
                    </div>
                  )) : (
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Нет ролей</p>
                  )}
                </div>

                {/* Applications */}
                <h3 style={{ fontSize: 'var(--text-base)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                  <FiMessageSquare size={16} /> Отклики
                  {pendingApps > 0 && (
                    <span className="badge--count badge">{pendingApps} новых</span>
                  )}
                </h3>
                {p.applications && p.applications.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                    {p.applications.map(app => (
                      <div
                        key={app.id}
                        style={{
                          padding: '1rem',
                          border: `1px solid ${app.status === 'pending' ? 'var(--warning)' : 'var(--border)'}`,
                          borderRadius: 'var(--radius-md)',
                          background: app.status === 'pending' ? 'var(--warning-bg)' : 'var(--surface)',
                          transition: 'all var(--transition)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <div>
                            <strong style={{ fontSize: 'var(--text-sm)' }}>{app.applicant?.name}</strong>
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                              на роль: {app.role_title}
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <AppStatusBadge status={app.status} />
                            {app.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => updateAppStatus(app.id, 'accepted')}
                                  className="btn btn-success btn-sm"
                                >
                                  Принять
                                </button>
                                <button
                                  onClick={() => updateAppStatus(app.id, 'rejected')}
                                  className="btn btn-danger btn-sm"
                                >
                                  Отклонить
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: '0.75rem', lineHeight: 1.6 }}>
                          {app.message}
                        </p>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {app.applicant?.telegram && (
                            <a href={`https://t.me/${app.applicant.telegram.replace('@', '')}`}
                              target="_blank" rel="noreferrer"
                              className="btn btn-outline btn-sm"
                            >
                              Telegram
                            </a>
                          )}
                          {app.applicant?.email && (
                            <a href={`mailto:${app.applicant.email}`} className="btn btn-outline btn-sm">
                              Email
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Нет откликов.</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default DashboardPage;
