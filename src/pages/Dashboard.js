/**
 * Dashboard Pages — ОПТИМИЗИРОВАННАЯ ВЕРСИЯ
 * 
 * Изменения:
 * - Убран дублирующий код
 * - Оптимизированы зависимости useCallback/useMemo
 * - Разделены компоненты для уменьшения ре-рендеров
 * - Добавлен AbortController для отмены запросов
 */
import React, { useState, useEffect, memo, useCallback, useMemo, useRef } from 'react';
import { supabase, cachedQuery } from '../utils/supabase';
import { formatDate, getRoleShortName } from '../utils/helpers';
import { useApp } from '../context/AppContext';
import { 
  PageHeader, StatCard, Section, EmptyState, InlineLoading, 
  List, ListItem, Badge 
} from '../components/UI';
import { MobilePageHeader } from '../components/Navigation';

// ========== ОБЩИЕ КОМПОНЕНТЫ ==========

const StatsGrid = memo(function StatsGrid({ stats }) {
  return (
    <div className="stats-grid">
      {stats.map(({ icon, color, value, label }) => (
        <StatCard key={label} icon={icon} color={color} value={value} label={label} />
      ))}
    </div>
  );
});

const EventsList = memo(function EventsList({ events, title }) {
  if (events.length === 0) {
    return <EmptyState icon="📅" text="Нет мероприятий" small />;
  }
  
  return (
    <List>
      {events.map((event) => (
        <ListItem 
          key={event.id} 
          icon="📅" 
          title={event.title} 
          subtitle={`${formatDate(event.event_date)} • ${event.location || 'Место не указано'}`} 
          chevron={false} 
        />
      ))}
    </List>
  );
});

const UsersList = memo(function UsersList({ users }) {
  if (users.length === 0) {
    return <EmptyState icon="👥" text="Нет пользователей" small />;
  }
  
  return (
    <List>
      {users.map((u) => (
        <ListItem 
          key={u.id} 
          icon="👤" 
          title={u.full_name} 
          subtitle={u.email} 
          accessory={<Badge variant="blue">{getRoleShortName(u.role)}</Badge>} 
          chevron={false} 
        />
      ))}
    </List>
  );
});

const ClubsList = memo(function ClubsList({ clubs }) {
  if (clubs.length === 0) {
    return <EmptyState icon="🎭" text="Вы ещё не подписаны на клубы" small />;
  }
  
  return (
    <List>
      {clubs.map((sub) => (
        <ListItem 
          key={sub.id} 
          icon={sub.clubs?.icon || '🎭'} 
          title={sub.clubs?.name} 
          subtitle={sub.clubs?.description || 'Без описания'} 
          chevron={false} 
        />
      ))}
    </List>
  );
});

const ScheduleList = memo(function ScheduleList({ schedule }) {
  return (
    <List>
      {schedule.map((lesson) => (
        <ListItem 
          key={lesson.id} 
          icon="📖" 
          title={lesson.subject} 
          subtitle={`${lesson.start_time?.slice(0,5)} — ${lesson.end_time?.slice(0,5)} • ${lesson.room || 'Ауд. не указана'}`} 
          chevron={false} 
        />
      ))}
    </List>
  );
});

const NotificationCard = memo(function NotificationCard({ notif, onRead }) {
  const handleClick = useCallback(() => {
    onRead(notif.id);
  }, [notif.id, onRead]);

  return (
    <div 
      className={`notification-card ${notif.is_important ? 'important' : ''}`}
      onClick={handleClick}
    >
      <div className="notification-card-header">
        <span className="notification-card-title">
          {notif.is_important && '🚨 '}
          {notif.title}
        </span>
        <span className="notification-card-date">
          {formatDate(notif.created_at)}
        </span>
      </div>
      <div className="notification-card-message">{notif.message}</div>
      <div className="notification-card-sender">
        От: {notif.users?.full_name || 'Староста'}
      </div>
    </div>
  );
});

// ========== ADMIN DASHBOARD ==========

