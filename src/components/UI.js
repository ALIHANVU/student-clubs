import React, { useState, useRef, useEffect } from 'react';
import { haptic } from '../utils/haptic';

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
 * Skeleton Components - скелетоны загрузки
 */
export function Skeleton({ width, height, radius = 'sm', className = '' }) {
  const style = {
    width: width || '100%',
    height: height || '20px',
    borderRadius: `var(--radius-${radius})`
  };
  return <div className={`skeleton ${className}`} style={style} />;
}

export function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-card-header">
        <Skeleton width="48px" height="48px" radius="md" />
        <div className="skeleton-card-info">
          <Skeleton width="70%" height="18px" />
          <Skeleton width="90%" height="14px" />
          <Skeleton width="50%" height="12px" />
        </div>
      </div>
      <div className="skeleton-card-footer">
        <Skeleton width="100%" height="36px" radius="sm" />
      </div>
    </div>
  );
}

export function SkeletonStat() {
  return (
    <div className="skeleton-stat">
      <Skeleton width="48px" height="48px" radius="md" />
      <Skeleton width="60px" height="32px" />
      <Skeleton width="80px" height="14px" />
    </div>
  );
}

export function SkeletonList({ count = 3 }) {
  return (
    <div className="skeleton-list">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-list-item">
          <Skeleton width="40px" height="40px" radius="sm" />
          <div className="skeleton-list-content">
            <Skeleton width="60%" height="16px" />
            <Skeleton width="80%" height="14px" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Pull to Refresh Component
 */
export function PullToRefresh({ onRefresh, children }) {
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const containerRef = useRef(null);
  const startY = useRef(0);
  const threshold = 80;

  const handleTouchStart = (e) => {
    if (containerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      setPulling(true);
    }
  };

  const handleTouchMove = (e) => {
    if (!pulling || refreshing) return;
    
    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, (currentY - startY.current) * 0.5);
    
    if (distance > 0 && containerRef.current?.scrollTop === 0) {
      setPullDistance(Math.min(distance, threshold * 1.5));
      
      if (distance >= threshold) {
        haptic.light();
      }
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance >= threshold && !refreshing) {
      setRefreshing(true);
      haptic.medium();
      
      try {
        await onRefresh?.();
      } finally {
        setRefreshing(false);
      }
    }
    
    setPulling(false);
    setPullDistance(0);
  };

  return (
    <div
      ref={containerRef}
      className="pull-to-refresh-container"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div 
        className={`pull-indicator ${refreshing ? 'refreshing' : ''}`}
        style={{ 
          height: pullDistance,
          opacity: Math.min(pullDistance / threshold, 1)
        }}
      >
        <div className={`pull-spinner ${refreshing ? 'spinning' : ''}`}>
          {refreshing ? '↻' : '↓'}
        </div>
        <span className="pull-text">
          {refreshing ? 'Обновление...' : pullDistance >= threshold ? 'Отпустите' : 'Потяните вниз'}
        </span>
      </div>
      <div 
        className="pull-content"
        style={{ transform: `translateY(${pullDistance}px)` }}
      >
        {children}
      </div>
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

  const handleClick = (e) => {
    haptic.light();
    onClick?.(e);
  };

  return (
    <button 
      className={classes} 
      disabled={disabled}
      onClick={handleClick}
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
