import React from 'react';
import { useApp } from '../context/AppContext';
import { TAB_BAR_ITEMS } from '../utils/constants';
import { getInitials } from '../utils/helpers';
import { haptic } from '../utils/haptic';

/**
 * Mobile Header - только safe area
 */
export function MobileHeader() {
  return <div className="mobile-header" />;
}

/**
 * Mobile Tab Bar (iOS Style)
 */
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
        
        {/* Profile Tab */}
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

export default MobileHeader;
