import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

function EmptyState({ title, description, actionText, actionTo, actionOnClick, icon }) {
  return (
    <motion.div 
      className="empty-state" 
      style={{ gridColumn: '1 / -1' }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div style={{ marginBottom: '1rem', color: 'var(--accent)', opacity: 0.8 }}>
        {icon || (
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="20" y="30" width="80" height="60" rx="8" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
            <circle cx="60" cy="60" r="12" fill="currentColor" fillOpacity="0.2" />
            <path d="M56 60L64 60M60 56L60 64" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M40 80L80 80" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )}
      </div>
      <h3 style={{ fontSize: 'var(--text-xl)', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
        {title}
      </h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', maxWidth: '350px', marginBottom: '1.5rem', lineHeight: 1.6 }}>
        {description}
      </p>
      {actionText && actionTo && (
        <Link to={actionTo} className="btn btn-primary">
          {actionText}
        </Link>
      )}
      {actionText && actionOnClick && (
        <button className="btn btn-outline" onClick={actionOnClick}>
          {actionText}
        </button>
      )}
    </motion.div>
  );
}

export default EmptyState;
