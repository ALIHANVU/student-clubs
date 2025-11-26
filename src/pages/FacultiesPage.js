import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import { haptic } from '../utils/haptic';
import { useNotification } from '../context/NotificationContext';
import { 
  PageHeader, 
  EmptyState, 
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
  FormField,
  Input,
  Textarea,
  PullToRefresh,
  SkeletonCard
} from '../components/UI';
import { Modal } from '../components/Modal';

/**
 * Faculties Page
 */
export function FacultiesPage() {
  const { notify } = useNotification();
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', code: '' });
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadFaculties();
  }, []);

  const loadFaculties = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('faculties')
        .select('*, directions(count)')
        .order('name');
      setFaculties(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading faculties:', error);
      setLoading(false);
    }
  }, []);

  const handleRefresh = async () => {
    await loadFaculties();
    notify.success('Обновлено');
  };

  const openCreateModal = () => {
    setEditingFaculty(null);
    setFormData({ name: '', description: '', code: '' });
    setShowModal(true);
  };

  const openEditModal = (faculty) => {
    setEditingFaculty(faculty);
    setFormData({
      name: faculty.name,
      description: faculty.description || '',
      code: faculty.code || ''
    });
    setShowModal(true);
  };

  const saveFaculty = async () => {
    if (!formData.name.trim()) return;

    setSubmitting(true);
    try {
      if (editingFaculty) {
        await supabase
          .from('faculties')
          .update(formData)
          .eq('id', editingFaculty.id);
        notify.success('Факультет обновлён');
      } else {
        await supabase.from('faculties').insert(formData);
        notify.success('Факультет создан');
      }

      setShowModal(false);
      loadFaculties();
      haptic.success();
    } catch (error) {
      console.error('Error saving faculty:', error);
      notify.error('Ошибка сохранения');
      haptic.error();
    } finally {
      setSubmitting(false);
    }
  };

  const deleteFaculty = async (id) => {
    if (!window.confirm('Удалить этот факультет? Все связанные направления также будут удалены.')) return;

    try {
      await supabase.from('faculties').delete().eq('id', id);
      loadFaculties();
      notify.success('Факультет удалён');
      haptic.medium();
    } catch (error) {
      console.error('Error deleting faculty:', error);
      notify.error('Ошибка удаления');
      haptic.error();
    }
  };

  const filteredFaculties = faculties.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <PageHeader
        title="🏛 Факультеты"
        action={
          <Button variant="primary" onClick={openCreateModal}>
            + Создать
          </Button>
        }
        search={search}
        onSearch={setSearch}
      />

      <PullToRefresh onRefresh={handleRefresh}>
        <div className="page-content">
          {loading ? (
            <div className="cards-grid">
              {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : filteredFaculties.length === 0 ? (
            <EmptyState
              icon="🏛"
              title="Нет факультетов"
              text="Создайте первый факультет"
            />
          ) : (
            <div className="cards-grid">
              {filteredFaculties.map((faculty, index) => {
                const directionsCount = faculty.directions?.[0]?.count || 0;

                return (
                  <Card key={faculty.id} delay={index}>
                    <CardHeader>
                      <CardIcon>🏛</CardIcon>
                      <CardInfo>
                        <CardTitle>{faculty.name}</CardTitle>
                        <CardDescription>
                          {faculty.description || 'Описание отсутствует'}
                        </CardDescription>
                        <CardMeta>
                          {faculty.code && (
                            <CardMetaItem icon="🏷">
                              {faculty.code}
                            </CardMetaItem>
                          )}
                          <CardMetaItem icon="📁">
                            {directionsCount} направлений
                          </CardMetaItem>
                        </CardMeta>
                      </CardInfo>
                    </CardHeader>

                    <CardFooter>
                      <Button
                        variant="secondary"
                        size="small"
                        onClick={() => openEditModal(faculty)}
                      >
                        ✏️ Изменить
                      </Button>
                      <Button
                        variant="danger"
                        size="small"
                        onClick={() => deleteFaculty(faculty.id)}
                      >
                        🗑 Удалить
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </PullToRefresh>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingFaculty ? 'Редактировать факультет' : 'Создать факультет'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Отмена
            </Button>
            <Button
              variant="primary"
              onClick={saveFaculty}
              disabled={!formData.name.trim() || submitting}
            >
              {submitting ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </>
        }
      >
        <FormField label="Название">
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Например: Факультет информатики"
            autoFocus
          />
        </FormField>

        <FormField label="Код/аббревиатура">
          <Input
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            placeholder="Например: ФИТ"
          />
        </FormField>

        <FormField label="Описание">
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Описание факультета..."
          />
        </FormField>
      </Modal>
    </>
  );
}

export default FacultiesPage;
