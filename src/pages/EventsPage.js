import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import { formatDate } from '../utils/helpers';
import { haptic } from '../utils/haptic';
import { useNotification } from '../context/NotificationContext';
import { 
  PageHeader, 
  EmptyState, 
  FilterTabs,
  Card,
  CardHeader,
  CardIcon,
  CardInfo,
  CardTitle,
  CardDescription,
  CardMeta,
  CardMetaItem,
  CardFooter,
  Button,
  FormField,
  Input,
  Textarea,
  PullToRefresh,
  SkeletonCard
} from '../components/UI';
import { Modal } from '../components/Modal';

/**
 * Events Page with Filters
 */
export function EventsPage({ canEdit, userId, onEventClick }) {
  const { notify } = useNotification();
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    event_date: '',
    location: '',
    is_university_wide: false
  });
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('events')
        .select('*, clubs(name)')
        .order('event_date', { ascending: false });
      setEvents(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading events:', error);
      setLoading(false);
    }
  }, []);

  const handleRefresh = async () => {
    await loadEvents();
    notify.success('Обновлено');
  };

  const addEvent = async () => {
    if (!newEvent.title.trim() || !newEvent.event_date) return;

    setSubmitting(true);
    try {
      await supabase.from('events').insert({
        ...newEvent,
        created_by: userId
      });

      setNewEvent({
        title: '',
        description: '',
        event_date: '',
        location: '',
        is_university_wide: false
      });
      setShowModal(false);
      loadEvents();
      notify.success('Мероприятие создано');
      haptic.success();
    } catch (error) {
      console.error('Error adding event:', error);
      notify.error('Ошибка создания');
      haptic.error();
    } finally {
      setSubmitting(false);
    }
  };

  const deleteEvent = async (id) => {
    if (!window.confirm('Удалить это мероприятие?')) return;

    try {
      await supabase.from('events').delete().eq('id', id);
      loadEvents();
      notify.success('Мероприятие удалено');
      haptic.medium();
    } catch (error) {
      console.error('Error deleting event:', error);
      notify.error('Ошибка удаления');
      haptic.error();
    }
  };

  // Filter events
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekEnd = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());

  let filteredEvents = events.filter(e =>
    e.title.toLowerCase().includes(search.toLowerCase())
  );

  // Apply date filter
  if (filter === 'today') {
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    filteredEvents = filteredEvents.filter(e => {
      const eventDate = new Date(e.event_date);
      return eventDate >= today && eventDate < tomorrow;
    });
  } else if (filter === 'week') {
    filteredEvents = filteredEvents.filter(e => {
      const eventDate = new Date(e.event_date);
      return eventDate >= today && eventDate <= weekEnd;
    });
  } else if (filter === 'month') {
    filteredEvents = filteredEvents.filter(e => {
      const eventDate = new Date(e.event_date);
      return eventDate >= today && eventDate <= monthEnd;
    });
  } else if (filter === 'past') {
    filteredEvents = filteredEvents.filter(e => {
      const eventDate = new Date(e.event_date);
      return eventDate < today;
    });
  }

  // Sort: upcoming first, then past
  filteredEvents.sort((a, b) => {
    const dateA = new Date(a.event_date);
    const dateB = new Date(b.event_date);
    const aIsPast = dateA < today;
    const bIsPast = dateB < today;
    
    if (aIsPast !== bIsPast) return aIsPast ? 1 : -1;
    return dateA - dateB;
  });

  const filterTabs = [
    { id: 'all', label: 'Все' },
    { id: 'today', label: 'Сегодня' },
    { id: 'week', label: 'Неделя' },
    { id: 'month', label: 'Месяц' },
    { id: 'past', label: 'Прошедшие' }
  ];

  return (
    <>
      <PageHeader
        title="📅 Мероприятия"
        action={canEdit && (
          <Button variant="primary" onClick={() => setShowModal(true)}>
            + Создать
          </Button>
        )}
        search={search}
        onSearch={setSearch}
      />

      <PullToRefresh onRefresh={handleRefresh}>
        <div className="page-content">
          {/* Filter Tabs */}
          <FilterTabs
            tabs={filterTabs}
            activeTab={filter}
            onChange={(id) => { setFilter(id); haptic.light(); }}
          />

          {loading ? (
            <div className="cards-grid">
              {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : filteredEvents.length === 0 ? (
            <EmptyState
              icon="📅"
              title="Нет мероприятий"
              text={filter !== 'all' ? 'Нет мероприятий в этом периоде' : 'Создайте первое мероприятие'}
            />
          ) : (
            <div className="cards-grid">
              {filteredEvents.map((event, index) => {
                const eventDate = new Date(event.event_date);
                const isPast = eventDate < today;

                return (
                  <Card 
                    key={event.id} 
                    delay={index} 
                    className={isPast ? 'card-past' : ''}
                    onClick={() => onEventClick && onEventClick(event.id)}
                  >
                    <CardHeader>
                      <CardIcon>{isPast ? '📆' : '📅'}</CardIcon>
                      <CardInfo>
                        <CardTitle>
                          {event.title}
                          {isPast && <span className="badge badge-secondary">Прошло</span>}
                        </CardTitle>
                        <CardDescription>
                          {event.description || 'Описание отсутствует'}
                        </CardDescription>
                        <CardMeta>
                          <CardMetaItem icon="📍">
                            {event.location || 'Место не указано'}
                          </CardMetaItem>
                          <CardMetaItem icon="🕒">
                            {formatDate(event.event_date)}
                          </CardMetaItem>
                        </CardMeta>
                      </CardInfo>
                    </CardHeader>

                    {canEdit && (
                      <CardFooter>
                        <Button
                          variant="danger"
                          size="small"
                          fullWidth
                          onClick={() => deleteEvent(event.id)}
                        >
                          Удалить
                        </Button>
                      </CardFooter>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </PullToRefresh>

      {/* Create Event Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Создать мероприятие"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Отмена
            </Button>
            <Button
              variant="primary"
              onClick={addEvent}
              disabled={!newEvent.title.trim() || !newEvent.event_date || submitting}
            >
              {submitting ? 'Создание...' : 'Создать'}
            </Button>
          </>
        }
      >
        <FormField label="Название">
          <Input
            value={newEvent.title}
            onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
            placeholder="Например: Встреча клуба"
            autoFocus
          />
        </FormField>

        <FormField label="Описание">
          <Textarea
            value={newEvent.description}
            onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
            placeholder="Расскажите о мероприятии..."
          />
        </FormField>

        <FormField label="Дата и время">
          <Input
            type="datetime-local"
            value={newEvent.event_date}
            onChange={(e) => setNewEvent({ ...newEvent, event_date: e.target.value })}
          />
        </FormField>

        <FormField label="Место проведения">
          <Input
            value={newEvent.location}
            onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
            placeholder="Например: Аудитория 101"
          />
        </FormField>
      </Modal>
    </>
  );
}

export default EventsPage;
