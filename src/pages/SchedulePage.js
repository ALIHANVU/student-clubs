/**
 * FacultiesPage — ПОЛНОСТЬЮ ОБНОВЛЁННАЯ
 * 
 * ✅ Редактирование факультетов и направлений
 * ✅ Удаление всех элементов (факультеты, направления, группы, подгруппы)
 * ✅ iOS 26 Liquid Glass дизайн
 * ✅ Оптимизация и мемоизация
 * ✅ Красивые анимации
 */
import React, { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { supabase, invalidateCache } from '../utils/supabase';
import { haptic } from '../utils/haptic';
import { useNotification } from '../context/NotificationContext';
import { useApp } from '../context/AppContext';
import { 
  PageHeader, EmptyState, Button, FormField, Input, Textarea, 
  PullToRefresh, SkeletonList 
} from '../components/UI';
import { Modal, ConfirmModal } from '../components/Modal';
import { MobilePageHeader } from '../components/Navigation';
import { 
  IconBuilding, IconBook, IconUsers, IconUser, 
  IconEdit, IconTrash, IconPlus, IconChevronDown, IconChevronRight 
} from '../components/Icons';

export const FacultiesPage = memo(function FacultiesPage() {
  const { user } = useApp();
  const { notify } = useNotification();
  
  // Данные
  const [faculties, setFaculties] = useState([]);
  const [directions, setDirections] = useState([]);
  const [groups, setGroups] = useState([]);
  const [subgroups, setSubgroups] = useState([]);
  
  // UI состояния
  const [loading, setLoading] = useState(true);
  const [expandedFaculty, setExpandedFaculty] = useState(null);
  const [expandedDirection, setExpandedDirection] = useState(null);
  const [expandedGroup, setExpandedGroup] = useState(null);
  const [search, setSearch] = useState('');
  
  // Модалки
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('faculty'); // faculty, direction, group, subgroup
  const [editing, setEditing] = useState(null);
  const [parentId, setParentId] = useState(null);
  const [parentName, setParentName] = useState('');
  
  // Форма
  const [form, setForm] = useState({ 
    name: '', 
    code: '', 
    description: '', 
    course: 1,
    year: new Date().getFullYear()
  });
  
  const [submitting, setSubmitting] = useState(false);
  
  // Модалка подтверждения удаления
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Права доступа
  const canEdit = user.role === 'main_admin';

  // ========== ЗАГРУЗКА ДАННЫХ ==========
  const loadData = useCallback(async () => {
    try {
      const [f, d, g, s] = await Promise.all([
        supabase.from('faculties').select('*').order('name'),
        supabase.from('directions').select('*').order('name'),
        supabase.from('study_groups').select('*, directions(name)').order('name'),
        supabase.from('subgroups').select('*').order('name')
      ]);
      
      setFaculties(f.data || []);
      setDirections(d.data || []);
      setGroups(g.data || []);
      setSubgroups(s.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      notify.error('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleRefresh = useCallback(async () => { 
    setLoading(true);
    await loadData(); 
    notify.success('Обновлено'); 
  }, [loadData, notify]);

  // ========== ОТКРЫТИЕ МОДАЛОК ==========
  const openModal = useCallback((type, parent = null, parentNameStr = '', item = null) => {
    setModalType(type);
    setParentId(parent);
    setParentName(parentNameStr);
    setEditing(item);
    
    if (item) {
      // Редактирование
      setForm({
        name: item.name || '',
        code: item.code || '',
        description: item.description || '',
        course: item.course || 1,
        year: item.year || new Date().getFullYear()
      });
    } else {
      // Создание
      setForm({ 
        name: '', 
        code: '', 
        description: '', 
        course: 1,
        year: new Date().getFullYear()
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
  const saveItem = useCallback(async () => {
    if (!form.name.trim()) {
      notify.error('Введите название');
      return;
    }
    
    setSubmitting(true);
    
    try {
      let result;
      const names = { 
        faculty: 'Факультет', 
        direction: 'Направление', 
        group: 'Группа', 
        subgroup: 'Подгруппа' 
      };
      
      if (modalType === 'faculty') {
        const data = { 
          name: form.name.trim(), 
          code: form.code.trim() || null, 
          description: form.description.trim() || null 
        };
        
        if (editing) {
          result = await supabase.from('faculties').update(data).eq('id', editing.id);
          if (result.error) throw result.error;
          notify.success('Факультет обновлён');
        } else {
          result = await supabase.from('faculties').insert(data);
          if (result.error) throw result.error;
          notify.success('Факультет создан');
        }
        
      } else if (modalType === 'direction') {
        if (!parentId) {
          notify.error('Не выбран факультет');
          setSubmitting(false);
          return;
        }
        
        const data = { 
          name: form.name.trim(), 
          code: form.code.trim() || null, 
          faculty_id: parentId 
        };
        
        if (editing) {
          result = await supabase.from('directions').update(data).eq('id', editing.id);
          if (result.error) throw result.error;
          notify.success('Направление обновлено');
        } else {
          result = await supabase.from('directions').insert(data);
          if (result.error) throw result.error;
          notify.success('Направление создано');
        }
        
      } else if (modalType === 'group') {
        if (!parentId) {
          notify.error('Не выбрано направление');
          setSubmitting(false);
          return;
        }
        
        const data = { 
          name: form.name.trim(), 
          course: parseInt(form.course) || 1, 
          year: parseInt(form.year) || new Date().getFullYear(),
          direction_id: parentId
        };
        
        if (editing) {
          result = await supabase.from('study_groups').update(data).eq('id', editing.id);
          if (result.error) throw result.error;
          notify.success('Группа обновлена');
        } else {
          result = await supabase.from('study_groups').insert(data);
          if (result.error) throw result.error;
          notify.success('Группа создана');
        }
        
      } else if (modalType === 'subgroup') {
        if (!parentId) {
          notify.error('Не выбрана группа');
          setSubmitting(false);
          return;
        }
        
        const data = { 
          name: form.name.trim(), 
          group_id: parentId 
        };
        
        if (editing) {
          result = await supabase.from('subgroups').update(data).eq('id', editing.id);
          if (result.error) throw result.error;
          notify.success('Подгруппа обновлена');
        } else {
          result = await supabase.from('subgroups').insert(data);
          if (result.error) throw result.error;
          notify.success('Подгруппа создана');
        }
      }
      
      invalidateCache('structure');
      closeModal();
      loadData();
      haptic.success();
      
    } catch (error) {
      console.error('Error saving:', error);
      notify.error('Ошибка: ' + (error.message || 'Неизвестная ошибка'));
      haptic.error();
    } finally {
      setSubmitting(false);
    }
  }, [form, modalType, parentId, editing, loadData, notify, closeModal]);

  // ========== УДАЛЕНИЕ ==========
  const requestDelete = useCallback((type, id, name, e) => {
    e?.stopPropagation();
    setDeleteTarget({ type, id, name });
    setShowConfirmDelete(true);
    haptic.light();
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    
    const { type, id, name } = deleteTarget;
    
    try {
      let error;
      
      if (type === 'faculty') {
        ({ error } = await supabase.from('faculties').delete().eq('id', id));
      } else if (type === 'direction') {
        ({ error } = await supabase.from('directions').delete().eq('id', id));
      } else if (type === 'group') {
        ({ error } = await supabase.from('study_groups').delete().eq('id', id));
      } else if (type === 'subgroup') {
        ({ error } = await supabase.from('subgroups').delete().eq('id', id));
      }
      
      if (error) throw error;
      
      const messages = { 
        faculty: 'Факультет', 
        direction: 'Направление', 
        group: 'Группа',
        subgroup: 'Подгруппа'
      };
      
      invalidateCache('structure');
      loadData();
      notify.success(`${messages[type]} удалён`);
      haptic.medium();
      
    } catch (error) {
      console.error('Error deleting:', error);
      notify.error('Ошибка удаления: ' + (error.message || ''));
      haptic.error();
    } finally {
      setShowConfirmDelete(false);
      setDeleteTarget(null);
    }
  }, [deleteTarget, loadData, notify]);

  // ========== ФИЛЬТРАЦИЯ ==========
  const filteredFaculties = useMemo(() => 
    faculties.filter(f => 
      f.name.toLowerCase().includes(search.toLowerCase()) || 
      (f.code && f.code.toLowerCase().includes(search.toLowerCase()))
    ),
    [faculties, search]
  );

  // ========== ГРУППИРОВКА ДАННЫХ ==========
  const facultyTree = useMemo(() => {
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
  }, [filteredFaculties, directions, groups, subgroups]);

  // ========== ЗАГОЛОВОК МОДАЛКИ ==========
  const getModalTitle = () => {
    const action = editing ? 'Редактировать' : 'Создать';
    const types = { 
      faculty: 'факультет', 
      direction: 'направление', 
      group: 'группу',
      subgroup: 'подгруппу'
    };
    let title = `${action} ${types[modalType]}`;
    if (parentName && !editing) {
      title += ` • ${parentName}`;
    }
    return title;
  };

  // ========== РЕНДЕР ==========
  return (
    <>
      <PageHeader 
        title="🏛️ Структура университета" 
        action={canEdit && <Button variant="primary" onClick={() => openModal('faculty')}>+ Факультет</Button>} 
        search={search} 
        onSearch={setSearch} 
      />
      <MobilePageHeader 
        title="Структура" 
        showSearch 
        searchValue={search} 
        onSearchChange={setSearch} 
        actions={canEdit ? [{ icon: 'plus', onClick: () => openModal('faculty'), primary: true }] : []} 
      />

      <PullToRefresh onRefresh={handleRefresh}>
        <div className="page-content">
          {loading ? (
            <SkeletonList count={5} />
          ) : facultyTree.length === 0 ? (
            <EmptyState 
              icon={<IconBuilding size={64} color="var(--text-tertiary)" />}
              title="Нет факультетов" 
              text={search ? 'Ничего не найдено' : 'Создайте первый факультет'} 
              action={canEdit && !search && (
                <Button variant="primary" onClick={() => openModal('faculty')}>
                  <IconPlus size={20} />
                  Создать факультет
                </Button>
              )} 
            />
          ) : (
            <div className="structure-tree">
              {facultyTree.map((faculty) => (
                <FacultyItem 
                  key={faculty.id}
                  faculty={faculty}
                  canEdit={canEdit}
                  expandedFaculty={expandedFaculty}
                  expandedDirection={expandedDirection}
                  expandedGroup={expandedGroup}
                  onToggleFaculty={(id) => {
                    haptic.light();
                    setExpandedFaculty(expandedFaculty === id ? null : id);
                    setExpandedDirection(null);
                    setExpandedGroup(null);
                  }}
                  onToggleDirection={(id) => {
                    haptic.light();
                    setExpandedDirection(expandedDirection === id ? null : id);
                    setExpandedGroup(null);
                  }}
                  onToggleGroup={(id) => {
                    haptic.light();
                    setExpandedGroup(expandedGroup === id ? null : id);
                  }}
                  onEdit={openModal}
                  onDelete={requestDelete}
                />
              ))}
            </div>
          )}
        </div>
      </PullToRefresh>

      {/* Модалка создания/редактирования */}
      <Modal 
        isOpen={showModal} 
        onClose={closeModal} 
        title={getModalTitle()} 
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>Отмена</Button>
            <Button 
              variant="primary" 
              onClick={saveItem} 
              disabled={!form.name.trim() || submitting}
            >
              {submitting ? 'Сохранение...' : (editing ? 'Сохранить' : 'Создать')}
            </Button>
          </>
        }
      >
        <FormField label="Название *">
          <Input 
            value={form.name} 
            onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} 
            placeholder={
              modalType === 'faculty' ? 'Факультет информатики' : 
              modalType === 'direction' ? 'Программная инженерия' : 
              modalType === 'group' ? 'ПИ-21' : '1 подгруппа'
            }
            autoFocus 
          />
        </FormField>
        
        {(modalType === 'faculty' || modalType === 'direction') && (
          <FormField label="Код (сокращение)">
            <Input 
              value={form.code} 
              onChange={(e) => setForm(prev => ({ ...prev, code: e.target.value }))} 
              placeholder={modalType === 'faculty' ? 'ФИТ' : '09.03.04'} 
            />
          </FormField>
        )}
        
        {modalType === 'faculty' && (
          <FormField label="Описание">
            <Textarea 
              value={form.description} 
              onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))} 
              placeholder="Краткое описание факультета..." 
            />
          </FormField>
        )}
        
        {modalType === 'group' && (
          <>
            <FormField label="Курс">
              <select 
                className="form-select" 
                value={form.course} 
                onChange={(e) => setForm(prev => ({ ...prev, course: parseInt(e.target.value) }))}
              >
                <option value={1}>1 курс</option>
                <option value={2}>2 курс</option>
                <option value={3}>3 курс</option>
                <option value={4}>4 курс</option>
                <option value={5}>5 курс (магистратура)</option>
                <option value={6}>6 курс (магистратура)</option>
              </select>
            </FormField>
            
            <FormField label="Год набора">
              <Input 
                type="number"
                value={form.year} 
                onChange={(e) => setForm(prev => ({ ...prev, year: parseInt(e.target.value) }))} 
                placeholder={new Date().getFullYear().toString()}
              />
            </FormField>
          </>
        )}
      </Modal>

      {/* Модалка подтверждения удаления */}
      <ConfirmModal
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        onConfirm={confirmDelete}
        title="Удалить?"
        message={`Вы уверены, что хотите удалить "${deleteTarget?.name}"? Это действие нельзя отменить.`}
        confirmText="Удалить"
        cancelText="Отмена"
        variant="danger"
      />
    </>
  );
});

// ========== КОМПОНЕНТЫ ДЕРЕВА ==========

const FacultyItem = memo(function FacultyItem({ 
  faculty, 
  canEdit, 
  expandedFaculty, 
  expandedDirection,
  expandedGroup,
  onToggleFaculty, 
  onToggleDirection,
  onToggleGroup,
  onEdit, 
  onDelete 
}) {
  const isExpanded = expandedFaculty === faculty.id;
  const hasDirections = faculty.directions.length > 0;

  return (
    <div className="structure-card">
      <div 
        className="structure-header faculty-header"
        onClick={() => hasDirections && onToggleFaculty(faculty.id)}
      >
        <div className="structure-icon-wrapper">
          <IconBuilding size={24} color="var(--blue)" />
        </div>
        
        <div className="structure-info">
          <div className="structure-title">
            {faculty.name}
            {faculty.code && <span className="structure-code">{faculty.code}</span>}
          </div>
          <div className="structure-meta">
            {faculty.directions.length} направлений • {
              faculty.directions.reduce((sum, d) => sum + d.groups.length, 0)
            } групп
          </div>
          {faculty.description && (
            <div className="structure-description">{faculty.description}</div>
          )}
        </div>

        <div className="structure-actions">
          {canEdit && (
            <>
              <button 
                className="structure-action-btn edit-btn"
                onClick={(e) => { e.stopPropagation(); onEdit('faculty', null, '', faculty); }}
                title="Редактировать"
              >
                <IconEdit size={18} />
              </button>
              <button 
                className="structure-action-btn delete-btn"
                onClick={(e) => onDelete('faculty', faculty.id, faculty.name, e)}
                title="Удалить"
              >
                <IconTrash size={18} />
              </button>
            </>
          )}
          
          {hasDirections && (
            <div className="structure-expand">
              {isExpanded ? 
                <IconChevronDown size={20} color="var(--text-tertiary)" /> : 
                <IconChevronRight size={20} color="var(--text-tertiary)" />
              }
            </div>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="structure-children">
          {canEdit && (
            <button 
              className="structure-add-item-btn"
              onClick={() => onEdit('direction', faculty.id, faculty.name)}
            >
              <IconPlus size={16} />
              Добавить направление
            </button>
          )}
          
          {faculty.directions.length === 0 ? (
            <div className="structure-empty">Нет направлений</div>
          ) : (
            faculty.directions.map((direction) => (
              <DirectionItem
                key={direction.id}
                direction={direction}
                facultyId={faculty.id}
                facultyName={faculty.name}
                canEdit={canEdit}
                expandedDirection={expandedDirection}
                expandedGroup={expandedGroup}
                onToggleDirection={onToggleDirection}
                onToggleGroup={onToggleGroup}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
});

const DirectionItem = memo(function DirectionItem({ 
  direction, 
  facultyId,
  facultyName,
  canEdit, 
  expandedDirection,
  expandedGroup,
  onToggleDirection,
  onToggleGroup,
  onEdit, 
  onDelete 
}) {
  const isExpanded = expandedDirection === direction.id;
  const hasGroups = direction.groups.length > 0;

  return (
    <div className="structure-nested-item">
      <div 
        className="structure-header direction-header"
        onClick={() => hasGroups && onToggleDirection(direction.id)}
      >
        <div className="structure-icon-wrapper">
          <IconBook size={20} color="var(--indigo)" />
        </div>
        
        <div className="structure-info">
          <div className="structure-title">
            {direction.name}
            {direction.code && <span className="structure-code">{direction.code}</span>}
          </div>
          <div className="structure-meta">{direction.groups.length} групп</div>
        </div>

        <div className="structure-actions">
          {canEdit && (
            <>
              <button 
                className="structure-action-btn edit-btn"
                onClick={(e) => { e.stopPropagation(); onEdit('direction', facultyId, facultyName, direction); }}
                title="Редактировать"
              >
                <IconEdit size={16} />
              </button>
              <button 
                className="structure-action-btn delete-btn"
                onClick={(e) => onDelete('direction', direction.id, direction.name, e)}
                title="Удалить"
              >
                <IconTrash size={16} />
              </button>
            </>
          )}
          
          {hasGroups && (
            <div className="structure-expand">
              {isExpanded ? 
                <IconChevronDown size={18} color="var(--text-tertiary)" /> : 
                <IconChevronRight size={18} color="var(--text-tertiary)" />
              }
            </div>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="structure-children">
          {canEdit && (
            <button 
              className="structure-add-item-btn small"
              onClick={() => onEdit('group', direction.id, direction.name)}
            >
              <IconPlus size={14} />
              Добавить группу
            </button>
          )}
          
          {direction.groups.length === 0 ? (
            <div className="structure-empty small">Нет групп</div>
          ) : (
            direction.groups.map((group) => (
              <GroupItem
                key={group.id}
                group={group}
                directionId={direction.id}
                directionName={direction.name}
                canEdit={canEdit}
                expandedGroup={expandedGroup}
                onToggleGroup={onToggleGroup}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
});

const GroupItem = memo(function GroupItem({ 
  group, 
  directionId,
  directionName,
  canEdit, 
  expandedGroup,
  onToggleGroup,
  onEdit, 
  onDelete 
}) {
  const isExpanded = expandedGroup === group.id;
  const hasSubgroups = group.subgroups.length > 0;

  return (
    <div className="structure-nested-item">
      <div 
        className="structure-header group-header"
        onClick={() => hasSubgroups && onToggleGroup(group.id)}
      >
        <div className="structure-icon-wrapper">
          <IconUsers size={18} color="var(--green)" />
        </div>
        
        <div className="structure-info">
          <div className="structure-title">
            {group.name}
            <span className="structure-badge">{group.course} курс</span>
            {group.year && <span className="structure-badge secondary">{group.year}</span>}
          </div>
          {group.subgroups.length > 0 && (
            <div className="structure-meta">{group.subgroups.length} подгрупп</div>
          )}
        </div>

        <div className="structure-actions">
          {canEdit && (
            <>
              <button 
                className="structure-action-btn edit-btn"
                onClick={(e) => { e.stopPropagation(); onEdit('group', directionId, directionName, group); }}
                title="Редактировать"
              >
                <IconEdit size={14} />
              </button>
              <button 
                className="structure-action-btn delete-btn"
                onClick={(e) => onDelete('group', group.id, group.name, e)}
                title="Удалить"
              >
                <IconTrash size={14} />
              </button>
            </>
          )}
          
          {hasSubgroups && (
            <div className="structure-expand">
              {isExpanded ? 
                <IconChevronDown size={16} color="var(--text-tertiary)" /> : 
                <IconChevronRight size={16} color="var(--text-tertiary)" />
              }
            </div>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="structure-children">
          {canEdit && (
            <button 
              className="structure-add-item-btn small"
              onClick={() => onEdit('subgroup', group.id, group.name)}
            >
              <IconPlus size={12} />
              Добавить подгруппу
            </button>
          )}
          
          {group.subgroups.length === 0 ? (
            <div className="structure-empty small">Нет подгрупп</div>
          ) : (
            group.subgroups.map((subgroup) => (
              <SubgroupItem
                key={subgroup.id}
                subgroup={subgroup}
                groupId={group.id}
                groupName={group.name}
                canEdit={canEdit}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
});

const SubgroupItem = memo(function SubgroupItem({ 
  subgroup, 
  groupId,
  groupName,
  canEdit, 
  onEdit, 
  onDelete 
}) {
  return (
    <div className="structure-nested-item leaf">
      <div className="structure-header subgroup-header">
        <div className="structure-icon-wrapper">
          <IconUser size={16} color="var(--orange)" />
        </div>
        
        <div className="structure-info">
          <div className="structure-title">{subgroup.name}</div>
        </div>

        {canEdit && (
          <div className="structure-actions">
            <button 
              className="structure-action-btn edit-btn"
              onClick={(e) => { e.stopPropagation(); onEdit('subgroup', groupId, groupName, subgroup); }}
              title="Редактировать"
            >
              <IconEdit size={12} />
            </button>
            <button 
              className="structure-action-btn delete-btn"
              onClick={(e) => onDelete('subgroup', subgroup.id, subgroup.name, e)}
              title="Удалить"
            >
              <IconTrash size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

export default FacultiesPage;
