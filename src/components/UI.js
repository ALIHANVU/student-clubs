/**
 * UI Components — с иконками в стиле Apple SF Symbols
 */
import React, { memo, useCallback, useRef, useState } from 'react';
import { haptic } from '../utils/haptic';
import { 
  IconSearch, IconPlus, IconChevronRight, IconCheckCircle,
  IconAlertCircle, IconInfo, IconRefresh
} from './Icons';

// Loading
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

// Skeletons
export const SkeletonCard = memo(function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
        <div className="skeleton" style={{ width: 56, height: 56, borderRadius: 12 }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton skeleton-text" style={{ width: '70%' }} />
          <div className="skeleton skeleton-text" style={{ width: '90%' }} />
          <div className="skeleton skeleton-text" style={{ width: '50%' }} />
        </div>
      </div>
    </div>
  );
});

export const SkeletonList = memo(function SkeletonList({ count = 3 }) {
  return (
    <div className="list-section">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="list-item" style={{ pointerEvents: 'none' }}>
          <div className="skeleton skeleton-avatar" />
          <div style={{ flex: 1 }}>
            <div className="skeleton skeleton-text" style={{ width: '60%' }} />
            <div className="skeleton skeleton-text" style={{ width: '40%' }} />
          </div>
        </div>
      ))}
    </div>
  );
});

// Pull to Refresh
export const PullToRefresh = memo(function PullToRefresh({ onRefresh, children }) {
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const containerRef = useRef(null);
  const threshold = 80;

  const handleTouchStart = useCallback((e) => {
    if (containerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      setPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!pulling || refreshing) return;
    const distance = Math.max(0, e.touches[0].clientY - startY.current);
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
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ minHeight: '100%' }}
    >
      {(pullDistance > 0 || refreshing) && (
        <div style={{ 
          height: refreshing ? 44 : pullDistance, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          transition: refreshing ? 'height 0.2s' : 'none'
        }}>
          {refreshing ? (
            <div className="spinner" style={{ width: 24, height: 24 }} />
          ) : (
            <IconRefresh 
              size={24} 
              style={{ 
                opacity: pullDistance / threshold,
                transform: `rotate(${(pullDistance / threshold) * 180}deg)`,
                transition: 'transform 0.1s'
              }} 
            />
          )}
        </div>
      )}
      {children}
    </div>
  );
});

// Buttons
export const Button = memo(function Button({ 
  children, 
  variant = 'primary', 
  size = 'default',
  fullWidth = false,
  icon,
  disabled = false,
  onClick,
  type = 'button',
  className = ''
}) {
  const handleClick = useCallback((e) => {
    if (disabled) return;
    haptic.light();
    onClick?.(e);
  }, [disabled, onClick]);

  const classes = [
    'btn',
    `btn-${variant}`,
    size === 'small' && 'btn-small',
    size === 'icon' && 'btn-icon',
    fullWidth && 'btn-full',
    className
  ].filter(Boolean).join(' ');

  return (
    <button type={type} className={classes} onClick={handleClick} disabled={disabled}>
      {icon}
      {children}
    </button>
  );
});

// Inputs
export const Input = memo(function Input(props) {
  return <input className="input" {...props} />;
});

export const Textarea = memo(function Textarea(props) {
  return <textarea className="input textarea" {...props} />;
});

export const FormField = memo(function FormField({ label, error, children }) {
  return (
    <div className="form-field">
      {label && <label className="form-label">{label}</label>}
      {children}
      {error && <p className="form-error">{error}</p>}
    </div>
  );
});

