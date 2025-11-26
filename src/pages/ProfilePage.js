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
 * Profile Page with full functionality
 */
export function ProfilePage() {
  const { user, logout } = useApp();
  const { notify } = useNotification();
  const [stats, setStats] = useState({ clubs: 0, events: 0 });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  
  // Form states
  const [editData, setEditData] = useState({ full_name: user.full_name });
  const [passwordData, setPasswordData] = useState({ current: '', new_password: '', confirm: '' });
  const [notificationSettings, setNotificationSettings] = useState({
    events: true,
    clubs: true,
    system: true
  });
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

      user.full_name = editData.full_name.trim();
      localStorage.setItem('uniclub_user', JSON.stringify(user));

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
      // Verify current password
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

      // Update password
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

  const handleSaveNotifications = () => {
    // Save to localStorage for demo
    localStorage.setItem('uniclub_notifications', JSON.stringify(notificationSettings));
    notify.success('Настройки сохранены');
    setShowNotificationsModal(false);
    haptic.success();
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
        {/* Profile Card */}
        <div className="profile-card">
          <div className="profile-avatar-large">{initials}</div>
          <h2 className="profile-name">{user.full_name}</h2>
          <p className="profile-email">{user.email}</p>
          <span className="profile-role-badge">{getRoleName(user.role)}</span>
          
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

        {/* Recent Activity */}
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

        {/* Account Section */}
        <div className="profile-section">
          <h3 className="profile-section-title">⚙️ Настройки</h3>
          
          <div className="profile-menu">
            <div 
              className="profile-menu-item" 
              onClick={() => { setShowNotificationsModal(true); haptic.light(); }}
            >
              <span className="profile-menu-icon">🔔</span>
              <span className="profile-menu-label">Уведомления</span>
              <span className="profile-menu-arrow">›</span>
            </div>
            <div 
              className="profile-menu-item"
              onClick={() => { setShowPasswordModal(true); haptic.light(); }}
            >
              <span className="profile-menu-icon">🔒</span>
              <span className="profile-menu-label">Сменить пароль</span>
              <span className="profile-menu-arrow">›</span>
            </div>
            <div 
              className="profile-menu-item"
              onClick={() => { setShowHelpModal(true); haptic.light(); }}
            >
              <span className="profile-menu-icon">❓</span>
              <span className="profile-menu-label">Помощь</span>
              <span className="profile-menu-arrow">›</span>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <Button 
          variant="danger" 
          fullWidth 
          onClick={handleLogout}
          style={{ marginTop: 'var(--space-lg)' }}
        >
          🚪 Выйти из аккаунта
        </Button>

        <p className="profile-version">UniClub v3.0.0</p>
      </div>

      {/* Edit Profile Modal */}
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

      {/* Change Password Modal */}
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

      {/* Notifications Modal */}
      <Modal
        isOpen={showNotificationsModal}
        onClose={() => setShowNotificationsModal(false)}
        title="Настройки уведомлений"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowNotificationsModal(false)}>
              Отмена
            </Button>
            <Button variant="primary" onClick={handleSaveNotifications}>
              Сохранить
            </Button>
          </>
        }
      >
        <div className="settings-list">
          <label className="settings-toggle">
            <span className="settings-toggle-info">
              <span className="settings-toggle-title">🎭 Клубы</span>
              <span className="settings-toggle-desc">Новости клубов, на которые вы подписаны</span>
            </span>
            <input
              type="checkbox"
              checked={notificationSettings.clubs}
              onChange={(e) => setNotificationSettings({ 
                ...notificationSettings, 
                clubs: e.target.checked 
              })}
            />
            <span className="settings-toggle-switch" />
          </label>

          <label className="settings-toggle">
            <span className="settings-toggle-info">
              <span className="settings-toggle-title">📅 Мероприятия</span>
              <span className="settings-toggle-desc">Напоминания о предстоящих событиях</span>
            </span>
            <input
              type="checkbox"
              checked={notificationSettings.events}
              onChange={(e) => setNotificationSettings({ 
                ...notificationSettings, 
                events: e.target.checked 
              })}
            />
            <span className="settings-toggle-switch" />
          </label>

          <label className="settings-toggle">
            <span className="settings-toggle-info">
              <span className="settings-toggle-title">🔔 Системные</span>
              <span className="settings-toggle-desc">Важные обновления и объявления</span>
            </span>
            <input
              type="checkbox"
              checked={notificationSettings.system}
              onChange={(e) => setNotificationSettings({ 
                ...notificationSettings, 
                system: e.target.checked 
              })}
            />
            <span className="settings-toggle-switch" />
          </label>
        </div>
      </Modal>

      {/* Help Modal */}
      <Modal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        title="Помощь и поддержка"
      >
        <div className="help-content">
          <div className="help-section">
            <h4 className="help-section-title">📚 Часто задаваемые вопросы</h4>
            
            <div className="help-faq">
              <div className="help-faq-item">
                <div className="help-faq-question">Как подписаться на клуб?</div>
                <div className="help-faq-answer">
                  Перейдите в раздел "Клубы", найдите интересующий клуб и нажмите кнопку "Подписаться".
                </div>
              </div>

              <div className="help-faq-item">
                <div className="help-faq-question">Как создать мероприятие?</div>
                <div className="help-faq-answer">
                  Перейдите в раздел "Мероприятия" и нажмите "+ Создать". Заполните информацию о мероприятии.
                </div>
              </div>

              <div className="help-faq-item">
                <div className="help-faq-question">Как связаться с поддержкой?</div>
                <div className="help-faq-answer">
                  Напишите на email: support@uniclub.app или используйте форму обратной связи.
                </div>
              </div>
            </div>
          </div>

          <div className="help-section">
            <h4 className="help-section-title">📧 Контакты</h4>
            <p className="help-contact">Email: support@uniclub.app</p>
            <p className="help-contact">Telegram: @uniclub_support</p>
          </div>
        </div>
      </Modal>
    </>
  );
}

export default ProfilePage;
