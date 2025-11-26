import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import { haptic } from '../utils/haptic';
import { useNotification } from '../context/NotificationContext';
import { getRoleName } from '../utils/helpers';
import { 
  PageHeader, 
  EmptyState, 
  FilterTabs,
  Button,
  FormField,
  Input,
  Badge,
  PullToRefresh,
  SkeletonList
} from '../components/UI';
import { Modal } from '../components/Modal';

const ROLES = [
  { id: 'all', label: 'Все' },
  { id: 'student', label: 'Студенты' },
  { id: 'group_leader', label: 'Старосты' },
  { id: 'club_admin', label: 'Админы клубов' },
  { id: 'main_admin', label: 'Админы' }
];

const ROLE_COLORS = {
  main_admin: 'purple',
  club_admin: 'blue',
  group_leader: 'orange',
  student: 'green'
};

const ROLE_OPTIONS = [
  { value: 'student', label: 'Студент' },
  { value: 'group_leader', label: 'Староста' },
  { value: 'club_admin', label: 'Админ клуба' },
  { value: 'main_admin', label: 'Главный админ' }
];

/**
 * Users Page - управление пользователями
 * Главный админ может:
 * - Видеть всех пользователей
 * - Менять роли (студент → староста → админ клуба → главный админ)
 * - Удалять пользователей
 */
export function UsersPage() {
  const { notify } = useNotification();
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ 
    full_name: '', 
    role: '',
    group_id: '',
    managed_club_id: ''
  });
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [usersRes, groupsRes, clubsRes] = await Promise.all([
        supabase
          .from('users')
          .select(`
            *,
            study_groups(name),
            faculties(name),
            directions(name)
          `)
          .order('created_at', { ascending: false }),
        supabase
          .from('study_groups')
          .select('id, name, directions(name, faculties(name))')
          .order('name'),
        supabase
          .from('clubs')
          .select('id, name')
          .order('name')
      ]);
      
      setUsers(usersRes.data || []);
      setGroups(groupsRes.data || []);
      setClubs(clubsRes.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading users:', error);
      setLoading(false);
    }
  }, []);

  const handleRefresh = async () => {
    await loadData();
    notify.success('Обновлено');
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setEditForm({ 
      full_name: user.full_name, 
      role: user.role,
      group_id: user.group_id || '',
      managed_club_id: ''
    });
    setShowEditModal(true);
    haptic.light();
  };

  const updateUser = async () => {
    if (!editForm.full_name.trim()) return;

    setSubmitting(true);
    try {
      const updates = { 
        full_name: editForm.full_name,
        role: editForm.role
      };

      // Если назначаем старосту — нужна группа
      if (editForm.role === 'group_leader' && editForm.group_id) {
        updates.group_id = editForm.group_id;
      }

      await supabase
        .from('users')
        .update(updates)
        .eq('id', editingUser.id);

      // Если назначаем админа клуба — обновляем клуб
      if (editForm.role === 'club_admin' && editForm.managed_club_id) {
        await supabase
          .from('clubs')
          .update({ admin_id: editingUser.id })
          .eq('id', editForm.managed_club_id);
      }

      setShowEditModal(false);
      loadData();
      notify.success('Пользователь обновлён');
      haptic.success();
    } catch (error) {
      console.error('Error updating user:', error);
      notify.error('Ошибка обновления');
      haptic.error();
    } finally {
      setSubmitting(false);
    }
  };

  const deleteUser = async (id, name) => {
    if (!window.confirm(`Удалить пользователя "${name}"?`)) return;

    try {
      await supabase.from('users').delete().eq('id', id);
      notify.success('Пользователь удалён');
      loadData();
      haptic.medium();
    } catch (error) {
      console.error('Error deleting user:', error);
      notify.error('Ошибка удаления');
      haptic.error();
    }
  };

  // Фильтрация
  let filteredUsers = users.filter(u =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (roleFilter !== 'all') {
    filteredUsers = filteredUsers.filter(u => u.role === roleFilter);
  }

  return (
    <>
      <PageHeader
        title="👤 Пользователи"
        search={search}
        onSearch={setSearch}
      />

      <PullToRefresh onRefresh={handleRefresh}>
        <div className="page-content">
          <FilterTabs
            tabs={ROLES}
            activeTab={roleFilter}
            onChange={(id) => { setRoleFilter(id); haptic.light(); }}
          />

          {loading ? (
            <SkeletonList count={5} />
          ) : filteredUsers.length === 0 ? (
            <EmptyState
              icon="👤"
              title="Нет пользователей"
              text={roleFilter !== 'all' ? 'Нет пользователей с такой ролью' : 'Пользователи появятся после регистрации'}
            />
          ) : (
            <div className="users-list">
              {filteredUsers.map((user, index) => (
                <div 
                  key={user.id} 
                  className="user-item"
                  style={{ animationDelay: `${index * 0.03}s` }}
                >
                  <div className="user-avatar">
                    {user.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="user-info">
                    <div className="user-name">{user.full_name}</div>
                    <div className="user-email">{user.email}</div>
                    {user.study_groups?.name && (
                      <div className="user-group">
                        👥 {user.study_groups.name}
                      </div>
                    )}
                  </div>
                  <Badge variant={ROLE_COLORS[user.role] || 'blue'}>
                    {getRoleName(user.role)}
                  </Badge>
                  <div className="user-actions">
                    <button 
                      className="user-action-btn"
                      onClick={() => openEditModal(user)}
                      title="Редактировать"
                    >
                      ✏️
                    </button>
                    <button 
                      className="user-action-btn danger"
                      onClick={() => deleteUser(user.id, user.full_name)}
                      title="Удалить"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PullToRefresh>

      {/* Modal редактирования */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Редактировать пользователя"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              Отмена
            </Button>
            <Button
              variant="primary"
              onClick={updateUser}
              disabled={!editForm.full_name.trim() || submitting}
            >
              {submitting ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </>
        }
      >
        <FormField label="Имя и фамилия">
          <Input
            value={editForm.full_name}
            onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
            autoFocus
          />
        </FormField>

        <FormField label="Роль">
          <select
            className="form-select"
            value={editForm.role}
            onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
          >
            {ROLE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </FormField>

        {/* Если выбрана роль "Староста" — показываем выбор группы */}
        {editForm.role === 'group_leader' && (
          <FormField label="Группа (для старосты)">
            <select
              className="form-select"
              value={editForm.group_id}
              onChange={(e) => setEditForm({ ...editForm, group_id: e.target.value })}
            >
              <option value="">Выберите группу</option>
              {groups.map(g => (
                <option key={g.id} value={g.id}>
                  {g.name} — {g.directions?.faculties?.name}
                </option>
              ))}
            </select>
            <p className="form-hint">
              Староста сможет редактировать расписание этой группы
            </p>
          </FormField>
        )}

        {/* Если выбрана роль "Админ клуба" — показываем выбор клуба */}
        {editForm.role === 'club_admin' && (
          <FormField label="Клуб (для админа)">
            <select
              className="form-select"
              value={editForm.managed_club_id}
              onChange={(e) => setEditForm({ ...editForm, managed_club_id: e.target.value })}
            >
              <option value="">Выберите клуб</option>
              {clubs.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </FormField>
        )}

        {editingUser && (
          <div className="edit-user-info">
            <p><strong>Email:</strong> {editingUser.email}</p>
            {editingUser.study_groups?.name && (
              <p><strong>Группа:</strong> {editingUser.study_groups.name}</p>
            )}
            {editingUser.faculties?.name && (
              <p><strong>Факультет:</strong> {editingUser.faculties.name}</p>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}

export default UsersPage;
