import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = () => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  };

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('currentUser', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="app">
      <Header user={user} onLogout={handleLogout} />
      <main className="main-content">
        {user.role === 'main_admin' && <MainAdminDashboard user={user} />}
        {user.role === 'club_admin' && <ClubAdminDashboard user={user} />}
        {user.role === 'group_leader' && <GroupLeaderDashboard user={user} />}
        {user.role === 'student' && <StudentDashboard user={user} />}
      </main>
    </div>
  );
}

// Компонент входа в систему
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
      setError('Ошибка входа. Попробуйте снова.');
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>🎓 Вход в систему</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>
          <div className="form-group">
            <label>Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
        <div style={{ marginTop: '1.5rem', fontSize: '0.875rem', color: '#64748b', textAlign: 'center' }}>
          <p><strong>Для тестирования:</strong></p>
          <p>Email: admin@university.com</p>
          <p>Пароль: admin123</p>
        </div>
      </div>
    </div>
  );
}

// Заголовок приложения
function Header({ user, onLogout }) {
  const [showProfile, setShowProfile] = useState(false);
  
  const roleNames = {
    main_admin: 'Главный администратор',
    club_admin: 'Администратор клуба',
    group_leader: 'Староста группы',
    student: 'Студент'
  };

  return (
    <header className="header">
      <div className="header-content">
        <h1>🎓 Студенческие клубы</h1>
        <div className="user-info">
          <span className="user-role">{roleNames[user.role]}</span>
          <button 
            className="user-name-btn" 
            onClick={() => setShowProfile(!showProfile)}
          >
            {user.full_name} ▾
          </button>
          {showProfile && (
            <div className="profile-dropdown">
              <div className="profile-info">
                <p><strong>{user.full_name}</strong></p>
                <p style={{ fontSize: '0.875rem', color: '#64748b' }}>{user.email}</p>
                <p style={{ fontSize: '0.875rem', color: '#64748b' }}>{roleNames[user.role]}</p>
              </div>
              <button onClick={onLogout} className="btn-logout-dropdown">Выйти</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

// Панель главного администратора
function MainAdminDashboard({ user }) {
  const [activeTab, setActiveTab] = useState('statistics');
  const [stats, setStats] = useState({
    clubs: 0,
    users: 0,
    events: 0,
    faculties: 0
  });

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
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
  };

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem', color: '#1e293b' }}>Панель управления</h2>
      
      <div className="tabs">
        <button className={`tab ${activeTab === 'statistics' ? 'active' : ''}`} onClick={() => setActiveTab('statistics')}>
          📊 Статистика
        </button>
        <button className={`tab ${activeTab === 'faculties' ? 'active' : ''}`} onClick={() => setActiveTab('faculties')}>
          🏛️ Факультеты
        </button>
        <button className={`tab ${activeTab === 'clubs' ? 'active' : ''}`} onClick={() => setActiveTab('clubs')}>
          🎭 Клубы
        </button>
        <button className={`tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
          👥 Пользователи
        </button>
        <button className={`tab ${activeTab === 'events' ? 'active' : ''}`} onClick={() => setActiveTab('events')}>
          📅 Мероприятия
        </button>
      </div>

      {activeTab === 'statistics' && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">🎭</div>
            <div className="stat-number">{stats.clubs}</div>
            <div className="stat-label">Клубов</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-number">{stats.users}</div>
            <div className="stat-label">Пользователей</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-number">{stats.events}</div>
            <div className="stat-label">Мероприятий</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🏛️</div>
            <div className="stat-number">{stats.faculties}</div>
            <div className="stat-label">Факультетов</div>
          </div>
        </div>
      )}
      {activeTab === 'faculties' && <FacultiesManager onUpdate={loadStatistics} />}
      {activeTab === 'clubs' && <ClubsManager onUpdate={loadStatistics} />}
      {activeTab === 'users' && <UsersManager onUpdate={loadStatistics} />}
      {activeTab === 'events' && <EventsManager userId={user.id} isMainAdmin={true} onUpdate={loadStatistics} />}
    </div>
  );
}

// Управление факультетами
function FacultiesManager({ onUpdate }) {
  const [faculties, setFaculties] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newFacultyName, setNewFacultyName] = useState('');

  useEffect(() => {
    loadFaculties();
  }, []);

  const loadFaculties = async () => {
    const { data } = await supabase.from('faculties').select('*').order('name');
    setFaculties(data || []);
  };

  const addFaculty = async () => {
    if (!newFacultyName.trim()) return;
    await supabase.from('faculties').insert({ name: newFacultyName });
    setNewFacultyName('');
    setShowModal(false);
    loadFaculties();
    onUpdate?.();
  };

  const deleteFaculty = async (id, name) => {
    if (!window.confirm(`Удалить факультет "${name}"?`)) return;
    await supabase.from('faculties').delete().eq('id', id);
    loadFaculties();
    onUpdate?.();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3>Факультеты</h3>
        <button className="btn btn-blue" onClick={() => setShowModal(true)}>+ Добавить факультет</button>
      </div>

      {faculties.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📚</div>
          <p>Пока нет факультетов. Добавьте первый!</p>
        </div>
      ) : (
        <div className="cards-grid">
          {faculties.map(faculty => (
            <div key={faculty.id} className="card card-deletable">
              <button 
                className="delete-btn" 
                onClick={() => deleteFaculty(faculty.id, faculty.name)}
                title="Удалить факультет"
              >
                ×
              </button>
              <h3>{faculty.name}</h3>
              <p>Факультет университета</p>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Добавить факультет</h2>
            <div className="form-group">
              <label>Название факультета</label>
              <input
                type="text"
                value={newFacultyName}
                onChange={(e) => setNewFacultyName(e.target.value)}
                placeholder="Например: Факультет информатики"
              />
            </div>
            <div className="modal-buttons">
              <button className="btn btn-blue" onClick={addFaculty}>Добавить</button>
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Управление клубами
function ClubsManager({ onUpdate }) {
  const [clubs, setClubs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newClub, setNewClub] = useState({ name: '', description: '' });
  const [selectedClub, setSelectedClub] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadClubs();
  }, []);

  const loadClubs = async () => {
    const { data } = await supabase
      .from('clubs')
      .select('*, club_subscriptions(count)')
      .order('name');
    setClubs(data || []);
  };

  const addClub = async () => {
    if (!newClub.name.trim()) return;
    await supabase.from('clubs').insert(newClub);
    setNewClub({ name: '', description: '' });
    setShowModal(false);
    loadClubs();
    onUpdate?.();
  };

  const deleteClub = async (id, name) => {
    if (!window.confirm(`Удалить клуб "${name}"? Это также удалит все связанные подписки и мероприятия.`)) return;
    await supabase.from('clubs').delete().eq('id', id);
    setSelectedClub(null);
    loadClubs();
    onUpdate?.();
  };

  const filteredClubs = clubs.filter(club => 
    club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    club.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', gap: '1rem' }}>
        <div style={{ flex: 1 }}>
          <input
            type="text"
            placeholder="🔍 Поиск клубов..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        <button className="btn btn-blue" onClick={() => setShowModal(true)}>+ Создать клуб</button>
      </div>

      {filteredClubs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎭</div>
          <p>{searchQuery ? 'Клубы не найдены' : 'Пока нет клубов. Создайте первый!'}</p>
        </div>
      ) : (
        <div className="cards-grid">
          {filteredClubs.map(club => (
            <div key={club.id} className="card card-interactive card-deletable" onClick={() => setSelectedClub(club)}>
              <button 
                className="delete-btn" 
                onClick={(e) => {
                  e.stopPropagation();
                  deleteClub(club.id, club.name);
                }}
                title="Удалить клуб"
              >
                ×
              </button>
              <div className="card-header">
                <h3>{club.name}</h3>
                <span className="badge">{club.club_subscriptions?.[0]?.count || 0} 👥</span>
              </div>
              <p>{club.description || 'Без описания'}</p>
              <div className="card-footer">
                <span className="link-text">Подробнее →</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedClub && (
        <ClubDetailModal 
          club={selectedClub} 
          onClose={() => setSelectedClub(null)}
          onDelete={deleteClub}
        />
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Создать клуб</h2>
            <div className="form-group">
              <label>Название клуба</label>
              <input
                type="text"
                value={newClub.name}
                onChange={(e) => setNewClub({ ...newClub, name: e.target.value })}
                placeholder="Например: IT-клуб"
              />
            </div>
            <div className="form-group">
              <label>Описание</label>
              <textarea
                value={newClub.description}
                onChange={(e) => setNewClub({ ...newClub, description: e.target.value })}
                placeholder="Краткое описание клуба"
                rows="3"
              />
            </div>
            <div className="modal-buttons">
              <button className="btn btn-blue" onClick={addClub}>Создать</button>
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Модальное окно с деталями клуба
function ClubDetailModal({ club, onClose, onDelete }) {
  const [members, setMembers] = useState([]);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    loadClubDetails();
  }, [club.id]);

  const loadClubDetails = async () => {
    const [membersData, eventsData] = await Promise.all([
      supabase.from('club_subscriptions').select('*, users(full_name, email)').eq('club_id', club.id),
      supabase.from('events').select('*').eq('club_id', club.id).order('event_date', { ascending: false })
    ]);
    
    setMembers(membersData.data || []);
    setEvents(eventsData.data || []);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{club.name}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="club-detail-content">
          <div className="detail-section">
            <h3>📝 Описание</h3>
            <p>{club.description || 'Описание отсутствует'}</p>
          </div>

          <div className="detail-section">
            <h3>👥 Подписчики ({members.length})</h3>
            {members.length === 0 ? (
              <p className="text-muted">Пока нет подписчиков</p>
            ) : (
              <div className="members-list">
                {members.slice(0, 5).map(member => (
                  <div key={member.id} className="member-item">
                    <span>{member.users.full_name}</span>
                    <span className="text-muted">{member.users.email}</span>
                  </div>
                ))}
                {members.length > 5 && (
                  <p className="text-muted">и ещё {members.length - 5}...</p>
                )}
              </div>
            )}
          </div>

          <div className="detail-section">
            <h3>📅 Мероприятия ({events.length})</h3>
            {events.length === 0 ? (
              <p className="text-muted">Пока нет мероприятий</p>
            ) : (
              <div className="events-list">
                {events.slice(0, 3).map(event => (
                  <div key={event.id} className="event-item">
                    <strong>{event.title}</strong>
                    <span className="text-muted">
                      {new Date(event.event_date).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                ))}
                {events.length > 3 && (
                  <p className="text-muted">и ещё {events.length - 3}...</p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="modal-buttons">
          <button 
            className="btn btn-danger" 
            onClick={() => {
              onDelete(club.id, club.name);
              onClose();
            }}
          >
            🗑️ Удалить клуб
          </button>
          <button className="btn btn-outline" onClick={onClose}>Закрыть</button>
        </div>
      </div>
    </div>
  );
}

// Управление пользователями
function UsersManager({ onUpdate }) {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    password_hash: '',
    full_name: '',
    role: 'student'
  });
  const [searchQuery, setSearchQuery] = useState('');

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
    onUpdate?.();
  };

  const deleteUser = async (id, name) => {
    if (!window.confirm(`Удалить пользователя "${name}"?`)) return;
    await supabase.from('users').delete().eq('id', id);
    loadUsers();
    onUpdate?.();
  };

  const roleNames = {
    main_admin: 'Главный админ',
    club_admin: 'Админ клуба',
    group_leader: 'Староста',
    student: 'Студент'
  };

  const filteredUsers = users.filter(user =>
    user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', gap: '1rem' }}>
        <div style={{ flex: 1 }}>
          <input
            type="text"
            placeholder="🔍 Поиск пользователей..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        <button className="btn btn-blue" onClick={() => setShowModal(true)}>+ Добавить пользователя</button>
      </div>

      {filteredUsers.map(user => (
        <div key={user.id} className="list-item">
          <div className="list-item-content">
            <h4>{user.full_name}</h4>
            <p>{user.email} • {roleNames[user.role]}</p>
          </div>
          <button 
            className="btn btn-danger btn-sm" 
            onClick={() => deleteUser(user.id, user.full_name)}
          >
            🗑️ Удалить
          </button>
        </div>
      ))}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Добавить пользователя</h2>
            <div className="form-group">
              <label>ФИО</label>
              <input
                type="text"
                value={newUser.full_name}
                onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                placeholder="Иванов Иван Иванович"
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="user@university.com"
              />
            </div>
            <div className="form-group">
              <label>Пароль</label>
              <input
                type="text"
                value={newUser.password_hash}
                onChange={(e) => setNewUser({ ...newUser, password_hash: e.target.value })}
                placeholder="password123"
              />
            </div>
            <div className="form-group">
              <label>Роль</label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '2px solid #e2e8f0' }}
              >
                <option value="student">Студент</option>
                <option value="group_leader">Староста группы</option>
                <option value="club_admin">Администратор клуба</option>
                <option value="main_admin">Главный администратор</option>
              </select>
            </div>
            <div className="modal-buttons">
              <button className="btn btn-blue" onClick={addUser}>Добавить</button>
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Управление мероприятиями
function EventsManager({ userId, isMainAdmin = false, clubId = null, onUpdate }) {
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all'); // all, upcoming, past
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    event_date: '',
    location: '',
    is_university_wide: isMainAdmin
  });

  useEffect(() => {
    loadEvents();
  }, [filter]);

  const loadEvents = async () => {
    let query = supabase.from('events').select('*, clubs(name)');
    
    if (clubId) {
      query = query.eq('club_id', clubId);
    }

    const now = new Date().toISOString();
    
    if (filter === 'upcoming') {
      query = query.gte('event_date', now);
    } else if (filter === 'past') {
      query = query.lt('event_date', now);
    }
    
    const { data } = await query.order('event_date', { ascending: filter === 'past' ? false : true });
    setEvents(data || []);
  };

  const addEvent = async () => {
    if (!newEvent.title.trim()) return;
    
    const eventData = {
      ...newEvent,
      created_by: userId,
      club_id: clubId
    };
    
    await supabase.from('events').insert(eventData);
    setNewEvent({
      title: '',
      description: '',
      event_date: '',
      location: '',
      is_university_wide: isMainAdmin
    });
    setShowModal(false);
    loadEvents();
    onUpdate?.();
  };

  const deleteEvent = async (id, title) => {
    if (!window.confirm(`Удалить мероприятие "${title}"?`)) return;
    await supabase.from('events').delete().eq('id', id);
    loadEvents();
    onUpdate?.();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div className="filter-buttons">
          <button 
            className={`btn btn-sm ${filter === 'all' ? 'btn-blue' : 'btn-outline'}`}
            onClick={() => setFilter('all')}
          >
            Все
          </button>
          <button 
            className={`btn btn-sm ${filter === 'upcoming' ? 'btn-blue' : 'btn-outline'}`}
            onClick={() => setFilter('upcoming')}
          >
            Предстоящие
          </button>
          <button 
            className={`btn btn-sm ${filter === 'past' ? 'btn-blue' : 'btn-outline'}`}
            onClick={() => setFilter('past')}
          >
            Прошедшие
          </button>
        </div>
        <button className="btn btn-blue" onClick={() => setShowModal(true)}>+ Создать мероприятие</button>
      </div>

      {events.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📅</div>
          <p>Пока нет мероприятий</p>
        </div>
      ) : (
        events.map(event => {
          const isPast = new Date(event.event_date) < new Date();
          return (
            <div key={event.id} className={`list-item ${isPast ? 'event-past' : ''}`}>
              <div className="list-item-content">
                <h4>{event.title}</h4>
                <p>
                  {new Date(event.event_date).toLocaleDateString('ru-RU')} • {event.location}
                  {event.is_university_wide && ' • Общеуниверситетское'}
                  {event.clubs && ` • ${event.clubs.name}`}
                </p>
                <p style={{ marginTop: '0.5rem' }}>{event.description}</p>
              </div>
              <button 
                className="btn btn-danger btn-sm" 
                onClick={() => deleteEvent(event.id, event.title)}
              >
                🗑️
              </button>
            </div>
          );
        })
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Создать мероприятие</h2>
            <div className="form-group">
              <label>Название</label>
              <input
                type="text"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                placeholder="Название мероприятия"
              />
            </div>
            <div className="form-group">
              <label>Описание</label>
              <textarea
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                placeholder="Краткое описание"
                rows="3"
              />
            </div>
            <div className="form-group">
              <label>Дата и время</label>
              <input
                type="datetime-local"
                value={newEvent.event_date}
                onChange={(e) => setNewEvent({ ...newEvent, event_date: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Место</label>
              <input
                type="text"
                value={newEvent.location}
                onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                placeholder="Аудитория / Адрес"
              />
            </div>
            {isMainAdmin && (
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={newEvent.is_university_wide}
                    onChange={(e) => setNewEvent({ ...newEvent, is_university_wide: e.target.checked })}
                  />
                  Общеуниверситетское мероприятие
                </label>
              </div>
            )}
            <div className="modal-buttons">
              <button className="btn btn-blue" onClick={addEvent}>Создать</button>
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Панель администратора клуба
function ClubAdminDashboard({ user }) {
  const [club, setClub] = useState(null);
  const [activeTab, setActiveTab] = useState('events');

  useEffect(() => {
    loadClub();
  }, []);

  const loadClub = async () => {
    const { data } = await supabase
      .from('clubs')
      .select('*')
      .eq('admin_id', user.id)
      .single();
    setClub(data);
  };

  if (!club) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🎭</div>
        <p>Вы не являетесь администратором клуба</p>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ marginBottom: '0.5rem', color: '#1e293b' }}>{club.name}</h2>
      <p style={{ marginBottom: '1.5rem', color: '#64748b' }}>{club.description}</p>

      <div className="tabs">
        <button className={`tab ${activeTab === 'events' ? 'active' : ''}`} onClick={() => setActiveTab('events')}>
          📅 Мероприятия
        </button>
        <button className={`tab ${activeTab === 'members' ? 'active' : ''}`} onClick={() => setActiveTab('members')}>
          👥 Подписчики
        </button>
      </div>

      {activeTab === 'events' && <EventsManager userId={user.id} clubId={club.id} />}
      {activeTab === 'members' && <ClubMembers clubId={club.id} />}
    </div>
  );
}

// Подписчики клуба
function ClubMembers({ clubId }) {
  const [members, setMembers] = useState([]);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    const { data } = await supabase
      .from('club_subscriptions')
      .select('*, users(full_name, email)')
      .eq('club_id', clubId);
    setMembers(data || []);
  };

  return (
    <div>
      <h3 style={{ marginBottom: '1rem' }}>Подписчики ({members.length})</h3>
      {members.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👥</div>
          <p>Пока нет подписчиков</p>
        </div>
      ) : (
        members.map(member => (
          <div key={member.id} className="list-item">
            <div className="list-item-content">
              <h4>{member.users.full_name}</h4>
              <p>{member.users.email}</p>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// Панель старосты группы
function GroupLeaderDashboard({ user }) {
  const [group, setGroup] = useState(null);
  const [activeTab, setActiveTab] = useState('schedule');

  useEffect(() => {
    loadGroup();
  }, []);

  const loadGroup = async () => {
    const { data } = await supabase
      .from('study_groups')
      .select('*')
      .eq('leader_id', user.id)
      .single();
    setGroup(data);
  };

  if (!group) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📚</div>
        <p>Вы не являетесь старостой группы</p>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem', color: '#1e293b' }}>Группа: {group.name}</h2>

      <div className="tabs">
        <button className={`tab ${activeTab === 'schedule' ? 'active' : ''}`} onClick={() => setActiveTab('schedule')}>
          📅 Расписание
        </button>
        <button className={`tab ${activeTab === 'members' ? 'active' : ''}`} onClick={() => setActiveTab('members')}>
          👥 Студенты
        </button>
      </div>

      {activeTab === 'schedule' && <ScheduleManager groupId={group.id} />}
      {activeTab === 'members' && <GroupMembers groupId={group.id} />}
    </div>
  );
}

// Управление расписанием
function ScheduleManager({ groupId }) {
  const [schedule, setSchedule] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newLesson, setNewLesson] = useState({
    day_of_week: 1,
    time_start: '09:00',
    time_end: '10:30',
    subject: '',
    room: '',
    teacher: ''
  });

  const days = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

  useEffect(() => {
    loadSchedule();
  }, []);

  const loadSchedule = async () => {
    const { data } = await supabase
      .from('schedules')
      .select('*')
      .eq('group_id', groupId)
      .order('day_of_week')
      .order('time_start');
    setSchedule(data || []);
  };

  const addLesson = async () => {
    if (!newLesson.subject.trim()) return;
    
    await supabase.from('schedules').insert({
      ...newLesson,
      group_id: groupId
    });
    
    setNewLesson({
      day_of_week: 1,
      time_start: '09:00',
      time_end: '10:30',
      subject: '',
      room: '',
      teacher: ''
    });
    setShowModal(false);
    loadSchedule();
  };

  const deleteLesson = async (id) => {
    if (!window.confirm('Удалить занятие?')) return;
    await supabase.from('schedules').delete().eq('id', id);
    loadSchedule();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3>Расписание занятий</h3>
        <button className="btn btn-blue" onClick={() => setShowModal(true)}>+ Добавить занятие</button>
      </div>

      {schedule.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📅</div>
          <p>Расписание пока не заполнено</p>
        </div>
      ) : (
        <div className="schedule-table">
          <table>
            <thead>
              <tr>
                <th>День</th>
                <th>Время</th>
                <th>Предмет</th>
                <th>Аудитория</th>
                <th>Преподаватель</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {schedule.map(lesson => (
                <tr key={lesson.id}>
                  <td>{days[lesson.day_of_week - 1]}</td>
                  <td>{lesson.time_start} - {lesson.time_end}</td>
                  <td><strong>{lesson.subject}</strong></td>
                  <td>{lesson.room}</td>
                  <td>{lesson.teacher}</td>
                  <td>
                    <button 
                      className="btn-icon-delete" 
                      onClick={() => deleteLesson(lesson.id)}
                      title="Удалить"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Добавить занятие</h2>
            <div className="form-group">
              <label>День недели</label>
              <select
                value={newLesson.day_of_week}
                onChange={(e) => setNewLesson({ ...newLesson, day_of_week: parseInt(e.target.value) })}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '2px solid #e2e8f0' }}
              >
                {days.map((day, index) => (
                  <option key={index} value={index + 1}>{day}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Время начала</label>
              <input
                type="time"
                value={newLesson.time_start}
                onChange={(e) => setNewLesson({ ...newLesson, time_start: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Время окончания</label>
              <input
                type="time"
                value={newLesson.time_end}
                onChange={(e) => setNewLesson({ ...newLesson, time_end: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Предмет</label>
              <input
                type="text"
                value={newLesson.subject}
                onChange={(e) => setNewLesson({ ...newLesson, subject: e.target.value })}
                placeholder="Название предмета"
              />
            </div>
            <div className="form-group">
              <label>Аудитория</label>
              <input
                type="text"
                value={newLesson.room}
                onChange={(e) => setNewLesson({ ...newLesson, room: e.target.value })}
                placeholder="Номер аудитории"
              />
            </div>
            <div className="form-group">
              <label>Преподаватель</label>
              <input
                type="text"
                value={newLesson.teacher}
                onChange={(e) => setNewLesson({ ...newLesson, teacher: e.target.value })}
                placeholder="ФИО преподавателя"
              />
            </div>
            <div className="modal-buttons">
              <button className="btn btn-blue" onClick={addLesson}>Добавить</button>
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Студенты группы
function GroupMembers({ groupId }) {
  const [members, setMembers] = useState([]);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    const { data } = await supabase
      .from('group_members')
      .select('*, users(full_name, email)')
      .eq('group_id', groupId);
    setMembers(data || []);
  };

  return (
    <div>
      <h3 style={{ marginBottom: '1rem' }}>Студенты группы ({members.length})</h3>
      {members.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👥</div>
          <p>В группе пока нет студентов</p>
        </div>
      ) : (
        members.map(member => (
          <div key={member.id} className="list-item">
            <div className="list-item-content">
              <h4>{member.users.full_name}</h4>
              <p>{member.users.email}</p>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// Панель студента
function StudentDashboard({ user }) {
  const [activeTab, setActiveTab] = useState('clubs');

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem', color: '#1e293b' }}>Добро пожаловать, {user.full_name}!</h2>

      <div className="tabs">
        <button className={`tab ${activeTab === 'clubs' ? 'active' : ''}`} onClick={() => setActiveTab('clubs')}>
          🎭 Клубы
        </button>
        <button className={`tab ${activeTab === 'events' ? 'active' : ''}`} onClick={() => setActiveTab('events')}>
          📅 Мероприятия
        </button>
        <button className={`tab ${activeTab === 'schedule' ? 'active' : ''}`} onClick={() => setActiveTab('schedule')}>
          📚 Расписание
        </button>
      </div>

      {activeTab === 'clubs' && <StudentClubs userId={user.id} />}
      {activeTab === 'events' && <StudentEvents userId={user.id} />}
      {activeTab === 'schedule' && <StudentSchedule userId={user.id} />}
    </div>
  );
}

// Клубы для студента
function StudentClubs({ userId }) {
  const [clubs, setClubs] = useState([]);
  const [myClubs, setMyClubs] = useState([]);
  const [selectedClub, setSelectedClub] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadClubs();
  }, []);

  const loadClubs = async () => {
    const { data: allClubs } = await supabase
      .from('clubs')
      .select('*, club_subscriptions(count)');
    const { data: subscriptions } = await supabase
      .from('club_subscriptions')
      .select('club_id')
      .eq('student_id', userId);

    const subscribedIds = subscriptions?.map(s => s.club_id) || [];
    setMyClubs(subscribedIds);
    setClubs(allClubs || []);
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

  const filteredClubs = clubs.filter(club => 
    club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    club.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="🔍 Поиск клубов..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      {filteredClubs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎭</div>
          <p>{searchQuery ? 'Клубы не найдены' : 'Пока нет клубов'}</p>
        </div>
      ) : (
        <div className="cards-grid">
          {filteredClubs.map(club => {
            const isSubscribed = myClubs.includes(club.id);
            return (
              <div 
                key={club.id} 
                className={`card card-interactive ${isSubscribed ? 'card-subscribed' : ''}`}
                onClick={() => setSelectedClub(club)}
              >
                <div className="card-header">
                  <h3>{club.name}</h3>
                  <span className="badge">{club.club_subscriptions?.[0]?.count || 0} 👥</span>
                </div>
                <p>{club.description || 'Без описания'}</p>
                <button
                  className={`btn ${isSubscribed ? 'btn-outline' : 'btn-blue'}`}
                  style={{ marginTop: '1rem', width: '100%' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSubscription(club.id);
                  }}
                >
                  {isSubscribed ? '✓ Подписан' : 'Подписаться'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {selectedClub && (
        <StudentClubDetailModal 
          club={selectedClub} 
          onClose={() => setSelectedClub(null)}
          isSubscribed={myClubs.includes(selectedClub.id)}
          onToggleSubscription={() => {
            toggleSubscription(selectedClub.id);
            setSelectedClub(null);
          }}
        />
      )}
    </div>
  );
}

// Модальное окно с деталями клуба для студента
function StudentClubDetailModal({ club, onClose, isSubscribed, onToggleSubscription }) {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    loadClubEvents();
  }, [club.id]);

  const loadClubEvents = async () => {
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('club_id', club.id)
      .gte('event_date', new Date().toISOString())
      .order('event_date', { ascending: true });
    
    setEvents(data || []);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{club.name}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="club-detail-content">
          <div className="detail-section">
            <h3>📝 Описание</h3>
            <p>{club.description || 'Описание отсутствует'}</p>
          </div>

          <div className="detail-section">
            <h3>📅 Предстоящие мероприятия ({events.length})</h3>
            {events.length === 0 ? (
              <p className="text-muted">Пока нет запланированных мероприятий</p>
            ) : (
              <div className="events-list">
                {events.map(event => (
                  <div key={event.id} className="event-item">
                    <strong>{event.title}</strong>
                    <span className="text-muted">
                      {new Date(event.event_date).toLocaleDateString('ru-RU')} • {event.location}
                    </span>
                    {event.description && <p className="text-muted">{event.description}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="modal-buttons">
          <button 
            className={`btn ${isSubscribed ? 'btn-outline' : 'btn-blue'}`}
            onClick={onToggleSubscription}
          >
            {isSubscribed ? '✓ Отписаться' : 'Подписаться на клуб'}
          </button>
          <button className="btn btn-outline" onClick={onClose}>Закрыть</button>
        </div>
      </div>
    </div>
  );
}

// Мероприятия для студента
function StudentEvents({ userId }) {
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState('all');
  const [myClubs, setMyClubs] = useState([]);

  useEffect(() => {
    loadMyClubs();
  }, []);

  useEffect(() => {
    loadEvents();
  }, [filter, myClubs]);

  const loadMyClubs = async () => {
    const { data } = await supabase
      .from('club_subscriptions')
      .select('club_id')
      .eq('student_id', userId);
    setMyClubs(data?.map(s => s.club_id) || []);
  };

  const loadEvents = async () => {
    let query = supabase
      .from('events')
      .select('*, clubs(name)')
      .order('event_date', { ascending: true });

    const now = new Date().toISOString();

    if (filter === 'upcoming') {
      query = query.gte('event_date', now);
    } else if (filter === 'my_clubs') {
      if (myClubs.length === 0) {
        setEvents([]);
        return;
      }
      query = query.in('club_id', myClubs).gte('event_date', now);
    }

    const { data } = await query;
    setEvents(data || []);
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <button 
          className={`btn btn-sm ${filter === 'all' ? 'btn-blue' : 'btn-outline'}`}
          onClick={() => setFilter('all')}
        >
          Все мероприятия
        </button>
        <button 
          className={`btn btn-sm ${filter === 'upcoming' ? 'btn-blue' : 'btn-outline'}`}
          onClick={() => setFilter('upcoming')}
        >
          Предстоящие
        </button>
        <button 
          className={`btn btn-sm ${filter === 'my_clubs' ? 'btn-blue' : 'btn-outline'}`}
          onClick={() => setFilter('my_clubs')}
        >
          Мои клубы
        </button>
      </div>

      {events.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📅</div>
          <p>Пока нет мероприятий</p>
        </div>
      ) : (
        events.map(event => (
          <div key={event.id} className="list-item">
            <div className="list-item-content">
              <h4>{event.title}</h4>
              <p>
                📅 {new Date(event.event_date).toLocaleDateString('ru-RU')} в {new Date(event.event_date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p>📍 {event.location}</p>
              {event.clubs && <p>🎭 {event.clubs.name}</p>}
              {event.description && <p style={{ marginTop: '0.5rem' }}>{event.description}</p>}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// Расписание для студента
function StudentSchedule({ userId }) {
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
      <div className="empty-state">
        <div className="empty-state-icon">📚</div>
        <p>Вы не состоите в учебной группе</p>
      </div>
    );
  }

  return (
    <div>
      <h3 style={{ marginBottom: '1rem' }}>Расписание группы {group.name}</h3>
      {schedule.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📅</div>
          <p>Расписание пока не заполнено</p>
        </div>
      ) : (
        <div className="schedule-table">
          <table>
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
                  <td>{lesson.time_start} - {lesson.time_end}</td>
                  <td><strong>{lesson.subject}</strong></td>
                  <td>{lesson.room}</td>
                  <td>{lesson.teacher}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default App;
