import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

interface TagsContextType {
  tags: string[];
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
  updateTag: (oldTag: string, newTag: string) => void;
}

const TagsContext = createContext<TagsContextType | undefined>(undefined);

const TAGS_STORAGE_KEY = 'trading-journal-tags';

export const TagsProvider = ({ children }: { children: ReactNode }) => {
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(TAGS_STORAGE_KEY);
    if (stored) {
      setTags(JSON.parse(stored));
    }
  }, []);

  const saveTags = useCallback((newTags: string[]) => {
    localStorage.setItem(TAGS_STORAGE_KEY, JSON.stringify(newTags));
    setTags(newTags);
  }, []);

  const addTag = useCallback((tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      saveTags([...tags, trimmed]);
    }
  }, [tags, saveTags]);

  const removeTag = useCallback((tag: string) => {
    saveTags(tags.filter(t => t !== tag));
  }, [tags, saveTags]);

  const updateTag = useCallback((oldTag: string, newTag: string) => {
    const trimmed = newTag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      saveTags(tags.map(t => t === oldTag ? trimmed : t));
    }
  }, [tags, saveTags]);

  return (
    <TagsContext.Provider value={{ tags, addTag, removeTag, updateTag }}>
      {children}
    </TagsContext.Provider>
  );
};

export const useTagsContext = () => {
  const context = useContext(TagsContext);
  if (!context) {
    throw new Error('useTagsContext must be used within TagsProvider');
  }
  return context;
};