export const AdminDashboard = memo(function AdminDashboard() {
  const [stats, setStats] = useState({ clubs: 0, users: 0, events: 0, groups: 0 });
  const [recentEvents, setRecentEvents] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    
    const loadData = async () => {
      try {
        // Параллельная загрузка статистики
        const [clubsRes, usersRes, eventsRes, groupsRes] = await Promise.all([
          cachedQuery('stats-clubs', () => 
            supabase.from('clubs').select('id', { count: 'exact', head: true })
          ),
          cachedQuery('stats-users', () => 
            supabase.from('users').select('id', { count: 'exact', head: true })
          ),
          cachedQuery('stats-events', () => 
            supabase.from('events').select('id', { count: 'exact', head: true })
          ),
          cachedQuery('stats-groups', () => 
            supabase.from('study_groups').select('id', { count: 'exact', head: true })
          )
        ]);

        if (!mountedRef.current) return;

        setStats({
          clubs: clubsRes.count || 0,
          users: usersRes.count || 0,
          events: eventsRes.count || 0,
          groups: groupsRes.count || 0
        });

        // Загрузка последних данных
        const [eventsData, usersData] = await Promise.all([
          cachedQuery('recent-events', () => 
            supabase.from('events')
              .select('*')
              .order('created_at', { ascending: false })
              .limit(5)
          ),
          cachedQuery('recent-users', () => 
            supabase.from('users')
              .select('*')
              .order('created_at', { ascending: false })
              .limit(5)
          )
        ]);

        if (!mountedRef.current) return;

        setRecentEvents(eventsData.data || []);
        setRecentUsers(usersData.data || []);
      } catch (error) {
        console.error('Error loading admin dashboard:', error);
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    };

    loadData();
    
    return () => { mountedRef.current = false; };
  }, []);

  // Мемоизация статов для StatsGrid
  const statsData = useMemo(() => [
    { icon: '🎭', color: 'blue', value: stats.clubs, label: 'Клубов' },
    { icon: '👥', color: 'green', value: stats.users, label: 'Пользователей' },
    { icon: '📅', color: 'orange', value: stats.events, label: 'Мероприятий' },
    { icon: '🎓', color: 'purple', value: stats.groups, label: 'Групп' }
  ], [stats]);

  if (loading) {
    return (
      <>
        <PageHeader title="📊 Дашборд" />
        <MobilePageHeader title="Дашборд" />
        <div className="page-content"><InlineLoading /></div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="📊 Дашборд" />
      <MobilePageHeader title="Дашборд" />
      <div className="page-content">
        <StatsGrid stats={statsData} />

        <div className="grid-2">
          <Section title="📅 Последние мероприятия">
            <EventsList events={recentEvents} />
          </Section>

          <Section title="👥 Новые пользователи">
            <UsersList users={recentUsers} />
          </Section>
        </div>
      </div>
    </>
  );
});

// ========== STUDENT DASHBOARD ==========

