/**
 * ProfilePage — с аватаркой и настройками темы
 */
import React, { useState, useEffect, useCallback, memo } from 'react';
import { supabase } from '../utils/supabase';
import { haptic } from '../utils/haptic';
import { useNotification } from '../context/NotificationContext';
import { useApp } from '../context/AppContext';
import { getRoleName, getInitials } from '../utils/helpers';
import { PageHeader, Section, Button, FormField, Input, List, ListItem, Badge, StatCard, InlineLoading, Toggle } from '../components/UI';
import { Modal } from '../components/Modal';
import { MobilePageHeader } from '../components/Navigation';

// Тема
const THEME_KEY = 'uniclub_theme';

export const ProfilePage = memo(function ProfilePage() {
  const { user, logout, updateUser } = useApp();
  const { notify } = useNotification();

  const [myGroup, setMyGroup] = useState(null);
  const [myClubs, setMyClubs] = useState([]);
  const [managedClub, setManagedClub] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  
  const [editForm, setEditForm] = useState({ full_name: '', email: '' });
  const [passwordForm, setPasswordForm] = useState({ current: '', new_pwd: '', confirm: '' });
  const [avatarUrl, setAvatarUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Тема
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem(THEME_KEY) || 'auto';
  });

  // Уведомления
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    return localStorage.getItem('uniclub_notifications') !== 'false';
  });

  // Применение темы
  useEffect(() => {
    const root = document.documentElement;
    
    if (theme === 'light') {
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
    } else if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
    } else {
      root.removeAttribute('data-theme');
      root.style.colorScheme = 'light dark';
    }
    
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const promises = [
          // Группа пользователя
          user.group_id 
            ? supabase
                .from('study_groups')
                .select('*, directions(name, faculties(name))')
                .eq('id', user.group_id)
                .single() 
            : Promise.resolve({ data: null }),
          // Подписки на клубы
          supabase
            .from('club_subscriptions')
            .select('*, clubs(name, icon)')
            .eq('student_id', user.id),
          // Клуб, которым управляет (для club_admin)
          user.role === 'club_admin'
            ? supabase
                .from('clubs')
                .select('*')
                .eq('admin_id', user.id)
                .single()
            : Promise.resolve({ data: null })
        ];

        const [groupRes, subsRes, clubRes] = await Promise.all(promises);

        setMyGroup(groupRes.data);
        setMyClubs(subsRes.data || []);
        setManagedClub(clubRes.data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, [user.id, user.group_id, user.role]);

  const openEditModal = useCallback(() => {
    setEditForm({ full_name: user.full_name, email: user.email });
    setShowEditModal(true);
  }, [user]);

  const openAvatarModal = useCallback(() => {
    setAvatarUrl(user.avatar_url || '');
    setShowAvatarModal(true);
  }, [user]);

  const saveProfile = useCallback(async () => {
    if (!editForm.full_name.trim() || !editForm.email.trim()) {
      notify.error('Заполните все поля');
      return;
    }
    
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          full_name: editForm.full_name.trim(), 
          email: editForm.email.toLowerCase().trim() 
        })
        .eq('id', user.id);

      if (error) throw error;

      updateUser({ 
        full_name: editForm.full_name.trim(), 
        email: editForm.email.toLowerCase().trim() 
      });
      notify.success('Профиль обновлён');
      setShowEditModal(false);
      haptic.success();
    } catch (error) {
      console.error('Error:', error);
      notify.error('Ошибка сохранения');
      haptic.error();
    } finally {
      setSubmitting(false);
    }
  }, [editForm, user.id, updateUser, notify]);

  const saveAvatar = useCallback(async () => {
    setSubmitting(true);
    try {
      const url = avatarUrl.trim() || null;
      
      const { error } = await supabase
        .from('users')
        .update({ avatar_url: url })
        .eq('id', user.id);

      if (error) throw error;

      updateUser({ avatar_url: url });
      notify.success('Аватарка обновлена');
      setShowAvatarModal(false);
      haptic.success();
    } catch (error) {
      console.error('Error:', error);
      notify.error('Ошибка сохранения');
      haptic.error();
    } finally {
      setSubmitting(false);
    }
  }, [avatarUrl, user.id, updateUser, notify]);

  const changePassword = useCallback(async () => {
    if (passwordForm.new_pwd.length < 6) { 
      notify.error('Пароль должен быть минимум 6 символов'); 
      haptic.error(); 
      return; 
    }
    if (passwordForm.new_pwd !== passwordForm.confirm) { 
      notify.error('Пароли не совпадают'); 
      haptic.error(); 
      return; 
    }

    setSubmitting(true);
    try {
      // Проверяем текущий пароль
      const currentHash = btoa(passwordForm.current);
      const { data: checkUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .eq('password_hash', currentHash)
        .single();

      if (!checkUser) { 
        notify.error('Неверный текущий пароль'); 
        haptic.error(); 
        setSubmitting(false); 
        return; 
      }

      // Обновляем пароль
      const newHash = btoa(passwordForm.new_pwd);
      const { error } = await supabase
        .from('users')
        .update({ password_hash: newHash })
        .eq('id', user.id);

      if (error) throw error;

      notify.success('Пароль изменён');
      setShowPasswordModal(false);
      setPasswordForm({ current: '', new_pwd: '', confirm: '' });
      haptic.success();
    } catch (error) {
      console.error('Error:', error);
      notify.error('Ошибка смены пароля');
      haptic.error();
    } finally {
      setSubmitting(false);
    }
  }, [passwordForm, user.id, notify]);

  const handleLogout = useCallback(() => {
    haptic.medium();
    logout();
  }, [logout]);

  const toggleNotifications = useCallback((enabled) => {
    setNotificationsEnabled(enabled);
    localStorage.setItem('uniclub_notifications', enabled ? 'true' : 'false');
    notify.info(enabled ? 'Уведомления включены' : 'Уведомления выключены');
    haptic.light();
  }, [notify]);

  const changeTheme = useCallback((newTheme) => {
    setTheme(newTheme);
    haptic.light();
    
    const names = { auto: 'Авто', light: 'Светлая', dark: 'Тёмная' };
    notify.info(`Тема: ${names[newTheme]}`);
  }, [notify]);

  const initials = getInitials(user.full_name);
  const roleName = getRoleName(user.role);

  if (loading) {
    return (
      <>
        <PageHeader title="👤 Профиль" />
        <MobilePageHeader title="Профиль" />
        <div className="page-content"><InlineLoading /></div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="👤 Профиль" />
      <MobilePageHeader title="Профиль" />

      <div className="page-content">
        {/* Шапка профиля */}
        <div className="profile-header">
          <div 
            className="profile-avatar clickable" 
            onClick={openAvatarModal}
            title="Изменить аватарку"
          >
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="" className="profile-avatar-img" />
            ) : (
              initials
            )}
            <div className="profile-avatar-edit">📷</div>
          </div>
          <div className="profile-info">
            <h2 className="profile-name">{user.full_name}</h2>
            <p className="profile-email">{user.email}</p>
            <Badge variant="blue">{roleName}</Badge>
          </div>
        </div>

        {/* Статистика */}
        <div className="stats-grid">
          <StatCard icon="🎭" color="blue" value={myClubs.length} label="Клубов" />
          {myGroup && <StatCard icon="👥" color="green" value={myGroup.name} label="Группа" />}
          {managedClub && <StatCard icon="👑" color="orange" value={managedClub.name} label="Управляю" />}
        </div>

        {/* Учебная информация */}
        {myGroup && (
          <Section title="🎓 Учебная информация">
            <List>
              <ListItem icon="🏛️" title="Факультет" subtitle={myGroup.directions?.faculties?.name || '—'} chevron={false} />
              <ListItem icon="📖" title="Направление" subtitle={myGroup.directions?.name || '—'} chevron={false} />
              <ListItem icon="👥" title="Группа" subtitle={myGroup.name} chevron={false} />
              <ListItem icon="📅" title="Курс" subtitle={`${myGroup.course} курс`} chevron={false} />
            </List>
          </Section>
        )}

        {/* Клуб, которым управляю */}
        {managedClub && (
          <Section title="👑 Мой клуб">
            <List>
              <ListItem 
                icon={managedClub.icon || '🎭'} 
                title={managedClub.name} 
                subtitle={managedClub.description || 'Вы администратор этого клуба'} 
                chevron={false} 
              />
            </List>
          </Section>
        )}

        {/* Мои клубы */}
        {myClubs.length > 0 && (
          <Section title="🎭 Мои подписки">
            <List>
              {myClubs.map((sub) => (
                <ListItem 
                  key={sub.id} 
                  icon={sub.clubs?.icon || '🎭'} 
                  title={sub.clubs?.name || 'Клуб'} 
                  chevron={false} 
                />
              ))}
            </List>
          </Section>
        )}

        {/* Настройки */}
        <Section title="⚙️ Настройки">
          <List>
            <ListItem icon="✏️" title="Редактировать профиль" onClick={openEditModal} />
            <ListItem icon="📷" title="Изменить аватарку" onClick={openAvatarModal} />
            <ListItem icon="🔐" title="Изменить пароль" onClick={() => setShowPasswordModal(true)} />
          </List>
        </Section>

        {/* Внешний вид */}
        <Section title="🎨 Внешний вид">
          <List>
            <ListItem 
              icon="☀️" 
              title="Тема оформления" 
              subtitle={theme === 'auto' ? 'Автоматически' : theme === 'light' ? 'Светлая' : 'Тёмная'}
              chevron={false}
              accessory={
                <div className="theme-selector">
                  <button 
                    className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
                    onClick={() => changeTheme('light')}
                    title="Светлая"
                  >
                    ☀️
                  </button>
                  <button 
                    className={`theme-btn ${theme === 'auto' ? 'active' : ''}`}
                    onClick={() => changeTheme('auto')}
                    title="Авто"
                  >
                    🔄
                  </button>
                  <button 
                    className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
                    onClick={() => changeTheme('dark')}
                    title="Тёмная"
                  >
                    🌙
                  </button>
                </div>
              }
            />
            <ListItem 
              icon="🔔" 
              title="Уведомления" 
              subtitle={notificationsEnabled ? 'Включены' : 'Выключены'}
              chevron={false}
              accessory={
                <Toggle 
                  checked={notificationsEnabled} 
                  onChange={toggleNotifications} 
                />
              }
            />
          </List>
        </Section>

        {/* Выход */}
        <div className="profile-actions">
          <Button variant="danger" fullWidth onClick={handleLogout}>
            🚪 Выйти из аккаунта
          </Button>
        </div>

        {/* Версия */}
        <div className="profile-version">
          UniClub v5.0 • Made with ❤️
        </div>
      </div>

      {/* Модалка редактирования профиля */}
      <Modal 
        isOpen={showEditModal} 
        onClose={() => setShowEditModal(false)} 
        title="Редактировать профиль" 
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>Отмена</Button>
            <Button 
              variant="primary" 
              onClick={saveProfile} 
              disabled={!editForm.full_name.trim() || !editForm.email.trim() || submitting}
            >
              {submitting ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </>
        }
      >
        <FormField label="Имя и фамилия">
          <Input 
            value={editForm.full_name} 
            onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))} 
            placeholder="Иванов Иван" 
            autoFocus 
          />
        </FormField>
        <FormField label="Email">
          <Input 
            type="email" 
            value={editForm.email} 
            onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))} 
            placeholder="email@example.com" 
          />
        </FormField>
      </Modal>

      {/* Модалка аватарки */}
      <Modal 
        isOpen={showAvatarModal} 
        onClose={() => setShowAvatarModal(false)} 
        title="Изменить аватарку" 
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowAvatarModal(false)}>Отмена</Button>
            <Button variant="primary" onClick={saveAvatar} disabled={submitting}>
              {submitting ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </>
        }
      >
        <div className="avatar-preview">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Preview" className="avatar-preview-img" />
          ) : (
            <div className="avatar-preview-placeholder">{initials}</div>
          )}
        </div>
        
        <FormField label="URL изображения">
          <Input 
            value={avatarUrl} 
            onChange={(e) => setAvatarUrl(e.target.value)} 
            placeholder="https://example.com/avatar.jpg" 
          />
        </FormField>
        
        <p className="avatar-hint">
          Вставьте ссылку на изображение. Можете использовать сервисы вроде 
          <a href="https://imgur.com" target="_blank" rel="noopener noreferrer"> Imgur</a> или 
          <a href="https://postimages.org" target="_blank" rel="noopener noreferrer"> PostImages</a>.
        </p>

        {avatarUrl && (
          <Button 
            variant="secondary" 
            fullWidth 
            onClick={() => setAvatarUrl('')}
            style={{ marginTop: 12 }}
          >
            🗑️ Удалить аватарку
          </Button>
        )}
      </Modal>

      {/* Модалка смены пароля */}
      <Modal 
        isOpen={showPasswordModal} 
        onClose={() => setShowPasswordModal(false)} 
        title="Изменить пароль" 
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowPasswordModal(false)}>Отмена</Button>
            <Button 
              variant="primary" 
              onClick={changePassword} 
              disabled={!passwordForm.current || !passwordForm.new_pwd || !passwordForm.confirm || submitting}
            >
              {submitting ? 'Сохранение...' : 'Изменить'}
            </Button>
          </>
        }
      >
        <FormField label="Текущий пароль">
          <Input 
            type="password" 
            value={passwordForm.current} 
            onChange={(e) => setPasswordForm(prev => ({ ...prev, current: e.target.value }))} 
            autoFocus 
          />
        </FormField>
        <FormField label="Новый пароль">
          <Input 
            type="password" 
            value={passwordForm.new_pwd} 
            onChange={(e) => setPasswordForm(prev => ({ ...prev, new_pwd: e.target.value }))} 
            placeholder="Минимум 6 символов" 
          />
        </FormField>
        <FormField label="Подтвердите пароль">
          <Input 
            type="password" 
            value={passwordForm.confirm} 
            onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm: e.target.value }))} 
          />
        </FormField>
      </Modal>
    </>
  );
});

export default ProfilePage;
