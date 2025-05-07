// Firebase utility functions for timestamp conversion

import { Timestamp } from 'firebase/firestore';

/**
 * Converts JavaScript Date objects to Firestore Timestamps for storage
 */
export const dateToTimestamp = (date: Date | undefined): Timestamp | null => {
  if (!date) return null;
  return Timestamp.fromDate(date);
};

/**
 * Converts Firestore Timestamps to JavaScript Date objects for application use
 */
export const timestampToDate = (timestamp: Timestamp | null): Date | undefined => {
  if (!timestamp) return undefined;
  return timestamp.toDate();
};

/**
 * Converts all Date objects in an object to Firestore Timestamps recursively
 */
export const convertDatesToTimestamps = <T extends Record<string, any>>(obj: T): T => {
  const result: Record<string, any> = {};
  
  Object.entries(obj).forEach(([key, value]) => {
    if (value instanceof Date) {
      result[key] = dateToTimestamp(value);
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = convertDatesToTimestamps(value);
    } else if (Array.isArray(value)) {
      result[key] = value.map(item => 
        item instanceof Date 
          ? dateToTimestamp(item)
          : item && typeof item === 'object' 
            ? convertDatesToTimestamps(item) 
            : item
      );
    } else {
      result[key] = value;
    }
  });
  
  return result as T;
};

/**
 * Converts all Firestore Timestamps in an object to JavaScript Date objects recursively
 */
export const convertTimestampsToDates = <T extends Record<string, any>>(obj: T): T => {
  const result: Record<string, any> = {};
  
  Object.entries(obj).forEach(([key, value]) => {
    if (value instanceof Timestamp) {
      result[key] = timestampToDate(value);
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = convertTimestampsToDates(value);
    } else if (Array.isArray(value)) {
      result[key] = value.map(item => 
        item instanceof Timestamp 
          ? timestampToDate(item)
          : item && typeof item === 'object' 
            ? convertTimestampsToDates(item) 
            : item
      );
    } else {
      result[key] = value;
    }
  });
  
  return result as T;
};