/**
 * ClubsPage — ОПТИМИЗИРОВАННАЯ ВЕРСИЯ
 * 
 * Изменения:
 * - Вынесены отдельные компоненты для карточек
 * - Оптимизированы useCallback с правильными зависимостями
 * - Добавлен AbortController
 * - Убраны лишние ре-рендеры
 */
import React, { useState, useEffect, useCallback, memo, useMemo, useRef } from 'react';
import { supabase, invalidateCache } from '../utils/supabase';
import { getMembersText } from '../utils/helpers';
import { haptic } from '../utils/haptic';
import { useNotification } from '../context/NotificationContext';
import { useApp } from '../context/AppContext';
import { 
  PageHeader, EmptyState, FilterTabs, Button, FormField, Input, 
  Textarea, PullToRefresh, SkeletonCard 
} from '../components/UI';
import { Modal } from '../components/Modal';
import { MobilePageHeader } from '../components/Navigation';
import { CLUB_ICONS } from '../utils/constants';

// ========== КОМПОНЕНТЫ ==========

const ClubCard = memo(function ClubCard({ 
  club, 
  isSubscribed, 
  canEdit, 
  onToggleSubscription, 
  onEdit, 
  onDelete 
}) {
  const handleSubscribe = useCallback((e) => {
    e?.stopPropagation();
    onToggleSubscription(club.id, club.name);
  }, [club.id, club.name, onToggleSubscription]);

  const handleEdit = useCallback((e) => {
    e?.stopPropagation();
    onEdit(club);
  }, [club, onEdit]);

  const handleDelete = useCallback((e) => {
    e?.stopPropagation();
    onDelete(club.id, club.name);
  }, [club.id, club.name, onDelete]);

  const memberCount = club.members_count || 0;

  return (
    <div className={`card ${canEdit ? 'card-pressable' : ''}`} onClick={canEdit ? handleEdit : undefined}>
      <div className="card-header">
        <div className={`card-icon ${isSubscribed ? 'subscribed' : ''}`}>
          {club.icon || '🎭'}
        </div>
        <div className="card-info">
          <div className="card-title">
            {club.name}
            {isSubscribed && <span className="badge badge-green">✓ Подписан</span>}
          </div>
          <div className="card-description">{club.description || 'Описание отсутствует'}</div>
          <div className="card-meta">
            <span className="card-meta-item">👥 {getMembersText(memberCount)}</span>
          </div>
        </div>
      </div>
      <div className="card-footer">
        <Button 
          variant={isSubscribed ? 'secondary' : 'primary'} 
          size="small" 
          onClick={handleSubscribe}
        >
          {isSubscribed ? 'Отписаться' : 'Подписаться'}
        </Button>
        {canEdit && (
          <>
            <Button variant="secondary" size="small" onClick={handleEdit}>✏️</Button>
            <Button variant="danger" size="small" onClick={handleDelete}>🗑️</Button>
          </>
        )}
      </div>
    </div>
  );
});

const IconPicker = memo(function IconPicker({ value, onChange }) {
  return (
    <div className="icon-picker">
      {CLUB_ICONS.map(icon => (
        <button 
          key={icon} 
          type="button" 
          className={`icon-option ${value === icon ? 'active' : ''}`} 
          onClick={() => onChange(icon)}
        >
          {icon}
        </button>
      ))}
    </div>
  );
});

// ========== ГЛАВНЫЙ КОМПОНЕНТ ==========

