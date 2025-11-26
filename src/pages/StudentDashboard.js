import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { formatDate } from '../utils/helpers';
import { 
  PageHeader, 
  StatCard, 
  Section, 
  EmptyState, 
  InlineLoading,
  List,
  ListItem
} from '../components/UI';

/**
 * Student Dashboard Page
 */
export function StudentDashboard({ userId }) {
  const [myClubs, setMyClubs] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    try {
      // Fetch user's club subscriptions
      const { data: subs } = await supabase
        .from('club_subscriptions')
        .select('*, clubs(name, description)')
        .eq('student_id', userId);
      setMyClubs(subs || []);

      // Fetch upcoming events
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
          <InlineLoading />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="🏠 Главная" />
      <div className="page-content">
        {/* Stats */}
        <div className="stats-grid">
          <StatCard 
            icon="🎭" 
            color="blue" 
            value={myClubs.length} 
            label="Моих клубов" 
            delay={0}
          />
          <StatCard 
            icon="📅" 
            color="orange" 
            value={upcomingEvents.length} 
            label="Предстоящих событий" 
            delay={1}
          />
        </div>

        {/* Content */}
        <div className="grid-2">
          <Section title="🎭 Мои клубы" delay={1}>
            {myClubs.length === 0 ? (
              <EmptyState 
                icon="🎭" 
                text="Вы ещё не подписаны на клубы" 
                small 
              />
            ) : (
              <List>
                {myClubs.map((sub) => (
                  <ListItem
                    key={sub.id}
                    icon="🎭"
                    title={sub.clubs?.name}
                    subtitle={sub.clubs?.description || 'Без описания'}
                  />
                ))}
              </List>
            )}
          </Section>

          <Section title="📅 Предстоящие события" delay={2}>
            {upcomingEvents.length === 0 ? (
              <EmptyState 
                icon="📅" 
                text="Нет предстоящих событий" 
                small 
              />
            ) : (
              <List>
                {upcomingEvents.map((event) => (
                  <ListItem
                    key={event.id}
                    icon="📅"
                    title={event.title}
                    subtitle={`${formatDate(event.event_date)} • ${event.location || 'Место не указано'}`}
                  />
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
