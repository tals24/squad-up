import { formatDistanceToNow, isFuture, isPast } from 'date-fns';

/**
 * Safely parse a date string and return a Date object or null
 * @param {string} dateString - The date string to parse
 * @returns {Date|null} - Parsed date or null if invalid
 */
export const safeDate = (dateString) => {
  if (!dateString || dateString === '') return null;
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
};

/**
 * Safely format distance to now with error handling
 * @param {string} dateString - The date string to format
 * @param {Object} options - Formatting options
 * @returns {string} - Formatted distance or 'Invalid date'
 */
export const safeFormatDistanceToNow = (dateString, options = {}) => {
  const date = safeDate(dateString);
  if (!date) return 'Invalid date';
  try {
    return formatDistanceToNow(date, options);
  } catch (error) {
    return 'Invalid date';
  }
};

/**
 * Safely check if a date is in the future
 * @param {string} dateString - The date string to check
 * @returns {boolean} - True if date is in future, false otherwise
 */
export const safeIsFuture = (dateString) => {
  const date = safeDate(dateString);
  if (!date) return false;
  try {
    return isFuture(date);
  } catch (error) {
    return false;
  }
};

/**
 * Safely check if a date is in the past
 * @param {string} dateString - The date string to check
 * @returns {boolean} - True if date is in past, false otherwise
 */
export const safeIsPast = (dateString) => {
  const date = safeDate(dateString);
  if (!date) return false;
  try {
    return isPast(date);
  } catch (error) {
    return false;
  }
};

