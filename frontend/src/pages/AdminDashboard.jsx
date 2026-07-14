import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchWithAuth } from '../api/client';
import { useToast } from '../context/ToastContext';
import { FiUsers, FiFolder, FiTrash2, FiShield, FiSlash, FiEyeOff, FiPieChart, FiDownload, FiMail, FiMessageSquare } from 'react-icons/fi';

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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminUsers'] })
  });

  const toggleBan = useMutation({
    mutationFn: async (id) => fetchWithAuth(`/api/admin/users/${id}/ban`, { method: 'PUT' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminUsers'] })
  });

  const deleteUser = useMutation({
    mutationFn: async (id) => fetchWithAuth(`/api/admin/users/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminProjects'] });
      showToast('Пользователь удален', 'success');
    }
  });

  const toggleHide = useMutation({
    mutationFn: async (id) => fetchWithAuth(`/api/admin/projects/${id}/hide`, { method: 'PUT' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminProjects'] })
  });

  const deleteProject = useMutation({
    mutationFn: async (id) => fetchWithAuth(`/api/admin/projects/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProjects'] });
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
      showToast('Пост/комментарий удален', 'success');
    },
    onError: () => {
      showToast('Ошибка при удалении поста', 'error');
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
      </div>

      {activeTab === 'stats' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {statsLoading ? <div className="col-span-3 text-center py-8">Загрузка статистики...</div> : (
            <>
              <div className="bg-[var(--surface)] border border-[var(--border)] p-6 rounded-xl">
                <div className="text-[var(--text-secondary)] text-sm mb-1">Всего пользователей</div>
                <div className="text-3xl font-bold">{stats?.totalUsers || 0}</div>
                <div className="text-green-500 text-sm mt-2">+{stats?.usersLast7 || 0} за неделю</div>
              </div>
              <div className="bg-[var(--surface)] border border-[var(--border)] p-6 rounded-xl">
                <div className="text-[var(--text-secondary)] text-sm mb-1">Всего проектов</div>
                <div className="text-3xl font-bold">{stats?.totalProjects || 0}</div>
                <div className="text-green-500 text-sm mt-2">+{stats?.projectsLast7 || 0} за неделю</div>
              </div>
              <div className="bg-[var(--surface)] border border-[var(--border)] p-6 rounded-xl">
                <div className="text-[var(--text-secondary)] text-sm mb-1">Открытых вакансий</div>
                <div className="text-3xl font-bold">{stats?.openRoles || 0}</div>
                <div className="text-[var(--text-secondary)] text-sm mt-2">{stats?.totalApplications || 0} откликов всего</div>
              </div>
            </>
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
