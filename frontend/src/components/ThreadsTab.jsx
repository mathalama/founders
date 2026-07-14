import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiMessageCircle, FiSend, FiCornerDownRight, FiX, FiCheck } from 'react-icons/fi';
import { API_BASE_URL, fetchWithAuth } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Avatar from './ui/Avatar';

function FormatDate({ dateString }) {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    return '';
  }
}

function renderContentWithMentions(content) {
  if (!content) return null;
  const parts = content.split(/(@[^,\n]+,)/g);
  return parts.map((part, index) => {
    if (part.startsWith('@')) {
      return (
        <span key={index} style={{ color: 'var(--accent)', fontWeight: 600 }}>
          {part}
        </span>
      );
    }
    return part;
  });
}

// Sub-component for individual thread replies to isolate queries
function ThreadReplies({ threadId, isExpanded, onReplySuccess }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [cursorTrigger, setCursorTrigger] = useState(0);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (isReplying && textareaRef.current) {
      const el = textareaRef.current;
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    }
  }, [cursorTrigger]);

  const { data, isLoading } = useQuery({
    queryKey: ['thread', threadId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/posts/${threadId}`);
      if (!res.ok) throw new Error('Failed to load thread details');
      return res.json();
    },
    enabled: isExpanded,
  });

  const replyMutation = useMutation({
    mutationFn: async (content) => {
      const res = await fetchWithAuth('/api/posts', {
        method: 'POST',
        body: JSON.stringify({ content, parentId: threadId }),
      });
      if (!res.ok) throw new Error('Failed to post reply');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['thread', threadId]);
      showToast('Ответ опубликован', 'success');
      setReplyText('');
      setIsReplying(false);
      if (onReplySuccess) onReplySuccess();
    },
    onError: () => {
      showToast('Ошибка при публикации ответа', 'error');
    },
  });

  if (!isExpanded) return null;

  if (isLoading) {
    return (
      <div style={{ paddingLeft: '2.5rem', marginTop: '0.5rem' }}>
        <div className="skeleton skeleton-text-sm" style={{ width: '40%' }} />
      </div>
    );
  }

  const replies = data?.replies || [];

  return (
    <div className="reply-connector" style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* List replies */}
      {replies.map((reply) => (
        <div key={reply.id} className="reply-item">
          <Avatar name={reply.user?.name} url={reply.user?.avatarUrl} size="sm" />
          <div style={{ flex: 1, padding: '0.125rem 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)' }}>{reply.user?.name}</span>
              <span className="post-dot-separator">•</span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                <FormatDate dateString={reply.createdAt} />
              </span>
            </div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: '0.25rem', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
              {renderContentWithMentions(reply.content)}
            </div>

            {/* Actions for nested reply */}
            {user && (
              <div style={{ marginTop: '0.25rem' }}>
                <button
                  onClick={() => {
                    setIsReplying(true);
                    const tag = `@${reply.user?.name}, `;
                    setReplyText((prev) => {
                      if (prev.includes(tag)) return prev;
                      return tag + prev;
                    });
                    setCursorTrigger((c) => c + 1);
                  }}
                  className="btn btn-ghost btn-sm"
                  style={{ padding: '0', height: 'auto', fontSize: '11px', color: 'var(--accent)' }}
                >
                  Ответить
                </button>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Reply Trigger/Form */}
      {user ? (
        !isReplying ? (
          <button
            onClick={() => {
              setIsReplying(true);
              setReplyText('');
              setCursorTrigger((c) => c + 1);
            }}
            className="btn btn-ghost btn-sm"
            style={{ fontSize: '12px', color: 'var(--accent)', alignSelf: 'flex-start', padding: '0.25rem 0.5rem', background: 'var(--accent-subtle)', borderRadius: 'var(--radius-sm)', marginTop: '0.25rem' }}
          >
            Ответить...
          </button>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (replyText.trim()) replyMutation.mutate(replyText);
            }}
            style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', width: '100%', marginTop: '0.5rem' }}
          >
            <textarea
              ref={textareaRef}
              className="input"
              placeholder="Напишите ответ..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={1}
              style={{ minHeight: '38px', padding: '0.5rem 0.75rem', flex: 1, resize: 'none' }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              <button
                type="button"
                onClick={() => setIsReplying(false)}
                className="btn btn-ghost btn-sm"
                style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}
              >
                <FiX size={14} />
              </button>
              <button
                type="submit"
                disabled={replyMutation.isPending || !replyText.trim()}
                className="btn btn-accent btn-sm"
                style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}
              >
                <FiSend size={12} />
              </button>
            </div>
          </form>
        )
      ) : (
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
          Войдите, чтобы ответить в этой ветке.
        </span>
      )}
    </div>
  );
}

export default function ThreadsTab() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [newThreadText, setNewThreadText] = useState('');
  const [expandedThreads, setExpandedThreads] = useState({}); // threadId -> boolean

  // Get all root threads
  const { data: threads = [], isLoading, refetch } = useQuery({
    queryKey: ['threads'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/posts`);
      if (!res.ok) throw new Error('Failed to load threads');
      return res.json();
    },
  });

  // Create thread mutation
  const createThreadMutation = useMutation({
    mutationFn: async (content) => {
      const res = await fetchWithAuth('/api/posts', {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error('Failed to post thread');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['threads']);
      showToast('Мысль опубликована!', 'success');
      setNewThreadText('');
    },
    onError: () => {
      showToast('Ошибка при публикации поста', 'error');
    },
  });

  const handlePostThread = (e) => {
    e.preventDefault();
    if (newThreadText.trim()) {
      createThreadMutation.mutate(newThreadText);
    }
  };

  const toggleExpand = (threadId) => {
    setExpandedThreads((prev) => ({
      ...prev,
      [threadId]: !prev[threadId],
    }));
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="skeleton-card" style={{ height: '100px' }} />
        <div className="skeleton-card" />
        <div className="skeleton-card" />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Create New Thread Card */}
      {user ? (
        <form
          onSubmit={handlePostThread}
          className="post-creator"
          style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}
        >
          <Avatar name={user.name} url={user.avatarUrl} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <textarea
              className="post-creator-textarea"
              placeholder="Поделитесь мыслью, задайте вопрос стартап-сообществу..."
              value={newThreadText}
              onChange={(e) => setNewThreadText(e.target.value)}
              rows={2}
            />
            <div className="post-creator-footer">
              <button
                type="submit"
                disabled={createThreadMutation.isPending || !newThreadText.trim()}
                className="btn btn-accent btn-sm"
                style={{ gap: '0.375rem' }}
              >
                <FiSend size={12} /> Опубликовать
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div
          className="post-card"
          style={{
            padding: '1.25rem',
            textAlign: 'center',
            fontSize: 'var(--text-sm)',
            color: 'var(--text-secondary)',
            borderStyle: 'dashed',
            borderWidth: '1px'
          }}
        >
          Хотите написать пост? Пожалуйста, <a href="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>войдите в систему</a>.
        </div>
      )}

      {/* Threads list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {threads.length === 0 ? (
          <div className="post-card" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            Лента обсуждений пока пуста. Напишите первую публикацию!
          </div>
        ) : (
          threads.map((thread) => {
            const isExpanded = !!expandedThreads[thread.id];
            return (
              <div key={thread.id} className="post-card animate-fadeInUp">
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <Avatar name={thread.user?.name} url={thread.user?.avatarUrl} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {thread.user?.name}
                      </span>
                      {thread.user?.roleTitle && (
                        <span className="role-badge-subtle">
                          {thread.user.roleTitle}
                        </span>
                      )}
                      <span className="post-dot-separator">•</span>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                        <FormatDate dateString={thread.createdAt} />
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 'var(--text-sm)',
                        color: 'var(--text-primary)',
                        marginTop: '0.5rem',
                        whiteSpace: 'pre-wrap',
                        lineHeight: 1.6,
                      }}
                    >
                      {renderContentWithMentions(thread.content)}
                    </div>

                    {/* Actions */}
                    <div style={{ marginTop: '0.875rem', display: 'flex', alignItems: 'center' }}>
                      <button
                        onClick={() => toggleExpand(thread.id)}
                        className="btn btn-ghost btn-sm"
                        style={{
                          gap: '0.375rem',
                          color: isExpanded ? 'var(--accent)' : 'var(--text-secondary)',
                          background: isExpanded ? 'var(--accent-subtle)' : 'transparent',
                          borderRadius: 'var(--radius-md)',
                        }}
                      >
                        <FiMessageCircle size={14} />
                        <span>{isExpanded ? 'Скрыть ответы' : 'Обсудить'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sub replies component */}
                <ThreadReplies
                  threadId={thread.id}
                  isExpanded={isExpanded}
                  onReplySuccess={() => {
                    // Make sure thread remains expanded
                    setExpandedThreads((prev) => ({ ...prev, [thread.id]: true }));
                  }}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
