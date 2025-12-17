/**
 * EventsPage — ОПТИМИЗИРОВАННАЯ ВЕРСИЯ
 * 
 * Изменения:
 * - Вынесены компоненты карточек
 * - Оптимизированы фильтры
 * - Убраны лишние вычисления в рендере
 */
import React, { useState, useEffect, useCallback, memo, useMemo, useRef } from 'react';
import { supabase, invalidateCache } from '../utils/supabase';
import { formatDate } from '../utils/helpers';
import { haptic } from '../utils/haptic';
import { useNotification } from '../context/NotificationContext';
import { useApp } from '../context/AppContext';
import { 
  PageHeader, EmptyState, FilterTabs, Button, FormField, Input, 
  Textarea, PullToRefresh, SkeletonCard 
} from '../components/UI';
import { Modal } from '../components/Modal';
import { MobilePageHeader } from '../components/Navigation';

// ========== КОМПОНЕНТЫ ==========

const EventCard = memo(function EventCard({ 
  event, 
  isPast, 
  canEdit, 
  onEdit, 
  onDelete 
}) {
  const handleEdit = useCallback((e) => {
    e?.stopPropagation();
    onEdit(event);
  }, [event, onEdit]);

  const handleDelete = useCallback((e) => {
    e?.stopPropagation();
    onDelete(event.id);
  }, [event.id, onDelete]);

  return (
    <div 
      className={`card ${isPast ? 'card-past' : ''} ${canEdit ? 'card-pressable' : ''}`} 
      onClick={canEdit ? handleEdit : undefined}
    >
      <div className="card-header">
        <div className="card-icon">{event.clubs?.icon || (isPast ? '📆' : '📅')}</div>
        <div className="card-info">
          <div className="card-title">
            {event.title}
            {isPast && <span className="badge">Прошло</span>}
            {event.is_university_wide && <span className="badge badge-blue">Общее</span>}
          </div>
          <div className="card-description">{event.description || 'Описание отсутствует'}</div>
          <div className="card-meta">
            {event.clubs?.name && <span className="card-meta-item">🎭 {event.clubs.name}</span>}
            <span className="card-meta-item">📍 {event.location || 'Место не указано'}</span>
            <span className="card-meta-item">🕒 {formatDate(event.event_date)}</span>
          </div>
        </div>
      </div>
      {canEdit && (
        <div className="card-footer">
          <Button variant="secondary" size="small" onClick={handleEdit}>✏️ Изменить</Button>
          <Button variant="danger" size="small" onClick={handleDelete}>🗑️ Удалить</Button>
        </div>
      )}
    </div>
  );
});

// ========== ХЕЛПЕРЫ ==========

const getDateRanges = () => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today.getTime() + 86400000);
  const weekEnd = new Date(today.getTime() + 7 * 86400000);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
  
  return { today, tomorrow, weekEnd, monthEnd };
};

const INITIAL_FORM = {
  title: '', 
  description: '', 
  event_date: '', 
  location: '', 
  club_id: '',
  max_participants: '',
  is_university_wide: true 
};

// ========== ГЛАВНЫЙ КОМПОНЕНТ ==========

