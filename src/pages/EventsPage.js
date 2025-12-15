/**
 * EventsPage — Страница мероприятий
 */
import React, { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { supabase, invalidateCache } from '../utils/supabase';
import { formatDate } from '../utils/helpers';
import { haptic } from '../utils/haptic';
import { useNotification } from '../context/NotificationContext';
import { useApp } from '../context/AppContext';
import { PageHeader, EmptyState, FilterTabs, Card, CardHeader, CardIcon, CardInfo, CardTitle, CardDescription, CardMeta, CardMetaItem, CardFooter, Button, FormField, Input, Textarea, PullToRefresh, SkeletonCard } from '../components/UI';
import { Modal } from '../components/Modal';
import { MobilePageHeader } from '../components/Navigation';

export const EventsPage = memo(function EventsPage() {
  const { user } = useApp();
  const { notify } = useNotification();
  const [events, setEvents] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [newEvent, setNewEvent] = useState({ 
    title: '', 
    description: '', 
    event_date: '', 
    location: '', 
    club_id: '',
    max_participants: '',
    is_university_wide: true 
  });
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const canEdit = user.role === 'main_admin' || user.role === 'club_admin';

  const loadEvents = useCallback(async () => {
    try {
      const [eventsRes, clubsRes] = await Promise.all([
        supabase.from('events').select('*, clubs(name, icon)').order('event_date', { ascending: true }),
        supabase.from('clubs').select('id, name, icon').order('name')
      ]);
      setEvents(eventsRes.data || []);
      setClubs(clubsRes.data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    await loadEvents();
    notify.success('Обновлено');
  }, [loadEvents, notify]);

  const openAddModal = useCallback(() => {
    setEditingEvent(null);
    setNewEvent({ 
      title: '', description: '', event_date: '', location: '', 
      club_id: '', max_participants: '', is_university_wide: true 
    });
    setShowModal(true);
  }, []);

  const openEditModal = useCallback((event) => {
    setEditingEvent(event);
    setNewEvent({
      title: event.title || '',
      description: event.description || '',
      event_date: event.event_date ? event.event_date.slice(0, 16) : '',
      location: event.location || '',
      club_id: event.club_id || '',
      max_participants: event.max_participants || '',
      is_university_wide: event.is_university_wide ?? true
    });
    setShowModal(true);
    haptic.light();
  }, []);

  const saveEvent = useCallback(async () => {
    if (!newEvent.title.trim() || !newEvent.event_date) {
      notify.error('Заполните название и дату');
      return;
    }
    setSubmitting(true);
    try {
      const eventData = {
        title: newEvent.title.trim(),
        description: newEvent.description.trim(),
        event_date: newEvent.event_date,
        location: newEvent.location.trim(),
        club_id: newEvent.club_id || null,
        max_participants: newEvent.max_participants ? parseInt(newEvent.max_participants) : null,
        is_university_wide: newEvent.is_university_wide
      };

      if (editingEvent) {
        await supabase.from('events').update(eventData).eq('id', editingEvent.id);
        notify.success('Мероприятие обновлено');
      } else {
        await supabase.from('events').insert({ ...eventData, created_by: user.id });
        notify.success('Мероприятие создано');
      }

      invalidateCache('events');
      setShowModal(false);
      setEditingEvent(null);
      loadEvents();
      haptic.success();
    } catch (error) {
      console.error('Error:', error);
      notify.error('Ошибка сохранения');
      haptic.error();
    } finally {
      setSubmitting(false);
    }
  }, [newEvent, editingEvent, user.id, loadEvents, notify]);

  const deleteEvent = useCallback(async (id, e) => {
    e?.stopPropagation();
    if (!window.confirm('Удалить мероприятие?')) return;
    try {
      await supabase.from('events').delete().eq('id', id);
      invalidateCache('events');
      loadEvents();
      notify.success('Мероприятие удалено');
      haptic.medium();
    } catch (error) {
      notify.error('Ошибка удаления');
      haptic.error();
    }
  }, [loadEvents, notify]);

  const { today, filteredEvents } = useMemo(() => {
    const now = new Date();
    const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekEnd = new Date(todayDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    const monthEnd = new Date(todayDate.getFullYear(), todayDate.getMonth() + 1, todayDate.getDate());

    let result = events.filter(e => e.title.toLowerCase().includes(search.toLowerCase()));

    if (filter === 'today') {
      const tomorrow = new Date(todayDate.getTime() + 24 * 60 * 60 * 1000);
      result = result.filter(e => { const d = new Date(e.event_date); return d >= todayDate && d < tomorrow; });
    } else if (filter === 'week') {
      result = result.filter(e => { const d = new Date(e.event_date); return d >= todayDate && d <= weekEnd; });
    } else if (filter === 'month') {
      result = result.filter(e => { const d = new Date(e.event_date); return d >= todayDate && d <= monthEnd; });
    } else if (filter === 'past') {
      result = result.filter(e => new Date(e.event_date) < todayDate);
    }

    result.sort((a, b) => {
      const dateA = new Date(a.event_date);
      const dateB = new Date(b.event_date);
      const aIsPast = dateA < todayDate;
      const bIsPast = dateB < todayDate;
      if (aIsPast !== bIsPast) return aIsPast ? 1 : -1;
      return dateA - dateB;
    });

    return { today: todayDate, filteredEvents: result };
  }, [events, search, filter]);

  const filterTabs = useMemo(() => [
    { id: 'all', label: 'Все' }, 
    { id: 'today', label: 'Сегодня' }, 
    { id: 'week', label: 'Неделя' }, 
    { id: 'month', label: 'Месяц' }, 
    { id: 'past', label: 'Прошедшие' }
  ], []);

  return (
    <>
      <PageHeader 
        title="📅 Мероприятия" 
        action={canEdit && <Button variant="primary" onClick={openAddModal}>+ Создать</Button>} 
        search={search} 
        onSearch={setSearch} 
      />
      <MobilePageHeader 
        title="Мероприятия" 
        showSearch 
        searchValue={search} 
        onSearchChange={setSearch} 
        actions={canEdit ? [{ icon: 'plus', onClick: openAddModal, primary: true }] : []} 
      />

      <PullToRefresh onRefresh={handleRefresh}>
        <div className="page-content">
          <FilterTabs tabs={filterTabs} activeTab={filter} onChange={setFilter} />

          {loading ? (
            <div className="cards-grid">{[1,2,3].map(i => <SkeletonCard key={i} />)}</div>
          ) : filteredEvents.length === 0 ? (
            <EmptyState 
              icon="📅" 
              title="Нет мероприятий" 
              text={filter !== 'all' ? 'Нет мероприятий в этом периоде' : 'Создайте первое мероприятие'}
              action={canEdit && <Button variant="primary" onClick={openAddModal}>+ Создать</Button>}
            />
          ) : (
            <div className="cards-grid">
              {filteredEvents.map((event) => {
                const isPast = new Date(event.event_date) < today;
                return (
                  <Card key={event.id} className={isPast ? 'card-past' : ''} onClick={canEdit ? () => openEditModal(event) : undefined}>
                    <CardHeader>
                      <CardIcon>{event.clubs?.icon || (isPast ? '📆' : '📅')}</CardIcon>
                      <CardInfo>
                        <CardTitle>
                          {event.title} 
                          {isPast && <span className="badge">Прошло</span>}
                          {event.is_university_wide && <span className="badge badge-blue">Общее</span>}
                        </CardTitle>
                        <CardDescription>{event.description || 'Описание отсутствует'}</CardDescription>
                        <CardMeta>
                          {event.clubs?.name && <CardMetaItem>🎭 {event.clubs.name}</CardMetaItem>}
                          <CardMetaItem>📍 {event.location || 'Место не указано'}</CardMetaItem>
                          <CardMetaItem>🕒 {formatDate(event.event_date)}</CardMetaItem>
                        </CardMeta>
                      </CardInfo>
                    </CardHeader>
                    {canEdit && (
                      <CardFooter>
                        <Button variant="secondary" size="small" onClick={(e) => { e.stopPropagation(); openEditModal(event); }}>
                          ✏️ Изменить
                        </Button>
                        <Button variant="danger" size="small" onClick={(e) => deleteEvent(event.id, e)}>
                          🗑️ Удалить
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

      <Modal 
        isOpen={showModal} 
        onClose={() => { setShowModal(false); setEditingEvent(null); }} 
        title={editingEvent ? 'Редактировать мероприятие' : 'Создать мероприятие'} 
        footer={
          <>
            <Button variant="secondary" onClick={() => { setShowModal(false); setEditingEvent(null); }}>Отмена</Button>
            <Button variant="primary" onClick={saveEvent} disabled={!newEvent.title.trim() || !newEvent.event_date || submitting}>
              {submitting ? 'Сохранение...' : (editingEvent ? 'Сохранить' : 'Создать')}
            </Button>
          </>
        }
      >
        <FormField label="Название *">
          <Input 
            value={newEvent.title} 
            onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))} 
            placeholder="Встреча клуба программирования" 
            autoFocus 
          />
        </FormField>

        <FormField label="Описание">
          <Textarea 
            value={newEvent.description} 
            onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))} 
            placeholder="Расскажите о мероприятии..." 
          />
        </FormField>

        <FormField label="Дата и время *">
          <Input 
            type="datetime-local" 
            value={newEvent.event_date} 
            onChange={(e) => setNewEvent(prev => ({ ...prev, event_date: e.target.value }))} 
          />
        </FormField>

        <FormField label="Место проведения">
          <Input 
            value={newEvent.location} 
            onChange={(e) => setNewEvent(prev => ({ ...prev, location: e.target.value }))} 
            placeholder="Аудитория 101 / Онлайн" 
          />
        </FormField>

        <FormField label="Клуб-организатор">
          <select 
            className="form-select" 
            value={newEvent.club_id} 
            onChange={(e) => setNewEvent(prev => ({ ...prev, club_id: e.target.value }))}
          >
            <option value="">Без клуба (общеуниверситетское)</option>
            {clubs.map(club => (
              <option key={club.id} value={club.id}>{club.icon} {club.name}</option>
            ))}
          </select>
        </FormField>
      </Modal>
    </>
  );
});

export default EventsPage;
