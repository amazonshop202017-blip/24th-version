import { useState, useCallback, useEffect } from 'react';
import { ChartDisplayType } from '@/hooks/useChartDisplayMode';

const STORAGE_KEY = 'favorite-metrics';

const getStoredFavorites = (): ChartDisplayType[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveFavorites = (favorites: ChartDisplayType[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
};

// Simple event-based sync across hook instances
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

export const useFavoriteMetrics = () => {
  const [favorites, setFavorites] = useState<ChartDisplayType[]>(getStoredFavorites);

  // Listen for changes from other instances
  useEffect(() => {
    const handler = () => setFavorites(getStoredFavorites());
    listeners.add(handler);
    return () => { listeners.delete(handler); };
  }, []);

  const toggleFavorite = useCallback((metric: ChartDisplayType) => {
    setFavorites((prev) => {
      const next = prev.includes(metric)
        ? prev.filter((m) => m !== metric)
        : [...prev, metric];
      saveFavorites(next);
      // Notify other instances
      setTimeout(notify, 0);
      return next;
    });
  }, []);

  const isFavorite = useCallback(
    (metric: ChartDisplayType) => favorites.includes(metric),
    [favorites]
  );

  return { favorites, toggleFavorite, isFavorite };
};
