/**
 * Navigation — Оптимизированная
 */
import React, { memo, useCallback } from 'react';
import { useUser, useTab } from '../context/AppContext';
import { haptic } from '../utils/haptic';
import { IconHome, IconUsers, IconCalendar, IconUser, IconSparkles, IconSettings, IconSearch, IconPlus, IconGraduationCap, IconChevronLeft, IconBook } from './Icons';

// Навигация для sidebar
const ADMIN_NAV = [
  { id: 'dashboard', label: 'Главная', Icon: IconHome },
  { id: 'schedule', label: 'Расписание', Icon: IconBook },
  { id: 'clubs', label: 'Клубы', Icon: IconSparkles },
  { id: 'events', label: 'События', Icon: IconCalendar },
  { id: 'users', label: 'Пользователи', Icon: IconUsers },
];

const STUDENT_NAV = [
  { id: 'dashboard', label: 'Главная', Icon: IconHome },
  { id: 'schedule', label: 'Расписание', Icon: IconBook },
  { id: 'clubs', label: 'Клубы', Icon: IconSparkles },
  { id: 'events', label: 'События', Icon: IconCalendar },
];

// Tab bar для мобилки
const MOBILE_ADMIN = [
  { id: 'dashboard', label: 'Главная', Icon: IconHome },
  { id: 'schedule', label: 'Расписание', Icon: IconBook },
  { id: 'clubs', label: 'Клубы', Icon: IconSparkles },
  { id: 'users', label: 'Люди', Icon: IconUsers },
  { id: 'profile', label: 'Профиль', Icon: IconUser },
];

const MOBILE_STUDENT = [
  { id: 'dashboard', label: 'Главная', Icon: IconHome },
  { id: 'schedule', label: 'Расписание', Icon: IconBook },
  { id: 'clubs', label: 'Клубы', Icon: IconSparkles },
  { id: 'events', label: 'События', Icon: IconCalendar },
  { id: 'profile', label: 'Профиль', Icon: IconUser },
];

// Sidebar
export const Sidebar = memo(function Sidebar() {
  const user = useUser();
  const { activeTab, setActiveTab } = useTab();
  const isAdmin = user?.role === 'main_admin' || user?.role === 'club_admin';
  const navItems = isAdmin ? ADMIN_NAV : STUDENT_NAV;

  const handleNav = useCallback((id) => { haptic.light(); setActiveTab(id); }, [setActiveTab]);

  return (
    <aside className="sidebar">
      <div className="sidebar-inner">
        <header className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon"><IconGraduationCap size={24} color="white" /></div>
            <span className="sidebar-logo-text">UniClub</span>
          </div>
        </header>

        <nav className="sidebar-nav">
          {navItems.map(({ id, label, Icon }) => (
            <div key={id} className={`sidebar-nav-item ${activeTab === id ? 'active' : ''}`} onClick={() => handleNav(id)}>
              <span className="nav-icon"><Icon size={22} /></span>
              <span className="nav-label">{label}</span>
            </div>
          ))}
        </nav>

        <footer className="sidebar-footer">
          <div className={`sidebar-nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => handleNav('profile')}>
            <span className="nav-icon"><IconSettings size={22} /></span>
            <span className="nav-label">Настройки</span>
          </div>
        </footer>
      </div>
    </aside>
  );
});

// Tab Bar
export const TabBar = memo(function TabBar() {
  const user = useUser();
  const { activeTab, setActiveTab } = useTab();
  const isAdmin = user?.role === 'main_admin' || user?.role === 'club_admin';
  const tabs = isAdmin ? MOBILE_ADMIN : MOBILE_STUDENT;

  const handleTab = useCallback((id) => { haptic.light(); setActiveTab(id); }, [setActiveTab]);

  return (
    <nav className="tab-bar">
      {tabs.map(({ id, label, Icon }) => {
        const isActive = activeTab === id;
        return (
          <button key={id} className={`tab-bar-item ${isActive ? 'active' : ''}`} onClick={() => handleTab(id)}>
            <span className="tab-bar-icon"><Icon size={24} strokeWidth={isActive ? 2 : 1.5} /></span>
            <span className="tab-bar-label">{label}</span>
          </button>
        );
      })}
    </nav>
  );
});

// Mobile Header
export const MobilePageHeader = memo(function MobilePageHeader({ title, subtitle, showSearch, searchValue = '', onSearchChange, showBack, onBack, actions = [] }) {
  return (
    <header className="mobile-header">
      <div className="mobile-header-content">
        <div className="mobile-header-left">
          {showBack && <button className="btn btn-icon btn-glass" onClick={onBack}><IconChevronLeft size={24} /></button>}
          <div>
            <h1 className="mobile-header-title">{title}</h1>
            {subtitle && <p className="mobile-header-subtitle">{subtitle}</p>}
          </div>
        </div>
        {actions.length > 0 && (
          <div className="mobile-header-actions">
            {actions.map((action, i) => (
              <button key={i} className={`btn btn-icon ${action.primary ? 'btn-primary' : 'btn-glass'}`} onClick={action.onClick}>
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
            <input type="text" className="search-input" placeholder="Поиск..." value={searchValue} onChange={(e) => onSearchChange?.(e.target.value)} />
          </div>
        </div>
      )}
    </header>
  );
});
