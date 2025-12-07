/**
 * Icons — Apple SF Symbols style using Lucide
 * Все иконки оптимизированы для 24x24 grid
 */
import React, { memo } from 'react';

// Base Icon wrapper
const Icon = memo(function Icon({ children, size = 24, color = 'currentColor', strokeWidth = 1.5, className = '', style = {} }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
    >
      {children}
    </svg>
  );
});

// Navigation Icons
export const IconHome = memo(({ size, color, strokeWidth }) => (
  <Icon size={size} color={color} strokeWidth={strokeWidth}>
    <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
    <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
  </Icon>
));

export const IconUsers = memo(({ size, color, strokeWidth }) => (
  <Icon size={size} color={color} strokeWidth={strokeWidth}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </Icon>
));

export const IconCalendar = memo(({ size, color, strokeWidth }) => (
  <Icon size={size} color={color} strokeWidth={strokeWidth}>
    <path d="M8 2v4" />
    <path d="M16 2v4" />
    <rect width="18" height="18" x="3" y="4" rx="2" />
    <path d="M3 10h18" />
  </Icon>
));

export const IconCalendarDays = memo(({ size, color, strokeWidth }) => (
  <Icon size={size} color={color} strokeWidth={strokeWidth}>
    <path d="M8 2v4" />
    <path d="M16 2v4" />
    <rect width="18" height="18" x="3" y="4" rx="2" />
    <path d="M3 10h18" />
    <path d="M8 14h.01" />
    <path d="M12 14h.01" />
    <path d="M16 14h.01" />
    <path d="M8 18h.01" />
    <path d="M12 18h.01" />
    <path d="M16 18h.01" />
  </Icon>
));

export const IconClock = memo(({ size, color, strokeWidth }) => (
  <Icon size={size} color={color} strokeWidth={strokeWidth}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </Icon>
));

export const IconBuilding = memo(({ size, color, strokeWidth }) => (
  <Icon size={size} color={color} strokeWidth={strokeWidth}>
    <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
    <path d="M9 22v-4h6v4" />
    <path d="M8 6h.01" />
    <path d="M16 6h.01" />
    <path d="M12 6h.01" />
    <path d="M12 10h.01" />
    <path d="M12 14h.01" />
    <path d="M16 10h.01" />
    <path d="M16 14h.01" />
    <path d="M8 10h.01" />
    <path d="M8 14h.01" />
  </Icon>
));

export const IconGraduationCap = memo(({ size, color, strokeWidth }) => (
  <Icon size={size} color={color} strokeWidth={strokeWidth}>
    <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
    <path d="M22 10v6" />
    <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
  </Icon>
));

export const IconUser = memo(({ size, color, strokeWidth }) => (
  <Icon size={size} color={color} strokeWidth={strokeWidth}>
    <circle cx="12" cy="8" r="5" />
    <path d="M20 21a8 8 0 0 0-16 0" />
  </Icon>
));

export const IconUserCircle = memo(({ size, color, strokeWidth }) => (
  <Icon size={size} color={color} strokeWidth={strokeWidth}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="10" r="3" />
    <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" />
  </Icon>
));

export const IconSettings = memo(({ size, color, strokeWidth }) => (
  <Icon size={size} color={color} strokeWidth={strokeWidth}>
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </Icon>
));

// Action Icons
export const IconPlus = memo(({ size, color, strokeWidth }) => (
  <Icon size={size} color={color} strokeWidth={strokeWidth}>
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </Icon>
));

export const IconMinus = memo(({ size, color, strokeWidth }) => (
  <Icon size={size} color={color} strokeWidth={strokeWidth}>
    <path d="M5 12h14" />
  </Icon>
));

export const IconX = memo(({ size, color, strokeWidth }) => (
  <Icon size={size} color={color} strokeWidth={strokeWidth}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </Icon>
));

export const IconCheck = memo(({ size, color, strokeWidth }) => (
  <Icon size={size} color={color} strokeWidth={strokeWidth}>
    <path d="M20 6 9 17l-5-5" />
  </Icon>
));

