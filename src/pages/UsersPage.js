/**
 * UsersPage — ОПТИМИЗИРОВАННАЯ ВЕРСИЯ
 * 
 * Изменения:
 * - Вынесен компонент UserItem
 * - Оптимизирована работа с группами через Map
 * - Улучшена мемоизация
 */
import React, { useState, useEffect, useCallback, memo, useMemo, useRef } from 'react';
import { supabase, invalidateCache } from '../utils/supabase';
import { haptic } from '../utils/haptic';
import { useNotification } from '../context/NotificationContext';
import { useApp } from '../context/AppContext';
import { getRoleName, getInitials } from '../utils/helpers';
import { 
  PageHeader, EmptyState, FilterTabs, Button, FormField, Input, 
  Badge, PullToRefresh, SkeletonList 
} from '../components/UI';
import { Modal } from '../components/Modal';
import { MobilePageHeader } from '../components/Navigation';

// ========== КОНСТАНТЫ ==========

const ROLES = [
  { id: 'student', label: 'Студент', description: 'Обычный пользователь' },
  { id: 'group_leader', label: 'Староста', description: 'Редактирует расписание группы' },
  { id: 'club_admin', label: 'Админ клуба', description: 'Управляет своим клубом' },
  { id: 'main_admin', label: 'Главный админ', description: 'Полный доступ' }
];

const ROLE_BADGE_VARIANTS = {
  main_admin: 'red',
  club_admin: 'orange',
  group_leader: 'green',
  student: 'blue'
};

const INITIAL_FORM = {
  full_name: '', 
  email: '', 
  role: 'student', 
  group_id: '',
  subgroup_id: '',
  managed_club_id: ''
};

// ========== КОМПОНЕНТЫ ==========

const UserItem = memo(function UserItem({ 
  user, 
  currentUserId,
  managedClub, 
  leaderGroup, 
  canEdit, 
  onEdit, 
  onDelete 
}) {
  const handleClick = useCallback(() => {
    if (canEdit) onEdit(user);
  }, [canEdit, user, onEdit]);

  const handleDelete = useCallback((e) => {
    e.stopPropagation();
    onDelete(user.id, user.full_name);
  }, [user.id, user.full_name, onDelete]);

  return (
    <div className="user-item" onClick={handleClick}>
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
          <Badge variant={ROLE_BADGE_VARIANTS[user.role] || 'default'}>
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
      {canEdit && user.id !== currentUserId && (
        <button className="user-delete-btn" onClick={handleDelete}>🗑️</button>
      )}
    </div>
  );
});

// ========== ГЛАВНЫЙ КОМПОНЕНТ ==========

