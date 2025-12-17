/**
 * Helpers — Полный набор утилит
 */

// ========== ФОРМАТИРОВАНИЕ ==========

/**
 * Форматирование даты в читаемый вид
 */
export function formatDate(dateString) {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  const timeStr = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  
  if (dateOnly.getTime() === today.getTime()) {
    return `Сегодня, ${timeStr}`;
  }
  
  if (dateOnly.getTime() === tomorrow.getTime()) {
    return `Завтра, ${timeStr}`;
  }
  
  return date.toLocaleDateString('ru-RU', { 
    day: 'numeric', 
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Получить название роли
 */
export function getRoleName(role) {
  const names = {
    main_admin: 'Администратор',
    club_admin: 'Админ клуба',
    group_leader: 'Староста',
    student: 'Студент'
  };
  return names[role] || 'Пользователь';
}

/**
 * Получить короткое название роли
 */
export function getRoleShortName(role) {
  const names = {
    main_admin: 'Админ',
    club_admin: 'Клуб',
    group_leader: 'Староста',
    student: 'Студент'
  };
  return names[role] || 'Юзер';
}

/**
 * Текст для количества участников
 */
export function getMembersText(count) {
  if (!count || count === 0) return '0 участников';
  
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;
  
  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
    return `${count} участников`;
  }
  
  if (lastDigit === 1) {
    return `${count} участник`;
  }
  
  if (lastDigit >= 2 && lastDigit <= 4) {
    return `${count} участника`;
  }
  
  return `${count} участников`;
}

/**
 * Получить инициалы из имени
 */
export function getInitials(fullName) {
  if (!fullName) return '??';
  
  const parts = fullName.trim().split(' ').filter(Boolean);
  
  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
}

/**
 * Получить название типа занятия
 */
export function getLessonTypeName(type) {
  const types = {
    lecture: 'Лекция',
    practice: 'Практика',
    lab: 'Лабораторная',
    seminar: 'Семинар'
  };
  return types[type] || type;
}

/**
 * Получить название типа недели
 */
export function getWeekTypeName(type) {
  const types = {
    all: 'Каждую неделю',
    odd: 'Нечётная',
    even: 'Чётная'
  };
  return types[type] || type;
}

// ========== ОПТИМИЗАЦИЯ ==========

/**
 * Debounce — задержка выполнения функции
 */
export function debounce(func, wait = 300) {
  let timeout;
  
  const debounced = function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
  
  debounced.cancel = function() {
    clearTimeout(timeout);
  };
  
  return debounced;
}

/**
 * Throttle — ограничение частоты вызовов
 */
export function throttle(func, limit = 100) {
  let inThrottle;
  
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * RequestAnimationFrame throttle — для плавных анимаций
 */
export function rafThrottle(callback) {
  let requestId = null;
  let lastArgs = null;
  
  const later = (context) => () => {
    requestId = null;
    callback.apply(context, lastArgs);
  };
  
  const throttled = function(...args) {
    lastArgs = args;
    if (requestId === null) {
      requestId = requestAnimationFrame(later(this));
    }
  };
  
  throttled.cancel = () => {
    if (requestId !== null) {
      cancelAnimationFrame(requestId);
      requestId = null;
    }
  };
  
  return throttled;
}

/**
 * Мемоизация функций
 */
export function memoize(fn) {
  const cache = new Map();
  
  return function(...args) {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn.apply(this, args);
    cache.set(key, result);
    
    // Ограничиваем размер кэша
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    
    return result;
  };
}
