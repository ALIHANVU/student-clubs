/**
 * SchedulePage — СУПЕР-ОПТИМИЗИРОВАННАЯ ВЕРСИЯ
 * 
 * Исправлены проблемы:
 * 1. Убраны лишние ре-рендеры через правильную мемоизацию
 * 2. Состояние раскрытия хранится в Set (быстрее чем сравнение строк)
 * 3. Компоненты карточек вынесены и мемоизированы
 * 4. Добавлен React.memo с кастомным comparator
 * 5. CSS анимации оптимизированы через will-change и transform
 * 6. Убрана пересборка дерева при каждом клике
 */
import React, { useState, useEffect, useCallback, memo, useMemo, useRef } from 'react';
import { supabase, invalidateCache } from '../utils/supabase';
import { haptic } from '../utils/haptic';
import { getLessonTypeName, getWeekTypeName } from '../utils/helpers';
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
  IconCalendar
} from '../components/Icons';

// ========== КОНСТАНТЫ ==========

const INITIAL_LESSON_FORM = {
  subject: '', teacher: '', room: '',
  start_time: '08:30', end_time: '10:00',
  lesson_type: 'lecture', week_type: 'all',
  subgroup_id: '', notes: ''
};

const INITIAL_STRUCTURE_FORM = {
  name: '', code: '', description: '',
  course: 1, year: new Date().getFullYear()
};

// ========== ОПТИМИЗИРОВАННЫЕ КОМПОНЕНТЫ СТРУКТУРЫ ==========

// Subgroup — самый простой, просто мемоизируем
const SubgroupCard = memo(function SubgroupCard({ 
  subgroup, groupId, groupName, canEditStructure, onEdit, onDelete 
}) {
  const handleEdit = useCallback((e) => {
    e.stopPropagation();
    onEdit('subgroup', groupId, groupName, subgroup);
  }, [subgroup, groupId, groupName, onEdit]);

  const handleDelete = useCallback((e) => {
    e.stopPropagation();
    onDelete('subgroup', subgroup.id, subgroup.name, e);
  }, [subgroup.id, subgroup.name, onDelete]);

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
            <button className="ios-action-btn edit micro" onClick={handleEdit}>
              <IconEdit size={12} />
            </button>
            <button className="ios-action-btn delete micro" onClick={handleDelete}>
              <IconTrash size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}, (prev, next) => {
  // Кастомный comparator — перерендерим только если реально что-то изменилось
  return prev.subgroup.id === next.subgroup.id &&
         prev.subgroup.name === next.subgroup.name &&
         prev.canEditStructure === next.canEditStructure;
});

