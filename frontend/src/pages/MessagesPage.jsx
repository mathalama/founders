import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiSend, FiArrowLeft, FiMessageCircle } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchWithAuth, API_BASE_URL } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useRealtime';
import EmptyState from '../components/EmptyState';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';

function MessagesPage() {
  const { id: otherUserId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const { sendJsonMessage } = useSocket();
  
  const [messageText, setMessageText] = useState('');
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const lastTypingSentRef = useRef(0);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const { data: conversations = [], isLoading: loadingConv } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const res = await fetchWithAuth('/api/messages');
      if (!res.ok) throw new Error('Failed to fetch conversations');
      return res.json();
    }
  });

  const { data: chatData, isLoading: loadingChat } = useQuery({
    queryKey: ['chat', otherUserId],
    enabled: !!otherUserId,
    queryFn: async () => {
      const conv = conversations.find(c => c.otherUserId === otherUserId);
      let otherUser = null;
      if (conv) {
        otherUser = { id: conv.otherUserId, name: conv.otherUserName, avatarUrl: conv.otherUserAvatar };
      } else {
        const uRes = await fetch(`${API_BASE_URL}/api/users/${otherUserId}`);
        if (uRes.ok) otherUser = await uRes.json();
      }

      const res = await fetchWithAuth(`/api/messages/${otherUserId}`);
      if (!res.ok) throw new Error('Failed to fetch chat history');
      const chatHistory = await res.json();
      
      scrollToBottom();
      return { otherUser, chatHistory: chatHistory || [] };
    }
  });

  const otherUser = chatData?.otherUser;
  const chatHistory = chatData?.chatHistory || [];

  const sendMessageMutation = useMutation({
    mutationFn: async (content) => {
      const res = await fetchWithAuth(`/api/messages/${otherUserId}`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error('Failed to send message');
      return res.json();
    },
    onSuccess: (newMsg) => {
      queryClient.setQueryData(['chat', otherUserId], (old) => {
        if (!old) return old;
        if (old.chatHistory.some(m => m.id === newMsg.id)) return old;
        return { ...old, chatHistory: [...old.chatHistory, newMsg] };
      });
      queryClient.invalidateQueries(['conversations']);
      setMessageText('');
      scrollToBottom();
    }
  });

  const sendMessage = (e) => {
    e.preventDefault();
    if (!messageText.trim() || !otherUserId) return;
    sendMessageMutation.mutate(messageText);
  };

  // Block status and mutations
  const { data: blockStatus, refetch: refetchBlockStatus } = useQuery({
    queryKey: ['blockStatus', otherUserId],
    enabled: !!otherUserId,
    queryFn: async () => {
      const res = await fetchWithAuth(`/api/users/block/status/${otherUserId}`);
      if (!res.ok) throw new Error('Failed to fetch block status');
      return res.json();
    }
  });

  const blockMutation = useMutation({
    mutationFn: async () => {
      const res = await fetchWithAuth(`/api/users/block/${otherUserId}`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to block user');
    },
    onSuccess: () => {
      refetchBlockStatus();
      queryClient.invalidateQueries(['conversations']);
    }
  });

  const unblockMutation = useMutation({
    mutationFn: async () => {
      const res = await fetchWithAuth(`/api/users/unblock/${otherUserId}`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to unblock user');
    },
    onSuccess: () => {
      refetchBlockStatus();
      queryClient.invalidateQueries(['conversations']);
    }
  });

  useEffect(() => {
    const handleNewMessage = (e) => {
      const msg = e.detail;
      // If message belongs to this conversation
      if (msg.senderId === otherUserId || msg.receiverId === otherUserId) {
        queryClient.setQueryData(['chat', otherUserId], (old) => {
          if (!old) return old;
          // Avoid duplicates
          if (old.chatHistory.some(m => m.id === msg.id)) return old;
          return { ...old, chatHistory: [...old.chatHistory, msg] };
        });
        scrollToBottom();
      }
      // Invalidate conversations list to update last message
      queryClient.invalidateQueries(['conversations']);
    };

    window.addEventListener('new_message', handleNewMessage);
    return () => window.removeEventListener('new_message', handleNewMessage);
  }, [otherUserId, queryClient]);

  useEffect(() => {
    setIsOtherUserTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    const handleTyping = (e) => {
      if (e.detail.senderId === otherUserId) {
        setIsOtherUserTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          setIsOtherUserTyping(false);
        }, 4000);
      }
    };

    window.addEventListener('user_typing', handleTyping);
    return () => {
      window.removeEventListener('user_typing', handleTyping);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [otherUserId]);

  const handleInputChange = (e) => {
    setMessageText(e.target.value);
    if (!otherUserId) return;
    const now = Date.now();
    if (now - lastTypingSentRef.current > 2000) {
      lastTypingSentRef.current = now;
      sendJsonMessage({
        action: 'typing',
        receiverId: otherUserId
      });
    }
  };

  // Mobile layout: show only list OR chat
  const isMobile = window.innerWidth <= 768;
  const showList = !isMobile || !otherUserId;
  const showChat = !isMobile || otherUserId;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      style={{ display: 'flex', height: 'calc(100vh - 4rem)', gap: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}
    >
      {/* Conversations List */}
      {showList && (
        <div className="bento-card" style={{ width: isMobile ? '100%' : '320px', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FiMessageCircle /> Сообщения
            </h2>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loadingConv ? (
              <div style={{ padding: '1rem' }}><div className="skeleton-card" /><div className="skeleton-card" /></div>
            ) : conversations.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                Нет активных диалогов
              </div>
            ) : (
              conversations.map(c => (
                <Link
                  key={c.otherUserId}
                  to={`/messages/${c.otherUserId}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem 1.25rem',
                    textDecoration: 'none',
                    borderBottom: '1px solid var(--border)',
                    background: otherUserId === c.otherUserId ? 'var(--surface-raised)' : 'transparent',
                  }}
                  className="hover-bg"
                >
                  <Avatar name={c.otherUserName} url={c.otherUserAvatar} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {c.otherUserName}
                      </span>
                      {c.unreadCount > 0 && <Badge type="accent">{c.unreadCount}</Badge>}
                    </div>
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.lastMessage}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      )}

      {/* Chat Area */}
      {showChat && (
        <div className="bento-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', height: '100%' }}>
          {!otherUserId ? (
            <EmptyState title="Выберите чат" description="Нажмите на диалог слева, чтобы начать общение." />
          ) : (
            <>
              {/* Chat Header */}
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {isMobile && (
                    <button className="btn btn-ghost btn-sm" onClick={() => navigate('/messages')} style={{ padding: '0.25rem' }}>
                      <FiArrowLeft size={20} />
                    </button>
                  )}
                  {otherUser && (
                    <>
                      <Avatar name={otherUser.name} url={otherUser.avatarUrl} size="sm" />
                      <Link to={`/user/${otherUser.id}`} style={{ fontWeight: 600, color: 'var(--text-primary)', textDecoration: 'none' }}>
                        {otherUser.name}
                      </Link>
                    </>
                  )}
                </div>

                {otherUser && blockStatus && (
                  <div>
                    {blockStatus.blockedByMe ? (
                      <button
                        onClick={() => unblockMutation.mutate()}
                        className="btn btn-outline btn-sm"
                        style={{ color: 'var(--success)', borderColor: 'var(--success)', padding: '0.25rem 0.75rem', fontSize: 'var(--text-xs)' }}
                      >
                        Разблокировать
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          if (window.confirm('Заблокировать этого пользователя? Вы больше не сможете обмениваться сообщениями.')) {
                            blockMutation.mutate();
                          }
                        }}
                        className="btn btn-outline btn-sm"
                        style={{ color: 'var(--danger)', borderColor: 'var(--danger)', padding: '0.25rem 0.75rem', fontSize: 'var(--text-xs)' }}
                      >
                        Заблокировать
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Messages History */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--bg-secondary)' }}>
                {loadingChat ? (
                  <div className="skeleton-text" />
                ) : chatHistory.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', margin: 'auto 0' }}>Напишите первое сообщение!</div>
                ) : (
                  chatHistory.map((msg, i) => {
                    const isMine = msg.senderId === currentUser.id;
                    const showDate = i === 0 || new Date(chatHistory[i-1].createdAt).toDateString() !== new Date(msg.createdAt).toDateString();
                    return (
                      <React.Fragment key={msg.id}>
                        {showDate && (
                          <div style={{ textAlign: 'center', margin: '1rem 0', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                            {new Date(msg.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
                          </div>
                        )}
                        <div style={{
                          alignSelf: isMine ? 'flex-end' : 'flex-start',
                          maxWidth: '75%',
                          padding: '0.75rem 1rem',
                          borderRadius: '1rem',
                          borderBottomRightRadius: isMine ? '0' : '1rem',
                          borderBottomLeftRadius: isMine ? '1rem' : '0',
                          background: isMine ? 'var(--primary)' : 'var(--surface)',
                          color: isMine ? 'var(--primary-content)' : 'var(--text-primary)',
                          boxShadow: 'var(--shadow-sm)',
                        }}>
                          <div style={{ lineHeight: 1.5, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                          <div style={{ fontSize: '10px', textAlign: 'right', marginTop: '4px', opacity: 0.7, color: isMine ? 'var(--primary-content)' : 'var(--text-muted)' }}>
                            {new Date(msg.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })
                )}
                {isOtherUserTyping && (
                  <div style={{
                    alignSelf: 'flex-start',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: 'var(--text-secondary)',
                    fontSize: 'var(--text-xs)',
                    padding: '0.5rem 1rem',
                    background: 'var(--surface)',
                    borderRadius: '1rem',
                    borderBottomLeftRadius: 0,
                    boxShadow: 'var(--shadow-sm)',
                    animation: 'fadeIn 0.2s ease-out'
                  }}>
                    <div className="typing-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    <span>печатает...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              {blockStatus?.blockedByMe || blockStatus?.blockedByThem ? (
                <div 
                  style={{ 
                    padding: '1.25rem', 
                    textAlign: 'center', 
                    fontSize: 'var(--text-sm)', 
                    color: 'var(--text-muted)', 
                    background: 'var(--surface-raised)',
                    borderTop: '1px solid var(--border)' 
                  }}
                >
                  {blockStatus.blockedByMe 
                    ? 'Вы заблокировали этого пользователя. Разблокируйте его для продолжения общения.' 
                    : 'Этот пользователь ограничил отправку сообщений.'}
                </div>
              ) : (
                <form onSubmit={sendMessage} style={{ padding: '1rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.5rem', background: 'var(--surface)' }}>
                  <input
                    type="text"
                    className="input"
                    style={{ flex: 1, borderRadius: '2rem', paddingLeft: '1rem' }}
                    placeholder="Написать сообщение..."
                    value={messageText}
                    onChange={handleInputChange}
                  />
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ borderRadius: '50%', width: '42px', height: '42px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    disabled={!messageText.trim() || sendMessageMutation.isPending}
                  >
                    <FiSend size={18} style={{ marginLeft: '-2px' }} />
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      )}
    </motion.div>
  );
}

export default MessagesPage;
