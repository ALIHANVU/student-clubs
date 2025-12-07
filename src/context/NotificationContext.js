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
    const newNotification = { id, type: 'info', duration: 3000, ...notification };

    if (newNotification.type === 'success') haptic.success();
    else if (newNotification.type === 'error') haptic.error();

    setNotifications(prev => [...prev, newNotification]);

    if (newNotification.duration > 0) {
      setTimeout(() => removeNotification(id), newNotification.duration);
    }

    return id;
  }, [removeNotification]);

  const notify = useMemo(() => ({
    success: (message, title) => addNotification({ type: 'success', message, title }),
    error: (message, title) => addNotification({ type: 'error', message, title }),
    info: (message, title) => addNotification({ type: 'info', message, title }),
  }), [addNotification]);

  const value = useMemo(() => ({ notifications, notify, removeNotification }), [notifications, notify, removeNotification]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer notifications={notifications} onRemove={removeNotification} />
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotification must be used within NotificationProvider');
  return context;
}

// Мемоизированный контейнер
const NotificationContainer = memo(function NotificationContainer({ notifications, onRemove }) {
  if (notifications.length === 0) return null;

  return (
    <div className="notification-container">
      {notifications.map((n) => (
        <NotificationItem key={n.id} notification={n} onRemove={onRemove} />
      ))}
    </div>
  );
});

const icons = { success: '✓', error: '✕', info: 'ℹ' };

const NotificationItem = memo(function NotificationItem({ notification, onRemove }) {
  return (
    <div className={`notification notification-${notification.type}`} onClick={() => onRemove(notification.id)}>
      <div className="notification-icon">{icons[notification.type]}</div>
      <div className="notification-content">
        {notification.title && <div className="notification-title">{notification.title}</div>}
        <div className="notification-message">{notification.message}</div>
      </div>
    </div>
  );
});

export default NotificationProvider;
