import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { FiMessageSquare, FiSearch, FiBriefcase, FiCpu, FiGithub } from 'react-icons/fi';
import { API_BASE_URL } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Avatar from './ui/Avatar';
import Badge from './ui/Badge';

export default function TalentTab() {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('');

  // Fetch specialists directory
  const { data: talents = [], isLoading } = useQuery({
    queryKey: ['talents'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/users/directory`);
      if (!res.ok) throw new Error('Failed to load specialists directory');
      return res.json();
    },
  });

  const handleStartChat = (targetUserId) => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    navigate(`/messages/${targetUserId}`);
  };

  // Client-side filtering for blazing fast UX
  const filteredTalents = talents.filter((t) => {
    // Avoid showing currentUser
    if (currentUser && t.id === currentUser.id) return false;

    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.bio && t.bio.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.skills && t.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase())));

    const matchesRole = selectedRole === '' || (t.roleTitle && t.roleTitle === selectedRole);

    return matchesSearch && matchesRole;
  });

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="skeleton-card" style={{ height: '80px' }} />
        <div className="bento-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton-card" style={{ height: '180px' }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Search and Filters */}
      <div className="bento-card" style={{ padding: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="input-search" style={{ flex: 1, minWidth: '200px' }}>
          <FiSearch size={16} />
          <input
            className="input"
            placeholder="Поиск по имени, стеку или описанию..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className="select"
          style={{ width: '180px' }}
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
        >
          <option value="">Все роли</option>
          <option value="Frontend Developer">Frontend Dev</option>
          <option value="Backend Developer">Backend Dev</option>
          <option value="Full Stack Developer">Full Stack Dev</option>
          <option value="Mobile Developer">Mobile Dev</option>
          <option value="UI/UX Designer">UI/UX Designer</option>
          <option value="Product Manager">Product Manager</option>
          <option value="ML Engineer">ML Engineer</option>
          <option value="Marketing">Marketing Lead</option>
        </select>
      </div>

      {/* Grid of Specialists */}
      {filteredTalents.length === 0 ? (
        <div className="bento-card" style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
          {talents.length === 0
            ? 'Пока никто не объявил себя открытым для предложений. Станьте первым в настройках профиля!'
            : 'Специалисты с такими критериями поиска не найдены.'}
        </div>
      ) : (
        <div className="bento-grid">
          {filteredTalents.map((talent) => (
            <div
              key={talent.id}
              className="bento-card animate-fadeInUp"
              style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
            >
              {/* Header */}
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                <Avatar name={talent.name} url={talent.avatarUrl} />
                <div>
                  <h4 style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {talent.name}
                  </h4>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--accent)', fontWeight: 500 }}>
                    {talent.roleTitle || 'Специалист'}
                  </div>
                </div>
              </div>

              {/* Badges details */}
              <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                {talent.experience && (
                  <Badge>
                    <FiBriefcase size={11} style={{ marginRight: '2px' }} />
                    Опыт: {talent.experience}
                  </Badge>
                )}
                {talent.github && (
                  <a href={talent.github} target="_blank" rel="noreferrer">
                    <Badge style={{ cursor: 'pointer' }}>
                      <FiGithub size={11} style={{ marginRight: '2px' }} />
                      GitHub
                    </Badge>
                  </a>
                )}
              </div>

              {/* Bio */}
              {talent.bio && (
                <p
                  style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                    marginBottom: '1rem',
                    flex: 1,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {talent.bio}
                </p>
              )}

              {/* Skills tags */}
              {talent.skills && talent.skills.length > 0 && (
                <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                  {talent.skills.slice(0, 5).map((skill, index) => (
                    <Badge key={index} type="accent" style={{ fontSize: '10px', padding: '0.125rem 0.375rem' }}>
                      {skill}
                    </Badge>
                  ))}
                  {talent.skills.length > 5 && (
                    <Badge style={{ fontSize: '10px', padding: '0.125rem 0.375rem' }}>
                      +{talent.skills.length - 5}
                    </Badge>
                  )}
                </div>
              )}

              {/* Actions */}
              <button
                onClick={() => handleStartChat(talent.id)}
                className="btn btn-primary btn-sm"
                style={{ width: '100%', marginTop: 'auto', gap: '0.375rem' }}
              >
                <FiMessageSquare size={14} /> Написать
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
