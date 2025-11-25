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
      <div className="mobile-header">
        <button className="mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? '✕' : '☰'}
        </button>
        <span className="mobile-title">{currentLabel}</span>
        <div className="user-avatar" style={{ width: 36, height: 36, fontSize: '0.8rem' }} onClick={() => setShowMenu(!showMenu)}>
          {initials}
        </div>
      </div>

      {showMenu && (
        <>
          <div className="mobile-overlay visible" onClick={() => setShowMenu(false)} />
          <div className="dropdown" style={{ position: 'fixed', top: 60, right: 8, zIndex: 1001 }}>
            <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-light)' }}>
              <div style={{ fontWeight: 600 }}>{user.full_name}</div>
              <div className="text-muted" style={{ fontSize: '0.8rem' }}>{user.email}</div>
            </div>
            <div className="dropdown-item danger" onClick={logout}>🚪 Выйти</div>
          </div>
        </>
      )}

      {sidebarOpen && <div className="mobile-overlay visible" onClick={() => setSidebarOpen(false)} />}

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
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
                      <button className={`btn btn-sm ${isMy ? 'btn-secondary' : 'btn-primary'}`} onClick={(e) => { e.stopPropagation(); toggleSub(club.id); }}>
                        {isMy ? '✓ Подписан' : 'Подписаться'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedClub && <ClubModal club={selectedClub} canEdit={canEdit} isMy={myClubs.includes(selectedClub.id)} onClose={() => setSelectedClub(null)} onDelete={deleteClub} onToggle={toggleSub} />}
      {showModal && (
        <Modal title="Новый клуб" onClose={() => setShowModal(false)}>
          <div className="form-field">
            <label className="form-label">Название</label>
            <input className="form-input" value={newClub.name} onChange={(e) => setNewClub({ ...newClub, name: e.target.value })} placeholder="IT-клуб" />
          </div>
          <div className="form-field">
            <label className="form-label">Описание</label>
            <textarea className="form-input" value={newClub.description} onChange={(e) => setNewClub({ ...newClub, description: e.target.value })} placeholder="Описание клуба..." />
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Отмена</button>
            <button className="btn btn-primary" onClick={addClub}>Создать</button>
          </div>
        </Modal>
      )}
    </>
  );
}

function ClubModal({ club, canEdit, isMy, onClose, onDelete, onToggle }) {
  const [members, setMembers] = useState([]);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    supabase.from('club_subscriptions').select('*, users(full_name, email)').eq('club_id', club.id).then(r => setMembers(r.data || []));
    supabase.from('events').select('*').eq('club_id', club.id).order('event_date', { ascending: false }).limit(5).then(r => setEvents(r.data || []));
  }, [club.id]);

  return (
    <Modal title={club.name} onClose={onClose} large>
      <div className="mb-2">
        <div className="text-muted mb-1">📝 Описание</div>
        <p>{club.description || 'Нет описания'}</p>
      </div>
      <div className="mb-2">
        <div className="text-muted mb-1">👥 Участники ({members.length})</div>
        {members.length === 0 ? <p className="text-muted">Нет участников</p> : (
          <div className="list">{members.slice(0, 5).map(m => (
            <div key={m.id} className="list-item">
              <div className="list-item-icon">👤</div>
              <div className="list-item-content">
                <div className="list-item-title">{m.users.full_name}</div>
                <div className="list-item-subtitle">{m.users.email}</div>
              </div>
            </div>
          ))}</div>
        )}
      </div>
      <div className="mb-2">
        <div className="text-muted mb-1">📅 Мероприятия ({events.length})</div>
        {events.length === 0 ? <p className="text-muted">Нет мероприятий</p> : (
          <div className="list">{events.map(e => (
            <div key={e.id} className="list-item">
              <div className="list-item-icon">📅</div>
              <div className="list-item-content">
                <div className="list-item-title">{e.title}</div>
                <div className="list-item-subtitle">{formatDate(e.event_date)}</div>
              </div>
            </div>
          ))}</div>
        )}
      </div>
      <div className="modal-footer">
        {canEdit ? <button className="btn btn-danger" onClick={() => onDelete(club.id)}>🗑️ Удалить</button> : (
          <button className={`btn ${isMy ? 'btn-secondary' : 'btn-success'}`} onClick={() => { onToggle(club.id); onClose(); }}>
            {isMy ? 'Отписаться' : 'Подписаться'}
          </button>
        )}
        <button className="btn btn-secondary" onClick={onClose}>Закрыть</button>
      </div>
    </Modal>
  );
}

