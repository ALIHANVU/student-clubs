/**
 * SchedulePage — Оптимизированная
 */
import React, { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { supabase, invalidateCache } from '../utils/supabase';
import { haptic } from '../utils/haptic';
import { useNotification } from '../context/NotificationContext';
import { useApp } from '../context/AppContext';
import { DAYS, TIME_SLOTS, LESSON_TYPES } from '../utils/constants';
import { formatTime, getLessonTypeLabel, getLessonTypeIcon } from '../utils/helpers';
import { PageHeader, EmptyState, FilterTabs, Button, FormField, Input, PullToRefresh, Badge, SkeletonList } from '../components/UI';
import { Modal } from '../components/Modal';
import { MobilePageHeader } from '../components/Navigation';

export const SchedulePage = memo(function SchedulePage() {
  const { user } = useApp();
  const { notify } = useNotification();
  
  const [schedule, setSchedule] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState(new Date().getDay() || 1);
  
  const [showModal, setShowModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [lessonForm, setLessonForm] = useState({ 
    subject: '', teacher: '', room: '', 
    day_of_week: 1, start_time: '08:30', end_time: '10:00', lesson_type: 'lecture' 
  });
  const [submitting, setSubmitting] = useState(false);

  const isAdmin = user.role === 'main_admin';
  const isGroupLeader = user.role === 'group_leader';
  const canEdit = isAdmin || isGroupLeader;

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        if (isAdmin) {
          const { data } = await supabase.from('study_groups').select('*, directions(name, faculties(name))').order('name');
          setGroups(data || []);
          if (data?.length > 0) setSelectedGroup(data[0].id);
          else setLoading(false);
        } else if (user.group_id) {
          setSelectedGroup(user.group_id);
          const { data } = await supabase.from('study_groups').select('*, directions(name, faculties(name))').eq('id', user.group_id).single();
          if (data) setGroups([data]);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error:', error);
        setLoading(false);
      }
    };
    loadInitialData();
  }, [isAdmin, user.group_id]);

  const loadSchedule = useCallback(async (groupId) => {
    try {
      const { data } = await supabase.from('schedules').select('*').eq('group_id', groupId).order('start_time');
      setSchedule(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    if (selectedGroup) loadSchedule(selectedGroup); 
  }, [selectedGroup, loadSchedule]);

  const handleRefresh = useCallback(async () => {
    if (selectedGroup) {
      setLoading(true);
      await loadSchedule(selectedGroup);
      notify.success('Обновлено');
    }
  }, [selectedGroup, loadSchedule, notify]);

  const openAddModal = useCallback((day = activeDay) => {
    setEditingLesson(null);
    setLessonForm({ subject: '', teacher: '', room: '', day_of_week: day, start_time: '08:30', end_time: '10:00', lesson_type: 'lecture' });
    setShowModal(true);
  }, [activeDay]);

  const openEditModal = useCallback((lesson) => {
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
  }, []);

  const saveLesson = useCallback(async () => {
    if (!lessonForm.subject.trim()) return;
    setSubmitting(true);

    try {
      const lessonData = { ...lessonForm, group_id: selectedGroup, created_by: user.id };

      if (editingLesson) {
        await supabase.from('schedules').update(lessonData).eq('id', editingLesson.id);
        notify.success('Занятие обновлено');
      } else {
        await supabase.from('schedules').insert(lessonData);
        notify.success('Занятие добавлено');
      }

      invalidateCache('schedule');
      setShowModal(false);
      loadSchedule(selectedGroup);
      haptic.success();
    } catch (error) {
      notify.error('Ошибка');
      haptic.error();
    } finally {
      setSubmitting(false);
    }
  }, [lessonForm, selectedGroup, user.id, editingLesson, loadSchedule, notify]);

  const deleteLesson = useCallback(async (id) => {
    if (!window.confirm('Удалить занятие?')) return;
    try {
      await supabase.from('schedules').delete().eq('id', id);
      invalidateCache('schedule');
      loadSchedule(selectedGroup);
      notify.success('Удалено');
      haptic.medium();
    } catch (error) {
      notify.error('Ошибка');
      haptic.error();
    }
  }, [selectedGroup, loadSchedule, notify]);

  const daySchedule = useMemo(() => 
    schedule.filter(s => s.day_of_week === activeDay).sort((a, b) => a.start_time.localeCompare(b.start_time)),
    [schedule, activeDay]
  );

  const currentGroup = useMemo(() => groups.find(g => g.id === selectedGroup), [groups, selectedGroup]);
  const dayTabs = useMemo(() => DAYS.map(d => ({ id: d.id, label: d.short })), []);

  if (!loading && !selectedGroup && !isAdmin) {
    return (
      <>
        <PageHeader title="📚 Расписание" />
        <MobilePageHeader title="Расписание" />
        <div className="page-content">
          <EmptyState icon="👥" title="Группа не выбрана" text="Вы не привязаны к учебной группе" />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="📚 Расписание" action={canEdit && selectedGroup && <Button variant="primary" onClick={() => openAddModal()}>+ Добавить</Button>} />
      <MobilePageHeader title="Расписание" subtitle={currentGroup ? currentGroup.name : null} actions={canEdit && selectedGroup ? [{ icon: 'plus', onClick: () => openAddModal(), primary: true }] : []} />

      <PullToRefresh onRefresh={handleRefresh}>
        <div className="page-content">
          {isAdmin && groups.length > 0 && (
            <div className="schedule-group-selector">
              <select className="form-select" value={selectedGroup || ''} onChange={(e) => { setSelectedGroup(e.target.value); setLoading(true); haptic.light(); }}>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name} — {g.directions?.faculties?.name}</option>)}
              </select>
            </div>
          )}

          {currentGroup && !isAdmin && (
            <div className="schedule-group-info">
              <div className="schedule-group-name">{currentGroup.name}</div>
              <div className="schedule-group-faculty">{currentGroup.directions?.faculties?.name} • {currentGroup.directions?.name}</div>
              {isGroupLeader && <Badge variant="orange">Вы староста</Badge>}
            </div>
          )}

          <FilterTabs tabs={dayTabs} activeTab={activeDay} onChange={setActiveDay} />
          <div className="schedule-day-title">{DAYS.find(d => d.id === activeDay)?.name}</div>

          {loading ? (
            <SkeletonList count={4} />
          ) : daySchedule.length === 0 ? (
            <EmptyState icon="📚" title="Нет занятий" text={canEdit ? 'Добавьте первое занятие' : 'В этот день занятий нет'} action={canEdit && <Button variant="primary" onClick={() => openAddModal()}>+ Добавить</Button>} />
          ) : (
            <div className="schedule-list">
              {daySchedule.map((lesson) => (
                <div key={lesson.id} className="schedule-item" onClick={() => canEdit && openEditModal(lesson)}>
                  <div className="schedule-time">
                    <span className="schedule-time-start">{formatTime(lesson.start_time)}</span>
                    <span className="schedule-time-end">{formatTime(lesson.end_time)}</span>
                  </div>
                  <div className="schedule-content">
                    <div className="schedule-subject">{getLessonTypeIcon(lesson.lesson_type)} {lesson.subject}</div>
                    <div className="schedule-details">
                      {lesson.teacher && <span>👤 {lesson.teacher}</span>}
                      {lesson.room && <span>🚪 Ауд. {lesson.room}</span>}
                      <span className="schedule-type-badge">{getLessonTypeLabel(lesson.lesson_type)}</span>
                    </div>
                  </div>
                  {canEdit && <button className="schedule-delete" onClick={(e) => { e.stopPropagation(); deleteLesson(lesson.id); }}>✕</button>}
                </div>
              ))}
            </div>
          )}
        </div>
      </PullToRefresh>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingLesson ? 'Редактировать' : 'Добавить занятие'} footer={
        <>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Отмена</Button>
          <Button variant="primary" onClick={saveLesson} disabled={!lessonForm.subject.trim() || submitting}>{submitting ? 'Сохранение...' : 'Сохранить'}</Button>
        </>
      }>
        <FormField label="Предмет"><Input value={lessonForm.subject} onChange={(e) => setLessonForm(prev => ({ ...prev, subject: e.target.value }))} placeholder="Математический анализ" autoFocus /></FormField>
        <FormField label="Преподаватель"><Input value={lessonForm.teacher} onChange={(e) => setLessonForm(prev => ({ ...prev, teacher: e.target.value }))} placeholder="Иванов И.И." /></FormField>
        <FormField label="Аудитория"><Input value={lessonForm.room} onChange={(e) => setLessonForm(prev => ({ ...prev, room: e.target.value }))} placeholder="101" /></FormField>
        <FormField label="День недели">
          <select className="form-select" value={lessonForm.day_of_week} onChange={(e) => setLessonForm(prev => ({ ...prev, day_of_week: parseInt(e.target.value) }))}>
            {DAYS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </FormField>
        <div className="form-row">
          <FormField label="Начало">
            <select className="form-select" value={lessonForm.start_time} onChange={(e) => setLessonForm(prev => ({ ...prev, start_time: e.target.value }))}>
              {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </FormField>
          <FormField label="Конец">
            <select className="form-select" value={lessonForm.end_time} onChange={(e) => setLessonForm(prev => ({ ...prev, end_time: e.target.value }))}>
              {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </FormField>
        </div>
        <FormField label="Тип занятия">
          <select className="form-select" value={lessonForm.lesson_type} onChange={(e) => setLessonForm(prev => ({ ...prev, lesson_type: e.target.value }))}>
            {LESSON_TYPES.map(t => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
          </select>
        </FormField>
      </Modal>
    </>
  );
});

export default SchedulePage;
