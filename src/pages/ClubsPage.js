/**
 * ClubsPage — Исправленная с полными правами админа
 */
import React, { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { supabase, invalidateCache } from '../utils/supabase';
import { getMembersText } from '../utils/helpers';
import { haptic } from '../utils/haptic';
import { useNotification } from '../context/NotificationContext';
import { useApp } from '../context/AppContext';
import { PageHeader, EmptyState, FilterTabs, Card, CardHeader, CardIcon, CardInfo, CardTitle, CardDescription, CardMeta, CardMetaItem, CardFooter, Button, Badge, FormField, Input, Textarea, PullToRefresh, SkeletonCard } from '../components/UI';
import { Modal } from '../components/Modal';
import { MobilePageHeader } from '../components/Navigation';
import { CLUB_ICONS } from '../utils/constants';

export const ClubsPage = memo(function ClubsPage() {
  const { user } = useApp();
  const { notify } = useNotification();
  const [clubs, setClubs] = useState([]);
  const [myClubs, setMyClubs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingClub, setEditingClub] = useState(null);
  const [clubForm, setClubForm] = useState({ name: '', description: '', icon: '🎭' });
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Админ может всё
  const canEdit = user.role === 'main_admin' || user.role === 'club_admin';

  const loadClubs = useCallback(async () => {
    try {
      const [clubsRes, subsRes] = await Promise.all([
        supabase.from('clubs').select('*').order('name'),
        supabase.from('club_subscriptions').select('club_id').eq('student_id', user.id)
      ]);
      
      setClubs(clubsRes.data || []);
      setMyClubs(subsRes.data?.map(s => s.club_id) || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => { loadClubs(); }, [loadClubs]);

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    await loadClubs();
    notify.success('Обновлено');
  }, [loadClubs, notify]);

  const openAddModal = useCallback(() => {
    setEditingClub(null);
    setClubForm({ name: '', description: '', icon: '🎭' });
    setShowModal(true);
  }, []);

  const openEditModal = useCallback((club) => {
    setEditingClub(club);
    setClubForm({
      name: club.name || '',
      description: club.description || '',
      icon: club.icon || '🎭'
    });
    setShowModal(true);
    haptic.light();
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setEditingClub(null);
  }, []);

  const saveClub = useCallback(async () => {
    if (!clubForm.name.trim()) {
      notify.error('Введите название клуба');
      return;
    }
    
    setSubmitting(true);
    try {
      const data = {
        name: clubForm.name.trim(),
        description: clubForm.description.trim(),
        icon: clubForm.icon
      };

      if (editingClub) {
        const { error } = await supabase.from('clubs').update(data).eq('id', editingClub.id);
        if (error) throw error;
        notify.success('Клуб обновлён');
      } else {
        const { error } = await supabase.from('clubs').insert({ ...data, created_by: user.id });
        if (error) throw error;
        notify.success('Клуб создан');
      }

      invalidateCache('clubs');
      closeModal();
      loadClubs();
      haptic.success();
    } catch (error) {
      console.error('Error:', error);
      notify.error('Ошибка сохранения');
      haptic.error();
    } finally {
      setSubmitting(false);
    }
  }, [clubForm, editingClub, user.id, loadClubs, notify, closeModal]);

  const deleteClub = useCallback(async (id, name, e) => {
    e?.stopPropagation();
    if (!window.confirm(`Удалить клуб "${name}"?`)) return;
    
    try {
      const { error } = await supabase.from('clubs').delete().eq('id', id);
      if (error) throw error;
      
      invalidateCache('clubs');
      loadClubs();
      notify.success('Клуб удалён');
      haptic.medium();
    } catch (error) {
      console.error('Error:', error);
      notify.error('Ошибка удаления');
      haptic.error();
    }
  }, [loadClubs, notify]);

  const toggleSubscription = useCallback(async (clubId, clubName, e) => {
    e?.stopPropagation();
    const isSubscribed = myClubs.includes(clubId);
    
    try {
      if (isSubscribed) {
        const { error } = await supabase
          .from('club_subscriptions')
          .delete()
          .eq('club_id', clubId)
          .eq('student_id', user.id);
        if (error) throw error;
        
        setMyClubs(prev => prev.filter(id => id !== clubId));
        notify.info(`Вы отписались от "${clubName}"`);
      } else {
        const { error } = await supabase
          .from('club_subscriptions')
          .insert({ club_id: clubId, student_id: user.id });
        if (error) throw error;
        
        setMyClubs(prev => [...prev, clubId]);
        notify.success(`Вы подписались на "${clubName}"`);
      }
      haptic.medium();
    } catch (error) {
      console.error('Error:', error);
      notify.error('Ошибка');
      haptic.error();
    }
  }, [myClubs, user.id, notify]);

  // Мемоизированная фильтрация
  const filteredClubs = useMemo(() => {
    let result = clubs.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
    if (filter === 'my') {
      result = result.filter(c => myClubs.includes(c.id));
    }
    return result;
  }, [clubs, search, filter, myClubs]);

  const filterTabs = useMemo(() => [
    { id: 'all', label: 'Все клубы' }, 
    { id: 'my', label: 'Мои клубы' }
  ], []);

  return (
    <>
      <PageHeader 
        title="🎭 Клубы" 
        action={canEdit && <Button variant="primary" onClick={openAddModal}>+ Создать</Button>} 
        search={search} 
        onSearch={setSearch} 
      />
      <MobilePageHeader 
        title="Клубы" 
        showSearch 
        searchValue={search} 
        onSearchChange={setSearch} 
        actions={canEdit ? [{ icon: 'plus', onClick: openAddModal, primary: true }] : []} 
      />

      <PullToRefresh onRefresh={handleRefresh}>
        <div className="page-content">
          <FilterTabs tabs={filterTabs} activeTab={filter} onChange={setFilter} />

          {loading ? (
            <div className="cards-grid">
              {[1,2,3].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : filteredClubs.length === 0 ? (
            <EmptyState 
              icon="🎭" 
              title="Нет клубов" 
              text={filter === 'my' ? 'Вы ещё не подписаны на клубы' : (search ? 'Ничего не найдено' : 'Создайте первый клуб')} 
              action={canEdit && filter !== 'my' && !search && (
                <Button variant="primary" onClick={openAddModal}>+ Создать клуб</Button>
              )}
            />
          ) : (
            <div className="cards-grid">
              {filteredClubs.map((club) => {
                const isSubscribed = myClubs.includes(club.id);
                const memberCount = club.members_count || 0;

                return (
                  <Card 
                    key={club.id} 
                    className="card-pressable"
                    onClick={canEdit ? () => openEditModal(club) : undefined}
                  >
                    <CardHeader>
                      <CardIcon subscribed={isSubscribed}>{club.icon || '🎭'}</CardIcon>
                      <CardInfo>
                        <CardTitle>
                          {club.name} 
                          {isSubscribed && <Badge variant="green">✓ Подписан</Badge>}
                        </CardTitle>
                        <CardDescription>{club.description || 'Описание отсутствует'}</CardDescription>
                        <CardMeta>
                          <CardMetaItem>👥 {getMembersText(memberCount)}</CardMetaItem>
                        </CardMeta>
                      </CardInfo>
                    </CardHeader>
                    <CardFooter>
                      <Button 
                        variant={isSubscribed ? 'secondary' : 'primary'} 
                        size="small" 
                        onClick={(e) => toggleSubscription(club.id, club.name, e)}
                      >
                        {isSubscribed ? 'Отписаться' : 'Подписаться'}
                      </Button>
                      {canEdit && (
                        <>
                          <Button 
                            variant="secondary" 
                            size="small" 
                            onClick={(e) => { e.stopPropagation(); openEditModal(club); }}
                          >
                            ✏️
                          </Button>
                          <Button 
                            variant="danger" 
                            size="small" 
                            onClick={(e) => deleteClub(club.id, club.name, e)}
                          >
                            🗑️
                          </Button>
                        </>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </PullToRefresh>

      {/* Модальное окно создания/редактирования */}
      <Modal 
        isOpen={showModal} 
        onClose={closeModal} 
        title={editingClub ? 'Редактировать клуб' : 'Создать клуб'} 
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>Отмена</Button>
            <Button 
              variant="primary" 
              onClick={saveClub} 
              disabled={!clubForm.name.trim() || submitting}
            >
              {submitting ? 'Сохранение...' : (editingClub ? 'Сохранить' : 'Создать')}
            </Button>
          </>
        }
      >
        <FormField label="Иконка">
          <div className="icon-picker">
            {CLUB_ICONS.map(icon => (
              <button 
                key={icon} 
                type="button" 
                className={`icon-option ${clubForm.icon === icon ? 'active' : ''}`} 
                onClick={() => setClubForm(prev => ({ ...prev, icon }))}
              >
                {icon}
              </button>
            ))}
          </div>
        </FormField>
        
        <FormField label="Название клуба *">
          <Input 
            value={clubForm.name} 
            onChange={(e) => setClubForm(prev => ({ ...prev, name: e.target.value }))} 
            placeholder="Например: IT-клуб" 
            autoFocus 
          />
        </FormField>
        
        <FormField label="Описание">
          <Textarea 
            value={clubForm.description} 
            onChange={(e) => setClubForm(prev => ({ ...prev, description: e.target.value }))} 
            placeholder="Расскажите о клубе, чем вы занимаетесь..." 
          />
        </FormField>
      </Modal>
    </>
  );
});

export default ClubsPage;
