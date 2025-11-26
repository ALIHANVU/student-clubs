import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import { formatDate } from '../utils/helpers';
import { 
  PageHeader, 
  EmptyState, 
  InlineLoading,
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
  Textarea
} from '../components/UI';
import { Modal } from '../components/Modal';

/**
 * Events Page
 */
export function EventsPage({ canEdit, userId }) {
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
    } catch (error) {
      console.error('Error adding event:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteEvent = async (id) => {
    if (!window.confirm('Удалить это мероприятие?')) return;

    try {
      await supabase.from('events').delete().eq('id', id);
      loadEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  // Filter events
  const filteredEvents = events.filter(e =>
    e.title.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <>
        <PageHeader title="📅 Мероприятия" />
        <div className="page-content">
          <InlineLoading />
        </div>
      </>
    );
  }

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

      <div className="page-content">
        {filteredEvents.length === 0 ? (
          <EmptyState
            icon="📅"
            title="Нет мероприятий"
            text="Создайте первое мероприятие"
          />
        ) : (
          <div className="cards-grid">
            {filteredEvents.map((event, index) => (
              <Card key={event.id} delay={index}>
                <CardHeader>
                  <CardIcon>📅</CardIcon>
                  <CardInfo>
                    <CardTitle>{event.title}</CardTitle>
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
            ))}
          </div>
        )}

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
      </div>
    </>
  );
}

export default EventsPage;
