import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import { haptic } from '../utils/haptic';
import { useNotification } from '../context/NotificationContext';
import { 
  PageHeader, 
  EmptyState, 
  Card,
  CardHeader,
  CardIcon,
  CardInfo,
  CardTitle,
  CardDescription,
  CardMeta,
  CardMetaItem,
  CardFooter,
  Button,
  FormField,
  Input,
  Textarea,
  PullToRefresh,
  SkeletonCard,
  Badge
} from '../components/UI';
import { Modal } from '../components/Modal';

/**
 * Faculties Page - Управление структурой университета
 * Иерархия: Факультет → Направление → Группа
 */
export function FacultiesPage() {
  const { notify } = useNotification();
  
  // Данные
  const [faculties, setFaculties] = useState([]);
  const [directions, setDirections] = useState([]);
  const [groups, setGroups] = useState([]);
  
  // Состояние UI
  const [loading, setLoading] = useState(true);
  const [expandedFaculty, setExpandedFaculty] = useState(null);
  const [expandedDirection, setExpandedDirection] = useState(null);
  
  // Модалки
  const [showFacultyModal, setShowFacultyModal] = useState(false);
  const [showDirectionModal, setShowDirectionModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  
  // Редактирование
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [editingDirection, setEditingDirection] = useState(null);
  const [editingGroup, setEditingGroup] = useState(null);
  
  // Формы
  const [facultyForm, setFacultyForm] = useState({ name: '', code: '', description: '' });
  const [directionForm, setDirectionForm] = useState({ name: '', code: '', faculty_id: '' });
  const [groupForm, setGroupForm] = useState({ name: '', course: 1, year: new Date().getFullYear(), direction_id: '' });
  
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [facultiesRes, directionsRes, groupsRes] = await Promise.all([
        supabase.from('faculties').select('*').order('name'),
        supabase.from('directions').select('*').order('name'),
        supabase.from('study_groups').select('*, group_members(count)').order('name')
      ]);
      
      setFaculties(facultiesRes.data || []);
      setDirections(directionsRes.data || []);
      setGroups(groupsRes.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  }, []);

  const handleRefresh = async () => {
    await loadData();
    notify.success('Обновлено');
  };

  // === ФАКУЛЬТЕТЫ ===
  
  const openFacultyModal = (faculty = null) => {
    setEditingFaculty(faculty);
    setFacultyForm(faculty 
      ? { name: faculty.name, code: faculty.code || '', description: faculty.description || '' }
      : { name: '', code: '', description: '' }
    );
    setShowFacultyModal(true);
  };

  const saveFaculty = async () => {
    if (!facultyForm.name.trim()) return;
    setSubmitting(true);
    
    try {
      if (editingFaculty) {
        await supabase.from('faculties').update(facultyForm).eq('id', editingFaculty.id);
        notify.success('Факультет обновлён');
      } else {
        await supabase.from('faculties').insert(facultyForm);
        notify.success('Факультет создан');
      }
      setShowFacultyModal(false);
      loadData();
      haptic.success();
    } catch (error) {
      notify.error('Ошибка сохранения');
      haptic.error();
    } finally {
      setSubmitting(false);
    }
  };

  const deleteFaculty = async (id) => {
    if (!window.confirm('Удалить факультет? Все направления и группы также будут удалены.')) return;
    
    try {
      await supabase.from('faculties').delete().eq('id', id);
      notify.success('Факультет удалён');
      loadData();
      haptic.medium();
    } catch (error) {
      notify.error('Ошибка удаления');
      haptic.error();
    }
  };

  // === НАПРАВЛЕНИЯ ===
  
  const openDirectionModal = (facultyId, direction = null) => {
    setEditingDirection(direction);
    setDirectionForm(direction 
      ? { name: direction.name, code: direction.code || '', faculty_id: direction.faculty_id }
      : { name: '', code: '', faculty_id: facultyId }
    );
    setShowDirectionModal(true);
  };

  const saveDirection = async () => {
    if (!directionForm.name.trim()) return;
    setSubmitting(true);
    
    try {
      if (editingDirection) {
        await supabase.from('directions').update(directionForm).eq('id', editingDirection.id);
        notify.success('Направление обновлено');
      } else {
        await supabase.from('directions').insert(directionForm);
        notify.success('Направление создано');
      }
      setShowDirectionModal(false);
      loadData();
      haptic.success();
    } catch (error) {
      notify.error('Ошибка сохранения');
      haptic.error();
    } finally {
      setSubmitting(false);
    }
  };

  const deleteDirection = async (id) => {
    if (!window.confirm('Удалить направление? Все группы также будут удалены.')) return;
    
    try {
      await supabase.from('directions').delete().eq('id', id);
      notify.success('Направление удалено');
      loadData();
      haptic.medium();
    } catch (error) {
      notify.error('Ошибка удаления');
      haptic.error();
    }
  };

  // === ГРУППЫ ===
  
  const openGroupModal = (directionId, group = null) => {
    setEditingGroup(group);
    setGroupForm(group 
      ? { name: group.name, course: group.course, year: group.year || new Date().getFullYear(), direction_id: group.direction_id }
      : { name: '', course: 1, year: new Date().getFullYear(), direction_id: directionId }
    );
    setShowGroupModal(true);
  };

  const saveGroup = async () => {
    if (!groupForm.name.trim()) return;
    setSubmitting(true);
    
    try {
      if (editingGroup) {
        await supabase.from('study_groups').update(groupForm).eq('id', editingGroup.id);
        notify.success('Группа обновлена');
      } else {
        await supabase.from('study_groups').insert(groupForm);
        notify.success('Группа создана');
      }
      setShowGroupModal(false);
      loadData();
      haptic.success();
    } catch (error) {
      notify.error('Ошибка сохранения');
      haptic.error();
    } finally {
      setSubmitting(false);
    }
  };

  const deleteGroup = async (id) => {
    if (!window.confirm('Удалить группу?')) return;
    
    try {
      await supabase.from('study_groups').delete().eq('id', id);
      notify.success('Группа удалена');
      loadData();
      haptic.medium();
    } catch (error) {
      notify.error('Ошибка удаления');
      haptic.error();
    }
  };

  // Фильтрация
  const filteredFaculties = faculties.filter(f => 
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    (f.code && f.code.toLowerCase().includes(search.toLowerCase()))
  );

  // Получить направления факультета
  const getDirectionsForFaculty = (facultyId) => 
    directions.filter(d => d.faculty_id === facultyId);

  // Получить группы направления
  const getGroupsForDirection = (directionId) => 
    groups.filter(g => g.direction_id === directionId);

  return (
    <>
      <PageHeader
        title="🏛️ Структура"
        action={
          <Button variant="primary" onClick={() => openFacultyModal()}>
            + Факультет
          </Button>
        }
        search={search}
        onSearch={setSearch}
      />

      <PullToRefresh onRefresh={handleRefresh}>
        <div className="page-content">
          {loading ? (
            <div className="cards-grid">
              {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : filteredFaculties.length === 0 ? (
            <EmptyState
              icon="🏛️"
              title="Нет факультетов"
              text="Создайте структуру университета"
              action={
                <Button variant="primary" onClick={() => openFacultyModal()}>
                  + Создать факультет
                </Button>
              }
            />
          ) : (
            <div className="structure-list">
              {filteredFaculties.map((faculty, index) => {
                const facultyDirections = getDirectionsForFaculty(faculty.id);
                const isExpanded = expandedFaculty === faculty.id;
                
                return (
                  <div key={faculty.id} className="structure-item" style={{ animationDelay: `${index * 0.05}s` }}>
                    {/* Факультет */}
                    <div 
                      className={`structure-faculty ${isExpanded ? 'expanded' : ''}`}
                      onClick={() => { 
                        setExpandedFaculty(isExpanded ? null : faculty.id);
                        haptic.light();
                      }}
                    >
                      <div className="structure-faculty-icon">🏛️</div>
                      <div className="structure-faculty-info">
                        <div className="structure-faculty-name">
                          {faculty.code && <span className="structure-code">{faculty.code}</span>}
                          {faculty.name}
                        </div>
                        <div className="structure-faculty-meta">
                          {facultyDirections.length} направлений
                        </div>
                      </div>
                      <div className="structure-actions">
                        <button onClick={(e) => { e.stopPropagation(); openFacultyModal(faculty); }}>✏️</button>
                        <button onClick={(e) => { e.stopPropagation(); deleteFaculty(faculty.id); }}>🗑</button>
                      </div>
                      <div className={`structure-arrow ${isExpanded ? 'expanded' : ''}`}>›</div>
                    </div>

                    {/* Направления */}
                    {isExpanded && (
                      <div className="structure-directions">
                        <div className="structure-add-btn" onClick={() => openDirectionModal(faculty.id)}>
                          <span>+ Добавить направление</span>
                        </div>
                        
                        {facultyDirections.map(direction => {
                          const directionGroups = getGroupsForDirection(direction.id);
                          const isDirectionExpanded = expandedDirection === direction.id;
                          
                          return (
                            <div key={direction.id} className="structure-direction-wrapper">
                              <div 
                                className={`structure-direction ${isDirectionExpanded ? 'expanded' : ''}`}
                                onClick={() => {
                                  setExpandedDirection(isDirectionExpanded ? null : direction.id);
                                  haptic.light();
                                }}
                              >
                                <div className="structure-direction-icon">📚</div>
                                <div className="structure-direction-info">
                                  <div className="structure-direction-name">
                                    {direction.code && <span className="structure-code">{direction.code}</span>}
                                    {direction.name}
                                  </div>
                                  <div className="structure-direction-meta">
                                    {directionGroups.length} групп
                                  </div>
                                </div>
                                <div className="structure-actions">
                                  <button onClick={(e) => { e.stopPropagation(); openDirectionModal(faculty.id, direction); }}>✏️</button>
                                  <button onClick={(e) => { e.stopPropagation(); deleteDirection(direction.id); }}>🗑</button>
                                </div>
                                <div className={`structure-arrow ${isDirectionExpanded ? 'expanded' : ''}`}>›</div>
                              </div>

                              {/* Группы */}
                              {isDirectionExpanded && (
                                <div className="structure-groups">
                                  <div className="structure-add-btn small" onClick={() => openGroupModal(direction.id)}>
                                    <span>+ Добавить группу</span>
                                  </div>
                                  
                                  {directionGroups.map(group => (
                                    <div key={group.id} className="structure-group">
                                      <div className="structure-group-icon">👥</div>
                                      <div className="structure-group-info">
                                        <div className="structure-group-name">{group.name}</div>
                                        <div className="structure-group-meta">
                                          {group.course} курс • {group.group_members?.[0]?.count || 0} студентов
                                        </div>
                                      </div>
                                      <div className="structure-actions">
                                        <button onClick={() => openGroupModal(direction.id, group)}>✏️</button>
                                        <button onClick={() => deleteGroup(group.id)}>🗑</button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </PullToRefresh>

      {/* Modal факультета */}
      <Modal
        isOpen={showFacultyModal}
        onClose={() => setShowFacultyModal(false)}
        title={editingFaculty ? 'Редактировать факультет' : 'Создать факультет'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowFacultyModal(false)}>Отмена</Button>
            <Button variant="primary" onClick={saveFaculty} disabled={!facultyForm.name.trim() || submitting}>
              {submitting ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </>
        }
      >
        <FormField label="Название">
          <Input
            value={facultyForm.name}
            onChange={(e) => setFacultyForm({ ...facultyForm, name: e.target.value })}
            placeholder="Факультет информационных технологий"
            autoFocus
          />
        </FormField>
        <FormField label="Аббревиатура">
          <Input
            value={facultyForm.code}
            onChange={(e) => setFacultyForm({ ...facultyForm, code: e.target.value })}
            placeholder="ФИТ"
          />
        </FormField>
        <FormField label="Описание">
          <Textarea
            value={facultyForm.description}
            onChange={(e) => setFacultyForm({ ...facultyForm, description: e.target.value })}
            placeholder="Описание факультета..."
          />
        </FormField>
      </Modal>

      {/* Modal направления */}
      <Modal
        isOpen={showDirectionModal}
        onClose={() => setShowDirectionModal(false)}
        title={editingDirection ? 'Редактировать направление' : 'Создать направление'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowDirectionModal(false)}>Отмена</Button>
            <Button variant="primary" onClick={saveDirection} disabled={!directionForm.name.trim() || submitting}>
              {submitting ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </>
        }
      >
        <FormField label="Название">
          <Input
            value={directionForm.name}
            onChange={(e) => setDirectionForm({ ...directionForm, name: e.target.value })}
            placeholder="Информатика и вычислительная техника"
            autoFocus
          />
        </FormField>
        <FormField label="Код направления">
          <Input
            value={directionForm.code}
            onChange={(e) => setDirectionForm({ ...directionForm, code: e.target.value })}
            placeholder="09.03.01"
          />
        </FormField>
      </Modal>

      {/* Modal группы */}
      <Modal
        isOpen={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        title={editingGroup ? 'Редактировать группу' : 'Создать группу'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowGroupModal(false)}>Отмена</Button>
            <Button variant="primary" onClick={saveGroup} disabled={!groupForm.name.trim() || submitting}>
              {submitting ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </>
        }
      >
        <FormField label="Название группы">
          <Input
            value={groupForm.name}
            onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
            placeholder="ИВТ-21-1"
            autoFocus
          />
        </FormField>
        <div className="form-row">
          <FormField label="Курс">
            <select
              className="form-select"
              value={groupForm.course}
              onChange={(e) => setGroupForm({ ...groupForm, course: parseInt(e.target.value) })}
            >
              {[1, 2, 3, 4, 5, 6].map(c => (
                <option key={c} value={c}>{c} курс</option>
              ))}
            </select>
          </FormField>
          <FormField label="Год набора">
            <Input
              type="number"
              value={groupForm.year}
              onChange={(e) => setGroupForm({ ...groupForm, year: parseInt(e.target.value) })}
              min="2000"
              max="2100"
            />
          </FormField>
        </div>
      </Modal>
    </>
  );
}

export default FacultiesPage;
