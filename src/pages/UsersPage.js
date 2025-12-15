/**
 * UsersPage — с назначением старосты группы
 */
import React, { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { supabase, invalidateCache } from '../utils/supabase';
import { haptic } from '../utils/haptic';
import { useNotification } from '../context/NotificationContext';
import { useApp } from '../context/AppContext';
import { getRoleName, getInitials } from '../utils/helpers';
import { PageHeader, EmptyState, FilterTabs, Button, FormField, Input, Badge, PullToRefresh, SkeletonList } from '../components/UI';
import { Modal } from '../components/Modal';
import { MobilePageHeader } from '../components/Navigation';

const ROLES = [
  { id: 'student', label: 'Студент', description: 'Обычный пользователь' },
  { id: 'group_leader', label: 'Староста', description: 'Может редактировать расписание и отправлять уведомления группе' },
  { id: 'club_admin', label: 'Админ клуба', description: 'Управляет своим клубом' },
  { id: 'main_admin', label: 'Главный админ', description: 'Полный доступ ко всему' }
];

export const UsersPage = memo(function UsersPage() {
  const { user: currentUser } = useApp();
  const { notify } = useNotification();
  
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [subgroups, setSubgroups] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [directions, setDirections] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({ 
    full_name: '', 
    email: '', 
    role: 'student', 
    group_id: '',
    subgroup_id: '',
    managed_club_id: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const canEdit = currentUser.role === 'main_admin';

  const loadData = useCallback(async () => {
    try {
      const [usersRes, groupsRes, subgroupsRes, clubsRes, directionsRes, facultiesRes] = await Promise.all([
        supabase
          .from('users')
          .select('*, study_groups(name, direction_id), subgroups(name)')
          .order('created_at', { ascending: false }),
        supabase
          .from('study_groups')
          .select('*, directions(name, faculty_id)')
          .order('name'),
        supabase
          .from('subgroups')
          .select('*')
          .order('name'),
        supabase
          .from('clubs')
          .select('id, name, icon, admin_id')
          .order('name'),
        supabase
          .from('directions')
          .select('*')
          .order('name'),
        supabase
          .from('faculties')
          .select('*')
          .order('name')
      ]);
      
      setUsers(usersRes.data || []);
      setGroups(groupsRes.data || []);
      setSubgroups(subgroupsRes.data || []);
      setClubs(clubsRes.data || []);
      setDirections(directionsRes.data || []);
      setFaculties(facultiesRes.data || []);
    } catch (error) {
      console.error('Error:', error);
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

  const openEditModal = useCallback((user) => {
    setEditingUser(user);
    
    const managedClub = clubs.find(c => c.admin_id === user.id);
    
    setUserForm({ 
      full_name: user.full_name || '', 
      email: user.email || '', 
      role: user.role || 'student', 
      group_id: user.group_id || '',
      subgroup_id: user.subgroup_id || '',
      managed_club_id: managedClub?.id || ''
    });
    setShowModal(true);
    haptic.light();
  }, [clubs]);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setEditingUser(null);
  }, []);

  const saveUser = useCallback(async () => {
    if (!userForm.full_name.trim() || !userForm.email.trim()) {
      notify.error('Заполните имя и email');
      return;
    }
    
    setSubmitting(true);
    try {
      // Обновляем пользователя
      const { error: userError } = await supabase
        .from('users')
        .update({ 
          full_name: userForm.full_name.trim(), 
          email: userForm.email.toLowerCase().trim(), 
          role: userForm.role, 
          group_id: userForm.group_id || null,
          subgroup_id: userForm.subgroup_id || null
        })
        .eq('id', editingUser.id);
      
      if (userError) throw userError;

      // Если назначен старостой — обновляем группу
      if (userForm.role === 'group_leader' && userForm.group_id) {
        // Убираем этого пользователя как старосту из всех групп
        await supabase
          .from('study_groups')
          .update({ leader_id: null })
          .eq('leader_id', editingUser.id);
        
        // Назначаем старостой выбранной группы
        const { error: groupError } = await supabase
          .from('study_groups')
          .update({ leader_id: editingUser.id })
          .eq('id', userForm.group_id);
        
        if (groupError) throw groupError;
      } else if (userForm.role !== 'group_leader') {
        // Если роль изменилась — убираем из старост
        await supabase
          .from('study_groups')
          .update({ leader_id: null })
          .eq('leader_id', editingUser.id);
      }

      // Если назначен админом клуба
      if (userForm.role === 'club_admin' && userForm.managed_club_id) {
        await supabase
          .from('clubs')
          .update({ admin_id: null })
          .eq('admin_id', editingUser.id);
        
        await supabase
          .from('clubs')
          .update({ admin_id: editingUser.id })
          .eq('id', userForm.managed_club_id);
      } else if (userForm.role !== 'club_admin') {
        await supabase
          .from('clubs')
          .update({ admin_id: null })
          .eq('admin_id', editingUser.id);
      }
      
      invalidateCache('users');
      notify.success('Пользователь обновлён');
      closeModal();
      loadData();
      haptic.success();
    } catch (error) {
      console.error('Error:', error);
      notify.error('Ошибка сохранения');
      haptic.error();
    } finally {
      setSubmitting(false);
    }
  }, [userForm, editingUser, loadData, notify, closeModal]);

  const deleteUser = useCallback(async (id, name) => {
    if (id === currentUser.id) {
      notify.error('Нельзя удалить самого себя');
      return;
    }
    
    if (!window.confirm(`Удалить пользователя "${name}"?`)) return;
    
    try {
      // Убираем из старост
      await supabase
        .from('study_groups')
        .update({ leader_id: null })
        .eq('leader_id', id);
      
      // Убираем из админов клубов
      await supabase
        .from('clubs')
        .update({ admin_id: null })
        .eq('admin_id', id);
      
      // Удаляем подписки
      await supabase
        .from('club_subscriptions')
        .delete()
        .eq('student_id', id);
      
      // Удаляем пользователя
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) throw error;
      
      invalidateCache('users');
      notify.success('Пользователь удалён');
      loadData();
      haptic.medium();
    } catch (error) {
      console.error('Error:', error);
      notify.error('Ошибка удаления');
      haptic.error();
    }
  }, [currentUser.id, loadData, notify]);

  // Фильтрация
  const filteredUsers = useMemo(() => {
    let result = users.filter(u => 
      u.full_name?.toLowerCase().includes(search.toLowerCase()) || 
      u.email?.toLowerCase().includes(search.toLowerCase())
    );
    if (filter !== 'all') {
      result = result.filter(u => u.role === filter);
    }
    return result;
  }, [users, search, filter]);

  // Подгруппы для выбранной группы
  const filteredSubgroups = useMemo(() => 
    subgroups.filter(s => s.group_id === userForm.group_id),
    [subgroups, userForm.group_id]
  );

  // Группируем группы по факультетам
  const groupedGroups = useMemo(() => {
    const grouped = {};
    groups.forEach(g => {
      const direction = directions.find(d => d.id === g.direction_id);
      const faculty = faculties.find(f => f.id === direction?.faculty_id);
      const key = faculty?.name || 'Без факультета';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push({ ...g, direction });
    });
    return grouped;
  }, [groups, directions, faculties]);

  // Проверяем, является ли пользователь старостой какой-то группы
  const getUserLeaderGroup = useCallback((userId) => {
    return groups.find(g => g.leader_id === userId);
  }, [groups]);

  const filterTabs = useMemo(() => [
    { id: 'all', label: 'Все' }, 
    ...ROLES.map(r => ({ id: r.id, label: r.label }))
  ], []);

  const getRoleBadgeVariant = (role) => {
    const variants = { main_admin: 'red', club_admin: 'orange', group_leader: 'green', student: 'blue' };
    return variants[role] || 'default';
  };

  return (
    <>
      <PageHeader 
        title="👥 Пользователи" 
        subtitle={`Всего: ${users.length}`}
        search={search} 
        onSearch={setSearch} 
      />
      <MobilePageHeader 
        title="Пользователи" 
        subtitle={`${users.length} чел.`}
        showSearch 
        searchValue={search} 
        onSearchChange={setSearch} 
      />

      <PullToRefresh onRefresh={handleRefresh}>
        <div className="page-content">
          <FilterTabs tabs={filterTabs} activeTab={filter} onChange={setFilter} />

          {loading ? (
            <SkeletonList count={8} />
          ) : filteredUsers.length === 0 ? (
            <EmptyState 
              icon="👥" 
              title="Нет пользователей" 
              text={search ? 'Попробуйте другой запрос' : 'Пользователи не найдены'} 
            />
          ) : (
            <div className="users-list">
              {filteredUsers.map((user) => {
                const managedClub = clubs.find(c => c.admin_id === user.id);
                const leaderGroup = getUserLeaderGroup(user.id);
                
                return (
                  <div 
                    key={user.id} 
                    className="user-item" 
                    onClick={canEdit ? () => openEditModal(user) : undefined}
                  >
                    <div className="user-avatar-large">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="" className="user-avatar-img" />
                      ) : (
                        getInitials(user.full_name)
                      )}
                    </div>
                    <div className="user-details">
                      <div className="user-name-row">
                        <span className="user-full-name">{user.full_name}</span>
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {getRoleName(user.role)}
                        </Badge>
                      </div>
                      <div className="user-email">{user.email}</div>
                      {user.study_groups && (
                        <div className="user-group">
                          👥 {user.study_groups.name}
                          {user.subgroups?.name && ` • ${user.subgroups.name}`}
                        </div>
                      )}
                      {leaderGroup && (
                        <div className="user-group" style={{ color: 'var(--green)' }}>
                          👑 Староста группы {leaderGroup.name}
                        </div>
                      )}
                      {managedClub && (
                        <div className="user-group" style={{ color: 'var(--orange)' }}>
                          🎭 Админ клуба: {managedClub.icon} {managedClub.name}
                        </div>
                      )}
                    </div>
                    {canEdit && user.id !== currentUser.id && (
                      <button 
                        className="user-delete-btn" 
                        onClick={(e) => { e.stopPropagation(); deleteUser(user.id, user.full_name); }}
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </PullToRefresh>

      {/* Модальное окно редактирования */}
      <Modal 
        isOpen={showModal} 
        onClose={closeModal} 
        title="Редактировать пользователя" 
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>Отмена</Button>
            <Button 
              variant="primary" 
              onClick={saveUser} 
              disabled={!userForm.full_name.trim() || !userForm.email.trim() || submitting}
            >
              {submitting ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </>
        }
      >
        <FormField label="Имя и фамилия *">
          <Input 
            value={userForm.full_name} 
            onChange={(e) => setUserForm(prev => ({ ...prev, full_name: e.target.value }))} 
            placeholder="Иванов Иван" 
            autoFocus 
          />
        </FormField>
        
        <FormField label="Email *">
          <Input 
            type="email" 
            value={userForm.email} 
            onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))} 
            placeholder="email@example.com" 
          />
        </FormField>
        
        <FormField label="Роль">
          <select 
            className="form-select" 
            value={userForm.role} 
            onChange={(e) => setUserForm(prev => ({ ...prev, role: e.target.value }))}
          >
            {ROLES.map(r => (
              <option key={r.id} value={r.id}>{r.label} — {r.description}</option>
            ))}
          </select>
        </FormField>

        {/* Выбор группы */}
        <FormField label="Учебная группа">
          <select 
            className="form-select" 
            value={userForm.group_id} 
            onChange={(e) => setUserForm(prev => ({ 
              ...prev, 
              group_id: e.target.value,
              subgroup_id: '' // сбрасываем подгруппу
            }))}
          >
            <option value="">Без группы</option>
            {Object.entries(groupedGroups).map(([facultyName, groupList]) => (
              <optgroup key={facultyName} label={facultyName}>
                {groupList.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.course} курс) — {g.direction?.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </FormField>

        {/* Выбор подгруппы */}
        {userForm.group_id && filteredSubgroups.length > 0 && (
          <FormField label="Подгруппа">
            <select 
              className="form-select" 
              value={userForm.subgroup_id} 
              onChange={(e) => setUserForm(prev => ({ ...prev, subgroup_id: e.target.value }))}
            >
              <option value="">Без подгруппы</option>
              {filteredSubgroups.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </FormField>
        )}

        {/* Информация о назначении старостой */}
        {userForm.role === 'group_leader' && userForm.group_id && (
          <div className="info-banner" style={{ marginTop: 16 }}>
            <div className="info-banner-icon">👑</div>
            <div className="info-banner-content">
              <div className="info-banner-title">Назначение старостой</div>
              <div className="info-banner-subtitle">
                Этот пользователь станет старостой выбранной группы и сможет редактировать расписание и отправлять уведомления
              </div>
            </div>
          </div>
        )}

        {/* Выбор клуба для админа клуба */}
        {userForm.role === 'club_admin' && (
          <FormField label="Управляет клубом">
            <select 
              className="form-select" 
              value={userForm.managed_club_id} 
              onChange={(e) => setUserForm(prev => ({ ...prev, managed_club_id: e.target.value }))}
            >
              <option value="">Не назначен</option>
              {clubs.map(club => (
                <option key={club.id} value={club.id}>
                  {club.icon} {club.name}
                  {club.admin_id && club.admin_id !== editingUser?.id && ' (уже есть админ)'}
                </option>
              ))}
            </select>
          </FormField>
        )}

        {editingUser && (
          <div className="user-edit-info">
            <p>📅 Зарегистрирован: {new Date(editingUser.created_at).toLocaleDateString('ru-RU')}</p>
          </div>
        )}
      </Modal>
    </>
  );
});

export default UsersPage;
