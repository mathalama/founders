import React, { useEffect, useState } from 'react';
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX } from 'react-icons/fi';

const icons = {
  success: <FiCheckCircle size={18} />,
  error:   <FiAlertCircle size={18} />,
  info:    <FiInfo size={18} />,
};

const colors = {
  success: { bg: '#ecfdf5', border: '#10b981', text: '#065f46', icon: '#10b981' },
  error:   { bg: '#fef2f2', border: '#ef4444', text: '#7f1d1d', icon: '#ef4444' },
  info:    { bg: '#eef2ff', border: '#6366f1', text: '#312e81', icon: '#6366f1' },
};

function Toast({ message, type = 'success', onClose }) {
  const [leaving, setLeaving] = useState(false);
  const c = colors[type] || colors.info;

  const handleClose = () => {
    setLeaving(true);
    setTimeout(onClose, 260);
  };

  useEffect(() => {
    const t = setTimeout(handleClose, 3200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.625rem',
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderRadius: '10px',
        padding: '0.75rem 1rem',
        minWidth: '280px',
        maxWidth: '360px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        pointerEvents: 'auto',
        animation: leaving
          ? 'slideOutRight 0.26s ease forwards'
          : 'slideInRight 0.28s cubic-bezier(0.34,1.56,0.64,1) both',
        cursor: 'default',
      }}
    >
      <span style={{ color: c.icon, marginTop: '1px', flexShrink: 0 }}>
        {icons[type]}
      </span>
      <span style={{ flex: 1, fontSize: '0.875rem', color: c.text, lineHeight: 1.5, fontWeight: 500 }}>
        {message}
      </span>
      <button
        onClick={handleClose}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: c.icon,
          padding: '1px',
          opacity: 0.6,
          flexShrink: 0,
          marginTop: '1px',
        }}
      >
        <FiX size={14} />
      </button>
    </div>
  );
}

export default Toast;
