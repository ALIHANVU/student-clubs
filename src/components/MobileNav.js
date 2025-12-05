import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TAB_BAR_ITEMS } from '../utils/constants';
import { getInitials } from '../utils/helpers';
import { haptic } from '../utils/haptic';

export function MobilePageHeader({ 
  title, 
  showSearch = false, 
  searchValue = '', 
  onSearchChange,
  actions = [],
  subtitle = null
}) {
  const [searchOpen, setSearchOpen] = useState(false);

  const toggleSearch = () => {
    haptic.light();
    setSearchOpen(!searchOpen);
    if (searchOpen && onSearchChange) onSearchChange('');
  };

  return (
    <div className="mobile-page-header">
      <div className="mobile-page-header-top">
        <div className="mobile-page-header-left">
          <h1 className="mobile-page-title">{title}</h1>
          {subtitle && <p className="mobile-page-subtitle">{subtitle}</p>}
        </div>
        
        <div className="mobile-page-header-actions">
          {showSearch && (
            <button className={`mobile-header-btn ${searchOpen ? 'active' : ''}`} onClick={toggleSearch}>🔍</button>
          )}
          {actions.map((action, i) => (
            <button
              key={i}
              className={`mobile-header-btn ${action.primary ? 'primary' : ''}`}
              onClick={() => { haptic.medium(); action.onClick(); }}
            >
              {action.icon === 'plus' ? '+' : action.icon}
            </button>
          ))}
        </div>
      </div>
      
      {showSearch && searchOpen && (
        <div className="mobile-search-bar">
          <span className="mobile-search-icon">🔍</span>
          <input
            type="text"
            placeholder="Поиск..."
            value={searchValue}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            autoFocus
            className="mobile-search-input"
          />
          {searchValue && (
            <button className="mobile-search-clear" onClick={() => { haptic.light(); onSearchChange && onSearchChange(''); }}>×</button>
          )}
        </div>
      )}
    </div>
  );
}

export function TabBar() {
  const { user, activeTab, setActiveTab } = useApp();

  const items = TAB_BAR_ITEMS[user.role] || TAB_BAR_ITEMS.student;
  const initials = getInitials(user.full_name);

  const handleTabClick = (id) => {
    haptic.light();
    setActiveTab(id);
  };

  return (
    <nav className="tab-bar">
      <div className="tab-bar-items">
        {items.map((item) => (
          <div
            key={item.id}
            className={`tab-bar-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => handleTabClick(item.id)}
          >
            <span className="tab-bar-item-icon">{item.icon}</span>
            <span className="tab-bar-item-label">{item.label}</span>
          </div>
        ))}
        
        <div
          className={`tab-bar-item ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => handleTabClick('profile')}
        >
          <div className="tab-bar-avatar">{initials}</div>
          <span className="tab-bar-item-label">Профиль</span>
        </div>
      </div>
    </nav>
  );
}

export default MobilePageHeader;
