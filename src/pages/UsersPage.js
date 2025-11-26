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

/**
 * Users Page - Управление пользователями
 */
export function UsersPage() {
  const { notify } = useNotification();
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [newUser, setNewUser] = useState({
    email: '',
    full_name: '',
    password: '',
    role: 'student'
  });
  const [editForm, setEditForm] = useState({ full_name: '', role: '' });
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      setUsers(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading users:', error);
      setLoading(false);
    }
  }, []);

  const handleRefresh = async () => {
    await loadUsers();
    notify.success('Обновлено');
  };

  const createUser = async () => {
    if (!newUser.email.trim() || !newUser.full_name.trim() || !newUser.password.trim()) return;

    setSubmitting(true);
    try {
      // Simple hash for demo (in production use proper auth)
      const password_hash = btoa(newUser.password);
      
      await supabase.from('users').insert({
        email: newUser.email,
        full_name: newUser.full_name,
        password_hash,
        role: newUser.role
      });

      setNewUser({ email: '', full_name: '', password: '', role: 'student' });
      setShowModal(false);
      loadUsers();
      notify.success('Пользователь создан');
      haptic.success();
    } catch (error) {
      console.error('Error creating user:', error);
      notify.error('Ошибка создания');
      haptic.error();
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setEditForm({ full_name: user.full_name, role: user.role });
    setShowEditModal(true);
    haptic.light();
  };

  const updateUser = async () => {
    if (!editForm.full_name.trim()) return;

    setSubmitting(true);
    try {
      await supabase
        .from('users')
        .update({ 
          full_name: editForm.full_name,
          role: editForm.role
        })
        .eq('id', editingUser.id);

      setShowEditModal(false);
      loadUsers();
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
      loadUsers();
      haptic.medium();
    } catch (error) {
      console.error('Error deleting user:', error);
      notify.error('Ошибка удаления');
      haptic.error();
    }
  };

  // Filter users
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
        action={
          <Button variant="primary" onClick={() => setShowModal(true)}>
            + Добавить
          </Button>
        }
        search={search}
        onSearch={setSearch}
      />

      <PullToRefresh onRefresh={handleRefresh}>
        <div className="page-content">
          {/* Role Filter */}
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
              text={roleFilter !== 'all' ? 'Нет пользователей с такой ролью' : 'Добавьте первого пользователя'}
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
                  </div>
                  <Badge variant={ROLE_COLORS[user.role] || 'blue'}>
                    {getRoleName(user.role)}
                  </Badge>
                  <div className="user-actions">
                    <button 
                      className="user-action-btn"
                      onClick={() => openEditModal(user)}
                    >
                      ✏️
                    </button>
                    <button 
                      className="user-action-btn danger"
                      onClick={() => deleteUser(user.id, user.full_name)}
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

      {/* Create User Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Добавить пользователя"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Отмена
            </Button>
            <Button
              variant="primary"
              onClick={createUser}
              disabled={!newUser.email.trim() || !newUser.full_name.trim() || !newUser.password.trim() || submitting}
            >
              {submitting ? 'Создание...' : 'Создать'}
            </Button>
          </>
        }
      >
        <FormField label="Email">
          <Input
            type="email"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            placeholder="user@example.com"
            autoFocus
          />
        </FormField>

        <FormField label="Имя и фамилия">
          <Input
            value={newUser.full_name}
            onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
            placeholder="Иванов Иван"
          />
        </FormField>

        <FormField label="Пароль">
          <Input
            type="password"
            value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            placeholder="Минимум 6 символов"
          />
        </FormField>

        <FormField label="Роль">
          <select
            className="form-select"
            value={newUser.role}
            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
          >
            <option value="student">Студент</option>
            <option value="group_leader">Староста</option>
            <option value="club_admin">Админ клуба</option>
            <option value="main_admin">Главный админ</option>
          </select>
        </FormField>
      </Modal>

      {/* Edit User Modal */}
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
            <option value="student">Студент</option>
            <option value="group_leader">Староста</option>
            <option value="club_admin">Админ клуба</option>
            <option value="main_admin">Главный админ</option>
          </select>
        </FormField>
      </Modal>
    </>
  );
}

export default UsersPage;
