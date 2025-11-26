import React, { createContext, useContext, useState, useCallback } from 'react';

// App Context
const AppContext = createContext(null);

/**
 * App Provider component
 */
export function AppProvider({ children, user, logout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showUserMenu, setShowUserMenu] = useState(false);

  const toggleUserMenu = useCallback(() => {
    setShowUserMenu(prev => !prev);
  }, []);

  const closeUserMenu = useCallback(() => {
    setShowUserMenu(false);
  }, []);

  const value = {
    user,
    logout,
    activeTab,
    setActiveTab,
    showUserMenu,
    toggleUserMenu,
    closeUserMenu
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

/**
 * Hook to use App context
 */
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}

export default AppContext;