// ========================================
// СТРАНИЦА МЕРОПРИЯТИЙ
// ========================================

function EventsPage({ canEdit, userId }) {
  const [events, setEvents] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('upcoming');
  const [newEvent, setNewEvent] = useState({ title: '', description: '', event_date: '', location: '', club_id: '', is_university_wide: true });

  useEffect(() => { loadEvents(); loadClubs(); }, [filter]);

  const loadEvents = async () => {
    let q = supabase.from('events').select('*, clubs(name)');
    const now = new Date().toISOString();
    if (filter === 'upcoming') q = q.gte('event_date', now).order('event_date');
    else if (filter === 'past') q = q.lt('event_date', now).order('event_date', { ascending: false });
    else q = q.order('event_date');
    const { data } = await q;
    setEvents(data || []);
  };

  const loadClubs = async () => {
    const { data } = await supabase.from('clubs').select('id, name').order('name');
    setClubs(data || []);
  };

  const addEvent = async () => {
    if (!newEvent.title.trim()) return;
    const data = { ...newEvent, created_by: userId };
    if (!newEvent.club_id) delete data.club_id;
    await supabase.from('events').insert(data);
    setNewEvent({ title: '', description: '', event_date: '', location: '', club_id: '', is_university_wide: true });
    setShowModal(false);
    loadEvents();
  };

  const deleteEvent = async (id) => {
    if (!window.confirm('Удалить?')) return;
    await supabase.from('events').delete().eq('id', id);
    loadEvents();
  };

  return (
    <>
      <PageHeader title="📅 Мероприятия" action={canEdit && <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Создать</button>} />
      <div className="page-content">
        <div className="filters-bar">
          <div className="filter-group">
            <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>Все</button>
            <button className={`filter-btn ${filter === 'upcoming' ? 'active' : ''}`} onClick={() => setFilter('upcoming')}>Предстоящие</button>
            <button className={`filter-btn ${filter === 'past' ? 'active' : ''}`} onClick={() => setFilter('past')}>Прошедшие</button>
          </div>
        </div>

        {events.length === 0 ? <EmptyState icon="📅" title="Нет мероприятий" /> : (
          <div className="list">
            {events.map(e => {
              const isPast = new Date(e.event_date) < new Date();
              return (
                <div key={e.id} className="list-item" style={{ opacity: isPast ? 0.6 : 1 }}>
                  <div className="list-item-icon">{isPast ? '✓' : '📅'}</div>
                  <div className="list-item-content">
                    <div className="list-item-title">{e.title}</div>
                    <div className="list-item-subtitle">
                      📅 {formatDate(e.event_date)} {e.location && `• 📍 ${e.location}`} {e.clubs && `• 🎭 ${e.clubs.name}`}
                    </div>
                    {e.description && <div className="text-muted mt-1" style={{ fontSize: '0.85rem' }}>{e.description}</div>}
                  </div>
                  {e.is_university_wide && <span className="badge badge-blue">🌐</span>}
                  {canEdit && <div className="list-item-actions"><button className="btn btn-danger btn-sm" onClick={() => deleteEvent(e.id)}>🗑️</button></div>}
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
            <input className="form-input" value={newEvent.title} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} placeholder="Название" />
          </div>
          <div className="form-field">
            <label className="form-label">Описание</label>
            <textarea className="form-input" value={newEvent.description} onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })} placeholder="Описание..." />
          </div>
          <div className="form-field">
            <label className="form-label">Дата и время</label>
            <input className="form-input" type="datetime-local" value={newEvent.event_date} onChange={(e) => setNewEvent({ ...newEvent, event_date: e.target.value })} />
          </div>
          <div className="form-field">
            <label className="form-label">Место</label>
            <input className="form-input" value={newEvent.location} onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })} placeholder="Аудитория" />
          </div>
          <div className="form-field">
            <label className="form-label">Клуб (необязательно)</label>
            <select className="form-input" value={newEvent.club_id} onChange={(e) => setNewEvent({ ...newEvent, club_id: e.target.value })}>
              <option value="">Без клуба</option>
              {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Отмена</button>
            <button className="btn btn-primary" onClick={addEvent}>Создать</button>
          </div>
        </Modal>
      )}
    </>
  );
}

