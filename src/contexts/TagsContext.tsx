import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useCategoriesContext } from './CategoriesContext';

export interface Tag {
  id: string;
  name: string;
  categoryId: string;
  description: string;
  archived?: boolean;
}

interface TagsContextType {
  tags: Tag[];
  addTag: (name: string, categoryId: string, description: string) => Tag | null;
  removeTag: (id: string) => void;
  updateTag: (id: string, name: string, categoryId: string, description: string) => void;
  removeTagsByCategory: (categoryId: string) => void;
  getTagUsageCount: (tagId: string, trades: { tags: string[] }[]) => number;
  archiveTag: (id: string) => void;
  unarchiveTag: (id: string) => void;
  deleteTagPermanently: (id: string) => void;
  getActiveTags: () => Tag[];
  getArchivedTags: () => Tag[];
}

const TagsContext = createContext<TagsContextType | undefined>(undefined);

const TAGS_STORAGE_KEY = 'trading-journal-tags-v2';

const generateId = () => `tag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const TagsProvider = ({ children }: { children: ReactNode }) => {
  const [tags, setTags] = useState<Tag[]>([]);
  const { onCategoryRemove } = useCategoriesContext();

  useEffect(() => {
    const stored = localStorage.getItem(TAGS_STORAGE_KEY);
    if (stored) {
      setTags(JSON.parse(stored));
    }
  }, []);

  const saveTags = useCallback((newTags: Tag[]) => {
    localStorage.setItem(TAGS_STORAGE_KEY, JSON.stringify(newTags));
    setTags(newTags);
  }, []);

  const removeTagsByCategory = useCallback((categoryId: string) => {
    setTags(currentTags => {
      const newTags = currentTags.filter(t => t.categoryId !== categoryId);
      localStorage.setItem(TAGS_STORAGE_KEY, JSON.stringify(newTags));
      return newTags;
    });
  }, []);

  // Subscribe to category removal events
  useEffect(() => {
    const unsubscribe = onCategoryRemove((categoryId) => {
      removeTagsByCategory(categoryId);
    });
    return unsubscribe;
  }, [onCategoryRemove, removeTagsByCategory]);

  const addTag = useCallback((name: string, categoryId: string, description: string): Tag | null => {
    const trimmed = name.trim();
    if (trimmed && categoryId) {
      const newTag: Tag = {
        id: generateId(),
        name: trimmed,
        categoryId,
        description: description.trim(),
        archived: false,
      };
      saveTags([...tags, newTag]);
      return newTag;
    }
    return null;
  }, [tags, saveTags]);

  const removeTag = useCallback((id: string) => {
    saveTags(tags.filter(t => t.id !== id));
  }, [tags, saveTags]);

  const updateTag = useCallback((id: string, name: string, categoryId: string, description: string) => {
    const trimmed = name.trim();
    if (trimmed && categoryId) {
      saveTags(tags.map(t => 
        t.id === id ? { ...t, name: trimmed, categoryId, description: description.trim() } : t
      ));
    }
  }, [tags, saveTags]);

  const archiveTag = useCallback((id: string) => {
    saveTags(tags.map(t => 
      t.id === id ? { ...t, archived: true } : t
    ));
  }, [tags, saveTags]);

  const unarchiveTag = useCallback((id: string) => {
    saveTags(tags.map(t => 
      t.id === id ? { ...t, archived: false } : t
    ));
  }, [tags, saveTags]);

  const deleteTagPermanently = useCallback((id: string) => {
    saveTags(tags.filter(t => t.id !== id));
  }, [tags, saveTags]);

  const getActiveTags = useCallback(() => {
    return tags.filter(t => !t.archived);
  }, [tags]);

  const getArchivedTags = useCallback(() => {
    return tags.filter(t => t.archived);
  }, [tags]);

  const getTagUsageCount = useCallback((tagId: string, trades: { tags: string[] }[]) => {
    return trades.filter(trade => trade.tags?.includes(tagId)).length;
  }, []);

  return (
    <TagsContext.Provider value={{ 
      tags, 
      addTag, 
      removeTag, 
      updateTag, 
      removeTagsByCategory,
      getTagUsageCount,
      archiveTag,
      unarchiveTag,
      deleteTagPermanently,
      getActiveTags,
      getArchivedTags,
    }}>
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
