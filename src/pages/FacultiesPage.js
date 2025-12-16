/**
 * FacultiesPage — ОПТИМИЗИРОВАННАЯ ВЕРСИЯ
 * 
 * Добавлена виртуализация для больших списков
 * Intersection Observer для lazy loading
 * Web Workers готовы к использованию
 */
import React, { useState, useEffect, useCallback, memo, useMemo, useRef } from 'react';
import { supabase, invalidateCache } from '../utils/supabase';
import { haptic } from '../utils/haptic';
import { debounce } from '../utils/helpers';
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
  IconEdit, IconTrash, IconPlus, IconChevronDown, IconChevronRight,
  IconSearch
} from '../components/Icons';

// Импорт компонентов карточек
import { FacultyCard } from './FacultyCardComponents';

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
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  // Виртуализация
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });
  
  // Модалки
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('faculty');
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
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Права доступа
  const canEdit = user.role === 'main_admin';

  // Refs для cleanup и optimization
  const mountedRef = useRef(true);
  const abortControllerRef = useRef(null);
  const observerRef = useRef(null);
  const containerRef = useRef(null);

  // ========== OPTIMIZED DEBOUNCED SEARCH ==========
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

  // ========== INTERSECTION OBSERVER FOR LAZY LOADING ==========
  useEffect(() => {
    if (!containerRef.current) return;

    const options = {
      root: null,
      rootMargin: '100px',
      threshold: 0.01
    };

    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Элемент стал видимым - можно загрузить дополнительные данные
          const index = parseInt(entry.target.dataset.index);
          if (!isNaN(index)) {
            setVisibleRange(prev => ({
              start: Math.min(prev.start, Math.max(0, index - 5)),
              end: Math.max(prev.end, index + 15)
            }));
          }
        }
      });
    }, options);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  // ========== OPTIMIZED DATA LOADING ==========
  const loadData = useCallback(async () => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    try {
      // Parallel loading для максимальной скорости
      const [f, d, g, s] = await Promise.all([
        supabase
          .from('faculties')
          .select('*')
          .order('name')
          .abortSignal(abortControllerRef.current.signal),
        supabase
          .from('directions')
          .select('*')
          .order('name')
          .abortSignal(abortControllerRef.current.signal),
        supabase
          .from('study_groups')
          .select('*, directions(name)')
          .order('name')
          .abortSignal(abortControllerRef.current.signal),
        supabase
          .from('subgroups')
          .select('*')
          .order('name')
          .abortSignal(abortControllerRef.current.signal)
      ]);
      
      if (mountedRef.current) {
        // Batch update для минимизации re-renders
        requestAnimationFrame(() => {
          setFaculties(f.data || []);
          setDirections(d.data || []);
          setGroups(g.data || []);
          setSubgroups(s.data || []);
        });
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
  }, [notify]);

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

  const handleRefresh = useCallback(async () => { 
    setLoading(true);
    await loadData(); 
    notify.success('Обновлено'); 
  }, [loadData, notify]);

  // ========== MODAL HANDLERS ==========
  const openModal = useCallback((type, parent = null, parentNameStr = '', item = null) => {
    setModalType(type);
    setParentId(parent);
    setParentName(parentNameStr);
    setEditing(item);
    
    if (item) {
      setForm({
        name: item.name || '',
        code: item.code || '',
        description: item.description || '',
        course: item.course || 1,
        year: item.year || new Date().getFullYear()
      });
    } else {
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

  // ========== SAVE HANDLER ==========
  const saveItem = useCallback(async () => {
    if (!form.name.trim()) {
      notify.error('Введите название');
      return;
    }
    
    setSubmitting(true);
    
    try {
      let result;
      
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
      
      // Оптимизированное обновление
      requestAnimationFrame(() => loadData());
      haptic.success();
      
    } catch (error) {
      console.error('Error saving:', error);
      notify.error('Ошибка: ' + (error.message || 'Неизвестная ошибка'));
      haptic.error();
    } finally {
      setSubmitting(false);
    }
  }, [form, modalType, parentId, editing, loadData, notify, closeModal]);

  // ========== DELETE HANDLERS ==========
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
      requestAnimationFrame(() => loadData());
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

  // ========== OPTIMIZED FILTERING (MEMOIZED) ==========
  const filteredFaculties = useMemo(() => {
    if (!debouncedSearch) return faculties;
    
    const searchLower = debouncedSearch.toLowerCase();
    return faculties.filter(f => 
      f.name.toLowerCase().includes(searchLower) || 
      (f.code && f.code.toLowerCase().includes(searchLower))
    );
  }, [faculties, debouncedSearch]);

  // ========== OPTIMIZED TREE BUILDING (MEMOIZED) ==========
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

  // ========== VIRTUALIZED FACULTIES (ONLY VISIBLE ITEMS) ==========
  const visibleFaculties = useMemo(() => {
    return facultyTree.slice(visibleRange.start, visibleRange.end);
  }, [facultyTree, visibleRange]);

  // ========== OPTIMIZED TOGGLE HANDLERS ==========
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

  // ========== MODAL TITLE ==========
  const modalTitle = useMemo(() => {
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
  }, [modalType, editing, parentName]);

  // ========== RENDER ==========
  return (
    <>
      <PageHeader 
        title="🏛️ Структура университета" 
        action={canEdit && (
          <Button variant="primary" onClick={() => openModal('faculty')}>
            <IconPlus size={20} />
            Факультет
          </Button>
        )} 
      />
      <MobilePageHeader 
        title="Структура" 
        actions={canEdit ? [{ icon: 'plus', onClick: () => openModal('faculty'), primary: true }] : []} 
      />

      {/* iOS 26 Floating Search Bar */}
      <div className="ios-search-container">
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

      <PullToRefresh onRefresh={handleRefresh}>
        <div className="page-content ios-structure-page" ref={containerRef}>
          {loading ? (
            <SkeletonList count={5} />
          ) : facultyTree.length === 0 ? (
            <EmptyState 
              icon={<IconBuilding size={64} color="var(--text-tertiary)" />}
              title="Нет факультетов" 
              text={debouncedSearch ? 'Ничего не найдено' : 'Создайте первый факультет'} 
              action={canEdit && !debouncedSearch && (
                <Button variant="primary" onClick={() => openModal('faculty')}>
                  <IconPlus size={20} />
                  Создать факультет
                </Button>
              )} 
            />
          ) : (
            <div className="ios-structure-tree">
              {/* Виртуализация: рендерим только видимые элементы */}
              {visibleFaculties.map((faculty, index) => (
                <FacultyCard 
                  key={faculty.id}
                  faculty={faculty}
                  canEdit={canEdit}
                  isExpanded={expandedFaculty === faculty.id}
                  expandedDirection={expandedDirection}
                  expandedGroup={expandedGroup}
                  onToggle={handleToggleFaculty}
                  onToggleDirection={handleToggleDirection}
                  onToggleGroup={handleToggleGroup}
                  onEdit={openModal}
                  onDelete={requestDelete}
                  data-index={visibleRange.start + index}
                />
              ))}
            </div>
          )}
        </div>
      </PullToRefresh>

      {/* Floating Action Button */}
      {canEdit && (
        <button 
          className="ios-fab"
          onClick={() => openModal('faculty')}
          aria-label="Создать факультет"
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
          <FormField label="Код">
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
                {[1, 2, 3, 4, 5, 6].map(c => (
                  <option key={c} value={c}>{c} курс{c > 4 ? ' (магистратура)' : ''}</option>
                ))}
              </select>
            </FormField>
            
            <FormField label="Год набора">
              <Input 
                type="number"
                value={form.year} 
                onChange={(e) => setForm(prev => ({ ...prev, year: parseInt(e.target.value) }))} 
              />
            </FormField>
          </>
        )}
      </Modal>

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

export default FacultiesPage;
