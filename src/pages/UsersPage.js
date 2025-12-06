/**
 * UsersPage — Оптимизированная
 */
import React, { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { supabase, invalidateCache } from '../utils/supabase';
import { haptic } from '../utils/haptic';
import { useNotification } from '../context/NotificationContext';
import { getRoleName, getInitials } from '../utils/helpers';
import { PageHeader, EmptyState, FilterTabs, Button, FormField, Input, Badge, PullToRefresh, SkeletonList } from '../components/UI';
import { Modal } from '../components/Modal';
import { MobilePageHeader } from '../components/Navigation';

const ROLES = [
  { id: 'student', label: 'Студент' },
  { id: 'group_leader', label: 'Староста' },
  { id: 'club_admin', label: 'Админ клуба' },
  { id: 'main_admin', label: 'Главный админ' }
];

export const UsersPage = memo(function UsersPage() {
  const { notify } = useNotification();
  
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({ full_name: '', email: '', role: 'student', group_id: '' });
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [usersRes, groupsRes] = await Promise.all([
        supabase.from('users').select('*, study_groups(name, directions(name, faculties(name)))').order('created_at', { ascending: false }),
        supabase.from('study_groups').select('*, directions(name, faculties(name))').order('name')
      ]);
      setUsers(usersRes.data || []);
      setGroups(groupsRes.data || []);
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

  const openEditModal = useCallback((user) => {
    setEditingUser(user);
    setUserForm({ full_name: user.full_name, email: user.email, role: user.role, group_id: user.group_id || '' });
    setShowModal(true);
    haptic.light();
  }, []);

  const saveUser = useCallback(async () => {
    if (!userForm.full_name.trim() || !userForm.email.trim()) return;
    setSubmitting(true);
    try {
      await supabase.from('users').update({ 
        full_name: userForm.full_name, 
        email: userForm.email.toLowerCase().trim(), 
        role: userForm.role, 
        group_id: userForm.group_id || null 
      }).eq('id', editingUser.id);
      
      invalidateCache('users');
      notify.success('Пользователь обновлён');
      setShowModal(false);
      loadData();
      haptic.success();
    } catch (error) {
      notify.error('Ошибка сохранения');
      haptic.error();
    } finally {
      setSubmitting(false);
    }
  }, [userForm, editingUser, loadData, notify]);

  const deleteUser = useCallback(async (id, name) => {
    if (!window.confirm('Удалить пользователя "' + name + '"?')) return;
    try {
      await supabase.from('users').delete().eq('id', id);
      invalidateCache('users');
      notify.success('Пользователь удалён');
      loadData();
      haptic.medium();
    } catch (error) {
      notify.error('Ошибка удаления');
      haptic.error();
    }
  }, [loadData, notify]);

  const filteredUsers = useMemo(() => {
    let result = users.filter(u => 
      u.full_name.toLowerCase().includes(search.toLowerCase()) || 
      u.email.toLowerCase().includes(search.toLowerCase())
    );
    if (filter !== 'all') result = result.filter(u => u.role === filter);
    return result;
  }, [users, search, filter]);

  const filterTabs = useMemo(() => [
    { id: 'all', label: 'Все' }, 
    ...ROLES.map(r => ({ id: r.id, label: r.label }))
  ], []);

  const getRoleBadgeVariant = (role) => {
    const variants = { main_admin: 'red', club_admin: 'orange', group_leader: 'green', student: 'blue' };
    return variants[role] || 'default';
  };

  return (
    <React.Fragment>
      <PageHeader title="Пользователи" search={search} onSearch={setSearch} />
      <MobilePageHeader title="Пользователи" showSearch searchValue={search} onSearchChange={setSearch} />

      <PullToRefresh onRefresh={handleRefresh}>
        <div className="page-content">
          <FilterTabs tabs={filterTabs} activeTab={filter} onChange={setFilter} />

          {loading ? (
            <SkeletonList count={8} />
          ) : filteredUsers.length === 0 ? (
            <EmptyState icon="👥" title="Нет пользователей" text={search ? 'Попробуйте другой запрос' : 'Пользователи не найдены'} />
          ) : (
            <div className="users-list">
              {filteredUsers.map((user) => (
                <div key={user.id} className="user-item" onClick={() => openEditModal(user)}>
                  <div className="user-avatar-large">{getInitials(user.full_name)}</div>
                  <div className="user-details">
                    <div className="user-name-row">
                      <span className="user-full-name">{user.full_name}</span>
                      <Badge variant={getRoleBadgeVariant(user.role)}>{getRoleName(user.role)}</Badge>
                    </div>
                    <div className="user-email">{user.email}</div>
                    {user.study_groups && (
                      <div className="user-group">{user.study_groups.name} - {user.study_groups.directions?.faculties?.name}</div>
                    )}
                  </div>
                  <button className="user-delete-btn" onClick={(e) => { e.stopPropagation(); deleteUser(user.id, user.full_name); }}>🗑️</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </PullToRefresh>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Редактировать пользователя" footer={
        <React.Fragment>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Отмена</Button>
          <Button variant="primary" onClick={saveUser} disabled={!userForm.full_name.trim() || !userForm.email.trim() || submitting}>{submitting ? 'Сохранение...' : 'Сохранить'}</Button>
        </React.Fragment>
      }>
        <FormField label="Имя и фамилия"><Input value={userForm.full_name} onChange={(e) => setUserForm(prev => ({ ...prev, full_name: e.target.value }))} placeholder="Иванов Иван" autoFocus /></FormField>
        <FormField label="Email"><Input type="email" value={userForm.email} onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))} placeholder="email@example.com" /></FormField>
        <FormField label="Роль">
          <select className="form-select" value={userForm.role} onChange={(e) => setUserForm(prev => ({ ...prev, role: e.target.value }))}>
            {ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
        </FormField>
        <FormField label="Группа">
          <select className="form-select" value={userForm.group_id} onChange={(e) => setUserForm(prev => ({ ...prev, group_id: e.target.value }))}>
            <option value="">Без группы</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name} - {g.directions?.faculties?.name}</option>)}
          </select>
        </FormField>
      </Modal>
    </React.Fragment>
  );
});

export default UsersPage;
