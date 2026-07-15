import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiGithub, FiMapPin, FiStar, FiCpu, FiMessageCircle, FiUser } from 'react-icons/fi';
import { FaTelegramPlane } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { API_BASE_URL, fetchWithAuth } from '../api/client';
import EmptyState from '../components/EmptyState';

function UserPage() {
  const { id } = useParams();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/users/${id}`);
        if (res.ok) {
          const data = await res.json();
          setUserProfile(data);
        }
      } catch (err) {
        console.error('Failed to fetch user:', err);
      }
      setLoading(false);
    };

    fetchUser();
  }, [id]);

  if (loading) {
    return (
      <div className="bento-card animate-pulse" style={{ padding: '2rem' }}>
        <div className="skeleton skeleton-title" style={{ width: '40%', marginBottom: '1rem' }} />
        <div className="skeleton skeleton-text" />
        <div className="skeleton skeleton-text" />
      </div>
    );
  }

  if (!userProfile) {
    return <EmptyState title="Пользователь не найден" description="Возможно профиль был удален." />;
  }

  const { name, email, avatar_url, role_title, skills, experience, github, telegram, bio } = userProfile;
  const projects = userProfile.projects || [];
  
  const initials = name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      style={{ maxWidth: '800px', margin: '0 auto' }}
    >
      {/* Profile Header Card */}
      <div className="bento-card" style={{ padding: '2rem', marginBottom: '2rem', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div className="avatar" style={{ width: '120px', height: '120px', fontSize: '3rem' }}>
            {avatar_url ? <img src={avatar_url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
          </div>
          <Link to={`/messages/${id}`} className="btn btn-primary" style={{ width: '100%' }}>
            <FiMessageCircle /> Написать
          </Link>
        </div>

        <div style={{ flex: 1, minWidth: '250px' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.25rem' }}>{name}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '1rem' }}>
            {role_title || 'Участник Nucla'}
          </p>
          
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            {github && (
              <a href={github} target="_blank" rel="noreferrer" className="badge badge--accent" style={{ textDecoration: 'none' }}>
                <FiGithub size={14} style={{ marginRight: '4px' }} /> GitHub
              </a>
            )}
            {telegram && (
              <a href={telegram.startsWith('http') ? telegram : `https://t.me/${telegram.replace('@', '')}`} target="_blank" rel="noreferrer" className="badge badge--accent" style={{ textDecoration: 'none' }}>
                <FaTelegramPlane size={14} style={{ marginRight: '4px' }} /> Telegram
              </a>
            )}

          </div>

          {bio && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>О себе</h3>
              <p style={{ color: 'var(--text-primary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{bio}</p>
            </div>
          )}

          {skills && (Array.isArray(skills) ? skills.length > 0 : typeof skills === 'string' && skills.trim().length > 0) && (
            <div>
              <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Навыки</h3>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {(Array.isArray(skills) ? skills : skills.split(',')).map((skill, index) => {
                  const cleaned = typeof skill === 'string' ? skill.trim() : '';
                  return cleaned ? (
                    <span key={index} className="badge" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                      {cleaned}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User's Projects */}
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Проекты</h2>
      {projects.length === 0 ? (
        <EmptyState title="Нет проектов" description="Пользователь пока не создал ни одного проекта." />
      ) : (
        <div className="bento-grid">
          {projects.map(p => (
            <Link key={p.id} to={`/project/${p.id}`} className="bento-card bento-card--link">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>{p.title}</h3>
              <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '0.875rem' }}>
                <span className="badge"><FiCpu size={11} style={{ marginRight: '2px' }} />{p.category}</span>
                <span className="badge"><FiMapPin size={11} style={{ marginRight: '2px' }} />{p.city}</span>
              </div>
              <p style={{
                color: 'var(--text-secondary)',
                fontSize: 'var(--text-sm)',
                lineHeight: 1.6,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}>
                {p.description?.replace(/<[^>]+>/g, '')}
              </p>
            </Link>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export default UserPage;