export const IconEdit = memo(({ size, color, strokeWidth }) => (
  <Icon size={size} color={color} strokeWidth={strokeWidth}>
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    <path d="m15 5 4 4" />
  </Icon>
));

export const IconTrash = memo(({ size, color, strokeWidth }) => (
  <Icon size={size} color={color} strokeWidth={strokeWidth}>
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    <line x1="10" x2="10" y1="11" y2="17" />
    <line x1="14" x2="14" y1="11" y2="17" />
  </Icon>
));

export const IconSearch = memo(({ size, color, strokeWidth }) => (
  <Icon size={size} color={color} strokeWidth={strokeWidth}>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </Icon>
));

export const IconFilter = memo(({ size, color, strokeWidth }) => (
  <Icon size={size} color={color} strokeWidth={strokeWidth}>
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </Icon>
));

export const IconRefresh = memo(({ size, color, strokeWidth }) => (
  <Icon size={size} color={color} strokeWidth={strokeWidth}>
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M8 16H3v5" />
  </Icon>
));

export const IconLogOut = memo(({ size, color, strokeWidth }) => (
  <Icon size={size} color={color} strokeWidth={strokeWidth}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" x2="9" y1="12" y2="12" />
  </Icon>
));

export const IconLogIn = memo(({ size, color, strokeWidth }) => (
  <Icon size={size} color={color} strokeWidth={strokeWidth}>
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
    <polyline points="10 17 15 12 10 7" />
    <line x1="15" x2="3" y1="12" y2="12" />
  </Icon>
));

// Chevrons
export const IconChevronRight = memo(({ size, color, strokeWidth }) => (
  <Icon size={size} color={color} strokeWidth={strokeWidth}>
    <path d="m9 18 6-6-6-6" />
  </Icon>
));

export const IconChevronLeft = memo(({ size, color, strokeWidth }) => (
  <Icon size={size} color={color} strokeWidth={strokeWidth}>
    <path d="m15 18-6-6 6-6" />
  </Icon>
));

export const IconChevronDown = memo(({ size, color, strokeWidth }) => (
  <Icon size={size} color={color} strokeWidth={strokeWidth}>
    <path d="m6 9 6 6 6-6" />
  </Icon>
));

export const IconChevronUp = memo(({ size, color, strokeWidth }) => (
  <Icon size={size} color={color} strokeWidth={strokeWidth}>
    <path d="m18 15-6-6-6 6" />
  </Icon>
));

// Status Icons
export const IconBell = memo(({ size, color, strokeWidth }) => (
  <Icon size={size} color={color} strokeWidth={strokeWidth}>
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </Icon>
));

export const IconMail = memo(({ size, color, strokeWidth }) => (
  <Icon size={size} color={color} strokeWidth={strokeWidth}>
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </Icon>
));

export const IconLock = memo(({ size, color, strokeWidth }) => (
  <Icon size={size} color={color} strokeWidth={strokeWidth}>
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </Icon>
));

export const IconUnlock = memo(({ size, color, strokeWidth }) => (
  <Icon size={size} color={color} strokeWidth={strokeWidth}>
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 9.9-1" />
  </Icon>
));

export const IconEye = memo(({ size, color, strokeWidth }) => (
  <Icon size={size} color={color} strokeWidth={strokeWidth}>
    <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
    <circle cx="12" cy="12" r="3" />
  </Icon>
));

export const IconEyeOff = memo(({ size, color, strokeWidth }) => (
  <Icon size={size} color={color} strokeWidth={strokeWidth}>
    <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
    <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
    <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
    <path d="m2 2 20 20" />
  </Icon>
));

// Content Icons
export const IconHeart = memo(({ size, color, strokeWidth }) => (
  <Icon size={size} color={color} strokeWidth={strokeWidth}>
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </Icon>
));

export const IconStar = memo(({ size, color, strokeWidth }) => (
  <Icon size={size} color={color} strokeWidth={strokeWidth}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </Icon>
));

export const IconBookmark = memo(({ size, color, strokeWidth }) => (
  <Icon size={size} color={color} strokeWidth={strokeWidth}>
    <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
  </Icon>
));

