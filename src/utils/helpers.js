/**
 * Helpers — Оптимизированные с мемоизацией
 */

// Кэш для форматированных дат
const dateCache = new Map();
const DATE_CACHE_MAX = 100;

export function formatDate(dateString) {
  if (!dateString) return '';
  
  // Проверяем кэш
  if (dateCache.has(dateString)) return dateCache.get(dateString);
  
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today.getTime() + 86400000);
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  const timeStr = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  
  let result;
  if (dateOnly.getTime() === today.getTime()) {
    result = `Сегодня, ${timeStr}`;
  } else if (dateOnly.getTime() === tomorrow.getTime()) {
    result = `Завтра, ${timeStr}`;
  } else {
    result = date.toLocaleDateString('ru-RU', { 
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  }
  
  // Сохраняем в кэш
  if (dateCache.size >= DATE_CACHE_MAX) {
    const firstKey = dateCache.keys().next().value;
    dateCache.delete(firstKey);
  }
  dateCache.set(dateString, result);
  
  return result;
}

export function getRoleName(role) {
  const names = { main_admin: 'Администратор', club_admin: 'Админ клуба', group_leader: 'Староста', student: 'Студент' };
  return names[role] || 'Пользователь';
}

export function getRoleShortName(role) {
  const names = { main_admin: 'Админ', club_admin: 'Клуб', group_leader: 'Староста', student: 'Студент' };
  return names[role] || 'Юзер';
}

export function getMembersText(count) {
  if (!count) return '0 участников';
  const l1 = count % 10, l2 = count % 100;
  if (l2 >= 11 && l2 <= 19) return `${count} участников`;
  if (l1 === 1) return `${count} участник`;
  if (l1 >= 2 && l1 <= 4) return `${count} участника`;
  return `${count} участников`;
}

export function getInitials(fullName) {
  if (!fullName) return '??';
  const parts = fullName.trim().split(' ').filter(Boolean);
  if (!parts.length) return '??';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function getLessonTypeName(type) {
  const types = { lecture: 'Лекция', practice: 'Практика', lab: 'Лабораторная', seminar: 'Семинар' };
  return types[type] || type;
}

export function getWeekTypeName(type) {
  const types = { all: 'Каждую неделю', odd: 'Нечётная', even: 'Чётная' };
  return types[type] || type;
}

// Оптимизированный debounce
export function debounce(func, wait = 300) {
  let timeout;
  const debounced = (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
  debounced.cancel = () => clearTimeout(timeout);
  return debounced;
}

// Оптимизированный throttle с RAF
export function throttle(func, limit = 16) {
  let waiting = false;
  let lastArgs = null;
  
  return (...args) => {
    if (waiting) {
      lastArgs = args;
      return;
    }
    
    func(...args);
    waiting = true;
    
    requestAnimationFrame(() => {
      waiting = false;
      if (lastArgs) {
        func(...lastArgs);
        lastArgs = null;
      }
    });
  };
}
