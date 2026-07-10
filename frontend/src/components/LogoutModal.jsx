import React from 'react';
import { FiLogOut, FiX } from 'react-icons/fi';

export default function LogoutModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '-20px', position: 'relative', zIndex: 1 }}>
          <button className="btn btn-ghost btn-icon" onClick={onClose} style={{ padding: '4px' }}>
            <FiX size={20} />
          </button>
        </div>
        <div style={{ marginBottom: '1rem', color: 'var(--danger)' }}>
          <FiLogOut size={42} />
        </div>
        <h3 style={{ marginBottom: '0.75rem' }}>Выход из аккаунта</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.75rem', fontSize: 'var(--text-sm)' }}>
          Вы уверены, что хотите выйти?
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button className="btn btn-outline" onClick={onClose} style={{ flex: 1 }}>
            Отмена
          </button>
          <button className="btn btn-danger" onClick={onConfirm} style={{ flex: 1 }}>
            Выйти
          </button>
        </div>
      </div>
    </div>
  );
}
