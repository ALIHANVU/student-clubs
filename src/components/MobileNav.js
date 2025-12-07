/**
 * MobileNav — Tab Bar и Mobile Header в стиле iOS 26
 */
import React, { memo, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { haptic } from '../utils/haptic';
import { 
  IconHome, IconSparkles, IconCalendar, IconUser,
  IconChevronLeft, IconPlus, IconSearch, IconSettings
} from './Icons';

// Навигация для Tab Bar (максимум 5 элементов)
const TAB_NAV = [
  { id: 'dashboard', label: 'Главная', icon: IconHome },
  { id: 'clubs', label: 'Клубы', icon: IconSparkles },
  { id: 'events', label: 'События', icon: IconCalendar },
  { id: 'profile', label: 'Профиль', icon: IconUser },
];

// Floating Tab Bar
export const TabBar = memo(function TabBar() {
  const { activeTab, setActiveTab } = useApp();

  const handleTabClick = useCallback((id) => {
    haptic.light();
    setActiveTab(id);
  }, [setActiveTab]);

  return (
    <nav className="tab-bar">
      {TAB_NAV.map((item) => {
        const IconComponent = item.icon;
        const isActive = activeTab === item.id;
        
        return (
          <button
            key={item.id}
            className={`tab-bar-item ${isActive ? 'active' : ''}`}
            onClick={() => handleTabClick(item.id)}
          >
            <span className="tab-bar-icon">
              <IconComponent 
                size={24} 
                strokeWidth={isActive ? 2 : 1.5}
                color={isActive ? 'white' : 'currentColor'}
              />
            </span>
            <span className="tab-bar-label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
});

// Mobile Page Header с Large Title
export const MobilePageHeader = memo(function MobilePageHeader({ 
  title, 
  subtitle,
  showBack = false, 
  onBack,
  showAdd = false,
  onAdd,
  showSearch = false,
  searchValue,
  onSearch,
  rightAction
}) {
  const handleBack = useCallback(() => {
    haptic.light();
    onBack?.();
  }, [onBack]);

  const handleAdd = useCallback(() => {
    haptic.medium();
    onAdd?.();
  }, [onAdd]);

  return (
    <header className="mobile-header">
      <div className="mobile-header-content">
        <div className="mobile-header-left">
          {showBack && (
            <button className="btn btn-icon btn-glass" onClick={handleBack}>
              <IconChevronLeft size={24} />
            </button>
          )}
          <div>
            <h1 className="mobile-header-title">{title}</h1>
            {subtitle && <p className="mobile-header-subtitle">{subtitle}</p>}
          </div>
        </div>
        
        <div className="mobile-header-actions">
          {rightAction}
          {showAdd && (
            <button className="btn btn-icon btn-primary" onClick={handleAdd}>
              <IconPlus size={24} color="white" />
            </button>
          )}
        </div>
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
              onChange={(e) => onSearch?.(e.target.value)}
            />
          </div>
        </div>
      )}
    </header>
  );
});

export default TabBar;
