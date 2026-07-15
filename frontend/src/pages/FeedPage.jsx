import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FiCpu, FiMapPin, FiTrendingUp, FiUser, FiSearch,
  FiUsers, FiCheckSquare, FiStar, FiFilter, FiClock
} from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { API_BASE_URL, fetchWithAuth } from '../api/client';
import EmptyState from '../components/EmptyState';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';
import PullToRefresh from '../components/ui/PullToRefresh';
import Modal from '../components/ui/Modal';
import AutocompleteInput from '../components/ui/AutocompleteInput';
import { ROLE_SUGGESTIONS } from '../constants/suggestions';

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

// Empty state is now imported

// Project card
function ProjectCard({ project, featured = false, index = 0, hasApplied = false }) {
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
          <Avatar name={p.owner?.name} url={p.owner?.avatarUrl} />
          <div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 500 }}>
              {p.owner?.name || 'Фаундер'}
            </div>
            <h2 style={{ fontSize: featured ? 'var(--text-xl)' : 'var(--text-lg)', fontWeight: 700, lineHeight: 1.2, marginTop: '1px' }}>
              {p.title}
            </h2>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.3rem', flexDirection: 'column', alignItems: 'flex-end' }}>
          {p.status === 'closed' && (
            <Badge style={{ fontSize: '10px', background: 'var(--border)' }}>
              Набор закрыт
            </Badge>
          )}
          {featured && (
            <Badge type="accent"><FiStar size={12} style={{marginRight: '4px'}} /> Топ</Badge>
          )}
          {hasApplied && (
            <Badge type="success" style={{ fontSize: '10px' }}>
              <FiCheckSquare size={10} style={{marginRight: '4px'}} /> Отклик сделан
            </Badge>
          )}
        </div>
      </div>

      {/* Tags */}
      <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '0.875rem' }}>
        <Badge><FiCpu size={11} style={{ marginRight: '2px' }} />{p.category}</Badge>
        <Badge><FiMapPin size={11} style={{ marginRight: '2px' }} />{p.city}</Badge>
        <Badge><FiTrendingUp size={11} style={{ marginRight: '2px' }} />{p.stage}</Badge>
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
        {p.description?.replace(/<[^>]+>/g, '')}
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
              <Badge key={role.id} type="accent" style={{ fontSize: '10px' }}>
                {role.title}
              </Badge>
            ))}
            {openRoles.length > 3 && (
              <Badge style={{ fontSize: '10px' }}>+{openRoles.length - 3}</Badge>
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
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState({ category: '', stage: '', city: '', role: '' });
  const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false);
  const debounceRef = useRef(null);
  const observer = useRef();

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

  const appliedProjectIds = new Set(myApps.map(app => app.project_id));

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isPending,
    isFetchingNextPage,
    refetch
  } = useInfiniteQuery({
    queryKey: ['projects', filters, debouncedSearch],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams({
        ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)),
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        page: pageParam,
        limit: 10,
      }).toString();
      const res = await fetch(`${API_BASE_URL}/api/projects${params ? '?' + params : ''}`);
      if (!res.ok) throw new Error('Network error');
      return res.json();
    },
    getNextPageParam: (lastPage, allPages) => {
      return (lastPage?.length === 10) ? allPages.length + 1 : undefined;
    },
  });

  const projects = data?.pages.flat() || [];

  const lastProjectElementRef = useCallback(node => {
    if (isPending || isFetchingNextPage) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasNextPage) {
        fetchNextPage();
      }
    });
    if (node) observer.current.observe(node);
  }, [isPending, isFetchingNextPage, hasNextPage, fetchNextPage]);

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

  const updateFilter = (e) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}
    >
      {/* Search + Filters bar */}
          <div className="bento-card mobile-filters-card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
            {/* Search */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <div className="input-search" style={{ flex: 1, marginBottom: 0 }}>
                <FiSearch size={16} />
                <input
                  className="input"
                  placeholder="Поиск проектов по названию или описанию..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  id="feed-search"
                />
              </div>
              <button 
                className="btn btn-outline filter-mobile" 
                style={{ padding: '0 1rem' }} 
                onClick={() => setIsFiltersModalOpen(true)}
              >
                <FiFilter size={18} />
                {hasFilters && (
                  <div style={{ position: 'absolute', top: '-4px', right: '-4px', width: '12px', height: '12px', background: 'var(--primary)', borderRadius: '50%' }} />
                )}
              </button>
            </div>

            {/* Desktop Filters */}
            <div className="filter-desktop" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <select name="category" aria-label="Категория" className="select" style={{ flex: '1 1 140px' }} value={filters.category} onChange={updateFilter}>
                <option value="">Все категории</option>
                <option value="AI">AI</option>
                <option value="SaaS">SaaS</option>
                <option value="EdTech">EdTech</option>
                <option value="FinTech">FinTech</option>
                <option value="HealthTech">HealthTech</option>
                <option value="E-commerce">E-commerce</option>
              </select>
              <select name="stage" aria-label="Стадия проекта" className="select" style={{ flex: '1 1 140px' }} value={filters.stage} onChange={updateFilter}>
                <option value="">Любая стадия</option>
                <option value="Идея">Идея</option>
                <option value="MVP">MVP</option>
                <option value="Есть пользователи">Есть пользователи</option>
                <option value="Есть выручка">Есть выручка</option>
              </select>
              <select name="city" aria-label="Город" className="select" style={{ flex: '1 1 140px' }} value={filters.city} onChange={updateFilter}>
                <option value="">Все города</option>
                <option value="Astana">Astana</option>
                <option value="Almaty">Almaty</option>
                <option value="Remote">Remote</option>
              </select>
              <div style={{ flex: '1 1 160px' }}>
                <AutocompleteInput
                  name="role"
                  className="select"
                  value={filters.role}
                  onChange={updateFilter}
                  placeholder="Роль (любая)"
                  suggestions={ROLE_SUGGESTIONS}
                />
              </div>
            </div>
          </div>

          {/* Mobile Filters Modal */}
          <Modal isOpen={isFiltersModalOpen} onClose={() => setIsFiltersModalOpen(false)}>
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FiFilter /> Фильтры
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label htmlFor="filter-mobile-category" style={{ display: 'block', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Категория</label>
                <select id="filter-mobile-category" name="category" className="select" style={{ width: '100%' }} value={filters.category} onChange={updateFilter}>
                  <option value="">Все категории</option>
                  <option value="AI">AI</option>
                  <option value="SaaS">SaaS</option>
                  <option value="EdTech">EdTech</option>
                  <option value="FinTech">FinTech</option>
                  <option value="HealthTech">HealthTech</option>
                  <option value="E-commerce">E-commerce</option>
                </select>
              </div>
              <div>
                <label htmlFor="filter-mobile-stage" style={{ display: 'block', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Стадия проекта</label>
                <select id="filter-mobile-stage" name="stage" className="select" style={{ width: '100%' }} value={filters.stage} onChange={updateFilter}>
                  <option value="">Любая стадия</option>
                  <option value="Идея">Идея</option>
                  <option value="MVP">MVP</option>
                  <option value="Есть пользователи">Есть пользователи</option>
                  <option value="Есть выручка">Есть выручка</option>
                </select>
              </div>
              <div>
                <label htmlFor="filter-mobile-city" style={{ display: 'block', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Город</label>
                <select id="filter-mobile-city" name="city" className="select" style={{ width: '100%' }} value={filters.city} onChange={updateFilter}>
                  <option value="">Все города</option>
                  <option value="Astana">Astana</option>
                  <option value="Almaty">Almaty</option>
                  <option value="Remote">Remote</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Нужна роль</label>
                <AutocompleteInput
                  name="role"
                  className="select"
                  value={filters.role}
                  onChange={updateFilter}
                  placeholder="Любая роль"
                  suggestions={ROLE_SUGGESTIONS}
                />
              </div>
              <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem' }}>
                {hasFilters && (
                  <button 
                    className="btn btn-outline" 
                    onClick={() => { resetFilters(); setIsFiltersModalOpen(false); }} 
                    style={{ flex: 1 }}
                  >
                    Сбросить
                  </button>
                )}
                <button 
                  className="btn btn-primary" 
                  onClick={() => setIsFiltersModalOpen(false)} 
                  style={{ flex: 2 }}
                >
                  Показать результаты
                </button>
              </div>
            </div>
          </Modal>

          {/* Grid */}
          <PullToRefresh onRefresh={refetch}>
            <div className="bento-grid">
            {isPending ? (
              <>
                <SkeletonCard featured />
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : projects.length === 0 ? (
              <EmptyState 
                title={hasFilters ? 'Ничего не найдено' : 'Проекты появятся здесь'}
                description={hasFilters ? 'Попробуйте изменить фильтры или поисковый запрос.' : 'Стань первым — создай проект и найди свою команду.'}
                actionText={hasFilters ? 'Сбросить фильтры' : 'Создать проект'}
                actionOnClick={hasFilters ? resetFilters : undefined}
                actionTo={hasFilters ? undefined : '/new'}
              />
            ) : (
              <>
                {projects.map((p, i) => (
                  <div key={p.id} ref={i === projects.length - 1 ? lastProjectElementRef : null}>
                    <ProjectCard
                      project={p}
                      featured={i === 0 && !debouncedSearch && !Object.values(filters).some(v=>v)}
                      index={i}
                      hasApplied={appliedProjectIds.has(p.id)}
                    />
                  </div>
                ))}
                {isFetchingNextPage && (
                  <>
                    <SkeletonCard />
                    <SkeletonCard />
                  </>
                )}
              </>
            )}
            </div>
          </PullToRefresh>
    </motion.div>
  );
}

export default FeedPage;
