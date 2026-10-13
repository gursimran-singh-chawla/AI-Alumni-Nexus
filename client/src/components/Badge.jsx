import React from 'react';
import { getBadgeLabel, getStatusColor } from '../utils/badgeHelper';

/**
 * Unified Badge Component
 * Displays status badges with consistent styling across the app
 * 
 * @param {string} type - Badge type/variant (e.g., 'user-verified', 'event-upcoming', 'post-trending')
 * @param {string} size - Size variant: 'small' (10px), 'medium' (12px default), 'large' (14px)
 * @param {string} className - Additional CSS classes to apply
 * @param {string} label - Custom label text (overrides default from type)
 * @param {string} icon - Optional icon/emoji to prepend (e.g., '🔵')
 */
const Badge = ({ type, size = 'medium', className = '', label, icon = '' }) => {
  // Get base label and color from type
  const baseLabel = label || getBadgeLabel(type);
  const colorClass = getStatusColor(type);

  // Map size to CSS class
  const sizeClass = {
    small: 'badge-small',
    medium: 'badge-medium',
    large: 'badge-large',
  }[size] || 'badge-medium';

  return (
    <span className={`badge ${colorClass} ${sizeClass} ${className}`}>
      {icon && <span className="badge-icon">{icon}</span>}
      {baseLabel}
    </span>
  );
};

export default Badge;