// ========================================
// СТРАНИЦА РАСПИСАНИЯ
// ========================================

function SchedulePage({ canEdit, userId }) {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newLesson, setNewLesson] = useState({ day_of_week: 1, time_start: '09:00', time_end: '10:30', subject: '', room: '', teacher: '' });

  const days = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];

  useEffect(() => { loadGroups(); }, []);
  useEffect(() => { if (selectedGroup) loadSchedule(); }, [selectedGroup]);

  const loadGroups = async () => {
    const { data } = await supabase.from('study_groups').select('*').order('name');
    setGroups(data || []);
    if (!canEdit && userId) {
      const { data: mem } = await supabase.from('group_members').select('group_id').eq('student_id', userId).single();
      if (mem && data) {
        const g = data.find(gr => gr.id === mem.group_id);
        if (g) setSelectedGroup(g);
      }
    }
  };

  const loadSchedule = async () => {
    const { data } = await supabase.from('schedules').select('*').eq('group_id', selectedGroup.id).order('day_of_week').order('time_start');
    setSchedule(data || []);
  };

  const addLesson = async () => {
    if (!newLesson.subject.trim() || !selectedGroup) return;
    await supabase.from('schedules').insert({ ...newLesson, group_id: selectedGroup.id });
    setNewLesson({ day_of_week: 1, time_start: '09:00', time_end: '10:30', subject: '', room: '', teacher: '' });
    setShowModal(false);
    loadSchedule();
  };

  const deleteLesson = async (id) => {
    if (!window.confirm('Удалить?')) return;
    await supabase.from('schedules').delete().eq('id', id);
    loadSchedule();
  };

  const today = new Date().getDay() || 7;

  return (
    <>
      <PageHeader title="📚 Расписание" action={canEdit && selectedGroup && <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Добавить</button>} />
      <div className="page-content">
        {canEdit && (
          <div className="filters-bar">
            <div className="filter-group">
              {groups.map(g => (
                <button key={g.id} className={`filter-btn ${selectedGroup?.id === g.id ? 'active' : ''}`} onClick={() => setSelectedGroup(g)}>{g.name}</button>
              ))}
            </div>
          </div>
        )}

        {!selectedGroup ? (
          <EmptyState icon="📚" title={canEdit ? 'Выберите группу' : 'Вы не состоите в группе'} text={canEdit ? 'Выберите группу выше' : 'Обратитесь к администратору'} />
        ) : schedule.length === 0 ? (
          <EmptyState icon="📚" title="Расписание пусто" text="Добавьте занятия" />
        ) : (
          <div className="schedule-container">
            {days.map((day, idx) => {
              const lessons = schedule.filter(l => l.day_of_week === idx + 1);
              return (
                <div key={idx} className="schedule-day">
                  <div className={`schedule-day-header ${idx + 1 === today ? 'today' : ''}`}>{day}</div>
                  <div className="schedule-lessons">
                    {lessons.length === 0 ? <p className="text-muted text-center" style={{ padding: '1rem', fontSize: '0.8rem' }}>Нет занятий</p> : lessons.map(l => (
                      <div key={l.id} className="schedule-lesson" onClick={() => canEdit && deleteLesson(l.id)} style={{ cursor: canEdit ? 'pointer' : 'default' }}>
                        <div className="schedule-lesson-time">{l.time_start} — {l.time_end}</div>
                        <div className="schedule-lesson-subject">{l.subject}</div>
                        <div className="schedule-lesson-info">{l.room && `📍 ${l.room}`} {l.teacher && `• ${l.teacher}`}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <Modal title="Новое занятие" onClose={() => setShowModal(false)}>
          <div className="form-field">
            <label className="form-label">День</label>
            <select className="form-input" value={newLesson.day_of_week} onChange={(e) => setNewLesson({ ...newLesson, day_of_week: +e.target.value })}>
              {days.map((d, i) => <option key={i} value={i + 1}>{d}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label className="form-label">Начало</label>
            <input className="form-input" type="time" value={newLesson.time_start} onChange={(e) => setNewLesson({ ...newLesson, time_start: e.target.value })} />
          </div>
          <div className="form-field">
            <label className="form-label">Конец</label>
            <input className="form-input" type="time" value={newLesson.time_end} onChange={(e) => setNewLesson({ ...newLesson, time_end: e.target.value })} />
          </div>
          <div className="form-field">
            <label className="form-label">Предмет</label>
            <input className="form-input" value={newLesson.subject} onChange={(e) => setNewLesson({ ...newLesson, subject: e.target.value })} placeholder="Математика" />
          </div>
          <div className="form-field">
            <label className="form-label">Аудитория</label>
            <input className="form-input" value={newLesson.room} onChange={(e) => setNewLesson({ ...newLesson, room: e.target.value })} placeholder="101" />
          </div>
          <div className="form-field">
            <label className="form-label">Преподаватель</label>
            <input className="form-input" value={newLesson.teacher} onChange={(e) => setNewLesson({ ...newLesson, teacher: e.target.value })} placeholder="Иванов И.И." />
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Отмена</button>
            <button className="btn btn-primary" onClick={addLesson}>Добавить</button>
          </div>
        </Modal>
      )}
    </>
  );
}

// ========================================
// СТРАНИЦА ФАКУЛЬТЕТОВ
// ========================================

function FacultiesPage() {
  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => { load(); }, []);
  const load = async () => { const { data } = await supabase.from('faculties').select('*').order('name'); setItems(data || []); };
  const add = async () => { if (!name.trim()) return; await supabase.from('faculties').insert({ name }); setName(''); setShowModal(false); load(); };
  const del = async (id) => { if (!window.confirm('Удалить?')) return; await supabase.from('faculties').delete().eq('id', id); load(); };

  return (
    <>
      <PageHeader title="🏛️ Факультеты" action={<button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Добавить</button>} />
      <div className="page-content">
        {items.length === 0 ? <EmptyState icon="🏛️" title="Нет факультетов" /> : (
          <div className="list">{items.map(f => (
            <div key={f.id} className="list-item">
              <div className="list-item-icon">🏛️</div>
              <div className="list-item-content"><div className="list-item-title">{f.name}</div></div>
              <button className="btn btn-danger btn-sm" onClick={() => del(f.id)}>🗑️</button>
            </div>
          ))}</div>
        )}
      </div>
      {showModal && (
        <Modal title="Новый факультет" onClose={() => setShowModal(false)}>
          <div className="form-field">
            <label className="form-label">Название</label>
            <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Факультет информатики" />
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Отмена</button>
            <button className="btn btn-primary" onClick={add}>Добавить</button>
          </div>
        </Modal>
      )}
    </>
  );
}

// ========================================
// СТРАНИЦА ГРУПП
// ========================================

function GroupsPage() {
  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => { load(); }, []);
  const load = async () => { const { data } = await supabase.from('study_groups').select('*').order('name'); setItems(data || []); };
  const add = async () => { if (!name.trim()) return; await supabase.from('study_groups').insert({ name }); setName(''); setShowModal(false); load(); };
  const del = async (id) => { if (!window.confirm('Удалить?')) return; await supabase.from('study_groups').delete().eq('id', id); load(); };

  return (
    <>
      <PageHeader title="👨‍🎓 Учебные группы" action={<button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Добавить</button>} />
      <div className="page-content">
        {items.length === 0 ? <EmptyState icon="👨‍🎓" title="Нет групп" /> : (
          <div className="list">{items.map(g => (
            <div key={g.id} className="list-item">
              <div className="list-item-icon">👨‍🎓</div>
              <div className="list-item-content"><div className="list-item-title">{g.name}</div></div>
              <button className="btn btn-danger btn-sm" onClick={() => del(g.id)}>🗑️</button>
            </div>
          ))}</div>
        )}
      </div>
      {showModal && (
        <Modal title="Новая группа" onClose={() => setShowModal(false)}>
          <div className="form-field">
            <label className="form-label">Название</label>
            <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="ИТ-101" />
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Отмена</button>
            <button className="btn btn-primary" onClick={add}>Добавить</button>
          </div>
        </Modal>
      )}
    </>
  );
}

// ========================================
// СТРАНИЦА ПОЛЬЗОВАТЕЛЕЙ
// ========================================

function UsersPage() {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', password_hash: '', full_name: '', role: 'student' });
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => { load(); }, []);
  const load = async () => { const { data } = await supabase.from('users').select('*').order('full_name'); setUsers(data || []); };
  const add = async () => { if (!newUser.email.trim() || !newUser.full_name.trim()) return; await supabase.from('users').insert(newUser); setNewUser({ email: '', password_hash: '', full_name: '', role: 'student' }); setShowModal(false); load(); };
  const del = async (id) => { if (!window.confirm('Удалить?')) return; await supabase.from('users').delete().eq('id', id); load(); };

  let filtered = users.filter(u => u.full_name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));
  if (roleFilter !== 'all') filtered = filtered.filter(u => u.role === roleFilter);

  return (
    <>
      <PageHeader title="👥 Пользователи" action={<button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Добавить</button>} search={search} onSearch={setSearch} />
      <div className="page-content">
        <div className="filters-bar">
          <div className="filter-group">
            {['all', 'main_admin', 'club_admin', 'group_leader', 'student'].map(r => (
              <button key={r} className={`filter-btn ${roleFilter === r ? 'active' : ''}`} onClick={() => setRoleFilter(r)}>
                {r === 'all' ? 'Все' : getRoleName(r)}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? <EmptyState icon="👥" title="Нет пользователей" /> : (
          <div className="list">{filtered.map(u => (
            <div key={u.id} className="list-item">
              <div className="list-item-icon">👤</div>
              <div className="list-item-content">
                <div className="list-item-title">{u.full_name}</div>
                <div className="list-item-subtitle">{u.email}</div>
              </div>
              <span className="badge badge-blue">{getRoleName(u.role)}</span>
              <button className="btn btn-danger btn-sm" onClick={() => del(u.id)}>🗑️</button>
            </div>
          ))}</div>
        )}
      </div>

      {showModal && (
        <Modal title="Новый пользователь" onClose={() => setShowModal(false)}>
          <div className="form-field">
            <label className="form-label">ФИО</label>
            <input className="form-input" value={newUser.full_name} onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })} placeholder="Иванов Иван" />
          </div>
          <div className="form-field">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} placeholder="user@mail.com" />
          </div>
          <div className="form-field">
            <label className="form-label">Пароль</label>
            <input className="form-input" value={newUser.password_hash} onChange={(e) => setNewUser({ ...newUser, password_hash: e.target.value })} placeholder="password" />
          </div>
          <div className="form-field">
            <label className="form-label">Роль</label>
            <select className="form-input" value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}>
              <option value="student">Студент</option>
              <option value="group_leader">Староста</option>
              <option value="club_admin">Админ клуба</option>
              <option value="main_admin">Администратор</option>
            </select>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Отмена</button>
            <button className="btn btn-primary" onClick={add}>Добавить</button>
          </div>
        </Modal>
      )}
    </>
  );
}

// ========================================
// КОМПОНЕНТЫ
// ========================================

function PageHeader({ title, action, search, onSearch }) {
  return (
    <div className="page-header">
      <h1 className="page-title">{title}</h1>
      <div className="page-actions">
        {onSearch && (
          <div className="search-box">
            <span className="search-box-icon">🔍</span>
            <input type="text" placeholder="Поиск..." value={search} onChange={(e) => onSearch(e.target.value)} />
          </div>
        )}
        {action}
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="section">
      <div className="section-header"><h2 className="section-title">{title}</h2></div>
      {children}
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

function EmptyState({ icon, title, text, small }) {
  return (
    <div className={`empty-state ${small ? 'empty-state-small' : ''}`}>
      <div className="empty-state-icon">{icon}</div>
      {title && <div className="empty-state-title">{title}</div>}
      {text && <p className="empty-state-text">{text}</p>}
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
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

// ========================================
// ХЕЛПЕРЫ
// ========================================

function getRoleName(role) {
  return { main_admin: 'Админ', club_admin: 'Клуб', group_leader: 'Староста', student: 'Студент' }[role] || role;
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default App;
