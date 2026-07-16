import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchWithAuth } from '../api/client';
import { useToast } from '../context/ToastContext';
import { FiUsers, FiFolder, FiTrash2, FiShield, FiSlash, FiEyeOff, FiPieChart, FiDownload, FiMail, FiMessageSquare } from 'react-icons/fi';

const TrendChart = ({ title, data, color = '#6366f1' }) => {
  if (!data || data.length === 0) return null;

  const maxVal = Math.max(...data.map(d => d.count), 5);
  const width = 500;
  const height = 150;
  const padding = 20;

  const points = data.map((d, index) => {
    const x = padding + (index * (width - padding * 2)) / (data.length - 1);
    const y = height - padding - (d.count * (height - padding * 2)) / maxVal;
    return `${x},${y}`;
  }).join(' ');

  const gradId = `grad-${title.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] p-5 rounded-xl flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-semibold text-[var(--text-secondary)]">{title}</h4>
        <span className="text-xs text-[var(--text-muted)]">За 7 дней</span>
      </div>
      <div className="relative w-full h-[160px] flex items-center justify-center">
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" className="overflow-visible">
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.2"/>
              <stop offset="100%" stopColor={color} stopOpacity="0"/>
            </linearGradient>
          </defs>

          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = padding + ratio * (height - padding * 2);
            return (
              <line
                key={i}
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke="var(--border)"
                strokeWidth="1"
                strokeDasharray="4 4"
                opacity="0.3"
              />
            );
          })}

          <path
            d={`M ${padding},${height - padding} L ${points} L ${width - padding},${height - padding} Z`}
            fill={`url(#${gradId})`}
          />

          <polyline
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />

          {data.map((d, index) => {
            const x = padding + (index * (width - padding * 2)) / (data.length - 1);
            const y = height - padding - (d.count * (height - padding * 2)) / maxVal;
            return (
              <g key={index} className="group cursor-pointer">
                <circle
                  cx={x}
                  cy={y}
                  r="4"
                  fill="var(--surface)"
                  stroke={color}
                  strokeWidth="2.5"
                />
                <circle
                  cx={x}
                  cy={y}
                  r="8"
                  fill={color}
                  opacity="0"
                  style={{ transition: 'opacity 0.2s' }}
                  className="hover:opacity-20"
                />
                <title>{`${d.date}: ${d.count}`}</title>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex justify-between px-2 text-[10px] text-[var(--text-muted)] font-medium">
        {data.map((d, i) => {
          const parts = d.date.split('-');
          const label = parts.length === 3 ? `${parts[2]}.${parts[1]}` : d.date;
          return <span key={i}>{label}</span>;
        })}
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('stats');
  const [newsletterSubject, setNewsletterSubject] = useState('');
  const [newsletterBody, setNewsletterBody] = useState('');
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: async () => {
      const res = await fetchWithAuth('/api/admin/stats');
      if (!res.ok) throw new Error('Failed to load stats');
      return res.json();
    }
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      const res = await fetchWithAuth('/api/admin/users');
      if (!res.ok) throw new Error('Failed to load users');
      return res.json();
    }
  });

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['adminProjects'],
    queryFn: async () => {
      const res = await fetchWithAuth('/api/admin/projects');
      if (!res.ok) throw new Error('Failed to load projects');
      return res.json();
    }
  });

  const toggleAdmin = useMutation({
    mutationFn: async (id) => fetchWithAuth(`/api/admin/users/${id}/admin`, { method: 'PUT' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminAuditLogs'] });
    }
  });

  const toggleBan = useMutation({
    mutationFn: async (id) => fetchWithAuth(`/api/admin/users/${id}/ban`, { method: 'PUT' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminAuditLogs'] });
    }
  });

  const deleteUser = useMutation({
    mutationFn: async (id) => fetchWithAuth(`/api/admin/users/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminProjects'] });
      queryClient.invalidateQueries({ queryKey: ['adminAuditLogs'] });
      showToast('Пользователь удален', 'success');
    }
  });

  const toggleHide = useMutation({
    mutationFn: async (id) => fetchWithAuth(`/api/admin/projects/${id}/hide`, { method: 'PUT' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProjects'] });
      queryClient.invalidateQueries({ queryKey: ['adminAuditLogs'] });
    }
  });

  const deleteProject = useMutation({
    mutationFn: async (id) => fetchWithAuth(`/api/admin/projects/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProjects'] });
      queryClient.invalidateQueries({ queryKey: ['adminAuditLogs'] });
      showToast('Проект удален', 'success');
    }
  });

  const sendNewsletter = useMutation({
    mutationFn: async (data) => fetchWithAuth('/api/admin/newsletter', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: async (res) => {
      const data = await res.json();
      showToast(`Рассылка отправлена ${data.sentCount} пользователям`, 'success');
      setNewsletterSubject('');
      setNewsletterBody('');
      queryClient.invalidateQueries({ queryKey: ['adminAuditLogs'] });
    },
    onError: (err) => {
      showToast(err.message, 'error');
    }
  });

  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ['adminPosts'],
    queryFn: async () => {
      const res = await fetchWithAuth('/api/admin/posts');
      if (!res.ok) throw new Error('Failed to load posts');
      return res.json();
    }
  });

  const deletePostMutation = useMutation({
    mutationFn: async (id) => fetchWithAuth(`/api/admin/posts/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPosts'] });
      queryClient.invalidateQueries({ queryKey: ['adminAuditLogs'] });
      showToast('Пост/комментарий удален', 'success');
    },
    onError: () => {
      showToast('Ошибка при удалении поста', 'error');
    }
  });

  const { data: auditLogs, isLoading: auditLogsLoading } = useQuery({
    queryKey: ['adminAuditLogs'],
    queryFn: async () => {
      const res = await fetchWithAuth('/api/admin/audit-logs');
      if (!res.ok) throw new Error('Failed to load audit logs');
      return res.json();
    }
  });

  const handleDeletePost = (id) => {
    if (window.confirm('Вы уверены, что хотите удалить этот пост? Все связанные ответы также будут удалены.')) {
      deletePostMutation.mutate(id);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Панель управления</h1>
        <div className="flex gap-2">
          {activeTab === 'users' && users && (
            <button onClick={() => exportCSV(users, 'users.csv')} className="btn btn-secondary flex items-center gap-2">
              <FiDownload /> Экспорт Users
            </button>
          )}
          {activeTab === 'projects' && projects && (
            <button onClick={() => exportCSV(projects, 'projects.csv')} className="btn btn-secondary flex items-center gap-2">
              <FiDownload /> Экспорт Projects
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-4 mb-6 border-b border-[var(--border)] pb-2">
        <button
          onClick={() => setActiveTab('stats')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${activeTab === 'stats' ? 'bg-[var(--surface-raised)] font-medium' : 'text-[var(--text-secondary)] hover:bg-[var(--surface)]'}`}
        >
          <FiPieChart /> Сводка
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${activeTab === 'users' ? 'bg-[var(--surface-raised)] font-medium' : 'text-[var(--text-secondary)] hover:bg-[var(--surface)]'}`}
        >
          <FiUsers /> Пользователи
        </button>
        <button
          onClick={() => setActiveTab('projects')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${activeTab === 'projects' ? 'bg-[var(--surface-raised)] font-medium' : 'text-[var(--text-secondary)] hover:bg-[var(--surface)]'}`}
        >
          <FiFolder /> Проекты
        </button>
        <button
          onClick={() => setActiveTab('posts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${activeTab === 'posts' ? 'bg-[var(--surface-raised)] font-medium' : 'text-[var(--text-secondary)] hover:bg-[var(--surface)]'}`}
        >
          <FiMessageSquare /> Обсуждения
        </button>
        <button
          onClick={() => setActiveTab('newsletter')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${activeTab === 'newsletter' ? 'bg-[var(--surface-raised)] font-medium' : 'text-[var(--text-secondary)] hover:bg-[var(--surface)]'}`}
        >
          <FiMail /> Рассылка
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${activeTab === 'audit' ? 'bg-[var(--surface-raised)] font-medium' : 'text-[var(--text-secondary)] hover:bg-[var(--surface)]'}`}
        >
          <FiShield /> Аудит
        </button>
      </div>

      {activeTab === 'stats' && (
        <div className="flex flex-col gap-8 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {statsLoading ? (
              <div className="col-span-4 text-center py-8 text-[var(--text-secondary)]">Загрузка сводки...</div>
            ) : (
              <>
                <div className="bg-[var(--surface)] border border-[var(--border)] p-6 rounded-xl flex flex-col justify-between">
                  <div>
                    <div className="text-[var(--text-secondary)] text-sm mb-1 font-medium">Пользователи</div>
                    <div className="text-3xl font-bold text-[var(--text-primary)]">{stats?.totalUsers || 0}</div>
                  </div>
                  <div className="text-green-500 text-xs mt-3 font-semibold flex items-center gap-1">
                    <span>+{stats?.usersLast7 || 0}</span>
                    <span className="text-[var(--text-muted)] font-normal">за неделю</span>
                  </div>
                </div>

                <div className="bg-[var(--surface)] border border-[var(--border)] p-6 rounded-xl flex flex-col justify-between">
                  <div>
                    <div className="text-[var(--text-secondary)] text-sm mb-1 font-medium">Проекты</div>
                    <div className="text-3xl font-bold text-[var(--text-primary)]">{stats?.totalProjects || 0}</div>
                  </div>
                  <div className="text-green-500 text-xs mt-3 font-semibold flex items-center gap-1">
                    <span>+{stats?.projectsLast7 || 0}</span>
                    <span className="text-[var(--text-muted)] font-normal">за неделю</span>
                  </div>
                </div>

                <div className="bg-[var(--surface)] border border-[var(--border)] p-6 rounded-xl flex flex-col justify-between">
                  <div>
                    <div className="text-[var(--text-secondary)] text-sm mb-1 font-medium">Открытые роли</div>
                    <div className="text-3xl font-bold text-[var(--text-primary)]">{stats?.openRoles || 0}</div>
                  </div>
                  <div className="text-[var(--text-muted)] text-xs mt-3">
                    Всего откликов: <strong className="text-[var(--text-primary)] font-medium">{stats?.totalApplications || 0}</strong>
                  </div>
                </div>

                <div className="bg-[var(--surface)] border border-[var(--border)] p-6 rounded-xl flex flex-col justify-between">
                  <div>
                    <div className="text-[var(--text-secondary)] text-sm mb-1 font-medium">Писем отправлено</div>
                    <div className="text-3xl font-bold text-[var(--text-primary)]">{stats?.totalEmails || 0}</div>
                  </div>
                  <div className="text-[var(--text-muted)] text-xs mt-3">
                    Транзакционные и рассылки
                  </div>
                </div>
              </>
            )}
          </div>

          {!statsLoading && stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <TrendChart title="Регистрации пользователей" data={stats.dailySignups} color="#6366f1" />
              <TrendChart title="Создание проектов" data={stats.dailyProjects} color="#10b981" />
              <TrendChart title="Отправлено писем" data={stats.dailyEmails} color="#f59e0b" />
            </div>
          )}
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
          {usersLoading ? <div className="p-8 text-center">Загрузка...</div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[var(--surface-raised)] text-[var(--text-secondary)] text-sm">
                    <th className="p-4 font-medium">Имя</th>
                    <th className="p-4 font-medium">Email</th>
                    <th className="p-4 font-medium">Роль</th>
                    <th className="p-4 font-medium">Статусы</th>
                    <th className="p-4 font-medium text-right">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {users?.map(u => (
                    <tr key={u.id} className="hover:bg-[var(--surface-raised)] transition-colors">
                      <td className="p-4 font-medium">{u.name}</td>
                      <td className="p-4 text-[var(--text-secondary)]">{u.email}</td>
                      <td className="p-4 text-[var(--text-secondary)] text-sm">{u.roleTitle || '—'}</td>
                      <td className="p-4 flex gap-2">
                        {u.isAdmin && <span className="px-2 py-1 bg-blue-500/10 text-blue-500 rounded text-xs font-medium">Админ</span>}
                        {u.isBanned && <span className="px-2 py-1 bg-red-500/10 text-red-500 rounded text-xs font-medium">Забанен</span>}
                      </td>
                      <td className="p-4 text-right flex gap-2 justify-end">
                        <button onClick={() => toggleAdmin.mutate(u.id)} className="p-2 text-blue-500 hover:bg-blue-500/10 rounded" title="Права админа">
                          <FiShield />
                        </button>
                        <button onClick={() => toggleBan.mutate(u.id)} className="p-2 text-orange-500 hover:bg-orange-500/10 rounded" title="Бан/Разбан">
                          <FiSlash />
                        </button>
                        <button onClick={() => { if(window.confirm('Удалить пользователя навсегда?')) deleteUser.mutate(u.id) }} className="p-2 text-red-500 hover:bg-red-500/10 rounded" title="Удалить">
                          <FiTrash2 />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'projects' && (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
          {projectsLoading ? <div className="p-8 text-center">Загрузка...</div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[var(--surface-raised)] text-[var(--text-secondary)] text-sm">
                    <th className="p-4 font-medium">Проект</th>
                    <th className="p-4 font-medium">Создатель</th>
                    <th className="p-4 font-medium">Категория</th>
                    <th className="p-4 font-medium">Статус</th>
                    <th className="p-4 font-medium text-right">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {projects?.map(p => (
                    <tr key={p.id} className={`hover:bg-[var(--surface-raised)] transition-colors ${p.isHidden ? 'opacity-50' : ''}`}>
                      <td className="p-4 font-medium">{p.title}</td>
                      <td className="p-4 text-[var(--text-secondary)]">{p.owner?.name}</td>
                      <td className="p-4 text-[var(--text-secondary)] text-sm">{p.category}</td>
                      <td className="p-4 flex gap-2">
                        {p.isHidden && <span className="px-2 py-1 bg-orange-500/10 text-orange-500 rounded text-xs font-medium">Скрыт</span>}
                      </td>
                      <td className="p-4 text-right flex gap-2 justify-end">
                        <button onClick={() => toggleHide.mutate(p.id)} className="p-2 text-orange-500 hover:bg-orange-500/10 rounded" title="Скрыть/Показать">
                          <FiEyeOff />
                        </button>
                        <button onClick={() => { if(window.confirm('Удалить проект?')) deleteProject.mutate(p.id) }} className="p-2 text-red-500 hover:bg-red-500/10 rounded" title="Удалить">
                          <FiTrash2 />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'posts' && (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
          {postsLoading ? <div className="p-8 text-center">Загрузка обсуждений...</div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[var(--surface-raised)] text-[var(--text-secondary)] text-sm">
                    <th className="p-4 font-medium">Автор</th>
                    <th className="p-4 font-medium">Тип</th>
                    <th className="p-4 font-medium">Содержание</th>
                    <th className="p-4 font-medium">Дата создания</th>
                    <th className="p-4 font-medium text-right">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {posts && posts.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-[var(--text-muted)]">
                        Обсуждений пока нет
                      </td>
                    </tr>
                  ) : (
                    posts?.map(post => (
                      <tr key={post.id} className="hover:bg-[var(--surface-raised)] transition-colors">
                        <td className="p-4 font-medium">
                          <div>{post.user?.name}</div>
                          <div className="text-xs text-[var(--text-secondary)]">{post.user?.roleTitle || 'Участник'}</div>
                        </td>
                        <td className="p-4">
                          {post.parentId ? (
                            <span className="px-2 py-1 bg-[var(--surface-raised)] border border-[var(--border)] rounded text-xs text-[var(--text-secondary)]">Ответ</span>
                          ) : (
                            <span className="px-2 py-1 bg-violet-500/10 border border-violet-500/20 text-violet-500 rounded text-xs font-semibold">Главный тред</span>
                          )}
                        </td>
                        <td className="p-4 max-w-sm">
                          <div className="truncate text-sm text-[var(--text-primary)]" title={post.content}>
                            {post.content}
                          </div>
                        </td>
                        <td className="p-4 text-sm text-[var(--text-secondary)]">
                          {new Date(post.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="p-2 text-red-500 hover:bg-red-500/10 rounded"
                            title="Удалить"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'newsletter' && (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-8 max-w-2xl">
          <h2 className="text-xl font-bold mb-6">Рассылка писем всем пользователям</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Тема письма</label>
              <input
                type="text"
                value={newsletterSubject}
                onChange={e => setNewsletterSubject(e.target.value)}
                className="input w-full"
                placeholder="Пример: Важное обновление платформы"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Текст письма</label>
              <textarea
                value={newsletterBody}
                onChange={e => setNewsletterBody(e.target.value)}
                className="input w-full min-h-[200px]"
                placeholder="Напишите текст рассылки..."
              />
            </div>
            <button
              onClick={() => {
                if(!newsletterSubject || !newsletterBody) return showToast('Заполните все поля', 'error');
                if(window.confirm('Отправить рассылку всем активным пользователям?')) {
                  sendNewsletter.mutate({ subject: newsletterSubject, body: newsletterBody });
                }
              }}
              disabled={sendNewsletter.isPending}
              className="btn btn-primary w-full flex justify-center gap-2"
            >
              <FiMail /> {sendNewsletter.isPending ? 'Отправка...' : 'Отправить рассылку'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <FiShield style={{ color: 'var(--accent)' }} /> Журнал аудита действий администрации
          </h2>
          {auditLogsLoading ? (
            <div className="text-center py-8">Загрузка логов аудита...</div>
          ) : !auditLogs || auditLogs.length === 0 ? (
            <div className="text-center py-8 text-[var(--text-muted)]">Журнал аудита пуст.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border)] pb-2 text-[var(--text-secondary)] text-sm">
                    <th className="py-3 px-4">Время</th>
                    <th className="py-3 px-4">Администратор</th>
                    <th className="py-3 px-4">Действие</th>
                    <th className="py-3 px-4">Тип цели</th>
                    <th className="py-3 px-4">ID цели</th>
                    <th className="py-3 px-4">Подробности</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => {
                    const date = new Date(log.createdAt).toLocaleString('ru-RU', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    });
                    
                    let actionBadgeColor = 'var(--text-muted)';
                    let actionBadgeBg = 'var(--border)';
                    if (log.action.includes('delete') || log.action.includes('ban')) {
                      actionBadgeColor = 'var(--danger)';
                      actionBadgeBg = 'rgba(239, 68, 68, 0.1)';
                    } else if (log.action.includes('unban') || log.action.includes('show') || log.action.includes('make')) {
                      actionBadgeColor = 'var(--success)';
                      actionBadgeBg = 'rgba(34, 197, 94, 0.1)';
                    }

                    return (
                      <tr key={log.id} className="border-b border-[var(--border)] hover:bg-[var(--surface-raised)] text-sm">
                        <td className="py-3 px-4 whitespace-nowrap text-[var(--text-secondary)]">{date}</td>
                        <td className="py-3 px-4 font-medium">{log.adminName || log.adminId || 'Система'}</td>
                        <td className="py-3 px-4">
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '0.125rem 0.5rem',
                            borderRadius: '100px',
                            color: actionBadgeColor,
                            background: actionBadgeBg,
                          }}>
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[var(--text-secondary)]">{log.targetType}</td>
                        <td className="py-3 px-4 font-mono text-xs">{log.targetId}</td>
                        <td className="py-3 px-4 text-[var(--text-secondary)]">{log.details}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

function exportCSV(data, filename) {
  if (!data || !data.length) return;
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(obj => 
    Object.values(obj).map(val => 
      typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val
    ).join(',')
  ).join('\n');
  
  const blob = new Blob([headers + '\n' + rows], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default AdminDashboard;
