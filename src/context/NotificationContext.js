import React, { createContext, useContext, useState, useCallback } from 'react';
import { haptic } from '../utils/haptic';

const NotificationContext = createContext(null);

/**
 * Notification Provider
 */
export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((notification) => {
    const id = Date.now();
    const newNotification = {
      id,
      type: 'info',
      duration: 3000,
      ...notification
    };

    // Haptic feedback
    if (newNotification.type === 'success') haptic.success();
    else if (newNotification.type === 'error') haptic.error();
    else haptic.light();

    setNotifications(prev => [...prev, newNotification]);

    // Auto remove
    if (newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const notify = {
    success: (message, title) => addNotification({ type: 'success', message, title }),
    error: (message, title) => addNotification({ type: 'error', message, title }),
    warning: (message, title) => addNotification({ type: 'warning', message, title }),
    info: (message, title) => addNotification({ type: 'info', message, title }),
  };

  return (
    <NotificationContext.Provider value={{ notifications, notify, removeNotification }}>
      {children}
      <NotificationContainer notifications={notifications} onRemove={removeNotification} />
    </NotificationContext.Provider>
  );
}

/**
 * Hook to use notifications
 */
export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
}

/**
 * Notification Container Component
 */
function NotificationContainer({ notifications, onRemove }) {
  if (notifications.length === 0) return null;

  return (
    <div className="notification-container">
      {notifications.map((notification) => (
        <NotificationItem 
          key={notification.id} 
          notification={notification} 
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}

/**
 * Single Notification Item
 */
function NotificationItem({ notification, onRemove }) {
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };

  return (
    <div 
      className={`notification notification-${notification.type}`}
      onClick={() => onRemove(notification.id)}
    >
      <div className="notification-icon">{icons[notification.type]}</div>
      <div className="notification-content">
        {notification.title && (
          <div className="notification-title">{notification.title}</div>
        )}
        <div className="notification-message">{notification.message}</div>
      </div>
    </div>
  );
}

export default NotificationProvider;
