import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiHome, FiAlertCircle } from 'react-icons/fi';

function NotFoundPage() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - var(--header-height) - var(--bottom-nav-height))', padding: '2rem 1.5rem' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="bento-card"
        style={{
          maxWidth: '500px',
          width: '100%',
          padding: '3rem 2rem',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          boxShadow: 'var(--shadow-lg)'
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'var(--danger-bg)',
          color: 'var(--danger)',
          marginBottom: '1.5rem'
        }}>
          <FiAlertCircle size={32} />
        </div>

        <h1 style={{ fontSize: '4rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1, marginBottom: '0.5rem' }}>404</h1>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>Страница не найдена</h2>
        
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', lineHeight: 1.6, marginBottom: '2rem' }}>
          Упс! Кажется, этой страницы не существует, или она была перемещена по новому адресу. Проверьте правильность ссылки.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', width: '100%', justifyContent: 'center' }}>
          <Link to="/" className="btn btn-primary" style={{ gap: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '1' }}>
            <FiHome size={16} /> На главную
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default NotFoundPage;
