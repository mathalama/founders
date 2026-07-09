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

// Role status badge
function RoleStatusBadge({ status, applications = 0 }) {
  if (status === 'closed') {
    return <span className="badge">Закрыта</span>;
  }
  if (applications > 0) {
    return <span className="badge badge--warning">Есть отклики: {applications}</span>;
  }
  return <span className="badge badge--success">Открыта</span>;
}

// Team member card
function TeamMemberCard({ member }) {
  const initials = member.name
    ? member.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '0.75rem',
      background: 'var(--bg)',
      borderRadius: 'var(--radius-md)',
    }}>
      <div className="avatar">{initials}</div>
      <div>
        <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{member.name}</div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{member.role}</div>
      </div>
    </div>
  );
}

function ProjectPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [applicationMsg, setApplicationMsg] = useState('');
  const [bookmarked, setBookmarked] = useState(false);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/projects/${id}`);
        if (res.ok) {
          const data = await res.json();
          setProject(data);
        }
      } catch (err) {
        console.error('Failed to load project', err);
      }
      setLoading(false);
    };
    fetchProject();
  }, [id]);

  const handleApply = async () => {
    if (!user) {
      showToast('Войдите в систему, чтобы откликнуться', 'info');
      return;
    }
    if (!applicationMsg.trim()) {
      showToast('Напишите сопроводительное сообщение', 'error');
      return;
    }
    setApplying(true);
    try {
      const res = await fetchWithAuth(`/api/projects/${id}/roles/${selectedRole.id}/apply`, {
        method: 'POST',
        body: JSON.stringify({ message: applicationMsg }),
      });
      if (res.ok) {
        showToast('Отклик отправлен! 🎉', 'success');
        setShowModal(false);
        setApplicationMsg('');
      } else {
        showToast('Ошибка при отправке отклика', 'error');
      }
    } catch (err) {
      showToast('Ошибка соединения', 'error');
    }
    setApplying(false);
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

  if (loading) {
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
      <div className="empty-state" style={{ marginTop: '4rem' }}>
        <h3>Проект не найден</h3>
        <p>Возможно, он был удалён или ссылка устарела.</p>
        <Link to="/" className="btn btn-primary" style={{ marginTop: '1rem' }}>На главную</Link>
      </div>
    );
  }

  const isOwner = user && user.id === project.ownerId;
  const roadmapTotal = project.roadmap?.length || 0;
  const roadmapDone = project.roadmap?.filter(r => r.done).length || 0;
  const roadmapPct = roadmapTotal > 0 ? Math.round((roadmapDone / roadmapTotal) * 100) : 0;

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      {/* Top nav */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <Link to="/" className="btn btn-ghost btn-sm">
          <FiArrowLeft size={15} /> Назад
        </Link>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {isOwner && (
            <Link to={`/project/${id}/edit`} className="btn btn-outline btn-sm">
              <FiEdit size={14} /> Редактировать
            </Link>
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
      <h1 style={{ marginBottom: '0.375rem' }}>{project.title}</h1>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        <span className="badge">{project.category}</span>
        <span className="badge">{project.city}</span>
        <span className="badge">{project.stage}</span>
      </div>

      <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
        {project.description}
      </p>

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
          <TeamMemberCard member={{ name: project.owner.name, role: 'Founder' }} />
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
                {role.status !== 'closed' && !isOwner && (
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
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3>Отклик на «{selectedRole?.title}»</h3>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setShowModal(false)}
                style={{ padding: '0.25rem' }}
              >
                <FiX size={18} />
              </button>
            </div>
            <textarea
              className="textarea"
              rows={4}
              placeholder="Расскажи немного о себе — почему ты подходишь для этой роли? 🚀"
              value={applicationMsg}
              onChange={e => setApplicationMsg(e.target.value)}
              style={{ marginBottom: '1rem' }}
            />
            <div style={{ display: 'flex', gap: '0.625rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Отмена</button>
              <button
                className="btn btn-primary"
                onClick={handleApply}
                disabled={applying || !applicationMsg.trim()}
              >
                {applying ? 'Отправляю...' : 'Отправить отклик'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectPage;
