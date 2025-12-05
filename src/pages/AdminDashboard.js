import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { formatDate, getRoleShortName } from '../utils/helpers';
import { PageHeader, StatCard, Section, EmptyState, InlineLoading, List, ListItem, Badge } from '../components/UI';
import { MobilePageHeader } from '../components/MobileNav';

export function AdminDashboard() {
  const [stats, setStats] = useState({ clubs: 0, users: 0, events: 0, faculties: 0 });
  const [recentEvents, setRecentEvents] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

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

      const { data: events } = await supabase.from('events').select('*').order('created_at', { ascending: false }).limit(5);
      setRecentEvents(events || []);

      const { data: users } = await supabase.from('users').select('*').order('created_at', { ascending: false }).limit(5);
      setRecentUsers(users || []);

      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

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
          <StatCard icon="🎭" color="blue" value={stats.clubs} label="Клубов" delay={0} />
          <StatCard icon="👥" color="green" value={stats.users} label="Пользователей" delay={1} />
          <StatCard icon="📅" color="orange" value={stats.events} label="Мероприятий" delay={2} />
          <StatCard icon="🏛️" color="purple" value={stats.faculties} label="Факультетов" delay={3} />
        </div>

        <div className="grid-2">
          <Section title="📅 Последние мероприятия" delay={1}>
            {recentEvents.length === 0 ? (
              <EmptyState icon="📅" text="Нет мероприятий" small />
            ) : (
              <List>
                {recentEvents.map((event) => (
                  <ListItem key={event.id} icon="📅" title={event.title} subtitle={`${formatDate(event.event_date)} • ${event.location || 'Место не указано'}`} />
                ))}
              </List>
            )}
          </Section>

          <Section title="👥 Новые пользователи" delay={2}>
            {recentUsers.length === 0 ? (
              <EmptyState icon="👥" text="Нет пользователей" small />
            ) : (
              <List>
                {recentUsers.map((u) => (
                  <ListItem key={u.id} icon="👤" title={u.full_name} subtitle={u.email} accessory={<Badge variant="blue">{getRoleShortName(u.role)}</Badge>} />
                ))}
              </List>
            )}
          </Section>
        </div>
      </div>
    </>
  );
}

export default AdminDashboard;
