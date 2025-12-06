import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { haptic } from '../utils/haptic';
import { useNotification } from '../context/NotificationContext';
import { useApp } from '../context/AppContext';
import { getRoleName, getInitials } from '../utils/helpers';
import { PageHeader, Section, Button, FormField, Input, List, ListItem, Badge, StatCard, InlineLoading } from '../components/UI';
import { Modal } from '../components/Modal';
import { MobilePageHeader } from '../components/MobileNav';

export function ProfilePage() {
  const { user, logout, updateUser } = useApp();
  const { notify } = useNotification();

  const [myGroup, setMyGroup] = useState(null);
  const [myClubs, setMyClubs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: '', email: '' });
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadProfileData(); }, [user.id]);

  const loadProfileData = async () => {
    try {
      if (user.group_id) {
        const { data: group } = await supabase.from('study_groups').select('*, directions(name, faculties(name))').eq('id', user.group_id).single();
        setMyGroup(group);
      }

      const { data: subs } = await supabase.from('club_subscriptions').select('*, clubs(name, icon)').eq('student_id', user.id);
      setMyClubs(subs || []);

      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  const openEditModal = () => {
    setEditForm({ full_name: user.full_name, email: user.email });
    setShowEditModal(true);
  };

  const saveProfile = async () => {
    if (!editForm.full_name.trim() || !editForm.email.trim()) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('users').update({ full_name: editForm.full_name.trim(), email: editForm.email.toLowerCase().trim() }).eq('id', user.id);

      if (error) throw error;

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
  };

  const changePassword = async () => {
    if (passwordForm.new.length < 6) { notify.error('Минимум 6 символов'); haptic.error(); return; }
    if (passwordForm.new !== passwordForm.confirm) { notify.error('Пароли не совпадают'); haptic.error(); return; }

    setSubmitting(true);
    try {
      const currentHash = btoa(passwordForm.current);
      const { data: checkUser } = await supabase.from('users').select('id').eq('id', user.id).eq('password_hash', currentHash).single();

      if (!checkUser) { notify.error('Неверный текущий пароль'); haptic.error(); setSubmitting(false); return; }

      const newHash = btoa(passwordForm.new);
      await supabase.from('users').update({ password_hash: newHash }).eq('id', user.id);

      notify.success('Пароль изменён');
      setShowPasswordModal(false);
      setPasswordForm({ current: '', new: '', confirm: '' });
      haptic.success();
    } catch (error) {
      notify.error('Ошибка');
      haptic.error();
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    haptic.medium();
    logout();
  };

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
          <Section title="📚 Учебная информация" delay={1}>
            <List>
              <ListItem icon="🏛️" title="Факультет" subtitle={myGroup.directions?.faculties?.name || '—'} chevron={false} />
              <ListItem icon="📖" title="Направление" subtitle={myGroup.directions?.name || '—'} chevron={false} />
              <ListItem icon="👥" title="Группа" subtitle={myGroup.name} chevron={false} />
              <ListItem icon="📅" title="Курс" subtitle={`${myGroup.course} курс`} chevron={false} />
            </List>
          </Section>
        )}

        {myClubs.length > 0 && (
          <Section title="🎭 Мои клубы" delay={2}>
            <List>
              {myClubs.map((sub) => (
                <ListItem key={sub.id} icon={sub.clubs?.icon || '🎭'} title={sub.clubs?.name || 'Клуб'} chevron={false} />
              ))}
            </List>
          </Section>
        )}

        <Section title="⚙️ Настройки" delay={3}>
          <List>
            <ListItem icon="✏️" title="Редактировать профиль" onClick={openEditModal} />
            <ListItem icon="🔐" title="Изменить пароль" onClick={() => setShowPasswordModal(true)} />
          </List>
        </Section>

        <div className="profile-actions">
          <Button variant="danger" fullWidth onClick={handleLogout}>🚪 Выйти из аккаунта</Button>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Редактировать профиль" footer={
        <>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>Отмена</Button>
          <Button variant="primary" onClick={saveProfile} disabled={!editForm.full_name.trim() || !editForm.email.trim() || submitting}>{submitting ? 'Сохранение...' : 'Сохранить'}</Button>
        </>
      }>
        <FormField label="Имя и фамилия"><Input value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} placeholder="Иванов Иван" autoFocus /></FormField>
        <FormField label="Email"><Input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} placeholder="email@example.com" /></FormField>
      </Modal>

      {/* Change Password Modal */}
      <Modal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} title="Изменить пароль" footer={
        <>
          <Button variant="secondary" onClick={() => setShowPasswordModal(false)}>Отмена</Button>
          <Button variant="primary" onClick={changePassword} disabled={!passwordForm.current || !passwordForm.new || !passwordForm.confirm || submitting}>{submitting ? 'Сохранение...' : 'Изменить'}</Button>
        </>
      }>
        <FormField label="Текущий пароль"><Input type="password" value={passwordForm.current} onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })} placeholder="••••••••" autoFocus /></FormField>
        <FormField label="Новый пароль"><Input type="password" value={passwordForm.new} onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })} placeholder="Минимум 6 символов" /></FormField>
        <FormField label="Подтвердите пароль"><Input type="password" value={passwordForm.confirm} onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })} placeholder="Повторите новый пароль" /></FormField>
      </Modal>
    </>
  );
}

export default ProfilePage;
