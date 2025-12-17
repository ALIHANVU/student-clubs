/**
 * SchedulePage — Страница расписания
 * 
 * ✅ Просмотр расписания по группам
 * ✅ Редактирование для старост и админов
 * ✅ Фильтрация по дням недели
 * ✅ iOS 26 Liquid Glass дизайн
 */
import React, { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { supabase, invalidateCache } from '../utils/supabase';
import { haptic } from '../utils/haptic';
import { getLessonTypeName, getWeekTypeName } from '../utils/helpers';
import { DAYS, TIME_SLOTS, LESSON_TYPES, WEEK_TYPES } from '../utils/constants';
import { useNotification } from '../context/NotificationContext';
import { useApp } from '../context/AppContext';
import { 
  PageHeader, EmptyState, FilterTabs, Button, FormField, Input, 
  PullToRefresh, SkeletonList, Badge
} from '../components/UI';
import { Modal, ConfirmModal } from '../components/Modal';
import { MobilePageHeader } from '../components/Navigation';
import { IconEdit, IconTrash, IconPlus } from '../components/Icons';

export const SchedulePage = memo(function SchedulePage() {
  const { user } = useApp();
  const { notify } = useNotification();
  
  // Данные
  const [schedules, setSchedules] = useState([]);
  const [groups, setGroups] = useState([]);
  const [subgroups, setSubgroups] = useState([]);
  const [directions, setDirections] = useState([]);
  const [faculties, setFaculties] = useState([]);
  
  // UI состояния
  const [loading, setLoading] = useState(true);
  const [selectedGroupId, setSelectedGroupId] = useState(user.group_id || '');
  const [selectedSubgroupId, setSelectedSubgroupId] = useState(user.subgroup_id || '');
  const [selectedDay, setSelectedDay] = useState(new Date().getDay() || 1);
  
  // Модалки
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    subject: '',
    teacher: '',
    room: '',
    start_time: '08:30',
    end_time: '10:00',
    lesson_type: 'lecture',
    week_type: 'all',
    subgroup_id: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Права доступа
  const isAdmin = user.role === 'main_admin';
  const isGroupLeader = user.role === 'group_leader';
  
  // Староста может редактировать только расписание своей группы
  const canEdit = isAdmin || (isGroupLeader && selectedGroupId === user.group_id);

  // ========== ЗАГРУЗКА ДАННЫХ ==========
  const loadData = useCallback(async () => {
    try {
      const [groupsRes, subgroupsRes, directionsRes, facultiesRes] = await Promise.all([
        supabase.from('study_groups').select('*').order('name'),
        supabase.from('subgroups').select('*').order('name'),
        supabase.from('directions').select('*').order('name'),
        supabase.from('faculties').select('*').order('name')
      ]);
      
      setGroups(groupsRes.data || []);
      setSubgroups(subgroupsRes.data || []);
      setDirections(directionsRes.data || []);
      setFaculties(facultiesRes.data || []);
      
      // Устанавливаем группу пользователя по умолчанию
      if (!selectedGroupId && user.group_id) {
        setSelectedGroupId(user.group_id);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      notify.error('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  }, [user.group_id, selectedGroupId, notify]);

  // Загрузка расписания для выбранной группы
  const loadSchedule = useCallback(async () => {
    if (!selectedGroupId) {
      setSchedules([]);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select('*, subgroups(name)')
        .eq('group_id', selectedGroupId)
        .order('start_time');
      
      if (error) throw error;
      setSchedules(data || []);
    } catch (error) {
      console.error('Error loading schedule:', error);
      notify.error('Ошибка загрузки расписания');
    }
  }, [selectedGroupId, notify]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { loadSchedule(); }, [loadSchedule]);

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    await loadData();
    await loadSchedule();
    notify.success('Обновлено');
  }, [loadData, loadSchedule, notify]);

  // ========== ФИЛЬТРАЦИЯ ==========
  
  // Подгруппы для выбранной группы
  const filteredSubgroups = useMemo(() => 
    subgroups.filter(s => s.group_id === selectedGroupId),
    [subgroups, selectedGroupId]
  );

  // Расписание на выбранный день
  const daySchedule = useMemo(() => {
    let filtered = schedules.filter(s => s.day_of_week === selectedDay);
    
    // Фильтруем по подгруппе если выбрана
    if (selectedSubgroupId) {
      filtered = filtered.filter(s => 
        s.subgroup_id === null || s.subgroup_id === selectedSubgroupId
      );
    }
    
    // Сортируем по времени
    return filtered.sort((a, b) => {
      const timeA = a.start_time || '00:00';
      const timeB = b.start_time || '00:00';
      return timeA.localeCompare(timeB);
    });
  }, [schedules, selectedDay, selectedSubgroupId]);

  // Группируем группы по факультетам для селекта
  const groupedGroups = useMemo(() => {
    const grouped = {};
    groups.forEach(g => {
      const direction = directions.find(d => d.id === g.direction_id);
      const faculty = faculties.find(f => f.id === direction?.faculty_id);
      const key = faculty?.name || 'Без факультета';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push({ ...g, direction });
    });
    return grouped;
  }, [groups, directions, faculties]);

  // Информация о выбранной группе
  const selectedGroupInfo = useMemo(() => {
    const group = groups.find(g => g.id === selectedGroupId);
    if (!group) return null;
    
    const direction = directions.find(d => d.id === group.direction_id);
    const faculty = faculties.find(f => f.id === direction?.faculty_id);
    
    return {
      ...group,
      directionName: direction?.name,
      facultyName: faculty?.name
    };
  }, [selectedGroupId, groups, directions, faculties]);

  // ========== МОДАЛКИ ==========
  const openAddModal = useCallback(() => {
    setEditing(null);
    setForm({
      subject: '',
      teacher: '',
      room: '',
      start_time: '08:30',
      end_time: '10:00',
      lesson_type: 'lecture',
      week_type: 'all',
      subgroup_id: '',
      notes: ''
    });
    setShowModal(true);
    haptic.light();
  }, []);

  const openEditModal = useCallback((lesson) => {
    setEditing(lesson);
    setForm({
      subject: lesson.subject || '',
      teacher: lesson.teacher || '',
      room: lesson.room || '',
      start_time: lesson.start_time?.slice(0, 5) || '08:30',
      end_time: lesson.end_time?.slice(0, 5) || '10:00',
      lesson_type: lesson.lesson_type || 'lecture',
      week_type: lesson.week_type || 'all',
      subgroup_id: lesson.subgroup_id || '',
      notes: lesson.notes || ''
    });
    setShowModal(true);
    haptic.light();
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setEditing(null);
  }, []);

  // ========== СОХРАНЕНИЕ ==========
  const saveLesson = useCallback(async () => {
    if (!form.subject.trim()) {
      notify.error('Введите название предмета');
      return;
    }
    
    if (!selectedGroupId) {
      notify.error('Выберите группу');
      return;
    }
    
    setSubmitting(true);
    
    try {
      const lessonData = {
        group_id: selectedGroupId,
        day_of_week: selectedDay,
        subject: form.subject.trim(),
        teacher: form.teacher.trim() || null,
        room: form.room.trim() || null,
        start_time: form.start_time,
        end_time: form.end_time,
        lesson_type: form.lesson_type,
        week_type: form.week_type,
        subgroup_id: form.subgroup_id || null,
        notes: form.notes.trim() || null,
        created_by: user.id
      };
      
      if (editing) {
        const { error } = await supabase
          .from('schedules')
          .update(lessonData)
          .eq('id', editing.id);
        
        if (error) throw error;
        notify.success('Занятие обновлено');
      } else {
        const { error } = await supabase
          .from('schedules')
          .insert(lessonData);
        
        if (error) throw error;
        notify.success('Занятие добавлено');
      }
      
      invalidateCache('schedules');
      closeModal();
      loadSchedule();
      haptic.success();
    } catch (error) {
      console.error('Error saving lesson:', error);
      notify.error('Ошибка сохранения: ' + (error.message || ''));
      haptic.error();
    } finally {
      setSubmitting(false);
    }
  }, [form, selectedGroupId, selectedDay, editing, user.id, loadSchedule, notify, closeModal]);

  // ========== УДАЛЕНИЕ ==========
  const requestDelete = useCallback((lesson, e) => {
    e?.stopPropagation();
    setDeleteTarget(lesson);
    setShowConfirmDelete(true);
    haptic.light();
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    
    try {
      const { error } = await supabase
        .from('schedules')
        .delete()
        .eq('id', deleteTarget.id);
      
      if (error) throw error;
      
      invalidateCache('schedules');
      loadSchedule();
      notify.success('Занятие удалено');
      haptic.medium();
    } catch (error) {
      console.error('Error deleting lesson:', error);
      notify.error('Ошибка удаления');
      haptic.error();
    } finally {
      setShowConfirmDelete(false);
      setDeleteTarget(null);
    }
  }, [deleteTarget, loadSchedule, notify]);

  // ========== ДЕНЬ НЕДЕЛИ ==========
  const dayTabs = useMemo(() => 
    DAYS.map(d => ({ id: d.id, label: d.short })),
    []
  );

  const currentDayName = useMemo(() => 
    DAYS.find(d => d.id === selectedDay)?.name || '',
    [selectedDay]
  );

  // ========== РЕНДЕР ==========
  return (
    <>
      <PageHeader 
        title="📚 Расписание" 
        action={canEdit && selectedGroupId && (
          <Button variant="primary" onClick={openAddModal}>
            <IconPlus size={20} />
            Добавить
          </Button>
        )}
      />
      <MobilePageHeader 
        title="Расписание" 
        subtitle={selectedGroupInfo?.name}
        actions={canEdit && selectedGroupId ? [{ icon: 'plus', onClick: openAddModal, primary: true }] : []}
      />

      <PullToRefresh onRefresh={handleRefresh}>
        <div className="page-content">
          {/* Селекторы группы и подгруппы */}
          <div className="schedule-selectors">
            <div className="selector-row">
              <select 
                className="form-select" 
                value={selectedGroupId} 
                onChange={(e) => {
                  setSelectedGroupId(e.target.value);
                  setSelectedSubgroupId('');
                }}
              >
                <option value="">Выберите группу</option>
                {Object.entries(groupedGroups).map(([facultyName, groupList]) => (
                  <optgroup key={facultyName} label={facultyName}>
                    {groupList.map(g => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.course} курс)
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            
            {filteredSubgroups.length > 0 && (
              <div className="selector-row">
                <select 
                  className="form-select" 
                  value={selectedSubgroupId} 
                  onChange={(e) => setSelectedSubgroupId(e.target.value)}
                >
                  <option value="">Все подгруппы</option>
                  {filteredSubgroups.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Информация о группе */}
          {selectedGroupInfo && (
            <div className="schedule-group-info">
              <div className="schedule-group-badge">
                <span className="schedule-group-name">{selectedGroupInfo.name}</span>
                <Badge variant="blue">{selectedGroupInfo.course} курс</Badge>
              </div>
              <div className="schedule-group-path">
                {selectedGroupInfo.facultyName} → {selectedGroupInfo.directionName}
              </div>
            </div>
          )}

          {/* Табы дней недели */}
          <FilterTabs 
            tabs={dayTabs} 
            activeTab={selectedDay} 
            onChange={(day) => {
              haptic.light();
              setSelectedDay(day);
            }} 
          />

          {/* Заголовок дня */}
          <div className="schedule-day-title">{currentDayName}</div>

          {/* Список занятий */}
          {loading ? (
            <SkeletonList count={5} />
          ) : !selectedGroupId ? (
            <EmptyState 
              icon="📚" 
              title="Выберите группу" 
              text="Выберите учебную группу, чтобы посмотреть расписание"
            />
          ) : daySchedule.length === 0 ? (
            <EmptyState 
              icon="🎉" 
              title="Нет занятий" 
              text={`В ${currentDayName.toLowerCase()} нет занятий`}
              action={canEdit && (
                <Button variant="primary" onClick={openAddModal}>
                  <IconPlus size={20} />
                  Добавить занятие
                </Button>
              )}
            />
          ) : (
            <div className="schedule-list">
              {daySchedule.map((lesson) => (
                <div 
                  key={lesson.id} 
                  className="schedule-item"
                  onClick={canEdit ? () => openEditModal(lesson) : undefined}
                >
                  <div className="schedule-time">
                    <span className="schedule-time-start">
                      {lesson.start_time?.slice(0, 5)}
                    </span>
                    <span className="schedule-time-end">
                      {lesson.end_time?.slice(0, 5)}
                    </span>
                  </div>
                  
                  <div className="schedule-content">
                    <div className="schedule-subject">{lesson.subject}</div>
                    <div className="schedule-details">
                      {lesson.teacher && <span>👤 {lesson.teacher}</span>}
                      {lesson.room && <span>🚪 {lesson.room}</span>}
                      <span className="schedule-type-badge">
                        {getLessonTypeName(lesson.lesson_type)}
                      </span>
                      {lesson.week_type !== 'all' && (
                        <span className="schedule-type-badge">
                          {getWeekTypeName(lesson.week_type)}
                        </span>
                      )}
                      {lesson.subgroups?.name && (
                        <span className="schedule-type-badge">
                          {lesson.subgroups.name}
                        </span>
                      )}
                    </div>
                    {lesson.notes && (
                      <div className="schedule-notes">📝 {lesson.notes}</div>
                    )}
                  </div>
                  
                  {canEdit && (
                    <button 
                      className="schedule-delete"
                      onClick={(e) => requestDelete(lesson, e)}
                    >
                      <IconTrash size={18} />
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
        onClose={closeModal} 
        title={editing ? 'Редактировать занятие' : 'Добавить занятие'} 
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>Отмена</Button>
            <Button 
              variant="primary" 
              onClick={saveLesson} 
              disabled={!form.subject.trim() || submitting}
            >
              {submitting ? 'Сохранение...' : (editing ? 'Сохранить' : 'Добавить')}
            </Button>
          </>
        }
      >
        <FormField label="Предмет *">
          <Input 
            value={form.subject} 
            onChange={(e) => setForm(prev => ({ ...prev, subject: e.target.value }))} 
            placeholder="Математический анализ"
            autoFocus 
          />
        </FormField>
        
        <FormField label="Преподаватель">
          <Input 
            value={form.teacher} 
            onChange={(e) => setForm(prev => ({ ...prev, teacher: e.target.value }))} 
            placeholder="Иванов И.И."
          />
        </FormField>
        
        <FormField label="Аудитория">
          <Input 
            value={form.room} 
            onChange={(e) => setForm(prev => ({ ...prev, room: e.target.value }))} 
            placeholder="301"
          />
        </FormField>
        
        <div className="form-row">
          <FormField label="Начало">
            <select 
              className="form-select" 
              value={form.start_time} 
              onChange={(e) => setForm(prev => ({ ...prev, start_time: e.target.value }))}
            >
              {TIME_SLOTS.map(time => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </FormField>
          
          <FormField label="Конец">
            <select 
              className="form-select" 
              value={form.end_time} 
              onChange={(e) => setForm(prev => ({ ...prev, end_time: e.target.value }))}
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
            value={form.lesson_type} 
            onChange={(e) => setForm(prev => ({ ...prev, lesson_type: e.target.value }))}
          >
            {LESSON_TYPES.map(type => (
              <option key={type.id} value={type.id}>{type.icon} {type.label}</option>
            ))}
          </select>
        </FormField>
        
        <FormField label="Периодичность">
          <select 
            className="form-select" 
            value={form.week_type} 
            onChange={(e) => setForm(prev => ({ ...prev, week_type: e.target.value }))}
          >
            {WEEK_TYPES.map(type => (
              <option key={type.id} value={type.id}>{type.label}</option>
            ))}
          </select>
        </FormField>
        
        {filteredSubgroups.length > 0 && (
          <FormField label="Подгруппа">
            <select 
              className="form-select" 
              value={form.subgroup_id} 
              onChange={(e) => setForm(prev => ({ ...prev, subgroup_id: e.target.value }))}
            >
              <option value="">Для всей группы</option>
              {filteredSubgroups.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </FormField>
        )}
        
        <FormField label="Заметки">
          <Input 
            value={form.notes} 
            onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))} 
            placeholder="Дополнительная информация..."
          />
        </FormField>
      </Modal>

      {/* Модалка подтверждения удаления */}
      <ConfirmModal
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        onConfirm={confirmDelete}
        title="Удалить занятие?"
        message={`Удалить "${deleteTarget?.subject}" из расписания?`}
        confirmText="Удалить"
        cancelText="Отмена"
        variant="danger"
      />
    </>
  );
});

export default SchedulePage;
