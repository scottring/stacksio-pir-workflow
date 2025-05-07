/**
 * Format a file size in bytes to a human-readable string
 * @param bytes File size in bytes
 * @param decimals Number of decimal places to show
 * @returns Formatted file size string (e.g., "1.5 MB")
 */
export const formatFileSize = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Format a date to a short date string (MM/DD/YYYY)
 * @param date Date to format
 * @returns Formatted date string
 */
export const formatShortDate = (date: Date): string => {
  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
};

/**
 * Format a date to a long date string (Month DD, YYYY)
 * @param date Date to format
 * @returns Formatted date string
 */
export const formatLongDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
};

/**
 * Format a date to include time (Month DD, YYYY at HH:MM AM/PM)
 * @param date Date to format
 * @returns Formatted date and time string
 */
export const formatDateTime = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Truncate a string to a specified length and add ellipsis
 * @param str String to truncate
 * @param length Maximum length before truncation
 * @returns Truncated string
 */
export const truncateString = (str: string, length: number = 50): string => {
  if (str.length <= length) return str;
  return str.substring(0, length) + '...';
};