export const IconShare = memo(({ size, color, strokeWidth }) => (
  <Icon size={size} color={color} strokeWidth={strokeWidth}>
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
    <polyline points="16 6 12 2 8 6" />
    <line x1="12" x2="12" y1="2" y2="15" />
  </Icon>
));

export const IconDownload = memo(({ size, color, strokeWidth }) => (
  <Icon size={size} color={color} strokeWidth={strokeWidth}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" x2="12" y1="15" y2="3" />
  </Icon>
));

export const IconUpload = memo(({ size, color, strokeWidth }) => (
  <Icon size={size} color={color} strokeWidth={strokeWidth}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" x2="12" y1="3" y2="15" />
  </Icon>
));

// Location & Map
export const IconMapPin = memo(({ size, color, strokeWidth }) => (
  <Icon size={size} color={color} strokeWidth={strokeWidth}>
    <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
    <circle cx="12" cy="10" r="3" />
  </Icon>
));

export const IconNavigation = memo(({ size, color, strokeWidth }) => (
  <Icon size={size} color={color} strokeWidth={strokeWidth}>
    <polygon points="3 11 22 2 13 21 11 13 3 11" />
  </Icon>
));

// Club/Event specific
export const IconSparkles = memo(({ size, color, strokeWidth }) => (
  <Icon size={size} color={color} strokeWidth={strokeWidth}>
    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    <path d="M20 3v4" />
    <path d="M22 5h-4" />
    <path d="M4 17v2" />
    <path d="M5 18H3" />
  </Icon>
));

export const IconPartyPopper = memo(({ size, color, strokeWidth }) => (
  <Icon size={size} color={color} strokeWidth={strokeWidth}>
    <path d="M5.8 11.3 2 22l10.7-3.79" />
    <path d="M4 3h.01" />
    <path d="M22 8h.01" />
    <path d="M15 2h.01" />
    <path d="M22 20h.01" />
    <path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10" />
    <path d="m22 13-.82-.33c-.86-.34-1.82.2-1.98 1.11c-.11.7-.72 1.22-1.43 1.22H17" />
    <path d="m11 2 .33.82c.34.86-.2 1.82-1.11 1.98C9.52 4.9 9 5.52 9 6.23V7" />
    <path d="M11 13c1.93 1.93 2.83 4.17 2 5-.83.83-3.07-.07-5-2-1.93-1.93-2.83-4.17-2-5 .83-.83 3.07.07 5 2Z" />
  </Icon>
));

export const IconTrophy = memo(({ size, color, strokeWidth }) => (
  <Icon size={size} color={color} strokeWidth={strokeWidth}>
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </Icon>
));

export const IconMicrophone = memo(({ size, color, strokeWidth }) => (
  <Icon size={size} color={color} strokeWidth={strokeWidth}>
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" x2="12" y1="19" y2="22" />
  </Icon>
));

export const IconMusic = memo(({ size, color, strokeWidth }) => (
  <Icon size={size} color={color} strokeWidth={strokeWidth}>
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </Icon>
));

export const IconPalette = memo(({ size, color, strokeWidth }) => (
  <Icon size={size} color={color} strokeWidth={strokeWidth}>
    <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
    <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
    <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
    <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z" />
  </Icon>
));

export const IconCamera = memo(({ size, color, strokeWidth }) => (
  <Icon size={size} color={color} strokeWidth={strokeWidth}>
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
    <circle cx="12" cy="13" r="3" />
  </Icon>
));

export const IconGamepad = memo(({ size, color, strokeWidth }) => (
  <Icon size={size} color={color} strokeWidth={strokeWidth}>
    <line x1="6" x2="10" y1="12" y2="12" />
    <line x1="8" x2="8" y1="10" y2="14" />
    <line x1="15" x2="15.01" y1="13" y2="13" />
    <line x1="18" x2="18.01" y1="11" y2="11" />
    <rect width="20" height="12" x="2" y="6" rx="2" />
  </Icon>
));

export const IconCode = memo(({ size, color, strokeWidth }) => (
  <Icon size={size} color={color} strokeWidth={strokeWidth}>
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </Icon>
));

