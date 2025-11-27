/**
 * Push Notifications & PWA Utils
 */

// VAPID public key для push-уведомлений (нужно сгенерировать свой)
const VAPID_PUBLIC_KEY = 'YOUR_VAPID_PUBLIC_KEY';

/**
 * Проверка поддержки Service Worker
 */
export function isServiceWorkerSupported() {
  return 'serviceWorker' in navigator;
}

/**
 * Проверка поддержки Push-уведомлений
 */
export function isPushSupported() {
  return 'PushManager' in window;
}

/**
 * Проверка поддержки уведомлений
 */
export function isNotificationSupported() {
  return 'Notification' in window;
}

/**
 * Регистрация Service Worker
 */
export async function registerServiceWorker() {
  if (!isServiceWorkerSupported()) {
    console.warn('Service Worker not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });
    
    console.log('✅ Service Worker registered:', registration.scope);
    
    // Проверяем обновления
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // Новая версия доступна
          console.log('🆕 New version available');
          dispatchEvent(new CustomEvent('sw-update-available', { detail: registration }));
        }
      });
    });
    
    return registration;
  } catch (error) {
    console.error('❌ Service Worker registration failed:', error);
    return null;
  }
}

/**
 * Запрос разрешения на уведомления
 */
export async function requestNotificationPermission() {
  if (!isNotificationSupported()) {
    console.warn('Notifications not supported');
    return 'unsupported';
  }

  const permission = await Notification.requestPermission();
  console.log('Notification permission:', permission);
  return permission;
}

/**
 * Получение текущего статуса разрешения
 */
export function getNotificationPermission() {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

/**
 * Подписка на Push-уведомления
 */
export async function subscribeToPush(registration) {
  if (!isPushSupported()) {
    console.warn('Push not supported');
    return null;
  }

  try {
    // Проверяем существующую подписку
    let subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      console.log('Already subscribed to push');
      return subscription;
    }

    // Создаём новую подписку
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });

    console.log('✅ Push subscription:', subscription);
    
    // Здесь нужно отправить subscription на сервер
    // await sendSubscriptionToServer(subscription);
    
    return subscription;
  } catch (error) {
    console.error('❌ Push subscription failed:', error);
    return null;
  }
}

/**
 * Отписка от Push-уведомлений
 */
export async function unsubscribeFromPush(registration) {
  try {
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      console.log('✅ Unsubscribed from push');
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Unsubscribe failed:', error);
    return false;
  }
}

/**
 * Показать локальное уведомление
 */
export async function showNotification(title, options = {}) {
  const permission = await requestNotificationPermission();
  
  if (permission !== 'granted') {
    console.warn('Notification permission not granted');
    return null;
  }

  const defaultOptions = {
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    vibrate: [100, 50, 100],
    tag: 'uniclub-local',
    renotify: false,
    requireInteraction: false,
    silent: false
  };

  // Используем Service Worker для показа уведомления
  const registration = await navigator.serviceWorker.ready;
  
  return registration.showNotification(title, {
    ...defaultOptions,
    ...options
  });
}

/**
 * Уведомление о новом мероприятии
 */
export function notifyNewEvent(event) {
  return showNotification('Новое мероприятие! 🎉', {
    body: `${event.title} — ${event.date}`,
    tag: `event-${event.id}`,
    data: { url: `/?tab=events&id=${event.id}` },
    actions: [
      { action: 'view', title: 'Посмотреть' },
      { action: 'dismiss', title: 'Позже' }
    ]
  });
}

/**
 * Уведомление о расписании
 */
export function notifySchedule(lesson) {
  return showNotification('Скоро занятие 📚', {
    body: `${lesson.subject} в ${lesson.room} через 15 минут`,
    tag: `schedule-${lesson.id}`,
    data: { url: '/?tab=schedule' },
    requireInteraction: true
  });
}

/**
 * Уведомление о клубе
 */
export function notifyClub(club, message) {
  return showNotification(`${club.name}`, {
    body: message,
    tag: `club-${club.id}`,
    data: { url: `/?tab=clubs&id=${club.id}` }
  });
}

/**
 * Напоминание о мероприятии
 */
export function notifyEventReminder(event, timeLeft) {
  return showNotification('Напоминание 🔔', {
    body: `"${event.title}" начнётся через ${timeLeft}`,
    tag: `reminder-${event.id}`,
    data: { url: `/?tab=events&id=${event.id}` },
    requireInteraction: true
  });
}

// === PWA INSTALL ===

let deferredPrompt = null;

/**
 * Инициализация PWA install prompt
 */
export function initInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    console.log('📱 Install prompt ready');
    dispatchEvent(new CustomEvent('pwa-install-available'));
  });

  window.addEventListener('appinstalled', () => {
    console.log('✅ App installed');
    deferredPrompt = null;
    dispatchEvent(new CustomEvent('pwa-installed'));
  });
}

/**
 * Проверка возможности установки
 */
export function canInstall() {
  return deferredPrompt !== null;
}

/**
 * Проверка, установлено ли приложение
 */
export function isInstalled() {
  // iOS
  if (window.navigator.standalone) return true;
  
  // Android / Desktop
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  
  return false;
}

/**
 * Показать промпт установки
 */
export async function showInstallPrompt() {
  if (!deferredPrompt) {
    console.warn('Install prompt not available');
    return false;
  }

  deferredPrompt.prompt();
  
  const { outcome } = await deferredPrompt.userChoice;
  console.log('Install prompt outcome:', outcome);
  
  deferredPrompt = null;
  
  return outcome === 'accepted';
}

/**
 * Получить инструкции по установке для iOS
 */
export function getIOSInstallInstructions() {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
  
  if (isIOS && isSafari) {
    return {
      supported: true,
      steps: [
        'Нажмите кнопку "Поделиться" внизу экрана',
        'Прокрутите вниз и нажмите "На экран Домой"',
        'Нажмите "Добавить" в правом верхнем углу'
      ]
    };
  }
  
  return { supported: false, steps: [] };
}

// === HELPERS ===

/**
 * Конвертация VAPID ключа
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Проверка поддержки всех PWA функций
 */
export function getPWACapabilities() {
  return {
    serviceWorker: isServiceWorkerSupported(),
    push: isPushSupported(),
    notifications: isNotificationSupported(),
    installed: isInstalled(),
    canInstall: canInstall()
  };
}
