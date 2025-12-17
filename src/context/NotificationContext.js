/**
 * NotificationContext — Оптимизированный
 */
import React, { createContext, useContext, useState, useCallback, useMemo, memo } from 'react';
import { haptic } from '../utils/haptic';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const addNotification = useCallback((notification) => {
    const id = Date.now();
    const newNotif = { id, type: 'info', duration: 3000, ...notification };

    if (newNotif.type === 'success') haptic.success();
    else if (newNotif.type === 'error') haptic.error();

    setNotifications(prev => [...prev.slice(-4), newNotif]); // Максимум 5 уведомлений

    if (newNotif.duration > 0) {
      setTimeout(() => removeNotification(id), newNotif.duration);
    }
    return id;
  }, [removeNotification]);

  const notify = useMemo(() => ({
    success: (message, title) => addNotification({ type: 'success', message, title }),
    error: (message, title) => addNotification({ type: 'error', message, title }),
    info: (message, title) => addNotification({ type: 'info', message, title }),
  }), [addNotification]);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      {notifications.length > 0 && (
        <NotificationContainer notifications={notifications} onRemove={removeNotification} />
      )}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotification must be used within NotificationProvider');
  return context;
}

const NotificationContainer = memo(function NotificationContainer({ notifications, onRemove }) {
  return (
    <div className="notification-container">
      {notifications.map(n => (
        <NotificationItem key={n.id} notification={n} onRemove={onRemove} />
      ))}
    </div>
  );
});

const ICONS = { success: '✓', error: '✕', info: 'ℹ' };

const NotificationItem = memo(function NotificationItem({ notification, onRemove }) {
  return (
    <div 
      className={`notification notification-${notification.type}`} 
      onClick={() => onRemove(notification.id)}
    >
      <div className="notification-icon">{ICONS[notification.type]}</div>
      <div className="notification-content">
        {notification.title && <div className="notification-title">{notification.title}</div>}
        <div className="notification-message">{notification.message}</div>
      </div>
    </div>
  );
});

export default NotificationProvider;