export const IconBook = memo(({ size, color, strokeWidth }) => (
  <Icon size={size} color={color} strokeWidth={strokeWidth}>
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" />
  </Icon>
));

export const IconGlobe = memo(({ size, color, strokeWidth }) => (
  <Icon size={size} color={color} strokeWidth={strokeWidth}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
    <path d="M2 12h20" />
  </Icon>
));

export const IconBriefcase = memo(({ size, color, strokeWidth }) => (
  <Icon size={size} color={color} strokeWidth={strokeWidth}>
    <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    <rect width="20" height="14" x="2" y="6" rx="2" />
  </Icon>
));

export const IconFlask = memo(({ size, color, strokeWidth }) => (
  <Icon size={size} color={color} strokeWidth={strokeWidth}>
    <path d="M9 3h6" />
    <path d="M10 9h4" />
    <path d="M10 3v6l-4 8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l-4-8V3" />
  </Icon>
));

export const IconDumbbell = memo(({ size, color, strokeWidth }) => (
  <Icon size={size} color={color} strokeWidth={strokeWidth}>
    <path d="M14.4 14.4 9.6 9.6" />
    <path d="M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364-6.364a2 2 0 1 1 2.829 2.829l-1.768 1.767a2 2 0 1 1 2.828 2.829z" />
    <path d="m21.5 21.5-1.4-1.4" />
    <path d="M3.9 3.9 2.5 2.5" />
    <path d="M6.404 12.768a2 2 0 1 1-2.829-2.829l1.768-1.767a2 2 0 1 1-2.828-2.829l2.828-2.828a2 2 0 1 1 2.829 2.828l1.767-1.768a2 2 0 1 1 2.829 2.829z" />
  </Icon>
));

export const IconTheater = memo(({ size, color, strokeWidth }) => (
  <Icon size={size} color={color} strokeWidth={strokeWidth}>
    <path d="M2 10s3-3 3-8" />
    <path d="M22 10s-3-3-3-8" />
    <path d="M10 2c0 4.4-3.6 8-8 8" />
    <path d="M14 2c0 4.4 3.6 8 8 8" />
    <path d="M2 10s2 2 2 5" />
    <path d="M22 10s-2 2-2 5" />
    <path d="M8 15h8" />
    <path d="M2 22v-1a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1" />
    <path d="M14 22v-1a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1" />
  </Icon>
));

// Arrows
export const IconArrowLeft = memo(({ size, color, strokeWidth }) => (
  <Icon size={size} color={color} strokeWidth={strokeWidth}>
    <path d="m12 19-7-7 7-7" />
    <path d="M19 12H5" />
  </Icon>
));

export const IconArrowRight = memo(({ size, color, strokeWidth }) => (
  <Icon size={size} color={color} strokeWidth={strokeWidth}>
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </Icon>
));

// Misc
export const IconInfo = memo(({ size, color, strokeWidth }) => (
  <Icon size={size} color={color} strokeWidth={strokeWidth}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4" />
    <path d="M12 8h.01" />
  </Icon>
));

export const IconAlertCircle = memo(({ size, color, strokeWidth }) => (
  <Icon size={size} color={color} strokeWidth={strokeWidth}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" x2="12" y1="8" y2="12" />
    <line x1="12" x2="12.01" y1="16" y2="16" />
  </Icon>
));

export const IconCheckCircle = memo(({ size, color, strokeWidth }) => (
  <Icon size={size} color={color} strokeWidth={strokeWidth}>
    <circle cx="12" cy="12" r="10" />
    <path d="m9 12 2 2 4-4" />
  </Icon>
));

export const IconXCircle = memo(({ size, color, strokeWidth }) => (
  <Icon size={size} color={color} strokeWidth={strokeWidth}>
    <circle cx="12" cy="12" r="10" />
    <path d="m15 9-6 6" />
    <path d="m9 9 6 6" />
  </Icon>
));

