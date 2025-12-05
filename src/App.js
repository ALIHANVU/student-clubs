import React from 'react';
import { useAuth, useOnlineStatus, useIsMobile } from './hooks';
import { AppProvider } from './context/AppContext';
import { NotificationProvider } from './context/NotificationContext';
import { LoginPage } from './components/Login';
import { Sidebar } from './components/Sidebar';
import { TabBar } from './components/MobileNav';
import { LoadingSpinner } from './components/UI';
import { AdminDashboard, StudentDashboard, ClubsPage, EventsPage, SchedulePage, FacultiesPage, UsersPage, ProfilePage } from './pages';

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

function MainLayout({ isMobile, isOnline }) {
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
}

function PageRouter() {
  const { user, activeTab } = React.useContext(require('./context/AppContext').default);

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
      case 'faculties':
        return <FacultiesPage />;
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

  return renderPage();
}

function App() {
  return (
    <NotificationProvider>
      <AppContent />
    </NotificationProvider>
  );
}

export default App;
