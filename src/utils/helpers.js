/**
 * Helpers — Оптимизированные
 */

// Кэш для форматированных дат
const dateCache = new Map();

export function formatDate(dateString) {
  if (!dateString) return 'Дата не указана';
  
  // Проверяем кэш
  if (dateCache.has(dateString)) {
    return dateCache.get(dateString);
  }
  
  const date = new Date(dateString);
  const now = new Date();
  const diff = Math.floor((date - now) / (1000 * 60 * 60 * 24));
  
  let result;
  if (diff === 0) result = 'Сегодня';
  else if (diff === 1) result = 'Завтра';
  else if (diff === -1) result = 'Вчера';
  else {
    result = date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  // Ограничиваем размер кэша
  if (dateCache.size > 100) {
    const firstKey = dateCache.keys().next().value;
    dateCache.delete(firstKey);
  }
  
  dateCache.set(dateString, result);
  return result;
}

const roleNames = {
  main_admin: 'Администратор',
  club_admin: 'Админ клуба',
  group_leader: 'Староста',
  student: 'Студент'
};

const roleShortNames = {
  main_admin: 'Админ',
  club_admin: 'Клуб',
  group_leader: 'Староста',
  student: 'Студент'
};

export const getRoleName = (role) => roleNames[role] || role;
export const getRoleShortName = (role) => roleShortNames[role] || role;

// Кэш для инициалов
const initialsCache = new Map();

export function getInitials(fullName) {
  if (!fullName) return '??';
  
  if (initialsCache.has(fullName)) {
    return initialsCache.get(fullName);
  }
  
  const result = fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  
  if (initialsCache.size > 50) {
    const firstKey = initialsCache.keys().next().value;
    initialsCache.delete(firstKey);
  }
  
  initialsCache.set(fullName, result);
  return result;
}

export function getMembersText(count) {
  const cases = [2, 0, 1, 1, 1, 2];
  const forms = ['участник', 'участника', 'участников'];
  const index = (count % 100 > 4 && count % 100 < 20) ? 2 : cases[Math.min(count % 10, 5)];
  return `${count} ${forms[index]}`;
}

export const formatTime = (timeString) => timeString ? timeString.slice(0, 5) : '';

const lessonTypeLabels = {
  lecture: 'Лекция',
  practice: 'Практика',
  lab: 'Лабораторная',
  seminar: 'Семинар'
};

const lessonTypeIcons = {
  lecture: '📖',
  practice: '✏️',
  lab: '🔬',
  seminar: '💬'
};

export const getLessonTypeLabel = (type) => lessonTypeLabels[type] || type;
export const getLessonTypeIcon = (type) => lessonTypeIcons[type] || '📚';

// Debounce с cleanup
export function debounce(func, wait) {
  let timeout;
  const debounced = (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
  debounced.cancel = () => clearTimeout(timeout);
  return debounced;
}
