import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import { useApp } from '../context/AppContext';
import { useNotification } from '../context/NotificationContext';
import { haptic } from '../utils/haptic';
import { formatDate } from '../utils/helpers';
import { 
  PageHeader, 
  Button, 
  Badge,
  EmptyState,
  SkeletonCard,
  Card,
  CardHeader,
  CardIcon,
  CardInfo,
  CardTitle,
  CardDescription,
  CardMeta,
  CardMetaItem
} from '../components/UI';

/**
 * Club Detail Page - полная информация о клубе
 */
export function ClubDetailPage({ clubId, onBack, onEventClick }) {
  const { user } = useApp();
  const { notify } = useNotification();
  const [club, setClub] = useState(null);
  const [events, setEvents] = useState([]);
  const [members, setMembers] = useState([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    loadClubData();
  }, [clubId]);

  const loadClubData = useCallback(async () => {
    try {
      // Load club info
      const { data: clubData } = await supabase
        .from('clubs')
        .select('*, users!clubs_created_by_fkey(full_name)')
        .eq('id', clubId)
        .single();

      setClub(clubData);

      // Load club events
      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .eq('club_id', clubId)
        .order('event_date', { ascending: true })
        .limit(10);

      setEvents(eventsData || []);

      // Load members
      const { data: membersData } = await supabase
        .from('club_subscriptions')
        .select('*, users(id, full_name, email)')
        .eq('club_id', clubId)
        .order('subscribed_at', { ascending: false })
        .limit(20);

      setMembers(membersData || []);

      // Check subscription
      const { data: subData } = await supabase
        .from('club_subscriptions')
        .select('id')
        .eq('club_id', clubId)
        .eq('student_id', user.id)
        .single();

      setIsSubscribed(!!subData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading club:', error);
      setLoading(false);
    }
  }, [clubId, user.id]);

  const toggleSubscription = async () => {
    setSubscribing(true);
    try {
      if (isSubscribed) {
        await supabase
          .from('club_subscriptions')
          .delete()
          .eq('club_id', clubId)
          .eq('student_id', user.id);
        
        setIsSubscribed(false);
        setMembers(prev => prev.filter(m => m.users?.id !== user.id));
        notify.success('Вы отписались от клуба');
      } else {
        const { data } = await supabase
          .from('club_subscriptions')
          .insert({ club_id: clubId, student_id: user.id })
          .select('*, users(id, full_name, email)')
          .single();
        
        setIsSubscribed(true);
        if (data) setMembers(prev => [data, ...prev]);
        notify.success('Вы подписались на клуб');
      }
      haptic.success();
    } catch (error) {
      console.error('Error toggling subscription:', error);
      notify.error('Ошибка');
      haptic.error();
    } finally {
      setSubscribing(false);
    }
  };

  const isEventPast = (date) => new Date(date) < new Date();

  if (loading) {
    return (
      <>
        <PageHeader title="Загрузка..." onBack={onBack} />
        <div className="page-content">
          <SkeletonCard />
        </div>
      </>
    );
  }

  if (!club) {
    return (
      <>
        <PageHeader title="Клуб" onBack={onBack} />
        <div className="page-content">
          <EmptyState icon="😕" title="Клуб не найден" />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="" onBack={onBack} />
      
      <div className="page-content">
        {/* Club Header */}
        <div className="detail-header">
          <div className="detail-icon">{club.icon || '🎭'}</div>
          <h1 className="detail-title">{club.name}</h1>
          {club.category && (
            <Badge variant="blue">{club.category}</Badge>
          )}
        </div>

        {/* Stats */}
        <div className="detail-stats">
          <div className="detail-stat">
            <span className="detail-stat-value">{members.length}</span>
            <span className="detail-stat-label">участников</span>
          </div>
          <div className="detail-stat-divider" />
          <div className="detail-stat">
            <span className="detail-stat-value">{events.length}</span>
            <span className="detail-stat-label">мероприятий</span>
          </div>
        </div>

        {/* Subscribe Button */}
        <Button
          variant={isSubscribed ? 'secondary' : 'primary'}
          fullWidth
          onClick={toggleSubscription}
          disabled={subscribing}
          style={{ marginBottom: 'var(--space-xl)' }}
        >
          {subscribing 
            ? 'Загрузка...' 
            : isSubscribed 
              ? '✓ Вы подписаны' 
              : '+ Подписаться'
          }
        </Button>

        {/* Description */}
        {club.description && (
          <div className="detail-section">
            <h3 className="detail-section-title">📝 О клубе</h3>
            <p className="detail-description">{club.description}</p>
          </div>
        )}

        {/* Info */}
        <div className="detail-section">
          <h3 className="detail-section-title">ℹ️ Информация</h3>
          <div className="detail-info-list">
            {club.users?.full_name && (
              <div className="detail-info-item">
                <span className="detail-info-icon">👤</span>
                <span className="detail-info-label">Создатель</span>
                <span className="detail-info-value">{club.users.full_name}</span>
              </div>
            )}
            <div className="detail-info-item">
              <span className="detail-info-icon">📅</span>
              <span className="detail-info-label">Создан</span>
              <span className="detail-info-value">{formatDate(club.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Events */}
        <div className="detail-section">
          <h3 className="detail-section-title">📅 Мероприятия</h3>
          
          {events.length === 0 ? (
            <EmptyState 
              icon="📅" 
              text="Мероприятий пока нет" 
              small 
            />
          ) : (
            <div className="detail-events-list">
              {events.map((event) => {
                const isPast = isEventPast(event.event_date);
                return (
                  <div 
                    key={event.id} 
                    className={`detail-event-item ${isPast ? 'past' : ''}`}
                    onClick={() => onEventClick && onEventClick(event.id)}
                  >
                    <div className="detail-event-date">
                      <span className="detail-event-day">
                        {new Date(event.event_date).getDate()}
                      </span>
                      <span className="detail-event-month">
                        {new Date(event.event_date).toLocaleDateString('ru', { month: 'short' })}
                      </span>
                    </div>
                    <div className="detail-event-info">
                      <div className="detail-event-title">{event.title}</div>
                      <div className="detail-event-meta">
                        {event.location && <span>📍 {event.location}</span>}
                      </div>
                    </div>
                    {isPast && <Badge variant="secondary">Прошло</Badge>}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Members */}
        <div className="detail-section">
          <h3 className="detail-section-title">👥 Участники ({members.length})</h3>
          
          {members.length === 0 ? (
            <EmptyState 
              icon="👥" 
              text="Пока нет участников" 
              small 
            />
          ) : (
            <div className="detail-members-grid">
              {members.slice(0, 12).map((member) => (
                <div key={member.id} className="detail-member">
                  <div className="detail-member-avatar">
                    {member.users?.full_name?.charAt(0) || '?'}
                  </div>
                  <span className="detail-member-name">
                    {member.users?.full_name?.split(' ')[0] || 'Участник'}
                  </span>
                </div>
              ))}
              {members.length > 12 && (
                <div className="detail-member more">
                  <div className="detail-member-avatar">+{members.length - 12}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default ClubDetailPage;
