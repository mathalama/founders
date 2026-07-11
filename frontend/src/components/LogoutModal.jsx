import React from 'react';
import { FiLogOut } from 'react-icons/fi';
import Modal from './ui/Modal';

export default function LogoutModal({ isOpen, onClose, onConfirm }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="400px">
      <div style={{ textAlign: 'center' }}>
        <div style={{ marginBottom: '1rem', color: 'var(--danger)' }}>
          <FiLogOut size={42} style={{ margin: '0 auto' }} />
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
    </Modal>
  );
}
