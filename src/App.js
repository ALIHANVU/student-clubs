import React, { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from './supabaseClient';
import './App.css';

const AppContext = createContext();

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

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
    setActiveTab('dashboard');
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p style={{ color: 'var(--text-secondary)', marginTop: '16px', fontSize: '15px' }}>Загрузка...</p>
      </div>
    );
  }

  if (!user) return <LoginPage onLogin={login} />;

  return (
    <AppContext.Provider value={{ user, logout, activeTab, setActiveTab }}>
      <div className="app-layout">
        <Sidebar />
        <MainArea />
        <MobileBottomNav />
      </div>
    </AppContext.Provider>
  );
}

// ========================================
// LOGIN PAGE
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
      const { data, error: err } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('password_hash', password)
        .single();

      if (err || !data) {
        setError('Неверный email или пароль');
        setLoading(false);
        return;
      }
      
      onLogin(data);
    } catch (err) {
      setError('Произошла ошибка при входе');
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">🎓</div>
          <h1>UniClub</h1>
          <p>Студенческая платформа</p>
        </div>

        {error && (
          <div className="error-alert">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label className="form-label">Email</label>
            <input 
              className="form-input" 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="your@email.com" 
              required 
              autoFocus
            />
          </div>
          
          <div className="form-field">
            <label className="form-label">Пароль</label>
            <input 
              className="form-input" 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••" 
              required 
            />
          </div>
          
          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>

        <div className="demo-credentials">
          <p style={{ marginBottom: '8px', fontSize: '12px', color: 'var(--text-tertiary)' }}>Тестовые аккаунты:</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div><code>admin@university.com</code> / <code>admin123</code></div>
            <div><code>student@university.com</code> / <code>student123</code></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ========================================
// SIDEBAR
// ========================================

function Sidebar() {
  const { user, logout, activeTab, setActiveTab } = useContext(AppContext);
  const [showMenu, setShowMenu] = useState(false);

  const navItems = user.role === 'main_admin' ? [
    { id: 'dashboard', icon: '📊', label: 'Дашборд' },
    { id: 'clubs', icon: '🎭', label: 'Клубы' },
    { id: 'events', icon: '📅', label: 'Мероприятия' },
    { id: 'schedule', icon: '📚', label: 'Расписание' },
    { id: 'faculties', icon: '🏛️', label: 'Факультеты' },
    { id: 'groups', icon: '👥', label: 'Группы' },
    { id: 'users', icon: '👤', label: 'Пользователи' },
  ] : user.role === 'club_admin' ? [
    { id: 'dashboard', icon: '📊', label: 'Обзор' },
    { id: 'clubs', icon: '🎭', label: 'Мой клуб' },
    { id: 'events', icon: '📅', label: 'Мероприятия' },
    { id: 'members', icon: '👥', label: 'Участники' },
  ] : user.role === 'group_leader' ? [
    { id: 'dashboard', icon: '📊', label: 'Обзор' },
    { id: 'schedule', icon: '📚', label: 'Расписание' },
    { id: 'students', icon: '👥', label: 'Студенты' },
  ] : [
    { id: 'dashboard', icon: '🏠', label: 'Главная' },
    { id: 'clubs', icon: '🎭', label: 'Клубы' },
    { id: 'events', icon: '📅', label: 'Мероприятия' },
    { id: 'schedule', icon: '📚', label: 'Расписание' },
  ];

  const roleNames = { 
    main_admin: 'Администратор', 
    club_admin: 'Админ клуба', 
    group_leader: 'Староста', 
    student: 'Студент' 
  };

  const initials = user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const currentLabel = navItems.find(i => i.id === activeTab)?.label || 'UniClub';

  return (
    <>
      {/* Mobile Header */}
      <div className="mobile-header">
        <span className="mobile-title">{currentLabel}</span>
        <div className="mobile-user-btn" onClick={() => setShowMenu(!showMenu)}>
          {initials}
        </div>
      </div>

      {/* User Menu Dropdown */}
      {showMenu && (
        <>
          <div className="mobile-overlay visible" onClick={() => setShowMenu(false)} />
          <div className="dropdown" style={{ position: 'fixed', top: '64px', right: '16px', zIndex: 1001 }}>
            <div style={{ padding: '16px', borderBottom: '1px solid var(--border-light)' }}>
              <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>{user.full_name}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '2px' }}>{user.email}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{roleNames[user.role]}</div>
            </div>
            <div className="dropdown-item danger" onClick={() => { setShowMenu(false); logout(); }}>
              <span>🚪</span>
              <span>Выйти</span>
            </div>
          </div>
        </>
      )}

      {/* Desktop Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">🎓</div>
          <div className="sidebar-title">
            <h2>UniClub</h2>
            <p>Студенческая платформа</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-section-title">Навигация</div>
            {navItems.map(item => (
              <div 
                key={item.id} 
                className={`nav-item ${activeTab === item.id ? 'active' : ''}`} 
                onClick={() => setActiveTab(item.id)}
              >
                <span className="nav-item-icon">{item.icon}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="user-card" onClick={() => setShowMenu(!showMenu)}>
            <div className="user-avatar">{initials}</div>
            <div className="user-info">
              <div className="user-name">{user.full_name}</div>
              <div className="user-role">{roleNames[user.role]}</div>
            </div>
            {showMenu && (
              <div className="dropdown" style={{ bottom: 'calc(100% + 8px)', left: 0, right: 0 }}>
                <div className="dropdown-item danger" onClick={(e) => { e.stopPropagation(); logout(); }}>
                  <span>🚪</span>
                  <span>Выйти</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

// ========================================
// MOBILE BOTTOM NAV
// ========================================

function MobileBottomNav() {
  const { user, activeTab, setActiveTab } = useContext(AppContext);
  
  const items = user.role === 'main_admin' ? [
    { id: 'dashboard', icon: '📊', label: 'Главная' },
    { id: 'clubs', icon: '🎭', label: 'Клубы' },
    { id: 'events', icon: '📅', label: 'События' },
    { id: 'users', icon: '👤', label: 'Ещё' },
  ] : user.role === 'student' ? [
    { id: 'dashboard', icon: '🏠', label: 'Главная' },
    { id: 'clubs', icon: '🎭', label: 'Клубы' },
    { id: 'events', icon: '📅', label: 'События' },
    { id: 'schedule', icon: '📚', label: 'Расписание' },
  ] : [
    { id: 'dashboard', icon: '📊', label: 'Обзор' },
    { id: 'events', icon: '📅', label: 'События' },
    { id: 'schedule', icon: '📚', label: 'Расписание' },
  ];

  return (
    <nav className="mobile-bottom-nav">
      <div className="mobile-nav-items">
        {items.map(item => (
          <div 
            key={item.id} 
            className={`mobile-nav-item ${activeTab === item.id ? 'active' : ''}`} 
            onClick={() => setActiveTab(item.id)}
          >
            <span className="mobile-nav-item-icon">{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </nav>
  );
}

// ========================================
// MAIN AREA
// ========================================

function MainArea() {
  const { user, activeTab } = useContext(AppContext);

  const renderContent = () => {
    if (user.role === 'main_admin') {
      switch (activeTab) {
        case 'dashboard': return <AdminDashboard />;
        case 'clubs': return <ClubsPage canEdit={true} userId={user.id} />;
        case 'events': return <EventsPage canEdit={true} userId={user.id} />;
        case 'schedule': return <SchedulePage canEdit={true} userId={user.id} />;
        case 'faculties': return <FacultiesPage />;
        case 'groups': return <GroupsPage />;
        case 'users': return <UsersPage />;
        default: return <AdminDashboard />;
      }
    }
    
    if (user.role === 'student') {
      switch (activeTab) {
        case 'dashboard': return <StudentDashboard userId={user.id} />;
        case 'clubs': return <ClubsPage canEdit={false} userId={user.id} />;
        case 'events': return <EventsPage canEdit={false} userId={user.id} />;
        case 'schedule': return <SchedulePage canEdit={false} userId={user.id} />;
        default: return <StudentDashboard userId={user.id} />;
      }
    }
    
    return <EmptyState icon="📋" title="Раздел в разработке" text="Скоро здесь появится контент" />;
  };

  return <main className="main-area">{renderContent()}</main>;
}

// ========================================
// ADMIN DASHBOARD
// ========================================

function AdminDashboard() {
  const [stats, setStats] = useState({ clubs: 0, users: 0, events: 0, faculties: 0 });
  const [recentEvents, setRecentEvents] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [clubsRes, usersRes, eventsRes, facultiesRes] = await Promise.all([
        supabase.from('clubs').select('id', { count: 'exact', head: true }),
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('events').select('id', { count: 'exact', head: true }),
        supabase.from('faculties').select('id', { count: 'exact', head: true })
      ]);

      setStats({
        clubs: clubsRes.count || 0,
        users: usersRes.count || 0,
        events: eventsRes.count || 0,
        faculties: facultiesRes.count || 0
      });

      const { data: events } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      setRecentEvents(events || []);

      const { data: users } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      setRecentUsers(users || []);

      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <PageHeader title="📊 Дашборд" />
        <div className="page-content">
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <div className="loading-spinner"></div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="📊 Дашборд" />
      <div className="page-content">
        <div className="stats-grid">
          <StatCard icon="🎭" color="blue" value={stats.clubs} label="Клубов" />
          <StatCard icon="👥" color="green" value={stats.users} label="Пользователей" />
          <StatCard icon="📅" color="orange" value={stats.events} label="Мероприятий" />
          <StatCard icon="🏛️" color="purple" value={stats.faculties} label="Факультетов" />
        </div>

        <div className="grid-2">
          <Section title="📅 Последние мероприятия">
            {recentEvents.length === 0 ? (
              <EmptyState icon="📅" text="Нет мероприятий" small />
            ) : (
              <div className="list">
                {recentEvents.map(event => (
                  <div key={event.id} className="list-item">
                    <div className="list-item-icon">📅</div>
                    <div className="list-item-content">
                      <div className="list-item-title">{event.title}</div>
                      <div className="list-item-subtitle">
                        {formatDate(event.event_date)} • {event.location || 'Место не указано'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section title="👥 Новые пользователи">
            {recentUsers.length === 0 ? (
              <EmptyState icon="👥" text="Нет пользователей" small />
            ) : (
              <div className="list">
                {recentUsers.map(u => (
                  <div key={u.id} className="list-item">
                    <div className="list-item-icon">👤</div>
                    <div className="list-item-content">
                      <div className="list-item-title">{u.full_name}</div>
                      <div className="list-item-subtitle">{u.email}</div>
                    </div>
                    <span className="badge badge-blue">{getRoleName(u.role)}</span>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>
      </div>
    </>
  );
}

// ========================================
// STUDENT DASHBOARD
// ========================================

function StudentDashboard({ userId }) {
  const [myClubs, setMyClubs] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    try {
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
        .order('event_date')
        .limit(5);

      if (clubIds.length > 0) {
        query = query.or(`is_university_wide.eq.true,club_id.in.(${clubIds.join(',')})`);
      } else {
        query = query.eq('is_university_wide', true);
      }

      const { data: events } = await query;
      setUpcomingEvents(events || []);

      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <PageHeader title="🏠 Главная" />
        <div className="page-content">
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <div className="loading-spinner"></div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="🏠 Главная" />
      <div className="page-content">
        <div className="stats-grid">
          <StatCard icon="🎭" color="blue" value={myClubs.length} label="Моих клубов" />
          <StatCard icon="📅" color="orange" value={upcomingEvents.length} label="Предстоящих событий" />
        </div>

        <div className="grid-2">
          <Section title="🎭 Мои клубы">
            {myClubs.length === 0 ? (
              <EmptyState icon="🎭" text="Вы ещё не подписаны на клубы" small />
            ) : (
              <div className="list">
                {myClubs.map(sub => (
                  <div key={sub.id} className="list-item">
                    <div className="list-item-icon">🎭</div>
                    <div className="list-item-content">
                      <div className="list-item-title">{sub.clubs.name}</div>
                      <div className="list-item-subtitle">{sub.clubs.description || 'Без описания'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section title="📅 Предстоящие события">
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
                        {formatDate(event.event_date)} • {event.location || 'Место не указано'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>
      </div>
    </>
  );
}

// ========================================
// CLUBS PAGE
// ========================================

function ClubsPage({ canEdit, userId }) {
  const [clubs, setClubs] = useState([]);
  const [myClubs, setMyClubs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newClub, setNewClub] = useState({ name: '', description: '' });
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClubs();
  }, [userId]);

  const loadClubs = async () => {
    try {
      const { data } = await supabase
        .from('clubs')
        .select('*, club_subscriptions(count)')
        .order('name');
      setClubs(data || []);

      if (userId) {
        const { data: subs } = await supabase
          .from('club_subscriptions')
          .select('club_id')
          .eq('student_id', userId);
        setMyClubs(subs?.map(s => s.club_id) || []);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading clubs:', error);
      setLoading(false);
    }
  };

  const addClub = async () => {
    if (!newClub.name.trim()) return;
    
    try {
      await supabase.from('clubs').insert(newClub);
      setNewClub({ name: '', description: '' });
      setShowModal(false);
      loadClubs();
    } catch (error) {
      console.error('Error adding club:', error);
    }
  };

  const deleteClub = async (id) => {
    if (!window.confirm('Удалить этот клуб?')) return;
    
    try {
      await supabase.from('clubs').delete().eq('id', id);
      loadClubs();
    } catch (error) {
      console.error('Error deleting club:', error);
    }
  };

  const toggleSubscription = async (clubId, e) => {
    e.stopPropagation();
    
    try {
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
    } catch (error) {
      console.error('Error toggling subscription:', error);
    }
  };

  let filteredClubs = clubs.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  if (filter === 'my') {
    filteredClubs = filteredClubs.filter(c => myClubs.includes(c.id));
  }

  if (loading) {
    return (
      <>
        <PageHeader title="🎭 Клубы" />
        <div className="page-content">
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <div className="loading-spinner"></div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader 
        title="🎭 Клубы" 
        action={canEdit && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + Создать клуб
          </button>
        )}
        search={search}
        onSearch={setSearch}
      />
      
      <div className="page-content">
        {!canEdit && (
          <div className="filters-bar">
            <div className="filter-group">
              <button 
                className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                Все клубы
              </button>
              <button 
                className={`filter-btn ${filter === 'my' ? 'active' : ''}`}
                onClick={() => setFilter('my')}
              >
                Мои клубы
              </button>
            </div>
          </div>
        )}

        {filteredClubs.length === 0 ? (
          <EmptyState 
            icon="🎭" 
            title="Нет клубов" 
            text={filter === 'my' ? 'Вы ещё не подписаны на клубы' : 'Создайте первый клуб'} 
          />
        ) : (
          <div className="cards-grid">
            {filteredClubs.map(club => {
              const isSubscribed = myClubs.includes(club.id);
              const memberCount = club.club_subscriptions?.[0]?.count || 0;

              return (
                <div 
                  key={club.id} 
                  className={`card ${isSubscribed ? 'card-subscribed' : ''}`}
                >
                  <div className="card-header">
                    <div className={`card-icon ${isSubscribed ? 'subscribed' : ''}`}>
                      🎭
                    </div>
                    <div className="card-info">
                      <div className="card-title">
                        {club.name}
                        {isSubscribed && <span className="badge badge-green">✓ Подписан</span>}
                      </div>
                      <div className="card-description">
                        {club.description || 'Описание отсутствует'}
                      </div>
                      <div className="card-meta">
                        <span className="card-meta-item">
                          <span>👥</span>
                          <span>{memberCount} {memberCount === 1 ? 'участник' : 'участников'}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="card-footer">
                    {!canEdit ? (
                      <button 
                        className={`btn btn-sm btn-full ${isSubscribed ? 'btn-secondary' : 'btn-primary'}`}
                        onClick={(e) => toggleSubscription(club.id, e)}
                      >
                        {isSubscribed ? 'Отписаться' : 'Подписаться'}
                      </button>
                    ) : (
                      <button 
                        className="btn btn-sm btn-danger"
                        onClick={() => deleteClub(club.id)}
                      >
                        Удалить
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">Создать клуб</h3>
                <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
              </div>
              
              <div className="modal-body">
                <div className="form-field">
                  <label className="form-label">Название клуба</label>
                  <input 
                    className="form-input" 
                    value={newClub.name}
                    onChange={(e) => setNewClub({ ...newClub, name: e.target.value })}
                    placeholder="Например: IT-клуб"
                    autoFocus
                  />
                </div>
                
                <div className="form-field">
                  <label className="form-label">Описание</label>
                  <textarea 
                    className="form-input"
                    value={newClub.description}
                    onChange={(e) => setNewClub({ ...newClub, description: e.target.value })}
                    placeholder="Расскажите о клубе..."
                  />
                </div>
              </div>
              
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Отмена
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={addClub}
                  disabled={!newClub.name.trim()}
                >
                  Создать
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ========================================
// EVENTS PAGE
// ========================================

function EventsPage({ canEdit, userId }) {
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    event_date: '',
    location: '',
    is_university_wide: false
  });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const { data } = await supabase
        .from('events')
        .select('*, clubs(name)')
        .order('event_date', { ascending: false });
      setEvents(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading events:', error);
      setLoading(false);
    }
  };

  const addEvent = async () => {
    if (!newEvent.title.trim() || !newEvent.event_date) return;
    
    try {
      await supabase.from('events').insert({
        ...newEvent,
        created_by: userId
      });
      
      setNewEvent({
        title: '',
        description: '',
        event_date: '',
        location: '',
        is_university_wide: false
      });
      setShowModal(false);
      loadEvents();
    } catch (error) {
      console.error('Error adding event:', error);
    }
  };

  const deleteEvent = async (id) => {
    if (!window.confirm('Удалить это мероприятие?')) return;
    
    try {
      await supabase.from('events').delete().eq('id', id);
      loadEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const filteredEvents = events.filter(e =>
    e.title.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <>
        <PageHeader title="📅 Мероприятия" />
        <div className="page-content">
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <div className="loading-spinner"></div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader 
        title="📅 Мероприятия"
        action={canEdit && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + Создать мероприятие
          </button>
        )}
        search={search}
        onSearch={setSearch}
      />
      
      <div className="page-content">
        {filteredEvents.length === 0 ? (
          <EmptyState 
            icon="📅" 
            title="Нет мероприятий" 
            text="Создайте первое мероприятие" 
          />
        ) : (
          <div className="cards-grid">
            {filteredEvents.map(event => (
              <div key={event.id} className="card">
                <div className="card-header">
                  <div className="card-icon">📅</div>
                  <div className="card-info">
                    <div className="card-title">{event.title}</div>
                    <div className="card-description">
                      {event.description || 'Описание отсутствует'}
                    </div>
                    <div className="card-meta">
                      <span className="card-meta-item">
                        <span>📍</span>
                        <span>{event.location || 'Место не указано'}</span>
                      </span>
                      <span className="card-meta-item">
                        <span>🕒</span>
                        <span>{formatDate(event.event_date)}</span>
                      </span>
                    </div>
                  </div>
                </div>
                
                {canEdit && (
                  <div className="card-footer">
                    <button 
                      className="btn btn-sm btn-danger"
                      onClick={() => deleteEvent(event.id)}
                    >
                      Удалить
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">Создать мероприятие</h3>
                <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
              </div>
              
              <div className="modal-body">
                <div className="form-field">
                  <label className="form-label">Название мероприятия</label>
                  <input 
                    className="form-input"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    placeholder="Например: Встреча клуба"
                    autoFocus
                  />
                </div>
                
                <div className="form-field">
                  <label className="form-label">Описание</label>
                  <textarea 
                    className="form-input"
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    placeholder="Расскажите о мероприятии..."
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
                  <label className="form-label">Место проведения</label>
                  <input 
                    className="form-input"
                    value={newEvent.location}
                    onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                    placeholder="Например: Аудитория 101"
                  />
                </div>
              </div>
              
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Отмена
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={addEvent}
                  disabled={!newEvent.title.trim() || !newEvent.event_date}
                >
                  Создать
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ========================================
// OTHER PAGES (Placeholders)
// ========================================

function SchedulePage() {
  return (
    <>
      <PageHeader title="📚 Расписание" />
      <div className="page-content">
        <EmptyState 
          icon="📚" 
          title="Расписание" 
          text="Функционал в разработке" 
        />
      </div>
    </>
  );
}

function FacultiesPage() {
  return (
    <>
      <PageHeader title="🏛️ Факультеты" />
      <div className="page-content">
        <EmptyState 
          icon="🏛️" 
          title="Факультеты" 
          text="Функционал в разработке" 
        />
      </div>
    </>
  );
}

function GroupsPage() {
  return (
    <>
      <PageHeader title="👥 Группы" />
      <div className="page-content">
        <EmptyState 
          icon="👥" 
          title="Группы" 
          text="Функционал в разработке" 
        />
      </div>
    </>
  );
}

function UsersPage() {
  return (
    <>
      <PageHeader title="👤 Пользователи" />
      <div className="page-content">
        <EmptyState 
          icon="👤" 
          title="Пользователи" 
          text="Функционал в разработке" 
        />
      </div>
    </>
  );
}

// ========================================
// UI COMPONENTS
// ========================================

function PageHeader({ title, action, search, onSearch }) {
  return (
    <div className="page-header">
      <h1 className="page-title">{title}</h1>
      <div className="page-actions">
        {onSearch && (
          <div className="search-box">
            <span className="search-box-icon">🔍</span>
            <input 
              type="text" 
              placeholder="Поиск..." 
              value={search}
              onChange={(e) => onSearch(e.target.value)}
            />
          </div>
        )}
        {action}
      </div>
    </div>
  );
}

function StatCard({ icon, color, value, label }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${color}`}>{icon}</div>
      <div className="stat-content">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="section">
      <div className="section-header">
        <h3 className="section-title">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function EmptyState({ icon, title, text, small }) {
  return (
    <div className={`empty-state ${small ? 'empty-state-small' : ''}`}>
      <div className="empty-state-icon">{icon}</div>
      {title && <div className="empty-state-title">{title}</div>}
      {text && <div className="empty-state-text">{text}</div>}
    </div>
  );
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

function formatDate(dateString) {
  if (!dateString) return 'Дата не указана';
  
  const date = new Date(dateString);
  const now = new Date();
  const diff = date - now;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Сегодня';
  if (days === 1) return 'Завтра';
  if (days === -1) return 'Вчера';
  
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getRoleName(role) {
  const names = {
    main_admin: 'Админ',
    club_admin: 'Админ клуба',
    group_leader: 'Староста',
    student: 'Студент'
  };
  return names[role] || role;
}

export default App;
