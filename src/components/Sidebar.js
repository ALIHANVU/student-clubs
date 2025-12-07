/**
 * Sidebar — Desktop навигация в стиле iOS 26 Liquid Glass
 */
import React, { memo, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { haptic } from '../utils/haptic';
import { 
  IconHome, IconSparkles, IconCalendar, IconBuilding, 
  IconUsers, IconGraduationCap, IconLogOut
} from './Icons';

const ADMIN_NAV = [
  { id: 'dashboard', label: 'Главная', icon: IconHome },
  { id: 'clubs', label: 'Клубы', icon: IconSparkles },
  { id: 'events', label: 'События', icon: IconCalendar },
  { id: 'schedule', label: 'Расписание', icon: IconCalendar },
  { id: 'faculties', label: 'Структура', icon: IconBuilding },
  { id: 'users', label: 'Пользователи', icon: IconUsers },
];

const STUDENT_NAV = [
  { id: 'dashboard', label: 'Главная', icon: IconHome },
  { id: 'clubs', label: 'Клубы', icon: IconSparkles },
  { id: 'events', label: 'События', icon: IconCalendar },
  { id: 'schedule', label: 'Расписание', icon: IconCalendar },
];

export const Sidebar = memo(function Sidebar() {
  const { user, activeTab, setActiveTab, logout } = useApp();
  
  const navItems = user?.role === 'main_admin' || user?.role === 'club_admin' 
    ? ADMIN_NAV 
    : STUDENT_NAV;

  const handleNavClick = useCallback((id) => {
    haptic.light();
    setActiveTab(id);
  }, [setActiveTab]);

  const handleLogout = useCallback(() => {
    haptic.medium();
    logout();
  }, [logout]);

  return (
    <aside className="sidebar">
      <div className="sidebar-inner">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">
              <IconGraduationCap size={28} color="white" />
            </div>
            <span className="sidebar-logo-text">UniClub</span>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <div
                key={item.id}
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => handleNavClick(item.id)}
              >
                <span className="nav-icon">
                  <IconComponent 
                    size={22} 
                    strokeWidth={isActive ? 2 : 1.5}
                    color={isActive ? 'white' : 'currentColor'}
                  />
                </span>
                <span className="nav-label">{item.label}</span>
              </div>
            );
          })}
        </nav>
        
        <div className="sidebar-footer">
          <div 
            className="sidebar-nav-item"
            onClick={() => handleNavClick('profile')}
          >
            <span className="nav-icon">👤</span>
            <span className="nav-label">{user?.full_name || 'Профиль'}</span>
          </div>
          <div className="sidebar-nav-item" onClick={handleLogout}>
            <span className="nav-icon">
              <IconLogOut size={22} color="var(--red)" />
            </span>
            <span className="nav-label" style={{ color: 'var(--red)' }}>Выйти</span>
          </div>
        </div>
      </div>
    </aside>
  );
});

export default Sidebar;
