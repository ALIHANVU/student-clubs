/**
 * Navigation — с настоящими иконками в стиле Apple SF Symbols
 */
import React, { memo, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { haptic } from '../utils/haptic';
import { 
  IconHome, IconUsers, IconCalendar, IconBuilding, 
  IconUser, IconSparkles, IconSettings, IconSearch, IconPlus,
  IconGraduationCap, IconChevronLeft
} from './Icons';

// Навигация для админов
const ADMIN_NAV = [
  { id: 'dashboard', label: 'Главная', icon: IconHome },
  { id: 'clubs', label: 'Клубы', icon: IconSparkles },
  { id: 'events', label: 'События', icon: IconCalendar },
  { id: 'schedule', label: 'Расписание', icon: IconCalendar },
  { id: 'faculties', label: 'Структура', icon: IconBuilding },
  { id: 'users', label: 'Пользователи', icon: IconUsers },
];

// Навигация для студентов
const STUDENT_NAV = [
  { id: 'dashboard', label: 'Главная', icon: IconHome },
  { id: 'clubs', label: 'Клубы', icon: IconSparkles },
  { id: 'events', label: 'События', icon: IconCalendar },
  { id: 'schedule', label: 'Расписание', icon: IconCalendar },
];

// Tab bar для мобильных (максимум 5 вкладок)
const MOBILE_TABS_ADMIN = [
  { id: 'dashboard', label: 'Главная', icon: IconHome },
  { id: 'clubs', label: 'Клубы', icon: IconSparkles },
  { id: 'events', label: 'События', icon: IconCalendar },
  { id: 'users', label: 'Люди', icon: IconUsers },
  { id: 'profile', label: 'Профиль', icon: IconUser },
];

const MOBILE_TABS_STUDENT = [
  { id: 'dashboard', label: 'Главная', icon: IconHome },
  { id: 'clubs', label: 'Клубы', icon: IconSparkles },
  { id: 'events', label: 'События', icon: IconCalendar },
  { id: 'schedule', label: 'Расписание', icon: IconCalendar },
  { id: 'profile', label: 'Профиль', icon: IconUser },
];

// Sidebar для десктопа
export const Sidebar = memo(function Sidebar() {
  const { user, activeTab, setActiveTab } = useApp();
  const isAdmin = user.role === 'main_admin' || user.role === 'club_admin';
  const navItems = isAdmin ? ADMIN_NAV : STUDENT_NAV;

  const handleNavClick = useCallback((id) => {
    haptic.light();
    setActiveTab(id);
  }, [setActiveTab]);

  return (
    <aside className="sidebar">
      <div className="sidebar-inner">
        <header className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">
              <IconGraduationCap size={24} color="white" />
            </div>
            <span className="sidebar-logo-text">UniClub</span>
          </div>
        </header>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className={`sidebar-nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => handleNavClick(item.id)}
              >
                <span className="nav-icon">
                  <Icon size={22} />
                </span>
                <span className="nav-label">{item.label}</span>
              </div>
            );
          })}
        </nav>

        <footer className="sidebar-footer">
          <div
            className={`sidebar-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => handleNavClick('profile')}
          >
            <span className="nav-icon">
              <IconSettings size={22} />
            </span>
            <span className="nav-label">Настройки</span>
          </div>
        </footer>
      </div>
    </aside>
  );
});

// Tab Bar для мобильных — плавающий в стиле iOS
export const TabBar = memo(function TabBar() {
  const { user, activeTab, setActiveTab } = useApp();
  const isAdmin = user.role === 'main_admin' || user.role === 'club_admin';
  const tabs = isAdmin ? MOBILE_TABS_ADMIN : MOBILE_TABS_STUDENT;

  const handleTabClick = useCallback((id) => {
    haptic.light();
    setActiveTab(id);
  }, [setActiveTab]);

  return (
    <nav className="tab-bar">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            className={`tab-bar-item ${isActive ? 'active' : ''}`}
            onClick={() => handleTabClick(tab.id)}
          >
            <span className="tab-bar-icon">
              <Icon size={24} strokeWidth={isActive ? 2 : 1.5} />
            </span>
            <span className="tab-bar-label">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
});

// Mobile Page Header — в стиле iOS
export const MobilePageHeader = memo(function MobilePageHeader({ 
  title, 
  subtitle,
  showSearch = false,
  searchValue = '',
  onSearchChange,
  showBack = false,
  onBack,
  actions = [] 
}) {
  return (
    <header className="mobile-header">
      <div className="mobile-header-content">
        <div className="mobile-header-left">
          {showBack && (
            <button className="btn btn-icon btn-glass" onClick={onBack}>
              <IconChevronLeft size={24} />
            </button>
          )}
          <div>
            <h1 className="mobile-header-title">{title}</h1>
            {subtitle && <p className="mobile-header-subtitle">{subtitle}</p>}
          </div>
        </div>
        
        {actions.length > 0 && (
          <div className="mobile-header-actions">
            {actions.map((action, i) => (
              <button 
                key={i} 
                className={`btn btn-icon ${action.primary ? 'btn-primary' : 'btn-glass'}`}
                onClick={action.onClick}
              >
                {action.icon === 'plus' && <IconPlus size={20} />}
                {action.icon === 'search' && <IconSearch size={20} />}
                {action.icon === 'settings' && <IconSettings size={20} />}
              </button>
            ))}
          </div>
        )}
      </div>
      
      {showSearch && (
        <div className="mobile-header-search">
          <div className="search-input-wrapper">
            <IconSearch size={18} color="var(--text-tertiary)" />
            <input
              type="text"
              className="search-input"
              placeholder="Поиск..."
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
            />
          </div>
        </div>
      )}
    </header>
  );
});
