import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiMessageSquare, FiCornerDownRight, FiSend, FiX } from 'react-icons/fi';
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


export default function ProjectComments({ projectId }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');
  const [replyToId, setReplyToId] = useState(null); // ID of root comment being replied to
  const [replyContent, setReplyContent] = useState('');
  const replyTextareaRef = useRef(null);

  useEffect(() => {
    if (replyToId !== null && replyTextareaRef.current) {
      const el = replyTextareaRef.current;
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    }
  }, [replyContent, replyToId]);

  const handleStartReply = (rootCommentId, replyToUserName) => {
    setReplyToId(rootCommentId);
    if (replyToUserName) {
      const tag = `@${replyToUserName}, `;
      setReplyContent((prev) => {
        if (prev.includes(tag)) return prev;
        return tag + prev;
      });
    } else {
      setReplyContent('');
    }
  };

  // Fetch comments
  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['comments', projectId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/projects/${projectId}/comments`);
      if (!res.ok) throw new Error('Failed to load comments');
      return res.json();
    },
  });

  // Post comment mutation
  const postCommentMutation = useMutation({
    mutationFn: async ({ content, parentId }) => {
      const res = await fetchWithAuth(`/api/projects/${projectId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content, parentId }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to post comment');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['comments', projectId]);
      showToast('Комментарий добавлен', 'success');
      setNewComment('');
      setReplyToId(null);
      setReplyContent('');
    },
    onError: (err) => {
      showToast(err.message, 'error');
    },
  });

  const handlePostRoot = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    postCommentMutation.mutate({ content: newComment });
  };

  const handlePostReply = (e, rootId) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    postCommentMutation.mutate({ content: replyContent, parentId: rootId });
  };

  if (isLoading) {
    return (
      <div style={{ padding: '1rem 0' }}>
        <div className="skeleton skeleton-text" style={{ width: '30%', marginBottom: '1rem' }} />
        <div className="skeleton" style={{ height: '80px', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }} />
      </div>
    );
  }

  // Separate root comments and replies
  const rootComments = comments.filter((c) => !c.parentId);
  const repliesGrouped = comments.reduce((acc, c) => {
    if (c.parentId) {
      if (!acc[c.parentId]) acc[c.parentId] = [];
      acc[c.parentId].push(c);
    }
    return acc;
  }, {});

  return (
    <div style={{ marginTop: '2rem' }}>
      <h3 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <FiMessageSquare size={18} /> Вопросы и обсуждение ({comments.length})
      </h3>

      {/* Root Comment Form */}
      {user ? (
        <form onSubmit={handlePostRoot} style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', alignItems: 'flex-start' }}>
          <Avatar name={user.name} url={user.avatarUrl} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <textarea
              className="textarea"
              placeholder="Задать вопрос фаундеру или начать обсуждение..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={2}
              style={{ minHeight: '60px', padding: '0.625rem 0.875rem' }}
            />
            <button
              type="submit"
              disabled={postCommentMutation.isPending || !newComment.trim()}
              className="btn btn-primary btn-sm"
              style={{ alignSelf: 'flex-end', gap: '0.375rem' }}
            >
              <FiSend size={12} /> Отправить
            </button>
          </div>
        </form>
      ) : (
        <div
          style={{
            padding: '1rem',
            background: 'var(--surface-raised)',
            border: '1px dashed var(--border)',
            borderRadius: 'var(--radius-md)',
            textAlign: 'center',
            marginBottom: '2rem',
            fontSize: 'var(--text-sm)',
            color: 'var(--text-secondary)',
          }}
        >
          Пожалуйста, <a href="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>войдите</a>, чтобы задать вопрос.
        </div>
      )}

      {/* Comments List */}
      {rootComments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
          Пока нет вопросов. Будьте первыми, кто спросит о проекте!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {rootComments.map((comment) => {
            const replies = repliesGrouped[comment.id] || [];
            const isReplyingThis = replyToId === comment.id;

            return (
              <div key={comment.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {/* Root Comment Card */}
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <Avatar name={comment.user?.name} url={comment.user?.avatarUrl} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {comment.user?.name || 'Пользователь'}
                      </span>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        <FormatDate dateString={comment.createdAt} />
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 'var(--text-sm)',
                        color: 'var(--text-secondary)',
                        marginTop: '0.25rem',
                        whiteSpace: 'pre-wrap',
                        lineHeight: 1.5,
                      }}
                    >
                      {renderContentWithMentions(comment.content)}
                    </div>

                    {/* Actions */}
                    {user && (
                      <div style={{ marginTop: '0.375rem' }}>
                        <button
                          onClick={() => {
                            if (isReplyingThis && !replyContent.startsWith('@')) {
                              setReplyToId(null);
                            } else {
                              handleStartReply(comment.id);
                            }
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

                {/* Replies Thread */}
                {replies.length > 0 && (
                  <div style={{ paddingLeft: '2.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {replies.map((reply) => (
                      <div key={reply.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                        <FiCornerDownRight size={14} style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }} />
                        <Avatar name={reply.user?.name} url={reply.user?.avatarUrl} size="sm" />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)' }}>
                              {reply.user?.name || 'Пользователь'}
                            </span>
                            <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                              <FormatDate dateString={reply.createdAt} />
                            </span>
                          </div>
                          <div
                            style={{
                              fontSize: 'var(--text-sm)',
                              color: 'var(--text-secondary)',
                              marginTop: '0.125rem',
                              whiteSpace: 'pre-wrap',
                              lineHeight: 1.4,
                            }}
                          >
                            {renderContentWithMentions(reply.content)}
                          </div>

                          {/* Actions for nested reply */}
                          {user && (
                            <div style={{ marginTop: '0.25rem' }}>
                              <button
                                onClick={() => handleStartReply(comment.id, reply.user?.name)}
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
                  </div>
                )}

                {/* Reply Form */}
                {isReplyingThis && (
                  <div style={{ paddingLeft: '2.5rem' }}>
                    <form
                      onSubmit={(e) => handlePostReply(e, comment.id)}
                      style={{
                        display: 'flex',
                        gap: '0.5rem',
                        alignItems: 'flex-start',
                        background: 'var(--surface-raised)',
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <textarea
                        ref={replyTextareaRef}
                        className="textarea"
                        placeholder="Ваш ответ..."
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        rows={1}
                        style={{ minHeight: '38px', padding: '0.375rem 0.625rem', flex: 1 }}
                        autoFocus
                      />
                      <div style={{ display: 'flex', gap: '0.25rem', alignSelf: 'stretch', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <button
                          type="button"
                          onClick={() => setReplyToId(null)}
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '0.375rem' }}
                          title="Отмена"
                        >
                          <FiX size={14} />
                        </button>
                        <button
                          type="submit"
                          disabled={postCommentMutation.isPending || !replyContent.trim()}
                          className="btn btn-primary btn-sm"
                          style={{ padding: '0.375rem' }}
                          title="Отправить ответ"
                        >
                          <FiSend size={12} />
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
