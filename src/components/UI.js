import React, { useState, useRef, memo, useCallback } from 'react';
import { haptic } from '../utils/haptic';

export const LoadingSpinner = memo(function LoadingSpinner({ text }) {
  return (
    <div className="loading-spinner">
      <div className="spinner" />
      {text && <p className="loading-text">{text}</p>}
    </div>
  );
});

export const InlineLoading = memo(function InlineLoading() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
      <div className="spinner" />
    </div>
  );
});

export const Skeleton = memo(function Skeleton({ width, height, className = '' }) {
  return (
    <div 
      className={`skeleton ${className}`} 
      style={{ width: width || '100%', height: height || '16px' }} 
    />
  );
});

export const SkeletonCard = memo(function SkeletonCard({ variant = 'default' }) {
  return (
    <div className="skeleton-card">
      <div className="skeleton-card-header">
        <div className="skeleton skeleton-card-icon" />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="skeleton skeleton-text" style={{ width: '70%' }} />
          <div className="skeleton skeleton-text" style={{ width: '90%' }} />
          <div className="skeleton skeleton-text" style={{ width: '50%' }} />
        </div>
      </div>
      <div className="skeleton-card-body">
        <div className="skeleton skeleton-text" />
        <div className="skeleton skeleton-text" />
      </div>
      <div className="skeleton skeleton-button" />
    </div>
  );
});

export const SkeletonList = memo(function SkeletonList({ count = 3 }) {
  return (
    <div className="list-section">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="list-item stagger-item">
          <div className="skeleton skeleton-avatar" />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div className="skeleton skeleton-text" style={{ width: '60%' }} />
            <div className="skeleton skeleton-text" style={{ width: '40%' }} />
          </div>
        </div>
      ))}
    </div>
  );
});

export const PullToRefresh = memo(function PullToRefresh({ onRefresh, children }) {
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const containerRef = useRef(null);
  const startY = useRef(0);
  const threshold = 80;

  const handleTouchStart = useCallback((e) => {
    if (containerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      setPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!pulling || refreshing) return;
    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, currentY - startY.current);
    setPullDistance(Math.min(distance * 0.5, threshold * 1.5));
  }, [pulling, refreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance >= threshold && onRefresh) {
      setRefreshing(true);
      haptic.light();
      await onRefresh();
      setRefreshing(false);
    }
    setPulling(false);
    setPullDistance(0);
  }, [pullDistance, onRefresh]);

  return (
    <div
      ref={containerRef}
      className="ptr-container"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {(pullDistance > 0 || refreshing) && (
        <div className="ptr-indicator" style={{ height: refreshing ? 44 : pullDistance }}>
          {refreshing ? <div className="spinner" /> : <span>↓</span>}
        </div>
      )}
      {children}
    </div>
  );
});

export const Button = memo(function Button({ 
  children, 
  variant = 'primary', 
  size = 'default',
  fullWidth = false,
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  style
}) {
  const handleClick = useCallback((e) => {
    if (!disabled) {
      haptic.light();
      onClick && onClick(e);
    }
  }, [disabled, onClick]);

  const classes = [
    'btn',
    `btn-${variant}`,
    size === 'small' && 'btn-small',
    fullWidth && 'btn-full',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={classes}
      onClick={handleClick}
      disabled={disabled}
      style={style}
    >
      {children}
    </button>
  );
});

export const Input = memo(function Input({ className = '', ...props }) {
  return <input className={`input ${className}`} {...props} />;
});

export const Textarea = memo(function Textarea({ className = '', ...props }) {
  return <textarea className={`input textarea ${className}`} {...props} />;
});

export const Select = memo(function Select({ children, className = '', ...props }) {
  return <select className={`form-select ${className}`} {...props}>{children}</select>;
});

export const FormField = memo(function FormField({ label, children, error }) {
  return (
    <div className="form-field">
      {label && <label className="form-label">{label}</label>}
      {children}
      {error && <span className="form-error">{error}</span>}
    </div>
  );
});

export function PageHeader({ title, action, search, onSearch }) {
  return (
    <div className="page-header">
      <div className="page-header-content">
        <h1>{title}</h1>
        {action}
      </div>
      {onSearch && (
        <div className="page-header-search">
          <Input
            type="text"
            placeholder="Поиск..."
            value={search || ''}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
      )}
    </div>
  );
}

