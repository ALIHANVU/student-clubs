/**
 * App constants
 */

// Navigation items by role
export const NAV_ITEMS = {
  main_admin: [
    { id: 'dashboard', icon: '📊', label: 'Дашборд' },
    { id: 'clubs', icon: '🎭', label: 'Клубы' },
    { id: 'events', icon: '📅', label: 'Мероприятия' },
    { id: 'faculties', icon: '🏛️', label: 'Факультеты' },
    { id: 'users', icon: '👤', label: 'Пользователи' },
  ],
  club_admin: [
    { id: 'dashboard', icon: '📊', label: 'Обзор' },
    { id: 'clubs', icon: '🎭', label: 'Мой клуб' },
    { id: 'events', icon: '📅', label: 'Мероприятия' },
  ],
  group_leader: [
    { id: 'dashboard', icon: '🏠', label: 'Главная' },
    { id: 'schedule', icon: '📚', label: 'Расписание' },
    { id: 'clubs', icon: '🎭', label: 'Клубы' },
    { id: 'events', icon: '📅', label: 'Мероприятия' },
  ],
  student: [
    { id: 'dashboard', icon: '🏠', label: 'Главная' },
    { id: 'clubs', icon: '🎭', label: 'Клубы' },
    { id: 'events', icon: '📅', label: 'Мероприятия' },
    { id: 'schedule', icon: '📚', label: 'Расписание' },
  ]
};

// Mobile tab bar items
export const TAB_BAR_ITEMS = {
  main_admin: [
    { id: 'dashboard', icon: '📊', label: 'Главная' },
    { id: 'clubs', icon: '🎭', label: 'Клубы' },
    { id: 'faculties', icon: '🏛️', label: 'Структура' },
    { id: 'users', icon: '👤', label: 'Люди' },
  ],
  club_admin: [
    { id: 'dashboard', icon: '📊', label: 'Обзор' },
    { id: 'clubs', icon: '🎭', label: 'Клуб' },
    { id: 'events', icon: '📅', label: 'События' },
  ],
  group_leader: [
    { id: 'dashboard', icon: '🏠', label: 'Главная' },
    { id: 'schedule', icon: '📚', label: 'Расписание' },
    { id: 'clubs', icon: '🎭', label: 'Клубы' },
    { id: 'events', icon: '📅', label: 'События' },
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

// Demo credentials
export const DEMO_CREDENTIALS = [
  { email: 'admin@university.com', password: 'admin123', label: 'Администратор' },
  { email: 'leader@university.com', password: 'leader123', label: 'Староста' },
  { email: 'student@university.com', password: 'student123', label: 'Студент' },
];

// Local storage keys
export const STORAGE_KEYS = {
  USER: 'uniclub_user',
  THEME: 'uniclub_theme',
  TAB: 'uniclub_tab'
};

// Days of week
export const DAYS = [
  { id: 1, name: 'Понедельник', short: 'Пн' },
  { id: 2, name: 'Вторник', short: 'Вт' },
  { id: 3, name: 'Среда', short: 'Ср' },
  { id: 4, name: 'Четверг', short: 'Чт' },
  { id: 5, name: 'Пятница', short: 'Пт' },
  { id: 6, name: 'Суббота', short: 'Сб' }
];

// Time slots
export const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:15', '10:30', 
  '11:00', '11:30', '11:45', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00',
  '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'
];

// Lesson types
export const LESSON_TYPES = [
  { id: 'lecture', label: 'Лекция', icon: '📖' },
  { id: 'practice', label: 'Практика', icon: '✏️' },
  { id: 'lab', label: 'Лабораторная', icon: '🔬' },
  { id: 'seminar', label: 'Семинар', icon: '💬' },
];
