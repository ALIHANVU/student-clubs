/**
 * Faculty Card Components — iOS 26 Liquid Glass
 * Оптимизированные мемоизированные компоненты
 */
import React, { memo } from 'react';
import { 
  IconBuilding, IconBook, IconUsers, IconUser, 
  IconEdit, IconTrash, IconPlus, IconChevronDown, IconChevronRight 
} from './Icons';

// ========== FACULTY CARD ==========
export const FacultyCard = memo(function FacultyCard({ 
  faculty, 
  canEdit, 
  isExpanded, 
  expandedDirection,
  expandedGroup,
  onToggle, 
  onToggleDirection,
  onToggleGroup,
  onEdit, 
  onDelete 
}) {
  const hasDirections = faculty.directions.length > 0;
  const totalGroups = faculty.directions.reduce((sum, d) => sum + d.groups.length, 0);

  return (
    <div className="ios-faculty-card">
      {/* Header с Liquid Glass */}
      <div 
        className="ios-card-header"
        onClick={() => hasDirections && onToggle(faculty.id)}
        role="button"
        tabIndex={hasDirections ? 0 : -1}
      >
        {/* Gradient Icon Circle */}
        <div className="ios-icon-circle blue-gradient">
          <IconBuilding size={28} color="white" />
        </div>
        
        {/* Content */}
        <div className="ios-card-content">
          <div className="ios-card-title-row">
            <h3 className="ios-card-title">{faculty.name}</h3>
            {faculty.code && (
              <span className="ios-badge blue">{faculty.code}</span>
            )}
          </div>
          
          <div className="ios-card-stats">
            <span className="ios-stat-item">
              <IconBook size={14} />
              {faculty.directions.length} направлений
            </span>
            <span className="ios-stat-separator">•</span>
            <span className="ios-stat-item">
              <IconUsers size={14} />
              {totalGroups} групп
            </span>
          </div>
          
          {faculty.description && (
            <p className="ios-card-description">{faculty.description}</p>
          )}
        </div>

        {/* Actions */}
        <div className="ios-card-actions">
          {canEdit && (
            <>
              <button 
                className="ios-action-btn edit"
                onClick={(e) => { e.stopPropagation(); onEdit('faculty', null, '', faculty); }}
                aria-label="Редактировать"
              >
                <IconEdit size={18} />
              </button>
              <button 
                className="ios-action-btn delete"
                onClick={(e) => onDelete('faculty', faculty.id, faculty.name, e)}
                aria-label="Удалить"
              >
                <IconTrash size={18} />
              </button>
            </>
          )}
          
          {hasDirections && (
            <div className="ios-expand-indicator">
              {isExpanded ? 
                <IconChevronDown size={20} /> : 
                <IconChevronRight size={20} />
              }
            </div>
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="ios-card-children">
          {canEdit && (
            <button 
              className="ios-add-button"
              onClick={() => onEdit('direction', faculty.id, faculty.name)}
            >
              <div className="ios-add-icon">
                <IconPlus size={16} />
              </div>
              <span>Добавить направление</span>
            </button>
          )}
          
          {faculty.directions.length === 0 ? (
            <div className="ios-empty-state">
              <p>Нет направлений</p>
            </div>
          ) : (
            <div className="ios-directions-list">
              {faculty.directions.map((direction) => (
                <DirectionCard
                  key={direction.id}
                  direction={direction}
                  facultyId={faculty.id}
                  facultyName={faculty.name}
                  canEdit={canEdit}
                  isExpanded={expandedDirection === direction.id}
                  expandedGroup={expandedGroup}
                  onToggle={onToggleDirection}
                  onToggleGroup={onToggleGroup}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

// ========== DIRECTION CARD ==========
const DirectionCard = memo(function DirectionCard({ 
  direction, 
  facultyId,
  facultyName,
  canEdit, 
  isExpanded,
  expandedGroup,
  onToggle,
  onToggleGroup,
  onEdit, 
  onDelete 
}) {
  const hasGroups = direction.groups.length > 0;

  return (
    <div className="ios-direction-card">
      <div 
        className="ios-card-header nested"
        onClick={() => hasGroups && onToggle(direction.id)}
        role="button"
        tabIndex={hasGroups ? 0 : -1}
      >
        <div className="ios-icon-circle purple-gradient">
          <IconBook size={22} color="white" />
        </div>
        
        <div className="ios-card-content">
          <div className="ios-card-title-row">
            <h4 className="ios-card-title small">{direction.name}</h4>
            {direction.code && (
              <span className="ios-badge purple">{direction.code}</span>
            )}
          </div>
          
          <div className="ios-card-stats small">
            <span className="ios-stat-item">
              <IconUsers size={12} />
              {direction.groups.length} групп
            </span>
          </div>
        </div>

        <div className="ios-card-actions compact">
          {canEdit && (
            <>
              <button 
                className="ios-action-btn edit small"
                onClick={(e) => { e.stopPropagation(); onEdit('direction', facultyId, facultyName, direction); }}
                aria-label="Редактировать"
              >
                <IconEdit size={16} />
              </button>
              <button 
                className="ios-action-btn delete small"
                onClick={(e) => onDelete('direction', direction.id, direction.name, e)}
                aria-label="Удалить"
              >
                <IconTrash size={16} />
              </button>
            </>
          )}
          
          {hasGroups && (
            <div className="ios-expand-indicator small">
              {isExpanded ? 
                <IconChevronDown size={18} /> : 
                <IconChevronRight size={18} />
              }
            </div>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="ios-card-children nested">
          {canEdit && (
            <button 
              className="ios-add-button small"
              onClick={() => onEdit('group', direction.id, direction.name)}
            >
              <div className="ios-add-icon small">
                <IconPlus size={14} />
              </div>
              <span>Добавить группу</span>
            </button>
          )}
          
          {direction.groups.length === 0 ? (
            <div className="ios-empty-state small">
              <p>Нет групп</p>
            </div>
          ) : (
            <div className="ios-groups-list">
              {direction.groups.map((group) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  directionId={direction.id}
                  directionName={direction.name}
                  canEdit={canEdit}
                  isExpanded={expandedGroup === group.id}
                  onToggle={onToggleGroup}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

// ========== GROUP CARD ==========
const GroupCard = memo(function GroupCard({ 
  group, 
  directionId,
  directionName,
  canEdit, 
  isExpanded,
  onToggle,
  onEdit, 
  onDelete 
}) {
  const hasSubgroups = group.subgroups.length > 0;

  return (
    <div className="ios-group-card">
      <div 
        className="ios-card-header nested-2"
        onClick={() => hasSubgroups && onToggle(group.id)}
        role="button"
        tabIndex={hasSubgroups ? 0 : -1}
      >
        <div className="ios-icon-circle green-gradient">
          <IconUsers size={18} color="white" />
        </div>
        
        <div className="ios-card-content">
          <div className="ios-card-title-row">
            <h5 className="ios-card-title tiny">{group.name}</h5>
            <div className="ios-badges-row">
              <span className="ios-badge green">{group.course} курс</span>
              {group.year && (
                <span className="ios-badge outline">{group.year}</span>
              )}
            </div>
          </div>
          
          {hasSubgroups && (
            <div className="ios-card-stats tiny">
              <span className="ios-stat-item">
                {group.subgroups.length} подгрупп
              </span>
            </div>
          )}
        </div>

        <div className="ios-card-actions compact">
          {canEdit && (
            <>
              <button 
                className="ios-action-btn edit tiny"
                onClick={(e) => { e.stopPropagation(); onEdit('group', directionId, directionName, group); }}
                aria-label="Редактировать"
              >
                <IconEdit size={14} />
              </button>
              <button 
                className="ios-action-btn delete tiny"
                onClick={(e) => onDelete('group', group.id, group.name, e)}
                aria-label="Удалить"
              >
                <IconTrash size={14} />
              </button>
            </>
          )}
          
          {hasSubgroups && (
            <div className="ios-expand-indicator tiny">
              {isExpanded ? 
                <IconChevronDown size={16} /> : 
                <IconChevronRight size={16} />
              }
            </div>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="ios-card-children nested-2">
          {canEdit && (
            <button 
              className="ios-add-button tiny"
              onClick={() => onEdit('subgroup', group.id, group.name)}
            >
              <div className="ios-add-icon tiny">
                <IconPlus size={12} />
              </div>
              <span>Добавить подгруппу</span>
            </button>
          )}
          
          {group.subgroups.length === 0 ? (
            <div className="ios-empty-state tiny">
              <p>Нет подгрупп</p>
            </div>
          ) : (
            <div className="ios-subgroups-list">
              {group.subgroups.map((subgroup) => (
                <SubgroupCard
                  key={subgroup.id}
                  subgroup={subgroup}
                  groupId={group.id}
                  groupName={group.name}
                  canEdit={canEdit}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

// ========== SUBGROUP CARD ==========
const SubgroupCard = memo(function SubgroupCard({ 
  subgroup, 
  groupId,
  groupName,
  canEdit, 
  onEdit, 
  onDelete 
}) {
  return (
    <div className="ios-subgroup-card">
      <div className="ios-card-header leaf">
        <div className="ios-icon-circle orange-gradient">
          <IconUser size={14} color="white" />
        </div>
        
        <div className="ios-card-content">
          <h6 className="ios-card-title micro">{subgroup.name}</h6>
        </div>

        {canEdit && (
          <div className="ios-card-actions compact">
            <button 
              className="ios-action-btn edit micro"
              onClick={(e) => { e.stopPropagation(); onEdit('subgroup', groupId, groupName, subgroup); }}
              aria-label="Редактировать"
            >
              <IconEdit size={12} />
            </button>
            <button 
              className="ios-action-btn delete micro"
              onClick={(e) => onDelete('subgroup', subgroup.id, subgroup.name, e)}
              aria-label="Удалить"
            >
              <IconTrash size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
});
