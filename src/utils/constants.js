/**
 * Constants — Обновлённые (без отдельной страницы структуры)
 */

// Навигация для sidebar (desktop)
export const NAV_ITEMS = {
  main_admin: [
    { id: 'dashboard', icon: '📊', label: 'Дашборд' },
    { id: 'clubs', icon: '🎭', label: 'Клубы' },
    { id: 'events', icon: '📅', label: 'Мероприятия' },
    { id: 'schedule', icon: '📚', label: 'Расписание' },
    { id: 'users', icon: '👥', label: 'Пользователи' },
  ],
  club_admin: [
    { id: 'dashboard', icon: '📊', label: 'Обзор' },
    { id: 'clubs', icon: '🎭', label: 'Мой клуб' },
    { id: 'events', icon: '📅', label: 'Мероприятия' },
    { id: 'schedule', icon: '📚', label: 'Расписание' },
  ],
  group_leader: [
    { id: 'dashboard', icon: '🏠', label: 'Главная' },
    { id: 'schedule', icon: '📚', label: 'Расписание' },
    { id: 'clubs', icon: '🎭', label: 'Клубы' },
    { id: 'events', icon: '📅', label: 'Мероприятия' },
  ],
  student: [
    { id: 'dashboard', icon: '🏠', label: 'Главная' },
    { id: 'schedule', icon: '📚', label: 'Расписание' },
    { id: 'clubs', icon: '🎭', label: 'Клубы' },
    { id: 'events', icon: '📅', label: 'Мероприятия' },
  ]
};

// Навигация для tab bar (mobile) - максимум 5 вкладок
export const TAB_BAR_ITEMS = {
  main_admin: [
    { id: 'dashboard', icon: '📊', label: 'Главная' },
    { id: 'schedule', icon: '📚', label: 'Расписание' },
    { id: 'clubs', icon: '🎭', label: 'Клубы' },
    { id: 'users', icon: '👥', label: 'Юзеры' },
  ],
  club_admin: [
    { id: 'dashboard', icon: '📊', label: 'Обзор' },
    { id: 'schedule', icon: '📚', label: 'Расписание' },
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
    { id: 'schedule', icon: '📚', label: 'Расписание' },
    { id: 'clubs', icon: '🎭', label: 'Клубы' },
    { id: 'events', icon: '📅', label: 'События' },
  ]
};

export const ROLE_NAMES = {
  main_admin: 'Администратор',
  club_admin: 'Админ клуба',
  group_leader: 'Староста',
  student: 'Студент'
};

export const DEMO_CREDENTIALS = [
  { email: 'admin@uniclub.ru', password: 'admin123', label: 'Админ' },
  { email: 'leader@uniclub.ru', password: 'leader123', label: 'Староста' },
  { email: 'student@uniclub.ru', password: 'student123', label: 'Студент' },
];

export const STORAGE_KEY = 'uniclub_user';

export const DAYS = [
  { id: 1, name: 'Понедельник', short: 'Пн' },
  { id: 2, name: 'Вторник', short: 'Вт' },
  { id: 3, name: 'Среда', short: 'Ср' },
  { id: 4, name: 'Четверг', short: 'Чт' },
  { id: 5, name: 'Пятница', short: 'Пт' },
  { id: 6, name: 'Суббота', short: 'Сб' }
];

export const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', 
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'
];

export const LESSON_TYPES = [
  { id: 'lecture', label: 'Лекция', icon: '📖' },
  { id: 'practice', label: 'Практика', icon: '✏️' },
  { id: 'lab', label: 'Лабораторная', icon: '🔬' },
  { id: 'seminar', label: 'Семинар', icon: '💬' },
];

export const WEEK_TYPES = [
  { id: 'all', label: 'Каждую неделю' },
  { id: 'odd', label: 'Нечётная неделя' },
  { id: 'even', label: 'Чётная неделя' },
];

export const CLUB_ICONS = ['🎭', '💻', '⚽', '🎵', '📚', '🎨', '🎮', '🔬', '🎬', '🌍'];
