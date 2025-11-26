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
  PullToRefresh,
  SkeletonCard
} from '../components/UI';
import { Modal } from '../components/Modal';

/**
 * Groups Page - Управление учебными группами
 */
export function GroupsPage() {
  const { notify } = useNotification();
  const [groups, setGroups] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);
  const [editingGroup, setEditingGroup] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    faculty_id: '',
    course: 1,
    year: new Date().getFullYear()
  });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [groupsRes, facultiesRes] = await Promise.all([
        supabase
          .from('study_groups')
          .select('*, faculties(name), group_members(count)')
          .order('name'),
        supabase
          .from('faculties')
          .select('id, name')
          .order('name')
      ]);
      
      setGroups(groupsRes.data || []);
      setFaculties(facultiesRes.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading groups:', error);
      setLoading(false);
    }
  }, []);

  const handleRefresh = async () => {
    await loadData();
    notify.success('Обновлено');
  };

  const openCreateModal = () => {
    setEditingGroup(null);
    setFormData({ 
      name: '', 
      faculty_id: faculties[0]?.id || '',
      course: 1,
      year: new Date().getFullYear()
    });
    setShowModal(true);
  };

  const openEditModal = (group) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      faculty_id: group.faculty_id || '',
      course: group.course || 1,
      year: group.year || new Date().getFullYear()
    });
    setShowModal(true);
    haptic.light();
  };

  const openMembersModal = async (group) => {
    setSelectedGroup(group);
    setShowMembersModal(true);
    haptic.light();
    
    try {
      const { data } = await supabase
        .from('group_members')
        .select('*, users(id, full_name, email)')
        .eq('group_id', group.id);
      setGroupMembers(data || []);
    } catch (error) {
      console.error('Error loading members:', error);
    }
  };

  const saveGroup = async () => {
    if (!formData.name.trim()) return;

    setSubmitting(true);
    try {
      if (editingGroup) {
        await supabase
          .from('study_groups')
          .update(formData)
          .eq('id', editingGroup.id);
        notify.success('Группа обновлена');
      } else {
        await supabase.from('study_groups').insert(formData);
        notify.success('Группа создана');
      }
      
      setShowModal(false);
      loadData();
      haptic.success();
    } catch (error) {
      console.error('Error saving group:', error);
      notify.error('Ошибка сохранения');
      haptic.error();
    } finally {
      setSubmitting(false);
    }
  };

  const deleteGroup = async (id, name) => {
    if (!window.confirm(`Удалить группу "${name}"?`)) return;

    try {
      await supabase.from('study_groups').delete().eq('id', id);
      notify.success('Группа удалена');
      loadData();
      haptic.medium();
    } catch (error) {
      console.error('Error deleting group:', error);
      notify.error('Ошибка удаления');
      haptic.error();
    }
  };

  const removeMember = async (memberId) => {
    if (!window.confirm('Удалить студента из группы?')) return;

    try {
      await supabase.from('group_members').delete().eq('id', memberId);
      setGroupMembers(prev => prev.filter(m => m.id !== memberId));
      notify.success('Студент удалён из группы');
      haptic.medium();
      loadData();
    } catch (error) {
      console.error('Error removing member:', error);
      notify.error('Ошибка удаления');
      haptic.error();
    }
  };

  const filteredGroups = groups.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <PageHeader
        title="👥 Группы"
        action={
          <Button variant="primary" onClick={openCreateModal}>
            + Создать
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
          ) : filteredGroups.length === 0 ? (
            <EmptyState
              icon="👥"
              title="Нет групп"
              text="Создайте первую учебную группу"
              action={
                <Button variant="primary" onClick={openCreateModal}>
                  + Создать группу
                </Button>
              }
            />
          ) : (
            <div className="cards-grid">
              {filteredGroups.map((group, index) => (
                <Card key={group.id} delay={index}>
                  <CardHeader>
                    <CardIcon>👥</CardIcon>
                    <CardInfo>
                      <CardTitle>{group.name}</CardTitle>
                      <CardDescription>
                        {group.faculties?.name || 'Факультет не указан'}
                      </CardDescription>
                      <CardMeta>
                        <CardMetaItem icon="📚">
                          {group.course} курс
                        </CardMetaItem>
                        <CardMetaItem icon="👤">
                          {group.group_members?.[0]?.count || 0} студентов
                        </CardMetaItem>
                      </CardMeta>
                    </CardInfo>
                  </CardHeader>

                  <CardFooter>
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() => openMembersModal(group)}
                    >
                      👤 Студенты
                    </Button>
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() => openEditModal(group)}
                    >
                      ✏️
                    </Button>
                    <Button
                      variant="danger"
                      size="small"
                      onClick={() => deleteGroup(group.id, group.name)}
                    >
                      🗑
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </PullToRefresh>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingGroup ? 'Редактировать группу' : 'Создать группу'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Отмена
            </Button>
            <Button
              variant="primary"
              onClick={saveGroup}
              disabled={!formData.name.trim() || submitting}
            >
              {submitting ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </>
        }
      >
        <FormField label="Название группы">
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Например: ИВТ-21-1"
            autoFocus
          />
        </FormField>

        <FormField label="Факультет">
          <select
            className="form-select"
            value={formData.faculty_id}
            onChange={(e) => setFormData({ ...formData, faculty_id: e.target.value })}
          >
            <option value="">Выберите факультет</option>
            {faculties.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </FormField>

        <div className="form-row">
          <FormField label="Курс">
            <select
              className="form-select"
              value={formData.course}
              onChange={(e) => setFormData({ ...formData, course: parseInt(e.target.value) })}
            >
              {[1, 2, 3, 4, 5, 6].map(c => (
                <option key={c} value={c}>{c} курс</option>
              ))}
            </select>
          </FormField>

          <FormField label="Год набора">
            <Input
              type="number"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
              min="2000"
              max="2100"
            />
          </FormField>
        </div>
      </Modal>

      {/* Members Modal */}
      <Modal
        isOpen={showMembersModal}
        onClose={() => setShowMembersModal(false)}
        title={`Студенты группы ${selectedGroup?.name || ''}`}
      >
        {groupMembers.length === 0 ? (
          <EmptyState
            icon="👤"
            title="Нет студентов"
            text="В этой группе пока нет студентов"
            small
          />
        ) : (
          <div className="members-list">
            {groupMembers.map(member => (
              <div key={member.id} className="member-item">
                <div className="member-avatar">
                  {member.users?.full_name?.charAt(0) || '?'}
                </div>
                <div className="member-info">
                  <div className="member-name">{member.users?.full_name || 'Неизвестно'}</div>
                  <div className="member-email">{member.users?.email}</div>
                </div>
                <button 
                  className="member-remove"
                  onClick={() => removeMember(member.id)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </>
  );
}

export default GroupsPage;
