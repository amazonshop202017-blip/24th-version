import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';

export interface ScreenshotTag {
  id: string;
  name: string;
  color: string;
}

interface ScreenshotTagsContextType {
  screenshotTags: ScreenshotTag[];
  addScreenshotTag: (name: string, color: string) => void;
  removeScreenshotTag: (id: string) => void;
  updateScreenshotTag: (id: string, name: string, color: string) => void;
  onScreenshotTagRemove: (callback: (tagId: string) => void) => () => void;
}

const ScreenshotTagsContext = createContext<ScreenshotTagsContextType | undefined>(undefined);

const SCREENSHOT_TAGS_STORAGE_KEY = 'trading-journal-screenshot-tags';

const generateId = () => `sctag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const ScreenshotTagsProvider = ({ children }: { children: ReactNode }) => {
  const [screenshotTags, setScreenshotTags] = useState<ScreenshotTag[]>([]);
  const removeCallbacksRef = useRef<Set<(tagId: string) => void>>(new Set());

  useEffect(() => {
    const stored = localStorage.getItem(SCREENSHOT_TAGS_STORAGE_KEY);
    if (stored) {
      setScreenshotTags(JSON.parse(stored));
    }
  }, []);

  const saveScreenshotTags = useCallback((newTags: ScreenshotTag[]) => {
    localStorage.setItem(SCREENSHOT_TAGS_STORAGE_KEY, JSON.stringify(newTags));
    setScreenshotTags(newTags);
  }, []);

  const addScreenshotTag = useCallback((name: string, color: string) => {
    const trimmed = name.trim();
    if (trimmed && !screenshotTags.some(t => t.name === trimmed)) {
      const newTag: ScreenshotTag = {
        id: generateId(),
        name: trimmed,
        color,
      };
      saveScreenshotTags([...screenshotTags, newTag]);
    }
  }, [screenshotTags, saveScreenshotTags]);

  const removeScreenshotTag = useCallback((id: string) => {
    removeCallbacksRef.current.forEach(callback => callback(id));
    saveScreenshotTags(screenshotTags.filter(t => t.id !== id));
  }, [screenshotTags, saveScreenshotTags]);

  const updateScreenshotTag = useCallback((id: string, name: string, color: string) => {
    const trimmed = name.trim();
    if (trimmed) {
      saveScreenshotTags(screenshotTags.map(t => 
        t.id === id ? { ...t, name: trimmed, color } : t
      ));
    }
  }, [screenshotTags, saveScreenshotTags]);

  const onScreenshotTagRemove = useCallback((callback: (tagId: string) => void) => {
    removeCallbacksRef.current.add(callback);
    return () => {
      removeCallbacksRef.current.delete(callback);
    };
  }, []);

  return (
    <ScreenshotTagsContext.Provider value={{ 
      screenshotTags, 
      addScreenshotTag, 
      removeScreenshotTag, 
      updateScreenshotTag, 
      onScreenshotTagRemove 
    }}>
      {children}
    </ScreenshotTagsContext.Provider>
  );
};

export const useScreenshotTagsContext = () => {
  const context = useContext(ScreenshotTagsContext);
  if (!context) {
    throw new Error('useScreenshotTagsContext must be used within ScreenshotTagsProvider');
  }
  return context;
};
