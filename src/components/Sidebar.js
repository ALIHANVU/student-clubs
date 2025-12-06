import React, { memo } from 'react';
import { useApp } from '../context/AppContext';
import { NAV_ITEMS } from '../utils/constants';
import { getInitials } from '../utils/helpers';
import { haptic } from '../utils/haptic';

export const Sidebar = memo(function Sidebar() {
  const { user, activeTab, setActiveTab, logout } = useApp();

  const items = NAV_ITEMS[user.role] || NAV_ITEMS.student;
  const initials = getInitials(user.full_name);

  const handleNavClick = (id) => {
    haptic.light();
    setActiveTab(id);
  };

  const handleLogout = () => {
    haptic.medium();
    logout();
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-inner">
        {/* Logo */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">🎓</div>
            <span className="sidebar-logo-text">UniClub</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {items.map((item) => (
            <div
              key={item.id}
              className={`sidebar-nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => handleNavClick(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </div>
          ))}
        </nav>

        {/* Footer with user info */}
        <div className="sidebar-footer">
          <div
            className={`sidebar-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => handleNavClick('profile')}
          >
            <div className="nav-icon" style={{
              width: '28px',
              height: '28px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, var(--ios26-blue), var(--ios26-purple))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: '600',
              color: 'white'
            }}>
              {initials}
            </div>
            <div style={{ flex: 1 }}>
              <div className="nav-label" style={{ marginBottom: '2px' }}>{user.full_name}</div>
              <div style={{ fontSize: '12px', color: 'var(--label-tertiary)', fontWeight: 400 }}>
                {user.email}
              </div>
            </div>
          </div>
          
          <div
            className="sidebar-nav-item"
            onClick={handleLogout}
            style={{ marginTop: 'var(--spacing-sm)', color: 'var(--ios26-red)' }}
          >
            <span className="nav-icon">🚪</span>
            <span className="nav-label">Выйти</span>
          </div>
        </div>
      </div>
    </aside>
  );
});

export default Sidebar;
