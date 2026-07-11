import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { fetchWithAuth, API_BASE_URL } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  FiArrowLeft, FiBookmark, FiBookmark as FiBookmarkFilled,
  FiGlobe, FiGithub, FiSend, FiUsers, FiCheckSquare,
  FiEdit, FiX, FiCheck
} from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import EmptyState from '../components/EmptyState';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';

// Role status badge
function RoleStatusBadge({ status, applications = 0 }) {
  if (status === 'closed') {
    return <Badge>Закрыта</Badge>;
  }
  if (applications > 0) {
    return <Badge type="warning">Есть отклики: {applications}</Badge>;
  }
  return <Badge type="success">Открыта</Badge>;
}

function TeamMemberCard({ member }) {
  const content = (
    <>
      <Avatar name={member.name} />
      <div>
        <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>{member.name}</div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{member.role}</div>
      </div>
    </>
  );

  const style = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem',
    background: 'var(--bg)',
    borderRadius: 'var(--radius-md)',
    textDecoration: 'none',
  };

  if (member.userId) {
    return (
      <Link to={`/user/${member.userId}`} style={style} className="bento-card--link">
        {content}
      </Link>
    );
  }

  return <div style={style}>{content}</div>;
}

function ProjectPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [applicationMsg, setApplicationMsg] = useState('');
  
  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/projects/${id}`);
      if (!res.ok) throw new Error('Failed to fetch project');
      return res.json();
    }
  });

  const [bookmarked, setBookmarked] = useState(false);
  const { data: myApps = [] } = useQuery({
    queryKey: ['myApplications'],
    queryFn: async () => {
      const res = await fetchWithAuth('/api/applications/my');
      if (!res.ok) return [];
      const data = await res.json();
      return data || [];
    },
    enabled: !!user
  });

  const appliedRoleIds = new Set(myApps.map(app => app.role_id));

  useEffect(() => {
    // Only way to initialize bookmarked right now, though ideally it should come from backend
  }, [project]);

  const applyMutation = useMutation({
    mutationFn: async ({ roleId, message }) => {
      const res = await fetchWithAuth(`/api/projects/${id}/roles/${roleId}/apply`, {
        method: 'POST',
        body: JSON.stringify({ message }),
      });
      if (!res.ok) throw new Error('Failed to apply');
      return res.json();
    },
    onSuccess: () => {
      showToast('Отклик отправлен!', 'success');
      setShowModal(false);
      setApplicationMsg('');
      queryClient.invalidateQueries(['myApplications']);
    },
    onError: () => showToast('Ошибка при отправке отклика', 'error')
  });

  const toggleProjectStatusMutation = useMutation({
    mutationFn: async (newStatus) => {
      const res = await fetchWithAuth(`/api/projects/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update project status');
      return newStatus;
    },
    onSuccess: (newStatus) => {
      queryClient.setQueryData(['project', id], old => ({ ...old, status: newStatus }));
      showToast(newStatus === 'closed' ? 'Набор в проект закрыт' : 'Набор в проект открыт', 'success');
    },
    onError: () => showToast('Ошибка при обновлении статуса проекта', 'error')
  });

  const toggleRoleStatusMutation = useMutation({
    mutationFn: async ({ roleId, newStatus }) => {
      const res = await fetchWithAuth(`/api/projects/${id}/roles/${roleId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update role status');
      return { roleId, newStatus };
    },
    onSuccess: ({ roleId, newStatus }) => {
      queryClient.setQueryData(['project', id], old => {
        if (!old) return old;
        return {
          ...old,
          roles: old.roles.map(r => r.id === roleId ? { ...r, status: newStatus } : r)
        };
      });
      showToast('Статус роли обновлен', 'success');
    },
    onError: () => showToast('Ошибка при обновлении статуса роли', 'error')
  });

  const handleApply = () => {
    if (!user) {
      showToast('Войдите в систему, чтобы откликнуться', 'info');
      return;
    }
    if (!applicationMsg.trim()) {
      showToast('Напишите сопроводительное сообщение', 'error');
      return;
    }
    applyMutation.mutate({ roleId: selectedRole.id, message: applicationMsg });
  };

  const toggleBookmark = async () => {
    if (!user) {
      showToast('Войдите, чтобы сохранить проект', 'info');
      return;
    }
    try {
      const res = await fetchWithAuth(`/api/projects/${id}/bookmark`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setBookmarked(data.bookmarked);
        showToast(
          data.bookmarked ? 'Проект сохранён в закладки' : 'Проект удалён из закладок',
          'success'
        );
      }
    } catch (err) {
      showToast('Ошибка при обновлении закладки', 'error');
    }
  };

  if (isLoading) {
    return (
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="skeleton" style={{ height: '20px', width: '80px' }} />
        </div>
        <div className="skeleton skeleton-title" style={{ width: '50%', height: '2.5rem' }} />
        <div className="skeleton skeleton-text" style={{ width: '30%', marginBottom: '2rem' }} />
        <div className="skeleton-card">
          <div className="skeleton skeleton-text" />
          <div className="skeleton skeleton-text" />
          <div className="skeleton skeleton-text-sm" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div style={{ marginTop: '4rem' }}>
        <EmptyState 
          title="Проект не найден"
          description="Возможно, он был удалён или ссылка устарела."
          actionText="На главную"
          actionTo="/"
        />
      </div>
    );
  }

  const isOwner = user && user.id === project.ownerId;
  const roadmapTotal = project.roadmap?.length || 0;
  const roadmapDone = project.roadmap?.filter(r => r.done).length || 0;
  const roadmapPct = roadmapTotal > 0 ? Math.round((roadmapDone / roadmapTotal) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      style={{ maxWidth: '720px', margin: '0 auto' }}
    >
      {/* Top nav */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <Link to="/" className="btn btn-ghost btn-sm">
          <FiArrowLeft size={15} /> Назад
        </Link>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {isOwner && (
            <>
              <button
                className={`btn btn-sm ${project.status === 'closed' ? 'btn-outline' : 'btn-danger'}`}
                onClick={() => {
                  if (window.confirm(project.status === 'closed' ? 'Открыть набор в проект?' : 'Вы уверены, что хотите закрыть набор в этот проект? Никто не сможет откликаться.')) {
                    toggleProjectStatusMutation.mutate(project.status === 'closed' ? 'open' : 'closed');
                  }
                }}
              >
                {project.status === 'closed' ? 'Открыть проект' : 'Закрыть проект'}
              </button>
              <Link to={`/project/${id}/edit`} className="btn btn-outline btn-sm">
                <FiEdit size={14} /> Редактировать
              </Link>
            </>
          )}
          <button
            onClick={toggleBookmark}
            className={`btn btn-sm ${bookmarked ? 'btn-accent' : 'btn-outline'}`}
          >
            <FiBookmark size={14} />
            {bookmarked ? 'В закладках' : 'Сохранить'}
          </button>
        </div>
      </div>

      {/* Title */}
      <h1 style={{ marginBottom: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {project.title}
        {project.status === 'closed' && (
          <Badge style={{ fontSize: '12px', background: 'var(--danger)', color: 'white' }}>
            Набор закрыт
          </Badge>
        )}
      </h1>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        <Badge>{project.category}</Badge>
        <Badge>{project.city}</Badge>
        <Badge>{project.stage}</Badge>
      </div>

      <div 
        style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}
        className="tiptap-editor"
        dangerouslySetInnerHTML={{ __html: project.description }}
      />

      {/* Links */}
      {(project.website || project.github) && (
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
          {project.website && (
            <a href={project.website} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
              <FiGlobe size={14} /> Website
            </a>
          )}
          {project.github && (
            <a href={project.github} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
              <FiGithub size={14} /> GitHub
            </a>
          )}
        </div>
      )}

      <hr className="divider" />

      {/* Team */}
      <h3 style={{ marginBottom: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <FiUsers size={18} /> Команда
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem', marginBottom: '2rem' }}>
        {project.owner && (
          <TeamMemberCard member={{ name: project.owner.name, role: 'Founder', userId: project.ownerId }} />
        )}
        {project.team?.map(member => (
          <TeamMemberCard key={member.id} member={member} />
        ))}
      </div>

      <hr className="divider" />

      {/* Open Roles */}
      <h3 style={{ marginBottom: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <FiSend size={18} /> Открытые роли
      </h3>
      {project.roles && project.roles.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '2rem' }}>
          {project.roles.map(role => (
            <div
              key={role.id}
              className="bento-card"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem 1.25rem',
                opacity: role.status === 'closed' ? 0.55 : 1,
              }}
            >
              <div>
                <h4 style={{ marginBottom: '0.25rem' }}>{role.title}</h4>
                <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)' }}>{role.skills}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <RoleStatusBadge status={role.status} />
                
                {isOwner && (
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => toggleRoleStatusMutation.mutate({ 
                      roleId: role.id, 
                      newStatus: role.status === 'closed' ? 'open' : 'closed' 
                    })}
                    title={role.status === 'closed' ? 'Открыть вакансию' : 'Закрыть вакансию (нашли человека)'}
                  >
                    {role.status === 'closed' ? 'Открыть' : 'Закрыть'}
                  </button>
                )}

                {project.status !== 'closed' && role.status !== 'closed' && !isOwner && !appliedRoleIds.has(role.id) && (
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ animation: 'pulse-ring 2s ease infinite' }}
                    onClick={() => {
                      if (!user) {
                        showToast('Войдите в систему', 'info');
                        return;
                      }
                      setSelectedRole(role);
                      setShowModal(true);
                    }}
                  >
                    Откликнуться
                  </button>
                )}
                {appliedRoleIds.has(role.id) && (
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <FiCheck size={14} /> Отклик отправлен
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: 'var(--text-sm)' }}>
          Нет открытых ролей
        </p>
      )}

      {/* Roadmap */}
      {project.roadmap && project.roadmap.length > 0 && (
        <>
          <hr className="divider" />
          <h3 style={{ marginBottom: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FiCheckSquare size={18} /> Roadmap
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', fontWeight: 400 }}>
              — {roadmapDone}/{roadmapTotal} выполнено
            </span>
          </h3>
          {/* Progress bar */}
          <div className="progress-bar" style={{ marginBottom: '1.25rem', height: '8px' }}>
            <div className="progress-bar__fill" style={{ width: `${roadmapPct}%` }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {project.roadmap.map(item => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.625rem 0.875rem',
                  background: item.done ? 'var(--success-bg)' : 'var(--bg)',
                  border: `1px solid ${item.done ? 'var(--success)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-md)',
                  transition: 'all var(--transition)',
                }}
              >
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: item.done ? 'var(--success)' : 'var(--border)',
                  flexShrink: 0,
                }}>
                  {item.done && <FiCheck size={11} color="white" />}
                </div>
                <span style={{
                  fontSize: 'var(--text-sm)',
                  fontWeight: 500,
                  color: item.done ? 'var(--success)' : 'var(--text-primary)',
                  textDecoration: item.done ? 'line-through' : 'none',
                  opacity: item.done ? 0.7 : 1,
                }}>
                  {item.title}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Apply Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          Отклик на «{selectedRole?.title}»
        </h3>
        <textarea
          className="textarea"
          rows={4}
          placeholder="Расскажи немного о себе — почему ты подходишь для этой роли?"
          value={applicationMsg}
          onChange={e => setApplicationMsg(e.target.value)}
          style={{ marginBottom: '1.5rem' }}
        />
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-outline" onClick={() => setShowModal(false)} style={{ flex: 1 }}>
            Отмена
          </button>
          <button
            className="btn btn-primary"
            onClick={handleApply}
            disabled={applyMutation.isPending || !applicationMsg.trim()}
            style={{ flex: 2 }}
          >
            {applyMutation.isPending ? 'Отправляю...' : 'Отправить отклик'}
          </button>
        </div>
      </Modal>
    </motion.div>
  );
}

export default ProjectPage;
