/**
 * AppContext — Оптимизированный с разделением контекстов
 */
import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';

// Разделяем контексты для уменьшения ре-рендеров
const UserContext = createContext(null);
const TabContext = createContext(null);
const ActionsContext = createContext(null);

export function AppProvider({ children, user, logout, updateUser }) {
  const [activeTab, setActiveTab] = useState('dashboard');

  // Мемоизируем действия отдельно — они никогда не меняются
  const actions = useMemo(() => ({ logout, updateUser }), [logout, updateUser]);
  
  // Tab state отдельно
  const tabState = useMemo(() => ({ activeTab, setActiveTab }), [activeTab]);

  return (
    <UserContext.Provider value={user}>
      <TabContext.Provider value={tabState}>
        <ActionsContext.Provider value={actions}>
          {children}
        </ActionsContext.Provider>
      </TabContext.Provider>
    </UserContext.Provider>
  );
}

// Хуки для каждого контекста — компоненты подписываются только на нужные данные
export function useUser() {
  const user = useContext(UserContext);
  if (user === undefined) throw new Error('useUser must be used within AppProvider');
  return user;
}

export function useTab() {
  const context = useContext(TabContext);
  if (!context) throw new Error('useTab must be used within AppProvider');
  return context;
}

export function useActions() {
  const context = useContext(ActionsContext);
  if (!context) throw new Error('useActions must be used within AppProvider');
  return context;
}

// Комбинированный хук для обратной совместимости
export function useApp() {
  const user = useUser();
  const { activeTab, setActiveTab } = useTab();
  const { logout, updateUser } = useActions();
  
  return useMemo(() => ({
    user, activeTab, setActiveTab, logout, updateUser
  }), [user, activeTab, setActiveTab, logout, updateUser]);
}

export default AppProvider;
