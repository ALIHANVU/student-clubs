/**
 * App.js — Обновлённый (без отдельной FacultiesPage)
 */
import React, { Suspense, lazy, memo } from 'react';
import { useAuth, useOnlineStatus, useIsMobile } from './hooks';
import { AppProvider, useApp } from './context/AppContext';
import { NotificationProvider } from './context/NotificationContext';
import { LoginPage } from './components/Login';
import { Sidebar, TabBar } from './components/Navigation';
import { LoadingSpinner } from './components/UI';

// Lazy load всех страниц
const AdminDashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.AdminDashboard })));
const StudentDashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.StudentDashboard })));
const ClubsPage = lazy(() => import('./pages/ClubsPage'));
const EventsPage = lazy(() => import('./pages/EventsPage'));
const SchedulePage = lazy(() => import('./pages/SchedulePage'));
const UsersPage = lazy(() => import('./pages/UsersPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));

function AppContent() {
  const { user, loading, login, logout, updateUser } = useAuth();
  const isOnline = useOnlineStatus();
  const isMobile = useIsMobile();

  if (loading) {
    return <LoadingSpinner text="Загрузка..." />;
  }

  if (!user) {
    return <LoginPage onLogin={login} />;
  }

  return (
    <AppProvider user={user} logout={logout} updateUser={updateUser}>
      <MainLayout isMobile={isMobile} isOnline={isOnline} />
    </AppProvider>
  );
}

const MainLayout = memo(function MainLayout({ isMobile, isOnline }) {
  return (
    <div className="app-layout">
      {!isMobile && <Sidebar />}
      
      <main className="main-content">
        {!isOnline && (
          <div className="offline-banner">
            <span>📡</span>
            <span>Нет подключения к интернету</span>
          </div>
        )}
        <PageRouter />
      </main>
      
      {isMobile && <TabBar />}
    </div>
  );
});

// Простой лоадер для страниц
const PageLoader = memo(function PageLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
      <div className="spinner" />
    </div>
  );
});

const PageRouter = memo(function PageRouter() {
  const { user, activeTab } = useApp();

  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard':
        return user.role === 'main_admin' || user.role === 'club_admin' 
          ? <AdminDashboard /> 
          : <StudentDashboard />;
      case 'clubs':
        return <ClubsPage />;
      case 'events':
        return <EventsPage />;
      case 'schedule':
        return <SchedulePage />;
      case 'users':
        return <UsersPage />;
      case 'profile':
        return <ProfilePage />;
      default:
        return user.role === 'main_admin' || user.role === 'club_admin' 
          ? <AdminDashboard /> 
          : <StudentDashboard />;
    }
  };

  return (
    <Suspense fallback={<PageLoader />}>
      {renderPage()}
    </Suspense>
  );
});

function App() {
  return (
    <NotificationProvider>
      <AppContent />
    </NotificationProvider>
  );
}

export default App;