// Search Input with icon
export const SearchInput = memo(function SearchInput({ value, onChange, placeholder = 'Поиск...' }) {
  return (
    <div className="search-input-wrapper">
      <IconSearch size={18} color="var(--text-tertiary)" />
      <input
        type="text"
        className="search-input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
});

// Page Header (Desktop)
export const PageHeader = memo(function PageHeader({ title, subtitle, action, search, onSearch }) {
  return (
    <div className="page-header">
      <div className="page-header-content">
        <div>
          <h1>{title}</h1>
          {subtitle && <p className="page-header-subtitle">{subtitle}</p>}
        </div>
        {action}
      </div>
      {onSearch && (
        <div className="page-header-search">
          <SearchInput value={search} onChange={onSearch} />
        </div>
      )}
    </div>
  );
});

// Section
export const Section = memo(function Section({ title, children, action }) {
  return (
    <div className="section">
      {title && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="section-title">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </div>
  );
});

// Card
export const Card = memo(function Card({ children, onClick, className = '' }) {
  const handleClick = useCallback(() => {
    if (onClick) {
      haptic.light();
      onClick();
    }
  }, [onClick]);

  return (
    <div 
      className={`card ${onClick ? 'card-pressable' : ''} ${className}`} 
      onClick={handleClick}
    >
      {children}
    </div>
  );
});

// Badge
export const Badge = memo(function Badge({ children, variant = 'default' }) {
  return <span className={`badge badge-${variant}`}>{children}</span>;
});

// List
export const List = memo(function List({ children }) {
  return <div className="list-section">{children}</div>;
});

export const ListItem = memo(function ListItem({ 
  icon, 
  title, 
  subtitle, 
  onClick, 
  chevron = true,
  accessory,
  iconBg
}) {
  const handleClick = useCallback(() => {
    if (onClick) {
      haptic.light();
      onClick();
    }
  }, [onClick]);

  return (
    <div className="list-item" onClick={handleClick}>
      {icon && (
        <div className="list-item-icon" style={iconBg ? { background: iconBg } : undefined}>
          {typeof icon === 'string' ? icon : icon}
        </div>
      )}
      <div className="list-item-content">
        <div className="list-item-title">{title}</div>
        {subtitle && <div className="list-item-subtitle">{subtitle}</div>}
      </div>
      {accessory && <div className="list-item-accessory">{accessory}</div>}
      {chevron && onClick && (
        <span className="list-item-chevron">
          <IconChevronRight size={18} color="var(--text-tertiary)" />
        </span>
      )}
    </div>
  );
});

// Stat Card
export const StatCard = memo(function StatCard({ icon, color = 'blue', value, label }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${color}`}>
        {typeof icon === 'string' ? icon : icon}
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
});

// Filter Tabs
export const FilterTabs = memo(function FilterTabs({ tabs, activeTab, onChange }) {
  const handleClick = useCallback((id) => {
    haptic.light();
    onChange(id);
  }, [onChange]);

  return (
    <div className="filter-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`filter-tab ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => handleClick(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
});

// Empty State
export const EmptyState = memo(function EmptyState({ icon, title, text, action }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        {typeof icon === 'string' ? icon : icon}
      </div>
      <h3 className="empty-state-title">{title}</h3>
      {text && <p className="empty-state-text">{text}</p>}
      {action}
    </div>
  );
});

// Info Banner
export const InfoBanner = memo(function InfoBanner({ icon, title, subtitle, variant = 'info' }) {
  const IconComponent = variant === 'success' ? IconCheckCircle : variant === 'error' ? IconAlertCircle : IconInfo;
  
  return (
    <div className={`info-banner info-banner-${variant}`}>
      <div className="info-banner-icon">
        {icon || <IconComponent size={28} />}
      </div>
      <div className="info-banner-content">
        <div className="info-banner-title">{title}</div>
        {subtitle && <div className="info-banner-subtitle">{subtitle}</div>}
      </div>
    </div>
  );
});

// Icon Picker (for clubs)
export const IconPicker = memo(function IconPicker({ value, onChange, icons }) {
  const handleSelect = useCallback((icon) => {
    haptic.light();
    onChange(icon);
  }, [onChange]);

  return (
    <div className="icon-picker">
      {icons.map((icon) => (
        <button
          key={icon}
          type="button"
          className={`icon-option ${value === icon ? 'active' : ''}`}
          onClick={() => handleSelect(icon)}
        >
          {icon}
        </button>
      ))}
    </div>
  );
});

// Toggle Switch (iOS style)
export const Toggle = memo(function Toggle({ checked, onChange, disabled = false }) {
  const handleChange = useCallback(() => {
    if (disabled) return;
    haptic.light();
    onChange(!checked);
  }, [checked, onChange, disabled]);

  return (
    <button
      type="button"
      className={`toggle ${checked ? 'toggle-on' : ''} ${disabled ? 'toggle-disabled' : ''}`}
      onClick={handleChange}
      disabled={disabled}
    >
      <span className="toggle-thumb" />
    </button>
  );
});
