import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import { haptic } from '../utils/haptic';
import { useNotification } from '../context/NotificationContext';
import { PageHeader, EmptyState, Button, FormField, Input, Textarea, PullToRefresh, SkeletonList } from '../components/UI';
import { Modal } from '../components/Modal';
import { MobilePageHeader } from '../components/MobileNav';

export function FacultiesPage() {
  const { notify } = useNotification();
  
  const [faculties, setFaculties] = useState([]);
  const [directions, setDirections] = useState([]);
  const [groups, setGroups] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [expandedFaculty, setExpandedFaculty] = useState(null);
  const [expandedDirection, setExpandedDirection] = useState(null);
  
  const [showFacultyModal, setShowFacultyModal] = useState(false);
  const [showDirectionModal, setShowDirectionModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [editingDirection, setEditingDirection] = useState(null);
  const [editingGroup, setEditingGroup] = useState(null);
  
  const [facultyForm, setFacultyForm] = useState({ name: '', code: '', description: '' });
  const [directionForm, setDirectionForm] = useState({ name: '', code: '', faculty_id: '' });
  const [groupForm, setGroupForm] = useState({ name: '', course: 1, year: new Date().getFullYear(), direction_id: '' });
  
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = useCallback(async () => {
    try {
      const [f, d, g] = await Promise.all([
        supabase.from('faculties').select('*').order('name'),
        supabase.from('directions').select('*').order('name'),
        supabase.from('study_groups').select('*, group_members(count)').order('name')
      ]);
      setFaculties(f.data || []);
      setDirections(d.data || []);
      setGroups(g.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  }, []);

  const handleRefresh = async () => { await loadData(); notify.success('Обновлено'); };

  const toggleFaculty = (id) => {
    haptic.light();
    setExpandedFaculty(expandedFaculty === id ? null : id);
    setExpandedDirection(null);
  };

  const toggleDirection = (id) => {
    haptic.light();
    setExpandedDirection(expandedDirection === id ? null : id);
  };

  const openFacultyModal = (faculty = null) => {
    setEditingFaculty(faculty);
    setFacultyForm(faculty ? { name: faculty.name, code: faculty.code || '', description: faculty.description || '' } : { name: '', code: '', description: '' });
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

  const deleteFaculty = async (id, e) => {
    e.stopPropagation();
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

  const openDirectionModal = (facultyId, direction = null) => {
    setEditingDirection(direction);
    setDirectionForm(direction ? { name: direction.name, code: direction.code || '', faculty_id: direction.faculty_id } : { name: '', code: '', faculty_id: facultyId });
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

  const deleteDirection = async (id, e) => {
    e.stopPropagation();
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

  const openGroupModal = (directionId, group = null) => {
    setEditingGroup(group);
    setGroupForm(group ? { name: group.name, course: group.course, year: group.year || new Date().getFullYear(), direction_id: group.direction_id } : { name: '', course: 1, year: new Date().getFullYear(), direction_id: directionId });
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

  const deleteGroup = async (id, e) => {
    e.stopPropagation();
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

  const filteredFaculties = faculties.filter(f => 
    f.name.toLowerCase().includes(search.toLowerCase()) || 
    (f.code && f.code.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
      <PageHeader title="🏛️ Структура" action={<Button variant="primary" onClick={() => openFacultyModal()}>+ Факультет</Button>} search={search} onSearch={setSearch} />
      <MobilePageHeader title="Структура" showSearch searchValue={search} onSearchChange={setSearch} actions={[{ icon: 'plus', onClick: () => openFacultyModal(), primary: true }]} />

      <PullToRefresh onRefresh={handleRefresh}>
        <div className="page-content">
          {loading ? (
            <SkeletonList count={5} />
          ) : filteredFaculties.length === 0 ? (
            <EmptyState icon="🏛️" title="Нет факультетов" text="Создайте первый факультет" action={<Button variant="primary" onClick={() => openFacultyModal()}>+ Создать</Button>} />
          ) : (
            <div className="structure-list">
              {filteredFaculties.map((faculty, fIndex) => {
                const facultyDirections = directions.filter(d => d.faculty_id === faculty.id);
                const isExpanded = expandedFaculty === faculty.id;

                return (
                  <div key={faculty.id} className="structure-item faculty-item" style={{ animationDelay: `${fIndex * 0.05}s` }}>
                    <div className="structure-header" onClick={() => toggleFaculty(faculty.id)}>
                      <div className="structure-expand">{isExpanded ? '▼' : '▶'}</div>
                      <div className="structure-icon">🏛️</div>
                      <div className="structure-info">
                        <div className="structure-name">{faculty.name}</div>
                        <div className="structure-meta">
                          {faculty.code && <span className="structure-code">{faculty.code}</span>}
                          <span>{facultyDirections.length} направлений</span>
                        </div>
                      </div>
                      <div className="structure-actions">
                        <button className="structure-btn edit" onClick={(e) => { e.stopPropagation(); openFacultyModal(faculty); }}>✏️</button>
                        <button className="structure-btn delete" onClick={(e) => deleteFaculty(faculty.id, e)}>🗑️</button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="structure-children">
                        <button className="structure-add-btn" onClick={() => openDirectionModal(faculty.id)}>+ Добавить направление</button>
                        
                        {facultyDirections.length === 0 ? (
                          <div className="structure-empty">Нет направлений</div>
                        ) : (
                          facultyDirections.map((direction) => {
                            const directionGroups = groups.filter(g => g.direction_id === direction.id);
                            const isDirExpanded = expandedDirection === direction.id;

                            return (
                              <div key={direction.id} className="structure-item direction-item">
                                <div className="structure-header" onClick={() => toggleDirection(direction.id)}>
                                  <div className="structure-expand">{isDirExpanded ? '▼' : '▶'}</div>
                                  <div className="structure-icon">📚</div>
                                  <div className="structure-info">
                                    <div className="structure-name">{direction.name}</div>
                                    <div className="structure-meta">
                                      {direction.code && <span className="structure-code">{direction.code}</span>}
                                      <span>{directionGroups.length} групп</span>
                                    </div>
                                  </div>
                                  <div className="structure-actions">
                                    <button className="structure-btn edit" onClick={(e) => { e.stopPropagation(); openDirectionModal(faculty.id, direction); }}>✏️</button>
                                    <button className="structure-btn delete" onClick={(e) => deleteDirection(direction.id, e)}>🗑️</button>
                                  </div>
                                </div>

                                {isDirExpanded && (
                                  <div className="structure-children">
                                    <button className="structure-add-btn" onClick={() => openGroupModal(direction.id)}>+ Добавить группу</button>
                                    
                                    {directionGroups.length === 0 ? (
                                      <div className="structure-empty">Нет групп</div>
                                    ) : (
                                      directionGroups.map((group) => {
                                        const memberCount = group.group_members?.[0]?.count || 0;
                                        return (
                                          <div key={group.id} className="structure-item group-item">
                                            <div className="structure-header">
                                              <div className="structure-icon">👥</div>
                                              <div className="structure-info">
                                                <div className="structure-name">{group.name}</div>
                                                <div className="structure-meta">
                                                  <span>{group.course} курс</span>
                                                  <span>{memberCount} студентов</span>
                                                </div>
                                              </div>
                                              <div className="structure-actions">
                                                <button className="structure-btn edit" onClick={() => openGroupModal(direction.id, group)}>✏️</button>
                                                <button className="structure-btn delete" onClick={(e) => deleteGroup(group.id, e)}>🗑️</button>
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })
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

      {/* Faculty Modal */}
      <Modal isOpen={showFacultyModal} onClose={() => setShowFacultyModal(false)} title={editingFaculty ? 'Редактировать факультет' : 'Создать факультет'} footer={
        <>
          <Button variant="secondary" onClick={() => setShowFacultyModal(false)}>Отмена</Button>
          <Button variant="primary" onClick={saveFaculty} disabled={!facultyForm.name.trim() || submitting}>{submitting ? 'Сохранение...' : 'Сохранить'}</Button>
        </>
      }>
        <FormField label="Название"><Input value={facultyForm.name} onChange={(e) => setFacultyForm({ ...facultyForm, name: e.target.value })} placeholder="Факультет информатики" autoFocus /></FormField>
        <FormField label="Код (необязательно)"><Input value={facultyForm.code} onChange={(e) => setFacultyForm({ ...facultyForm, code: e.target.value })} placeholder="ФИТ" /></FormField>
        <FormField label="Описание"><Textarea value={facultyForm.description} onChange={(e) => setFacultyForm({ ...facultyForm, description: e.target.value })} placeholder="Описание факультета..." /></FormField>
      </Modal>

      {/* Direction Modal */}
      <Modal isOpen={showDirectionModal} onClose={() => setShowDirectionModal(false)} title={editingDirection ? 'Редактировать направление' : 'Создать направление'} footer={
        <>
          <Button variant="secondary" onClick={() => setShowDirectionModal(false)}>Отмена</Button>
          <Button variant="primary" onClick={saveDirection} disabled={!directionForm.name.trim() || submitting}>{submitting ? 'Сохранение...' : 'Сохранить'}</Button>
        </>
      }>
        <FormField label="Название"><Input value={directionForm.name} onChange={(e) => setDirectionForm({ ...directionForm, name: e.target.value })} placeholder="Программная инженерия" autoFocus /></FormField>
        <FormField label="Код (необязательно)"><Input value={directionForm.code} onChange={(e) => setDirectionForm({ ...directionForm, code: e.target.value })} placeholder="09.03.04" /></FormField>
      </Modal>

      {/* Group Modal */}
      <Modal isOpen={showGroupModal} onClose={() => setShowGroupModal(false)} title={editingGroup ? 'Редактировать группу' : 'Создать группу'} footer={
        <>
          <Button variant="secondary" onClick={() => setShowGroupModal(false)}>Отмена</Button>
          <Button variant="primary" onClick={saveGroup} disabled={!groupForm.name.trim() || submitting}>{submitting ? 'Сохранение...' : 'Сохранить'}</Button>
        </>
      }>
        <FormField label="Название группы"><Input value={groupForm.name} onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })} placeholder="ПИ-21" autoFocus /></FormField>
        <FormField label="Курс">
          <select className="form-select" value={groupForm.course} onChange={(e) => setGroupForm({ ...groupForm, course: parseInt(e.target.value) })}>
            {[1, 2, 3, 4, 5, 6].map(c => <option key={c} value={c}>{c} курс</option>)}
          </select>
        </FormField>
        <FormField label="Год поступления">
          <select className="form-select" value={groupForm.year} onChange={(e) => setGroupForm({ ...groupForm, year: parseInt(e.target.value) })}>
            {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </FormField>
      </Modal>
    </>
  );
}

export default FacultiesPage;
