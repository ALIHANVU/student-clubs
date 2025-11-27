/**
 * Minimalist Icons - SF Symbols Style
 * Чистые линейные иконки как на iPhone
 */
import React from 'react';

// Базовый компонент иконки
const Icon = ({ children, size = 24, className = '' }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.5" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={`icon ${className}`}
  >
    {children}
  </svg>
);

// === НАВИГАЦИЯ ===

export const HomeIcon = ({ size, className }) => (
  <Icon size={size} className={className}>
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
    <path d="M9 21V12h6v9" />
  </Icon>
);

export const ChartIcon = ({ size, className }) => (
  <Icon size={size} className={className}>
    <rect x="3" y="12" width="4" height="9" rx="1" />
    <rect x="10" y="8" width="4" height="13" rx="1" />
    <rect x="17" y="3" width="4" height="18" rx="1" />
  </Icon>
);

export const UsersIcon = ({ size, className }) => (
  <Icon size={size} className={className}>
    <circle cx="9" cy="7" r="3" />
    <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
    <circle cx="17" cy="7" r="2.5" />
    <path d="M21 21v-1.5a3 3 0 00-2-2.83" />
  </Icon>
);

export const UserIcon = ({ size, className }) => (
  <Icon size={size} className={className}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21v-2a4 4 0 014-4h8a4 4 0 014 4v2" />
  </Icon>
);

export const CalendarIcon = ({ size, className }) => (
  <Icon size={size} className={className}>
    <rect x="3" y="4" width="18" height="17" rx="2" />
    <path d="M3 9h18" />
    <path d="M8 2v4" />
    <path d="M16 2v4" />
  </Icon>
);

export const BookIcon = ({ size, className }) => (
  <Icon size={size} className={className}>
    <path d="M4 4.5A2.5 2.5 0 016.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15z" />
    <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
  </Icon>
);

export const BuildingIcon = ({ size, className }) => (
  <Icon size={size} className={className}>
    <path d="M3 21h18" />
    <path d="M5 21V7l7-4 7 4v14" />
    <path d="M9 21v-4h6v4" />
    <path d="M9 10h.01" />
    <path d="M15 10h.01" />
    <path d="M9 14h.01" />
    <path d="M15 14h.01" />
  </Icon>
);

export const GridIcon = ({ size, className }) => (
  <Icon size={size} className={className}>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </Icon>
);

// === ДЕЙСТВИЯ ===

export const PlusIcon = ({ size, className }) => (
  <Icon size={size} className={className}>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </Icon>
);

export const SearchIcon = ({ size, className }) => (
  <Icon size={size} className={className}>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.35-4.35" />
  </Icon>
);

export const CloseIcon = ({ size, className }) => (
  <Icon size={size} className={className}>
    <path d="M18 6L6 18" />
    <path d="M6 6l12 12" />
  </Icon>
);

export const CheckIcon = ({ size, className }) => (
  <Icon size={size} className={className}>
    <path d="M20 6L9 17l-5-5" />
  </Icon>
);

export const ChevronRightIcon = ({ size, className }) => (
  <Icon size={size} className={className}>
    <path d="M9 18l6-6-6-6" />
  </Icon>
);

export const ChevronDownIcon = ({ size, className }) => (
  <Icon size={size} className={className}>
    <path d="M6 9l6 6 6-6" />
  </Icon>
);

export const EditIcon = ({ size, className }) => (
  <Icon size={size} className={className}>
    <path d="M17 3a2.83 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </Icon>
);

export const TrashIcon = ({ size, className }) => (
  <Icon size={size} className={className}>
    <path d="M3 6h18" />
    <path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
  </Icon>
);

export const SettingsIcon = ({ size, className }) => (
  <Icon size={size} className={className}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
  </Icon>
);

export const LogoutIcon = ({ size, className }) => (
  <Icon size={size} className={className}>
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
    <path d="M16 17l5-5-5-5" />
    <path d="M21 12H9" />
  </Icon>
);

export const LockIcon = ({ size, className }) => (
  <Icon size={size} className={className}>
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0110 0v4" />
  </Icon>
);

// === КОНТЕНТ ===

export const ClubIcon = ({ size, className }) => (
  <Icon size={size} className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 3" />
  </Icon>
);

export const EventIcon = ({ size, className }) => (
  <Icon size={size} className={className}>
    <rect x="3" y="4" width="18" height="17" rx="2" />
    <path d="M3 9h18" />
    <path d="M8 2v4" />
    <path d="M16 2v4" />
    <circle cx="12" cy="15" r="2" />
  </Icon>
);

export const LocationIcon = ({ size, className }) => (
  <Icon size={size} className={className}>
    <path d="M12 21c-4-4-8-7.5-8-12a8 8 0 1116 0c0 4.5-4 8-8 12z" />
    <circle cx="12" cy="9" r="2.5" />
  </Icon>
);

export const ClockIcon = ({ size, className }) => (
  <Icon size={size} className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 6v6l4 2" />
  </Icon>
);

export const BellIcon = ({ size, className }) => (
  <Icon size={size} className={className}>
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 01-3.46 0" />
  </Icon>
);

