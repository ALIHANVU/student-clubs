import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import { getMembersText } from '../utils/helpers';
import { haptic } from '../utils/haptic';
import { useNotification } from '../context/NotificationContext';
import { useApp } from '../context/AppContext';
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
  PullToRefresh,
  SkeletonCard
} from '../components/UI';
import { Modal } from '../components/Modal';

/**
 * Clubs Page
 */
export function ClubsPage({ onClubClick }) {
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

  useEffect(() => {
    loadClubs();
  }, [user.id]);

  const loadClubs = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('clubs')
        .select('*, club_subscriptions(count)')
        .order('name');
      setClubs(data || []);

      const { data: subs } = await supabase
        .from('club_subscriptions')
        .select('club_id')
        .eq('student_id', user.id);
      setMyClubs(subs?.map(s => s.club_id) || []);

      setLoading(false);
    } catch (error) {
      console.error('Error loading clubs:', error);
      setLoading(false);
    }
  }, [user.id]);

  const handleRefresh = async () => {
    await loadClubs();
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
      setNewClub({ name: '', description: '', icon: '🎭' });
      setShowModal(false);
      loadClubs();
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

  const deleteClub = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Удалить этот клуб?')) return;
    
    try {
      await supabase.from('clubs').delete().eq('id', id);
      loadClubs();
      notify.success('Клуб удалён');
      haptic.medium();
    } catch (error) {
      console.error('Error deleting club:', error);
      notify.error('Ошибка удаления');
      haptic.error();
    }
  };

  const toggleSubscription = async (clubId, clubName, e) => {
    e.stopPropagation();
    
    try {
      if (myClubs.includes(clubId)) {
        await supabase
          .from('club_subscriptions')
          .delete()
          .eq('club_id', clubId)
          .eq('student_id', user.id);
        notify.info(`Вы отписались от "${clubName}"`);
      } else {
        await supabase
          .from('club_subscriptions')
          .insert({ club_id: clubId, student_id: user.id });
        notify.success(`Вы подписались на "${clubName}"`);
      }
      haptic.medium();
      loadClubs();
    } catch (error) {
      console.error('Error toggling subscription:', error);
      notify.error('Ошибка');
      haptic.error();
    }
  };

  // Фильтрация
  let filteredClubs = clubs.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  if (filter === 'my') {
    filteredClubs = filteredClubs.filter(c => myClubs.includes(c.id));
  }

  return (
    <>
      <PageHeader
        title="🎭 Клубы"
        action={canEdit && (
          <Button variant="primary" onClick={() => setShowModal(true)}>
            + Создать
          </Button>
        )}
        search={search}
        onSearch={setSearch}
      />

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
              icon="🎭"
              title="Нет клубов"
              text={filter === 'my' ? 'Вы ещё не подписаны на клубы' : 'Создайте первый клуб'}
            />
          ) : (
            <div className="cards-grid">
              {filteredClubs.map((club, index) => {
                const isSubscribed = myClubs.includes(club.id);
                const memberCount = club.club_subscriptions?.[0]?.count || 0;

                return (
                  <Card 
                    key={club.id} 
                    delay={index}
                    onClick={() => onClubClick && onClubClick(club.id)}
                  >
                    <CardHeader>
                      <CardIcon subscribed={isSubscribed}>{club.icon || '🎭'}</CardIcon>
                      <CardInfo>
                        <CardTitle>
                          {club.name}
                          {isSubscribed && <Badge variant="green">✓ Подписан</Badge>}
                        </CardTitle>
                        <CardDescription>
                          {club.description || 'Описание отсутствует'}
                        </CardDescription>
                        <CardMeta>
                          <CardMetaItem icon="👥">
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
                        onClick={(e) => toggleSubscription(club.id, club.name, e)}
                      >
                        {isSubscribed ? 'Отписаться' : 'Подписаться'}
                      </Button>
                      {canEdit && (
                        <Button
                          variant="danger"
                          size="small"
                          onClick={(e) => deleteClub(club.id, e)}
                        >
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
            {['🎭', '💻', '⚽', '🎵', '📚', '🎨', '🎮', '🔬', '🎬', '🌍'].map(icon => (
              <button
                key={icon}
                type="button"
                className={`icon-option ${newClub.icon === icon ? 'active' : ''}`}
                onClick={() => setNewClub({ ...newClub, icon })}
              >
                {icon}
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