export const EventsPage = memo(function EventsPage() {
  const { user } = useApp();
  const { notify } = useNotification();
  
  const [events, setEvents] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventForm, setEventForm] = useState(INITIAL_FORM);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const mountedRef = useRef(true);
  const canEdit = user.role === 'main_admin' || user.role === 'club_admin';

  // Загрузка
  const loadEvents = useCallback(async () => {
    try {
      const [eventsRes, clubsRes] = await Promise.all([
        supabase.from('events').select('*, clubs(name, icon)').order('event_date', { ascending: true }),
        supabase.from('clubs').select('id, name, icon').order('name')
      ]);
      
      if (!mountedRef.current) return;
      
      setEvents(eventsRes.data || []);
      setClubs(clubsRes.data || []);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    loadEvents();
    return () => { mountedRef.current = false; };
  }, [loadEvents]);

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    await loadEvents();
    notify.success('Обновлено');
  }, [loadEvents, notify]);

  // Модалка
  const openAddModal = useCallback(() => {
    setEditingEvent(null);
    setEventForm(INITIAL_FORM);
    setShowModal(true);
  }, []);

  const openEditModal = useCallback((event) => {
    setEditingEvent(event);
    setEventForm({
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

  const closeModal = useCallback(() => {
    setShowModal(false);
    setEditingEvent(null);
  }, []);

  // Обновление формы
  const updateFormField = useCallback((field, value) => {
    setEventForm(prev => ({ ...prev, [field]: value }));
  }, []);

  // Сохранение
  const saveEvent = useCallback(async () => {
    if (!eventForm.title.trim() || !eventForm.event_date) {
      notify.error('Заполните название и дату');
      return;
    }
    
    setSubmitting(true);
    try {
      const eventData = {
        title: eventForm.title.trim(),
        description: eventForm.description.trim(),
        event_date: eventForm.event_date,
        location: eventForm.location.trim(),
        club_id: eventForm.club_id || null,
        max_participants: eventForm.max_participants ? parseInt(eventForm.max_participants) : null,
        is_university_wide: eventForm.is_university_wide
      };

      if (editingEvent) {
        const { error } = await supabase.from('events').update(eventData).eq('id', editingEvent.id);
        if (error) throw error;
        notify.success('Мероприятие обновлено');
      } else {
        const { error } = await supabase.from('events').insert({ ...eventData, created_by: user.id });
        if (error) throw error;
        notify.success('Мероприятие создано');
      }

      invalidateCache('events');
      closeModal();
      loadEvents();
      haptic.success();
    } catch (error) {
      console.error('Error saving event:', error);
      notify.error('Ошибка сохранения');
      haptic.error();
    } finally {
      setSubmitting(false);
    }
  }, [eventForm, editingEvent, user.id, loadEvents, notify, closeModal]);

  // Удаление
  const deleteEvent = useCallback(async (id) => {
    if (!window.confirm('Удалить мероприятие?')) return;
    
    try {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
      
      invalidateCache('events');
      loadEvents();
      notify.success('Мероприятие удалено');
      haptic.medium();
    } catch (error) {
      console.error('Error deleting event:', error);
      notify.error('Ошибка удаления');
      haptic.error();
    }
  }, [loadEvents, notify]);

  // Фильтрация (мемоизация)
  const { filteredEvents, today } = useMemo(() => {
    const { today, tomorrow, weekEnd, monthEnd } = getDateRanges();
    const searchLower = search.toLowerCase();
    
    let result = events.filter(e => e.title.toLowerCase().includes(searchLower));

    switch (filter) {
      case 'today':
        result = result.filter(e => {
          const d = new Date(e.event_date);
          return d >= today && d < tomorrow;
        });
        break;
      case 'week':
        result = result.filter(e => {
          const d = new Date(e.event_date);
          return d >= today && d <= weekEnd;
        });
        break;
      case 'month':
        result = result.filter(e => {
          const d = new Date(e.event_date);
          return d >= today && d <= monthEnd;
        });
        break;
      case 'past':
        result = result.filter(e => new Date(e.event_date) < today);
        break;
      default:
        break;
    }

    // Сортировка: будущие сначала, потом прошлые
    result.sort((a, b) => {
      const dateA = new Date(a.event_date);
      const dateB = new Date(b.event_date);
      const aIsPast = dateA < today;
      const bIsPast = dateB < today;
      
      if (aIsPast !== bIsPast) return aIsPast ? 1 : -1;
      return dateA - dateB;
    });

    return { filteredEvents: result, today };
  }, [events, search, filter]);

  // Константы
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
              {filteredEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  isPast={new Date(event.event_date) < today}
                  canEdit={canEdit}
                  onEdit={openEditModal}
                  onDelete={deleteEvent}
                />
              ))}
            </div>
          )}
        </div>
      </PullToRefresh>

      <Modal 
        isOpen={showModal} 
        onClose={closeModal} 
        title={editingEvent ? 'Редактировать мероприятие' : 'Создать мероприятие'} 
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>Отмена</Button>
            <Button 
              variant="primary" 
              onClick={saveEvent} 
              disabled={!eventForm.title.trim() || !eventForm.event_date || submitting}
            >
              {submitting ? 'Сохранение...' : (editingEvent ? 'Сохранить' : 'Создать')}
            </Button>
          </>
        }
      >
        <FormField label="Название *">
          <Input 
            value={eventForm.title} 
            onChange={(e) => updateFormField('title', e.target.value)} 
            placeholder="Встреча клуба программирования" 
            autoFocus 
          />
        </FormField>

        <FormField label="Описание">
          <Textarea 
            value={eventForm.description} 
            onChange={(e) => updateFormField('description', e.target.value)} 
            placeholder="Расскажите о мероприятии..." 
          />
        </FormField>

        <FormField label="Дата и время *">
          <Input 
            type="datetime-local" 
            value={eventForm.event_date} 
            onChange={(e) => updateFormField('event_date', e.target.value)} 
          />
        </FormField>

        <FormField label="Место проведения">
          <Input 
            value={eventForm.location} 
            onChange={(e) => updateFormField('location', e.target.value)} 
            placeholder="Аудитория 101 / Онлайн" 
          />
        </FormField>

        <FormField label="Клуб-организатор">
          <select 
            className="form-select" 
            value={eventForm.club_id} 
            onChange={(e) => updateFormField('club_id', e.target.value)}
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
