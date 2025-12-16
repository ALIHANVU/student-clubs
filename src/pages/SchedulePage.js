/**
 * SchedulePage — ИСПРАВЛЕННАЯ версия
 * 
 * ИСПРАВЛЕНО:
 * 1. Селекторы теперь доступны всем ролям (админ, староста, студент)
 * 2. Студенты и старосты с привязанной группой видят свою группу по умолчанию, но могут смотреть другие
 * 3. Создание групп работает корректно
 * 4. Староста может редактировать расписание своей группы
 * 5. Админ может редактировать всё
 */
import React, { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { supabase, invalidateCache } from '../utils/supabase';
import { haptic } from '../utils/haptic';
import { useNotification } from '../context/NotificationContext';
import { useApp } from '../context/AppContext';
import { DAYS, TIME_SLOTS, LESSON_TYPES, WEEK_TYPES } from '../utils/constants';
import { formatTime, getLessonTypeLabel, getLessonTypeIcon } from '../utils/helpers';
import { 
  PageHeader, EmptyState, FilterTabs, Button, FormField, Input, 
  Textarea, PullToRefresh, Badge, SkeletonList, Toggle 
} from '../components/UI';
import { Modal } from '../components/Modal';
import { MobilePageHeader } from '../components/Navigation';

export const SchedulePage = memo(function SchedulePage() {
  const { user } = useApp();
  const { notify } = useNotification();
  
  // Данные структуры
  const [faculties, setFaculties] = useState([]);
  const [directions, setDirections] = useState([]);
  const [groups, setGroups] = useState([]);
  const [subgroups, setSubgroups] = useState([]);
  
  // Выбранные значения
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [selectedDirection, setSelectedDirection] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedSubgroup, setSelectedSubgroup] = useState(null);
  
  // Расписание
  const [schedule, setSchedule] = useState([]);
  const [activeDay, setActiveDay] = useState(() => {
    const today = new Date().getDay();
    return today === 0 ? 1 : (today > 6 ? 1 : today);
  });
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  
  // Модалки
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showStructureModal, setShowStructureModal] = useState(false);
  const [structureModalType, setStructureModalType] = useState('faculty');
  
  // Формы
  const [editingLesson, setEditingLesson] = useState(null);
  const [lessonForm, setLessonForm] = useState({ 
    subject: '', teacher: '', room: '', 
    day_of_week: 1, start_time: '08:30', end_time: '10:00', 
    lesson_type: 'lecture', week_type: 'all',
    for_subgroup: false, subgroup_id: null
  });
  const [notificationForm, setNotificationForm] = useState({
    title: '', message: '', is_important: false
  });
  const [structureForm, setStructureForm] = useState({
    name: '', code: '', parent_id: null
  });
  
  const [submitting, setSubmitting] = useState(false);

  // ========== ПРАВА ДОСТУПА ==========
  const isMainAdmin = user.role === 'main_admin';
  const isGroupLeader = user.role === 'group_leader';
  
  // Староста может редактировать только свою группу
  // Админ может редактировать любую группу
  const canEditSchedule = isMainAdmin || (isGroupLeader && selectedGroup === user.group_id);
  
  // Уведомления может отправлять только староста своей группы
  const canSendNotifications = isGroupLeader && selectedGroup === user.group_id;
  
  // Структуру может редактировать только главный админ
  const canEditStructure = isMainAdmin;

  // ========== ЗАГРУЗКА ДАННЫХ ==========
  
  const loadStructure = useCallback(async () => {
    try {
      const [f, d, g, s] = await Promise.all([
        supabase.from('faculties').select('*').order('name'),
        supabase.from('directions').select('*').order('name'),
        supabase.from('study_groups').select('*, leader:users!study_groups_leader_id_fkey(full_name)').order('name'),
        supabase.from('subgroups').select('*').order('name')
      ]);
      
      setFaculties(f.data || []);
      setDirections(d.data || []);
      setGroups(g.data || []);
      setSubgroups(s.data || []);
      
      return { faculties: f.data || [], directions: d.data || [], groups: g.data || [], subgroups: s.data || [] };
    } catch (error) {
      console.error('Error loading structure:', error);
      return { faculties: [], directions: [], groups: [], subgroups: [] };
    }
  }, []);

  const loadSchedule = useCallback(async (groupId) => {
    if (!groupId) {
      setSchedule([]);
      setLoading(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select('*, subgroups(name)')
        .eq('group_id', groupId)
        .order('start_time');
      
      if (error) throw error;
      setSchedule(data || []);
    } catch (error) {
      console.error('Error loading schedule:', error);
      setSchedule([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Начальная загрузка
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      const data = await loadStructure();
      
      // Если пользователь привязан к группе - выбираем её автоматически
      if (user.group_id && data.groups.length > 0) {
        const userGroup = data.groups.find(gr => gr.id === user.group_id);
        if (userGroup) {
          const userDirection = data.directions.find(dir => dir.id === userGroup.direction_id);
          if (userDirection) {
            setSelectedFaculty(userDirection.faculty_id);
            setSelectedDirection(userDirection.id);
          }
          setSelectedGroup(userGroup.id);
          if (user.subgroup_id) {
            setSelectedSubgroup(user.subgroup_id);
          }
        }
      } else if (data.faculties.length > 0) {
        // Для всех пользователей без группы - выбираем первый факультет
        setSelectedFaculty(data.faculties[0].id);
      }
      
      setDataLoaded(true);
      setLoading(false);
    };
    
    initData();
  }, [user.group_id, user.subgroup_id, loadStructure]);

  // Загрузка расписания при выборе группы
  useEffect(() => {
    if (selectedGroup && dataLoaded) {
      setLoading(true);
      loadSchedule(selectedGroup);
    }
  }, [selectedGroup, dataLoaded, loadSchedule]);

  // При выборе факультета - выбираем первое направление
  useEffect(() => {
    if (selectedFaculty && dataLoaded) {
      const facultyDirections = directions.filter(d => d.faculty_id === selectedFaculty);
      if (facultyDirections.length > 0 && !selectedDirection) {
        setSelectedDirection(facultyDirections[0].id);
      } else if (facultyDirections.length === 0) {
        setSelectedDirection(null);
        setSelectedGroup(null);
      }
    }
  }, [selectedFaculty, directions, dataLoaded, selectedDirection]);

  // При выборе направления - выбираем первую группу
  useEffect(() => {
    if (selectedDirection && dataLoaded) {
      const directionGroups = groups.filter(g => g.direction_id === selectedDirection);
      if (directionGroups.length > 0 && !selectedGroup) {
        setSelectedGroup(directionGroups[0].id);
      } else if (directionGroups.length === 0) {
        setSelectedGroup(null);
      }
    }
  }, [selectedDirection, groups, dataLoaded, selectedGroup]);

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    await loadStructure();
    if (selectedGroup) {
      await loadSchedule(selectedGroup);
    } else {
      setLoading(false);
    }
    notify.success('Обновлено');
  }, [loadStructure, loadSchedule, selectedGroup, notify]);

  // ========== ФИЛЬТРАЦИЯ ==========
  
  const filteredDirections = useMemo(() => 
    directions.filter(d => d.faculty_id === selectedFaculty),
    [directions, selectedFaculty]
  );
  
  const filteredGroups = useMemo(() => 
    groups.filter(g => g.direction_id === selectedDirection),
    [groups, selectedDirection]
  );
  
  const filteredSubgroups = useMemo(() => 
    subgroups.filter(s => s.group_id === selectedGroup),
    [subgroups, selectedGroup]
  );

  // Расписание на выбранный день (с учётом подгруппы)
  const daySchedule = useMemo(() => {
    let filtered = schedule.filter(s => s.day_of_week === activeDay);
    
    // Фильтруем по подгруппе если выбрана
    if (selectedSubgroup) {
      filtered = filtered.filter(s => 
        s.subgroup_id === null || s.subgroup_id === selectedSubgroup
      );
    }
    
    return filtered.sort((a, b) => a.start_time.localeCompare(b.start_time));
  }, [schedule, activeDay, selectedSubgroup]);

  // Текущая группа с информацией
  const currentGroup = useMemo(() => {
    const group = groups.find(g => g.id === selectedGroup);
    if (!group) return null;
    
    const direction = directions.find(d => d.id === group.direction_id);
    const faculty = faculties.find(f => f.id === direction?.faculty_id);
    
    return {
      ...group,
      direction,
      faculty
    };
  }, [selectedGroup, groups, directions, faculties]);

  // ========== МОДАЛКИ РАСПИСАНИЯ ==========

  const openAddLessonModal = useCallback((day = activeDay) => {
    setEditingLesson(null);
    setLessonForm({ 
      subject: '', teacher: '', room: '', 
      day_of_week: day, start_time: '08:30', end_time: '10:00', 
      lesson_type: 'lecture', week_type: 'all',
      for_subgroup: false, subgroup_id: null
    });
    setShowLessonModal(true);
  }, [activeDay]);

  const openEditLessonModal = useCallback((lesson) => {
    setEditingLesson(lesson);
    setLessonForm({ 
      subject: lesson.subject, 
      teacher: lesson.teacher || '', 
      room: lesson.room || '', 
      day_of_week: lesson.day_of_week, 
      start_time: lesson.start_time?.slice(0, 5) || '08:30', 
      end_time: lesson.end_time?.slice(0, 5) || '10:00', 
      lesson_type: lesson.lesson_type || 'lecture',
      week_type: lesson.week_type || 'all',
      for_subgroup: !!lesson.subgroup_id,
      subgroup_id: lesson.subgroup_id
    });
    setShowLessonModal(true);
    haptic.light();
  }, []);

  const saveLesson = useCallback(async () => {
    if (!lessonForm.subject.trim()) {
      notify.error('Введите название предмета');
      return;
    }
    
    setSubmitting(true);
    try {
      const lessonData = {
        group_id: selectedGroup,
        subgroup_id: lessonForm.for_subgroup ? lessonForm.subgroup_id : null,
        day_of_week: lessonForm.day_of_week,
        subject: lessonForm.subject.trim(),
        teacher: lessonForm.teacher.trim() || null,
        room: lessonForm.room.trim() || null,
        start_time: lessonForm.start_time,
        end_time: lessonForm.end_time,
        lesson_type: lessonForm.lesson_type,
        week_type: lessonForm.week_type,
        created_by: user.id
      };

      if (editingLesson) {
        const { error } = await supabase
          .from('schedules')
          .update(lessonData)
          .eq('id', editingLesson.id);
        if (error) throw error;
        notify.success('Занятие обновлено');
      } else {
        const { error } = await supabase
          .from('schedules')
          .insert(lessonData);
        if (error) throw error;
        notify.success('Занятие добавлено');
      }

      invalidateCache('schedule');
      setShowLessonModal(false);
      loadSchedule(selectedGroup);
      haptic.success();
    } catch (error) {
      console.error('Error saving lesson:', error);
      notify.error('Ошибка сохранения: ' + (error.message || ''));
      haptic.error();
    } finally {
      setSubmitting(false);
    }
  }, [lessonForm, selectedGroup, user.id, editingLesson, loadSchedule, notify]);

  const deleteLesson = useCallback(async (id) => {
    if (!window.confirm('Удалить занятие?')) return;
    
    try {
      const { error } = await supabase.from('schedules').delete().eq('id', id);
      if (error) throw error;
      
      invalidateCache('schedule');
      loadSchedule(selectedGroup);
      notify.success('Занятие удалено');
      haptic.medium();
    } catch (error) {
      console.error('Error deleting lesson:', error);
      notify.error('Ошибка удаления');
      haptic.error();
    }
  }, [selectedGroup, loadSchedule, notify]);

  // ========== МОДАЛКА УВЕДОМЛЕНИЙ ==========

  const openNotificationModal = useCallback(() => {
    setNotificationForm({ title: '', message: '', is_important: false });
    setShowNotificationModal(true);
  }, []);

  const sendNotification = useCallback(async () => {
    if (!notificationForm.title.trim() || !notificationForm.message.trim()) {
      notify.error('Заполните заголовок и сообщение');
      return;
    }
    
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('group_notifications')
        .insert({
          group_id: selectedGroup,
          sender_id: user.id,
          title: notificationForm.title.trim(),
          message: notificationForm.message.trim(),
          is_important: notificationForm.is_important
        });
      
      if (error) throw error;
      
      notify.success('Уведомление отправлено группе!');
      setShowNotificationModal(false);
      haptic.success();
    } catch (error) {
      console.error('Error sending notification:', error);
      notify.error('Ошибка отправки: ' + (error.message || ''));
      haptic.error();
    } finally {
      setSubmitting(false);
    }
  }, [notificationForm, selectedGroup, user.id, notify]);

  // ========== МОДАЛКА СТРУКТУРЫ (для админа) ==========

  const openStructureModal = useCallback((type, parentId = null) => {
    setStructureModalType(type);
    setStructureForm({ name: '', code: '', parent_id: parentId });
    setShowStructureModal(true);
  }, []);

  const saveStructure = useCallback(async () => {
    if (!structureForm.name.trim()) {
      notify.error('Введите название');
      return;
    }
    
    setSubmitting(true);
    try {
      let result;
      
      if (structureModalType === 'faculty') {
        result = await supabase.from('faculties').insert({
          name: structureForm.name.trim(),
          code: structureForm.code.trim() || null,
          description: null
        }).select().single();
        
      } else if (structureModalType === 'direction') {
        if (!structureForm.parent_id) {
          notify.error('Не выбран факультет');
          setSubmitting(false);
          return;
        }
        result = await supabase.from('directions').insert({
          name: structureForm.name.trim(),
          code: structureForm.code.trim() || null,
          faculty_id: structureForm.parent_id
        }).select().single();
        
      } else if (structureModalType === 'group') {
        if (!structureForm.parent_id) {
          notify.error('Не выбрано направление');
          setSubmitting(false);
          return;
        }
        result = await supabase.from('study_groups').insert({
          name: structureForm.name.trim(),
          direction_id: structureForm.parent_id,
          course: 1,
          year: new Date().getFullYear()
        }).select().single();
        
      } else if (structureModalType === 'subgroup') {
        if (!structureForm.parent_id) {
          notify.error('Не выбрана группа');
          setSubmitting(false);
          return;
        }
        result = await supabase.from('subgroups').insert({
          name: structureForm.name.trim(),
          group_id: structureForm.parent_id
        }).select().single();
      }
      
      if (result?.error) throw result.error;
      
      const names = { faculty: 'Факультет', direction: 'Направление', group: 'Группа', subgroup: 'Подгруппа' };
      notify.success(`${names[structureModalType]} создан`);
      setShowStructureModal(false);
      
      // Перезагружаем структуру
      const newData = await loadStructure();
      
      // Автоматически выбираем созданный элемент
      if (result?.data) {
        if (structureModalType === 'faculty') {
          setSelectedFaculty(result.data.id);
          setSelectedDirection(null);
          setSelectedGroup(null);
        } else if (structureModalType === 'direction') {
          setSelectedDirection(result.data.id);
          setSelectedGroup(null);
        } else if (structureModalType === 'group') {
          setSelectedGroup(result.data.id);
        }
      }
      
      haptic.success();
    } catch (error) {
      console.error('Error saving structure:', error);
      notify.error('Ошибка сохранения: ' + (error.message || ''));
      haptic.error();
    } finally {
      setSubmitting(false);
    }
  }, [structureForm, structureModalType, loadStructure, notify]);

  // ========== РЕНДЕР ==========

  const dayTabs = useMemo(() => DAYS.map(d => ({ id: d.id, label: d.short })), []);

  // Заголовок модалки структуры
  const structureModalTitle = useMemo(() => {
    const names = { 
      faculty: 'Создать факультет', 
      direction: 'Создать направление', 
      group: 'Создать группу',
      subgroup: 'Создать подгруппу'
    };
    return names[structureModalType];
  }, [structureModalType]);

  // Обработчики изменения селекторов
  const handleFacultyChange = useCallback((e) => {
    const value = e.target.value || null;
    setSelectedFaculty(value);
    setSelectedDirection(null);
    setSelectedGroup(null);
    setSelectedSubgroup(null);
    haptic.light();
  }, []);

  const handleDirectionChange = useCallback((e) => {
    const value = e.target.value || null;
    setSelectedDirection(value);
    setSelectedGroup(null);
    setSelectedSubgroup(null);
    haptic.light();
  }, []);

  const handleGroupChange = useCallback((e) => {
    const value = e.target.value || null;
    setSelectedGroup(value);
    setSelectedSubgroup(null);
    if (value) {
      setLoading(true);
    }
    haptic.light();
  }, []);

  const handleSubgroupChange = useCallback((e) => {
    setSelectedSubgroup(e.target.value || null);
    haptic.light();
  }, []);

  return (
    <>
      <PageHeader 
        title="📚 Расписание" 
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            {canSendNotifications && (
              <Button variant="secondary" onClick={openNotificationModal}>
                🔔 Уведомление
              </Button>
            )}
            {canEditSchedule && selectedGroup && (
              <Button variant="primary" onClick={() => openAddLessonModal()}>
                + Добавить
              </Button>
            )}
          </div>
        }
      />
      <MobilePageHeader 
        title="Расписание" 
        subtitle={currentGroup?.name}
        actions={[
          ...(canSendNotifications ? [{ icon: 'bell', onClick: openNotificationModal }] : []),
          ...(canEditSchedule && selectedGroup ? [{ icon: 'plus', onClick: () => openAddLessonModal(), primary: true }] : [])
        ].filter(Boolean)}
      />

      <PullToRefresh onRefresh={handleRefresh}>
        <div className="page-content">
          
          {/* Селекторы структуры - ДОСТУПНЫ ВСЕМ */}
          <div className="schedule-selectors">
            {/* Факультет */}
            <div className="selector-row">
              <select 
                className="form-select" 
                value={selectedFaculty || ''} 
                onChange={handleFacultyChange}
              >
                <option value="">Выберите факультет</option>
                {faculties.map(f => (
                  <option key={f.id} value={f.id}>{f.code ? `${f.code} — ` : ''}{f.name}</option>
                ))}
              </select>
              {canEditStructure && (
                <button className="selector-add-btn" onClick={() => openStructureModal('faculty')}>+</button>
              )}
            </div>

            {/* Направление */}
            {selectedFaculty && (
              <div className="selector-row">
                <select 
                  className="form-select" 
                  value={selectedDirection || ''} 
                  onChange={handleDirectionChange}
                >
                  <option value="">Выберите направление</option>
                  {filteredDirections.map(d => (
                    <option key={d.id} value={d.id}>{d.code ? `${d.code} — ` : ''}{d.name}</option>
                  ))}
                </select>
                {canEditStructure && (
                  <button className="selector-add-btn" onClick={() => openStructureModal('direction', selectedFaculty)}>+</button>
                )}
              </div>
            )}

            {/* Группа */}
            {selectedDirection && (
              <div className="selector-row">
                <select 
                  className="form-select" 
                  value={selectedGroup || ''} 
                  onChange={handleGroupChange}
                >
                  <option value="">Выберите группу</option>
                  {filteredGroups.map(g => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.course} курс){g.leader?.full_name ? ` — Староста: ${g.leader.full_name}` : ''}
                    </option>
                  ))}
                </select>
                {canEditStructure && (
                  <button className="selector-add-btn" onClick={() => openStructureModal('group', selectedDirection)}>+</button>
                )}
              </div>
            )}

            {/* Подгруппа (опционально) */}
            {selectedGroup && filteredSubgroups.length > 0 && (
              <div className="selector-row">
                <select 
                  className="form-select" 
                  value={selectedSubgroup || ''} 
                  onChange={handleSubgroupChange}
                >
                  <option value="">Вся группа</option>
                  {filteredSubgroups.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                {canEditStructure && (
                  <button className="selector-add-btn" onClick={() => openStructureModal('subgroup', selectedGroup)}>+</button>
                )}
              </div>
            )}
          </div>

          {/* Информация о группе */}
          {currentGroup && (
            <div className="schedule-group-info">
              <div className="schedule-group-badge">
                <span className="schedule-group-name">{currentGroup.name}</span>
                {currentGroup.leader?.full_name && (
                  <Badge variant="orange">Староста: {currentGroup.leader.full_name}</Badge>
                )}
                {isGroupLeader && selectedGroup === user.group_id && (
                  <Badge variant="green">Вы староста</Badge>
                )}
                {user.group_id === selectedGroup && !isGroupLeader && (
                  <Badge variant="blue">Моя группа</Badge>
                )}
              </div>
              <div className="schedule-group-path">
                🏛️ {currentGroup.faculty?.name} → 📚 {currentGroup.direction?.name}
              </div>
            </div>
          )}

          {/* Табы дней недели */}
          {selectedGroup && (
            <>
              <FilterTabs tabs={dayTabs} activeTab={activeDay} onChange={setActiveDay} />
              <div className="schedule-day-title">
                {DAYS.find(d => d.id === activeDay)?.name}
                {selectedSubgroup && ` • ${filteredSubgroups.find(s => s.id === selectedSubgroup)?.name}`}
              </div>
            </>
          )}

          {/* Расписание */}
          {!selectedGroup ? (
            <EmptyState 
              icon="📚" 
              title="Выберите группу" 
              text="Выберите факультет, направление и группу для просмотра расписания" 
            />
          ) : loading ? (
            <SkeletonList count={4} />
          ) : daySchedule.length === 0 ? (
            <EmptyState 
              icon="📚" 
              title="Нет занятий" 
              text={canEditSchedule ? 'Добавьте первое занятие' : 'В этот день занятий нет'} 
              action={canEditSchedule && (
                <Button variant="primary" onClick={() => openAddLessonModal()}>+ Добавить</Button>
              )}
            />
          ) : (
            <div className="schedule-list">
              {daySchedule.map((lesson) => (
                <div 
                  key={lesson.id} 
                  className="schedule-item" 
                  onClick={() => canEditSchedule && openEditLessonModal(lesson)}
                >
                  <div className="schedule-time">
                    <span className="schedule-time-start">{formatTime(lesson.start_time)}</span>
                    <span className="schedule-time-end">{formatTime(lesson.end_time)}</span>
                  </div>
                  <div className="schedule-content">
                    <div className="schedule-subject">
                      {getLessonTypeIcon(lesson.lesson_type)} {lesson.subject}
                    </div>
                    <div className="schedule-details">
                      {lesson.teacher && <span>👤 {lesson.teacher}</span>}
                      {lesson.room && <span>🚪 {lesson.room}</span>}
                      <span className="schedule-type-badge">{getLessonTypeLabel(lesson.lesson_type)}</span>
                      {lesson.week_type !== 'all' && (
                        <span className="schedule-type-badge">
                          {lesson.week_type === 'odd' ? 'Нечёт.' : 'Чёт.'}
                        </span>
                      )}
                      {lesson.subgroups?.name && (
                        <span className="schedule-type-badge">{lesson.subgroups.name}</span>
                      )}
                    </div>
                  </div>
                  {canEditSchedule && (
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

      {/* ========== МОДАЛКА ЗАНЯТИЯ ========== */}
      <Modal 
        isOpen={showLessonModal} 
        onClose={() => setShowLessonModal(false)} 
        title={editingLesson ? 'Редактировать занятие' : 'Добавить занятие'} 
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowLessonModal(false)}>Отмена</Button>
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
        <FormField label="Предмет *">
          <Input 
            value={lessonForm.subject} 
            onChange={(e) => setLessonForm(prev => ({ ...prev, subject: e.target.value }))} 
            placeholder="Математический анализ" 
            autoFocus 
          />
        </FormField>
        
        <FormField label="Преподаватель">
          <Input 
            value={lessonForm.teacher} 
            onChange={(e) => setLessonForm(prev => ({ ...prev, teacher: e.target.value }))} 
            placeholder="Иванов И.И." 
          />
        </FormField>
        
        <FormField label="Аудитория">
          <Input 
            value={lessonForm.room} 
            onChange={(e) => setLessonForm(prev => ({ ...prev, room: e.target.value }))} 
            placeholder="101" 
          />
        </FormField>
        
        <FormField label="День недели">
          <select 
            className="form-select" 
            value={lessonForm.day_of_week} 
            onChange={(e) => setLessonForm(prev => ({ ...prev, day_of_week: parseInt(e.target.value) }))}
          >
            {DAYS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </FormField>
        
        <div className="form-row">
          <FormField label="Начало">
            <select 
              className="form-select" 
              value={lessonForm.start_time} 
              onChange={(e) => setLessonForm(prev => ({ ...prev, start_time: e.target.value }))}
            >
              {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </FormField>
          <FormField label="Конец">
            <select 
              className="form-select" 
              value={lessonForm.end_time} 
              onChange={(e) => setLessonForm(prev => ({ ...prev, end_time: e.target.value }))}
            >
              {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </FormField>
        </div>
        
        <FormField label="Тип занятия">
          <select 
            className="form-select" 
            value={lessonForm.lesson_type} 
            onChange={(e) => setLessonForm(prev => ({ ...prev, lesson_type: e.target.value }))}
          >
            {LESSON_TYPES.map(t => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
          </select>
        </FormField>
        
        <FormField label="Неделя">
          <select 
            className="form-select" 
            value={lessonForm.week_type} 
            onChange={(e) => setLessonForm(prev => ({ ...prev, week_type: e.target.value }))}
          >
            {WEEK_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </FormField>

        {/* Для подгруппы */}
        {filteredSubgroups.length > 0 && (
          <>
            <FormField label="Для подгруппы">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Toggle 
                  checked={lessonForm.for_subgroup} 
                  onChange={(val) => setLessonForm(prev => ({ 
                    ...prev, 
                    for_subgroup: val,
                    subgroup_id: val ? filteredSubgroups[0]?.id : null
                  }))} 
                />
                <span>{lessonForm.for_subgroup ? 'Да' : 'Нет (для всей группы)'}</span>
              </div>
            </FormField>
            
            {lessonForm.for_subgroup && (
              <FormField label="Подгруппа">
                <select 
                  className="form-select" 
                  value={lessonForm.subgroup_id || ''} 
                  onChange={(e) => setLessonForm(prev => ({ ...prev, subgroup_id: e.target.value }))}
                >
                  {filteredSubgroups.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </FormField>
            )}
          </>
        )}
      </Modal>

      {/* ========== МОДАЛКА УВЕДОМЛЕНИЯ ========== */}
      <Modal 
        isOpen={showNotificationModal} 
        onClose={() => setShowNotificationModal(false)} 
        title="🔔 Отправить уведомление группе" 
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowNotificationModal(false)}>Отмена</Button>
            <Button 
              variant="primary" 
              onClick={sendNotification} 
              disabled={!notificationForm.title.trim() || !notificationForm.message.trim() || submitting}
            >
              {submitting ? 'Отправка...' : 'Отправить'}
            </Button>
          </>
        }
      >
        <div className="notification-preview-badge">
          Уведомление будет отправлено всем студентам группы {currentGroup?.name}
        </div>
        
        <FormField label="Заголовок *">
          <Input 
            value={notificationForm.title} 
            onChange={(e) => setNotificationForm(prev => ({ ...prev, title: e.target.value }))} 
            placeholder="Важное объявление" 
            autoFocus 
          />
        </FormField>
        
        <FormField label="Сообщение *">
          <Textarea 
            value={notificationForm.message} 
            onChange={(e) => setNotificationForm(prev => ({ ...prev, message: e.target.value }))} 
            placeholder="Текст уведомления для группы..." 
          />
        </FormField>
        
        <FormField label="Важное уведомление">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Toggle 
              checked={notificationForm.is_important} 
              onChange={(val) => setNotificationForm(prev => ({ ...prev, is_important: val }))} 
            />
            <span>{notificationForm.is_important ? '🚨 Важное' : 'Обычное'}</span>
          </div>
        </FormField>
      </Modal>

      {/* ========== МОДАЛКА СТРУКТУРЫ ========== */}
      <Modal 
        isOpen={showStructureModal} 
        onClose={() => setShowStructureModal(false)} 
        title={structureModalTitle} 
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowStructureModal(false)}>Отмена</Button>
            <Button 
              variant="primary" 
              onClick={saveStructure} 
              disabled={!structureForm.name.trim() || submitting}
            >
              {submitting ? 'Создание...' : 'Создать'}
            </Button>
          </>
        }
      >
        <FormField label="Название *">
          <Input 
            value={structureForm.name} 
            onChange={(e) => setStructureForm(prev => ({ ...prev, name: e.target.value }))} 
            placeholder={
              structureModalType === 'faculty' ? 'Факультет информатики' :
              structureModalType === 'direction' ? 'Программная инженерия' :
              structureModalType === 'group' ? 'ПИ-21' : '1 подгруппа'
            }
            autoFocus 
          />
        </FormField>
        
        {(structureModalType === 'faculty' || structureModalType === 'direction') && (
          <FormField label="Код (сокращение)">
            <Input 
              value={structureForm.code} 
              onChange={(e) => setStructureForm(prev => ({ ...prev, code: e.target.value }))} 
              placeholder={structureModalType === 'faculty' ? 'ФИТ' : '09.03.04'} 
            />
          </FormField>
        )}
      </Modal>
    </>
  );
});

export default SchedulePage;