export const UsersPage = memo(function UsersPage() {
  const { user: currentUser } = useApp();
  const { notify } = useNotification();
  
  // Данные
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [subgroups, setSubgroups] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [directions, setDirections] = useState([]);
  const [faculties, setFaculties] = useState([]);
  
  // UI
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  
  // Модалка
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);

  const mountedRef = useRef(true);
  const canEdit = currentUser.role === 'main_admin';

  // Загрузка
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
        supabase.from('subgroups').select('*').order('name'),
        supabase.from('clubs').select('id, name, icon, admin_id').order('name'),
        supabase.from('directions').select('*').order('name'),
        supabase.from('faculties').select('*').order('name')
      ]);
      
      if (!mountedRef.current) return;
      
      setUsers(usersRes.data || []);
      setGroups(groupsRes.data || []);
      setSubgroups(subgroupsRes.data || []);
      setClubs(clubsRes.data || []);
      setDirections(directionsRes.data || []);
      setFaculties(facultiesRes.data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      notify.error('Ошибка загрузки данных');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    mountedRef.current = true;
    loadData();
    return () => { mountedRef.current = false; };
  }, [loadData]);

  const handleRefresh = useCallback(async () => { 
    setLoading(true);
    await loadData(); 
    notify.success('Обновлено'); 
  }, [loadData, notify]);

  // Быстрый поиск по Map
  const clubsByAdminId = useMemo(() => {
    const map = new Map();
    clubs.forEach(c => {
      if (c.admin_id) map.set(c.admin_id, c);
    });
    return map;
  }, [clubs]);

  const groupsByLeaderId = useMemo(() => {
    const map = new Map();
    groups.forEach(g => {
      if (g.leader_id) map.set(g.leader_id, g);
    });
    return map;
  }, [groups]);

  // Модалка
  const openEditModal = useCallback((user) => {
    setEditingUser(user);
    const managedClub = clubsByAdminId.get(user.id);
    
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
  }, [clubsByAdminId]);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setEditingUser(null);
  }, []);

  // Обновление формы
  const updateFormField = useCallback((field, value) => {
    setUserForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'group_id') {
        next.subgroup_id = '';
      }
      return next;
    });
  }, []);

  // Сохранение
  const saveUser = useCallback(async () => {
    if (!userForm.full_name.trim() || !userForm.email.trim()) {
      notify.error('Заполните имя и email');
      return;
    }
    
    setSubmitting(true);
    try {
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

      if (userForm.role === 'group_leader' && userForm.group_id) {
        await supabase.from('study_groups').update({ leader_id: null }).eq('leader_id', editingUser.id);
        await supabase.from('study_groups').update({ leader_id: editingUser.id }).eq('id', userForm.group_id);
      } else if (userForm.role !== 'group_leader') {
        await supabase.from('study_groups').update({ leader_id: null }).eq('leader_id', editingUser.id);
      }

      if (userForm.role === 'club_admin' && userForm.managed_club_id) {
        await supabase.from('clubs').update({ admin_id: null }).eq('admin_id', editingUser.id);
        await supabase.from('clubs').update({ admin_id: editingUser.id }).eq('id', userForm.managed_club_id);
      } else if (userForm.role !== 'club_admin') {
        await supabase.from('clubs').update({ admin_id: null }).eq('admin_id', editingUser.id);
      }
      
      invalidateCache('users');
      notify.success('Пользователь обновлён');
      closeModal();
      loadData();
      haptic.success();
    } catch (error) {
      console.error('Error saving user:', error);
      notify.error('Ошибка сохранения');
      haptic.error();
    } finally {
      setSubmitting(false);
    }
  }, [userForm, editingUser, loadData, notify, closeModal]);

  // Удаление
  const deleteUser = useCallback(async (id, name) => {
    if (id === currentUser.id) {
      notify.error('Нельзя удалить самого себя');
      return;
    }
    
    if (!window.confirm(`Удалить пользователя "${name}"?`)) return;
    
    try {
      await Promise.all([
        supabase.from('study_groups').update({ leader_id: null }).eq('leader_id', id),
        supabase.from('clubs').update({ admin_id: null }).eq('admin_id', id),
        supabase.from('club_subscriptions').delete().eq('student_id', id)
      ]);
      
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) throw error;
      
      invalidateCache('users');
      notify.success('Пользователь удалён');
      loadData();
      haptic.medium();
    } catch (error) {
      console.error('Error deleting user:', error);
      notify.error('Ошибка удаления');
      haptic.error();
    }
  }, [currentUser.id, loadData, notify]);

  // Фильтрация
  const filteredUsers = useMemo(() => {
    const searchLower = search.toLowerCase();
    let result = users.filter(u => 
      u.full_name?.toLowerCase().includes(searchLower) || 
      u.email?.toLowerCase().includes(searchLower)
    );
    
    if (filter !== 'all') {
      result = result.filter(u => u.role === filter);
    }
    
    return result;
  }, [users, search, filter]);

  const filteredSubgroups = useMemo(() => 
    subgroups.filter(s => s.group_id === userForm.group_id),
    [subgroups, userForm.group_id]
  );

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

  const filterTabs = useMemo(() => [
    { id: 'all', label: 'Все' }, 
    ...ROLES.map(r => ({ id: r.id, label: r.label }))
  ], []);

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
              {filteredUsers.map((user) => (
                <UserItem
                  key={user.id}
                  user={user}
                  currentUserId={currentUser.id}
                  managedClub={clubsByAdminId.get(user.id)}
                  leaderGroup={groupsByLeaderId.get(user.id)}
                  canEdit={canEdit}
                  onEdit={openEditModal}
                  onDelete={deleteUser}
                />
              ))}
            </div>
          )}
        </div>
      </PullToRefresh>

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
            onChange={(e) => updateFormField('full_name', e.target.value)} 
            placeholder="Иванов Иван" 
            autoFocus 
          />
        </FormField>
        
        <FormField label="Email *">
          <Input 
            type="email" 
            value={userForm.email} 
            onChange={(e) => updateFormField('email', e.target.value)} 
            placeholder="email@example.com" 
          />
        </FormField>
        
        <FormField label="Роль">
          <select 
            className="form-select" 
            value={userForm.role} 
            onChange={(e) => updateFormField('role', e.target.value)}
          >
            {ROLES.map(r => (
              <option key={r.id} value={r.id}>{r.label} — {r.description}</option>
            ))}
          </select>
        </FormField>

        <FormField label="Учебная группа">
          <select 
            className="form-select" 
            value={userForm.group_id} 
            onChange={(e) => updateFormField('group_id', e.target.value)}
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

        {userForm.group_id && filteredSubgroups.length > 0 && (
          <FormField label="Подгруппа">
            <select 
              className="form-select" 
              value={userForm.subgroup_id} 
              onChange={(e) => updateFormField('subgroup_id', e.target.value)}
            >
              <option value="">Без подгруппы</option>
              {filteredSubgroups.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </FormField>
        )}

        {userForm.role === 'group_leader' && userForm.group_id && (
          <div className="info-banner" style={{ marginTop: 16 }}>
            <div className="info-banner-icon">👑</div>
            <div className="info-banner-content">
              <div className="info-banner-title">Назначение старостой</div>
              <div className="info-banner-subtitle">
                Пользователь станет старостой и сможет редактировать расписание
              </div>
            </div>
          </div>
        )}

        {userForm.role === 'club_admin' && (
          <FormField label="Управляет клубом">
            <select 
              className="form-select" 
              value={userForm.managed_club_id} 
              onChange={(e) => updateFormField('managed_club_id', e.target.value)}
            >
              <option value="">Не назначен</option>
              {clubs.map(club => (
                <option key={club.id} value={club.id}>
                  {club.icon} {club.name}
                  {club.admin_id && club.admin_id !== editingUser?.id && ' (есть админ)'}
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