// Group Card — с кастомным comparator
const GroupCard = memo(function GroupCard({ 
  group, directionId, directionName, canEditStructure, isExpanded,
  onToggle, onEdit, onDelete, onSelectGroup
}) {
  const hasSubgroups = group.subgroups && group.subgroups.length > 0;

  const handleToggle = useCallback(() => {
    if (hasSubgroups) {
      onToggle(group.id);
    } else {
      onSelectGroup(group.id);
    }
  }, [hasSubgroups, group.id, onToggle, onSelectGroup]);

  const handleSelectGroup = useCallback((e) => {
    e.stopPropagation();
    onSelectGroup(group.id);
  }, [group.id, onSelectGroup]);

  const handleEdit = useCallback((e) => {
    e.stopPropagation();
    onEdit('group', directionId, directionName, group);
  }, [group, directionId, directionName, onEdit]);

  const handleDelete = useCallback((e) => {
    e.stopPropagation();
    onDelete('group', group.id, group.name, e);
  }, [group.id, group.name, onDelete]);

  const handleAddSubgroup = useCallback(() => {
    onEdit('subgroup', group.id, group.name);
  }, [group.id, group.name, onEdit]);

  return (
    <div className="ios-group-card">
      <div 
        className="ios-card-header nested-2" 
        onClick={handleToggle} 
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
          <button 
            className="ios-action-btn schedule tiny" 
            onClick={handleSelectGroup} 
            title="Открыть расписание"
          >
            <IconCalendar size={14} />
          </button>
          {canEditStructure && (
            <>
              <button className="ios-action-btn edit tiny" onClick={handleEdit}>
                <IconEdit size={14} />
              </button>
              <button className="ios-action-btn delete tiny" onClick={handleDelete}>
                <IconTrash size={14} />
              </button>
            </>
          )}
          {hasSubgroups && (
            <div className={`ios-expand-indicator tiny ${isExpanded ? 'expanded' : ''}`}>
              {isExpanded ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}
            </div>
          )}
        </div>
      </div>

      {/* Используем CSS для анимации вместо условного рендеринга */}
      <div className={`ios-card-children-wrapper ${isExpanded ? 'expanded' : ''}`}>
        {isExpanded && (
          <div className="ios-card-children nested-2">
            {canEditStructure && (
              <button className="ios-add-button tiny" onClick={handleAddSubgroup}>
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
    </div>
  );
}, (prev, next) => {
  return prev.group.id === next.group.id &&
         prev.group.name === next.group.name &&
         prev.group.course === next.group.course &&
         prev.group.subgroups?.length === next.group.subgroups?.length &&
         prev.isExpanded === next.isExpanded &&
         prev.canEditStructure === next.canEditStructure;
});

// Direction Card
const DirectionCard = memo(function DirectionCard({ 
  direction, facultyId, facultyName, canEditStructure, isExpanded, expandedGroups,
  onToggle, onToggleGroup, onEdit, onDelete, onSelectGroup
}) {
  const hasGroups = direction.groups && direction.groups.length > 0;

  const handleToggle = useCallback(() => {
    if (hasGroups) onToggle(direction.id);
  }, [hasGroups, direction.id, onToggle]);

  const handleEdit = useCallback((e) => {
    e.stopPropagation();
    onEdit('direction', facultyId, facultyName, direction);
  }, [direction, facultyId, facultyName, onEdit]);

  const handleDelete = useCallback((e) => {
    e.stopPropagation();
    onDelete('direction', direction.id, direction.name, e);
  }, [direction.id, direction.name, onDelete]);

  const handleAddGroup = useCallback(() => {
    onEdit('group', direction.id, direction.name);
  }, [direction.id, direction.name, onEdit]);

  return (
    <div className="ios-direction-card">
      <div 
        className="ios-card-header nested" 
        onClick={handleToggle} 
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
            <span className="ios-stat-item">
              <IconUsers size={12} /> {direction.groups?.length || 0} групп
            </span>
          </div>
        </div>
        <div className="ios-card-actions compact">
          {canEditStructure && (
            <>
              <button className="ios-action-btn edit small" onClick={handleEdit}>
                <IconEdit size={16} />
              </button>
              <button className="ios-action-btn delete small" onClick={handleDelete}>
                <IconTrash size={16} />
              </button>
            </>
          )}
          {hasGroups && (
            <div className={`ios-expand-indicator small ${isExpanded ? 'expanded' : ''}`}>
              {isExpanded ? <IconChevronDown size={18} /> : <IconChevronRight size={18} />}
            </div>
          )}
        </div>
      </div>

      <div className={`ios-card-children-wrapper ${isExpanded ? 'expanded' : ''}`}>
        {isExpanded && (
          <div className="ios-card-children nested">
            {canEditStructure && (
              <button className="ios-add-button small" onClick={handleAddGroup}>
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
                    isExpanded={expandedGroups.has(group.id)}
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
    </div>
  );
}, (prev, next) => {
  return prev.direction.id === next.direction.id &&
         prev.direction.name === next.direction.name &&
         prev.direction.groups?.length === next.direction.groups?.length &&
         prev.isExpanded === next.isExpanded &&
         prev.canEditStructure === next.canEditStructure &&
         prev.expandedGroups === next.expandedGroups; // Set reference comparison
});

// Faculty Card
const FacultyCard = memo(function FacultyCard({ 
  faculty, canEditStructure, isExpanded, expandedDirections, expandedGroups,
  onToggle, onToggleDirection, onToggleGroup, onEdit, onDelete, onSelectGroup
}) {
  const hasDirections = faculty.directions && faculty.directions.length > 0;
  
  // Мемоизируем подсчёт групп
  const totalGroups = useMemo(() => 
    faculty.directions?.reduce((sum, d) => sum + (d.groups?.length || 0), 0) || 0,
    [faculty.directions]
  );

  const handleToggle = useCallback(() => {
    if (hasDirections) onToggle(faculty.id);
  }, [hasDirections, faculty.id, onToggle]);

  const handleEdit = useCallback((e) => {
    e.stopPropagation();
    onEdit('faculty', null, '', faculty);
  }, [faculty, onEdit]);

  const handleDelete = useCallback((e) => {
    e.stopPropagation();
    onDelete('faculty', faculty.id, faculty.name, e);
  }, [faculty.id, faculty.name, onDelete]);

  const handleAddDirection = useCallback(() => {
    onEdit('direction', faculty.id, faculty.name);
  }, [faculty.id, faculty.name, onEdit]);

  return (
    <div className="ios-faculty-card">
      <div 
        className="ios-card-header" 
        onClick={handleToggle} 
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
            <span className="ios-stat-item">
              <IconBook size={14} /> {faculty.directions?.length || 0} направлений
            </span>
            <span className="ios-stat-separator">•</span>
            <span className="ios-stat-item">
              <IconUsers size={14} /> {totalGroups} групп
            </span>
          </div>
          {faculty.description && (
            <p className="ios-card-description">{faculty.description}</p>
          )}
        </div>
        <div className="ios-card-actions">
          {canEditStructure && (
            <>
              <button className="ios-action-btn edit" onClick={handleEdit}>
                <IconEdit size={18} />
              </button>
              <button className="ios-action-btn delete" onClick={handleDelete}>
                <IconTrash size={18} />
              </button>
            </>
          )}
          {hasDirections && (
            <div className={`ios-expand-indicator ${isExpanded ? 'expanded' : ''}`}>
              {isExpanded ? <IconChevronDown size={20} /> : <IconChevronRight size={20} />}
            </div>
          )}
        </div>
      </div>

      <div className={`ios-card-children-wrapper ${isExpanded ? 'expanded' : ''}`}>
        {isExpanded && (
          <div className="ios-card-children">
            {canEditStructure && (
              <button className="ios-add-button" onClick={handleAddDirection}>
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
                    isExpanded={expandedDirections.has(direction.id)}
                    expandedGroups={expandedGroups}
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
    </div>
  );
}, (prev, next) => {
  return prev.faculty.id === next.faculty.id &&
         prev.faculty.name === next.faculty.name &&
         prev.faculty.directions?.length === next.faculty.directions?.length &&
         prev.isExpanded === next.isExpanded &&
         prev.canEditStructure === next.canEditStructure &&
         prev.expandedDirections === next.expandedDirections &&
         prev.expandedGroups === next.expandedGroups;
});

// ========== КОМПОНЕНТ ЗАНЯТИЯ ==========

const ScheduleItem = memo(function ScheduleItem({ lesson, canEdit, onEdit, onDelete }) {
  const handleClick = useCallback(() => {
    if (canEdit) onEdit(lesson);
  }, [canEdit, lesson, onEdit]);

  const handleDelete = useCallback((e) => {
    e.stopPropagation();
    onDelete('lesson', lesson.id, lesson.subject);
  }, [lesson.id, lesson.subject, onDelete]);

  return (
    <div className="schedule-item" onClick={handleClick}>
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
      {canEdit && (
        <button className="schedule-delete" onClick={handleDelete}>
          <IconTrash size={18} />
        </button>
      )}
    </div>
  );
}, (prev, next) => {
  return prev.lesson.id === next.lesson.id &&
         prev.lesson.subject === next.lesson.subject &&
         prev.canEdit === next.canEdit;
});

// ========== ГЛАВНЫЙ КОМПОНЕНТ ==========

export const SchedulePage = memo(function SchedulePage() {
  const { user } = useApp();
  const { notify } = useNotification();
  
  // Режим
  const [viewMode, setViewMode] = useState('schedule');
  
  // Данные — храним отдельно, не пересобираем дерево
  const [faculties, setFaculties] = useState([]);
  const [directions, setDirections] = useState([]);
  const [groups, setGroups] = useState([]);
  const [subgroups, setSubgroups] = useState([]);
  const [schedules, setSchedules] = useState([]);
  
  // UI
  const [loading, setLoading] = useState(true);
  const [selectedGroupId, setSelectedGroupId] = useState(user.group_id || '');
  const [selectedSubgroupId, setSelectedSubgroupId] = useState(user.subgroup_id || '');
  const [selectedDay, setSelectedDay] = useState(new Date().getDay() || 1);
  const [search, setSearch] = useState('');
  
  // КЛЮЧЕВОЕ ИЗМЕНЕНИЕ: Используем Set для хранения раскрытых элементов
  // Set.has() работает за O(1), а не O(n) как при сравнении строк
  const [expandedFaculties, setExpandedFaculties] = useState(() => new Set());
  const [expandedDirections, setExpandedDirections] = useState(() => new Set());
  const [expandedGroups, setExpandedGroups] = useState(() => new Set());
  
  // Модалки
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('lesson');
  const [editing, setEditing] = useState(null);
  const [parentId, setParentId] = useState(null);
  const [parentName, setParentName] = useState('');
  
  // Формы
  const [lessonForm, setLessonForm] = useState(INITIAL_LESSON_FORM);
  const [structureForm, setStructureForm] = useState(INITIAL_STRUCTURE_FORM);
  
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const mountedRef = useRef(true);

  // Права
  const isAdmin = user.role === 'main_admin';
  const isGroupLeader = user.role === 'group_leader';
  const canEditStructure = isAdmin;
  const canEditSchedule = isAdmin || (isGroupLeader && selectedGroupId === user.group_id);

  // Загрузка данных
  const loadData = useCallback(async () => {
    try {
      const [f, d, g, s] = await Promise.all([
        supabase.from('faculties').select('*').order('name'),
        supabase.from('directions').select('*').order('name'),
        supabase.from('study_groups').select('*, directions(name, faculty_id)').order('name'),
        supabase.from('subgroups').select('*').order('name')
      ]);
      
      if (!mountedRef.current) return;
      
      // Batch update — React объединит эти обновления
      setFaculties(f.data || []);
      setDirections(d.data || []);
      setGroups(g.data || []);
      setSubgroups(s.data || []);
      
      if (!selectedGroupId && user.group_id) {
        setSelectedGroupId(user.group_id);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      notify.error('Ошибка загрузки данных');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [user.group_id, selectedGroupId, notify]);

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
      if (mountedRef.current) setSchedules(data || []);
    } catch (error) {
      console.error('Error loading schedule:', error);
    }
  }, [selectedGroupId]);

  useEffect(() => {
    mountedRef.current = true;
    loadData();
    return () => { mountedRef.current = false; };
  }, [loadData]);

  useEffect(() => { loadSchedule(); }, [loadSchedule]);

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    await loadData();
    await loadSchedule();
    notify.success('Обновлено');
  }, [loadData, loadSchedule, notify]);

  // КЛЮЧЕВОЕ: Собираем дерево один раз и мемоизируем
  const facultyTree = useMemo(() => {
    const searchLower = search.toLowerCase();
    
    // Фильтруем факультеты
    let filteredFaculties = faculties;
    if (search) {
      filteredFaculties = faculties.filter(f => 
        f.name.toLowerCase().includes(searchLower) || 
        (f.code && f.code.toLowerCase().includes(searchLower))
      );
    }
    
    // Собираем дерево
    return filteredFaculties.map(faculty => {
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
  }, [faculties, directions, groups, subgroups, search]);

  // Мемоизированные данные
  const filteredSubgroups = useMemo(() => 
    subgroups.filter(s => s.group_id === selectedGroupId),
    [subgroups, selectedGroupId]
  );

  const daySchedule = useMemo(() => {
    let filtered = schedules.filter(s => s.day_of_week === selectedDay);
    if (selectedSubgroupId) {
      filtered = filtered.filter(s => 
        s.subgroup_id === null || s.subgroup_id === selectedSubgroupId
      );
    }
    return filtered.sort((a, b) => (a.start_time || '00:00').localeCompare(b.start_time || '00:00'));
  }, [schedules, selectedDay, selectedSubgroupId]);

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

  const selectedGroupInfo = useMemo(() => {
    const group = groups.find(g => g.id === selectedGroupId);
    if (!group) return null;
    const direction = directions.find(d => d.id === group.direction_id);
    const faculty = faculties.find(f => f.id === direction?.faculty_id);
    return { ...group, directionName: direction?.name, facultyName: faculty?.name };
  }, [selectedGroupId, groups, directions, faculties]);

  // Константы
  const dayTabs = useMemo(() => DAYS.map(d => ({ id: d.id, label: d.short })), []);
  const currentDayName = useMemo(() => DAYS.find(d => d.id === selectedDay)?.name || '', [selectedDay]);
  const viewTabs = useMemo(() => [
    { id: 'schedule', label: '📚 Расписание' },
    { id: 'structure', label: '🏛️ Структура' }
  ], []);

  // ОПТИМИЗИРОВАННЫЕ Toggle handlers — создаём новый Set только при изменении
  const handleToggleFaculty = useCallback((id) => {
    haptic.light();
    setExpandedFaculties(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleToggleDirection = useCallback((id) => {
    haptic.light();
    setExpandedDirections(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleToggleGroup = useCallback((id) => {
    haptic.light();
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSelectGroup = useCallback((groupId) => {
    setSelectedGroupId(groupId);
    setSelectedSubgroupId('');
    setViewMode('schedule');
    haptic.medium();
  }, []);

  // Обработчики модалок
  const openAddLessonModal = useCallback(() => {
    setModalType('lesson');
    setEditing(null);
    setLessonForm(INITIAL_LESSON_FORM);
    setShowModal(true);
    haptic.light();
  }, []);

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
      setStructureForm(INITIAL_STRUCTURE_FORM);
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

  // Сохранение занятия
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

  // Сохранение структуры
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
        result = editing 
          ? await supabase.from('faculties').update(data).eq('id', editing.id)
          : await supabase.from('faculties').insert(data);
        notify.success(editing ? 'Факультет обновлён' : 'Факультет создан');
        
      } else if (modalType === 'direction') {
        if (!parentId) { notify.error('Не выбран факультет'); setSubmitting(false); return; }
        const data = { name: structureForm.name.trim(), code: structureForm.code.trim() || null, faculty_id: parentId };
        result = editing 
          ? await supabase.from('directions').update(data).eq('id', editing.id)
          : await supabase.from('directions').insert(data);
        notify.success(editing ? 'Направление обновлено' : 'Направление создано');
        
      } else if (modalType === 'group') {
        if (!parentId) { notify.error('Не выбрано направление'); setSubmitting(false); return; }
        const data = { 
          name: structureForm.name.trim(), 
          course: parseInt(structureForm.course) || 1, 
          year: parseInt(structureForm.year) || new Date().getFullYear(),
          direction_id: parentId
        };
        result = editing 
          ? await supabase.from('study_groups').update(data).eq('id', editing.id)
          : await supabase.from('study_groups').insert(data);
        notify.success(editing ? 'Группа обновлена' : 'Группа создана');
        
      } else if (modalType === 'subgroup') {
        if (!parentId) { notify.error('Не выбрана группа'); setSubmitting(false); return; }
        const data = { name: structureForm.name.trim(), group_id: parentId };
        result = editing 
          ? await supabase.from('subgroups').update(data).eq('id', editing.id)
          : await supabase.from('subgroups').insert(data);
        notify.success(editing ? 'Подгруппа обновлена' : 'Подгруппа создана');
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

  // Удаление
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
      const tables = { 
        lesson: 'schedules', 
        faculty: 'faculties', 
        direction: 'directions', 
        group: 'study_groups', 
        subgroup: 'subgroups' 
      };
      const { error } = await supabase.from(tables[type]).delete().eq('id', id);
      if (error) throw error;
      
      if (type === 'lesson') {
        invalidateCache('schedules');
        loadSchedule();
      } else {
        invalidateCache('structure');
        loadData();
      }
      
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

  // Заголовок модалки
  const modalTitle = useMemo(() => {
    if (modalType === 'lesson') return editing ? 'Редактировать занятие' : 'Добавить занятие';
    const action = editing ? 'Редактировать' : 'Создать';
    const types = { faculty: 'факультет', direction: 'направление', group: 'группу', subgroup: 'подгруппу' };
    let title = `${action} ${types[modalType] || ''}`;
    if (parentName && !editing) title += ` • ${parentName}`;
    return title;
  }, [modalType, editing, parentName]);

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
          <FilterTabs 
            tabs={viewTabs} 
            activeTab={viewMode} 
            onChange={(mode) => { setViewMode(mode); haptic.light(); }} 
          />

          {viewMode === 'schedule' && (
            <>
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
                        <option key={g.id} value={g.id}>{g.name} ({g.course} курс)</option>
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

              <FilterTabs 
                tabs={dayTabs} 
                activeTab={selectedDay} 
                onChange={(day) => { haptic.light(); setSelectedDay(day); }} 
              />
              <div className="schedule-day-title">{currentDayName}</div>

              {loading ? (
                <SkeletonList count={5} />
              ) : !selectedGroupId ? (
                <EmptyState 
                  icon="📚" 
                  title="Выберите группу" 
                  text="Выберите учебную группу из списка"
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
                      <IconPlus size={18} /> Добавить
                    </Button>
                  )}
                />
              ) : (
                <div className="schedule-list">
                  {daySchedule.map((lesson) => (
                    <ScheduleItem
                      key={lesson.id}
                      lesson={lesson}
                      canEdit={canEditSchedule}
                      onEdit={openEditLessonModal}
                      onDelete={requestDelete}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {viewMode === 'structure' && (
            <>
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
                    <button className="ios-search-clear" onClick={() => setSearch('')}>
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {loading ? (
                <SkeletonList count={5} />
              ) : facultyTree.length === 0 ? (
                <EmptyState 
                  icon={<IconBuilding size={64} color="var(--text-tertiary)" />}
                  title="Нет факультетов" 
                  text={search ? 'Ничего не найдено' : 'Создайте первый факультет'} 
                  action={canEditStructure && !search && (
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
                      isExpanded={expandedFaculties.has(faculty.id)}
                      expandedDirections={expandedDirections}
                      expandedGroups={expandedGroups}
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

      {/* FAB */}
      {((canEditSchedule && viewMode === 'schedule' && selectedGroupId) || 
        (canEditStructure && viewMode === 'structure')) && (
        <button 
          className="ios-fab"
          onClick={viewMode === 'schedule' ? openAddLessonModal : () => openStructureModal('faculty')}
        >
          <IconPlus size={24} color="white" />
        </button>
      )}

      {/* Модалки */}
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
                  placeholder="Краткое описание..." 
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
                      <option key={c} value={c}>{c} курс</option>
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
        message={`Удалить "${deleteTarget?.name}"?`}
        confirmText="Удалить"
        cancelText="Отмена"
        variant="danger"
      />
    </>
  );
});

export default SchedulePage;
