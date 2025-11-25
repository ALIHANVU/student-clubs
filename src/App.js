import React, { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from './supabaseClient';
import './App.css';

const AppContext = createContext();

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) setUser(JSON.parse(savedUser));
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

  if (!user) return <LoginPage onLogin={login} />;

  return (
    <AppContext.Provider value={{ user, logout, sidebarOpen, setSidebarOpen, activeTab, setActiveTab }}>
      <div className="app-layout">
        <Sidebar />
        <MainArea />
        <MobileBottomNav />
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
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">🎓</div>
          <h1>UniClub</h1>
          <p>Студенческие клубы</p>
        </div>

        {error && <div className="error-alert">⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" required />
          </div>
          <div className="form-field">
            <label className="form-label">Пароль</label>
            <input className="form-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>

        <div className="demo-credentials">
          <code>admin@university.com</code> / <code>admin123</code>
        </div>
      </div>
    </div>
  );
}

// ========================================
// САЙДБАР
// ========================================

function Sidebar() {
  const { user, logout, sidebarOpen, setSidebarOpen, activeTab, setActiveTab } = useContext(AppContext);
  const [showMenu, setShowMenu] = useState(false);

  const navItems = user.role === 'main_admin' ? [
    { id: 'dashboard', icon: '📊', label: 'Дашборд' },
    { id: 'clubs', icon: '🎭', label: 'Клубы' },
    { id: 'events', icon: '📅', label: 'Мероприятия' },
    { id: 'schedule', icon: '📚', label: 'Расписание' },
    { id: 'faculties', icon: '🏛️', label: 'Факультеты' },
    { id: 'groups', icon: '👨‍🎓', label: 'Группы' },
    { id: 'users', icon: '👥', label: 'Пользователи' },
  ] : user.role === 'club_admin' ? [
    { id: 'dashboard', icon: '📊', label: 'Обзор' },
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

  const roleNames = { main_admin: 'Администратор', club_admin: 'Админ клуба', group_leader: 'Староста', student: 'Студент' };
  const initials = user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2);
  const currentLabel = navItems.find(i => i.id === activeTab)?.label || 'UniClub';

  return (
    <>
      {/* Мобильный хедер - только заголовок и аватар */}
      <div className="mobile-header">
        <span className="mobile-title">{currentLabel}</span>
        <div className="mobile-user-btn" onClick={() => setShowMenu(!showMenu)}>
          {initials}
        </div>
      </div>

      {/* Меню пользователя */}
      {showMenu && (
        <>
          <div className="mobile-overlay visible" onClick={() => setShowMenu(false)} />
          <div className="dropdown" style={{ position: 'fixed', top: 60, right: 8, zIndex: 1001 }}>
            <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-light)' }}>
              <div style={{ fontWeight: 600 }}>{user.full_name}</div>
              <div className="text-muted" style={{ fontSize: '0.8rem' }}>{user.email}</div>
              <div className="text-muted" style={{ fontSize: '0.75rem' }}>{roleNames[user.role]}</div>
            </div>
            <div className="dropdown-item danger" onClick={logout}>🚪 Выйти</div>
          </div>
        </>
      )}

      {/* Десктопный сайдбар */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">🎓</div>
          <div className="sidebar-title">
            <h2>UniClub</h2>
            <p>Студенческие клубы</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-section-title">Меню</div>
            {navItems.map(item => (
              <div key={item.id} className={`nav-item ${activeTab === item.id ? 'active' : ''}`} onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}>
                <span className="nav-item-icon">{item.icon}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="user-card" onClick={() => setShowMenu(!showMenu)} style={{ position: 'relative' }}>
            <div className="user-avatar">{initials}</div>
            <div className="user-info">
              <div className="user-name">{user.full_name}</div>
              <div className="user-role">{roleNames[user.role]}</div>
            </div>
            {showMenu && (
              <div className="dropdown" style={{ bottom: 'calc(100% + 8px)', left: 0, right: 0 }}>
                <div className="dropdown-item danger" onClick={logout}>🚪 Выйти</div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

// ========================================
// МОБИЛЬНАЯ НАВИГАЦИЯ
// ========================================

function MobileBottomNav() {
  const { user, activeTab, setActiveTab } = useContext(AppContext);
  
  const items = user.role === 'main_admin' ? [
    { id: 'dashboard', icon: '📊', label: 'Главная' },
    { id: 'clubs', icon: '🎭', label: 'Клубы' },
    { id: 'events', icon: '📅', label: 'События' },
    { id: 'schedule', icon: '📚', label: 'Расписание' },
    { id: 'users', icon: '👥', label: 'Ещё' },
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
          <div key={item.id} className={`mobile-nav-item ${activeTab === item.id ? 'active' : ''}`} onClick={() => setActiveTab(item.id)}>
            <span className="mobile-nav-item-icon">{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </nav>
  );
}

// ========================================
// ГЛАВНАЯ ОБЛАСТЬ
// ========================================

function MainArea() {
  const { user, activeTab } = useContext(AppContext);

  const render = () => {
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
    return <EmptyState icon="📋" title="Раздел в разработке" />;
  };

  return <main className="main-area">{render()}</main>;
}

// ========================================
// ДАШБОРД АДМИНА
// ========================================

function AdminDashboard() {
  const [stats, setStats] = useState({ clubs: 0, users: 0, events: 0, faculties: 0 });
  const [recentEvents, setRecentEvents] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [c, u, e, f] = await Promise.all([
      supabase.from('clubs').select('id', { count: 'exact', head: true }),
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('events').select('id', { count: 'exact', head: true }),
      supabase.from('faculties').select('id', { count: 'exact', head: true })
    ]);
    setStats({ clubs: c.count || 0, users: u.count || 0, events: e.count || 0, faculties: f.count || 0 });

    const { data: ev } = await supabase.from('events').select('*').order('created_at', { ascending: false }).limit(5);
    setRecentEvents(ev || []);

    const { data: us } = await supabase.from('users').select('*').order('created_at', { ascending: false }).limit(5);
    setRecentUsers(us || []);
  };

  return (
    <>
      <PageHeader title="📊 Дашборд" />
      <div className="page-content">
        <div className="stats-grid">
          <StatCard icon="🎭" color="blue" value={stats.clubs} label="Клубов" />
          <StatCard icon="👥" color="green" value={stats.users} label="Пользователей" />
          <StatCard icon="📅" color="orange" value={stats.events} label="Мероприятий" />
          <StatCard icon="🏛️" color="red" value={stats.faculties} label="Факультетов" />
        </div>

        <div className="grid-2">
          <Section title="📅 Последние мероприятия">
            {recentEvents.length === 0 ? <EmptyState icon="📅" text="Нет мероприятий" small /> : (
              <div className="list">
                {recentEvents.map(e => (
                  <div key={e.id} className="list-item">
                    <div className="list-item-icon">📅</div>
                    <div className="list-item-content">
                      <div className="list-item-title">{e.title}</div>
                      <div className="list-item-subtitle">{formatDate(e.event_date)} • {e.location}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section title="👥 Новые пользователи">
            {recentUsers.length === 0 ? <EmptyState icon="👥" text="Нет пользователей" small /> : (
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
// ДАШБОРД СТУДЕНТА
// ========================================

function StudentDashboard({ userId }) {
  const [myClubs, setMyClubs] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const { data: subs } = await supabase.from('club_subscriptions').select('*, clubs(name, description)').eq('student_id', userId);
    setMyClubs(subs || []);

    const clubIds = subs?.map(s => s.club_id) || [];
    let query = supabase.from('events').select('*, clubs(name)').gte('event_date', new Date().toISOString()).order('event_date').limit(5);
    if (clubIds.length > 0) {
      query = query.or(`is_university_wide.eq.true,club_id.in.(${clubIds.join(',')})`);
    } else {
      query = query.eq('is_university_wide', true);
    }
    const { data: ev } = await query;
    setUpcomingEvents(ev || []);
  };

  return (
    <>
      <PageHeader title="🏠 Главная" />
      <div className="page-content">
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
          <StatCard icon="🎭" color="blue" value={myClubs.length} label="Моих клубов" />
          <StatCard icon="📅" color="orange" value={upcomingEvents.length} label="Ближайших событий" />
        </div>

        <div className="grid-2">
          <Section title="🎭 Мои клубы">
            {myClubs.length === 0 ? <EmptyState icon="🎭" text="Вы не подписаны на клубы" small /> : (
              <div className="list">
                {myClubs.map(s => (
                  <div key={s.id} className="list-item">
                    <div className="list-item-icon">🎭</div>
                    <div className="list-item-content">
                      <div className="list-item-title">{s.clubs.name}</div>
                      <div className="list-item-subtitle">{s.clubs.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section title="📅 Ближайшие события">
            {upcomingEvents.length === 0 ? <EmptyState icon="📅" text="Нет событий" small /> : (
              <div className="list">
                {upcomingEvents.map(e => (
                  <div key={e.id} className="list-item">
                    <div className="list-item-icon">📅</div>
                    <div className="list-item-content">
                      <div className="list-item-title">{e.title}</div>
                      <div className="list-item-subtitle">{formatDate(e.event_date)} • {e.location}</div>
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
// СТРАНИЦА КЛУБОВ
// ========================================

function ClubsPage({ canEdit, userId }) {
  const [clubs, setClubs] = useState([]);
  const [myClubs, setMyClubs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedClub, setSelectedClub] = useState(null);
  const [newClub, setNewClub] = useState({ name: '', description: '' });
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => { loadClubs(); }, []);

  const loadClubs = async () => {
    const { data } = await supabase.from('clubs').select('*, club_subscriptions(count)').order('name');
    setClubs(data || []);
    if (userId) {
      const { data: subs } = await supabase.from('club_subscriptions').select('club_id').eq('student_id', userId);
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

  const deleteClub = async (id) => {
    if (!window.confirm('Удалить клуб?')) return;
    await supabase.from('clubs').delete().eq('id', id);
    setSelectedClub(null);
    loadClubs();
  };

  const toggleSub = async (clubId) => {
    if (myClubs.includes(clubId)) {
      await supabase.from('club_subscriptions').delete().eq('club_id', clubId).eq('student_id', userId);
    } else {
      await supabase.from('club_subscriptions').insert({ club_id: clubId, student_id: userId });
    }
    loadClubs();
  };

  let filtered = clubs.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  if (filter === 'my') filtered = filtered.filter(c => myClubs.includes(c.id));

  return (
    <>
      <PageHeader title="🎭 Клубы" action={canEdit && <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Создать</button>} search={search} onSearch={setSearch} />
      <div className="page-content">
        {!canEdit && (
          <div className="filters-bar">
            <div className="filter-group">
              <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>Все</button>
              <button className={`filter-btn ${filter === 'my' ? 'active' : ''}`} onClick={() => setFilter('my')}>Мои</button>
            </div>
          </div>
        )}

        {filtered.length === 0 ? <EmptyState icon="🎭" title="Нет клубов" text={filter === 'my' ? 'Вы не подписаны на клубы' : 'Создайте первый клуб'} /> : (
          <div className="cards-grid">
            {filtered.map(club => {
              const isMy = myClubs.includes(club.id);
              return (
                <div key={club.id} className={`card card-clickable ${isMy ? 'card-subscribed' : ''}`} onClick={() => setSelectedClub(club)}>
                  <div className="card-header">
                    <div className={`card-icon ${isMy ? 'subscribed' : ''}`}>🎭</div>
                    <div className="card-info">
                      <div className="card-title">{club.name} {isMy && <span className="badge badge-green">✓</span>}</div>
                      <div className="card-description">{club.description || 'Без описания'}</div>
                      <div className="card-meta">
                        <span className="card-meta-item">👥 {club.club_subscriptions?.[0]?.count || 0}</span>
                      </div>
                    </div>
                  </div>
                  {!canEdit && (
                    <div className="card-footer">
                      <button className={`btn btn-sm ${isMy ? 'btn-secondary' : 'btn-primary'}`} onClick={(e) => {
