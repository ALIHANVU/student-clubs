/**
 * UsersPage — с привязкой к группам и назначением админов клубов
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
  { id: 'group_leader', label: 'Староста', description: 'Может редактировать расписание группы' },
  { id: 'club_admin', label: 'Админ клуба', description: 'Управляет своим клубом' },
  { id: 'main_admin', label: 'Главный админ', description: 'Полный доступ ко всему' }
];

export const UsersPage = memo(function UsersPage() {
  const { user: currentUser } = useApp();
  const { notify } = useNotification();
  
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [clubs, setClubs] = useState([]);
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
    managed_club_id: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Только главный админ может редактировать пользователей
  const canEdit = currentUser.role === 'main_admin';

  const loadData = useCallback(async () => {
    try {
      const [usersRes, groupsRes, clubsRes] = await Promise.all([
        supabase
          .from('users')
          .select('*, study_groups(name, directions(name, faculties(name))), clubs(name, icon)')
          .order('created_at', { ascending: false }),
        supabase
          .from('study_groups')
          .select('*, directions(name, faculties(name))')
          .order('name'),
        supabase
          .from('clubs')
          .select('id, name, icon, admin_id')
          .order('name')
      ]);
      
      setUsers(usersRes.data || []);
      setGroups(groupsRes.data || []);
      setClubs(clubsRes.data || []);
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
    
    // Находим клуб, которым управляет пользователь
    const managedClub = clubs.find(c => c.admin_id === user.id);
    
    setUserForm({ 
      full_name: user.full_name || '', 
      email: user.email || '', 
      role: user.role || 'student', 
      group_id: user.group_id || '',
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
          group_id: userForm.group_id || null 
        })
        .eq('id', editingUser.id);
      
      if (userError) throw userError;

      // Если назначен админом клуба — обновляем клуб
      if (userForm.role === 'club_admin' && userForm.managed_club_id) {
        // Сначала убираем этого пользователя как админа из всех клубов
        await supabase
          .from('clubs')
          .update({ admin_id: null })
          .eq('admin_id', editingUser.id);
        
        // Назначаем админом выбранного клуба
        const { error: clubError } = await supabase
          .from('clubs')
          .update({ admin_id: editingUser.id })
          .eq('id', userForm.managed_club_id);
        
        if (clubError) throw clubError;
      } else if (userForm.role !== 'club_admin') {
        // Если роль изменилась с club_admin — убираем из админов клубов
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
    
    if (!window.confirm(`Удалить пользователя "${name}"? Это действие нельзя отменить.`)) {
      return;
    }
    
    try {
      // Убираем из админов клубов
      await supabase
        .from('clubs')
        .update({ admin_id: null })
        .eq('admin_id', id);
      
      // Удаляем подписки на клубы
      await supabase
        .from('club_subscriptions')
        .delete()
        .eq('student_id', id);
      
      // Удаляем пользователя
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);
      
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

  const filterTabs = useMemo(() => [
    { id: 'all', label: 'Все' }, 
    ...ROLES.map(r => ({ id: r.id, label: r.label }))
  ], []);

  const getRoleBadgeVariant = (role) => {
    const variants = { 
      main_admin: 'red', 
      club_admin: 'orange', 
      group_leader: 'green', 
      student: 'blue' 
    };
    return variants[role] || 'default';
  };

  // Группируем группы по факультетам для удобного выбора
  const groupedGroups = useMemo(() => {
    const grouped = {};
    groups.forEach(g => {
      const facultyName = g.directions?.faculties?.name || 'Без факультета';
      const directionName = g.directions?.name || 'Без направления';
      const key = `${facultyName} — ${directionName}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(g);
    });
    return grouped;
  }, [groups]);

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
                          👥 {user.study_groups.name} — {user.study_groups.directions?.faculties?.name}
                        </div>
                      )}
                      {managedClub && (
                        <div className="user-group">
                          🎭 Админ клуба: {managedClub.icon} {managedClub.name}
                        </div>
                      )}
                    </div>
                    {canEdit && user.id !== currentUser.id && (
                      <button 
                        className="user-delete-btn" 
                        onClick={(e) => { e.stopPropagation(); deleteUser(user.id, user.full_name); }}
                        title="Удалить"
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

        {/* Показываем выбор клуба только для админа клуба */}
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
        
        <FormField label="Учебная группа">
          <select 
            className="form-select" 
            value={userForm.group_id} 
            onChange={(e) => setUserForm(prev => ({ ...prev, group_id: e.target.value }))}
          >
            <option value="">Без группы</option>
            {Object.entries(groupedGroups).map(([key, groupList]) => (
              <optgroup key={key} label={key}>
                {groupList.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.course} курс)
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </FormField>

        {editingUser && (
          <div className="user-edit-info">
            <p>📅 Зарегистрирован: {new Date(editingUser.created_at).toLocaleDateString('ru-RU')}</p>
            <p>🆔 ID: {editingUser.id}</p>
          </div>
        )}
      </Modal>
    </>
  );
});

export default UsersPage;
