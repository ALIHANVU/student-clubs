/**
 * Gesture & Animation Components
 */
import React, { useState, useRef, useCallback } from 'react';
import { haptic } from '../utils/haptic';
import { TrashIcon, EditIcon, CheckIcon } from './Icons';

/**
 * Swipeable Card - карточка со свайпом для действий
 */
export function SwipeableCard({ 
  children, 
  onDelete, 
  onEdit,
  onAction,
  actionIcon,
  actionColor = 'blue',
  deleteEnabled = true,
  editEnabled = false,
  className = ''
}) {
  const [offset, setOffset] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const startX = useRef(0);
  const currentX = useRef(0);
  const isDragging = useRef(false);

  const handleTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
    currentX.current = startX.current;
    isDragging.current = true;
  };

  const handleTouchMove = (e) => {
    if (!isDragging.current) return;
    
    currentX.current = e.touches[0].clientX;
    const diff = startX.current - currentX.current;
    
    // Ограничиваем свайп
    const maxOffset = deleteEnabled && editEnabled ? 140 : 70;
    const newOffset = Math.max(0, Math.min(diff, maxOffset));
    
    setOffset(newOffset);
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    
    const threshold = 50;
    if (offset > threshold) {
      // Показываем кнопки
      const maxOffset = deleteEnabled && editEnabled ? 140 : 70;
      setOffset(maxOffset);
      setIsRevealed(true);
      haptic.light();
    } else {
      // Скрываем
      setOffset(0);
      setIsRevealed(false);
    }
  };

  const handleDelete = () => {
    haptic.medium();
    setOffset(0);
    setIsRevealed(false);
    onDelete && onDelete();
  };

  const handleEdit = () => {
    haptic.light();
    setOffset(0);
    setIsRevealed(false);
    onEdit && onEdit();
  };

  const handleAction = () => {
    haptic.light();
    setOffset(0);
    setIsRevealed(false);
    onAction && onAction();
  };

  const closeActions = () => {
    setOffset(0);
    setIsRevealed(false);
  };

  return (
    <div className={`swipeable-container ${className}`}>
      {/* Фоновые кнопки */}
      <div className="swipeable-actions">
        {editEnabled && (
          <button className="swipeable-action edit" onClick={handleEdit}>
            <EditIcon size={20} />
          </button>
        )}
        {onAction && (
          <button className={`swipeable-action ${actionColor}`} onClick={handleAction}>
            {actionIcon || <CheckIcon size={20} />}
          </button>
        )}
        {deleteEnabled && (
          <button className="swipeable-action delete" onClick={handleDelete}>
            <TrashIcon size={20} />
          </button>
        )}
      </div>
      
      {/* Контент */}
      <div 
        className="swipeable-content"
        style={{ transform: `translateX(-${offset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={isRevealed ? closeActions : undefined}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Long Press Wrapper - обёртка для долгого нажатия
 */
export function LongPressWrapper({ children, onLongPress, onPress, enabled = true }) {
  const timeout = useRef(null);
  const prevented = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });

  const handleStart = (e) => {
    if (!enabled) return;
    
    const touch = e.touches ? e.touches[0] : e;
    startPos.current = { x: touch.clientX, y: touch.clientY };
    prevented.current = false;

    timeout.current = setTimeout(() => {
      prevented.current = true;
      haptic.heavy();
      onLongPress && onLongPress(e);
    }, 400);
  };

  const handleMove = (e) => {
    if (!timeout.current) return;
    
    const touch = e.touches ? e.touches[0] : e;
    const deltaX = Math.abs(touch.clientX - startPos.current.x);
    const deltaY = Math.abs(touch.clientY - startPos.current.y);
    
    // Отменяем если палец двигается
    if (deltaX > 10 || deltaY > 10) {
      clearTimeout(timeout.current);
      timeout.current = null;
    }
  };

  const handleEnd = (e) => {
    if (timeout.current) {
      clearTimeout(timeout.current);
      timeout.current = null;
    }
    
    if (!prevented.current && onPress) {
      onPress(e);
    }
  };

  return (
    <div
      onTouchStart={handleStart}
      onTouchMove={handleMove}
      onTouchEnd={handleEnd}
      onMouseDown={handleStart}
      onMouseMove={handleMove}
      onMouseUp={handleEnd}
      onMouseLeave={() => {
        if (timeout.current) {
          clearTimeout(timeout.current);
          timeout.current = null;
        }
      }}
    >
      {children}
    </div>
  );
}

/**
 * Page Transition Wrapper
 */
export function PageTransition({ children, direction = 'forward', isActive = true }) {
  return (
    <div className={`page-transition ${direction} ${isActive ? 'active' : ''}`}>
      {children}
    </div>
  );
}

/**
 * Animated List Item
 */
export function AnimatedListItem({ children, index = 0, className = '' }) {
  return (
    <div 
      className={`animated-list-item ${className}`}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      {children}
    </div>
  );
}

/**
 * Staggered List - список с последовательной анимацией
 */
export function StaggeredList({ children, className = '' }) {
  return (
    <div className={`staggered-list ${className}`}>
      {React.Children.map(children, (child, index) => (
        <div 
          className="staggered-item"
          style={{ animationDelay: `${index * 0.05}s` }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton components - улучшенные скелетоны
 */

export function SkeletonText({ width = '100%', height = 16 }) {
  return (
    <div 
      className="skeleton skeleton-text" 
      style={{ width, height, borderRadius: height / 2 }}
    />
  );
}

export function SkeletonCircle({ size = 40 }) {
  return (
    <div 
      className="skeleton skeleton-circle" 
      style={{ width: size, height: size }}
    />
  );
}

export function SkeletonRect({ width = '100%', height = 100, radius = 12 }) {
  return (
    <div 
      className="skeleton skeleton-rect" 
      style={{ width, height, borderRadius: radius }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-card-header">
        <SkeletonCircle size={48} />
        <div className="skeleton-card-info">
          <SkeletonText width="70%" height={18} />
          <SkeletonText width="90%" height={14} />
          <SkeletonText width="50%" height={12} />
        </div>
      </div>
      <div className="skeleton-card-footer">
        <SkeletonRect height={36} radius={8} />
      </div>
    </div>
  );
}

export function SkeletonListItem() {
  return (
    <div className="skeleton-list-item">
      <SkeletonCircle size={40} />
      <div className="skeleton-list-content">
        <SkeletonText width="60%" height={16} />
        <SkeletonText width="80%" height={13} />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3 }) {
  return (
    <div className="skeleton-list">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonListItem key={i} />
      ))}
    </div>
  );
}

export function SkeletonStats() {
  return (
    <div className="stats-grid">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="skeleton-stat">
          <SkeletonCircle size={52} />
          <SkeletonText width={60} height={32} />
          <SkeletonText width={80} height={14} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonSchedule() {
  return (
    <div className="skeleton-schedule">
      {[1, 2, 3].map(i => (
        <div key={i} className="skeleton-schedule-item">
          <div className="skeleton-schedule-time">
            <SkeletonText width={40} height={16} />
            <SkeletonText width={35} height={12} />
          </div>
          <div className="skeleton-schedule-content">
            <SkeletonText width="70%" height={18} />
            <SkeletonText width="50%" height={14} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonProfile() {
  return (
    <div className="skeleton-profile">
      <SkeletonCircle size={96} />
      <SkeletonText width={150} height={24} />
      <SkeletonText width={200} height={16} />
      <SkeletonRect width={100} height={28} radius={14} />
    </div>
  );
}

/**
 * Offline Banner
 */
export function OfflineBanner({ isOnline, isFromCache }) {
  if (isOnline && !isFromCache) return null;
  
  return (
    <div className={`offline-banner ${!isOnline ? 'offline' : 'cached'}`}>
      <span className="offline-banner-icon">
        {!isOnline ? '📡' : '💾'}
      </span>
      <span className="offline-banner-text">
        {!isOnline ? 'Нет подключения' : 'Показаны сохранённые данные'}
      </span>
    </div>
  );
}

/**
 * Action Sheet - нижняя шторка с действиями
 */
export function ActionSheet({ isOpen, onClose, title, actions = [] }) {
  if (!isOpen) return null;

  return (
    <div className="action-sheet-overlay" onClick={onClose}>
      <div className="action-sheet" onClick={e => e.stopPropagation()}>
        <div className="action-sheet-handle" />
        {title && <div className="action-sheet-title">{title}</div>}
        <div className="action-sheet-actions">
          {actions.map((action, index) => (
            <button
              key={index}
              className={`action-sheet-item ${action.destructive ? 'destructive' : ''}`}
              onClick={() => {
                haptic.light();
                action.onClick();
                onClose();
              }}
            >
              {action.icon && <span className="action-sheet-icon">{action.icon}</span>}
              <span>{action.label}</span>
            </button>
          ))}
        </div>
        <button className="action-sheet-cancel" onClick={onClose}>
          Отмена
        </button>
      </div>
    </div>
  );
}

export default SwipeableCard;
