/**
 * Dashboard Pages — Оптимизированные
 */
import React, { useState, useEffect, memo } from 'react';
import { supabase, cachedQuery } from '../utils/supabase';
import { formatDate, getRoleShortName } from '../utils/helpers';
import { useApp } from '../context/AppContext';
import { PageHeader, StatCard, Section, EmptyState, InlineLoading, List, ListItem, Badge } from '../components/UI';
import { MobilePageHeader } from '../components/Navigation';

// Admin Dashboard
export const AdminDashboard = memo(function AdminDashboard() {
  const [stats, setStats] = useState({ clubs: 0, users: 0, events: 0, faculties: 0 });
  const [recentEvents, setRecentEvents] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Параллельные запросы с кэшированием
        const [clubsRes, usersRes, eventsRes, facultiesRes] = await Promise.all([
          cachedQuery('stats-clubs', () => supabase.from('clubs').select('id', { count: 'exact', head: true })),
          cachedQuery('stats-users', () => supabase.from('users').select('id', { count: 'exact', head: true })),
          cachedQuery('stats-events', () => supabase.from('events').select('id', { count: 'exact', head: true })),
          cachedQuery('stats-faculties', () => supabase.from('faculties').select('id', { count: 'exact', head: true }))
        ]);

        setStats({
          clubs: clubsRes.count || 0,
          users: usersRes.count || 0,
          events: eventsRes.count || 0,
          faculties: facultiesRes.count || 0
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
          <StatCard icon="🏛️" color="purple" value={stats.faculties} label="Факультетов" />
        </div>

        <div className="grid-2">
          <Section title="📅 Последние мероприятия">
            {recentEvents.length === 0 ? (
              <EmptyState icon="📅" text="Нет мероприятий" small />
            ) : (
              <List>
                {recentEvents.map((event) => (
                  <ListItem key={event.id} icon="📅" title={event.title} subtitle={`${formatDate(event.event_date)} • ${event.location || 'Место не указано'}`} chevron={false} />
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
                  <ListItem key={u.id} icon="👤" title={u.full_name} subtitle={u.email} accessory={<Badge variant="blue">{getRoleShortName(u.role)}</Badge>} chevron={false} />
                ))}
              </List>
            )}
          </Section>
        </div>
      </div>
    </>
  );
});

// Student Dashboard
export const StudentDashboard = memo(function StudentDashboard() {
  const { user } = useApp();
  const [myClubs, setMyClubs] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [myGroup, setMyGroup] = useState(null);
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Параллельные запросы
        const [subsRes, groupRes] = await Promise.all([
          supabase.from('club_subscriptions').select('*, clubs(name, description, icon)').eq('student_id', user.id),
          user.group_id ? supabase.from('study_groups').select('*, directions(name, faculties(name))').eq('id', user.group_id).single() : Promise.resolve({ data: null })
        ]);

        setMyClubs(subsRes.data || []);
        setMyGroup(groupRes.data);

        // Расписание на сегодня
        if (user.group_id) {
          const today = new Date().getDay() || 7;
          if (today <= 6) {
            const { data: schedule } = await supabase.from('schedules').select('*').eq('group_id', user.group_id).eq('day_of_week', today).order('start_time');
            setTodaySchedule(schedule || []);
          }
        }

        // Предстоящие события
        const clubIds = subsRes.data?.map(s => s.club_id) || [];
        let query = supabase.from('events').select('*, clubs(name)').gte('event_date', new Date().toISOString()).order('event_date').limit(5);

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
    };

    loadData();
  }, [user.id, user.group_id]);

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
      <MobilePageHeader title="Главная" subtitle={myGroup ? myGroup.name : null} />
      <div className="page-content">
        {myGroup && (
          <div className="info-banner">
            <div className="info-banner-icon">👥</div>
            <div className="info-banner-content">
              <div className="info-banner-title">{myGroup.name}</div>
              <div className="info-banner-subtitle">{myGroup.directions?.faculties?.name} • {myGroup.directions?.name}</div>
            </div>
          </div>
        )}

        <div className="stats-grid">
          <StatCard icon="🎭" color="blue" value={myClubs.length} label="Моих клубов" />
          <StatCard icon="📅" color="orange" value={upcomingEvents.length} label="События" />
        </div>

        {todaySchedule.length > 0 && (
          <Section title="📚 Сегодня">
            <List>
              {todaySchedule.map((lesson) => (
                <ListItem key={lesson.id} icon="📖" title={lesson.subject} subtitle={`${lesson.start_time?.slice(0,5)} — ${lesson.end_time?.slice(0,5)} • ${lesson.room || ''}`} chevron={false} />
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
                  <ListItem key={sub.id} icon={sub.clubs?.icon || '🎭'} title={sub.clubs?.name} subtitle={sub.clubs?.description || 'Без описания'} chevron={false} />
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
                  <ListItem key={event.id} icon="📅" title={event.title} subtitle={`${formatDate(event.event_date)} • ${event.location || 'Место не указано'}`} chevron={false} />
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