export const IconWifi = memo(({ size, color, strokeWidth }) => (
  <Icon size={size} color={color} strokeWidth={strokeWidth}>
    <path d="M12 20h.01" />
    <path d="M2 8.82a15 15 0 0 1 20 0" />
    <path d="M5 12.859a10 10 0 0 1 14 0" />
    <path d="M8.5 16.429a5 5 0 0 1 7 0" />
  </Icon>
));

export const IconWifiOff = memo(({ size, color, strokeWidth }) => (
  <Icon size={size} color={color} strokeWidth={strokeWidth}>
    <path d="M12 20h.01" />
    <path d="M8.5 16.429a5 5 0 0 1 7 0" />
    <path d="M5 12.859a10 10 0 0 1 5.17-2.69" />
    <path d="M19 12.859a10 10 0 0 0-2.007-1.523" />
    <path d="M2 8.82a15 15 0 0 1 4.177-2.643" />
    <path d="M22 8.82a15 15 0 0 0-11.288-3.764" />
    <path d="m2 2 20 20" />
  </Icon>
));

export const IconMenu = memo(({ size, color, strokeWidth }) => (
  <Icon size={size} color={color} strokeWidth={strokeWidth}>
    <line x1="4" x2="20" y1="12" y2="12" />
    <line x1="4" x2="20" y1="6" y2="6" />
    <line x1="4" x2="20" y1="18" y2="18" />
  </Icon>
));

export const IconMoreVertical = memo(({ size, color, strokeWidth }) => (
  <Icon size={size} color={color} strokeWidth={strokeWidth}>
    <circle cx="12" cy="12" r="1" />
    <circle cx="12" cy="5" r="1" />
    <circle cx="12" cy="19" r="1" />
  </Icon>
));

export const IconMoreHorizontal = memo(({ size, color, strokeWidth }) => (
  <Icon size={size} color={color} strokeWidth={strokeWidth}>
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
    <circle cx="5" cy="12" r="1" />
  </Icon>
));

// Export all icons as object for easy access
export const Icons = {
  Home: IconHome,
  Users: IconUsers,
  Calendar: IconCalendar,
  CalendarDays: IconCalendarDays,
  Clock: IconClock,
  Building: IconBuilding,
  GraduationCap: IconGraduationCap,
  User: IconUser,
  UserCircle: IconUserCircle,
  Settings: IconSettings,
  Plus: IconPlus,
  Minus: IconMinus,
  X: IconX,
  Check: IconCheck,
  Edit: IconEdit,
  Trash: IconTrash,
  Search: IconSearch,
  Filter: IconFilter,
  Refresh: IconRefresh,
  LogOut: IconLogOut,
  LogIn: IconLogIn,
  ChevronRight: IconChevronRight,
  ChevronLeft: IconChevronLeft,
  ChevronDown: IconChevronDown,
  ChevronUp: IconChevronUp,
  Bell: IconBell,
  Mail: IconMail,
  Lock: IconLock,
  Unlock: IconUnlock,
  Eye: IconEye,
  EyeOff: IconEyeOff,
  Heart: IconHeart,
  Star: IconStar,
  Bookmark: IconBookmark,
  Share: IconShare,
  Download: IconDownload,
  Upload: IconUpload,
  MapPin: IconMapPin,
  Navigation: IconNavigation,
  Sparkles: IconSparkles,
  PartyPopper: IconPartyPopper,
  Trophy: IconTrophy,
  Microphone: IconMicrophone,
  Music: IconMusic,
  Palette: IconPalette,
  Camera: IconCamera,
  Gamepad: IconGamepad,
  Code: IconCode,
  Book: IconBook,
  Globe: IconGlobe,
  Briefcase: IconBriefcase,
  Flask: IconFlask,
  Dumbbell: IconDumbbell,
  Theater: IconTheater,
  ArrowLeft: IconArrowLeft,
  ArrowRight: IconArrowRight,
  Info: IconInfo,
  AlertCircle: IconAlertCircle,
  CheckCircle: IconCheckCircle,
  XCircle: IconXCircle,
  Wifi: IconWifi,
  WifiOff: IconWifiOff,
  Menu: IconMenu,
  MoreVertical: IconMoreVertical,
  MoreHorizontal: IconMoreHorizontal,
};

export default Icons;