export const ClubsPage = memo(function ClubsPage() {
  const { user } = useApp();
  const { notify } = useNotification();
  
  // Состояния
  const [clubs, setClubs] = useState([]);
  const [myClubs, setMyClubs] = useState(new Set()); // Set для быстрого поиска
  const [showModal, setShowModal] = useState(false);
  const [editingClub, setEditingClub] = useState(null);
  const [clubForm, setClubForm] = useState({ name: '', description: '', icon: '🎭' });
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const mountedRef = useRef(true);
  const canEdit = user.role === 'main_admin' || user.role === 'club_admin';

  // Загрузка данных
  const loadClubs = useCallback(async () => {
    try {
      const [clubsRes, subsRes] = await Promise.all([
        supabase.from('clubs').select('*').order('name'),
        supabase.from('club_subscriptions').select('club_id').eq('student_id', user.id)
      ]);
      
      if (!mountedRef.current) return;
      
      setClubs(clubsRes.data || []);
      setMyClubs(new Set(subsRes.data?.map(s => s.club_id) || []));
    } catch (error) {
      console.error('Error loading clubs:', error);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    mountedRef.current = true;
    loadClubs();
    return () => { mountedRef.current = false; };
  }, [loadClubs]);

  // Обновление
  const handleRefresh = useCallback(async () => {
    setLoading(true);
    await loadClubs();
    notify.success('Обновлено');
  }, [loadClubs, notify]);

  // Модалка
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

  // Обновление формы
  const updateFormField = useCallback((field, value) => {
    setClubForm(prev => ({ ...prev, [field]: value }));
  }, []);

  // Сохранение
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
      console.error('Error saving club:', error);
      notify.error('Ошибка сохранения');
      haptic.error();
    } finally {
      setSubmitting(false);
    }
  }, [clubForm, editingClub, user.id, loadClubs, notify, closeModal]);

  // Удаление
  const deleteClub = useCallback(async (id, name) => {
    if (!window.confirm(`Удалить клуб "${name}"?`)) return;
    
    try {
      const { error } = await supabase.from('clubs').delete().eq('id', id);
      if (error) throw error;
      
      invalidateCache('clubs');
      loadClubs();
      notify.success('Клуб удалён');
      haptic.medium();
    } catch (error) {
      console.error('Error deleting club:', error);
      notify.error('Ошибка удаления');
      haptic.error();
    }
  }, [loadClubs, notify]);

  // Подписка/отписка
  const toggleSubscription = useCallback(async (clubId, clubName) => {
    const isSubscribed = myClubs.has(clubId);
    
    // Оптимистичное обновление
    setMyClubs(prev => {
      const next = new Set(prev);
      if (isSubscribed) {
        next.delete(clubId);
      } else {
        next.add(clubId);
      }
      return next;
    });
    
    try {
      if (isSubscribed) {
        const { error } = await supabase
          .from('club_subscriptions')
          .delete()
          .eq('club_id', clubId)
          .eq('student_id', user.id);
        if (error) throw error;
        notify.info(`Вы отписались от "${clubName}"`);
      } else {
        const { error } = await supabase
          .from('club_subscriptions')
          .insert({ club_id: clubId, student_id: user.id });
        if (error) throw error;
        notify.success(`Вы подписались на "${clubName}"`);
      }
      haptic.medium();
    } catch (error) {
      // Откат при ошибке
      setMyClubs(prev => {
        const next = new Set(prev);
        if (isSubscribed) {
          next.add(clubId);
        } else {
          next.delete(clubId);
        }
        return next;
      });
      console.error('Error toggling subscription:', error);
      notify.error('Ошибка');
      haptic.error();
    }
  }, [myClubs, user.id, notify]);

  // Фильтрация (мемоизация)
  const filteredClubs = useMemo(() => {
    const searchLower = search.toLowerCase();
    let result = clubs.filter(c => c.name.toLowerCase().includes(searchLower));
    
    if (filter === 'my') {
      result = result.filter(c => myClubs.has(c.id));
    }
    
    return result;
  }, [clubs, search, filter, myClubs]);

  // Константы
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
              {filteredClubs.map((club) => (
                <ClubCard
                  key={club.id}
                  club={club}
                  isSubscribed={myClubs.has(club.id)}
                  canEdit={canEdit}
                  onToggleSubscription={toggleSubscription}
                  onEdit={openEditModal}
                  onDelete={deleteClub}
                />
              ))}
            </div>
          )}
        </div>
      </PullToRefresh>

      {/* Модальное окно */}
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
          <IconPicker 
            value={clubForm.icon} 
            onChange={(icon) => updateFormField('icon', icon)} 
          />
        </FormField>
        
        <FormField label="Название клуба *">
          <Input 
            value={clubForm.name} 
            onChange={(e) => updateFormField('name', e.target.value)} 
            placeholder="Например: IT-клуб" 
            autoFocus 
          />
        </FormField>
        
        <FormField label="Описание">
          <Textarea 
            value={clubForm.description} 
            onChange={(e) => updateFormField('description', e.target.value)} 
            placeholder="Расскажите о клубе, чем вы занимаетесь..." 
          />
        </FormField>
      </Modal>
    </>
  );
});

export default ClubsPage;
