import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiBell, FiCheck, FiCheckSquare, FiTrash2 } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchWithAuth } from '../api/client';
import EmptyState from '../components/EmptyState';
import Badge from '../components/ui/Badge';

function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await fetchWithAuth('/api/notifications');
      if (!res.ok) throw new Error('Failed to fetch notifications');
      return res.json();
    }
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id) => {
      const res = await fetchWithAuth(`/api/notifications/${id}/read`, { method: 'PUT' });
      if (!res.ok) throw new Error('Failed to mark as read');
      return id;
    },
    onSuccess: (id) => {
      queryClient.setQueryData(['notifications'], (old) => {
        if (!old) return old;
        return old.map(n => n.id === id ? { ...n, isRead: true } : n);
      });
    }
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const res = await fetchWithAuth('/api/notifications/read-all', { method: 'PUT' });
      if (!res.ok) throw new Error('Failed to mark all as read');
      return true;
    },
    onSuccess: () => {
      queryClient.setQueryData(['notifications'], (old) => {
        if (!old) return old;
        return old.map(n => ({ ...n, isRead: true }));
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await fetchWithAuth(`/api/notifications/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete notification');
      return id;
    },
    onSuccess: (id) => {
      queryClient.setQueryData(['notifications'], (old) => {
        if (!old) return old;
        return old.filter(n => n.id !== id);
      });
    }
  });

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      const res = await fetchWithAuth('/api/notifications/all', { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete all notifications');
      return true;
    },
    onSuccess: () => {
      queryClient.setQueryData(['notifications'], () => []);
    }
  });

  const markAsRead = (id) => markAsReadMutation.mutate(id);
  const markAllAsRead = () => markAllAsReadMutation.mutate();
  const deleteNotification = (id) => deleteMutation.mutate(id);
  const deleteAll = () => {
    if (window.confirm('Вы уверены, что хотите удалить все уведомления?')) {
      deleteAllMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h1 style={{ marginBottom: '1.5rem' }}>Уведомления</h1>
        <div className="skeleton-card" />
        <div className="skeleton-card" />
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      style={{ maxWidth: '600px', margin: '0 auto' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
          <FiBell /> Уведомления
          {unreadCount > 0 && <Badge type="accent">{unreadCount}</Badge>}
        </h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {unreadCount > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={markAllAsRead}>
              <FiCheckSquare size={16} style={{ marginRight: '4px' }} /> Прочитать всё
            </button>
          )}
          {notifications.length > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={deleteAll} style={{ color: 'var(--danger)' }}>
              <FiTrash2 size={16} style={{ marginRight: '4px' }} /> Очистить
            </button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <EmptyState title="Нет уведомлений" description="Здесь будут появляться уведомления о новых откликах и сообщениях." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {notifications.map(notif => (
            <div
              key={notif.id}
              className={`bento-card ${!notif.isRead ? 'unread' : ''}`}
              style={{
                padding: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '1rem',
                borderLeft: !notif.isRead ? '3px solid var(--accent)' : '3px solid transparent',
                background: !notif.isRead ? 'var(--bg)' : 'var(--surface)',
              }}
            >
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 'var(--text-sm)', lineHeight: 1.5, color: 'var(--text-primary)' }}>
                  {notif.message}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                    {new Date(notif.createdAt).toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {notif.link && (
                    <Link to={notif.link} style={{ fontSize: 'var(--text-xs)', color: 'var(--accent)', textDecoration: 'none' }}>
                      Перейти
                    </Link>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                {!notif.isRead && (
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => markAsRead(notif.id)}
                    title="Отметить как прочитанное"
                    style={{ padding: '0.25rem', color: 'var(--text-muted)' }}
                  >
                    <FiCheck size={16} />
                  </button>
                )}
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => deleteNotification(notif.id)}
                  title="Удалить уведомление"
                  style={{ padding: '0.25rem', color: 'var(--danger)', opacity: 0.7 }}
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export default NotificationsPage;
