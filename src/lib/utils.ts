import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, parseISO } from "date-fns"

/**
 * Combines multiple class names or class name objects into a single string
 * This allows you to conditionally apply class names and properly merge Tailwind classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date string
 * @param date ISO date string or Date object
 * @param formatString Date format string (default: 'PPP')
 */
export function formatDate(date: string | Date | undefined, formatString = 'PPP') {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, formatString);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
}

/**
 * Format a time string
 * @param timeString Time string in 24-hour format (HH:MM:SS)
 * @param includeSeconds Whether to include seconds in the output
 */
export function formatTime(timeString: string | undefined, includeSeconds = false) {
  if (!timeString) return '';
  
  try {
    // Parse the time string (e.g., "14:30:00" or "14:30")
    const parts = timeString.split(':');
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    
    // Format as 12-hour time
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12; // Convert 0 to 12 for 12AM
    
    if (includeSeconds && parts.length > 2) {
      const seconds = parseInt(parts[2], 10);
      return `${displayHours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} ${period}`;
    }
    
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  } catch (error) {
    console.error('Error formatting time:', error);
    return timeString; // Return the original string if formatting fails
  }
}

/**
 * Get the day name from a day of week number
 * @param dayNumber Day number (0 = Sunday, 1 = Monday, etc.)
 * @param short Whether to return the short form
 */
export function getDayName(dayNumber: number | undefined, short = false) {
  if (dayNumber === undefined) return '';
  
  const days = short 
    ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  return days[dayNumber % 7];
}

/**
 * Truncate text to a specific length
 * @param text Text to truncate
 * @param maxLength Maximum length
 */
export function truncateText(text: string, maxLength: number) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  
  return text.slice(0, maxLength) + '...';
}

/**
 * Format a file size in bytes to a human-readable format
 * @param bytes Size in bytes
 */
export function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Generate a random string of specified length
 * @param length Length of string to generate
 */
export function generateRandomString(length: number) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

/**
 * Parse query parameters from a URL
 * @param url URL string
 */
export function parseQueryParams(url: string) {
  const params = new URLSearchParams(url.split('?')[1]);
  const result: Record<string, string> = {};
  
  for (const [key, value] of params.entries()) {
    result[key] = value;
  }
  
  return result;
}

/**
 * Delay execution for specified milliseconds
 * @param ms Milliseconds to delay
 */
export function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get initials from a name
 * @param name Full name
 * @param maxInitials Maximum number of initials to return
 */
export function getInitials(name: string, maxInitials = 2) {
  if (!name) return '';
  
  return name
    .split(' ')
    .map(part => part[0])
    .filter(Boolean)
    .slice(0, maxInitials)
    .join('')
    .toUpperCase();
}

/**
 * Check if a value is a valid email
 * @param email Email string to validate
 */
export function isValidEmail(email: string) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Generate a QR code payload for attendance
 * @param sessionId Session ID
 * @param code Authentication code
 * @param expiresIn Expiration time in seconds
 */
export function generateAttendanceQRPayload(sessionId: string, code: string, expiresIn = 60) {
  const expiration = Math.floor(Date.now() / 1000) + expiresIn;
  
  return JSON.stringify({
    sessionId,
    code,
    exp: expiration
  });
}

/**
 * Set a value in local storage with optional expiration
 * @param key Storage key
 * @param value Value to store
 * @param expiresInMinutes Expiration time in minutes
 */
export function setStorageWithExpiry(key: string, value: any, expiresInMinutes = 0) {
  const item = {
    value,
    expiry: expiresInMinutes ? Date.now() + expiresInMinutes * 60 * 1000 : null
  };
  
  localStorage.setItem(key, JSON.stringify(item));
}

/**
 * Get a value from local storage, respecting expiration
 * @param key Storage key
 */
export function getStorageWithExpiry(key: string) {
  const itemStr = localStorage.getItem(key);
  if (!itemStr) return null;
  
  try {
    const item = JSON.parse(itemStr);
    
    // Check for expiration
    if (item.expiry && Date.now() > item.expiry) {
      localStorage.removeItem(key);
      return null;
    }
    
    return item.value;
  } catch (error) {
    console.error('Error parsing storage item:', error);
    return null;
  }
}

/**
 * Convert an array to CSV format
 * @param array Array of objects to convert
 * @param columns Optional column definitions
 */
export function arrayToCSV(
  array: any[], 
  columns?: { key: string; header: string }[]
) {
  if (!array.length) return '';
  
  // If columns are not provided, generate them from the first item
  const cols = columns || Object.keys(array[0]).map(key => ({ key, header: key }));
  
  // Create the header row
  const headerRow = cols.map(col => `"${col.header}"`).join(',');
  
  // Create the data rows
  const dataRows = array.map(item => {
    return cols.map(col => {
      const value = item[col.key];
      // Handle different types of values
      if (value === null || value === undefined) return '""';
      if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
      return `"${value}"`;
    }).join(',');
  });
  
  return [headerRow, ...dataRows].join('\n');
}

/**
 * Download data as a file
 * @param data Data to download
 * @param filename Filename
 * @param mimeType MIME type
 */
export function downloadFile(data: string, filename: string, mimeType = 'text/plain') {
  const blob = new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export data to CSV and download it
 * @param data Array of objects to export
 * @param filename Filename without extension
 * @param columns Optional column definitions
 */
export function exportToCSV(
  data: any[], 
  filename: string, 
  columns?: { key: string; header: string }[]
) {
  const csv = arrayToCSV(data, columns);
  downloadFile(csv, `${filename}.csv`, 'text/csv');
}

/**
 * Debounce a function call
 * @param func Function to debounce
 * @param wait Wait time in milliseconds
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T, 
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Convert bytes to human-readable size
 * @param bytes - Number of bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function bytesToSize(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Format time difference as a human-readable string
 * @param date - Date or date string
 * @returns Formatted string (e.g., "5 minutes ago")
 */
export function formatTimeAgo(date: Date | string): string {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);
  
  if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  return `${Math.floor(diffInSeconds / 86400)} days ago`;
}
