/**
 * PWA & Notifications Components
 */
import React, { useState, useEffect } from 'react';
import { haptic } from '../utils/haptic';
import {
  registerServiceWorker,
  requestNotificationPermission,
  getNotificationPermission,
  showNotification,
  canInstall,
  isInstalled,
  showInstallPrompt,
  initInstallPrompt,
  getIOSInstallInstructions,
  getPWACapabilities
} from '../utils/pwa';
import { BellIcon, CheckIcon, CloseIcon } from './Icons';

/**
 * PWA Install Banner - показывается когда можно установить приложение
 */
export function InstallBanner({ onDismiss }) {
  const [canShow, setCanShow] = useState(false);
  const [iosInstructions, setIosInstructions] = useState(null);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    // Инициализируем PWA
    initInstallPrompt();
    registerServiceWorker();

    // Проверяем возможность установки
    const checkInstall = () => {
      if (isInstalled()) {
        setCanShow(false);
        return;
      }

      const ios = getIOSInstallInstructions();
      if (ios.supported) {
        setIosInstructions(ios);
        setCanShow(true);
      } else if (canInstall()) {
        setCanShow(true);
      }
    };

    checkInstall();

    // Слушаем событие готовности установки
    const handleInstallAvailable = () => setCanShow(true);
    window.addEventListener('pwa-install-available', handleInstallAvailable);

    return () => {
      window.removeEventListener('pwa-install-available', handleInstallAvailable);
    };
  }, []);

  const handleInstall = async () => {
    haptic.medium();

    if (iosInstructions) {
      setShowIOSModal(true);
      return;
    }

    const installed = await showInstallPrompt();
    if (installed) {
      setCanShow(false);
      onDismiss && onDismiss();
    }
  };

  const handleDismiss = () => {
    haptic.light();
    setCanShow(false);
    localStorage.setItem('pwa_banner_dismissed', Date.now().toString());
    onDismiss && onDismiss();
  };

  // Проверяем, не отклонял ли пользователь баннер недавно
  useEffect(() => {
    const dismissed = localStorage.getItem('pwa_banner_dismissed');
    if (dismissed) {
      const daysSinceDismiss = (Date.now() - parseInt(dismissed)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismiss < 7) {
        setCanShow(false);
      }
    }
  }, []);

  if (!canShow) return null;

  return (
    <>
      <div className="install-banner">
        <div className="install-banner-content">
          <div className="install-banner-icon">📱</div>
          <div className="install-banner-text">
            <strong>Установить UniClub</strong>
            <span>Быстрый доступ с главного экрана</span>
          </div>
        </div>
        <div className="install-banner-actions">
          <button className="install-banner-btn primary" onClick={handleInstall}>
            Установить
          </button>
          <button className="install-banner-btn dismiss" onClick={handleDismiss}>
            <CloseIcon size={16} />
          </button>
        </div>
      </div>

      {/* iOS Instructions Modal */}
      {showIOSModal && iosInstructions && (
        <div className="ios-modal-overlay" onClick={() => setShowIOSModal(false)}>
          <div className="ios-modal" onClick={e => e.stopPropagation()}>
            <div className="ios-modal-header">
              <h3>Установка на iPhone</h3>
              <button onClick={() => setShowIOSModal(false)}>
                <CloseIcon size={20} />
              </button>
            </div>
            <div className="ios-modal-content">
              {iosInstructions.steps.map((step, i) => (
                <div key={i} className="ios-step">
                  <span className="ios-step-number">{i + 1}</span>
                  <span className="ios-step-text">{step}</span>
                </div>
              ))}
            </div>
            <button 
              className="ios-modal-btn"
              onClick={() => setShowIOSModal(false)}
            >
              Понятно
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Notification Permission Request
 */
export function NotificationPermissionCard({ onPermissionChange }) {
  const [permission, setPermission] = useState('default');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setPermission(getNotificationPermission());
  }, []);

  const handleRequest = async () => {
    setLoading(true);
    haptic.medium();

    const result = await requestNotificationPermission();
    setPermission(result);
    onPermissionChange && onPermissionChange(result);

    if (result === 'granted') {
      // Показываем тестовое уведомление
      await showNotification('Уведомления включены! 🎉', {
        body: 'Теперь вы будете получать важные оповещения',
        tag: 'permission-granted'
      });
    }

    setLoading(false);
  };

  if (permission === 'granted') {
    return (
      <div className="notification-card granted">
        <div className="notification-card-icon">
          <CheckIcon size={24} />
        </div>
        <div className="notification-card-text">
          <strong>Уведомления включены</strong>
          <span>Вы будете получать оповещения о мероприятиях</span>
        </div>
      </div>
    );
  }

  if (permission === 'denied') {
    return (
      <div className="notification-card denied">
        <div className="notification-card-icon">
          <BellIcon size={24} />
        </div>
        <div className="notification-card-text">
          <strong>Уведомления заблокированы</strong>
          <span>Разрешите уведомления в настройках браузера</span>
        </div>
      </div>
    );
  }

  return (
    <div className="notification-card">
      <div className="notification-card-icon">
        <BellIcon size={24} />
      </div>
      <div className="notification-card-text">
        <strong>Включить уведомления?</strong>
        <span>Получайте оповещения о мероприятиях и расписании</span>
      </div>
      <button 
        className="notification-card-btn"
        onClick={handleRequest}
        disabled={loading}
      >
        {loading ? 'Запрос...' : 'Включить'}
      </button>
    </div>
  );
}

/**
 * Update Available Banner
 */
export function UpdateBanner() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [registration, setRegistration] = useState(null);

  useEffect(() => {
    const handleUpdate = (e) => {
      setRegistration(e.detail);
      setShowUpdate(true);
    };

    window.addEventListener('sw-update-available', handleUpdate);
    return () => window.removeEventListener('sw-update-available', handleUpdate);
  }, []);

  const handleUpdate = () => {
    haptic.medium();
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    window.location.reload();
  };

  if (!showUpdate) return null;

  return (
    <div className="update-banner">
      <span>🆕 Доступна новая версия</span>
      <button onClick={handleUpdate}>Обновить</button>
    </div>
  );
}

/**
 * PWA Status Debug (для разработки)
 */
export function PWAStatus() {
  const [capabilities, setCapabilities] = useState({});

  useEffect(() => {
    setCapabilities(getPWACapabilities());
  }, []);

  return (
    <div className="pwa-status">
      <h4>PWA Status</h4>
      <ul>
        <li>Service Worker: {capabilities.serviceWorker ? '✅' : '❌'}</li>
        <li>Push: {capabilities.push ? '✅' : '❌'}</li>
        <li>Notifications: {capabilities.notifications ? '✅' : '❌'}</li>
        <li>Installed: {capabilities.installed ? '✅' : '❌'}</li>
        <li>Can Install: {capabilities.canInstall ? '✅' : '❌'}</li>
      </ul>
    </div>
  );
}

export default InstallBanner;
