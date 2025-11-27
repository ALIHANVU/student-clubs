/**
 * App constants
 */

// Navigation items by role (icon - это идентификатор для IconByName)
export const NAV_ITEMS = {
  main_admin: [
    { id: 'dashboard', icon: 'chart', label: 'Дашборд' },
    { id: 'clubs', icon: 'grid', label: 'Клубы' },
    { id: 'events', icon: 'calendar', label: 'Мероприятия' },
    { id: 'faculties', icon: 'building', label: 'Структура' },
    { id: 'users', icon: 'users', label: 'Пользователи' },
  ],
  club_admin: [
    { id: 'dashboard', icon: 'chart', label: 'Обзор' },
    { id: 'clubs', icon: 'grid', label: 'Мой клуб' },
    { id: 'events', icon: 'calendar', label: 'Мероприятия' },
  ],
  group_leader: [
    { id: 'dashboard', icon: 'home', label: 'Главная' },
    { id: 'schedule', icon: 'book', label: 'Расписание' },
    { id: 'clubs', icon: 'grid', label: 'Клубы' },
    { id: 'events', icon: 'calendar', label: 'Мероприятия' },
  ],
  student: [
    { id: 'dashboard', icon: 'home', label: 'Главная' },
    { id: 'clubs', icon: 'grid', label: 'Клубы' },
    { id: 'events', icon: 'calendar', label: 'Мероприятия' },
    { id: 'schedule', icon: 'book', label: 'Расписание' },
  ]
};

// Page titles for mobile header
export const PAGE_TITLES = {
  dashboard: 'Главная',
  clubs: 'Клубы',
  events: 'Мероприятия',
  schedule: 'Расписание',
  faculties: 'Структура',
  users: 'Пользователи',
  profile: 'Профиль'
};

// Mobile tab bar items
export const TAB_BAR_ITEMS = {
  main_admin: [
    { id: 'dashboard', icon: 'chart', label: 'Главная' },
    { id: 'clubs', icon: 'grid', label: 'Клубы' },
    { id: 'events', icon: 'calendar', label: 'События' },
    { id: 'faculties', icon: 'building', label: 'Структура' },
  ],
  club_admin: [
    { id: 'dashboard', icon: 'chart', label: 'Обзор' },
    { id: 'clubs', icon: 'grid', label: 'Клуб' },
    { id: 'events', icon: 'calendar', label: 'События' },
  ],
  group_leader: [
    { id: 'dashboard', icon: 'home', label: 'Главная' },
    { id: 'schedule', icon: 'book', label: 'Расписание' },
    { id: 'clubs', icon: 'grid', label: 'Клубы' },
    { id: 'events', icon: 'calendar', label: 'События' },
  ],
  student: [
    { id: 'dashboard', icon: 'home', label: 'Главная' },
    { id: 'clubs', icon: 'grid', label: 'Клубы' },
    { id: 'events', icon: 'calendar', label: 'События' },
    { id: 'schedule', icon: 'book', label: 'Расписание' },
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

// Lesson types with icon identifiers
export const LESSON_TYPES = [
  { id: 'lecture', label: 'Лекция', icon: 'lecture' },
  { id: 'practice', label: 'Практика', icon: 'practice' },
  { id: 'lab', label: 'Лабораторная', icon: 'lab' },
  { id: 'seminar', label: 'Семинар', icon: 'seminar' },
];

// Club icon options (SF Symbols style identifiers)
export const CLUB_ICONS = [
  'grid', 'star', 'heart', 'book', 'lab', 
  'calendar', 'clock', 'location', 'bell', 'users'
];
