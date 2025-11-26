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
  SkeletonCard
} from '../components/UI';

/**
 * Event Detail Page - полная информация о мероприятии
 */
export function EventDetailPage({ eventId, onBack, onClubClick }) {
  const { user } = useApp();
  const { notify } = useNotification();
  const [event, setEvent] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [isAttending, setIsAttending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    loadEventData();
  }, [eventId]);

  const loadEventData = useCallback(async () => {
    try {
      // Load event info
      const { data: eventData } = await supabase
        .from('events')
        .select('*, clubs(id, name, icon), users!events_created_by_fkey(full_name)')
        .eq('id', eventId)
        .single();

      setEvent(eventData);

      // Load attendees
      const { data: attendeesData } = await supabase
        .from('event_registrations')
        .select('*, users(id, full_name, email)')
        .eq('event_id', eventId)
        .order('registered_at', { ascending: false })
        .limit(50);

      setAttendees(attendeesData || []);

      // Check if user is attending
      const { data: regData } = await supabase
        .from('event_registrations')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .single();

      setIsAttending(!!regData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading event:', error);
      setLoading(false);
    }
  }, [eventId, user.id]);

  const toggleAttendance = async () => {
    setRegistering(true);
    try {
      if (isAttending) {
        await supabase
          .from('event_registrations')
          .delete()
          .eq('event_id', eventId)
          .eq('user_id', user.id);
        
        setIsAttending(false);
        setAttendees(prev => prev.filter(a => a.users?.id !== user.id));
        notify.success('Вы отменили участие');
      } else {
        const { data } = await supabase
          .from('event_registrations')
          .insert({ event_id: eventId, user_id: user.id })
          .select('*, users(id, full_name, email)')
          .single();
        
        setIsAttending(true);
        if (data) setAttendees(prev => [data, ...prev]);
        notify.success('Вы записались на мероприятие');
      }
      haptic.success();
    } catch (error) {
      console.error('Error toggling attendance:', error);
      notify.error('Ошибка');
      haptic.error();
    } finally {
      setRegistering(false);
    }
  };

  const isPast = event && new Date(event.event_date) < new Date();

  const formatEventDate = (dateStr) => {
    const date = new Date(dateStr);
    const options = { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    };
    return date.toLocaleDateString('ru', options);
  };

  const getTimeUntil = (dateStr) => {
    const now = new Date();
    const eventDate = new Date(dateStr);
    const diff = eventDate - now;
    
    if (diff < 0) return null;
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `Через ${days} дн.`;
    if (hours > 0) return `Через ${hours} ч.`;
    return 'Скоро начнётся!';
  };

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

  if (!event) {
    return (
      <>
        <PageHeader title="Мероприятие" onBack={onBack} />
        <div className="page-content">
          <EmptyState icon="😕" title="Мероприятие не найдено" />
        </div>
      </>
    );
  }

  const timeUntil = getTimeUntil(event.event_date);

  return (
    <>
      <PageHeader title="" onBack={onBack} />
      
      <div className="page-content">
        {/* Event Header */}
        <div className="detail-header">
          <div className="detail-icon">📅</div>
          <h1 className="detail-title">{event.title}</h1>
          <div className="detail-badges">
            {isPast ? (
              <Badge variant="secondary">Завершено</Badge>
            ) : (
              <Badge variant="green">{timeUntil}</Badge>
            )}
          </div>
        </div>

        {/* Date & Time */}
        <div className="event-datetime">
          <div className="event-datetime-icon">🗓</div>
          <div className="event-datetime-text">
            {formatEventDate(event.event_date)}
          </div>
        </div>

        {/* Stats */}
        <div className="detail-stats">
          <div className="detail-stat">
            <span className="detail-stat-value">{attendees.length}</span>
            <span className="detail-stat-label">участников</span>
          </div>
          {event.max_participants && (
            <>
              <div className="detail-stat-divider" />
              <div className="detail-stat">
                <span className="detail-stat-value">{event.max_participants}</span>
                <span className="detail-stat-label">макс. мест</span>
              </div>
            </>
          )}
        </div>

        {/* Register Button */}
        {!isPast && (
          <Button
            variant={isAttending ? 'secondary' : 'primary'}
            fullWidth
            onClick={toggleAttendance}
            disabled={registering}
            style={{ marginBottom: 'var(--space-xl)' }}
          >
            {registering 
              ? 'Загрузка...' 
              : isAttending 
                ? '✓ Вы записаны' 
                : '+ Записаться'
            }
          </Button>
        )}

        {isPast && (
          <div className="event-past-notice">
            <span>📆</span>
            <span>Это мероприятие уже прошло</span>
          </div>
        )}

        {/* Description */}
        {event.description && (
          <div className="detail-section">
            <h3 className="detail-section-title">📝 Описание</h3>
            <p className="detail-description">{event.description}</p>
          </div>
        )}

        {/* Info */}
        <div className="detail-section">
          <h3 className="detail-section-title">ℹ️ Информация</h3>
          <div className="detail-info-list">
            {event.location && (
              <div className="detail-info-item">
                <span className="detail-info-icon">📍</span>
                <span className="detail-info-label">Место</span>
                <span className="detail-info-value">{event.location}</span>
              </div>
            )}
            {event.clubs && (
              <div 
                className="detail-info-item clickable"
                onClick={() => onClubClick && onClubClick(event.clubs.id)}
              >
                <span className="detail-info-icon">{event.clubs.icon || '🎭'}</span>
                <span className="detail-info-label">Клуб</span>
                <span className="detail-info-value">{event.clubs.name}</span>
                <span className="detail-info-arrow">›</span>
              </div>
            )}
            {event.users?.full_name && (
              <div className="detail-info-item">
                <span className="detail-info-icon">👤</span>
                <span className="detail-info-label">Организатор</span>
                <span className="detail-info-value">{event.users.full_name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Attendees */}
        <div className="detail-section">
          <h3 className="detail-section-title">👥 Участники ({attendees.length})</h3>
          
          {attendees.length === 0 ? (
            <EmptyState 
              icon="👥" 
              text="Пока никто не записался" 
              small 
            />
          ) : (
            <div className="detail-members-grid">
              {attendees.slice(0, 12).map((attendee) => (
                <div key={attendee.id} className="detail-member">
                  <div className="detail-member-avatar">
                    {attendee.users?.full_name?.charAt(0) || '?'}
                  </div>
                  <span className="detail-member-name">
                    {attendee.users?.full_name?.split(' ')[0] || 'Участник'}
                  </span>
                </div>
              ))}
              {attendees.length > 12 && (
                <div className="detail-member more">
                  <div className="detail-member-avatar">+{attendees.length - 12}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default EventDetailPage;
