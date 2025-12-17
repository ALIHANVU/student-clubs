/**
 * Modal — Оптимизированный
 */
import React, { memo, useCallback, useEffect } from 'react';
import { haptic } from '../utils/haptic';
import { IconX, IconAlertCircle, IconCheckCircle } from './Icons';

export const Modal = memo(function Modal({ isOpen, onClose, title, children, footer, size = 'default' }) {
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => { if (e.key === 'Escape' && isOpen) onClose(); };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleOverlay = useCallback((e) => {
    if (e.target === e.currentTarget) { haptic.light(); onClose(); }
  }, [onClose]);

  const handleClose = useCallback(() => { haptic.light(); onClose(); }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleOverlay}>
      <div className={`modal modal-${size}`}>
        <div className="modal-handle" />
        <header className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close" onClick={handleClose}><IconX size={18} /></button>
        </header>
        <div className="modal-body">{children}</div>
        {footer && <footer className="modal-footer">{footer}</footer>}
      </div>
    </div>
  );
});

export const ConfirmModal = memo(function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'Подтвердить', cancelText = 'Отмена', variant = 'danger' }) {
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleConfirm = useCallback(() => { haptic.medium(); onConfirm(); }, [onConfirm]);
  const handleCancel = useCallback(() => { haptic.light(); onClose(); }, [onClose]);

  if (!isOpen) return null;

  const Icon = variant === 'danger' ? IconAlertCircle : IconCheckCircle;
  const iconColor = variant === 'danger' ? 'var(--red)' : 'var(--green)';

  return (
    <div className="modal-overlay" style={{ alignItems: 'center' }}>
      <div className="confirm-modal">
        <div className="confirm-icon"><Icon size={48} color={iconColor} /></div>
        <h3 className="confirm-title">{title}</h3>
        <p className="confirm-message">{message}</p>
        <div className="confirm-actions">
          <button className={`btn btn-full ${variant === 'danger' ? 'btn-danger' : 'btn-primary'}`} onClick={handleConfirm}>{confirmText}</button>
          <button className="btn btn-secondary btn-full" onClick={handleCancel}>{cancelText}</button>
        </div>
      </div>
    </div>
  );
});
