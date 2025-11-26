import React from 'react';
import { useApp } from '../context/AppContext';
import { NAV_ITEMS, TAB_BAR_ITEMS, ROLE_NAMES } from '../utils/constants';
import { getInitials } from '../utils/helpers';
import { Overlay } from './UI';

/**
 * Mobile Header Component
 */
export function MobileHeader() {
  const { user, activeTab, showUserMenu, toggleUserMenu, closeUserMenu, logout } = useApp();

  const navItems = NAV_ITEMS[user.role] || NAV_ITEMS.student;
  const currentLabel = navItems.find(i => i.id === activeTab)?.label || 'UniClub';
  const initials = getInitials(user.full_name);
  const roleName = ROLE_NAMES[user.role];

  return (
    <>
      <header className="mobile-header">
        <span className="mobile-title">{currentLabel}</span>
        <div className="mobile-user-btn" onClick={toggleUserMenu}>
          {initials}
        </div>
      </header>

      {/* User Menu Dropdown */}
      {showUserMenu && (
        <>
          <Overlay visible={showUserMenu} onClick={closeUserMenu} />
          <div 
            className="dropdown" 
            style={{ 
              position: 'fixed', 
              top: 'calc(var(--header-height) + var(--safe-top) + 8px)', 
              right: '16px', 
              zIndex: 200 
            }}
          >
            <div style={{ 
              padding: '16px', 
              borderBottom: '0.5px solid var(--separator)' 
            }}>
              <div style={{ 
                fontWeight: 600, 
                fontSize: 'var(--font-base)', 
                marginBottom: '4px' 
              }}>
                {user.full_name}
              </div>
              <div style={{ 
                fontSize: 'var(--font-sm)', 
                color: 'var(--text-secondary)', 
                marginBottom: '2px' 
              }}>
                {user.email}
              </div>
              <div style={{ 
                fontSize: 'var(--font-xs)', 
                color: 'var(--text-tertiary)' 
              }}>
                {roleName}
              </div>
            </div>
            <div className="dropdown-item danger" onClick={() => { closeUserMenu(); logout(); }}>
              <span>🚪</span>
              <span>Выйти</span>
            </div>
          </div>
        </>
      )}
    </>
  );
}

/**
 * Mobile Tab Bar Component (iOS Style)
 */
export function TabBar() {
  const { user, activeTab, setActiveTab } = useApp();

  const items = TAB_BAR_ITEMS[user.role] || TAB_BAR_ITEMS.student;

  return (
    <nav className="tab-bar">
      <div className="tab-bar-items">
        {items.map((item) => (
          <div
            key={item.id}
            className={`tab-bar-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            <span className="tab-bar-item-icon">{item.icon}</span>
            <span className="tab-bar-item-label">{item.label}</span>
          </div>
        ))}
      </div>
    </nav>
  );
}

export default MobileHeader;
