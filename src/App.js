import React, { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from './supabaseClient';
import './App.css';

// Контекст приложения
const AppContext = createContext();

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('currentUser', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p className="text-secondary">Загрузка...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLogin={login} />;
  }

  return (
    <AppContext.Provider value={{ user, logout, sidebarOpen, setSidebarOpen }}>
      <div className="app-layout">
        <Sidebar />
        <MainContent />
      </div>
    </AppContext.Provider>
  );
}

// ========================================
// СТРАНИЦА ВХОДА
// ========================================

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('password_hash', password)
        .single();

      if (error || !data) {
        setError('Неверный email или пароль');
        setLoading(false);
        return;
      }

      onLogin(data);
    } catch (err) {
      setError('Ошибка подключения к серверу');
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">🎓</div>
          <h1>UniClub</h1>
          <p>Платформа студенческой жизни</p>
        </div>

        {error && (
          <div className="error-alert">
            <span>⚠️</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>

          <div className="form-field">
            <label className="form-label">Пароль</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? '⏳ Вход...' : '🚀 Войти'}
          </button>
        </form>

        <div className="demo-credentials">
          <p>Для тестирования:</p>
          <p><code>admin@university.com</code> / <code>admin123</code></p>
        </div>
      </div>
    </div>
  );
}

// ========================================
// БОКОВАЯ ПАНЕЛЬ
// ========================================

