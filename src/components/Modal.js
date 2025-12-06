import React, { useEffect, useCallback, memo } from 'react';
import { Button } from './UI';
import { haptic } from '../utils/haptic';

export const Modal = memo(function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer,
  showFooter = true,
  bottomSheet = true 
}) {
  const handleClose = useCallback(() => {
    haptic.light();
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      haptic.medium();
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div 
        className={`modal ${bottomSheet ? 'bottom-sheet' : ''}`} 
        onClick={(e) => e.stopPropagation()}
      >
        {bottomSheet && <div className="modal-handle" />}
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={handleClose}>×</button>
        </div>
        <div className="modal-body">{children}</div>
        {showFooter && footer && (
          <div className="modal-footer">{footer}</div>
        )}
      </div>
    </div>
  );
});

export const ConfirmModal = memo(function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Подтверждение',
  message,
  confirmText = 'Подтвердить',
  cancelText = 'Отмена',
  variant = 'danger'
}) {
  const handleConfirm = useCallback(() => {
    haptic.medium();
    onConfirm();
  }, [onConfirm]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-icon">
          {variant === 'danger' ? '⚠️' : 'ℹ️'}
        </div>
        <h3 className="confirm-title">{title}</h3>
        <p className="confirm-message">{message}</p>
        <div className="confirm-actions">
          <Button variant="secondary" onClick={onClose} fullWidth>{cancelText}</Button>
          <Button variant={variant} onClick={handleConfirm} fullWidth>{confirmText}</Button>
        </div>
      </div>
    </div>
  );
});

export default Modal;
