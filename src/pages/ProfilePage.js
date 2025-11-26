import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { useApp } from '../context/AppContext';
import { useNotification } from '../context/NotificationContext';
import { haptic } from '../utils/haptic';
import { formatDate, getRoleName } from '../utils/helpers';
import { 
  PageHeader, 
  Button, 
  FormField, 
  Input,
  EmptyState,
  SkeletonList
} from '../components/UI';
import { Modal } from '../components/Modal';

/**
 * Profile Page
 */
export function ProfilePage() {
  const { user, logout, updateUser } = useApp();
  const { notify } = useNotification();
  const [stats, setStats] = useState({ clubs: 0, events: 0 });
  const [myGroup, setMyGroup] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  const [editData, setEditData] = useState({ full_name: user.full_name });
  const [passwordData, setPasswordData] = useState({ current: '', new_password: '', confirm: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfileData();
  }, [user.id]);

  const loadProfileData = async () => {
    try {
      const { count: clubsCount } = await supabase
        .from('club_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', user.id);

      const { count: eventsCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', user.id);

      setStats({
        clubs: clubsCount || 0,
        events: eventsCount || 0
      });

      // Моя группа
      if (user.group_id) {
        const { data: group } = await supabase
          .from('study_groups')
          .select('*, directions(name, faculties(name))')
          .eq('id', user.group_id)
          .single();
        setMyGroup(group);
      }

      const { data: subs } = await supabase
        .from('club_subscriptions')
        .select('*, clubs(name)')
        .eq('student_id', user.id)
        .order('subscribed_at', { ascending: false })
        .limit(5);

      const activity = (subs || []).map(sub => ({
        id: sub.id,
        type: 'subscription',
        title: `Подписка на ${sub.clubs?.name}`,
        date: sub.subscribed_at,
        icon: '🎭'
      }));

      setRecentActivity(activity);
      setLoading(false);
    } catch (error) {
      console.error('Error loading profile:', error);
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!editData.full_name.trim()) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ full_name: editData.full_name.trim() })
        .eq('id', user.id);

      if (error) throw error;

      updateUser({ full_name: editData.full_name.trim() });

      notify.success('Профиль обновлён');
      setShowEditModal(false);
      haptic.success();
    } catch (error) {
      console.error('Error updating profile:', error);
      notify.error('Ошибка сохранения');
      haptic.error();
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.current || !passwordData.new_password || !passwordData.confirm) {
      notify.error('Заполните все поля');
      return;
    }

    if (passwordData.new_password !== passwordData.confirm) {
      notify.error('Пароли не совпадают');
      haptic.error();
      return;
    }

    if (passwordData.new_password.length < 6) {
      notify.error('Пароль должен быть минимум 6 символов');
      haptic.error();
      return;
    }

    setSaving(true);
    try {
      const currentHash = btoa(passwordData.current);
      const { data: userData } = await supabase
        .from('users')
        .select('password_hash')
        .eq('id', user.id)
        .single();

      if (userData?.password_hash !== currentHash) {
        notify.error('Неверный текущий пароль');
        haptic.error();
        setSaving(false);
        return;
      }

      const newHash = btoa(passwordData.new_password);
      await supabase
        .from('users')
        .update({ password_hash: newHash })
        .eq('id', user.id);

      notify.success('Пароль изменён');
      setShowPasswordModal(false);
      setPasswordData({ current: '', new_password: '', confirm: '' });
      haptic.success();
    } catch (error) {
      console.error('Error changing password:', error);
      notify.error('Ошибка смены пароля');
      haptic.error();
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    haptic.medium();
    logout();
  };

  const initials = user.full_name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <PageHeader title="👤 Профиль" />
      <div className="page-content">
        {/* Карточка профиля */}
        <div className="profile-card">
          <div className="profile-avatar-large">{initials}</div>
          <h2 className="profile-name">{user.full_name}</h2>
          <p className="profile-email">{user.email}</p>
          <span className="profile-role-badge">{getRoleName(user.role)}</span>
          
          {/* Группа */}
          {myGroup && (
            <div className="profile-group-info">
              <span className="profile-group-name">{myGroup.name}</span>
              <span className="profile-group-faculty">
                {myGroup.directions?.faculties?.name}
              </span>
            </div>
          )}
          
          <div className="profile-stats">
            <div className="profile-stat">
              <span className="profile-stat-value">{loading ? '—' : stats.clubs}</span>
              <span className="profile-stat-label">Клубов</span>
            </div>
            <div className="profile-stat-divider" />
            <div className="profile-stat">
              <span className="profile-stat-value">{loading ? '—' : stats.events}</span>
              <span className="profile-stat-label">Событий</span>
            </div>
          </div>

          <div className="profile-actions">
            <Button variant="secondary" onClick={() => setShowEditModal(true)}>
              ✏️ Редактировать
            </Button>
          </div>
        </div>

        {/* Активность */}
        <div className="profile-section">
          <h3 className="profile-section-title">📋 Недавняя активность</h3>
          
          {loading ? (
            <SkeletonList count={3} />
          ) : recentActivity.length === 0 ? (
            <EmptyState icon="📋" text="Нет активности" small />
          ) : (
            <div className="profile-activity-list">
              {recentActivity.map(item => (
                <div key={item.id} className="profile-activity-item">
                  <span className="profile-activity-icon">{item.icon}</span>
                  <div className="profile-activity-content">
                    <div className="profile-activity-title">{item.title}</div>
                    <div className="profile-activity-date">{formatDate(item.date)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Настройки */}
        <div className="profile-section">
          <h3 className="profile-section-title">⚙️ Настройки</h3>
          
          <div className="profile-menu">
            <div 
              className="profile-menu-item"
              onClick={() => { setShowPasswordModal(true); haptic.light(); }}
            >
              <span className="profile-menu-icon">🔒</span>
              <span className="profile-menu-label">Сменить пароль</span>
              <span className="profile-menu-arrow">›</span>
            </div>
          </div>
        </div>

        {/* Выход */}
        <Button 
          variant="danger" 
          fullWidth 
          onClick={handleLogout}
          style={{ marginTop: 'var(--space-lg)' }}
        >
          🚪 Выйти из аккаунта
        </Button>

        <p className="profile-version">UniClub v3.1.0</p>
      </div>

      {/* Редактирование профиля */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Редактировать профиль"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              Отмена
            </Button>
            <Button 
              variant="primary" 
              onClick={handleSaveProfile}
              disabled={!editData.full_name.trim() || saving}
            >
              {saving ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </>
        }
      >
        <FormField label="Имя и фамилия">
          <Input
            value={editData.full_name}
            onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
            placeholder="Ваше имя"
            autoFocus
          />
        </FormField>
      </Modal>

      {/* Смена пароля */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Сменить пароль"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowPasswordModal(false)}>
              Отмена
            </Button>
            <Button 
              variant="primary" 
              onClick={handleChangePassword}
              disabled={saving}
            >
              {saving ? 'Сохранение...' : 'Сменить пароль'}
            </Button>
          </>
        }
      >
        <FormField label="Текущий пароль">
          <Input
            type="password"
            value={passwordData.current}
            onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
            placeholder="Введите текущий пароль"
            autoFocus
          />
        </FormField>

        <FormField label="Новый пароль">
          <Input
            type="password"
            value={passwordData.new_password}
            onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
            placeholder="Минимум 6 символов"
          />
        </FormField>

        <FormField label="Подтвердите пароль">
          <Input
            type="password"
            value={passwordData.confirm}
            onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
            placeholder="Повторите новый пароль"
          />
        </FormField>
      </Modal>
    </>
  );
}

export default ProfilePage;
