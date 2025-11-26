import React from 'react';

/**
 * Loading Spinner
 */
export function LoadingSpinner({ size = 'default', text }) {
  return (
    <div className="loading-screen">
      <div className={`loading-spinner ${size}`} />
      {text && <p className="loading-text">{text}</p>}
    </div>
  );
}

/**
 * Inline Loading - центрированный
 */
export function InlineLoading() {
  return (
    <div className="inline-loading">
      <div className="loading-spinner" />
    </div>
  );
}

/**
 * Empty State
 */
export function EmptyState({ icon, title, text, small = false, action }) {
  return (
    <div className={`empty-state ${small ? 'small' : ''}`}>
      <div className="empty-state-icon">{icon}</div>
      {title && <div className="empty-state-title">{title}</div>}
      {text && <div className="empty-state-text">{text}</div>}
      {action && <div style={{ marginTop: 'var(--space-lg)' }}>{action}</div>}
    </div>
  );
}

/**
 * Stat Card (iOS Widget style)
 */
export function StatCard({ icon, color = 'blue', value, label, delay = 0 }) {
  return (
    <div 
      className="stat-card" 
      style={{ animationDelay: `${delay * 0.05}s` }}
    >
      <div className={`stat-icon ${color}`}>{icon}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

/**
 * Section Container
 */
export function Section({ title, action, children, delay = 0 }) {
  return (
    <div className="section" style={{ animationDelay: `${delay * 0.1}s` }}>
      <div className="section-header">
        <h3 className="section-title">{title}</h3>
        {action && <span className="section-action">{action}</span>}
      </div>
      {children}
    </div>
  );
}

/**
 * Page Header
 */
export function PageHeader({ title, action, search, onSearch }) {
  return (
    <div className="page-header">
      <h1 className="page-title">{title}</h1>
      <div className="page-actions">
        {onSearch && (
          <div className="search-box">
            <span className="search-box-icon">🔍</span>
            <input
              type="text"
              placeholder="Поиск..."
              value={search || ''}
              onChange={(e) => onSearch(e.target.value)}
            />
          </div>
        )}
        {action}
      </div>
    </div>
  );
}

/**
 * Badge
 */
export function Badge({ variant = 'blue', children }) {
  return (
    <span className={`badge badge-${variant}`}>
      {children}
    </span>
  );
}

/**
 * Button
 */
export function Button({ 
  variant = 'primary', 
  size = 'default', 
  fullWidth = false,
  disabled = false,
  onClick,
  children,
  ...props
}) {
  const classes = [
    'btn',
    `btn-${variant}`,
    size === 'small' && 'btn-sm',
    fullWidth && 'btn-full'
  ].filter(Boolean).join(' ');

  return (
    <button 
      className={classes} 
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}

/**
 * Card
 */
export function Card({ children, className = '', delay = 0, ...props }) {
  return (
    <div 
      className={`card ${className}`}
      style={{ animationDelay: `${delay * 0.05}s` }}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children }) {
  return <div className="card-header">{children}</div>;
}

export function CardIcon({ children, subscribed = false }) {
  return (
    <div className={`card-icon ${subscribed ? 'subscribed' : ''}`}>
      {children}
    </div>
  );
}

export function CardInfo({ children }) {
  return <div className="card-info">{children}</div>;
}

export function CardTitle({ children }) {
  return <div className="card-title">{children}</div>;
}

export function CardDescription({ children }) {
  return <div className="card-description">{children}</div>;
}

export function CardMeta({ children }) {
  return <div className="card-meta">{children}</div>;
}

export function CardMetaItem({ icon, children }) {
  return (
    <span className="card-meta-item">
      <span>{icon}</span>
      <span>{children}</span>
    </span>
  );
}

export function CardFooter({ children }) {
  return <div className="card-footer">{children}</div>;
}

/**
 * List
 */
export function List({ children }) {
  return <div className="list">{children}</div>;
}

export function ListItem({ icon, title, subtitle, accessory, onClick }) {
  return (
    <div className="list-item" onClick={onClick}>
      {icon && <div className="list-item-icon">{icon}</div>}
      <div className="list-item-content">
        <div className="list-item-title">{title}</div>
        {subtitle && <div className="list-item-subtitle">{subtitle}</div>}
      </div>
      {accessory && <div className="list-item-accessory">{accessory}</div>}
    </div>
  );
}

/**
 * Filter Tabs (iOS Segmented Control)
 */
export function FilterTabs({ tabs, activeTab, onChange }) {
  return (
    <div className="filter-tabs">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`filter-tab ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Form Input
 */
export function FormField({ label, children }) {
  return (
    <div className="form-field">
      {label && <label className="form-label">{label}</label>}
      {children}
    </div>
  );
}

export function Input({ type = 'text', ...props }) {
  return <input type={type} className="form-input" {...props} />;
}

export function Textarea(props) {
  return <textarea className="form-input" {...props} />;
}

/**
 * Overlay
 */
export function Overlay({ visible, onClick }) {
  return (
    <div 
      className={`overlay ${visible ? 'visible' : ''}`} 
      onClick={onClick}
    />
  );
}
