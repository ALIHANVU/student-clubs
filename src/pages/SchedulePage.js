import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import { haptic } from '../utils/haptic';
import { useNotification } from '../context/NotificationContext';
import { 
  PageHeader, 
  EmptyState, 
  FilterTabs,
  Button,
  FormField,
  Input,
  PullToRefresh,
  SkeletonList
} from '../components/UI';
import { Modal } from '../components/Modal';

const DAYS = [
  { id: 1, name: 'Понедельник', short: 'Пн' },
  { id: 2, name: 'Вторник', short: 'Вт' },
  { id: 3, name: 'Среда', short: 'Ср' },
  { id: 4, name: 'Четверг', short: 'Чт' },
  { id: 5, name: 'Пятница', short: 'Пт' },
  { id: 6, name: 'Суббота', short: 'Сб' }
];

const TIME_SLOTS = [
  '08:00', '09:30', '11:00', '12:30', '14:00', '15:30', '17:00', '18:30'
];

/**
 * Schedule Page
 */
export function SchedulePage({ canEdit = false }) {
  const { notify } = useNotification();
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [newLesson, setNewLesson] = useState({
    subject: '',
    teacher: '',
    room: '',
    day_of_week: 1,
    start_time: '08:00',
    end_time: '09:30'
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadSchedule();
  }, []);

  const loadSchedule = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('schedules')
        .select('*')
        .order('start_time');
      setSchedule(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading schedule:', error);
      setLoading(false);
    }
  }, []);

  const handleRefresh = async () => {
    await loadSchedule();
    notify.success('Обновлено');
  };

  const addLesson = async () => {
    if (!newLesson.subject.trim()) return;

    setSubmitting(true);
    try {
      await supabase.from('schedules').insert({
        ...newLesson,
        day_of_week: activeDay
      });

      setNewLesson({
        subject: '',
        teacher: '',
        room: '',
        day_of_week: activeDay,
        start_time: '08:00',
        end_time: '09:30'
      });
      setShowModal(false);
      loadSchedule();
      notify.success('Занятие добавлено');
      haptic.success();
    } catch (error) {
      console.error('Error adding lesson:', error);
      notify.error('Ошибка добавления');
      haptic.error();
    } finally {
      setSubmitting(false);
    }
  };

  const deleteLesson = async (id) => {
    if (!window.confirm('Удалить это занятие?')) return;

    try {
      await supabase.from('schedules').delete().eq('id', id);
      loadSchedule();
      notify.success('Занятие удалено');
      haptic.medium();
    } catch (error) {
      console.error('Error deleting lesson:', error);
      notify.error('Ошибка удаления');
      haptic.error();
    }
  };

  const daySchedule = schedule.filter(s => s.day_of_week === activeDay);

  return (
    <>
      <PageHeader
        title="📚 Расписание"
        action={canEdit && (
          <Button variant="primary" onClick={() => setShowModal(true)}>
            + Добавить
          </Button>
        )}
      />

      <PullToRefresh onRefresh={handleRefresh}>
        <div className="page-content">
          {/* Day Tabs */}
          <FilterTabs
            tabs={DAYS.map(d => ({ id: d.id, label: d.short }))}
            activeTab={activeDay}
            onChange={(id) => { setActiveDay(id); haptic.light(); }}
          />

          <div className="schedule-day-title">
            {DAYS.find(d => d.id === activeDay)?.name}
          </div>

          {loading ? (
            <SkeletonList count={4} />
          ) : daySchedule.length === 0 ? (
            <EmptyState
              icon="📚"
              title="Нет занятий"
              text="В этот день занятий нет"
            />
          ) : (
            <div className="schedule-list">
              {daySchedule.map((lesson, index) => (
                <div 
                  key={lesson.id} 
                  className="schedule-item"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="schedule-time">
                    <span className="schedule-time-start">{lesson.start_time?.slice(0, 5)}</span>
                    <span className="schedule-time-end">{lesson.end_time?.slice(0, 5)}</span>
                  </div>
                  <div className="schedule-content">
                    <div className="schedule-subject">{lesson.subject}</div>
                    <div className="schedule-details">
                      {lesson.teacher && <span>👤 {lesson.teacher}</span>}
                      {lesson.room && <span>🚪 {lesson.room}</span>}
                    </div>
                  </div>
                  {canEdit && (
                    <button 
                      className="schedule-delete"
                      onClick={() => deleteLesson(lesson.id)}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </PullToRefresh>

      {/* Add Lesson Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Добавить занятие"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Отмена
            </Button>
            <Button
              variant="primary"
              onClick={addLesson}
              disabled={!newLesson.subject.trim() || submitting}
            >
              {submitting ? 'Добавление...' : 'Добавить'}
            </Button>
          </>
        }
      >
        <FormField label="Предмет">
          <Input
            value={newLesson.subject}
            onChange={(e) => setNewLesson({ ...newLesson, subject: e.target.value })}
            placeholder="Например: Математика"
            autoFocus
          />
        </FormField>

        <FormField label="Преподаватель">
          <Input
            value={newLesson.teacher}
            onChange={(e) => setNewLesson({ ...newLesson, teacher: e.target.value })}
            placeholder="Например: Иванов И.И."
          />
        </FormField>

        <FormField label="Аудитория">
          <Input
            value={newLesson.room}
            onChange={(e) => setNewLesson({ ...newLesson, room: e.target.value })}
            placeholder="Например: 101"
          />
        </FormField>

        <div className="form-row">
          <FormField label="Начало">
            <select
              className="form-select"
              value={newLesson.start_time}
              onChange={(e) => setNewLesson({ ...newLesson, start_time: e.target.value })}
            >
              {TIME_SLOTS.map(time => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Конец">
            <select
              className="form-select"
              value={newLesson.end_time}
              onChange={(e) => setNewLesson({ ...newLesson, end_time: e.target.value })}
            >
              {TIME_SLOTS.map(time => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </FormField>
        </div>
      </Modal>
    </>
  );
}

export default SchedulePage;
