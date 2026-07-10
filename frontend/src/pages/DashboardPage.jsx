import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchWithAuth } from '../api/client';
import { useToast } from '../context/ToastContext';
import { FiUsers, FiMessageSquare, FiEdit, FiPlus, FiFolder, FiClock } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import EmptyState from '../components/EmptyState';
import Badge from '../components/ui/Badge';

// Status badge with color coding
function AppStatusBadge({ status }) {
  if (status === 'accepted') return <Badge type="success">Принят ✓</Badge>;
  if (status === 'rejected') return <Badge>Отклонён</Badge>;
  return <Badge type="warning">На рассмотрении</Badge>;
}

function RoleStatusBadge({ status }) {
  if (status === 'closed') return <Badge>Закрыта</Badge>;
  return <Badge type="success">Открыта</Badge>;
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
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['dashboardProjects'],
    queryFn: async () => {
      const res = await fetchWithAuth('/api/dashboard/projects');
      if (!res.ok) throw new Error('Failed to fetch dashboard');
      return res.json();
    }
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ roleId, status }) => {
      const res = await fetchWithAuth(`/api/dashboard/roles/${roleId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update role');
      return { roleId, status };
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['dashboardProjects'], (old) => {
        if (!old) return old;
        return old.map(p => ({
          ...p,
          roles: p.roles?.map(r => r.id === data.roleId ? { ...r, status: data.status } : r)
        }));
      });
      showToast(data.status === 'closed' ? 'Роль закрыта' : 'Роль открыта снова', 'success');
    },
    onError: () => showToast('Ошибка при обновлении роли', 'error')
  });

  const updateAppMutation = useMutation({
    mutationFn: async ({ appId, status }) => {
      const res = await fetchWithAuth(`/api/dashboard/applications/${appId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      return { appId, status };
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['dashboardProjects'], (old) => {
        if (!old) return old;
        return old.map(p => ({
          ...p,
          applications: p.applications?.map(a => a.id === data.appId ? { ...a, status: data.status } : a)
        }));
      });
      showToast(
        data.status === 'accepted' ? 'Отклик одобрен!' : 'Отклик отклонён',
        data.status === 'accepted' ? 'success' : 'info'
      );
    },
    onError: () => showToast('Ошибка при обновлении статуса', 'error')
  });

  const updateRoleStatus = (roleId, newStatus) => updateRoleMutation.mutate({ roleId, status: newStatus });
  const updateAppStatus = (appId, newStatus) => updateAppMutation.mutate({ appId, status: newStatus });

  // Computed stats
  const totalProjects = projects.length;
  const allApplications = projects.flatMap(p => p.applications || []);
  const totalApplications = allApplications.length;
  const pendingApplications = allApplications.filter(a => a.status === 'pending').length;

  if (isLoading) {
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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      style={{ maxWidth: '860px', margin: '0 auto' }}
    >
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
          <EmptyState 
            title="Нет проектов"
            description="Создайте свой первый проект, чтобы найти команду."
            actionText="Создать проект"
            actionTo="/new"
          />
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
                    <Badge>{p.stage}</Badge>
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
                            <strong style={{ fontSize: 'var(--text-sm)' }}>
                              <Link to={`/user/${app.user_id}`} style={{ color: 'inherit', textDecoration: 'underline' }}>
                                {app.applicant?.name}
                              </Link>
                            </strong>
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
                            {app.status === 'accepted' && (
                              <button onClick={() => updateAppStatus(app.id, 'rejected')} className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }}>Отменить (Отклонить)</button>
                            )}
                            {app.status === 'rejected' && (
                              <button onClick={() => updateAppStatus(app.id, 'accepted')} className="btn btn-ghost btn-sm" style={{ color: 'var(--success)' }}>Отменить (Принять)</button>
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
    </motion.div>
  );
}

export default DashboardPage;
