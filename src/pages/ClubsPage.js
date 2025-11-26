import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import { getMembersText } from '../utils/helpers';
import { 
  PageHeader, 
  EmptyState, 
  InlineLoading,
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
  Textarea
} from '../components/UI';
import { Modal } from '../components/Modal';

/**
 * Clubs Page
 */
export function ClubsPage({ canEdit, userId }) {
  const [clubs, setClubs] = useState([]);
  const [myClubs, setMyClubs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newClub, setNewClub] = useState({ name: '', description: '' });
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadClubs();
  }, [userId]);

  const loadClubs = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('clubs')
        .select('*, club_subscriptions(count)')
        .order('name');
      setClubs(data || []);

      if (userId) {
        const { data: subs } = await supabase
          .from('club_subscriptions')
          .select('club_id')
          .eq('student_id', userId);
        setMyClubs(subs?.map(s => s.club_id) || []);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading clubs:', error);
      setLoading(false);
    }
  }, [userId]);

  const addClub = async () => {
    if (!newClub.name.trim()) return;
    
    setSubmitting(true);
    try {
      await supabase.from('clubs').insert(newClub);
      setNewClub({ name: '', description: '' });
      setShowModal(false);
      loadClubs();
    } catch (error) {
      console.error('Error adding club:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteClub = async (id) => {
    if (!window.confirm('Удалить этот клуб?')) return;
    
    try {
      await supabase.from('clubs').delete().eq('id', id);
      loadClubs();
    } catch (error) {
      console.error('Error deleting club:', error);
    }
  };

  const toggleSubscription = async (clubId, e) => {
    e.stopPropagation();
    
    try {
      if (myClubs.includes(clubId)) {
        await supabase
          .from('club_subscriptions')
          .delete()
          .eq('club_id', clubId)
          .eq('student_id', userId);
      } else {
        await supabase
          .from('club_subscriptions')
          .insert({ club_id: clubId, student_id: userId });
      }
      loadClubs();
    } catch (error) {
      console.error('Error toggling subscription:', error);
    }
  };

  // Filter clubs
  let filteredClubs = clubs.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  if (filter === 'my') {
    filteredClubs = filteredClubs.filter(c => myClubs.includes(c.id));
  }

  if (loading) {
    return (
      <>
        <PageHeader title="🎭 Клубы" />
        <div className="page-content">
          <InlineLoading />
        </div>
      </>
    );
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

      <div className="page-content">
        {/* Filter Tabs (only for non-admins) */}
        {!canEdit && (
          <FilterTabs
            tabs={[
              { id: 'all', label: 'Все клубы' },
              { id: 'my', label: 'Мои клубы' }
            ]}
            activeTab={filter}
            onChange={setFilter}
          />
        )}

        {/* Clubs Grid */}
        {filteredClubs.length === 0 ? (
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
                <Card key={club.id} delay={index}>
                  <CardHeader>
                    <CardIcon subscribed={isSubscribed}>🎭</CardIcon>
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
                    {!canEdit ? (
                      <Button
                        variant={isSubscribed ? 'secondary' : 'primary'}
                        size="small"
                        fullWidth
                        onClick={(e) => toggleSubscription(club.id, e)}
                      >
                        {isSubscribed ? 'Отписаться' : 'Подписаться'}
                      </Button>
                    ) : (
                      <Button
                        variant="danger"
                        size="small"
                        fullWidth
                        onClick={() => deleteClub(club.id)}
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

        {/* Create Club Modal */}
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
      </div>
    </>
  );
}

export default ClubsPage;
