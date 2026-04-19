import { useState, useCallback } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const newValue = value instanceof Function ? value(prev) : value;
        try {
          window.localStorage.setItem(key, JSON.stringify(newValue));
        } catch {
          console.warn('Failed to save to localStorage');
        }
        return newValue;
      });
    },
    [key]
  );

  return [storedValue, setValue];
}

export function useCourseProgress(courseId: string) {
  const storageKey = `course-progress-${courseId}`;

  const [progress, setProgress] = useLocalStorage<Record<string, { watched: boolean; lastPosition: number; duration: number }>>(
    storageKey,
    {}
  );

  const updateProgress = useCallback(
    (videoId: string, data: Partial<{ watched: boolean; lastPosition: number; duration: number }>) => {
      setProgress((prev) => ({
        ...prev,
        [videoId]: { ...prev[videoId], ...data },
      }));
    },
    [setProgress]
  );

  const getProgress = useCallback(
    (videoId: string) => progress[videoId] || { watched: false, lastPosition: 0, duration: 0 },
    [progress]
  );

  return { progress, updateProgress, getProgress };
}
