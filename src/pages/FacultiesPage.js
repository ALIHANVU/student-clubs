/**
 * FacultiesPage — Исправленная с полными правами админа
 */
import React, { useState, useEffect, useCallback, memo } from 'react';
import { supabase, invalidateCache } from '../utils/supabase';
import { haptic } from '../utils/haptic';
import { useNotification } from '../context/NotificationContext';
import { useApp } from '../context/AppContext';
import { PageHeader, EmptyState, Button, FormField, Input, Textarea, PullToRefresh, SkeletonList } from '../components/UI';
import { Modal } from '../components/Modal';
import { MobilePageHeader } from '../components/Navigation';

export const FacultiesPage = memo(function FacultiesPage() {
  const { user } = useApp();
  const { notify } = useNotification();
  
  const [faculties, setFaculties] = useState([]);
  const [directions, setDirections] = useState([]);
  const [groups, setGroups] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [expandedFaculty, setExpandedFaculty] = useState(null);
  const [expandedDirection, setExpandedDirection] = useState(null);
  
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('faculty'); // faculty, direction, group
  const [editing, setEditing] = useState(null);
  const [parentId, setParentId] = useState(null);
  const [parentName, setParentName] = useState('');
  const [form, setForm] = useState({ name: '', code: '', description: '', course: 1 });
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');

  // Админ может всё
  const canEdit = user.role === 'main_admin';

  const loadData = useCallback(async () => {
    try {
      const [f, d, g] = await Promise.all([
        supabase.from('faculties').select('*').order('name'),
        supabase.from('directions').select('*').order('name'),
        supabase.from('study_groups').select('*').order('name')
      ]);
      setFaculties(f.data || []);
      setDirections(d.data || []);
      setGroups(g.data || []);
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

  // Открыть модалку для создания/редактирования
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
        course: item.course || 1
      });
    } else {
      // Создание
      setForm({ name: '', code: '', description: '', course: 1 });
    }
    
    setShowModal(true);
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setEditing(null);
    setParentId(null);
    setParentName('');
  }, []);

  // Сохранить (создать или обновить)
  const saveItem = useCallback(async () => {
    if (!form.name.trim()) {
      notify.error('Введите название');
      return;
    }
    
    setSubmitting(true);
    
    try {
      if (modalType === 'faculty') {
        const data = { 
          name: form.name.trim(), 
          code: form.code.trim() || null, 
          description: form.description.trim() || null 
        };
        
        if (editing) {
          const { error } = await supabase.from('faculties').update(data).eq('id', editing.id);
          if (error) throw error;
          notify.success('Факультет обновлён');
        } else {
          const { error } = await supabase.from('faculties').insert(data);
          if (error) throw error;
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
          const { error } = await supabase.from('directions').update(data).eq('id', editing.id);
          if (error) throw error;
          notify.success('Направление обновлено');
        } else {
          const { error } = await supabase.from('directions').insert(data);
          if (error) throw error;
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
          direction_id: parentId,
          year: new Date().getFullYear()
        };
        
        if (editing) {
          const { error } = await supabase.from('study_groups').update(data).eq('id', editing.id);
          if (error) throw error;
          notify.success('Группа обновлена');
        } else {
          const { error } = await supabase.from('study_groups').insert(data);
          if (error) throw error;
          notify.success('Группа создана');
        }
      }
      
      invalidateCache('structure');
      closeModal();
      loadData();
      haptic.success();
      
    } catch (error) {
      console.error('Error saving:', error);
      notify.error('Ошибка сохранения: ' + (error.message || 'Неизвестная ошибка'));
      haptic.error();
    } finally {
      setSubmitting(false);
    }
  }, [form, modalType, parentId, editing, loadData, notify, closeModal]);

  // Удалить элемент
  const deleteItem = useCallback(async (type, id, name, e) => {
    e?.stopPropagation();
    
    const messages = { 
      faculty: 'факультет', 
      direction: 'направление', 
      group: 'группу' 
    };
    
    if (!window.confirm(`Удалить ${messages[type]} "${name}"? Это действие нельзя отменить.`)) {
      return;
    }
    
    try {
      let error;
      
      if (type === 'faculty') {
        ({ error } = await supabase.from('faculties').delete().eq('id', id));
      } else if (type === 'direction') {
        ({ error } = await supabase.from('directions').delete().eq('id', id));
      } else if (type === 'group') {
        ({ error } = await supabase.from('study_groups').delete().eq('id', id));
      }
      
      if (error) throw error;
      
      invalidateCache('structure');
      loadData();
      notify.success(`${messages[type].charAt(0).toUpperCase() + messages[type].slice(1)} удалён`);
      haptic.medium();
      
    } catch (error) {
      console.error('Error deleting:', error);
      notify.error('Ошибка удаления');
      haptic.error();
    }
  }, [loadData, notify]);

  // Фильтрация факультетов по поиску
  const filteredFaculties = faculties.filter(f => 
    f.name.toLowerCase().includes(search.toLowerCase()) || 
    (f.code && f.code.toLowerCase().includes(search.toLowerCase()))
  );

  // Заголовок модалки
  const getModalTitle = () => {
    const action = editing ? 'Редактировать' : 'Создать';
    const types = { faculty: 'факультет', direction: 'направление', group: 'группу' };
    let title = `${action} ${types[modalType]}`;
    if (parentName && !editing) {
      title += ` в "${parentName}"`;
    }
    return title;
  };

  return (
    <>
      <PageHeader 
        title="🏛️ Структура" 
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
          ) : filteredFaculties.length === 0 ? (
            <EmptyState 
              icon="🏛️" 
              title="Нет факультетов" 
              text={search ? 'Ничего не найдено' : 'Создайте первый факультет'} 
              action={canEdit && !search && (
                <Button variant="primary" onClick={() => openModal('faculty')}>+ Создать факультет</Button>
              )} 
            />
          ) : (
            <div className="structure-list">
              {filteredFaculties.map((faculty) => {
                const facultyDirections = directions.filter(d => d.faculty_id === faculty.id);
                const isExpanded = expandedFaculty === faculty.id;

                return (
                  <div key={faculty.id} className="structure-item faculty-item">
                    {/* Заголовок факультета */}
                    <div 
                      className="structure-header" 
                      onClick={() => { 
                        haptic.light(); 
                        setExpandedFaculty(isExpanded ? null : faculty.id); 
                        setExpandedDirection(null); 
                      }}
                    >
                      <div className="structure-expand">{isExpanded ? '▼' : '▶'}</div>
                      <div className="structure-icon">🏛️</div>
                      <div className="structure-info">
                        <div className="structure-name">{faculty.name}</div>
                        <div className="structure-meta">
                          {faculty.code && <span className="structure-code">{faculty.code}</span>}
                          <span>{facultyDirections.length} направлений</span>
                        </div>
                      </div>
                      {canEdit && (
                        <div className="structure-actions">
                          <button 
                            className="structure-btn" 
                            onClick={(e) => { e.stopPropagation(); openModal('faculty', null, '', faculty); }}
                            title="Редактировать"
                          >
                            ✏️
                          </button>
                          <button 
                            className="structure-btn" 
                            onClick={(e) => deleteItem('faculty', faculty.id, faculty.name, e)}
                            title="Удалить"
                          >
                            🗑️
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Содержимое факультета (направления) */}
                    {isExpanded && (
                      <div className="structure-children">
                        {canEdit && (
                          <button 
                            className="structure-add-btn" 
                            onClick={() => openModal('direction', faculty.id, faculty.name)}
                          >
                            + Добавить направление
                          </button>
                        )}
                        
                        {facultyDirections.length === 0 ? (
                          <div className="structure-empty">Нет направлений</div>
                        ) : (
                          facultyDirections.map((direction) => {
                            const directionGroups = groups.filter(g => g.direction_id === direction.id);
                            const isDirExpanded = expandedDirection === direction.id;

                            return (
                              <div key={direction.id} className="structure-item direction-item">
                                {/* Заголовок направления */}
                                <div 
                                  className="structure-header" 
                                  onClick={() => { 
                                    haptic.light(); 
                                    setExpandedDirection(isDirExpanded ? null : direction.id); 
                                  }}
                                >
                                  <div className="structure-expand">{isDirExpanded ? '▼' : '▶'}</div>
                                  <div className="structure-icon">📚</div>
                                  <div className="structure-info">
                                    <div className="structure-name">{direction.name}</div>
                                    <div className="structure-meta">
                                      {direction.code && <span className="structure-code">{direction.code}</span>}
                                      <span>{directionGroups.length} групп</span>
                                    </div>
                                  </div>
                                  {canEdit && (
                                    <div className="structure-actions">
                                      <button 
                                        className="structure-btn" 
                                        onClick={(e) => { e.stopPropagation(); openModal('direction', faculty.id, faculty.name, direction); }}
                                        title="Редактировать"
                                      >
                                        ✏️
                                      </button>
                                      <button 
                                        className="structure-btn" 
                                        onClick={(e) => deleteItem('direction', direction.id, direction.name, e)}
                                        title="Удалить"
                                      >
                                        🗑️
                                      </button>
                                    </div>
                                  )}
                                </div>

                                {/* Содержимое направления (группы) */}
                                {isDirExpanded && (
                                  <div className="structure-children">
                                    {canEdit && (
                                      <button 
                                        className="structure-add-btn" 
                                        onClick={() => openModal('group', direction.id, direction.name)}
                                      >
                                        + Добавить группу
                                      </button>
                                    )}
                                    
                                    {directionGroups.length === 0 ? (
                                      <div className="structure-empty">Нет групп</div>
                                    ) : (
                                      directionGroups.map((group) => (
                                        <div key={group.id} className="structure-item group-item">
                                          <div className="structure-header">
                                            <div className="structure-icon">👥</div>
                                            <div className="structure-info">
                                              <div className="structure-name">{group.name}</div>
                                              <div className="structure-meta">
                                                <span>{group.course} курс</span>
                                                {group.year && <span>{group.year} год</span>}
                                              </div>
                                            </div>
                                            {canEdit && (
                                              <div className="structure-actions">
                                                <button 
                                                  className="structure-btn" 
                                                  onClick={(e) => { e.stopPropagation(); openModal('group', direction.id, direction.name, group); }}
                                                  title="Редактировать"
                                                >
                                                  ✏️
                                                </button>
                                                <button 
                                                  className="structure-btn" 
                                                  onClick={(e) => deleteItem('group', group.id, group.name, e)}
                                                  title="Удалить"
                                                >
                                                  🗑️
                                                </button>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </PullToRefresh>

      {/* Модальное окно создания/редактирования */}
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
              'ПИ-21'
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
        )}
      </Modal>
    </>
  );
});

export default FacultiesPage;
