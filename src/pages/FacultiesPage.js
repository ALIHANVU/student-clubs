/**
 * FacultiesPage — Оптимизированная (облегчённая)
 */
import React, { useState, useEffect, useCallback, memo } from 'react';
import { supabase, invalidateCache } from '../utils/supabase';
import { haptic } from '../utils/haptic';
import { useNotification } from '../context/NotificationContext';
import { PageHeader, EmptyState, Button, FormField, Input, Textarea, PullToRefresh, SkeletonList } from '../components/UI';
import { Modal } from '../components/Modal';
import { MobilePageHeader } from '../components/Navigation';

export const FacultiesPage = memo(function FacultiesPage() {
  const { notify } = useNotification();
  
  const [faculties, setFaculties] = useState([]);
  const [directions, setDirections] = useState([]);
  const [groups, setGroups] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [expandedFaculty, setExpandedFaculty] = useState(null);
  const [expandedDirection, setExpandedDirection] = useState(null);
  
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('faculty');
  const [editing, setEditing] = useState(null);
  const [parentId, setParentId] = useState(null);
  const [form, setForm] = useState({ name: '', code: '', description: '', course: 1 });
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');

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
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleRefresh = useCallback(async () => { 
    setLoading(true);
    await loadData(); 
    notify.success('Обновлено'); 
  }, [loadData, notify]);

  const openModal = useCallback((type, parent = null, item = null) => {
    setModalType(type);
    setParentId(parent);
    setEditing(item);
    setForm(item ? { name: item.name, code: item.code || '', description: item.description || '', course: item.course || 1 } : { name: '', code: '', description: '', course: 1 });
    setShowModal(true);
  }, []);

  const saveItem = useCallback(async () => {
    if (!form.name.trim()) return;
    setSubmitting(true);
    
    try {
      const table = modalType === 'faculty' ? 'faculties' : modalType === 'direction' ? 'directions' : 'study_groups';
      const data = modalType === 'faculty' 
        ? { name: form.name, code: form.code, description: form.description }
        : modalType === 'direction'
        ? { name: form.name, code: form.code, faculty_id: parentId }
        : { name: form.name, course: form.course, direction_id: parentId, year: new Date().getFullYear() };

      if (editing) {
        await supabase.from(table).update(data).eq('id', editing.id);
      } else {
        await supabase.from(table).insert(data);
      }
      
      invalidateCache('structure');
      setShowModal(false);
      loadData();
      notify.success(editing ? 'Обновлено' : 'Создано');
      haptic.success();
    } catch (error) {
      notify.error('Ошибка');
      haptic.error();
    } finally {
      setSubmitting(false);
    }
  }, [form, modalType, parentId, editing, loadData, notify]);

  const deleteItem = useCallback(async (type, id, e) => {
    e?.stopPropagation();
    const messages = { faculty: 'факультет', direction: 'направление', group: 'группу' };
    if (!window.confirm('Удалить ' + messages[type] + '?')) return;
    
    try {
      const table = type === 'faculty' ? 'faculties' : type === 'direction' ? 'directions' : 'study_groups';
      await supabase.from(table).delete().eq('id', id);
      invalidateCache('structure');
      loadData();
      notify.success('Удалено');
      haptic.medium();
    } catch (error) {
      notify.error('Ошибка удаления');
      haptic.error();
    }
  }, [loadData, notify]);

  const filteredFaculties = faculties.filter(f => 
    f.name.toLowerCase().includes(search.toLowerCase()) || 
    (f.code && f.code.toLowerCase().includes(search.toLowerCase()))
  );

  const getModalTitle = () => {
    const action = editing ? 'Редактировать' : 'Создать';
    const type = modalType === 'faculty' ? 'факультет' : modalType === 'direction' ? 'направление' : 'группу';
    return action + ' ' + type;
  };

  return (
    <React.Fragment>
      <PageHeader title="Структура" action={<Button variant="primary" onClick={() => openModal('faculty')}>+ Факультет</Button>} search={search} onSearch={setSearch} />
      <MobilePageHeader title="Структура" showSearch searchValue={search} onSearchChange={setSearch} actions={[{ icon: 'plus', onClick: () => openModal('faculty'), primary: true }]} />

      <PullToRefresh onRefresh={handleRefresh}>
        <div className="page-content">
          {loading ? (
            <SkeletonList count={5} />
          ) : filteredFaculties.length === 0 ? (
            <EmptyState icon="🏛️" title="Нет факультетов" text="Создайте первый факультет" action={<Button variant="primary" onClick={() => openModal('faculty')}>+ Создать</Button>} />
          ) : (
            <div className="structure-list">
              {filteredFaculties.map((faculty) => {
                const facultyDirections = directions.filter(d => d.faculty_id === faculty.id);
                const isExpanded = expandedFaculty === faculty.id;

                return (
                  <div key={faculty.id} className="structure-item faculty-item">
                    <div className="structure-header" onClick={() => { haptic.light(); setExpandedFaculty(isExpanded ? null : faculty.id); setExpandedDirection(null); }}>
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
                        <button className="structure-btn" onClick={(e) => { e.stopPropagation(); openModal('faculty', null, faculty); }}>✏️</button>
                        <button className="structure-btn" onClick={(e) => deleteItem('faculty', faculty.id, e)}>🗑️</button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="structure-children">
                        <button className="structure-add-btn" onClick={() => openModal('direction', faculty.id)}>+ Добавить направление</button>
                        
                        {facultyDirections.length === 0 ? (
                          <div className="structure-empty">Нет направлений</div>
                        ) : (
                          facultyDirections.map((direction) => {
                            const directionGroups = groups.filter(g => g.direction_id === direction.id);
                            const isDirExpanded = expandedDirection === direction.id;

                            return (
                              <div key={direction.id} className="structure-item direction-item">
                                <div className="structure-header" onClick={() => { haptic.light(); setExpandedDirection(isDirExpanded ? null : direction.id); }}>
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
                                    <button className="structure-btn" onClick={(e) => { e.stopPropagation(); openModal('direction', faculty.id, direction); }}>✏️</button>
                                    <button className="structure-btn" onClick={(e) => deleteItem('direction', direction.id, e)}>🗑️</button>
                                  </div>
                                </div>

                                {isDirExpanded && (
                                  <div className="structure-children">
                                    <button className="structure-add-btn" onClick={() => openModal('group', direction.id)}>+ Добавить группу</button>
                                    
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
                                                <span>{group.group_members?.[0]?.count || 0} студентов</span>
                                              </div>
                                            </div>
                                            <div className="structure-actions">
                                              <button className="structure-btn" onClick={() => openModal('group', direction.id, group)}>✏️</button>
                                              <button className="structure-btn" onClick={(e) => deleteItem('group', group.id, e)}>🗑️</button>
                                            </div>
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

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={getModalTitle()} footer={
        <React.Fragment>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Отмена</Button>
          <Button variant="primary" onClick={saveItem} disabled={!form.name.trim() || submitting}>{submitting ? 'Сохранение...' : 'Сохранить'}</Button>
        </React.Fragment>
      }>
        <FormField label="Название"><Input value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} placeholder={modalType === 'faculty' ? 'Факультет информатики' : modalType === 'direction' ? 'Программная инженерия' : 'ПИ-21'} autoFocus /></FormField>
        {(modalType === 'faculty' || modalType === 'direction') && (
          <FormField label="Код (необязательно)"><Input value={form.code} onChange={(e) => setForm(prev => ({ ...prev, code: e.target.value }))} placeholder={modalType === 'faculty' ? 'ФИТ' : '09.03.04'} /></FormField>
        )}
        {modalType === 'faculty' && (
          <FormField label="Описание"><Textarea value={form.description} onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))} placeholder="Описание факультета..." /></FormField>
        )}
        {modalType === 'group' && (
          <FormField label="Курс">
            <select className="form-select" value={form.course} onChange={(e) => setForm(prev => ({ ...prev, course: parseInt(e.target.value) }))}>
              {[1, 2, 3, 4, 5, 6].map(c => <option key={c} value={c}>{c} курс</option>)}
            </select>
          </FormField>
        )}
      </Modal>
    </React.Fragment>
  );
});

export default FacultiesPage;
