/**
 * App constants and configuration
 */

// Navigation items by role
export const NAV_ITEMS = {
  main_admin: [
    { id: 'dashboard', icon: '📊', label: 'Дашборд' },
    { id: 'clubs', icon: '🎭', label: 'Клубы' },
    { id: 'events', icon: '📅', label: 'Мероприятия' },
    { id: 'schedule', icon: '📚', label: 'Расписание' },
    { id: 'faculties', icon: '🏛️', label: 'Факультеты' },
    { id: 'groups', icon: '👥', label: 'Группы' },
    { id: 'users', icon: '👤', label: 'Пользователи' },
  ],
  club_admin: [
    { id: 'dashboard', icon: '📊', label: 'Обзор' },
    { id: 'clubs', icon: '🎭', label: 'Мой клуб' },
    { id: 'events', icon: '📅', label: 'Мероприятия' },
    { id: 'members', icon: '👥', label: 'Участники' },
  ],
  group_leader: [
    { id: 'dashboard', icon: '📊', label: 'Обзор' },
    { id: 'schedule', icon: '📚', label: 'Расписание' },
    { id: 'students', icon: '👥', label: 'Студенты' },
  ],
  student: [
    { id: 'dashboard', icon: '🏠', label: 'Главная' },
    { id: 'clubs', icon: '🎭', label: 'Клубы' },
    { id: 'events', icon: '📅', label: 'Мероприятия' },
    { id: 'schedule', icon: '📚', label: 'Расписание' },
  ]
};

// Mobile tab bar items by role
export const TAB_BAR_ITEMS = {
  main_admin: [
    { id: 'dashboard', icon: '📊', label: 'Главная' },
    { id: 'clubs', icon: '🎭', label: 'Клубы' },
    { id: 'events', icon: '📅', label: 'События' },
    { id: 'users', icon: '👤', label: 'Ещё' },
  ],
  club_admin: [
    { id: 'dashboard', icon: '📊', label: 'Обзор' },
    { id: 'clubs', icon: '🎭', label: 'Клуб' },
    { id: 'events', icon: '📅', label: 'События' },
    { id: 'members', icon: '👥', label: 'Участники' },
  ],
  group_leader: [
    { id: 'dashboard', icon: '📊', label: 'Обзор' },
    { id: 'schedule', icon: '📚', label: 'Расписание' },
    { id: 'students', icon: '👥', label: 'Студенты' },
  ],
  student: [
    { id: 'dashboard', icon: '🏠', label: 'Главная' },
    { id: 'clubs', icon: '🎭', label: 'Клубы' },
    { id: 'events', icon: '📅', label: 'События' },
    { id: 'schedule', icon: '📚', label: 'Расписание' },
  ]
};

// Role display names
export const ROLE_NAMES = {
  main_admin: 'Администратор',
  club_admin: 'Админ клуба',
  group_leader: 'Староста',
  student: 'Студент'
};

// Demo credentials for login page
export const DEMO_CREDENTIALS = [
  { email: 'admin@university.com', password: 'admin123', label: 'Администратор' },
  { email: 'student@university.com', password: 'student123', label: 'Студент' },
];

// Stat card colors
export const STAT_COLORS = ['blue', 'green', 'orange', 'purple'];

// Local storage keys
export const STORAGE_KEYS = {
  USER: 'uniclub_user',
  THEME: 'uniclub_theme',
  TAB: 'uniclub_tab'
};
