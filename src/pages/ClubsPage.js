/**
 * ClubsPage — Оптимизированная
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
  const [newClub, setNewClub] = useState({ name: '', description: '', icon: '🎭' });
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const canEdit = user.role === 'main_admin' || user.role === 'club_admin';

  const loadClubs = useCallback(async () => {
    try {
      const [clubsRes, subsRes] = await Promise.all([
        supabase.from('clubs').select('*, club_subscriptions(count)').order('name'),
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

  const addClub = useCallback(async () => {
    if (!newClub.name.trim()) return;
    setSubmitting(true);
    try {
      await supabase.from('clubs').insert({ ...newClub, created_by: user.id });
      invalidateCache('clubs');
      setNewClub({ name: '', description: '', icon: '🎭' });
      setShowModal(false);
      loadClubs();
      notify.success('Клуб создан');
      haptic.success();
    } catch (error) {
      notify.error('Ошибка создания');
      haptic.error();
    } finally {
      setSubmitting(false);
    }
  }, [newClub, user.id, loadClubs, notify]);

  const deleteClub = useCallback(async (id) => {
    if (!window.confirm('Удалить этот клуб?')) return;
    try {
      await supabase.from('clubs').delete().eq('id', id);
      invalidateCache('clubs');
      loadClubs();
      notify.success('Клуб удалён');
      haptic.medium();
    } catch (error) {
      notify.error('Ошибка удаления');
      haptic.error();
    }
  }, [loadClubs, notify]);

  const toggleSubscription = useCallback(async (clubId, clubName) => {
    const isSubscribed = myClubs.includes(clubId);
    try {
      if (isSubscribed) {
        await supabase.from('club_subscriptions').delete().eq('club_id', clubId).eq('student_id', user.id);
        setMyClubs(prev => prev.filter(id => id !== clubId));
        notify.info(`Отписка от "${clubName}"`);
      } else {
        await supabase.from('club_subscriptions').insert({ club_id: clubId, student_id: user.id });
        setMyClubs(prev => [...prev, clubId]);
        notify.success(`Подписка на "${clubName}"`);
      }
      haptic.medium();
    } catch (error) {
      notify.error('Ошибка');
      haptic.error();
    }
  }, [myClubs, user.id, notify]);

  // Мемоизированная фильтрация
  const filteredClubs = useMemo(() => {
    let result = clubs.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
    if (filter === 'my') result = result.filter(c => myClubs.includes(c.id));
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
        action={canEdit && <Button variant="primary" onClick={() => setShowModal(true)}>+ Создать</Button>} 
        search={search} 
        onSearch={setSearch} 
      />
      <MobilePageHeader 
        title="Клубы" 
        showSearch 
        searchValue={search} 
        onSearchChange={setSearch} 
        actions={canEdit ? [{ icon: 'plus', onClick: () => setShowModal(true), primary: true }] : []} 
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
              text={filter === 'my' ? 'Вы ещё не подписаны' : 'Создайте первый клуб'} 
            />
          ) : (
            <div className="cards-grid">
              {filteredClubs.map((club) => {
                const isSubscribed = myClubs.includes(club.id);
                const memberCount = club.club_subscriptions?.[0]?.count || 0;

                return (
                  <Card key={club.id} className="card-pressable">
                    <CardHeader>
                      <CardIcon subscribed={isSubscribed}>{club.icon || '🎭'}</CardIcon>
                      <CardInfo>
                        <CardTitle>{club.name} {isSubscribed && <Badge variant="green">✓</Badge>}</CardTitle>
                        <CardDescription>{club.description || 'Описание отсутствует'}</CardDescription>
                        <CardMeta><CardMetaItem icon="👥">{getMembersText(memberCount)}</CardMetaItem></CardMeta>
                      </CardInfo>
                    </CardHeader>
                    <CardFooter>
                      <Button 
                        variant={isSubscribed ? 'secondary' : 'primary'} 
                        size="small" 
                        fullWidth={!canEdit} 
                        onClick={(e) => { e.stopPropagation(); toggleSubscription(club.id, club.name); }}
                      >
                        {isSubscribed ? 'Отписаться' : 'Подписаться'}
                      </Button>
                      {canEdit && (
                        <Button variant="danger" size="small" onClick={(e) => { e.stopPropagation(); deleteClub(club.id); }}>
                          Удалить
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </PullToRefresh>

      <Modal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        title="Создать клуб" 
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Отмена</Button>
            <Button variant="primary" onClick={addClub} disabled={!newClub.name.trim() || submitting}>
              {submitting ? 'Создание...' : 'Создать'}
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
                className={`icon-option ${newClub.icon === icon ? 'active' : ''}`} 
                onClick={() => setNewClub(prev => ({ ...prev, icon }))}
              >
                {icon}
              </button>
            ))}
          </div>
        </FormField>
        <FormField label="Название клуба">
          <Input 
            value={newClub.name} 
            onChange={(e) => setNewClub(prev => ({ ...prev, name: e.target.value }))} 
            placeholder="Например: IT-клуб" 
            autoFocus 
          />
        </FormField>
        <FormField label="Описание">
          <Textarea 
            value={newClub.description} 
            onChange={(e) => setNewClub(prev => ({ ...prev, description: e.target.value }))} 
            placeholder="Расскажите о клубе..." 
          />
        </FormField>
      </Modal>
    </>
  );
});

export default ClubsPage;
