import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { formatDate } from '../utils/helpers';
import { useApp } from '../context/AppContext';
import { PageHeader, StatCard, Section, EmptyState, InlineLoading, List, ListItem } from '../components/UI';
import { MobilePageHeader } from '../components/MobileNav';

export function StudentDashboard() {
  const { user } = useApp();
  const [myClubs, setMyClubs] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [myGroup, setMyGroup] = useState(null);
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, [user.id]);

  const loadData = async () => {
    try {
      const { data: subs } = await supabase.from('club_subscriptions').select('*, clubs(name, description, icon)').eq('student_id', user.id);
      setMyClubs(subs || []);

      if (user.group_id) {
        const { data: group } = await supabase.from('study_groups').select('*, directions(name, faculties(name))').eq('id', user.group_id).single();
        setMyGroup(group);

        const today = new Date().getDay() || 7;
        if (today <= 6) {
          const { data: schedule } = await supabase.from('schedules').select('*').eq('group_id', user.group_id).eq('day_of_week', today).order('start_time');
          setTodaySchedule(schedule || []);
        }
      }

      const clubIds = subs?.map(s => s.club_id) || [];
      let query = supabase.from('events').select('*, clubs(name)').gte('event_date', new Date().toISOString()).order('event_date').limit(5);

      if (clubIds.length > 0) {
        query = query.or(`is_university_wide.eq.true,club_id.in.(${clubIds.join(',')})`);
      } else {
        query = query.eq('is_university_wide', true);
      }

      const { data: events } = await query;
      setUpcomingEvents(events || []);
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

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
          <StatCard icon="🎭" color="blue" value={myClubs.length} label="Моих клубов" delay={0} />
          <StatCard icon="📅" color="orange" value={upcomingEvents.length} label="События" delay={1} />
        </div>

        {todaySchedule.length > 0 && (
          <Section title="📚 Сегодня" delay={1}>
            <List>
              {todaySchedule.map((lesson) => (
                <ListItem key={lesson.id} icon="📖" title={lesson.subject} subtitle={`${lesson.start_time?.slice(0,5)} — ${lesson.end_time?.slice(0,5)} • ${lesson.room || ''}`} />
              ))}
            </List>
          </Section>
        )}

        <div className="grid-2">
          <Section title="🎭 Мои клубы" delay={2}>
            {myClubs.length === 0 ? (
              <EmptyState icon="🎭" text="Вы ещё не подписаны на клубы" small />
            ) : (
              <List>
                {myClubs.map((sub) => (
                  <ListItem key={sub.id} icon={sub.clubs?.icon || '🎭'} title={sub.clubs?.name} subtitle={sub.clubs?.description || 'Без описания'} />
                ))}
              </List>
            )}
          </Section>

          <Section title="📅 Предстоящие события" delay={3}>
            {upcomingEvents.length === 0 ? (
              <EmptyState icon="📅" text="Нет предстоящих событий" small />
            ) : (
              <List>
                {upcomingEvents.map((event) => (
                  <ListItem key={event.id} icon="📅" title={event.title} subtitle={`${formatDate(event.event_date)} • ${event.location || 'Место не указано'}`} />
                ))}
              </List>
            )}
          </Section>
        </div>
      </div>
    </>
  );
}

export default StudentDashboard;
