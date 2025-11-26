import React from 'react';
import { PageHeader, EmptyState } from '../components/UI';

/**
 * Schedule Page
 */
export function SchedulePage() {
  return (
    <>
      <PageHeader title="📚 Расписание" />
      <div className="page-content">
        <EmptyState
          icon="📚"
          title="Расписание"
          text="Функционал в разработке"
        />
      </div>
    </>
  );
}

/**
 * Faculties Page
 */
export function FacultiesPage() {
  return (
    <>
      <PageHeader title="🏛️ Факультеты" />
      <div className="page-content">
        <EmptyState
          icon="🏛️"
          title="Факультеты"
          text="Функционал в разработке"
        />
      </div>
    </>
  );
}

/**
 * Groups Page
 */
export function GroupsPage() {
  return (
    <>
      <PageHeader title="👥 Группы" />
      <div className="page-content">
        <EmptyState
          icon="👥"
          title="Группы"
          text="Функционал в разработке"
        />
      </div>
    </>
  );
}

/**
 * Users Page
 */
export function UsersPage() {
  return (
    <>
      <PageHeader title="👤 Пользователи" />
      <div className="page-content">
        <EmptyState
          icon="👤"
          title="Пользователи"
          text="Функционал в разработке"
        />
      </div>
    </>
  );
}

/**
 * Generic Placeholder Page
 */
export function PlaceholderPage({ icon = '📋', title = 'Страница', text = 'Раздел в разработке' }) {
  return (
    <>
      <PageHeader title={`${icon} ${title}`} />
      <div className="page-content">
        <EmptyState
          icon={icon}
          title={title}
          text={text}
        />
      </div>
    </>
  );
}
