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
  Skeleton,
  SkeletonList
} from '../components/UI';
import { Modal } from '../components/Modal';

/**
 * Profile Page
 */
export function ProfilePage() {
  const { user, logout } = useApp();
  const { notify } = useNotification();
  const [stats, setStats] = useState({ clubs: 0, events: 0 });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({ full_name: user.full_name });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfileData();
  }, [user.id]);

  const loadProfileData = async () => {
    try {
      // Get subscriptions count
      const { count: clubsCount } = await supabase
        .from('club_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', user.id);

      // Get events attended (we'll use events created for admins)
      const { count: eventsCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', user.id);

      setStats({
        clubs: clubsCount || 0,
        events: eventsCount || 0
      });

      // Get recent subscriptions
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

      // Update local user
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
            <Button 
              variant="secondary" 
              onClick={() => setShowEditModal(true)}
            >
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
            <EmptyState 
              icon="📋" 
              text="Нет активности" 
              small 
            />
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
          <h3 className="profile-section-title">⚙️ Аккаунт</h3>
          
          <div className="profile-menu">
            <div className="profile-menu-item" onClick={() => { haptic.light(); }}>
              <span className="profile-menu-icon">🔔</span>
              <span className="profile-menu-label">Уведомления</span>
              <span className="profile-menu-arrow">›</span>
            </div>
            <div className="profile-menu-item" onClick={() => { haptic.light(); }}>
              <span className="profile-menu-icon">🔒</span>
              <span className="profile-menu-label">Безопасность</span>
              <span className="profile-menu-arrow">›</span>
            </div>
            <div className="profile-menu-item" onClick={() => { haptic.light(); }}>
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
    </>
  );
}

export default ProfilePage;
