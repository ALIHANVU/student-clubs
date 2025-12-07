/**
 * AppContext — Оптимизированный
 */
import React, { createContext, useContext, useState, useMemo } from 'react';

const AppContext = createContext(null);

export function AppProvider({ children, user, logout, updateUser }) {
  const [activeTab, setActiveTab] = useState('dashboard');

  // Мемоизируем значение контекста
  const value = useMemo(() => ({
    user,
    logout,
    updateUser,
    activeTab,
    setActiveTab,
  }), [user, logout, updateUser, activeTab]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}

export default AppContext;
