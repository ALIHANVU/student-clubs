/**
 * EventsPage — Оптимизированная
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
  const [showModal, setShowModal] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', description: '', event_date: '', location: '', is_university_wide: true });
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const canEdit = user.role === 'main_admin' || user.role === 'club_admin';

  const loadEvents = useCallback(async () => {
    try {
      const { data } = await supabase.from('events').select('*, clubs(name)').order('event_date', { ascending: true });
      setEvents(data || []);
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

  const addEvent = useCallback(async () => {
    if (!newEvent.title.trim() || !newEvent.event_date) return;
    setSubmitting(true);
    try {
      await supabase.from('events').insert({ ...newEvent, created_by: user.id });
      invalidateCache('events');
      setNewEvent({ title: '', description: '', event_date: '', location: '', is_university_wide: true });
      setShowModal(false);
      loadEvents();
      notify.success('Мероприятие создано');
      haptic.success();
    } catch (error) {
      notify.error('Ошибка создания');
      haptic.error();
    } finally {
      setSubmitting(false);
    }
  }, [newEvent, user.id, loadEvents, notify]);

  const deleteEvent = useCallback(async (id, e) => {
    e.stopPropagation();
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

  // Мемоизированная фильтрация
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

    // Сортировка: прошедшие в конец
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
        action={canEdit && <Button variant="primary" onClick={() => setShowModal(true)}>+ Создать</Button>} 
        search={search} 
        onSearch={setSearch} 
      />
      <MobilePageHeader 
        title="Мероприятия" 
        showSearch 
        searchValue={search} 
        onSearchChange={setSearch} 
        actions={canEdit ? [{ icon: 'plus', onClick: () => setShowModal(true), primary: true }] : []} 
      />

      <PullToRefresh onRefresh={handleRefresh}>
        <div className="page-content">
          <FilterTabs tabs={filterTabs} activeTab={filter} onChange={setFilter} />

          {loading ? (
            <div className="cards-grid">{[1,2,3].map(i => <SkeletonCard key={i} />)}</div>
          ) : filteredEvents.length === 0 ? (
            <EmptyState icon="📅" title="Нет мероприятий" text={filter !== 'all' ? 'Нет мероприятий в этом периоде' : 'Создайте первое мероприятие'} />
          ) : (
            <div className="cards-grid">
              {filteredEvents.map((event) => {
                const isPast = new Date(event.event_date) < today;
                return (
                  <Card key={event.id} className={isPast ? 'card-past' : ''}>
                    <CardHeader>
                      <CardIcon>{isPast ? '📆' : '📅'}</CardIcon>
                      <CardInfo>
                        <CardTitle>{event.title} {isPast && <span className="badge">Прошло</span>}</CardTitle>
                        <CardDescription>{event.description || 'Описание отсутствует'}</CardDescription>
                        <CardMeta>
                          <CardMetaItem icon="📍">{event.location || 'Место не указано'}</CardMetaItem>
                          <CardMetaItem icon="🕒">{formatDate(event.event_date)}</CardMetaItem>
                        </CardMeta>
                      </CardInfo>
                    </CardHeader>
                    {canEdit && (
                      <CardFooter>
                        <Button variant="danger" size="small" fullWidth onClick={(e) => deleteEvent(event.id, e)}>Удалить</Button>
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
        onClose={() => setShowModal(false)} 
        title="Создать мероприятие" 
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Отмена</Button>
            <Button variant="primary" onClick={addEvent} disabled={!newEvent.title.trim() || !newEvent.event_date || submitting}>
              {submitting ? 'Создание...' : 'Создать'}
            </Button>
          </>
        }
      >
        <FormField label="Название">
          <Input value={newEvent.title} onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))} placeholder="Встреча клуба" autoFocus />
        </FormField>
        <FormField label="Описание">
          <Textarea value={newEvent.description} onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))} placeholder="Расскажите..." />
        </FormField>
        <FormField label="Дата и время">
          <Input type="datetime-local" value={newEvent.event_date} onChange={(e) => setNewEvent(prev => ({ ...prev, event_date: e.target.value }))} />
        </FormField>
        <FormField label="Место">
          <Input value={newEvent.location} onChange={(e) => setNewEvent(prev => ({ ...prev, location: e.target.value }))} placeholder="Аудитория 101" />
        </FormField>
      </Modal>
    </>
  );
});

export default EventsPage;
