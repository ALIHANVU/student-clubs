import React, { useState } from 'react';
import { useAuth } from './hooks';
import { AppProvider, useApp } from './context/AppContext';
import { NotificationProvider } from './context/NotificationContext';
import { LoginPage, Sidebar, MobileHeader, TabBar, LoadingSpinner, EmptyState, GlobalSearch } from './components';
import { 
  AdminDashboard, 
  StudentDashboard, 
  ClubsPage,
  ClubDetailPage,
  EventsPage,
  EventDetailPage,
  ProfilePage,
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
    <NotificationProvider>
      <AppProvider user={user} logout={logout}>
        <AppLayout />
      </AppProvider>
    </NotificationProvider>
  );
}

/**
 * App Layout with Navigation
 */
function AppLayout() {
  const [showSearch, setShowSearch] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar onSearchClick={() => setShowSearch(true)} />
      <MobileHeader />
      <MainArea onSearchClick={() => setShowSearch(true)} />
      <TabBar />
      <GlobalSearch isOpen={showSearch} onClose={() => setShowSearch(false)} />
    </div>
  );
}

/**
 * Main Content Area - renders pages based on active tab
 */
function MainArea({ onSearchClick }) {
  const { user, activeTab, setActiveTab } = useApp();
  
  // Detail view states
  const [detailView, setDetailView] = useState(null); // { type: 'club'|'event', id: string }

  const openClubDetail = (clubId) => {
    setDetailView({ type: 'club', id: clubId });
  };

  const openEventDetail = (eventId) => {
    setDetailView({ type: 'event', id: eventId });
  };

  const closeDetail = () => {
    setDetailView(null);
  };

  // Render detail pages
  if (detailView) {
    if (detailView.type === 'club') {
      return (
        <main className="main-area">
          <ClubDetailPage 
            clubId={detailView.id} 
            onBack={closeDetail}
            onEventClick={openEventDetail}
          />
        </main>
      );
    }
    if (detailView.type === 'event') {
      return (
        <main className="main-area">
          <EventDetailPage 
            eventId={detailView.id} 
            onBack={closeDetail}
            onClubClick={openClubDetail}
          />
        </main>
      );
    }
  }

  const renderContent = () => {
    // Profile page (common for all roles)
    if (activeTab === 'profile') {
      return <ProfilePage />;
    }

    // Admin pages
    if (user.role === 'main_admin') {
      switch (activeTab) {
        case 'dashboard':
          return <AdminDashboard />;
        case 'clubs':
          return <ClubsPage canEdit={true} userId={user.id} onClubClick={openClubDetail} />;
        case 'events':
          return <EventsPage canEdit={true} userId={user.id} onEventClick={openEventDetail} />;
        case 'schedule':
          return <SchedulePage canEdit={true} />;
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
          return <ClubsPage canEdit={false} userId={user.id} onClubClick={openClubDetail} />;
        case 'events':
          return <EventsPage canEdit={false} userId={user.id} onEventClick={openEventDetail} />;
        case 'schedule':
          return <SchedulePage canEdit={false} />;
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
          return <ClubsPage canEdit={true} userId={user.id} onClubClick={openClubDetail} />;
        case 'events':
          return <EventsPage canEdit={true} userId={user.id} onEventClick={openEventDetail} />;
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
          return <SchedulePage canEdit={true} />;
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
