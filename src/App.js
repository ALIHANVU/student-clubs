import React from 'react';
import { useAuth } from './hooks';
import { AppProvider, useApp } from './context/AppContext';
import { NotificationProvider } from './context/NotificationContext';
import { LoginPage, Sidebar, MobileHeader, TabBar, LoadingSpinner } from './components';
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
 * App Layout
 */
function AppLayout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <MobileHeader />
      <MainArea />
      <TabBar />
    </div>
  );
}

/**
 * Main Content Area
 */
function MainArea() {
  const { user, activeTab } = useApp();

  const renderContent = () => {
    // Профиль - общий для всех
    if (activeTab === 'profile') {
      return <ProfilePage />;
    }

    // Главный админ
    if (user.role === 'main_admin') {
      switch (activeTab) {
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
      switch (activeTab) {
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
      switch (activeTab) {
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
      switch (activeTab) {
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
      {renderContent()}
    </main>
  );
}

export default App;