export const StarIcon = ({ size, className }) => (
  <Icon size={size} className={className}>
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </Icon>
);

export const HeartIcon = ({ size, className }) => (
  <Icon size={size} className={className}>
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
  </Icon>
);

// === ТИПЫ ЗАНЯТИЙ ===

export const LectureIcon = ({ size, className }) => (
  <Icon size={size} className={className}>
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <path d="M8 21h8" />
    <path d="M12 17v4" />
  </Icon>
);

export const PracticeIcon = ({ size, className }) => (
  <Icon size={size} className={className}>
    <path d="M12 19l7-7 3 3-7 7-3-3z" />
    <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
    <path d="M2 2l7.586 7.586" />
    <circle cx="11" cy="11" r="2" />
  </Icon>
);

export const LabIcon = ({ size, className }) => (
  <Icon size={size} className={className}>
    <path d="M9 3h6v5l4 9H5l4-9V3z" />
    <path d="M10 3h4" />
    <circle cx="8" cy="14" r="1" fill="currentColor" />
    <circle cx="12" cy="16" r="1" fill="currentColor" />
    <circle cx="15" cy="14" r="1" fill="currentColor" />
  </Icon>
);

export const SeminarIcon = ({ size, className }) => (
  <Icon size={size} className={className}>
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" />
  </Icon>
);

// === СТАТУСЫ ===

export const SuccessIcon = ({ size, className }) => (
  <Icon size={size} className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9 12l2 2 4-4" />
  </Icon>
);

export const ErrorIcon = ({ size, className }) => (
  <Icon size={size} className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M15 9l-6 6" />
    <path d="M9 9l6 6" />
  </Icon>
);

export const WarningIcon = ({ size, className }) => (
  <Icon size={size} className={className}>
    <path d="M12 2L2 22h20L12 2z" />
    <path d="M12 9v5" />
    <circle cx="12" cy="17" r="0.5" fill="currentColor" />
  </Icon>
);

export const InfoIcon = ({ size, className }) => (
  <Icon size={size} className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 16v-4" />
    <circle cx="12" cy="8" r="0.5" fill="currentColor" />
  </Icon>
);

// === ПРОЧЕЕ ===

export const RefreshIcon = ({ size, className }) => (
  <Icon size={size} className={className}>
    <path d="M23 4v6h-6" />
    <path d="M1 20v-6h6" />
    <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
  </Icon>
);

export const FilterIcon = ({ size, className }) => (
  <Icon size={size} className={className}>
    <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
  </Icon>
);

export const MenuIcon = ({ size, className }) => (
  <Icon size={size} className={className}>
    <path d="M3 12h18" />
    <path d="M3 6h18" />
    <path d="M3 18h18" />
  </Icon>
);

export const MoreIcon = ({ size, className }) => (
  <Icon size={size} className={className}>
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    <circle cx="19" cy="12" r="1.5" fill="currentColor" />
    <circle cx="5" cy="12" r="1.5" fill="currentColor" />
  </Icon>
);

export const ArrowLeftIcon = ({ size, className }) => (
  <Icon size={size} className={className}>
    <path d="M19 12H5" />
    <path d="M12 19l-7-7 7-7" />
  </Icon>
);

export const ArrowRightIcon = ({ size, className }) => (
  <Icon size={size} className={className}>
    <path d="M5 12h14" />
    <path d="M12 5l7 7-7 7" />
  </Icon>
);

export const ExternalLinkIcon = ({ size, className }) => (
  <Icon size={size} className={className}>
    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
    <path d="M15 3h6v6" />
    <path d="M10 14L21 3" />
  </Icon>
);

// Маппинг строковых идентификаторов на компоненты
export const IconMap = {
  home: HomeIcon,
  chart: ChartIcon,
  users: UsersIcon,
  user: UserIcon,
  calendar: CalendarIcon,
  book: BookIcon,
  building: BuildingIcon,
  grid: GridIcon,
  plus: PlusIcon,
  search: SearchIcon,
  close: CloseIcon,
  check: CheckIcon,
  chevronRight: ChevronRightIcon,
  chevronDown: ChevronDownIcon,
  edit: EditIcon,
  trash: TrashIcon,
  settings: SettingsIcon,
  logout: LogoutIcon,
  lock: LockIcon,
  club: ClubIcon,
  event: EventIcon,
  location: LocationIcon,
  clock: ClockIcon,
  bell: BellIcon,
  star: StarIcon,
  heart: HeartIcon,
  lecture: LectureIcon,
  practice: PracticeIcon,
  lab: LabIcon,
  seminar: SeminarIcon,
  success: SuccessIcon,
  error: ErrorIcon,
  warning: WarningIcon,
  info: InfoIcon,
  refresh: RefreshIcon,
  filter: FilterIcon,
  menu: MenuIcon,
  more: MoreIcon,
  arrowLeft: ArrowLeftIcon,
  arrowRight: ArrowRightIcon,
  externalLink: ExternalLinkIcon
};

// Универсальный компонент иконки по имени
export const IconByName = ({ name, size = 24, className = '' }) => {
  const IconComponent = IconMap[name];
  if (!IconComponent) return null;
  return <IconComponent size={size} className={className} />;
};

export default IconByName;
