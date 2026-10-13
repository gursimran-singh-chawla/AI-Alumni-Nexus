/**
 * Badge Helper Utilities
 * Centralized functions for badge type mapping, colors, and labels
 */

// Mapping of badge types to CSS color classes
const BADGE_COLOR_MAP = {
  // User verification
  'user-verified': 'badge-green',
  'user-unverified': 'badge-yellow',
  
  // User online status
  'user-online': 'badge-green',
  'user-offline': 'badge-gray',
  
  // Event status
  'event-upcoming': 'badge-blue',
  'event-ongoing': 'badge-purple',
  'event-past': 'badge-gray',
  'event-cancelled': 'badge-red',
  
  // Opportunity application status
  'opportunity-applied': 'badge-blue',
  'opportunity-reviewing': 'badge-purple',
  'opportunity-shortlisted': 'badge-blue',
  'opportunity-accepted': 'badge-green',
  'opportunity-selected': 'badge-green',
  'opportunity-rejected': 'badge-red',
  'opportunity-not-applied': 'badge-gray',
  
  // Mentorship session status
  'mentorship-requested': 'badge-yellow',
  'mentorship-pending': 'badge-yellow',
  'mentorship-accepted': 'badge-blue',
  'mentorship-upcoming': 'badge-blue',
  'mentorship-ongoing': 'badge-blue',
  'mentorship-completed': 'badge-green',
  'mentorship-rejected': 'badge-red',
  'mentorship-cancelled': 'badge-red',
  
  // Post engagement status
  'post-new': 'badge-blue',
  'post-trending': 'badge-purple',
  'post-archived': 'badge-gray',
  
  // Notification read status
  'notification-read': 'badge-gray',
  'notification-unread': 'badge-blue',
};

// Mapping of badge types to human-readable labels
const BADGE_LABEL_MAP = {
  'user-verified': 'Verified',
  'user-unverified': 'Unverified',
  'user-online': 'Online',
  'user-offline': 'Offline',
  'event-upcoming': 'Upcoming',
  'event-ongoing': 'Ongoing',
  'event-past': 'Past',
  'event-cancelled': 'Cancelled',
  'opportunity-applied': 'Applied',
  'opportunity-reviewing': 'Reviewing',
  'opportunity-shortlisted': 'Shortlisted',
  'opportunity-accepted': 'Accepted',
  'opportunity-selected': 'Selected',
  'opportunity-rejected': 'Rejected',
  'opportunity-not-applied': 'Available',
  'mentorship-requested': 'Requested',
  'mentorship-pending': 'Pending',
  'mentorship-accepted': 'Accepted',
  'mentorship-upcoming': 'Upcoming',
  'mentorship-ongoing': 'Ongoing',
  'mentorship-completed': 'Completed',
  'mentorship-rejected': 'Rejected',
  'mentorship-cancelled': 'Cancelled',
  'post-new': 'New',
  'post-trending': 'Trending',
  'post-archived': 'Archived',
  'notification-read': 'Read',
  'notification-unread': 'Unread',
};

/**
 * Get CSS color class for a badge type
 * @param {string} type - Badge type
 * @returns {string} CSS class (e.g., 'badge-blue', 'badge-green')
 */
export const getStatusColor = (type) => {
  return BADGE_COLOR_MAP[type] || 'badge-gray';
};

/**
 * Get human-readable label for a badge type
 * @param {string} type - Badge type
 * @returns {string} Label text (e.g., 'Upcoming', 'Verified')
 */
export const getBadgeLabel = (type) => {
  return BADGE_LABEL_MAP[type] || type;
};

/**
 * Derive badge type from raw status value and category
 * Useful for mapping backend status strings to badge types
 * 
 * @param {string} status - Raw status value from API
 * @param {string} category - Category to contextualize status ('event', 'opportunity', 'mentorship', 'post', etc.)
 * @returns {string} Badge type for use with Badge component
 */
export const getBadgeType = (status, category) => {
  if (!status || !category) return 'badge-gray';
  
  const key = `${category}-${status.toLowerCase()}`;
  return BADGE_COLOR_MAP[key] ? key : 'badge-gray';
};

/**
 * Get badge type for user online/offline status
 * @param {boolean} isOnline - Whether user is online
 * @returns {string} Badge type
 */
export const getOnlineBadgeType = (isOnline) => {
  return isOnline ? 'user-online' : 'user-offline';
};

/**
 * Get badge type for user verification status
 * @param {boolean} isVerified - Whether user is verified
 * @returns {string} Badge type
 */
export const getVerificationBadgeType = (isVerified) => {
  return isVerified ? 'user-verified' : 'user-unverified';
};

/**
 * Get badge type for notification read status
 * @param {boolean} isRead - Whether notification is read
 * @returns {string} Badge type
 */
export const getNotificationBadgeType = (isRead) => {
  return isRead ? 'notification-read' : 'notification-unread';
};

/**
 * Get badge type for post engagement status
 * Determines if post is new, trending, or archived based on timestamps and engagement
 * 
 * @param {number} createdAt - Post creation timestamp (ms)
 * @param {number} likes - Number of likes
 * @param {number} trendingThreshold - Like count to be considered trending (default: 50)
 * @returns {string} Badge type
 */
export const getPostEngagementBadgeType = (createdAt, likes, trendingThreshold = 50) => {
  const now = Date.now();
  const ageInDays = (now - createdAt) / (1000 * 60 * 60 * 24);
  
  if (ageInDays > 30) return 'post-archived';
  if (ageInDays < 1 && likes < trendingThreshold) return 'post-new';
  if (likes >= trendingThreshold) return 'post-trending';
  
  return 'post-gray';
};
