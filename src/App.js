import React, { useState, useEffect, useRef } from 'react';
import { useAuth, useOnlineStatus } from './hooks';
import { AppProvider, useApp } from './context/AppContext';
import { NotificationProvider } from './context/NotificationContext';
import { LoginPage, Sidebar, TabBar, LoadingSpinner, InstallBanner, UpdateBanner } from './components';
import { 
  AdminDashboard, 
  StudentDashboard, 
  ClubsPage,
  EventsPage,
  ProfilePage,
  SchedulePage,
  FacultiesPage,
  UsersPage
} from './pages';
import './styles/index.css';

/**
 * Main App Component
 */
function App() {
  const { user, loading, login, logout, updateUser } = useAuth();

  if (loading) {
    return <LoadingSpinner text="Загрузка..." />;
  }

  if (!user) {
    return <LoginPage onLogin={login} />;
  }

  return (
    <NotificationProvider>
      <AppProvider user={user} logout={logout} updateUser={updateUser}>
        <AppLayout />
      </AppProvider>
    </NotificationProvider>
  );
}

/**
 * App Layout with online status
 */
function AppLayout() {
  const isOnline = useOnlineStatus();

  return (
    <div className="app-layout">
      <Sidebar />
      <MainArea />
      <TabBar />
      
      {/* PWA Install Banner */}
      <InstallBanner />
      
      {/* Update Available Banner */}
      <UpdateBanner />
      
      {/* Global offline indicator */}
      {!isOnline && (
        <div className="global-offline-indicator">
          <span>Офлайн режим</span>
        </div>
      )}
    </div>
  );
}

/**
 * Main Content Area with page transitions
 */
function MainArea() {
  const { user, activeTab } = useApp();
  const [displayedTab, setDisplayedTab] = useState(activeTab);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState('forward');
  const prevTab = useRef(activeTab);

  // Определяем направление анимации
  const tabOrder = ['dashboard', 'clubs', 'events', 'schedule', 'faculties', 'users', 'profile'];
  
  useEffect(() => {
    if (activeTab !== prevTab.current) {
      const prevIndex = tabOrder.indexOf(prevTab.current);
      const newIndex = tabOrder.indexOf(activeTab);
      
      setDirection(newIndex > prevIndex ? 'forward' : 'backward');
      setIsAnimating(true);
      
      // Небольшая задержка для анимации выхода
      const timer = setTimeout(() => {
        setDisplayedTab(activeTab);
        prevTab.current = activeTab;
        
        // Сбрасываем анимацию
        setTimeout(() => setIsAnimating(false), 300);
      }, 50);
      
      return () => clearTimeout(timer);
    }
  }, [activeTab]);

  const renderContent = () => {
    const tab = displayedTab;
    
    // Профиль - общий для всех
    if (tab === 'profile') {
      return <ProfilePage />;
    }

    // Главный админ
    if (user.role === 'main_admin') {
      switch (tab) {
        case 'dashboard':
          return <AdminDashboard />;
        case 'clubs':
          return <ClubsPage />;
        case 'events':
          return <EventsPage />;
        case 'schedule':
          return <SchedulePage />;
        case 'faculties':
          return <FacultiesPage />;
        case 'users':
          return <UsersPage />;
        default:
          return <AdminDashboard />;
      }
    }

    // Староста
    if (user.role === 'group_leader') {
      switch (tab) {
        case 'dashboard':
          return <StudentDashboard />;
        case 'schedule':
          return <SchedulePage />;
        case 'clubs':
          return <ClubsPage />;
        case 'events':
          return <EventsPage />;
        default:
          return <StudentDashboard />;
      }
    }

    // Студент
    if (user.role === 'student') {
      switch (tab) {
        case 'dashboard':
          return <StudentDashboard />;
        case 'clubs':
          return <ClubsPage />;
        case 'events':
          return <EventsPage />;
        case 'schedule':
          return <SchedulePage />;
        default:
          return <StudentDashboard />;
      }
    }

    // Админ клуба
    if (user.role === 'club_admin') {
      switch (tab) {
        case 'dashboard':
          return <AdminDashboard />;
        case 'clubs':
          return <ClubsPage />;
        case 'events':
          return <EventsPage />;
        default:
          return <AdminDashboard />;
      }
    }

    return <StudentDashboard />;
  };

  return (
    <main className="main-area">
      <div 
        className={`page-wrapper ${isAnimating ? 'animating' : ''} ${direction}`}
        key={displayedTab}
      >
        {renderContent()}
      </div>
    </main>
  );
}

export default App;
