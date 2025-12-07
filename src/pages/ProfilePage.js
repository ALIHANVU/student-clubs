/**
 * ProfilePage — Оптимизированная
 */
import React, { useState, useEffect, useCallback, memo } from 'react';
import { supabase } from '../utils/supabase';
import { haptic } from '../utils/haptic';
import { useNotification } from '../context/NotificationContext';
import { useApp } from '../context/AppContext';
import { getRoleName, getInitials } from '../utils/helpers';
import { PageHeader, Section, Button, FormField, Input, List, ListItem, Badge, StatCard, InlineLoading } from '../components/UI';
import { Modal } from '../components/Modal';
import { MobilePageHeader } from '../components/Navigation';

export const ProfilePage = memo(function ProfilePage() {
  const { user, logout, updateUser } = useApp();
  const { notify } = useNotification();

  const [myGroup, setMyGroup] = useState(null);
  const [myClubs, setMyClubs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: '', email: '' });
  const [passwordForm, setPasswordForm] = useState({ current: '', new_pwd: '', confirm: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const [groupRes, subsRes] = await Promise.all([
          user.group_id 
            ? supabase.from('study_groups').select('*, directions(name, faculties(name))').eq('id', user.group_id).single() 
            : Promise.resolve({ data: null }),
          supabase.from('club_subscriptions').select('*, clubs(name, icon)').eq('student_id', user.id)
        ]);

        setMyGroup(groupRes.data);
        setMyClubs(subsRes.data || []);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, [user.id, user.group_id]);

  const openEditModal = useCallback(() => {
    setEditForm({ full_name: user.full_name, email: user.email });
    setShowEditModal(true);
  }, [user]);

  const saveProfile = useCallback(async () => {
    if (!editForm.full_name.trim() || !editForm.email.trim()) return;
    setSubmitting(true);
    try {
      await supabase.from('users')
        .update({ full_name: editForm.full_name.trim(), email: editForm.email.toLowerCase().trim() })
        .eq('id', user.id);

      updateUser({ full_name: editForm.full_name.trim(), email: editForm.email.toLowerCase().trim() });
      notify.success('Профиль обновлён');
      setShowEditModal(false);
      haptic.success();
    } catch (error) {
      notify.error('Ошибка сохранения');
      haptic.error();
    } finally {
      setSubmitting(false);
    }
  }, [editForm, user.id, updateUser, notify]);

  const changePassword = useCallback(async () => {
    if (passwordForm.new_pwd.length < 6) { notify.error('Минимум 6 символов'); haptic.error(); return; }
    if (passwordForm.new_pwd !== passwordForm.confirm) { notify.error('Пароли не совпадают'); haptic.error(); return; }

    setSubmitting(true);
    try {
      const currentHash = btoa(passwordForm.current);
      const { data: checkUser } = await supabase.from('users').select('id').eq('id', user.id).eq('password_hash', currentHash).single();

      if (!checkUser) { notify.error('Неверный текущий пароль'); haptic.error(); setSubmitting(false); return; }

      const newHash = btoa(passwordForm.new_pwd);
      await supabase.from('users').update({ password_hash: newHash }).eq('id', user.id);

      notify.success('Пароль изменён');
      setShowPasswordModal(false);
      setPasswordForm({ current: '', new_pwd: '', confirm: '' });
      haptic.success();
    } catch (error) {
      notify.error('Ошибка');
      haptic.error();
    } finally {
      setSubmitting(false);
    }
  }, [passwordForm, user.id, notify]);

  const handleLogout = useCallback(() => {
    haptic.medium();
    logout();
  }, [logout]);

  const initials = getInitials(user.full_name);
  const roleName = getRoleName(user.role);

  if (loading) {
    return (
      <React.Fragment>
        <PageHeader title="Профиль" />
        <MobilePageHeader title="Профиль" />
        <div className="page-content"><InlineLoading /></div>
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      <PageHeader title="Профиль" />
      <MobilePageHeader title="Профиль" />

      <div className="page-content">
        <div className="profile-header">
          <div className="profile-avatar">{initials}</div>
          <div className="profile-info">
            <h2 className="profile-name">{user.full_name}</h2>
            <p className="profile-email">{user.email}</p>
            <Badge variant="blue">{roleName}</Badge>
          </div>
        </div>

        <div className="stats-grid">
          <StatCard icon="🎭" color="blue" value={myClubs.length} label="Клубов" />
          {myGroup && <StatCard icon="👥" color="green" value={myGroup.name} label="Группа" />}
        </div>

        {myGroup && (
          <Section title="Учебная информация">
            <List>
              <ListItem icon="🏛️" title="Факультет" subtitle={myGroup.directions?.faculties?.name || '—'} chevron={false} />
              <ListItem icon="📖" title="Направление" subtitle={myGroup.directions?.name || '—'} chevron={false} />
              <ListItem icon="👥" title="Группа" subtitle={myGroup.name} chevron={false} />
              <ListItem icon="📅" title="Курс" subtitle={myGroup.course + ' курс'} chevron={false} />
            </List>
          </Section>
        )}

        {myClubs.length > 0 && (
          <Section title="Мои клубы">
            <List>
              {myClubs.map((sub) => (
                <ListItem key={sub.id} icon={sub.clubs?.icon || '🎭'} title={sub.clubs?.name || 'Клуб'} chevron={false} />
              ))}
            </List>
          </Section>
        )}

        <Section title="Настройки">
          <List>
            <ListItem icon="✏️" title="Редактировать профиль" onClick={openEditModal} />
            <ListItem icon="🔐" title="Изменить пароль" onClick={() => setShowPasswordModal(true)} />
          </List>
        </Section>

        <div className="profile-actions">
          <Button variant="danger" fullWidth onClick={handleLogout}>🚪 Выйти из аккаунта</Button>
        </div>
      </div>

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Редактировать профиль" footer={
        <React.Fragment>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>Отмена</Button>
          <Button variant="primary" onClick={saveProfile} disabled={!editForm.full_name.trim() || !editForm.email.trim() || submitting}>{submitting ? 'Сохранение...' : 'Сохранить'}</Button>
        </React.Fragment>
      }>
        <FormField label="Имя и фамилия"><Input value={editForm.full_name} onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))} placeholder="Иванов Иван" autoFocus /></FormField>
        <FormField label="Email"><Input type="email" value={editForm.email} onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))} placeholder="email@example.com" /></FormField>
      </Modal>

      <Modal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} title="Изменить пароль" footer={
        <React.Fragment>
          <Button variant="secondary" onClick={() => setShowPasswordModal(false)}>Отмена</Button>
          <Button variant="primary" onClick={changePassword} disabled={!passwordForm.current || !passwordForm.new_pwd || !passwordForm.confirm || submitting}>{submitting ? 'Сохранение...' : 'Изменить'}</Button>
        </React.Fragment>
      }>
        <FormField label="Текущий пароль"><Input type="password" value={passwordForm.current} onChange={(e) => setPasswordForm(prev => ({ ...prev, current: e.target.value }))} autoFocus /></FormField>
        <FormField label="Новый пароль"><Input type="password" value={passwordForm.new_pwd} onChange={(e) => setPasswordForm(prev => ({ ...prev, new_pwd: e.target.value }))} placeholder="Минимум 6 символов" /></FormField>
        <FormField label="Подтвердите пароль"><Input type="password" value={passwordForm.confirm} onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm: e.target.value }))} /></FormField>
      </Modal>
    </React.Fragment>
  );
});

export default ProfilePage;
