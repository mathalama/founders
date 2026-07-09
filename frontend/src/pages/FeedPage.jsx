import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FiCpu, FiMapPin, FiTrendingUp, FiUser, FiSearch,
  FiUsers, FiCheckSquare
} from 'react-icons/fi';
import { API_BASE_URL } from '../api/client';

// Skeleton card component
function SkeletonCard({ featured = false }) {
  return (
    <div className={`skeleton-card ${featured ? 'bento-card--featured' : ''}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <div className="skeleton skeleton-avatar" />
        <div className="skeleton skeleton-badge" />
      </div>
      <div className="skeleton skeleton-title" />
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <div className="skeleton skeleton-badge" />
        <div className="skeleton skeleton-badge" />
      </div>
      <div className="skeleton skeleton-text" />
      <div className="skeleton skeleton-text" />
      <div className="skeleton skeleton-text-sm" />
      <div className="skeleton skeleton-button" style={{ marginTop: '1rem' }} />
    </div>
  );
}

// Empty state
function EmptyState({ hasFilters, onReset }) {
  return (
    <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
      <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
        <circle cx="40" cy="40" r="38" stroke="currentColor" strokeWidth="2" strokeDasharray="6 4" />
        <path d="M28 36h24M28 44h16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="40" cy="26" r="6" stroke="currentColor" strokeWidth="2" />
      </svg>
      <h3>{hasFilters ? 'Ничего не найдено' : 'Проекты появятся здесь'}</h3>
      <p>
        {hasFilters
          ? 'Попробуйте изменить фильтры или поисковый запрос.'
          : 'Стань первым — создай проект и найди свою команду.'}
      </p>
      {hasFilters ? (
        <button className="btn btn-outline" onClick={onReset} style={{ marginTop: '0.5rem' }}>
          Сбросить фильтры
        </button>
      ) : (
        <Link to="/new" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
          Создать проект
        </Link>
      )}
    </div>
  );
}

// Project card
function ProjectCard({ project, featured = false, index = 0 }) {
  const p = project;
  const initials = p.owner?.name
    ? p.owner.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const openRoles = p.roles?.filter(r => r.status !== 'closed') || [];
  const roadmapTotal = p.roadmap?.length || 0;
  const roadmapDone = p.roadmap?.filter(r => r.done).length || 0;
  const roadmapPct = roadmapTotal > 0 ? Math.round((roadmapDone / roadmapTotal) * 100) : 0;

  return (
    <Link
      to={`/project/${p.id}`}
      className={`bento-card bento-card--link animate-fadeInUp ${featured ? 'bento-card--featured' : ''}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        animationDelay: `${index * 60}ms`,
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div className="avatar">
            {p.owner?.avatarUrl
              ? <img src={p.owner.avatarUrl} alt={p.owner.name} />
              : initials}
          </div>
          <div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 500 }}>
              {p.owner?.name || 'Фаундер'}
            </div>
            <h2 style={{ fontSize: featured ? 'var(--text-xl)' : 'var(--text-lg)', fontWeight: 700, lineHeight: 1.2, marginTop: '1px' }}>
              {p.title}
            </h2>
          </div>
        </div>
        {featured && (
          <span className="badge badge--accent">⭐ Топ</span>
        )}
      </div>

      {/* Tags */}
      <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '0.875rem' }}>
        <span className="badge"><FiCpu size={11} style={{ marginRight: '2px' }} />{p.category}</span>
        <span className="badge"><FiMapPin size={11} style={{ marginRight: '2px' }} />{p.city}</span>
        <span className="badge"><FiTrendingUp size={11} style={{ marginRight: '2px' }} />{p.stage}</span>
      </div>

      {/* Description */}
      <p style={{
        flex: 1,
        color: 'var(--text-secondary)',
        fontSize: 'var(--text-sm)',
        lineHeight: 1.6,
        marginBottom: '1rem',
        display: '-webkit-box',
        WebkitLineClamp: featured ? 3 : 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>
        {p.description}
      </p>

      {/* Roadmap progress */}
      {roadmapTotal > 0 && (
        <div style={{ marginBottom: '0.875rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <FiCheckSquare size={11} /> Роадмап
            </span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 600 }}>
              {roadmapDone}/{roadmapTotal}
            </span>
          </div>
          <div className="progress-bar">
            <div className="progress-bar__fill" style={{ width: `${roadmapPct}%` }} />
          </div>
        </div>
      )}

      {/* Open roles */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <FiUsers size={13} style={{ color: 'var(--text-muted)' }} />
        {openRoles.length > 0 ? (
          <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
            {openRoles.slice(0, 3).map(role => (
              <span key={role.id} className="badge badge--accent" style={{ fontSize: '10px' }}>
                {role.title}
              </span>
            ))}
            {openRoles.length > 3 && (
              <span className="badge" style={{ fontSize: '10px' }}>+{openRoles.length - 3}</span>
            )}
          </div>
        ) : (
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Нет открытых ролей</span>
        )}
      </div>
    </Link>
  );
}

function FeedPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState({ category: '', stage: '', city: '', role: '' });
  const debounceRef = useRef(null);

  // Debounce search input
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(val);
    }, 300);
  };

  const hasFilters = Object.values(filters).some(v => v) || debouncedSearch;

  const resetFilters = () => {
    setFilters({ category: '', stage: '', city: '', role: '' });
    setSearchQuery('');
    setDebouncedSearch('');
  };

  useEffect(() => {
    fetchProjects();
  }, [filters, debouncedSearch]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)),
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
      }).toString();
      const res = await fetch(`${API_BASE_URL}/api/projects${params ? '?' + params : ''}`);
      if (res.ok) {
        const data = await res.json();
        setProjects(data || []);
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    }
    setLoading(false);
  };

  const updateFilter = (e) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div>
      {/* Search + Filters bar */}
      <div className="bento-card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        {/* Search */}
        <div className="input-search" style={{ marginBottom: '1rem' }}>
          <FiSearch size={16} />
          <input
            className="input"
            placeholder="Поиск проектов по названию или описанию..."
            value={searchQuery}
            onChange={handleSearchChange}
            id="feed-search"
          />
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <select name="category" className="select" style={{ flex: '1 1 140px' }} value={filters.category} onChange={updateFilter}>
            <option value="">Все категории</option>
            <option value="AI">AI</option>
            <option value="SaaS">SaaS</option>
            <option value="EdTech">EdTech</option>
            <option value="FinTech">FinTech</option>
            <option value="HealthTech">HealthTech</option>
            <option value="E-commerce">E-commerce</option>
          </select>
          <select name="stage" className="select" style={{ flex: '1 1 140px' }} value={filters.stage} onChange={updateFilter}>
            <option value="">Любая стадия</option>
            <option value="Идея">Идея</option>
            <option value="MVP">MVP</option>
            <option value="Есть пользователи">Есть пользователи</option>
            <option value="Есть выручка">Есть выручка</option>
          </select>
          <select name="city" className="select" style={{ flex: '1 1 140px' }} value={filters.city} onChange={updateFilter}>
            <option value="">Все города</option>
            <option value="Astana">Astana</option>
            <option value="Almaty">Almaty</option>
            <option value="Remote">Remote</option>
          </select>
          <div style={{ flex: '1 1 160px', position: 'relative' }}>
            <input
              list="role-filter-suggestions"
              name="role"
              className="select"
              value={filters.role}
              onChange={updateFilter}
              placeholder="Роль (любая)"
              autoComplete="off"
              style={{ width: '100%' }}
            />
            <datalist id="role-filter-suggestions">
              <option value="Frontend Developer" />
              <option value="Backend Developer" />
              <option value="Full Stack Developer" />
              <option value="Mobile Developer" />
              <option value="DevOps / SRE" />
              <option value="Data Scientist" />
              <option value="ML Engineer" />
              <option value="UI/UX Designer" />
              <option value="Product Manager" />
              <option value="Marketing" />
              <option value="QA Engineer" />
            </datalist>
          </div>
          {hasFilters && (
            <button className="btn btn-ghost btn-sm" onClick={resetFilters} style={{ whiteSpace: 'nowrap', alignSelf: 'center' }}>
              Сбросить
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="bento-grid">
        {loading ? (
          <>
            <SkeletonCard featured />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : projects.length === 0 ? (
          <EmptyState hasFilters={hasFilters} onReset={resetFilters} />
        ) : (
          projects.map((p, i) => (
            <ProjectCard
              key={p.id}
              project={p}
              featured={i === 0}
              index={i}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default FeedPage;