function Sidebar() {
  const { user, logout, sidebarOpen, setSidebarOpen } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showUserMenu, setShowUserMenu] = useState(false);

  const roleConfig = {
    main_admin: {
      title: 'Главный админ',
      navItems: [
        { id: 'dashboard', icon: '📊', label: 'Дашборд' },
        { id: 'faculties', icon: '🏛️', label: 'Факультеты' },
        { id: 'clubs', icon: '🎭', label: 'Клубы' },
        { id: 'users', icon: '👥', label: 'Пользователи' },
        { id: 'events', icon: '📅', label: 'Мероприятия' },
        { id: 'schedule', icon: '📚', label: 'Расписание' },
      ]
    },
    club_admin: {
      title: 'Админ клуба',
      navItems: [
        { id: 'dashboard', icon: '📊', label: 'Обзор' },
        { id: 'events', icon: '📅', label: 'Мероприятия' },
        { id: 'members', icon: '👥', label: 'Участники' },
      ]
    },
    group_leader: {
      title: 'Староста',
      navItems: [
        { id: 'dashboard', icon: '📊', label: 'Обзор' },
        { id: 'schedule', icon: '📚', label: 'Расписание' },
        { id: 'students', icon: '👥', label: 'Студенты' },
      ]
    },
    student: {
      title: 'Студент',
      navItems: [
        { id: 'dashboard', icon: '🏠', label: 'Главная' },
        { id: 'clubs', icon: '🎭', label: 'Клубы' },
        { id: 'events', icon: '📅', label: 'Мероприятия' },
        { id: 'schedule', icon: '📚', label: 'Расписание' },
      ]
    }
  };

  const config = roleConfig[user.role] || roleConfig.student;
  const initials = user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2);

  return (
    <>
      {/* Мобильный хедер */}
      <div className="mobile-header">
        <button className="mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? '✕' : '☰'}
        </button>
        <span className="text-gradient" style={{ fontWeight: 700 }}>UniClub</span>
        <div style={{ width: 44 }}></div>
      </div>

      {/* Оверлей для мобильного меню */}
      {sidebarOpen && (
        <div 
          style={{ 
            position: 'fixed', 
            inset: 0, 
            background: 'rgba(0,0,0,0.5)', 
            zIndex: 99 
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🎓</div>
          <div className="sidebar-logo-text">
            <h2>UniClub</h2>
            <p>Студенческая жизнь</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-section-title">Меню</div>
            {config.navItems.map(item => (
              <div
                key={item.id}
                className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab(item.id);
                  setSidebarOpen(false);
                }}
              >
                <span className="nav-item-icon">{item.icon}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="user-card" onClick={() => setShowUserMenu(!showUserMenu)} style={{ position: 'relative' }}>
            <div className="user-avatar">{initials}</div>
            <div className="user-details">
              <div className="user-name">{user.full_name}</div>
              <div className="user-role">{config.title}</div>
            </div>

            {showUserMenu && (
              <div className="user-dropdown">
                <div className="dropdown-item">
                  <span>📧</span>
                  <span style={{ fontSize: '0.8rem' }}>{user.email}</span>
                </div>
                <div className="dropdown-item danger" onClick={logout}>
                  <span>🚪</span>
                  <span>Выйти</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      <ContentRouter activeTab={activeTab} setActiveTab={setActiveTab} />
    </>
  );
}

// ========================================
// РОУТЕР КОНТЕНТА
// ========================================

function ContentRouter({ activeTab, setActiveTab }) {
  const { user } = useContext(AppContext);

  const renderContent = () => {
    // Главный администратор
    if (user.role === 'main_admin') {
      switch (activeTab) {
        case 'dashboard': return <AdminDashboard />;
        case 'faculties': return <FacultiesPage />;
        case 'clubs': return <ClubsPage isAdmin={true} />;
        case 'users': return <UsersPage />;
        case 'events': return <EventsPage isAdmin={true} userId={user.id} />;
        case 'schedule': return <ScheduleAdminPage />;
        default: return <AdminDashboard />;
      }
    }

    // Администратор клуба
    if (user.role === 'club_admin') {
      switch (activeTab) {
        case 'dashboard': return <ClubAdminDashboard userId={user.id} />;
        case 'events': return <ClubEventsPage userId={user.id} />;
        case 'members': return <ClubMembersPage userId={user.id} />;
        default: return <ClubAdminDashboard userId={user.id} />;
      }
    }

    // Староста
    if (user.role === 'group_leader') {
      switch (activeTab) {
        case 'dashboard': return <LeaderDashboard userId={user.id} />;
        case 'schedule': return <LeaderSchedulePage userId={user.id} />;
        case 'students': return <LeaderStudentsPage userId={user.id} />;
        default: return <LeaderDashboard userId={user.id} />;
      }
    }

    // Студент
    switch (activeTab) {
      case 'dashboard': return <StudentDashboard userId={user.id} />;
      case 'clubs': return <ClubsPage isAdmin={false} userId={user.id} />;
      case 'events': return <EventsPage isAdmin={false} userId={user.id} />;
      case 'schedule': return <StudentSchedulePage userId={user.id} />;
      default: return <StudentDashboard userId={user.id} />;
    }
  };

  return <>{renderContent()}</>;
}

// ========================================
// ГЛАВНАЯ ОБЛАСТЬ
// ========================================

function MainContent() {
  return (
    <main className="main-area">
      {/* Контент рендерится через ContentRouter внутри Sidebar */}
    </main>
  );
}

// ========================================
// ДАШБОРД АДМИНА
// ========================================

function AdminDashboard() {
  const [stats, setStats] = useState({ clubs: 0, users: 0, events: 0, faculties: 0 });
  const [recentEvents, setRecentEvents] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [clubs, users, events, faculties] = await Promise.all([
      supabase.from('clubs').select('id', { count: 'exact', head: true }),
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('events').select('id', { count: 'exact', head: true }),
      supabase.from('faculties').select('id', { count: 'exact', head: true })
    ]);

    setStats({
      clubs: clubs.count || 0,
      users: users.count || 0,
      events: events.count || 0,
      faculties: faculties.count || 0
    });

    const { data: eventsData } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    setRecentEvents(eventsData || []);

    const { data: usersData } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    setRecentUsers(usersData || []);
  };

  return (
    <div className="main-content">
      <div className="main-header">
        <h1 className="page-title">📊 Дашборд</h1>
        <div className="header-actions">
          <div className="search-box">
            <span className="search-box-icon">🔍</span>
            <input type="text" placeholder="Поиск..." />
          </div>
        </div>
      </div>

      <div style={{ padding: '2rem' }}>
        {/* Статистика */}
        <div className="stats-row">
          <StatCard icon="🎭" iconClass="purple" value={stats.clubs} label="Клубов" />
          <StatCard icon="👥" iconClass="pink" value={stats.users} label="Пользователей" />
          <StatCard icon="📅" iconClass="cyan" value={stats.events} label="Мероприятий" />
          <StatCard icon="🏛️" iconClass="green" value={stats.faculties} label="Факультетов" />
        </div>

        {/* Последние события */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div className="section">
            <div className="section-header">
              <h2 className="section-title">📅 Последние мероприятия</h2>
            </div>
            <div className="list">
              {recentEvents.length === 0 ? (
                <EmptyState icon="📅" text="Нет мероприятий" />
              ) : (
                recentEvents.map(event => (
                  <div key={event.id} className="list-item">
                    <div className="list-item-icon">📅</div>
                    <div className="list-item-content">
                      <div className="list-item-title">{event.title}</div>
                      <div className="list-item-subtitle">
                        {new Date(event.event_date).toLocaleDateString('ru-RU')} • {event.location}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="section">
            <div className="section-header">
              <h2 className="section-title">👥 Новые пользователи</h2>
            </div>
            <div className="list">
              {recentUsers.length === 0 ? (
                <EmptyState icon="👥" text="Нет пользователей" />
              ) : (
                recentUsers.map(user => (
                  <div key={user.id} className="list-item">
                    <div className="list-item-icon">👤</div>
                    <div className="list-item-content">
                      <div className="list-item-title">{user.full_name}</div>
                      <div className="list-item-subtitle">{user.email}</div>
                    </div>
                    <span className="badge badge-primary">{getRoleName(user.role)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ========================================
// СТРАНИЦА ФАКУЛЬТЕТОВ
// ========================================

function FacultiesPage() {
  const [faculties, setFaculties] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadFaculties();
  }, []);

  const loadFaculties = async () => {
    const { data } = await supabase.from('faculties').select('*').order('name');
    setFaculties(data || []);
  };

  const addFaculty = async () => {
    if (!newName.trim()) return;
    await supabase.from('faculties').insert({ name: newName });
    setNewName('');
    setShowModal(false);
    loadFaculties();
  };

  const deleteFaculty = async (id, name) => {
    if (!window.confirm(`Удалить "${name}"?`)) return;
    await supabase.from('faculties').delete().eq('id', id);
    loadFaculties();
  };

  const filtered = faculties.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="main-content">
      <div className="main-header">
        <h1 className="page-title">🏛️ Факультеты</h1>
        <div className="header-actions">
          <div className="search-box">
            <span className="search-box-icon">🔍</span>
            <input 
              type="text" 
              placeholder="Поиск факультетов..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            ➕ Добавить
          </button>
        </div>
      </div>

      <div style={{ padding: '2rem' }}>
        {filtered.length === 0 ? (
          <EmptyState 
            icon="🏛️" 
            title="Нет факультетов" 
            text="Добавьте первый факультет"
            action={<button className="btn btn-primary" onClick={() => setShowModal(true)}>➕ Добавить факультет</button>}
          />
        ) : (
          <div className="cards-grid">
            {filtered.map(faculty => (
              <div key={faculty.id} className="card">
                <div className="card-image" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}>
                  🏛️
                </div>
                <div className="card-body">
                  <h3 className="card-title">{faculty.name}</h3>
                  <p className="card-description">Факультет университета</p>
                </div>
                <div className="card-footer">
                  <span className="text-muted text-sm">
                    {new Date(faculty.created_at).toLocaleDateString('ru-RU')}
                  </span>
                  <button 
                    className="btn btn-danger btn-sm"
                    onClick={() => deleteFaculty(faculty.id, faculty.name)}
                  >
                    🗑️ Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <Modal title="Новый факультет" onClose={() => setShowModal(false)}>
          <div className="form-field">
            <label className="form-label">Название факультета</label>
            <input 
              className="form-input"
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Например: Факультет информатики"
              autoFocus
            />
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Отмена</button>
            <button className="btn btn-primary" onClick={addFaculty}>Добавить</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ========================================
// СТРАНИЦА КЛУБОВ
// ========================================

function ClubsPage({ isAdmin, userId }) {
  const [clubs, setClubs] = useState([]);
  const [myClubs, setMyClubs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedClub, setSelectedClub] = useState(null);
  const [newClub, setNewClub] = useState({ name: '', description: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadClubs();
  }, []);

  const loadClubs = async () => {
    const { data: allClubs } = await supabase
      .from('clubs')
      .select('*, club_subscriptions(count)')
      .order('name');
    setClubs(allClubs || []);

    if (!isAdmin && userId) {
      const { data: subs } = await supabase
        .from('club_subscriptions')
        .select('club_id')
        .eq('student_id', userId);
      setMyClubs(subs?.map(s => s.club_id) || []);
    }
  };

  const addClub = async () => {
    if (!newClub.name.trim()) return;
    await supabase.from('clubs').insert(newClub);
    setNewClub({ name: '', description: '' });
    setShowModal(false);
    loadClubs();
  };

  const deleteClub = async (id, name) => {
    if (!window.confirm(`Удалить клуб "${name}"?`)) return;
    await supabase.from('clubs').delete().eq('id', id);
    setSelectedClub(null);
    loadClubs();
  };

  const toggleSubscription = async (clubId) => {
    if (myClubs.includes(clubId)) {
      await supabase
        .from('club_subscriptions')
        .delete()
        .eq('club_id', clubId)
        .eq('student_id', userId);
    } else {
      await supabase
        .from('club_subscriptions')
        .insert({ club_id: clubId, student_id: userId });
    }
    loadClubs();
  };

  let filtered = clubs.filter(club => 
    club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    club.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (filter === 'subscribed') {
    filtered = filtered.filter(club => myClubs.includes(club.id));
  }

  return (
    <div className="main-content">
      <div className="main-header">
        <h1 className="page-title">🎭 Клубы</h1>
        <div className="header-actions">
          <div className="search-box">
            <span className="search-box-icon">🔍</span>
            <input 
              type="text" 
              placeholder="Поиск клубов..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {isAdmin && (
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              ➕ Создать клуб
            </button>
          )}
        </div>
      </div>

      <div style={{ padding: '2rem' }}>
        {!isAdmin && (
          <div className="filters-bar">
            <div className="filter-group">
              <button 
                className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilter('all')}
              >
                Все клубы
              </button>
              <button 
                className={`btn btn-sm ${filter === 'subscribed' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilter('subscribed')}
              >
                Мои подписки
              </button>
            </div>
          </div>
        )}

        {filtered.length === 0 ? (
          <EmptyState 
            icon="🎭" 
            title={searchQuery ? 'Клубы не найдены' : 'Нет клубов'}
            text={filter === 'subscribed' ? 'Вы пока не подписаны на клубы' : 'Создайте первый клуб'}
          />
        ) : (
          <div className="cards-grid">
            {filtered.map(club => {
              const isSubscribed = myClubs.includes(club.id);
              const memberCount = club.club_subscriptions?.[0]?.count || 0;
              return (
                <div 
                  key={club.id} 
                  className={`card card-clickable ${isSubscribed ? 'card-subscribed' : ''}`}
                  onClick={() => setSelectedClub(club)}
                >
                  <div className="card-image" style={{ 
                    background: isSubscribed 
                      ? 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)' 
                      : 'linear-gradient(135deg, #475569 0%, #1e293b 100%)' 
                  }}>
                    🎭
                  </div>
                  <div className="card-body">
                    <h3 className="card-title">
                      {club.name}
                      {isSubscribed && <span className="badge badge-success">✓</span>}
                    </h3>
                    <p className="card-description">{club.description || 'Без описания'}</p>
                    <div className="card-meta">
                      <span className="card-meta-item">👥 {memberCount} участников</span>
                    </div>
                  </div>
                  {!isAdmin && (
                    <div className="card-footer">
                      <button
                        className={`btn btn-sm ${isSubscribed ? 'btn-secondary' : 'btn-primary'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSubscription(club.id);
                        }}
                      >
                        {isSubscribed ? '✓ Подписан' : '➕ Подписаться'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Модалка деталей клуба */}
      {selectedClub && (
        <ClubDetailModal 
          club={selectedClub} 
          isAdmin={isAdmin}
          isSubscribed={myClubs.includes(selectedClub.id)}
          onClose={() => setSelectedClub(null)}
          onDelete={deleteClub}
          onToggleSubscription={toggleSubscription}
        />
      )}

      {/* Модалка создания */}
      {showModal && (
        <Modal title="Новый клуб" onClose={() => setShowModal(false)}>
          <div className="form-field">
            <label className="form-label">Название</label>
            <input 
              className="form-input"
              type="text"
              value={newClub.name}
              onChange={(e) => setNewClub({ ...newClub, name: e.target.value })}
              placeholder="Например: IT-клуб"
            />
          </div>
          <div className="form-field">
            <label className="form-label">Описание</label>
            <textarea 
              className="form-input"
              value={newClub.description}
              onChange={(e) => setNewClub({ ...newClub, description: e.target.value })}
              placeholder="Краткое описание клуба..."
              rows={3}
            />
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Отмена</button>
            <button className="btn btn-primary" onClick={addClub}>Создать</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function ClubDetailModal({ club, isAdmin, isSubscribed, onClose, onDelete, onToggleSubscription }) {
  const [members, setMembers] = useState([]);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    loadDetails();
  }, [club.id]);

  const loadDetails = async () => {
    const [membersData, eventsData] = await Promise.all([
      supabase.from('club_subscriptions').select('*, users(full_name, email)').eq('club_id', club.id),
      supabase.from('events').select('*').eq('club_id', club.id).order('event_date', { ascending: false }).limit(5)
    ]);
    setMembers(membersData.data || []);
    setEvents(eventsData.data || []);
  };

  return (
    <Modal title={club.name} onClose={onClose} large>
      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>📝 Описание</h4>
        <p>{club.description || 'Описание отсутствует'}</p>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>👥 Участники ({members.length})</h4>
        {members.length === 0 ? (
          <p className="text-muted">Пока нет участников</p>
        ) : (
          <div className="list">
            {members.slice(0, 5).map(m => (
              <div key={m.id} className="list-item">
                <div className="list-item-icon">👤</div>
                <div className="list-item-content">
                  <div className="list-item-title">{m.users.full_name}</div>
                  <div className="list-item-subtitle">{m.users.email}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>📅 Мероприятия ({events.length})</h4>
        {events.length === 0 ? (
          <p className="text-muted">Пока нет мероприятий</p>
        ) : (
          <div className="list">
            {events.map(e => (
              <div key={e.id} className="list-item">
                <div className="list-item-icon">📅</div>
                <div className="list-item-content">
                  <div className="list-item-title">{e.title}</div>
                  <div className="list-item-subtitle">
                    {new Date(e.event_date).toLocaleDateString('ru-RU')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="modal-footer">
        {isAdmin ? (
          <button className="btn btn-danger" onClick={() => onDelete(club.id, club.name)}>
            🗑️ Удалить клуб
          </button>
        ) : (
          <button 
            className={`btn ${isSubscribed ? 'btn-secondary' : 'btn-success'}`}
            onClick={() => {
              onToggleSubscription(club.id);
              onClose();
            }}
          >
            {isSubscribed ? '✓ Отписаться' : '➕ Подписаться'}
          </button>
        )}
        <button className="btn btn-secondary" onClick={onClose}>Закрыть</button>
      </div>
    </Modal>
  );
}

// ========================================
// СТРАНИЦА ПОЛЬЗОВАТЕЛЕЙ
// ========================================

function UsersPage() {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', password_hash: '', full_name: '', role: 'student' });
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const { data } = await supabase.from('users').select('*').order('full_name');
    setUsers(data || []);
  };

  const addUser = async () => {
    if (!newUser.email.trim() || !newUser.full_name.trim()) return;
    await supabase.from('users').insert(newUser);
    setNewUser({ email: '', password_hash: '', full_name: '', role: 'student' });
    setShowModal(false);
    loadUsers();
  };

  const deleteUser = async (id, name) => {
    if (!window.confirm(`Удалить "${name}"?`)) return;
    await supabase.from('users').delete().eq('id', id);
    loadUsers();
  };

  let filtered = users.filter(u =>
    u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (roleFilter !== 'all') {
    filtered = filtered.filter(u => u.role === roleFilter);
  }

  return (
    <div className="main-content">
      <div className="main-header">
        <h1 className="page-title">👥 Пользователи</h1>
        <div className="header-actions">
          <div className="search-box">
            <span className="search-box-icon">🔍</span>
            <input 
              type="text" 
              placeholder="Поиск пользователей..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            ➕ Добавить
          </button>
        </div>
      </div>

      <div style={{ padding: '2rem' }}>
        <div className="filters-bar">
          <div className="filter-group">
            {['all', 'main_admin', 'club_admin', 'group_leader', 'student'].map(role => (
              <button 
                key={role}
                className={`btn btn-sm ${roleFilter === role ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setRoleFilter(role)}
              >
                {role === 'all' ? 'Все' : getRoleName(role)}
              </button>
            ))}
          </div>
        </div>

        <div className="list">
          {filtered.map(user => (
            <div key={user.id} className="list-item">
              <div className="list-item-icon">👤</div>
              <div className="list-item-content">
                <div className="list-item-title">{user.full_name}</div>
                <div className="list-item-subtitle">{user.email}</div>
              </div>
              <span className="badge badge-primary">{getRoleName(user.role)}</span>
              <div className="list-item-actions">
                <button className="btn btn-danger btn-sm" onClick={() => deleteUser(user.id, user.full_name)}>
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <Modal title="Новый пользователь" onClose={() => setShowModal(false)}>
          <div className="form-field">
            <label className="form-label">ФИО</label>
            <input 
              className="form-input"
              type="text"
              value={newUser.full_name}
              onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
              placeholder="Иванов Иван Иванович"
            />
          </div>
          <div className="form-field">
            <label className="form-label">Email</label>
            <input 
              className="form-input"
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              placeholder="user@university.com"
            />
          </div>
          <div className="form-field">
            <label className="form-label">Пароль</label>
            <input 
              className="form-input"
              type="text"
              value={newUser.password_hash}
              onChange={(e) => setNewUser({ ...newUser, password_hash: e.target.value })}
              placeholder="password123"
            />
          </div>
          <div className="form-field">
            <label className="form-label">Роль</label>
            <select 
              className="form-input"
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
            >
              <option value="student">Студент</option>
              <option value="group_leader">Староста</option>
              <option value="club_admin">Админ клуба</option>
              <option value="main_admin">Главный админ</option>
            </select>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Отмена</button>
            <button className="btn btn-primary" onClick={addUser}>Добавить</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ========================================
// СТРАНИЦА МЕРОПРИЯТИЙ
// ========================================

function EventsPage({ isAdmin, userId }) {
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('upcoming');
  const [newEvent, setNewEvent] = useState({
    title: '', description: '', event_date: '', location: '', is_university_wide: true
  });

  useEffect(() => {
    loadEvents();
  }, [filter]);

  const loadEvents = async () => {
    let query = supabase.from('events').select('*, clubs(name)');
    const now = new Date().toISOString();

    if (filter === 'upcoming') {
      query = query.gte('event_date', now).order('event_date', { ascending: true });
    } else if (filter === 'past') {
      query = query.lt('event_date', now).order('event_date', { ascending: false });
    } else {
      query = query.order('event_date', { ascending: true });
    }

    const { data } = await query;
    setEvents(data || []);
  };

  const addEvent = async () => {
    if (!newEvent.title.trim()) return;
    await supabase.from('events').insert({ ...newEvent, created_by: userId });
    setNewEvent({ title: '', description: '', event_date: '', location: '', is_university_wide: true });
    setShowModal(false);
    loadEvents();
  };

  const deleteEvent = async (id) => {
    if (!window.confirm('Удалить мероприятие?')) return;
    await supabase.from('events').delete().eq('id', id);
    loadEvents();
  };

  return (
    <div className="main-content">
      <div className="main-header">
        <h1 className="page-title">📅 Мероприятия</h1>
        <div className="header-actions">
          {isAdmin && (
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              ➕ Создать
            </button>
          )}
        </div>
      </div>

      <div style={{ padding: '2rem' }}>
        <div className="filters-bar">
          <div className="filter-group">
            <button 
              className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter('all')}
            >
              Все
            </button>
            <button 
              className={`btn btn-sm ${filter === 'upcoming' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter('upcoming')}
            >
              Предстоящие
            </button>
            <button 
              className={`btn btn-sm ${filter === 'past' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter('past')}
            >
              Прошедшие
            </button>
          </div>
        </div>

        {events.length === 0 ? (
          <EmptyState icon="📅" title="Нет мероприятий" text="Создайте первое мероприятие" />
        ) : (
          <div className="list">
            {events.map(event => {
              const isPast = new Date(event.event_date) < new Date();
              return (
                <div key={event.id} className="list-item" style={{ opacity: isPast ? 0.6 : 1 }}>
                  <div className="list-item-icon">{isPast ? '✓' : '📅'}</div>
                  <div className="list-item-content">
                    <div className="list-item-title">{event.title}</div>
                    <div className="list-item-subtitle">
                      📅 {new Date(event.event_date).toLocaleDateString('ru-RU')} в{' '}
                      {new Date(event.event_date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                      {event.location && ` • 📍 ${event.location}`}
                      {event.clubs && ` • 🎭 ${event.clubs.name}`}
                    </div>
                    {event.description && (
                      <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        {event.description}
                      </p>
                    )}
                  </div>
                  {event.is_university_wide && <span className="badge badge-secondary">🌐 Общее</span>}
                  {isAdmin && (
                    <div className="list-item-actions">
                      <button className="btn btn-danger btn-sm" onClick={() => deleteEvent(event.id)}>🗑️</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <Modal title="Новое мероприятие" onClose={() => setShowModal(false)}>
          <div className="form-field">
            <label className="form-label">Название</label>
            <input 
              className="form-input"
              type="text"
              value={newEvent.title}
              onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              placeholder="Название мероприятия"
            />
          </div>
          <div className="form-field">
            <label className="form-label">Описание</label>
            <textarea 
              className="form-input"
              value={newEvent.description}
              onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
              placeholder="Краткое описание..."
              rows={3}
            />
          </div>
          <div className="form-field">
            <label className="form-label">Дата и время</label>
            <input 
              className="form-input"
              type="datetime-local"
              value={newEvent.event_date}
              onChange={(e) => setNewEvent({ ...newEvent, event_date: e.target.value })}
            />
          </div>
          <div className="form-field">
            <label className="form-label">Место</label>
            <input 
              className="form-input"
              type="text"
              value={newEvent.location}
              onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
              placeholder="Аудитория / Адрес"
            />
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Отмена</button>
            <button className="btn btn-primary" onClick={addEvent}>Создать</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ========================================
// СТРАНИЦА РАСПИСАНИЯ (АДМИН)
// ========================================

function ScheduleAdminPage() {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    const { data } = await supabase.from('study_groups').select('*').order('name');
    setGroups(data || []);
  };

  return (
    <div className="main-content">
      <div className="main-header">
        <h1 className="page-title">📚 Расписание групп</h1>
      </div>

      <div style={{ padding: '2rem' }}>
        {groups.length === 0 ? (
          <EmptyState icon="📚" title="Нет учебных групп" text="Группы пока не созданы" />
        ) : (
          <div className="cards-grid">
            {groups.map(group => (
              <div 
                key={group.id} 
                className="card card-clickable"
                onClick={() => setSelectedGroup(group)}
              >
                <div className="card-body">
                  <h3 className="card-title">📚 {group.name}</h3>
                  <p className="card-description">Учебная группа</p>
                </div>
                <div className="card-footer">
                  <span className="text-muted">Нажмите для просмотра</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedGroup && (
        <ScheduleModal 
          group={selectedGroup} 
          onClose={() => setSelectedGroup(null)} 
          editable={true}
        />
      )}
    </div>
  );
}

// ========================================
// ДАШБОРД СТУДЕНТА
// ========================================

function StudentDashboard({ userId }) {
  const [myClubs, setMyClubs] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: subs } = await supabase
      .from('club_subscriptions')
      .select('*, clubs(name, description)')
      .eq('student_id', userId);
    setMyClubs(subs || []);

    const clubIds = subs?.map(s => s.club_id) || [];
    
    let query = supabase
      .from('events')
      .select('*, clubs(name)')
      .gte('event_date', new Date().toISOString())
      .order('event_date', { ascending: true })
      .limit(5);

    if (clubIds.length > 0) {
      query = query.or(`is_university_wide.eq.true,club_id.in.(${clubIds.join(',')})`);
    } else {
      query = query.eq('is_university_wide', true);
    }

    const { data: events } = await query;
    setUpcomingEvents(events || []);
  };

  return (
    <div className="main-content">
      <div className="main-header">
        <h1 className="page-title">🏠 Главная</h1>
      </div>

      <div style={{ padding: '2rem' }}>
        <div className="stats-row" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
          <StatCard icon="🎭" iconClass="purple" value={myClubs.length} label="Моих клубов" />
          <StatCard icon="📅" iconClass="cyan" value={upcomingEvents.length} label="Предстоящих событий" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div className="section">
            <div className="section-header">
              <h2 className="section-title">🎭 Мои клубы</h2>
            </div>
            {myClubs.length === 0 ? (
              <EmptyState icon="🎭" text="Вы пока не подписаны на клубы" small />
            ) : (
              <div className="list">
                {myClubs.map(sub => (
                  <div key={sub.id} className="list-item">
                    <div className="list-item-icon">🎭</div>
                    <div className="list-item-content">
                      <div className="list-item-title">{sub.clubs.name}</div>
                      <div className="list-item-subtitle">{sub.clubs.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="section">
            <div className="section-header">
              <h2 className="section-title">📅 Ближайшие события</h2>
            </div>
            {upcomingEvents.length === 0 ? (
              <EmptyState icon="📅" text="Нет предстоящих событий" small />
            ) : (
              <div className="list">
                {upcomingEvents.map(event => (
                  <div key={event.id} className="list-item">
                    <div className="list-item-icon">📅</div>
                    <div className="list-item-content">
                      <div className="list-item-title">{event.title}</div>
                      <div className="list-item-subtitle">
                        {new Date(event.event_date).toLocaleDateString('ru-RU')} • {event.location}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ========================================
// РАСПИСАНИЕ СТУДЕНТА
// ========================================

function StudentSchedulePage({ userId }) {
  const [schedule, setSchedule] = useState([]);
  const [group, setGroup] = useState(null);

  const days = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

  useEffect(() => {
    loadSchedule();
  }, []);

  const loadSchedule = async () => {
    const { data: membership } = await supabase
      .from('group_members')
      .select('group_id, study_groups(name)')
      .eq('student_id', userId)
      .single();

    if (!membership) return;
    setGroup(membership.study_groups);

    const { data } = await supabase
      .from('schedules')
      .select('*')
      .eq('group_id', membership.group_id)
      .order('day_of_week')
      .order('time_start');

    setSchedule(data || []);
  };

  if (!group) {
    return (
      <div className="main-content">
        <div className="main-header">
          <h1 className="page-title">📚 Расписание</h1>
        </div>
        <div style={{ padding: '2rem' }}>
          <EmptyState icon="📚" title="Вы не состоите в группе" text="Обратитесь к администратору" />
        </div>
      </div>
    );
  }

  const groupedByDay = days.map((day, index) => ({
    day,
    lessons: schedule.filter(l => l.day_of_week === index + 1)
  }));

  const today = new Date().getDay() || 7;

  return (
    <div className="main-content">
      <div className="main-header">
        <h1 className="page-title">📚 Расписание — {group.name}</h1>
      </div>

      <div style={{ padding: '2rem' }}>
        <div className="schedule-grid">
          {groupedByDay.slice(0, 6).map((dayData, index) => (
            <div key={index} className="schedule-day">
              <div className={`schedule-day-header ${index + 1 === today ? 'today' : ''}`}>
                {dayData.day}
              </div>
              <div className="schedule-lessons">
                {dayData.lessons.length === 0 ? (
                  <p className="text-muted text-center" style={{ padding: '1rem', fontSize: '0.8rem' }}>
                    Нет занятий
                  </p>
                ) : (
                  dayData.lessons.map(lesson => (
                    <div key={lesson.id} className="schedule-lesson">
                      <div className="schedule-lesson-time">
                        {lesson.time_start} — {lesson.time_end}
                      </div>
                      <div className="schedule-lesson-subject">{lesson.subject}</div>
                      <div className="schedule-lesson-info">
                        {lesson.room && `📍 ${lesson.room}`}
                        {lesson.teacher && ` • ${lesson.teacher}`}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ========================================
// ДАШБОРДЫ ДРУГИХ РОЛЕЙ (заглушки)
// ========================================

function ClubAdminDashboard({ userId }) {
  return (
    <div className="main-content">
      <div className="main-header">
        <h1 className="page-title">📊 Обзор клуба</h1>
      </div>
      <div style={{ padding: '2rem' }}>
        <EmptyState icon="🎭" title="Панель администратора клуба" text="Вы не назначены администратором клуба" />
      </div>
    </div>
  );
}

function ClubEventsPage({ userId }) {
  return (
    <div className="main-content">
      <div className="main-header">
        <h1 className="page-title">📅 Мероприятия клуба</h1>
      </div>
      <div style={{ padding: '2rem' }}>
        <EmptyState icon="📅" title="Нет мероприятий" text="Создайте первое мероприятие" />
      </div>
    </div>
  );
}

function ClubMembersPage({ userId }) {
  return (
    <div className="main-content">
      <div className="main-header">
        <h1 className="page-title">👥 Участники</h1>
      </div>
      <div style={{ padding: '2rem' }}>
        <EmptyState icon="👥" title="Нет участников" text="Пока никто не подписался" />
      </div>
    </div>
  );
}

function LeaderDashboard({ userId }) {
  return (
    <div className="main-content">
      <div className="main-header">
        <h1 className="page-title">📊 Обзор группы</h1>
      </div>
      <div style={{ padding: '2rem' }}>
        <EmptyState icon="📚" title="Панель старосты" text="Вы не назначены старостой группы" />
      </div>
    </div>
  );
}

function LeaderSchedulePage({ userId }) {
  return <StudentSchedulePage userId={userId} />;
}

function LeaderStudentsPage({ userId }) {
  return (
    <div className="main-content">
      <div className="main-header">
        <h1 className="page-title">👥 Студенты группы</h1>
      </div>
      <div style={{ padding: '2rem' }}>
        <EmptyState icon="👥" title="Нет студентов" text="В группе пока нет студентов" />
      </div>
    </div>
  );
}

// ========================================
// КОМПОНЕНТЫ UI
// ========================================

function StatCard({ icon, iconClass, value, label }) {
  return (
    <div className="stat-card">
      <div className="stat-header">
        <div className={`stat-icon ${iconClass}`}>{icon}</div>
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function EmptyState({ icon, title, text, action, small }) {
  return (
    <div className="empty-state" style={small ? { padding: '2rem 1rem' } : {}}>
      <div className="empty-state-icon">{icon}</div>
      {title && <div className="empty-state-title">{title}</div>}
      <p className="empty-state-text">{text}</p>
      {action}
    </div>
  );
}

function Modal({ title, children, onClose, large }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal ${large ? 'modal-large' : ''}`} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}

function ScheduleModal({ group, onClose, editable }) {
  const [schedule, setSchedule] = useState([]);
  const days = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];

  useEffect(() => {
    loadSchedule();
  }, [group.id]);

  const loadSchedule = async () => {
    const { data } = await supabase
      .from('schedules')
      .select('*')
      .eq('group_id', group.id)
      .order('day_of_week')
      .order('time_start');
    setSchedule(data || []);
  };

  return (
    <Modal title={`Расписание — ${group.name}`} onClose={onClose} large>
      {schedule.length === 0 ? (
        <EmptyState icon="📚" text="Расписание пока не заполнено" />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>День</th>
                <th>Время</th>
                <th>Предмет</th>
                <th>Аудитория</th>
                <th>Преподаватель</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map(lesson => (
                <tr key={lesson.id}>
                  <td>{days[lesson.day_of_week - 1]}</td>
                  <td>{lesson.time_start} — {lesson.time_end}</td>
                  <td><strong>{lesson.subject}</strong></td>
                  <td>{lesson.room}</td>
                  <td>{lesson.teacher}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onClose}>Закрыть</button>
      </div>
    </Modal>
  );
}

// ========================================
// ХЕЛПЕРЫ
// ========================================

function getRoleName(role) {
  const names = {
    main_admin: 'Главный админ',
    club_admin: 'Админ клуба',
    group_leader: 'Староста',
    student: 'Студент'
  };
  return names[role] || role;
}

export default App;
