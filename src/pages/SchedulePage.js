/**
 * SchedulePage — ОБЪЕДИНЁННАЯ СТРАНИЦА
 * 
 * Расписание + Структура университета в одном интерфейсе
 * 
 * Права доступа:
 * - Админ: полный доступ ко всему (структура + расписание всех групп)
 * - Староста: только расписание своей группы
 * - Студент: только просмотр
 */
import React, { useState, useEffect, useCallback, memo, useMemo, useRef } from 'react';
import { supabase, invalidateCache } from '../utils/supabase';
import { haptic } from '../utils/haptic';
import { getLessonTypeName, getWeekTypeName, debounce } from '../utils/helpers';
import { DAYS, TIME_SLOTS, LESSON_TYPES, WEEK_TYPES } from '../utils/constants';
import { useNotification } from '../context/NotificationContext';
import { useApp } from '../context/AppContext';
import { 
  PageHeader, EmptyState, FilterTabs, Button, FormField, Input, Textarea,
  PullToRefresh, SkeletonList, Badge
} from '../components/UI';
import { Modal, ConfirmModal } from '../components/Modal';
import { MobilePageHeader } from '../components/Navigation';
import { 
  IconEdit, IconTrash, IconPlus, IconBuilding, IconBook, 
  IconUsers, IconUser, IconChevronDown, IconChevronRight, IconSearch,
  IconCalendar, IconClock
} from '../components/Icons';

