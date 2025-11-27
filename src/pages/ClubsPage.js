import React, { useState, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import { getMembersText } from '../utils/helpers';
import { haptic } from '../utils/haptic';
import { useNotification } from '../context/NotificationContext';
import { useApp } from '../context/AppContext';
import { useOfflineCache } from '../hooks';
import { 
  PageHeader, 
  EmptyState, 
  FilterTabs,
  Card,
  CardHeader,
  CardIcon,
  CardInfo,
  CardTitle,
  CardDescription,
  CardMeta,
  CardMetaItem,
  CardFooter,
  Button,
  Badge,
  FormField,
  Input,
  Textarea,
  PullToRefresh
} from '../components/UI';
import { Modal } from '../components/Modal';
import { MobilePageHeader } from '../components/MobileNav';
import { 
  SwipeableCard, 
  LongPressWrapper, 
  ActionSheet,
  SkeletonCard,
  OfflineBanner 
} from '../components/Gestures';
import { IconByName } from '../components/Icons';

/**
 * Clubs Page with gestures and offline support
 */
export function ClubsPage({ onClubClick }) {
  const { user } = useApp();
  const { notify } = useNotification();
  const [myClubs, setMyClubs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newClub, setNewClub] = useState({ name: '', description: '', icon: 'grid' });
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [submitting, setSubmitting] = useState(false);
  const [actionSheet, setActionSheet] = useState({ open: false, club: null });

  const canEdit = user.role === 'main_admin' || user.role === 'club_admin';

  // Offline cache
  const fetchClubs = useCallback(async () => {
    const { data } = await supabase
      .from('clubs')
      .select('*, club_subscriptions(count)')
      .order('name');
    
    const { data: subs } = await supabase
      .from('club_subscriptions')
      .select('club_id')
      .eq('student_id', user.id);
    
    setMyClubs(subs?.map(s => s.club_id) || []);
    return data || [];
  }, [user.id]);

  const { 
    data: clubs, 
    loading, 
    isFromCache, 
    refresh, 
    isOnline 
  } = useOfflineCache('clubs', fetchClubs, { ttl: 5 * 60 * 1000 });

  const handleRefresh = async () => {
    await refresh(true);
    notify.success('Обновлено');
  };

  const addClub = async () => {
    if (!newClub.name.trim()) return;
    
    setSubmitting(true);
    try {
      await supabase.from('clubs').insert({
        ...newClub,
        created_by: user.id
      });
      setNewClub({ name: '', description: '', icon: 'grid' });
      setShowModal(false);
      refresh(true);
      notify.success('Клуб создан');
      haptic.success();
    } catch (error) {
      console.error('Error adding club:', error);
      notify.error('Ошибка создания');
      haptic.error();
    } finally {
      setSubmitting(false);
    }
  };

  const deleteClub = async (id) => {
    try {
      await supabase.from('clubs').delete().eq('id', id);
      refresh(true);
      notify.success('Клуб удалён');
      haptic.medium();
    } catch (error) {
      console.error('Error deleting club:', error);
      notify.error('Ошибка удаления');
      haptic.error();
    }
  };

  const toggleSubscription = async (clubId, clubName) => {
    if (!isOnline) {
      notify.error('Нет подключения к интернету');
      haptic.error();
      return;
    }

    try {
      if (myClubs.includes(clubId)) {
        await supabase
          .from('club_subscriptions')
          .delete()
          .eq('club_id', clubId)
          .eq('student_id', user.id);
        setMyClubs(prev => prev.filter(id => id !== clubId));
        notify.info(`Вы отписались от "${clubName}"`);
      } else {
        await supabase
          .from('club_subscriptions')
          .insert({ club_id: clubId, student_id: user.id });
        setMyClubs(prev => [...prev, clubId]);
        notify.success(`Вы подписались на "${clubName}"`);
      }
      haptic.medium();
    } catch (error) {
      console.error('Error toggling subscription:', error);
      notify.error('Ошибка');
      haptic.error();
    }
  };

  const handleLongPress = (club) => {
    setActionSheet({ open: true, club });
  };

  // Фильтрация
  let filteredClubs = (clubs || []).filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  if (filter === 'my') {
    filteredClubs = filteredClubs.filter(c => myClubs.includes(c.id));
  }

  const iconOptions = ['grid', 'star', 'heart', 'book', 'lab', 'calendar', 'clock', 'location', 'bell', 'users'];

  return (
    <>
      {/* Desktop Header */}
      <PageHeader
        title="Клубы"
        action={canEdit && (
          <Button variant="primary" onClick={() => setShowModal(true)}>
            + Создать
          </Button>
        )}
        search={search}
        onSearch={setSearch}
      />
      
      {/* Mobile Header */}
      <MobilePageHeader
        title="Клубы"
        showSearch={true}
        searchValue={search}
        onSearchChange={setSearch}
        actions={canEdit ? [{ icon: 'plus', onClick: () => setShowModal(true), primary: true }] : []}
      />

      {/* Offline Banner */}
      <OfflineBanner isOnline={isOnline} isFromCache={isFromCache} />

      <PullToRefresh onRefresh={handleRefresh}>
        <div className="page-content">
          <FilterTabs
            tabs={[
              { id: 'all', label: 'Все клубы' },
              { id: 'my', label: 'Мои клубы' }
            ]}
            activeTab={filter}
            onChange={(id) => { setFilter(id); haptic.light(); }}
          />

          {loading ? (
            <div className="cards-grid">
              {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : filteredClubs.length === 0 ? (
            <EmptyState
              icon={<IconByName name="grid" size={48} />}
              title="Нет клубов"
              text={filter === 'my' ? 'Вы ещё не подписаны на клубы' : 'Создайте первый клуб'}
            />
          ) : (
            <div className="cards-grid">
              {filteredClubs.map((club, index) => {
                const isSubscribed = myClubs.includes(club.id);
                const memberCount = club.club_subscriptions?.[0]?.count || 0;

                return (
                  <SwipeableCard
                    key={club.id}
                    onDelete={canEdit ? () => deleteClub(club.id) : null}
                    onAction={() => toggleSubscription(club.id, club.name)}
                    actionIcon={isSubscribed ? '−' : '+'}
                    actionColor={isSubscribed ? 'orange' : 'green'}
                    deleteEnabled={canEdit}
                  >
                    <LongPressWrapper 
                      onLongPress={() => handleLongPress(club)}
                      onPress={() => onClubClick && onClubClick(club.id)}
                    >
                      <Card 
                        delay={index}
                        className="card-pressable"
                      >
                        <CardHeader>
                          <CardIcon subscribed={isSubscribed}>
                            <IconByName name={club.icon || 'grid'} size={24} />
                          </CardIcon>
                          <CardInfo>
                            <CardTitle>
                              {club.name}
                              {isSubscribed && <Badge variant="green">✓</Badge>}
                            </CardTitle>
                            <CardDescription>
                              {club.description || 'Описание отсутствует'}
                            </CardDescription>
                            <CardMeta>
                              <CardMetaItem icon={<IconByName name="users" size={14} />}>
                                {getMembersText(memberCount)}
                              </CardMetaItem>
                            </CardMeta>
                          </CardInfo>
                        </CardHeader>

                        <CardFooter>
                          <Button
                            variant={isSubscribed ? 'secondary' : 'primary'}
                            size="small"
                            fullWidth={!canEdit}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSubscription(club.id, club.name);
                            }}
                          >
                            {isSubscribed ? 'Отписаться' : 'Подписаться'}
                          </Button>
                          {canEdit && (
                            <Button
                              variant="danger"
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm('Удалить этот клуб?')) {
                                  deleteClub(club.id);
                                }
                              }}
                            >
                              Удалить
                            </Button>
                          )}
                        </CardFooter>
                      </Card>
                    </LongPressWrapper>
                  </SwipeableCard>
                );
              })}
            </div>
          )}
        </div>
      </PullToRefresh>

      {/* Action Sheet для long press */}
      <ActionSheet
        isOpen={actionSheet.open}
        onClose={() => setActionSheet({ open: false, club: null })}
        title={actionSheet.club?.name}
        actions={[
          {
            label: myClubs.includes(actionSheet.club?.id) ? 'Отписаться' : 'Подписаться',
            onClick: () => toggleSubscription(actionSheet.club?.id, actionSheet.club?.name)
          },
          ...(canEdit ? [{
            label: 'Удалить клуб',
            destructive: true,
            onClick: () => {
              if (window.confirm('Удалить этот клуб?')) {
                deleteClub(actionSheet.club?.id);
              }
            }
          }] : [])
        ]}
      />

      {/* Модалка создания */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Создать клуб"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Отмена
            </Button>
            <Button
              variant="primary"
              onClick={addClub}
              disabled={!newClub.name.trim() || submitting}
            >
              {submitting ? 'Создание...' : 'Создать'}
            </Button>
          </>
        }
      >
        <FormField label="Иконка">
          <div className="icon-picker">
            {iconOptions.map(icon => (
              <button
                key={icon}
                type="button"
                className={`icon-option ${newClub.icon === icon ? 'active' : ''}`}
                onClick={() => setNewClub({ ...newClub, icon })}
              >
                <IconByName name={icon} size={24} />
              </button>
            ))}
          </div>
        </FormField>

        <FormField label="Название клуба">
          <Input
            value={newClub.name}
            onChange={(e) => setNewClub({ ...newClub, name: e.target.value })}
            placeholder="Например: IT-клуб"
            autoFocus
          />
        </FormField>

        <FormField label="Описание">
          <Textarea
            value={newClub.description}
            onChange={(e) => setNewClub({ ...newClub, description: e.target.value })}
            placeholder="Расскажите о клубе..."
          />
        </FormField>
      </Modal>
    </>
  );
}

export default ClubsPage;
