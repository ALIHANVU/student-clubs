import React, { useState, memo } from 'react';
import { useApp } from '../context/AppContext';
import { TAB_BAR_ITEMS } from '../utils/constants';
import { getInitials } from '../utils/helpers';
import { haptic } from '../utils/haptic';

export const MobilePageHeader = memo(function MobilePageHeader({ 
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
    <header className="mobile-header">
      <div className="mobile-header-content">
        <div>
          <h1 className="mobile-header-title">{title}</h1>
          {subtitle && <p className="mobile-header-subtitle">{subtitle}</p>}
        </div>
        
        <div className="mobile-header-actions">
          {showSearch && (
            <button 
              className={`btn btn-icon btn-glass ${searchOpen ? 'active' : ''}`} 
              onClick={toggleSearch}
            >
              🔍
            </button>
          )}
          {actions.map((action, i) => (
            <button
              key={i}
              className={`btn btn-icon ${action.primary ? 'btn-primary' : 'btn-glass'}`}
              onClick={() => { haptic.medium(); action.onClick(); }}
            >
              {action.icon === 'plus' ? '+' : action.icon}
            </button>
          ))}
        </div>
      </div>
      
      {showSearch && searchOpen && (
        <div className="search-bar" style={{ marginTop: 'var(--spacing-md)' }}>
          <input
            type="text"
            placeholder="Поиск..."
            value={searchValue}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            autoFocus
            className="input input-glass"
            style={{ paddingLeft: '44px' }}
          />
          <span style={{ 
            position: 'absolute', 
            left: '16px', 
            top: '50%', 
            transform: 'translateY(-50%)',
            fontSize: '16px',
            opacity: 0.5 
          }}>🔍</span>
          {searchValue && (
            <button 
              className="btn btn-icon btn-sm" 
              style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)' }}
              onClick={() => { haptic.light(); onSearchChange && onSearchChange(''); }}
            >
              ×
            </button>
          )}
        </div>
      )}
    </header>
  );
});

export const TabBar = memo(function TabBar() {
  const { user, activeTab, setActiveTab } = useApp();

  const items = TAB_BAR_ITEMS[user.role] || TAB_BAR_ITEMS.student;
  const initials = getInitials(user.full_name);

  const handleTabClick = (id) => {
    haptic.light();
    setActiveTab(id);
  };

  return (
    <nav className="tab-bar">
      {items.map((item) => (
        <button
          key={item.id}
          className={`tab-bar-item ${activeTab === item.id ? 'active' : ''}`}
          onClick={() => handleTabClick(item.id)}
        >
          <span className="tab-bar-icon">{item.icon}</span>
          <span className="tab-bar-label">{item.label}</span>
        </button>
      ))}
      
      <button
        className={`tab-bar-item ${activeTab === 'profile' ? 'active' : ''}`}
        onClick={() => handleTabClick('profile')}
      >
        <div className="tab-bar-icon" style={{ 
          width: '24px', 
          height: '24px', 
          borderRadius: '12px',
          background: activeTab === 'profile' 
            ? 'rgba(255,255,255,0.3)' 
            : 'linear-gradient(135deg, var(--ios26-blue), var(--ios26-purple))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '11px',
          fontWeight: '600',
          color: 'white'
        }}>
          {initials}
        </div>
        <span className="tab-bar-label">Профиль</span>
      </button>
    </nav>
  );
});

export default MobilePageHeader;