// ========== ГЛАВНЫЙ КОМПОНЕНТ ==========
export const SchedulePage = memo(function SchedulePage() {
  const { user } = useApp();
  const { notify } = useNotification();
  
  // Режим отображения: 'schedule' или 'structure'
  const [viewMode, setViewMode] = useState('schedule');
  
  // Данные
  const [faculties, setFaculties] = useState([]);
  const [directions, setDirections] = useState([]);
  const [groups, setGroups] = useState([]);
  const [subgroups, setSubgroups] = useState([]);
  const [schedules, setSchedules] = useState([]);
  
  // UI состояния
  const [loading, setLoading] = useState(true);
  const [selectedGroupId, setSelectedGroupId] = useState(user.group_id || '');
  const [selectedSubgroupId, setSelectedSubgroupId] = useState(user.subgroup_id || '');
  const [selectedDay, setSelectedDay] = useState(new Date().getDay() || 1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  // Раскрытие структуры
  const [expandedFaculty, setExpandedFaculty] = useState(null);
  const [expandedDirection, setExpandedDirection] = useState(null);
  const [expandedGroup, setExpandedGroup] = useState(null);
  
  // Модалки
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('lesson'); // lesson, faculty, direction, group, subgroup
  const [editing, setEditing] = useState(null);
  const [parentId, setParentId] = useState(null);
  const [parentName, setParentName] = useState('');
  
  // Формы
  const [lessonForm, setLessonForm] = useState({
    subject: '', teacher: '', room: '',
    start_time: '08:30', end_time: '10:00',
    lesson_type: 'lecture', week_type: 'all',
    subgroup_id: '', notes: ''
  });
  
  const [structureForm, setStructureForm] = useState({
    name: '', code: '', description: '',
    course: 1, year: new Date().getFullYear()
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Refs
  const mountedRef = useRef(true);
  const abortControllerRef = useRef(null);

  // ========== ПРАВА ДОСТУПА ==========
  const isAdmin = user.role === 'main_admin';
  const isGroupLeader = user.role === 'group_leader';
  
  // Админ может редактировать структуру
  const canEditStructure = isAdmin;
  
  // Админ или староста своей группы может редактировать расписание
  const canEditSchedule = isAdmin || (isGroupLeader && selectedGroupId === user.group_id);

  // ========== DEBOUNCED SEARCH ==========
  const debouncedSetSearch = useMemo(
    () => debounce((value) => {
      if (mountedRef.current) {
        setDebouncedSearch(value);
      }
    }, 300),
    []
  );

  useEffect(() => {
    debouncedSetSearch(search);
    return () => debouncedSetSearch.cancel?.();
  }, [search, debouncedSetSearch]);

  // ========== ЗАГРУЗКА ДАННЫХ ==========
  const loadData = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    try {
      const [f, d, g, s] = await Promise.all([
        supabase.from('faculties').select('*').order('name'),
        supabase.from('directions').select('*').order('name'),
        supabase.from('study_groups').select('*, directions(name, faculty_id)').order('name'),
        supabase.from('subgroups').select('*').order('name')
      ]);
      
      if (mountedRef.current) {
        setFaculties(f.data || []);
        setDirections(d.data || []);
        setGroups(g.data || []);
        setSubgroups(s.data || []);
        
        // Устанавливаем группу пользователя по умолчанию
        if (!selectedGroupId && user.group_id) {
          setSelectedGroupId(user.group_id);
        }
      }
    } catch (error) {
      if (error.name !== 'AbortError' && mountedRef.current) {
        console.error('Error loading data:', error);
        notify.error('Ошибка загрузки данных');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
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
      if (mountedRef.current) {
        setSchedules(data || []);
      }
    } catch (error) {
      console.error('Error loading schedule:', error);
    }
  }, [selectedGroupId]);

  useEffect(() => {
    mountedRef.current = true;
    loadData();
    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [loadData]);

  useEffect(() => { loadSchedule(); }, [loadSchedule]);

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    await loadData();
    await loadSchedule();
    notify.success('Обновлено');
  }, [loadData, loadSchedule, notify]);

  // ========== ВЫЧИСЛЯЕМЫЕ ДАННЫЕ ==========
  
  // Подгруппы для выбранной группы
  const filteredSubgroups = useMemo(() => 
    subgroups.filter(s => s.group_id === selectedGroupId),
    [subgroups, selectedGroupId]
  );

  // Расписание на выбранный день
  const daySchedule = useMemo(() => {
    let filtered = schedules.filter(s => s.day_of_week === selectedDay);
    
    if (selectedSubgroupId) {
      filtered = filtered.filter(s => 
        s.subgroup_id === null || s.subgroup_id === selectedSubgroupId
      );
    }
    
    return filtered.sort((a, b) => (a.start_time || '00:00').localeCompare(b.start_time || '00:00'));
  }, [schedules, selectedDay, selectedSubgroupId]);

  // Группировка групп по факультетам
  const groupedGroups = useMemo(() => {
    const grouped = {};
    groups.forEach(g => {
      const direction = directions.find(d => d.id === g.direction_id);
      const faculty = faculties.find(f => f.id === direction?.faculty_id);
      const key = faculty?.name || 'Без факультета';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push({ ...g, direction, faculty });
    });
    return grouped;
  }, [groups, directions, faculties]);

  // Информация о выбранной группе
  const selectedGroupInfo = useMemo(() => {
    const group = groups.find(g => g.id === selectedGroupId);
    if (!group) return null;
    
    const direction = directions.find(d => d.id === group.direction_id);
    const faculty = faculties.find(f => f.id === direction?.faculty_id);
    
    return { ...group, directionName: direction?.name, facultyName: faculty?.name };
  }, [selectedGroupId, groups, directions, faculties]);

  // Дерево структуры с фильтрацией
  const facultyTree = useMemo(() => {
    let filtered = faculties;
    
    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      filtered = faculties.filter(f => 
        f.name.toLowerCase().includes(searchLower) || 
        (f.code && f.code.toLowerCase().includes(searchLower))
      );
    }
    
    return filtered.map(faculty => {
      const facultyDirections = directions.filter(d => d.faculty_id === faculty.id);
      
      const directionsWithGroups = facultyDirections.map(direction => {
        const directionGroups = groups.filter(g => g.direction_id === direction.id);
        
        const groupsWithSubgroups = directionGroups.map(group => {
          const groupSubgroups = subgroups.filter(s => s.group_id === group.id);
          return { ...group, subgroups: groupSubgroups };
        });
        
        return { ...direction, groups: groupsWithSubgroups };
      });
      
      return { ...faculty, directions: directionsWithGroups };
    });
  }, [faculties, directions, groups, subgroups, debouncedSearch]);

  // ========== ОБРАБОТЧИКИ МОДАЛОК ==========
  
  // Открыть модалку добавления занятия
  const openAddLessonModal = useCallback(() => {
    setModalType('lesson');
    setEditing(null);
    setLessonForm({
      subject: '', teacher: '', room: '',
      start_time: '08:30', end_time: '10:00',
      lesson_type: 'lecture', week_type: 'all',
      subgroup_id: '', notes: ''
    });
    setShowModal(true);
    haptic.light();
  }, []);

  // Открыть модалку редактирования занятия
  const openEditLessonModal = useCallback((lesson) => {
    setModalType('lesson');
    setEditing(lesson);
    setLessonForm({
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

  // Открыть модалку структуры (факультет/направление/группа/подгруппа)
  const openStructureModal = useCallback((type, parent = null, parentNameStr = '', item = null) => {
    setModalType(type);
    setParentId(parent);
    setParentName(parentNameStr);
    setEditing(item);
    
    if (item) {
      setStructureForm({
        name: item.name || '',
        code: item.code || '',
        description: item.description || '',
        course: item.course || 1,
        year: item.year || new Date().getFullYear()
      });
    } else {
      setStructureForm({
        name: '', code: '', description: '',
        course: 1, year: new Date().getFullYear()
      });
    }
    
    setShowModal(true);
    haptic.light();
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setEditing(null);
    setParentId(null);
    setParentName('');
  }, []);

  // ========== СОХРАНЕНИЕ ==========
  
  // Сохранить занятие
  const saveLesson = useCallback(async () => {
    if (!lessonForm.subject.trim()) {
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
        subject: lessonForm.subject.trim(),
        teacher: lessonForm.teacher.trim() || null,
        room: lessonForm.room.trim() || null,
        start_time: lessonForm.start_time,
        end_time: lessonForm.end_time,
        lesson_type: lessonForm.lesson_type,
        week_type: lessonForm.week_type,
        subgroup_id: lessonForm.subgroup_id || null,
        notes: lessonForm.notes.trim() || null,
        created_by: user.id
      };
      
      if (editing) {
        const { error } = await supabase.from('schedules').update(lessonData).eq('id', editing.id);
        if (error) throw error;
        notify.success('Занятие обновлено');
      } else {
        const { error } = await supabase.from('schedules').insert(lessonData);
        if (error) throw error;
        notify.success('Занятие добавлено');
      }
      
      invalidateCache('schedules');
      closeModal();
      loadSchedule();
      haptic.success();
    } catch (error) {
      console.error('Error saving lesson:', error);
      notify.error('Ошибка сохранения');
      haptic.error();
    } finally {
      setSubmitting(false);
    }
  }, [lessonForm, selectedGroupId, selectedDay, editing, user.id, loadSchedule, notify, closeModal]);

  // Сохранить элемент структуры
  const saveStructure = useCallback(async () => {
    if (!structureForm.name.trim()) {
      notify.error('Введите название');
      return;
    }
    
    setSubmitting(true);
    
    try {
      let result;
      
      if (modalType === 'faculty') {
        const data = { 
          name: structureForm.name.trim(), 
          code: structureForm.code.trim() || null, 
          description: structureForm.description.trim() || null 
        };
        
        if (editing) {
          result = await supabase.from('faculties').update(data).eq('id', editing.id);
          notify.success('Факультет обновлён');
        } else {
          result = await supabase.from('faculties').insert(data);
          notify.success('Факультет создан');
        }
        
      } else if (modalType === 'direction') {
        if (!parentId) { notify.error('Не выбран факультет'); setSubmitting(false); return; }
        
        const data = { 
          name: structureForm.name.trim(), 
          code: structureForm.code.trim() || null, 
          faculty_id: parentId 
        };
        
        if (editing) {
          result = await supabase.from('directions').update(data).eq('id', editing.id);
          notify.success('Направление обновлено');
        } else {
          result = await supabase.from('directions').insert(data);
          notify.success('Направление создано');
        }
        
      } else if (modalType === 'group') {
        if (!parentId) { notify.error('Не выбрано направление'); setSubmitting(false); return; }
        
        const data = { 
          name: structureForm.name.trim(), 
          course: parseInt(structureForm.course) || 1, 
          year: parseInt(structureForm.year) || new Date().getFullYear(),
          direction_id: parentId
        };
        
        if (editing) {
          result = await supabase.from('study_groups').update(data).eq('id', editing.id);
          notify.success('Группа обновлена');
        } else {
          result = await supabase.from('study_groups').insert(data);
          notify.success('Группа создана');
        }
        
      } else if (modalType === 'subgroup') {
        if (!parentId) { notify.error('Не выбрана группа'); setSubmitting(false); return; }
        
        const data = { name: structureForm.name.trim(), group_id: parentId };
        
        if (editing) {
          result = await supabase.from('subgroups').update(data).eq('id', editing.id);
          notify.success('Подгруппа обновлена');
        } else {
          result = await supabase.from('subgroups').insert(data);
          notify.success('Подгруппа создана');
        }
      }
      
      if (result?.error) throw result.error;
      
      invalidateCache('structure');
      closeModal();
      loadData();
      haptic.success();
    } catch (error) {
      console.error('Error saving structure:', error);
      notify.error('Ошибка: ' + (error.message || 'Неизвестная ошибка'));
      haptic.error();
    } finally {
      setSubmitting(false);
    }
  }, [structureForm, modalType, parentId, editing, loadData, notify, closeModal]);

  // ========== УДАЛЕНИЕ ==========
  const requestDelete = useCallback((type, id, name, e) => {
    e?.stopPropagation();
    setDeleteTarget({ type, id, name });
    setShowConfirmDelete(true);
    haptic.light();
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    
    const { type, id } = deleteTarget;
    
    try {
      let error;
      
      if (type === 'lesson') {
        ({ error } = await supabase.from('schedules').delete().eq('id', id));
        invalidateCache('schedules');
        loadSchedule();
      } else if (type === 'faculty') {
        ({ error } = await supabase.from('faculties').delete().eq('id', id));
        invalidateCache('structure');
        loadData();
      } else if (type === 'direction') {
        ({ error } = await supabase.from('directions').delete().eq('id', id));
        invalidateCache('structure');
        loadData();
      } else if (type === 'group') {
        ({ error } = await supabase.from('study_groups').delete().eq('id', id));
        invalidateCache('structure');
        loadData();
      } else if (type === 'subgroup') {
        ({ error } = await supabase.from('subgroups').delete().eq('id', id));
        invalidateCache('structure');
        loadData();
      }
      
      if (error) throw error;
      
      notify.success('Удалено');
      haptic.medium();
    } catch (error) {
      console.error('Error deleting:', error);
      notify.error('Ошибка удаления');
      haptic.error();
    } finally {
      setShowConfirmDelete(false);
      setDeleteTarget(null);
    }
  }, [deleteTarget, loadSchedule, loadData, notify]);

  // ========== TOGGLE HANDLERS ==========
  const handleToggleFaculty = useCallback((id) => {
    haptic.light();
    setExpandedFaculty(prev => prev === id ? null : id);
    setExpandedDirection(null);
    setExpandedGroup(null);
  }, []);

  const handleToggleDirection = useCallback((id) => {
    haptic.light();
    setExpandedDirection(prev => prev === id ? null : id);
    setExpandedGroup(null);
  }, []);

  const handleToggleGroup = useCallback((id) => {
    haptic.light();
    setExpandedGroup(prev => prev === id ? null : id);
  }, []);

  // Выбор группы из структуры
  const handleSelectGroup = useCallback((groupId) => {
    setSelectedGroupId(groupId);
    setSelectedSubgroupId('');
    setViewMode('schedule');
    haptic.medium();
  }, []);

  // ========== TABS ==========
  const dayTabs = useMemo(() => DAYS.map(d => ({ id: d.id, label: d.short })), []);
  const currentDayName = useMemo(() => DAYS.find(d => d.id === selectedDay)?.name || '', [selectedDay]);

  const viewTabs = useMemo(() => [
    { id: 'schedule', label: '📚 Расписание' },
    { id: 'structure', label: '🏛️ Структура' }
  ], []);

  // ========== MODAL TITLE ==========
  const modalTitle = useMemo(() => {
    if (modalType === 'lesson') {
      return editing ? 'Редактировать занятие' : 'Добавить занятие';
    }
    
    const action = editing ? 'Редактировать' : 'Создать';
    const types = { 
      faculty: 'факультет', 
      direction: 'направление', 
      group: 'группу',
      subgroup: 'подгруппу'
    };
    let title = `${action} ${types[modalType] || ''}`;
    if (parentName && !editing) {
      title += ` • ${parentName}`;
    }
    return title;
  }, [modalType, editing, parentName]);

  // ========== RENDER ==========
  return (
    <>
      <PageHeader 
        title="📚 Расписание" 
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            {canEditStructure && viewMode === 'structure' && (
              <Button variant="secondary" onClick={() => openStructureModal('faculty')}>
                <IconPlus size={18} /> Факультет
              </Button>
            )}
            {canEditSchedule && viewMode === 'schedule' && selectedGroupId && (
              <Button variant="primary" onClick={openAddLessonModal}>
                <IconPlus size={18} /> Занятие
              </Button>
            )}
          </div>
        }
      />
      <MobilePageHeader 
        title="Расписание" 
        subtitle={selectedGroupInfo?.name}
        actions={[
          ...(canEditSchedule && viewMode === 'schedule' && selectedGroupId ? 
            [{ icon: 'plus', onClick: openAddLessonModal, primary: true }] : []),
          ...(canEditStructure && viewMode === 'structure' ? 
            [{ icon: 'plus', onClick: () => openStructureModal('faculty'), primary: true }] : [])
        ]}
      />

      <PullToRefresh onRefresh={handleRefresh}>
        <div className="page-content">
          {/* Переключатель режимов */}
          <FilterTabs 
            tabs={viewTabs} 
            activeTab={viewMode} 
            onChange={(mode) => { setViewMode(mode); haptic.light(); }} 
          />

          {/* ========== РЕЖИМ РАСПИСАНИЯ ========== */}
          {viewMode === 'schedule' && (
            <>
              {/* Селекторы группы */}
              <div className="schedule-selectors">
                <select 
                  className="form-select" 
                  value={selectedGroupId} 
                  onChange={(e) => { setSelectedGroupId(e.target.value); setSelectedSubgroupId(''); }}
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
                
                {filteredSubgroups.length > 0 && (
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
                )}
              </div>

              {/* Инфо о группе */}
              {selectedGroupInfo && (
                <div className="schedule-group-info">
                  <div className="schedule-group-badge">
                    <span className="schedule-group-name">{selectedGroupInfo.name}</span>
                    <Badge variant="blue">{selectedGroupInfo.course} курс</Badge>
                    {canEditSchedule && <Badge variant="green">✏️ Редактирование</Badge>}
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
                onChange={(day) => { haptic.light(); setSelectedDay(day); }} 
              />

              <div className="schedule-day-title">{currentDayName}</div>

              {/* Список занятий */}
              {loading ? (
                <SkeletonList count={5} />
              ) : !selectedGroupId ? (
                <EmptyState 
                  icon="📚" 
                  title="Выберите группу" 
                  text="Выберите учебную группу из списка или перейдите в раздел 'Структура'"
                  action={
                    <Button variant="secondary" onClick={() => setViewMode('structure')}>
                      🏛️ Открыть структуру
                    </Button>
                  }
                />
              ) : daySchedule.length === 0 ? (
                <EmptyState 
                  icon="🎉" 
                  title="Нет занятий" 
                  text={`В ${currentDayName.toLowerCase()} нет занятий`}
                  action={canEditSchedule && (
                    <Button variant="primary" onClick={openAddLessonModal}>
                      <IconPlus size={18} /> Добавить занятие
                    </Button>
                  )}
                />
              ) : (
                <div className="schedule-list">
                  {daySchedule.map((lesson) => (
                    <div 
                      key={lesson.id} 
                      className="schedule-item"
                      onClick={canEditSchedule ? () => openEditLessonModal(lesson) : undefined}
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
                          <span className="schedule-type-badge">{getLessonTypeName(lesson.lesson_type)}</span>
                          {lesson.week_type !== 'all' && (
                            <span className="schedule-type-badge">{getWeekTypeName(lesson.week_type)}</span>
                          )}
                          {lesson.subgroups?.name && (
                            <span className="schedule-type-badge">{lesson.subgroups.name}</span>
                          )}
                        </div>
                        {lesson.notes && <div className="schedule-notes">📝 {lesson.notes}</div>}
                      </div>
                      
                      {canEditSchedule && (
                        <button 
                          className="schedule-delete"
                          onClick={(e) => requestDelete('lesson', lesson.id, lesson.subject, e)}
                        >
                          <IconTrash size={18} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ========== РЕЖИМ СТРУКТУРЫ ========== */}
          {viewMode === 'structure' && (
            <>
              {/* Поиск по структуре */}
              <div className="ios-search-container-inline">
                <div className="ios-search-bar">
                  <IconSearch size={18} />
                  <input
                    type="text"
                    className="ios-search-input"
                    placeholder="Поиск по структуре..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  {search && (
                    <button className="ios-search-clear" onClick={() => setSearch('')}>✕</button>
                  )}
                </div>
              </div>

              {loading ? (
                <SkeletonList count={5} />
              ) : facultyTree.length === 0 ? (
                <EmptyState 
                  icon={<IconBuilding size={64} color="var(--text-tertiary)" />}
                  title="Нет факультетов" 
                  text={debouncedSearch ? 'Ничего не найдено' : 'Создайте первый факультет'} 
                  action={canEditStructure && !debouncedSearch && (
                    <Button variant="primary" onClick={() => openStructureModal('faculty')}>
                      <IconPlus size={18} /> Создать факультет
                    </Button>
                  )} 
                />
              ) : (
                <div className="ios-structure-tree">
                  {facultyTree.map((faculty) => (
                    <FacultyCard 
                      key={faculty.id}
                      faculty={faculty}
                      canEditStructure={canEditStructure}
                      isExpanded={expandedFaculty === faculty.id}
                      expandedDirection={expandedDirection}
                      expandedGroup={expandedGroup}
                      onToggle={handleToggleFaculty}
                      onToggleDirection={handleToggleDirection}
                      onToggleGroup={handleToggleGroup}
                      onEdit={openStructureModal}
                      onDelete={requestDelete}
                      onSelectGroup={handleSelectGroup}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </PullToRefresh>

      {/* FAB для мобилки */}
      {((canEditSchedule && viewMode === 'schedule' && selectedGroupId) || 
        (canEditStructure && viewMode === 'structure')) && (
        <button 
          className="ios-fab"
          onClick={viewMode === 'schedule' ? openAddLessonModal : () => openStructureModal('faculty')}
          aria-label={viewMode === 'schedule' ? 'Добавить занятие' : 'Добавить факультет'}
        >
          <IconPlus size={24} color="white" />
        </button>
      )}

      {/* ========== МОДАЛКИ ========== */}
      <Modal 
        isOpen={showModal} 
        onClose={closeModal} 
        title={modalTitle} 
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>Отмена</Button>
            <Button 
              variant="primary" 
              onClick={modalType === 'lesson' ? saveLesson : saveStructure} 
              disabled={submitting || (modalType === 'lesson' ? !lessonForm.subject.trim() : !structureForm.name.trim())}
            >
              {submitting ? 'Сохранение...' : (editing ? 'Сохранить' : 'Создать')}
            </Button>
          </>
        }
      >
        {/* Форма занятия */}
        {modalType === 'lesson' && (
          <>
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
                placeholder="301"
              />
            </FormField>
            
            <div className="form-row">
              <FormField label="Начало">
                <select 
                  className="form-select" 
                  value={lessonForm.start_time} 
                  onChange={(e) => setLessonForm(prev => ({ ...prev, start_time: e.target.value }))}
                >
                  {TIME_SLOTS.map(time => <option key={time} value={time}>{time}</option>)}
                </select>
              </FormField>
              
              <FormField label="Конец">
                <select 
                  className="form-select" 
                  value={lessonForm.end_time} 
                  onChange={(e) => setLessonForm(prev => ({ ...prev, end_time: e.target.value }))}
                >
                  {TIME_SLOTS.map(time => <option key={time} value={time}>{time}</option>)}
                </select>
              </FormField>
            </div>
            
            <FormField label="Тип занятия">
              <select 
                className="form-select" 
                value={lessonForm.lesson_type} 
                onChange={(e) => setLessonForm(prev => ({ ...prev, lesson_type: e.target.value }))}
              >
                {LESSON_TYPES.map(type => (
                  <option key={type.id} value={type.id}>{type.icon} {type.label}</option>
                ))}
              </select>
            </FormField>
            
            <FormField label="Периодичность">
              <select 
                className="form-select" 
                value={lessonForm.week_type} 
                onChange={(e) => setLessonForm(prev => ({ ...prev, week_type: e.target.value }))}
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
                  value={lessonForm.subgroup_id} 
                  onChange={(e) => setLessonForm(prev => ({ ...prev, subgroup_id: e.target.value }))}
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
                value={lessonForm.notes} 
                onChange={(e) => setLessonForm(prev => ({ ...prev, notes: e.target.value }))} 
                placeholder="Дополнительная информация..."
              />
            </FormField>
          </>
        )}

        {/* Форма структуры */}
        {modalType !== 'lesson' && (
          <>
            <FormField label="Название *">
              <Input 
                value={structureForm.name} 
                onChange={(e) => setStructureForm(prev => ({ ...prev, name: e.target.value }))} 
                placeholder={
                  modalType === 'faculty' ? 'Факультет информатики' : 
                  modalType === 'direction' ? 'Программная инженерия' : 
                  modalType === 'group' ? 'ПИ-21' : '1 подгруппа'
                }
                autoFocus 
              />
            </FormField>
            
            {(modalType === 'faculty' || modalType === 'direction') && (
              <FormField label="Код">
                <Input 
                  value={structureForm.code} 
                  onChange={(e) => setStructureForm(prev => ({ ...prev, code: e.target.value }))} 
                  placeholder={modalType === 'faculty' ? 'ФИТ' : '09.03.04'} 
                />
              </FormField>
            )}
            
            {modalType === 'faculty' && (
              <FormField label="Описание">
                <Textarea 
                  value={structureForm.description} 
                  onChange={(e) => setStructureForm(prev => ({ ...prev, description: e.target.value }))} 
                  placeholder="Краткое описание факультета..." 
                />
              </FormField>
            )}
            
            {modalType === 'group' && (
              <>
                <FormField label="Курс">
                  <select 
                    className="form-select" 
                    value={structureForm.course} 
                    onChange={(e) => setStructureForm(prev => ({ ...prev, course: parseInt(e.target.value) }))}
                  >
                    {[1, 2, 3, 4, 5, 6].map(c => (
                      <option key={c} value={c}>{c} курс{c > 4 ? ' (магистратура)' : ''}</option>
                    ))}
                  </select>
                </FormField>
                
                <FormField label="Год набора">
                  <Input 
                    type="number"
                    value={structureForm.year} 
                    onChange={(e) => setStructureForm(prev => ({ ...prev, year: parseInt(e.target.value) }))} 
                  />
                </FormField>
              </>
            )}
          </>
        )}
      </Modal>

      <ConfirmModal
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        onConfirm={confirmDelete}
        title="Удалить?"
        message={`Удалить "${deleteTarget?.name}"? Это действие нельзя отменить.`}
        confirmText="Удалить"
        cancelText="Отмена"
        variant="danger"
      />
    </>
  );
});

// ========== ВСПОМОГАТЕЛЬНЫЕ КОМПОНЕНТЫ ==========

const FacultyCard = memo(function FacultyCard({ 
  faculty, canEditStructure, isExpanded, expandedDirection, expandedGroup,
  onToggle, onToggleDirection, onToggleGroup, onEdit, onDelete, onSelectGroup
}) {
  const hasDirections = faculty.directions.length > 0;
  const totalGroups = faculty.directions.reduce((sum, d) => sum + d.groups.length, 0);

  return (
    <div className="ios-faculty-card">
      <div 
        className="ios-card-header"
        onClick={() => hasDirections && onToggle(faculty.id)}
        role="button"
        tabIndex={hasDirections ? 0 : -1}
      >
        <div className="ios-icon-circle blue-gradient">
          <IconBuilding size={28} color="white" />
        </div>
        
        <div className="ios-card-content">
          <div className="ios-card-title-row">
            <h3 className="ios-card-title">{faculty.name}</h3>
            {faculty.code && <span className="ios-badge blue">{faculty.code}</span>}
          </div>
          
          <div className="ios-card-stats">
            <span className="ios-stat-item"><IconBook size={14} /> {faculty.directions.length} направлений</span>
            <span className="ios-stat-separator">•</span>
            <span className="ios-stat-item"><IconUsers size={14} /> {totalGroups} групп</span>
          </div>
          
          {faculty.description && <p className="ios-card-description">{faculty.description}</p>}
        </div>

        <div className="ios-card-actions">
          {canEditStructure && (
            <>
              <button 
                className="ios-action-btn edit"
                onClick={(e) => { e.stopPropagation(); onEdit('faculty', null, '', faculty); }}
              >
                <IconEdit size={18} />
              </button>
              <button 
                className="ios-action-btn delete"
                onClick={(e) => onDelete('faculty', faculty.id, faculty.name, e)}
              >
                <IconTrash size={18} />
              </button>
            </>
          )}
          
          {hasDirections && (
            <div className="ios-expand-indicator">
              {isExpanded ? <IconChevronDown size={20} /> : <IconChevronRight size={20} />}
            </div>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="ios-card-children">
          {canEditStructure && (
            <button className="ios-add-button" onClick={() => onEdit('direction', faculty.id, faculty.name)}>
              <div className="ios-add-icon"><IconPlus size={16} /></div>
              <span>Добавить направление</span>
            </button>
          )}
          
          {faculty.directions.length === 0 ? (
            <div className="ios-empty-state"><p>Нет направлений</p></div>
          ) : (
            <div className="ios-directions-list">
              {faculty.directions.map((direction) => (
                <DirectionCard
                  key={direction.id}
                  direction={direction}
                  facultyId={faculty.id}
                  facultyName={faculty.name}
                  canEditStructure={canEditStructure}
                  isExpanded={expandedDirection === direction.id}
                  expandedGroup={expandedGroup}
                  onToggle={onToggleDirection}
                  onToggleGroup={onToggleGroup}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onSelectGroup={onSelectGroup}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

const DirectionCard = memo(function DirectionCard({ 
  direction, facultyId, facultyName, canEditStructure, isExpanded, expandedGroup,
  onToggle, onToggleGroup, onEdit, onDelete, onSelectGroup
}) {
  const hasGroups = direction.groups.length > 0;

  return (
    <div className="ios-direction-card">
      <div 
        className="ios-card-header nested"
        onClick={() => hasGroups && onToggle(direction.id)}
        role="button"
        tabIndex={hasGroups ? 0 : -1}
      >
        <div className="ios-icon-circle purple-gradient">
          <IconBook size={22} color="white" />
        </div>
        
        <div className="ios-card-content">
          <div className="ios-card-title-row">
            <h4 className="ios-card-title small">{direction.name}</h4>
            {direction.code && <span className="ios-badge purple">{direction.code}</span>}
          </div>
          
          <div className="ios-card-stats small">
            <span className="ios-stat-item"><IconUsers size={12} /> {direction.groups.length} групп</span>
          </div>
        </div>

        <div className="ios-card-actions compact">
          {canEditStructure && (
            <>
              <button 
                className="ios-action-btn edit small"
                onClick={(e) => { e.stopPropagation(); onEdit('direction', facultyId, facultyName, direction); }}
              >
                <IconEdit size={16} />
              </button>
              <button 
                className="ios-action-btn delete small"
                onClick={(e) => onDelete('direction', direction.id, direction.name, e)}
              >
                <IconTrash size={16} />
              </button>
            </>
          )}
          
          {hasGroups && (
            <div className="ios-expand-indicator small">
              {isExpanded ? <IconChevronDown size={18} /> : <IconChevronRight size={18} />}
            </div>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="ios-card-children nested">
          {canEditStructure && (
            <button className="ios-add-button small" onClick={() => onEdit('group', direction.id, direction.name)}>
              <div className="ios-add-icon small"><IconPlus size={14} /></div>
              <span>Добавить группу</span>
            </button>
          )}
          
          {direction.groups.length === 0 ? (
            <div className="ios-empty-state small"><p>Нет групп</p></div>
          ) : (
            <div className="ios-groups-list">
              {direction.groups.map((group) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  directionId={direction.id}
                  directionName={direction.name}
                  canEditStructure={canEditStructure}
                  isExpanded={expandedGroup === group.id}
                  onToggle={onToggleGroup}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onSelectGroup={onSelectGroup}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

const GroupCard = memo(function GroupCard({ 
  group, directionId, directionName, canEditStructure, isExpanded,
  onToggle, onEdit, onDelete, onSelectGroup
}) {
  const hasSubgroups = group.subgroups.length > 0;

  return (
    <div className="ios-group-card">
      <div 
        className="ios-card-header nested-2"
        onClick={() => hasSubgroups ? onToggle(group.id) : onSelectGroup(group.id)}
        role="button"
        tabIndex={0}
      >
        <div className="ios-icon-circle green-gradient">
          <IconUsers size={18} color="white" />
        </div>
        
        <div className="ios-card-content">
          <div className="ios-card-title-row">
            <h5 className="ios-card-title tiny">{group.name}</h5>
            <div className="ios-badges-row">
              <span className="ios-badge green">{group.course} курс</span>
              {group.year && <span className="ios-badge outline">{group.year}</span>}
            </div>
          </div>
          
          {hasSubgroups && (
            <div className="ios-card-stats tiny">
              <span className="ios-stat-item">{group.subgroups.length} подгрупп</span>
            </div>
          )}
        </div>

        <div className="ios-card-actions compact">
          {/* Кнопка выбора группы для расписания */}
          <button 
            className="ios-action-btn schedule tiny"
            onClick={(e) => { e.stopPropagation(); onSelectGroup(group.id); }}
            title="Открыть расписание"
          >
            <IconCalendar size={14} />
          </button>
          
          {canEditStructure && (
            <>
              <button 
                className="ios-action-btn edit tiny"
                onClick={(e) => { e.stopPropagation(); onEdit('group', directionId, directionName, group); }}
              >
                <IconEdit size={14} />
              </button>
              <button 
                className="ios-action-btn delete tiny"
                onClick={(e) => onDelete('group', group.id, group.name, e)}
              >
                <IconTrash size={14} />
              </button>
            </>
          )}
          
          {hasSubgroups && (
            <div className="ios-expand-indicator tiny">
              {isExpanded ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}
            </div>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="ios-card-children nested-2">
          {canEditStructure && (
            <button className="ios-add-button tiny" onClick={() => onEdit('subgroup', group.id, group.name)}>
              <div className="ios-add-icon tiny"><IconPlus size={12} /></div>
              <span>Добавить подгруппу</span>
            </button>
          )}
          
          {group.subgroups.length === 0 ? (
            <div className="ios-empty-state tiny"><p>Нет подгрупп</p></div>
          ) : (
            <div className="ios-subgroups-list">
              {group.subgroups.map((subgroup) => (
                <SubgroupCard
                  key={subgroup.id}
                  subgroup={subgroup}
                  groupId={group.id}
                  groupName={group.name}
                  canEditStructure={canEditStructure}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

const SubgroupCard = memo(function SubgroupCard({ 
  subgroup, groupId, groupName, canEditStructure, onEdit, onDelete 
}) {
  return (
    <div className="ios-subgroup-card">
      <div className="ios-card-header leaf">
        <div className="ios-icon-circle orange-gradient">
          <IconUser size={14} color="white" />
        </div>
        
        <div className="ios-card-content">
          <h6 className="ios-card-title micro">{subgroup.name}</h6>
        </div>

        {canEditStructure && (
          <div className="ios-card-actions compact">
            <button 
              className="ios-action-btn edit micro"
              onClick={(e) => { e.stopPropagation(); onEdit('subgroup', groupId, groupName, subgroup); }}
            >
              <IconEdit size={12} />
            </button>
            <button 
              className="ios-action-btn delete micro"
              onClick={(e) => onDelete('subgroup', subgroup.id, subgroup.name, e)}
            >
              <IconTrash size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

export default SchedulePage;
