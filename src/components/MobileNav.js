import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { NAV_ITEMS, TAB_BAR_ITEMS, ROLE_NAMES } from '../utils/constants';
import { getInitials } from '../utils/helpers';
import { Overlay } from './UI';

/**
 * Mobile Header Component - С‡РёСЃС‚С‹Р№ Р·Р°РіРѕР»РѕРІРѕРє РїРѕ С†РµРЅС‚СЂСѓ
 */
export function MobileHeader() {
  const { user, activeTab } = useApp();

  const navItems = NAV_ITEMS[user.role] || NAV_ITEMS.student;
  const currentLabel = navItems.find(i => i.id === activeTab)?.label || 'UniClub';

  return (
    <header className="mobile-header">
      <span className="mobile-title">{currentLabel}</span>
    </header>
  );
}

/**
 * Mobile Tab Bar Component (iOS Style) - СЃ РїСЂРѕС„РёР»РµРј РІ РєРѕРЅС†Рµ
 */
export function TabBar() {
  const { user, activeTab, setActiveTab, logout } = useApp();
  const [showProfile, setShowProfile] = useState(false);

  const items = TAB_BAR_ITEMS[user.role] || TAB_BAR_ITEMS.student;
  const initials = getInitials(user.full_name);
  const roleName = ROLE_NAMES[user.role];

  return (
    <>
      {/* Profile Modal */}
      {showProfile && (
        <>
          <Overlay visible={showProfile} onClick={() => setShowProfile(false)} />
          <div className="profile-sheet">
            <div className="profile-sheet-handle" />
            <div className="profile-sheet-content">
              <div className="profile-sheet-avatar">{initials}</div>
              <div className="profile-sheet-name">{user.full_name}</div>
              <div className="profile-sheet-email">{user.email}</div>
              <div className="profile-sheet-role">{roleName}</div>
              <button className="profile-sheet-logout" onClick={logout}>
                <span>рџљЄ</span>
                <span>Р’С‹Р№С‚Рё РёР· Р°РєРєР°СѓРЅС‚Р°</span>
              </button>
            </div>
          </div>
        </>
      )}

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
          
          {/* Profile Tab */}
          <div
            className={`tab-bar-item ${showProfile ? 'active' : ''}`}
            onClick={() => setShowProfile(!showProfile)}
          >
            <div className="tab-bar-avatar">{initials}</div>
            <span className="tab-bar-item-label">РџСЂРѕС„РёР»СЊ</span>
          </div>
        </div>
      </nav>
    </>
  );
}

export default MobileHeader;
