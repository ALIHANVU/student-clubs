/**
 * Utility functions
 */

export function formatDate(dateString) {
  if (!dateString) return 'Дата не указана';
  
  const date = new Date(dateString);
  const now = new Date();
  const diff = date - now;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return 'Сегодня';
  if (days === 1) return 'Завтра';
  if (days === -1) return 'Вчера';
  
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function getRoleName(role) {
  const names = {
    main_admin: 'Администратор',
    club_admin: 'Админ клуба',
    group_leader: 'Староста',
    student: 'Студент'
  };
  return names[role] || role;
}

export function getRoleShortName(role) {
  const names = {
    main_admin: 'Админ',
    club_admin: 'Клуб',
    group_leader: 'Староста',
    student: 'Студент'
  };
  return names[role] || role;
}

export function getInitials(fullName) {
  if (!fullName) return '??';
  return fullName
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function pluralize(count, forms) {
  const cases = [2, 0, 1, 1, 1, 2];
  const index = (count % 100 > 4 && count % 100 < 20) 
    ? 2 
    : cases[Math.min(count % 10, 5)];
  return forms[index];
}

export function getMembersText(count) {
  return `${count} ${pluralize(count, ['участник', 'участника', 'участников'])}`;
}

export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

// Форматирование времени
export function formatTime(timeString) {
  if (!timeString) return '';
  return timeString.slice(0, 5);
}

// Получить тип занятия
export function getLessonTypeLabel(type) {
  const types = {
    lecture: 'Лекция',
    practice: 'Практика',
    lab: 'Лабораторная',
    seminar: 'Семинар'
  };
  return types[type] || type;
}

export function getLessonTypeIcon(type) {
  const icons = {
    lecture: '📖',
    practice: '✏️',
    lab: '🔬',
    seminar: '💬'
  };
  return icons[type] || '📚';
}
