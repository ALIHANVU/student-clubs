import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import { haptic } from '../utils/haptic';
import { useNotification } from '../context/NotificationContext';
import { useApp } from '../context/AppContext';
import { useOnlineStatus } from '../hooks';
import { DAYS, TIME_SLOTS, LESSON_TYPES } from '../utils/constants';
import { formatTime, getLessonTypeLabel, getLessonTypeIcon } from '../utils/helpers';
import { 
  PageHeader, 
  EmptyState, 
  FilterTabs,
  Button,
  FormField,
  Input,
  PullToRefresh,
  Badge,
  SkeletonList
} from '../components/UI';
import { Modal } from '../components/Modal';
import { MobilePageHeader } from '../components/MobileNav';
import { 
  SwipeableCard, 
  SkeletonSchedule, 
  OfflineBanner 
} from '../components/Gestures';
import { IconByName } from '../components/Icons';

/**
 * Schedule Page
 * - Студент: видит расписание своей группы (только просмотр)
 * - Староста: видит и редактирует расписание своей группы
 * - Главный админ: может выбрать любую группу и редактировать
 */
export function SchedulePage() {
  const { user } = useApp();
  const { notify } = useNotification();
  const isOnline = useOnlineStatus();
  
  const [schedule, setSchedule] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState(new Date().getDay() || 1);
  
  // Модалка добавления
  const [showModal, setShowModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [lessonForm, setLessonForm] = useState({
    subject: '',
    teacher: '',
    room: '',
    day_of_week: 1,
    start_time: '08:30',
    end_time: '10:00',
    lesson_type: 'lecture'
  });
  const [submitting, setSubmitting] = useState(false);

  // Определяем права
  const isAdmin = user.role === 'main_admin';
  const isGroupLeader = user.role === 'group_leader';
  const canEdit = isAdmin || isGroupLeader;

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      loadSchedule(selectedGroup);
    }
  }, [selectedGroup]);

  const loadInitialData = async () => {
    try {
      // Если главный админ - загружаем все группы
      if (isAdmin) {
        const { data } = await supabase
          .from('study_groups')
          .select('*, directions(name, faculties(name))')
          .order('name');
        setGroups(data || []);
        
        // Выбираем первую группу по умолчанию
        if (data && data.length > 0) {
          setSelectedGroup(data[0].id);
        } else {
          setLoading(false);
        }
      } else {
        // Для студента/старосты - их группа
        if (user.group_id) {
          setSelectedGroup(user.group_id);
          
          // Загружаем информацию о группе
          const { data } = await supabase
            .from('study_groups')
            .select('*, directions(name, faculties(name))')
            .eq('id', user.group_id)
            .single();
          
          if (data) {
            setGroups([data]);
          }
        } else {
          setLoading(false);
        }
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      setLoading(false);
    }
  };

  const loadSchedule = useCallback(async (groupId) => {
    try {
      const { data } = await supabase
        .from('schedules')
        .select('*')
        .eq('group_id', groupId)
        .order('start_time');
      
      setSchedule(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading schedule:', error);
      setLoading(false);
    }
  }, []);

  const handleRefresh = async () => {
    if (selectedGroup) {
      await loadSchedule(selectedGroup);
      notify.success('Обновлено');
    }
  };

  const openAddModal = (day = activeDay) => {
    setEditingLesson(null);
    setLessonForm({
      subject: '',
      teacher: '',
      room: '',
      day_of_week: day,
      start_time: '08:30',
      end_time: '10:00',
      lesson_type: 'lecture'
    });
    setShowModal(true);
  };

  const openEditModal = (lesson) => {
    setEditingLesson(lesson);
    setLessonForm({
      subject: lesson.subject,
      teacher: lesson.teacher || '',
      room: lesson.room || '',
      day_of_week: lesson.day_of_week,
      start_time: lesson.start_time?.slice(0, 5) || '08:30',
      end_time: lesson.end_time?.slice(0, 5) || '10:00',
      lesson_type: lesson.lesson_type || 'lecture'
    });
    setShowModal(true);
    haptic.light();
  };

  const saveLesson = async () => {
    if (!lessonForm.subject.trim()) return;
    setSubmitting(true);

    try {
      const lessonData = {
        ...lessonForm,
        group_id: selectedGroup,
        created_by: user.id
      };

      if (editingLesson) {
        await supabase
          .from('schedules')
          .update(lessonData)
          .eq('id', editingLesson.id);
        notify.success('Занятие обновлено');
      } else {
        await supabase.from('schedules').insert(lessonData);
        notify.success('Занятие добавлено');
      }

      setShowModal(false);
      loadSchedule(selectedGroup);
      haptic.success();
    } catch (error) {
      console.error('Error saving lesson:', error);
      notify.error('Ошибка сохранения');
      haptic.error();
    } finally {
      setSubmitting(false);
    }
  };

  const deleteLesson = async (id) => {
    if (!window.confirm('Удалить это занятие?')) return;

    try {
      await supabase.from('schedules').delete().eq('id', id);
      loadSchedule(selectedGroup);
      notify.success('Занятие удалено');
      haptic.medium();
    } catch (error) {
      console.error('Error deleting lesson:', error);
      notify.error('Ошибка удаления');
      haptic.error();
    }
  };

  // Фильтрация по дню
  const daySchedule = schedule
    .filter(s => s.day_of_week === activeDay)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  const currentGroup = groups.find(g => g.id === selectedGroup);

  // Если нет группы
  if (!loading && !selectedGroup && !isAdmin) {
    return (
      <>
        <PageHeader title="📚 Расписание" />
        <MobilePageHeader title="Расписание" />
        <div className="page-content">
          <EmptyState
            icon="👥"
            title="Группа не выбрана"
            text="Вы не привязаны к учебной группе. Обратитесь к администратору."
          />
        </div>
      </>
    );
  }

  return (
    <>
      {/* Desktop Header */}
      <PageHeader 
        title="📚 Расписание" 
        action={canEdit && selectedGroup && (
          <Button variant="primary" onClick={() => openAddModal()}>
            + Добавить
          </Button>
        )}
      />
      
      {/* Mobile Header */}
      <MobilePageHeader
        title="Расписание"
        subtitle={currentGroup ? currentGroup.name : null}
        actions={canEdit && selectedGroup ? [{ icon: 'plus', onClick: () => openAddModal(), primary: true }] : []}
      />

      <PullToRefresh onRefresh={handleRefresh}>
        <div className="page-content">
          {/* Выбор группы (только для админа) */}
          {isAdmin && groups.length > 0 && (
            <div className="schedule-group-selector">
              <select
                className="form-select"
                value={selectedGroup || ''}
                onChange={(e) => {
                  setSelectedGroup(e.target.value);
                  setLoading(true);
                  haptic.light();
                }}
              >
                {groups.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.name} — {g.directions?.faculties?.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Информация о группе */}
          {currentGroup && !isAdmin && (
            <div className="schedule-group-info">
              <div className="schedule-group-name">{currentGroup.name}</div>
              <div className="schedule-group-faculty">
                {currentGroup.directions?.faculties?.name} • {currentGroup.directions?.name}
              </div>
              {isGroupLeader && (
                <Badge variant="orange">Вы староста этой группы</Badge>
              )}
            </div>
          )}

          {/* Дни недели */}
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
              text={canEdit ? 'Добавьте первое занятие' : 'В этот день занятий нет'}
              action={canEdit && (
                <Button variant="primary" onClick={() => openAddModal()}>
                  + Добавить занятие
                </Button>
              )}
            />
          ) : (
            <div className="schedule-list">
              {daySchedule.map((lesson, index) => (
                <div 
                  key={lesson.id} 
                  className="schedule-item"
                  style={{ animationDelay: `${index * 0.05}s` }}
                  onClick={() => canEdit && openEditModal(lesson)}
                >
                  <div className="schedule-time">
                    <span className="schedule-time-start">{formatTime(lesson.start_time)}</span>
                    <span className="schedule-time-end">{formatTime(lesson.end_time)}</span>
                  </div>
                  <div className="schedule-content">
                    <div className="schedule-subject">
                      <span className="schedule-type-icon">{getLessonTypeIcon(lesson.lesson_type)}</span>
                      {lesson.subject}
                    </div>
                    <div className="schedule-details">
                      {lesson.teacher && <span>👤 {lesson.teacher}</span>}
                      {lesson.room && <span>🚪 Ауд. {lesson.room}</span>}
                      <span className="schedule-type-badge">
                        {getLessonTypeLabel(lesson.lesson_type)}
                      </span>
                    </div>
                  </div>
                  {canEdit && (
                    <button 
                      className="schedule-delete"
                      onClick={(e) => { e.stopPropagation(); deleteLesson(lesson.id); }}
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

      {/* Модалка добавления/редактирования */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingLesson ? 'Редактировать занятие' : 'Добавить занятие'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Отмена
            </Button>
            <Button
              variant="primary"
              onClick={saveLesson}
              disabled={!lessonForm.subject.trim() || submitting}
            >
              {submitting ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </>
        }
      >
        <FormField label="Предмет">
          <Input
            value={lessonForm.subject}
            onChange={(e) => setLessonForm({ ...lessonForm, subject: e.target.value })}
            placeholder="Математический анализ"
            autoFocus
          />
        </FormField>

        <FormField label="Преподаватель">
          <Input
            value={lessonForm.teacher}
            onChange={(e) => setLessonForm({ ...lessonForm, teacher: e.target.value })}
            placeholder="Иванов И.И."
          />
        </FormField>

        <FormField label="Аудитория">
          <Input
            value={lessonForm.room}
            onChange={(e) => setLessonForm({ ...lessonForm, room: e.target.value })}
            placeholder="101"
          />
        </FormField>

        <FormField label="День недели">
          <select
            className="form-select"
            value={lessonForm.day_of_week}
            onChange={(e) => setLessonForm({ ...lessonForm, day_of_week: parseInt(e.target.value) })}
          >
            {DAYS.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </FormField>

        <div className="form-row">
          <FormField label="Начало">
            <select
              className="form-select"
              value={lessonForm.start_time}
              onChange={(e) => setLessonForm({ ...lessonForm, start_time: e.target.value })}
            >
              {TIME_SLOTS.map(time => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Конец">
            <select
              className="form-select"
              value={lessonForm.end_time}
              onChange={(e) => setLessonForm({ ...lessonForm, end_time: e.target.value })}
            >
              {TIME_SLOTS.map(time => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </FormField>
        </div>

        <FormField label="Тип занятия">
          <select
            className="form-select"
            value={lessonForm.lesson_type}
            onChange={(e) => setLessonForm({ ...lessonForm, lesson_type: e.target.value })}
          >
            {LESSON_TYPES.map(t => (
              <option key={t.id} value={t.id}>{t.icon} {t.label}</option>
            ))}
          </select>
        </FormField>
      </Modal>
    </>
  );
}

export default SchedulePage;
