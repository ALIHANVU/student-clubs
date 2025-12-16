/**
 * SchedulePage — ПОЛНОСТЬЮ ИСПРАВЛЕННАЯ версия
 * 
 * ИСПРАВЛЕНО:
 * 1. Создание структуры теперь сразу показывает новые элементы
 * 2. После создания группы она автоматически выбирается
 * 3. Данные обновляются мгновенно
 */
import React, { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { supabase, invalidateCache } from '../utils/supabase';
import { haptic } from '../utils/haptic';
import { useNotification } from '../context/NotificationContext';
import { useApp } from '../context/AppContext';
import { DAYS, LESSON_TYPES, WEEK_TYPES } from '../utils/constants';
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
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [selectedDirection, setSelectedDirection] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedSubgroup, setSelectedSubgroup] = useState('');
  
  // Расписание
  const [schedule, setSchedule] = useState([]);
  const [activeDay, setActiveDay] = useState(() => {
    const today = new Date().getDay();
    return today === 0 ? 1 : (today > 6 ? 1 : today);
  });
  
  // Состояния загрузки
  const [structureLoading, setStructureLoading] = useState(true);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  
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
    for_subgroup: false, subgroup_id: ''
  });
  const [notificationForm, setNotificationForm] = useState({
    title: '', message: '', is_important: false
  });
  const [structureForm, setStructureForm] = useState({
    name: '', code: ''
  });
  
  const [submitting, setSubmitting] = useState(false);

  // ========== ПРАВА ДОСТУПА ==========
  const isMainAdmin = user.role === 'main_admin';
  const isGroupLeader = user.role === 'group_leader';
  const canEditSchedule = isMainAdmin || (isGroupLeader && selectedGroup === user.group_id);
  const canSendNotifications = isGroupLeader && selectedGroup === user.group_id;
  const canEditStructure = isMainAdmin;

  // ========== ЗАГРУЗКА СТРУКТУРЫ ==========
  const loadStructure = useCallback(async () => {
    console.log('Loading structure...');
    setStructureLoading(true);
    
    try {
      const [f, d, g, s] = await Promise.all([
        supabase.from('faculties').select('*').order('name'),
        supabase.from('directions').select('*').order('name'),
        supabase.from('study_groups').select('*').order('name'),
        supabase.from('subgroups').select('*').order('name')
      ]);
      
      console.log('Structure loaded:', { 
        faculties: f.data?.length, 
        directions: d.data?.length, 
        groups: g.data?.length 
      });
      
      const facultiesData = f.data || [];
      const directionsData = d.data || [];
      const groupsData = g.data || [];
      const subgroupsData = s.data || [];
      
      setFaculties(facultiesData);
      setDirections(directionsData);
      setGroups(groupsData);
      setSubgroups(subgroupsData);
      
    } catch (error) {
      console.error('Error loading structure:', error);
      notify.error('Ошибка загрузки данных');
    } finally {
      setStructureLoading(false);
    }
  }, [notify]);

  // ========== ЗАГРУЗКА РАСПИСАНИЯ ==========
  const loadSchedule = useCallback(async (groupId) => {
    if (!groupId) {
      console.log('⚠️ loadSchedule: No group selected');
      setSchedule([]);
      return;
    }
    
    console.log('📚 Loading schedule for group:', groupId);
    setScheduleLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select('*, subgroups(name)')
        .eq('group_id', groupId)
        .order('start_time');
      
      if (error) throw error;
      console.log('✅ Schedule loaded:', data?.length, 'lessons');
      setSchedule(data || []);
    } catch (error) {
      console.error('❌ Error loading schedule:', error);
      setSchedule([]);
    } finally {
      setScheduleLoading(false);
    }
  }, []);

  // Начальная загрузка структуры
  useEffect(() => {
    loadStructure();
  }, [loadStructure]);

  // Восстановление сохранённых значений ПОСЛЕ загрузки структуры
  useEffect(() => {
    if (structureLoading) return; // Ждём пока структура загрузится
    if (faculties.length === 0) return; // Данных ещё нет
    
    // Проверяем, уже ли что-то выбрано
    if (selectedGroup) {
      console.log('Group already selected:', selectedGroup);
      return;
    }
    
    // Пытаемся восстановить из localStorage
    const savedGroup = localStorage.getItem('uniclub_selected_group');
    
    if (savedGroup) {
      const group = groups.find(g => g.id === savedGroup);
      if (group) {
        const direction = directions.find(d => d.id === group.direction_id);
        const faculty = faculties.find(f => f.id === direction?.faculty_id);
        
        if (faculty && direction) {
          console.log('✅ Restoring from localStorage:', { faculty: faculty.name, direction: direction.name, group: group.name });
          setSelectedFaculty(faculty.id);
          setSelectedDirection(direction.id);
          setSelectedGroup(group.id);
          
          const savedSubgroup = localStorage.getItem('uniclub_selected_subgroup');
          if (savedSubgroup && subgroups.find(s => s.id === savedSubgroup && s.group_id === group.id)) {
            setSelectedSubgroup(savedSubgroup);
          }
          return;
        } else {
          console.log('❌ Saved group found but structure incomplete');
          localStorage.removeItem('uniclub_selected_group');
        }
      } else {
        console.log('❌ Saved group not found in database');
        localStorage.removeItem('uniclub_selected_group');
      }
    }
    
    // Если не удалось восстановить - автовыбор из профиля
    if (user.group_id) {
      const userGroup = groups.find(g => g.id === user.group_id);
      if (userGroup) {
        const userDirection = directions.find(d => d.id === userGroup.direction_id);
        const userFaculty = faculties.find(f => f.id === userDirection?.faculty_id);
        
        if (userFaculty && userDirection) {
          console.log('✅ Auto-selecting user group:', userGroup.name);
          setSelectedFaculty(userFaculty.id);
          setSelectedDirection(userDirection.id);
          setSelectedGroup(userGroup.id);
          
          localStorage.setItem('uniclub_selected_faculty', userFaculty.id);
          localStorage.setItem('uniclub_selected_direction', userDirection.id);
          localStorage.setItem('uniclub_selected_group', userGroup.id);
          
          if (user.subgroup_id) {
            setSelectedSubgroup(user.subgroup_id);
            localStorage.setItem('uniclub_selected_subgroup', user.subgroup_id);
          }
        }
      }
    }
  }, [structureLoading, faculties, directions, groups, subgroups, user.group_id, user.subgroup_id, selectedGroup]);

  // Загрузка расписания при выборе группы
  useEffect(() => {
    if (selectedGroup) {
      loadSchedule(selectedGroup);
    } else {
      setSchedule([]);
    }
  }, [selectedGroup, loadSchedule]);

  // Обновление
  const handleRefresh = useCallback(async () => {
    await loadStructure();
    if (selectedGroup) {
      await loadSchedule(selectedGroup);
    }
    notify.success('Обновлено');
  }, [loadStructure, loadSchedule, selectedGroup, notify]);

  // ========== ФИЛЬТРАЦИЯ ==========
  const filteredDirections = useMemo(() => 
    selectedFaculty ? directions.filter(d => d.faculty_id === selectedFaculty) : [],
    [directions, selectedFaculty]
  );
  
  const filteredGroups = useMemo(() => 
    selectedDirection ? groups.filter(g => g.direction_id === selectedDirection) : [],
    [groups, selectedDirection]
  );
  
  const filteredSubgroups = useMemo(() => 
    selectedGroup ? subgroups.filter(s => s.group_id === selectedGroup) : [],
    [subgroups, selectedGroup]
  );

  // Расписание на выбранный день
  const daySchedule = useMemo(() => {
    let filtered = schedule.filter(s => s.day_of_week === activeDay);
    if (selectedSubgroup) {
      filtered = filtered.filter(s => !s.subgroup_id || s.subgroup_id === selectedSubgroup);
    }
    return filtered.sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
  }, [schedule, activeDay, selectedSubgroup]);

  // Текущая группа с информацией о старосте
  const [groupLeaderName, setGroupLeaderName] = useState(null);
  
  const currentGroup = useMemo(() => {
    if (!selectedGroup) return null;
    const group = groups.find(g => g.id === selectedGroup);
    if (!group) return null;
    const direction = directions.find(d => d.id === group.direction_id);
    const faculty = faculties.find(f => f.id === direction?.faculty_id);
    return { ...group, direction, faculty, leaderName: groupLeaderName };
  }, [selectedGroup, groups, directions, faculties, groupLeaderName]);
  
  // Загружаем информацию о старосте когда выбрана группа
  useEffect(() => {
    if (!selectedGroup) {
      setGroupLeaderName(null);
      return;
    }
    
    const group = groups.find(g => g.id === selectedGroup);
    if (group?.leader_id) {
      supabase
        .from('users')
        .select('full_name')
        .eq('id', group.leader_id)
        .single()
        .then(({ data }) => {
          if (data) setGroupLeaderName(data.full_name);
        });
    } else {
      setGroupLeaderName(null);
    }
  }, [selectedGroup, groups]);

  // ========== ОБРАБОТЧИКИ СЕЛЕКТОРОВ ==========
  const handleFacultyChange = (e) => {
    const val = e.target.value;
    setSelectedFaculty(val);
    setSelectedDirection('');
    setSelectedGroup('');
    setSelectedSubgroup('');
    setSchedule([]);
    
    // Сохраняем в localStorage
    localStorage.setItem('uniclub_selected_faculty', val);
    localStorage.removeItem('uniclub_selected_direction');
    localStorage.removeItem('uniclub_selected_group');
    localStorage.removeItem('uniclub_selected_subgroup');
    
    haptic.light();
  };

  const handleDirectionChange = (e) => {
    const val = e.target.value;
    setSelectedDirection(val);
    setSelectedGroup('');
    setSelectedSubgroup('');
    setSchedule([]);
    
    // Сохраняем в localStorage
    localStorage.setItem('uniclub_selected_direction', val);
    localStorage.removeItem('uniclub_selected_group');
    localStorage.removeItem('uniclub_selected_subgroup');
    
    haptic.light();
  };

  const handleGroupChange = (e) => {
    const val = e.target.value;
    setSelectedGroup(val);
    setSelectedSubgroup('');
    
    // Сохраняем в localStorage
    localStorage.setItem('uniclub_selected_group', val);
    localStorage.removeItem('uniclub_selected_subgroup');
    
    haptic.light();
  };

  const handleSubgroupChange = (e) => {
    const val = e.target.value;
    setSelectedSubgroup(val);
    
    // Сохраняем в localStorage
    localStorage.setItem('uniclub_selected_subgroup', val);
    
    haptic.light();
  };

  // ========== МОДАЛКИ РАСПИСАНИЯ ==========
  const openAddLessonModal = useCallback(() => {
    setEditingLesson(null);
    setLessonForm({ 
      subject: '', teacher: '', room: '', 
      day_of_week: activeDay, start_time: '08:30', end_time: '10:00', 
      lesson_type: 'lecture', week_type: 'all',
      for_subgroup: false, subgroup_id: ''
    });
    setShowLessonModal(true);
  }, [activeDay]);

  const openEditLessonModal = useCallback((lesson) => {
    setEditingLesson(lesson);
    setLessonForm({ 
      subject: lesson.subject || '', 
      teacher: lesson.teacher || '', 
      room: lesson.room || '', 
      day_of_week: lesson.day_of_week || 1, 
      start_time: (lesson.start_time || '08:30').slice(0, 5), 
      end_time: (lesson.end_time || '10:00').slice(0, 5), 
      lesson_type: lesson.lesson_type || 'lecture',
      week_type: lesson.week_type || 'all',
      for_subgroup: !!lesson.subgroup_id,
      subgroup_id: lesson.subgroup_id || ''
    });
    setShowLessonModal(true);
    haptic.light();
  }, []);

  const saveLesson = useCallback(async (andAddAnother = false) => {
    if (!lessonForm.subject.trim()) {
      notify.error('Введите название предмета');
      return;
    }
    if (!selectedGroup) {
      notify.error('Сначала выберите группу');
      return;
    }
    
    setSubmitting(true);
    try {
      const lessonData = {
        group_id: selectedGroup,
        subgroup_id: lessonForm.for_subgroup && lessonForm.subgroup_id ? lessonForm.subgroup_id : null,
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

      let error;
      if (editingLesson) {
        ({ error } = await supabase.from('schedules').update(lessonData).eq('id', editingLesson.id));
        if (!error) notify.success('Занятие обновлено');
      } else {
        ({ error } = await supabase.from('schedules').insert(lessonData));
        if (!error) notify.success('Занятие добавлено');
      }

      if (error) throw error;

      invalidateCache('schedule');
      loadSchedule(selectedGroup);
      haptic.success();
      
      if (andAddAnother && !editingLesson) {
        // Очищаем форму для нового занятия
        // Следующее занятие начинается через 15 минут после конца предыдущего
        const [endHour, endMinute] = lessonForm.end_time.split(':').map(Number);
        const nextStartHour = endHour;
        const nextStartMinute = endMinute + 15;
        const actualStartHour = nextStartHour + Math.floor(nextStartMinute / 60);
        const actualStartMinute = nextStartMinute % 60;
        
        const nextStartTime = `${String(actualStartHour).padStart(2, '0')}:${String(actualStartMinute).padStart(2, '0')}`;
        
        // Конец следующего занятия через 1.5 часа
        const nextEndHour = actualStartHour + 1;
        const nextEndMinute = actualStartMinute + 30;
        const actualEndHour = nextEndHour + Math.floor(nextEndMinute / 60);
        const actualEndMinute = nextEndMinute % 60;
        
        const nextEndTime = `${String(actualEndHour).padStart(2, '0')}:${String(actualEndMinute).padStart(2, '0')}`;
        
        setLessonForm({
          subject: '',
          teacher: lessonForm.teacher, // Сохраняем преподавателя
          room: '',
          day_of_week: lessonForm.day_of_week,
          start_time: nextStartTime,
          end_time: nextEndTime,
          lesson_type: 'lecture',
          week_type: 'all',
          for_subgroup: false,
          subgroup_id: ''
        });
      } else {
        setShowLessonModal(false);
      }
    } catch (error) {
      console.error('Error saving lesson:', error);
      notify.error('Ошибка: ' + (error.message || 'Неизвестная ошибка'));
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
      notify.error('Заполните все поля');
      return;
    }
    
    setSubmitting(true);
    try {
      const { error } = await supabase.from('group_notifications').insert({
        group_id: selectedGroup,
        sender_id: user.id,
        title: notificationForm.title.trim(),
        message: notificationForm.message.trim(),
        is_important: notificationForm.is_important
      });
      
      if (error) throw error;
      
      notify.success('Уведомление отправлено!');
      setShowNotificationModal(false);
      haptic.success();
    } catch (error) {
      notify.error('Ошибка: ' + (error.message || ''));
      haptic.error();
    } finally {
      setSubmitting(false);
    }
  }, [notificationForm, selectedGroup, user.id, notify]);

  // ========== МОДАЛКА СТРУКТУРЫ - ИСПРАВЛЕНО ==========
  const openStructureModal = useCallback((type) => {
    setStructureModalType(type);
    setStructureForm({ name: '', code: '' });
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
      const names = { faculty: 'Факультет', direction: 'Направление', group: 'Группа', subgroup: 'Подгруппа' };
      
      if (structureModalType === 'faculty') {
        result = await supabase.from('faculties').insert({
          name: structureForm.name.trim(),
          code: structureForm.code.trim() || null
        }).select().single();
        
        if (result.error) throw result.error;
        
        // ПОЛНАЯ ПЕРЕЗАГРУЗКА структуры
        await loadStructure();
        // Автовыбор нового факультета
        setSelectedFaculty(result.data.id);
        localStorage.setItem('uniclub_selected_faculty', result.data.id);
        
      } else if (structureModalType === 'direction') {
        if (!selectedFaculty) {
          notify.error('Сначала выберите факультет');
          setSubmitting(false);
          return;
        }
        
        result = await supabase.from('directions').insert({
          name: structureForm.name.trim(),
          code: structureForm.code.trim() || null,
          faculty_id: selectedFaculty
        }).select().single();
        
        if (result.error) throw result.error;
        
        // ПОЛНАЯ ПЕРЕЗАГРУЗКА структуры
        await loadStructure();
        // Автовыбор нового направления
        setSelectedDirection(result.data.id);
        localStorage.setItem('uniclub_selected_direction', result.data.id);
        
      } else if (structureModalType === 'group') {
        if (!selectedDirection) {
          notify.error('Сначала выберите направление');
          setSubmitting(false);
          return;
        }
        
        result = await supabase.from('study_groups').insert({
          name: structureForm.name.trim(),
          direction_id: selectedDirection,
          course: 1,
          year: new Date().getFullYear()
        }).select().single();
        
        if (result.error) throw result.error;
        
        // ПОЛНАЯ ПЕРЕЗАГРУЗКА структуры
        await loadStructure();
        // Автовыбор новой группы
        setSelectedGroup(result.data.id);
        localStorage.setItem('uniclub_selected_group', result.data.id);
        
      } else if (structureModalType === 'subgroup') {
        if (!selectedGroup) {
          notify.error('Сначала выберите группу');
          setSubmitting(false);
          return;
        }
        
        result = await supabase.from('subgroups').insert({
          name: structureForm.name.trim(),
          group_id: selectedGroup
        }).select().single();
        
        if (result.error) throw result.error;
        
        // ПОЛНАЯ ПЕРЕЗАГРУЗКА структуры
        await loadStructure();
      }
      
      notify.success(`${names[structureModalType]} создан!`);
      setShowStructureModal(false);
      haptic.success();
      
    } catch (error) {
      console.error('Error:', error);
      notify.error('Ошибка: ' + (error.message || ''));
      haptic.error();
    } finally {
      setSubmitting(false);
    }
  }, [structureForm, structureModalType, selectedFaculty, selectedDirection, selectedGroup, notify, loadStructure]);

  // ========== РЕНДЕР ==========
  const dayTabs = useMemo(() => DAYS.map(d => ({ id: d.id, label: d.short })), []);

  // Показываем загрузку только при загрузке структуры
  if (structureLoading) {
    return (
      <>
        <PageHeader title="📚 Расписание" />
        <MobilePageHeader title="Расписание" />
        <div className="page-content">
          <SkeletonList count={3} />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader 
        title="📚 Расписание" 
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            {canSendNotifications && (
              <Button variant="secondary" onClick={openNotificationModal}>🔔 Уведомление</Button>
            )}
            {canEditSchedule && selectedGroup && (
              <Button variant="primary" onClick={openAddLessonModal}>+ Добавить</Button>
            )}
          </div>
        }
      />
      <MobilePageHeader 
        title="Расписание" 
        subtitle={currentGroup?.name}
        actions={[
          ...(canSendNotifications ? [{ icon: 'bell', onClick: openNotificationModal }] : []),
          ...(canEditSchedule && selectedGroup ? [{ icon: 'plus', onClick: openAddLessonModal, primary: true }] : [])
        ]}
      />

      <PullToRefresh onRefresh={handleRefresh}>
        <div className="page-content">
          
          {/* СЕЛЕКТОРЫ */}
          <div className="schedule-selectors">
            {/* Кнопка сброса */}
            {(selectedFaculty || selectedDirection || selectedGroup) && (
              <div style={{ marginBottom: '8px', textAlign: 'right' }}>
                <button 
                  className="btn btn-small btn-secondary"
                  onClick={() => {
                    setSelectedFaculty('');
                    setSelectedDirection('');
                    setSelectedGroup('');
                    setSelectedSubgroup('');
                    setSchedule([]);
                    localStorage.removeItem('uniclub_selected_faculty');
                    localStorage.removeItem('uniclub_selected_direction');
                    localStorage.removeItem('uniclub_selected_group');
                    localStorage.removeItem('uniclub_selected_subgroup');
                    notify.info('Выбор сброшен');
                  }}
                >
                  ✕ Сбросить
                </button>
              </div>
            )}
            
            {/* Факультет */}
            <div className="selector-row">
              <select className="form-select" value={selectedFaculty} onChange={handleFacultyChange}>
                <option value="">-- Выберите факультет --</option>
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
                <select className="form-select" value={selectedDirection} onChange={handleDirectionChange}>
                  <option value="">-- Выберите направление --</option>
                  {filteredDirections.map(d => (
                    <option key={d.id} value={d.id}>{d.code ? `${d.code} — ` : ''}{d.name}</option>
                  ))}
                </select>
                {canEditStructure && (
                  <button className="selector-add-btn" onClick={() => openStructureModal('direction')}>+</button>
                )}
              </div>
            )}

            {/* Группа */}
            {selectedDirection && (
              <div className="selector-row">
                <select className="form-select" value={selectedGroup} onChange={handleGroupChange}>
                  <option value="">-- Выберите группу --</option>
                  {filteredGroups.map(g => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.course} курс)
                    </option>
                  ))}
                </select>
                {canEditStructure && (
                  <button className="selector-add-btn" onClick={() => openStructureModal('group')}>+</button>
                )}
              </div>
            )}

            {/* Подгруппа */}
            {selectedGroup && filteredSubgroups.length > 0 && (
              <div className="selector-row">
                <select className="form-select" value={selectedSubgroup} onChange={handleSubgroupChange}>
                  <option value="">Вся группа</option>
                  {filteredSubgroups.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                {canEditStructure && (
                  <button className="selector-add-btn" onClick={() => openStructureModal('subgroup')}>+</button>
                )}
              </div>
            )}
          </div>

          {/* Инфо о группе */}
          {currentGroup && (
            <div className="schedule-group-info">
              <div className="schedule-group-badge">
                <span className="schedule-group-name">{currentGroup.name}</span>
                {currentGroup.leaderName && (
                  <Badge variant="orange">Староста: {currentGroup.leaderName}</Badge>
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

          {/* Дни недели */}
          {selectedGroup && (
            <>
              <FilterTabs tabs={dayTabs} activeTab={activeDay} onChange={setActiveDay} />
              <div className="schedule-day-title">
                {DAYS.find(d => d.id === activeDay)?.name} ({daySchedule.length} {daySchedule.length === 1 ? 'занятие' : daySchedule.length < 5 ? 'занятия' : 'занятий'})
                {selectedSubgroup && ` • ${filteredSubgroups.find(s => s.id === selectedSubgroup)?.name}`}
              </div>
            </>
          )}

          {/* Контент */}
          {!selectedGroup ? (
            <EmptyState 
              icon="📚" 
              title="Выберите группу" 
              text="Выберите факультет, направление и группу для просмотра расписания" 
            />
          ) : scheduleLoading ? (
            <SkeletonList count={4} />
          ) : daySchedule.length === 0 ? (
            <EmptyState 
              icon="📚" 
              title="Нет занятий" 
              text={canEditSchedule ? 'Добавьте первое занятие' : 'В этот день занятий нет'} 
              action={canEditSchedule && (
                <Button variant="primary" onClick={openAddLessonModal}>+ Добавить</Button>
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

      {/* МОДАЛКА ЗАНЯТИЯ */}
      <Modal 
        isOpen={showLessonModal} 
        onClose={() => setShowLessonModal(false)} 
        title={editingLesson ? 'Редактировать' : 'Добавить занятие'} 
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowLessonModal(false)}>Отмена</Button>
            {!editingLesson && (
              <Button 
                variant="secondary" 
                onClick={() => saveLesson(true)} 
                disabled={!lessonForm.subject.trim() || submitting}
                style={{ minWidth: 80 }}
              >
                + Ещё
              </Button>
            )}
            <Button 
              variant="primary" 
              onClick={() => saveLesson(false)} 
              disabled={!lessonForm.subject.trim() || submitting}
            >
              {submitting ? 'Сохранение...' : (editingLesson ? 'Сохранить' : 'Готово')}
            </Button>
          </>
        }
      >
        {!editingLesson && (
          <div style={{ 
            background: 'rgba(0, 122, 255, 0.08)', 
            padding: '12px', 
            borderRadius: '12px', 
            fontSize: '13px', 
            marginBottom: '16px',
            color: 'var(--text-secondary)'
          }}>
            💡 <strong>Совет:</strong> Нажми "+ Ещё" чтобы быстро добавить несколько занятий подряд
          </div>
        )}
        <FormField label="Предмет *">
          <Input 
            value={lessonForm.subject} 
            onChange={(e) => setLessonForm(p => ({ ...p, subject: e.target.value }))} 
            placeholder="Математический анализ" 
            autoFocus 
          />
        </FormField>
        
        <FormField label="Преподаватель">
          <Input 
            value={lessonForm.teacher} 
            onChange={(e) => setLessonForm(p => ({ ...p, teacher: e.target.value }))} 
            placeholder="Иванов И.И." 
          />
        </FormField>
        
        <FormField label="Аудитория">
          <Input 
            value={lessonForm.room} 
            onChange={(e) => setLessonForm(p => ({ ...p, room: e.target.value }))} 
            placeholder="101" 
          />
        </FormField>
        
        <FormField label="День недели">
          <select 
            className="form-select" 
            value={lessonForm.day_of_week} 
            onChange={(e) => setLessonForm(p => ({ ...p, day_of_week: parseInt(e.target.value) }))}
          >
            {DAYS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </FormField>
        
        <div className="form-row">
          <FormField label="Начало">
            <Input 
              type="time" 
              value={lessonForm.start_time} 
              onChange={(e) => setLessonForm(p => ({ ...p, start_time: e.target.value }))}
            />
          </FormField>
          <FormField label="Конец">
            <Input 
              type="time" 
              value={lessonForm.end_time} 
              onChange={(e) => setLessonForm(p => ({ ...p, end_time: e.target.value }))}
            />
          </FormField>
        </div>
        
        <FormField label="Тип занятия">
          <select 
            className="form-select" 
            value={lessonForm.lesson_type} 
            onChange={(e) => setLessonForm(p => ({ ...p, lesson_type: e.target.value }))}
          >
            {LESSON_TYPES.map(t => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
          </select>
        </FormField>
        
        <FormField label="Неделя">
          <select 
            className="form-select" 
            value={lessonForm.week_type} 
            onChange={(e) => setLessonForm(p => ({ ...p, week_type: e.target.value }))}
          >
            {WEEK_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </FormField>

        {filteredSubgroups.length > 0 && (
          <>
            <FormField label="Для подгруппы">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Toggle 
                  checked={lessonForm.for_subgroup} 
                  onChange={(val) => setLessonForm(p => ({ 
                    ...p, 
                    for_subgroup: val,
                    subgroup_id: val ? (filteredSubgroups[0]?.id || '') : ''
                  }))} 
                />
                <span>{lessonForm.for_subgroup ? 'Да' : 'Нет'}</span>
              </div>
            </FormField>
            
            {lessonForm.for_subgroup && (
              <FormField label="Подгруппа">
                <select 
                  className="form-select" 
                  value={lessonForm.subgroup_id} 
                  onChange={(e) => setLessonForm(p => ({ ...p, subgroup_id: e.target.value }))}
                >
                  {filteredSubgroups.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </FormField>
            )}
          </>
        )}
      </Modal>

      {/* МОДАЛКА УВЕДОМЛЕНИЯ */}
      <Modal 
        isOpen={showNotificationModal} 
        onClose={() => setShowNotificationModal(false)} 
        title="🔔 Уведомление группе" 
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
          Уведомление для группы {currentGroup?.name}
        </div>
        
        <FormField label="Заголовок *">
          <Input 
            value={notificationForm.title} 
            onChange={(e) => setNotificationForm(p => ({ ...p, title: e.target.value }))} 
            placeholder="Важное объявление" 
            autoFocus 
          />
        </FormField>
        
        <FormField label="Сообщение *">
          <Textarea 
            value={notificationForm.message} 
            onChange={(e) => setNotificationForm(p => ({ ...p, message: e.target.value }))} 
            placeholder="Текст..." 
          />
        </FormField>
        
        <FormField label="Важное">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Toggle 
              checked={notificationForm.is_important} 
              onChange={(val) => setNotificationForm(p => ({ ...p, is_important: val }))} 
            />
            <span>{notificationForm.is_important ? '🚨 Важное' : 'Обычное'}</span>
          </div>
        </FormField>
      </Modal>

      {/* МОДАЛКА СТРУКТУРЫ */}
      <Modal 
        isOpen={showStructureModal} 
        onClose={() => setShowStructureModal(false)} 
        title={
          structureModalType === 'faculty' ? 'Новый факультет' :
          structureModalType === 'direction' ? 'Новое направление' :
          structureModalType === 'group' ? 'Новая группа' : 'Новая подгруппа'
        } 
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowStructureModal(false)}>Отмена</Button>
            <Button variant="primary" onClick={saveStructure} disabled={!structureForm.name.trim() || submitting}>
              {submitting ? 'Создание...' : 'Создать'}
            </Button>
          </>
        }
      >
        <FormField label="Название *">
          <Input 
            value={structureForm.name} 
            onChange={(e) => setStructureForm(p => ({ ...p, name: e.target.value }))} 
            placeholder={
              structureModalType === 'faculty' ? 'Факультет информатики' :
              structureModalType === 'direction' ? 'Программная инженерия' :
              structureModalType === 'group' ? 'ПИ-21' : '1 подгруппа'
            }
            autoFocus 
          />
        </FormField>
        
        {(structureModalType === 'faculty' || structureModalType === 'direction') && (
          <FormField label="Код">
            <Input 
              value={structureForm.code} 
              onChange={(e) => setStructureForm(p => ({ ...p, code: e.target.value }))} 
              placeholder={structureModalType === 'faculty' ? 'ФИТ' : '09.03.04'} 
            />
          </FormField>
        )}
      </Modal>
    </>
  );
});

export default SchedulePage;