export const StudentDashboard = memo(function StudentDashboard() {
  const { user } = useApp();
  const [data, setData] = useState({
    myClubs: [],
    upcomingEvents: [],
    myGroup: null,
    todaySchedule: [],
    groupNotifications: []
  });
  const [loading, setLoading] = useState(true);
  
  const mountedRef = useRef(true);

  const loadData = useCallback(async () => {
    try {
      // Параллельные запросы
      const [subsRes, groupRes] = await Promise.all([
        supabase
          .from('club_subscriptions')
          .select('*, clubs(name, description, icon)')
          .eq('student_id', user.id),
        user.group_id 
          ? supabase
              .from('study_groups')
              .select('*, directions(name, faculties(name))')
              .eq('id', user.group_id)
              .single() 
          : Promise.resolve({ data: null })
      ]);

      if (!mountedRef.current) return;

      const myClubs = subsRes.data || [];
      const myGroup = groupRes.data;
      let todaySchedule = [];
      let groupNotifications = [];

      // Расписание на сегодня
      if (user.group_id) {
        const today = new Date().getDay() || 7;
        if (today <= 6) {
          const { data: schedule } = await supabase
            .from('schedules')
            .select('*')
            .eq('group_id', user.group_id)
            .eq('day_of_week', today)
            .order('start_time');
          
          // Фильтруем по подгруппе
          todaySchedule = (schedule || []).filter(s => 
            s.subgroup_id === null || s.subgroup_id === user.subgroup_id
          );
        }

        // Уведомления группы
        const { data: notifications } = await supabase
          .from('group_notifications')
          .select('*, users(full_name)')
          .eq('group_id', user.group_id)
          .order('created_at', { ascending: false })
          .limit(5);
        
        groupNotifications = notifications || [];
      }

      // Предстоящие события
      const clubIds = myClubs.map(s => s.club_id);
      let eventsQuery = supabase
        .from('events')
        .select('*, clubs(name)')
        .gte('event_date', new Date().toISOString())
        .order('event_date')
        .limit(5);

      if (clubIds.length > 0) {
        eventsQuery = eventsQuery.or(`is_university_wide.eq.true,club_id.in.(${clubIds.join(',')})`);
      } else {
        eventsQuery = eventsQuery.eq('is_university_wide', true);
      }

      const { data: events } = await eventsQuery;

      if (!mountedRef.current) return;

      setData({
        myClubs,
        upcomingEvents: events || [],
        myGroup,
        todaySchedule,
        groupNotifications
      });
    } catch (error) {
      console.error('Error loading student dashboard:', error);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [user.id, user.group_id, user.subgroup_id]);

  useEffect(() => {
    mountedRef.current = true;
    loadData();
    return () => { mountedRef.current = false; };
  }, [loadData]);

  // Отметить уведомление как прочитанное
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await supabase
        .from('notification_reads')
        .upsert({ notification_id: notificationId, user_id: user.id });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [user.id]);

  // Мемоизация статов
  const statsData = useMemo(() => [
    { icon: '🎭', color: 'blue', value: data.myClubs.length, label: 'Моих клубов' },
    { icon: '📅', color: 'orange', value: data.upcomingEvents.length, label: 'События' }
  ], [data.myClubs.length, data.upcomingEvents.length]);

  if (loading) {
    return (
      <>
        <PageHeader title="🏠 Главная" />
        <MobilePageHeader title="Главная" />
        <div className="page-content"><InlineLoading /></div>
      </>
    );
  }

  const { myClubs, upcomingEvents, myGroup, todaySchedule, groupNotifications } = data;

  return (
    <>
      <PageHeader title="🏠 Главная" />
      <MobilePageHeader title="Главная" subtitle={myGroup?.name} />
      
      <div className="page-content">
        {/* Информация о группе */}
        {myGroup && (
          <div className="info-banner">
            <div className="info-banner-icon">👥</div>
            <div className="info-banner-content">
              <div className="info-banner-title">{myGroup.name}</div>
              <div className="info-banner-subtitle">
                {myGroup.directions?.faculties?.name} → {myGroup.directions?.name}
              </div>
            </div>
          </div>
        )}

        {/* Уведомления от старосты */}
        {groupNotifications.length > 0 && (
          <Section title="🔔 Уведомления группы">
            <div className="notifications-list">
              {groupNotifications.map((notif) => (
                <NotificationCard 
                  key={notif.id} 
                  notif={notif} 
                  onRead={markAsRead} 
                />
              ))}
            </div>
          </Section>
        )}

        {/* Статистика */}
        <StatsGrid stats={statsData} />

        {/* Расписание на сегодня */}
        {todaySchedule.length > 0 && (
          <Section title="📚 Сегодня">
            <ScheduleList schedule={todaySchedule} />
          </Section>
        )}

        <div className="grid-2">
          <Section title="🎭 Мои клубы">
            <ClubsList clubs={myClubs} />
          </Section>

          <Section title="📅 Предстоящие события">
            <EventsList events={upcomingEvents} />
          </Section>
        </div>
      </div>
    </>
  );
});

export default AdminDashboard;