export function Card({ children, onClick, delay = 0, className = '' }) {
  return (
    <div 
      className={`card ${onClick ? 'card-pressable' : ''} ${className}`}
      onClick={onClick}
      style={{ animationDelay: `${delay * 0.05}s` }}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children }) {
  return <div className="card-header">{children}</div>;
}

export function CardIcon({ children, subscribed }) {
  return <div className={`card-icon ${subscribed ? 'subscribed' : ''}`}>{children}</div>;
}

export function CardInfo({ children }) {
  return <div className="card-info">{children}</div>;
}

export function CardTitle({ children }) {
  return <h3 className="card-title">{children}</h3>;
}

export function CardDescription({ children }) {
  return <p className="card-description">{children}</p>;
}

export function CardMeta({ children }) {
  return <div className="card-meta">{children}</div>;
}

export function CardMetaItem({ icon, children }) {
  return <span className="card-meta-item">{icon} {children}</span>;
}

export function CardFooter({ children }) {
  return <div className="card-footer">{children}</div>;
}

export function Badge({ children, variant = 'default' }) {
  return <span className={`badge badge-${variant}`}>{children}</span>;
}

export function FilterTabs({ tabs, activeTab, onChange }) {
  return (
    <div className="filter-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`filter-tab ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => {
            haptic.light();
            onChange(tab.id);
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function EmptyState({ icon, title, text, action, small, fancy = true }) {
  if (fancy) {
    return (
      <div className="empty-state-fancy">
        <div className="empty-state-illustration">{icon}</div>
        {title && <h3 className="empty-state-title">{title}</h3>}
        {text && <p className="empty-state-text">{text}</p>}
        {action}
      </div>
    );
  }
  return (
    <div className={`empty-state ${small ? 'small' : ''}`}>
      {icon && <div className="empty-state-icon">{icon}</div>}
      {title && <h3 className="empty-state-title">{title}</h3>}
      {text && <p className="empty-state-text">{text}</p>}
      {action}
    </div>
  );
}

export function StatsGrid({ children }) {
  return <div className="stats-grid">{children}</div>;
}

export function StatCard({ icon, color = 'blue', value, label, loading, delay = 0, fancy = false }) {
  const className = fancy ? 'stat-card-fancy stagger-item' : 'stat-card stagger-item';
  return (
    <div className={className} style={{ animationDelay: `${delay * 0.1}s` }}>
      <div className={`stat-icon ${color}`}>{icon}</div>
      <div className="stat-value">{loading ? '—' : value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export function Section({ title, children, delay = 0, className = '' }) {
  return (
    <div className={`section ${className}`} style={{ animationDelay: `${delay * 0.1}s` }}>
      {title && <h3 className="section-title">{title}</h3>}
      <div className="section-content">{children}</div>
    </div>
  );
}

// Gradient Card Component
export function GradientCard({ children, color = 'blue', onClick }) {
  return (
    <div 
      className={`card card-gradient ${color} ${onClick ? 'card-pressable' : ''}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

// Floating Action Button
export function FAB({ icon = '+', onClick }) {
  return (
    <button className="fab" onClick={() => { haptic.medium(); onClick && onClick(); }}>
      {icon}
    </button>
  );
}

export function List({ children }) {
  return <div className="list-section">{children}</div>;
}

export function ListItem({ icon, title, subtitle, onClick, chevron = true, accessory }) {
  return (
    <div className="list-item" onClick={onClick}>
      {icon && <div className="list-item-icon">{icon}</div>}
      <div className="list-item-content">
        <div className="list-item-title">{title}</div>
        {subtitle && <div className="list-item-subtitle">{subtitle}</div>}
      </div>
      {accessory && <div className="list-item-accessory">{accessory}</div>}
      {chevron && <span className="list-item-chevron">›</span>}
    </div>
  );
}

export function QuickActions({ children }) {
  return <div className="quick-actions">{children}</div>;
}

export function QuickAction({ icon, label, color = 'blue', onClick }) {
  return (
    <button className="quick-action" onClick={onClick}>
      <div className={`quick-action-icon ${color}`}>{icon}</div>
      <span className="quick-action-label">{label}</span>
    </button>
  );
}

export default Button;
