/**
 * Dashboard Pages — с уведомлениями группы
 */
import React, { useState, useEffect, memo, useCallback } from 'react';
import { supabase, cachedQuery } from '../utils/supabase';
import { formatDate, getRoleShortName } from '../utils/helpers';
import { useApp } from '../context/AppContext';
import { PageHeader, StatCard, Section, EmptyState, InlineLoading, List, ListItem, Badge } from '../components/UI';
import { MobilePageHeader } from '../components/Navigation';

// Admin Dashboard
export const AdminDashboard = memo(function AdminDashboard() {
  const [stats, setStats] = useState({ clubs: 0, users: 0, events: 0, groups: 0 });
  const [recentEvents, setRecentEvents] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [clubsRes, usersRes, eventsRes, groupsRes] = await Promise.all([
          cachedQuery('stats-clubs', () => supabase.from('clubs').select('id', { count: 'exact', head: true })),
          cachedQuery('stats-users', () => supabase.from('users').select('id', { count: 'exact', head: true })),
          cachedQuery('stats-events', () => supabase.from('events').select('id', { count: 'exact', head: true })),
          cachedQuery('stats-groups', () => supabase.from('study_groups').select('id', { count: 'exact', head: true }))
        ]);

        setStats({
          clubs: clubsRes.count || 0,
          users: usersRes.count || 0,
          events: eventsRes.count || 0,
          groups: groupsRes.count || 0
        });

        const [eventsData, usersData] = await Promise.all([
          cachedQuery('recent-events', () => supabase.from('events').select('*').order('created_at', { ascending: false }).limit(5)),
          cachedQuery('recent-users', () => supabase.from('users').select('*').order('created_at', { ascending: false }).limit(5))
        ]);

        setRecentEvents(eventsData.data || []);
        setRecentUsers(usersData.data || []);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

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
        <div className="stats-grid">
          <StatCard icon="🎭" color="blue" value={stats.clubs} label="Клубов" />
          <StatCard icon="👥" color="green" value={stats.users} label="Пользователей" />
          <StatCard icon="📅" color="orange" value={stats.events} label="Мероприятий" />
          <StatCard icon="🎓" color="purple" value={stats.groups} label="Групп" />
        </div>

        <div className="grid-2">
          <Section title="📅 Последние мероприятия">
            {recentEvents.length === 0 ? (
              <EmptyState icon="📅" text="Нет мероприятий" small />
            ) : (
              <List>
                {recentEvents.map((event) => (
                  <ListItem 
                    key={event.id} 
                    icon="📅" 
                    title={event.title} 
                    subtitle={`${formatDate(event.event_date)} • ${event.location || 'Место не указано'}`} 
                    chevron={false} 
                  />
                ))}
              </List>
            )}
          </Section>

          <Section title="👥 Новые пользователи">
            {recentUsers.length === 0 ? (
              <EmptyState icon="👥" text="Нет пользователей" small />
            ) : (
              <List>
                {recentUsers.map((u) => (
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
            )}
          </Section>
        </div>
      </div>
    </>
  );
});

// Student Dashboard — с уведомлениями группы
export const StudentDashboard = memo(function StudentDashboard() {
  const { user } = useApp();
  const [myClubs, setMyClubs] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [myGroup, setMyGroup] = useState(null);
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [groupNotifications, setGroupNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

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

      setMyClubs(subsRes.data || []);
      setMyGroup(groupRes.data);

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
          
          // Фильтруем по подгруппе если есть
          let filtered = schedule || [];
          if (user.subgroup_id) {
            filtered = filtered.filter(s => 
              s.subgroup_id === null || s.subgroup_id === user.subgroup_id
            );
          }
          setTodaySchedule(filtered);
        }

        // Уведомления группы
        const { data: notifications } = await supabase
          .from('group_notifications')
          .select('*, users(full_name)')
          .eq('group_id', user.group_id)
          .order('created_at', { ascending: false })
          .limit(5);
        
        setGroupNotifications(notifications || []);
      }

      // Предстоящие события
      const clubIds = subsRes.data?.map(s => s.club_id) || [];
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
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [user.id, user.group_id, user.subgroup_id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Отметить уведомление как прочитанное
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await supabase
        .from('notification_reads')
        .upsert({
          notification_id: notificationId,
          user_id: user.id
        });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [user.id]);

  if (loading) {
    return (
      <>
        <PageHeader title="🏠 Главная" />
        <MobilePageHeader title="Главная" />
        <div className="page-content"><InlineLoading /></div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="🏠 Главная" />
      <MobilePageHeader 
        title="Главная" 
        subtitle={myGroup ? myGroup.name : null} 
      />
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
                <div 
                  key={notif.id} 
                  className={`notification-card ${notif.is_important ? 'important' : ''}`}
                  onClick={() => markAsRead(notif.id)}
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
              ))}
            </div>
          </Section>
        )}

        {/* Статистика */}
        <div className="stats-grid">
          <StatCard icon="🎭" color="blue" value={myClubs.length} label="Моих клубов" />
          <StatCard icon="📅" color="orange" value={upcomingEvents.length} label="События" />
        </div>

        {/* Расписание на сегодня */}
        {todaySchedule.length > 0 && (
          <Section title="📚 Сегодня">
            <List>
              {todaySchedule.map((lesson) => (
                <ListItem 
                  key={lesson.id} 
                  icon="📖" 
                  title={lesson.subject} 
                  subtitle={`${lesson.start_time?.slice(0,5)} — ${lesson.end_time?.slice(0,5)} • ${lesson.room || 'Ауд. не указана'}`} 
                  chevron={false} 
                />
              ))}
            </List>
          </Section>
        )}

        <div className="grid-2">
          <Section title="🎭 Мои клубы">
            {myClubs.length === 0 ? (
              <EmptyState icon="🎭" text="Вы ещё не подписаны на клубы" small />
            ) : (
              <List>
                {myClubs.map((sub) => (
                  <ListItem 
                    key={sub.id} 
                    icon={sub.clubs?.icon || '🎭'} 
                    title={sub.clubs?.name} 
                    subtitle={sub.clubs?.description || 'Без описания'} 
                    chevron={false} 
                  />
                ))}
              </List>
            )}
          </Section>

          <Section title="📅 Предстоящие события">
            {upcomingEvents.length === 0 ? (
              <EmptyState icon="📅" text="Нет предстоящих событий" small />
            ) : (
              <List>
                {upcomingEvents.map((event) => (
                  <ListItem 
                    key={event.id} 
                    icon="📅" 
                    title={event.title} 
                    subtitle={`${formatDate(event.event_date)} • ${event.location || 'Место не указано'}`} 
                    chevron={false} 
                  />
                ))}
              </List>
            )}
          </Section>
        </div>
      </div>
    </>
  );
});

export default AdminDashboard;
