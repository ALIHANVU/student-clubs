import React from 'react';
import { useApp } from '../context/AppContext';
import { NAV_ITEMS, ROLE_NAMES } from '../utils/constants';
import { getInitials } from '../utils/helpers';
import { IconByName, LogoutIcon } from './Icons';

/**
 * Desktop Sidebar
 */
export function Sidebar() {
  const { user, logout, activeTab, setActiveTab, showUserMenu, toggleUserMenu } = useApp();

  const navItems = NAV_ITEMS[user.role] || NAV_ITEMS.student;
  const initials = getInitials(user.full_name);
  const roleName = ROLE_NAMES[user.role];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <IconByName name="building" size={28} />
          </div>
          <div className="sidebar-title">
            <h2>UniClub</h2>
            <p>Студенческая платформа</p>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          <div className="nav-section-title">Навигация</div>
          {navItems.map((item) => (
            <div
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span className="nav-item-icon">
                <IconByName name={item.icon} size={20} />
              </span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="user-card" onClick={toggleUserMenu}>
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <div className="user-name">{user.full_name}</div>
            <div className="user-role">{roleName}</div>
          </div>
        </div>

        {showUserMenu && (
          <div className="dropdown" style={{ bottom: 'calc(100% + 8px)', left: 0, right: 0 }}>
            <div className="dropdown-item danger" onClick={logout}>
              <LogoutIcon size={18} />
              <span>Выйти</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
