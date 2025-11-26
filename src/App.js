import React from 'react';
import { useAuth } from './hooks';
import { AppProvider, useApp } from './context/AppContext';
import { LoginPage, Sidebar, MobileHeader, TabBar, LoadingSpinner, EmptyState } from './components';
import { 
  AdminDashboard, 
  StudentDashboard, 
  ClubsPage, 
  EventsPage,
  SchedulePage,
  FacultiesPage,
  GroupsPage,
  UsersPage
} from './pages';
import './styles/index.css';

/**
 * Main App Component
 */
function App() {
  const { user, loading, login, logout } = useAuth();

  if (loading) {
    return <LoadingSpinner text="Загрузка..." />;
  }

  if (!user) {
    return <LoginPage onLogin={login} />;
  }

  return (
    <AppProvider user={user} logout={logout}>
      <AppLayout />
    </AppProvider>
  );
}

/**
 * App Layout with Navigation
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
 * Main Content Area - renders pages based on active tab
 */
function MainArea() {
  const { user, activeTab } = useApp();

  const renderContent = () => {
    // Admin pages
    if (user.role === 'main_admin') {
      switch (activeTab) {
        case 'dashboard':
          return <AdminDashboard />;
        case 'clubs':
          return <ClubsPage canEdit={true} userId={user.id} />;
        case 'events':
          return <EventsPage canEdit={true} userId={user.id} />;
        case 'schedule':
          return <SchedulePage />;
        case 'faculties':
          return <FacultiesPage />;
        case 'groups':
          return <GroupsPage />;
        case 'users':
          return <UsersPage />;
        default:
          return <AdminDashboard />;
      }
    }

    // Student pages
    if (user.role === 'student') {
      switch (activeTab) {
        case 'dashboard':
          return <StudentDashboard userId={user.id} />;
        case 'clubs':
          return <ClubsPage canEdit={false} userId={user.id} />;
        case 'events':
          return <EventsPage canEdit={false} userId={user.id} />;
        case 'schedule':
          return <SchedulePage />;
        default:
          return <StudentDashboard userId={user.id} />;
      }
    }

    // Club admin pages
    if (user.role === 'club_admin') {
      switch (activeTab) {
        case 'dashboard':
          return <AdminDashboard />;
        case 'clubs':
          return <ClubsPage canEdit={true} userId={user.id} />;
        case 'events':
          return <EventsPage canEdit={true} userId={user.id} />;
        default:
          return <AdminDashboard />;
      }
    }

    // Group leader pages
    if (user.role === 'group_leader') {
      switch (activeTab) {
        case 'dashboard':
          return <StudentDashboard userId={user.id} />;
        case 'schedule':
          return <SchedulePage />;
        default:
          return <StudentDashboard userId={user.id} />;
      }
    }

    // Fallback
    return (
      <EmptyState 
        icon="📋" 
        title="Раздел в разработке" 
        text="Скоро здесь появится контент" 
      />
    );
  };

  return (
    <main className="main-area">
      {renderContent()}
    </main>
  );
}

export default App;
