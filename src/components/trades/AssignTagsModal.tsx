import { useState, useEffect, useRef, useMemo } from 'react';
import { X, MoreHorizontal, ChevronDown, Check, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useCategoriesContext, Category } from '@/contexts/CategoriesContext';
import { useTagsContext, Tag } from '@/contexts/TagsContext';
import { cn } from '@/lib/utils';

// Preset colors for new tags (excluding already used ones)
const TAG_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#78716c', '#737373', '#71717a',
];

interface AssignTagsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTagIds: string[];
  onTagsChange: (tagIds: string[]) => void;
  symbol?: string;
  entryDate?: string;
}

interface CategoryBlockProps {
  category: Category;
  tags: Tag[];
  selectedTagIds: string[];
  onToggleTag: (tagId: string) => void;
  onCreateTag: (name: string, categoryId: string) => void;
  usedColors: string[];
}

const CategoryBlock = ({
  category,
  tags,
  selectedTagIds,
  onToggleTag,
  onCreateTag,
  usedColors,
}: CategoryBlockProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const categoryTags = tags.filter(t => t.categoryId === category.id);
  const selectedCategoryTags = categoryTags.filter(t => selectedTagIds.includes(t.id));

  const filteredTags = categoryTags.filter(tag =>
    tag.name.toLowerCase().includes(searchValue.toLowerCase())
  );

  const showCreateOption = searchValue.trim() && 
    !categoryTags.some(t => t.name.toLowerCase() === searchValue.trim().toLowerCase());

  const handleSelectTag = (tagId: string) => {
    onToggleTag(tagId);
  };

  const handleCreateTag = () => {
    if (searchValue.trim()) {
      onCreateTag(searchValue.trim(), category.id);
      setSearchValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && showCreateOption) {
      e.preventDefault();
      handleCreateTag();
    }
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="bg-muted/30 rounded-lg p-4 space-y-3">
      {/* Category Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: category.color }}
          />
          <span className="font-medium text-sm">{category.name}</span>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </div>

      {/* Selected Tags Pills */}
      {selectedCategoryTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedCategoryTags.map(tag => (
            <button
              key={tag.id}
              onClick={() => onToggleTag(tag.id)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-background border border-border hover:bg-muted/50 transition-colors"
            >
              <span>{tag.name}</span>
              <X className="w-3 h-3" />
            </button>
          ))}
        </div>
      )}

      {/* Tag Selection Dropdown */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={isOpen}
            className="w-full justify-between h-10 bg-input border-border font-normal"
          >
            <span className="text-muted-foreground text-sm">Select tag</span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-popover border-border z-50" align="start">
          <div className="p-2 border-b border-border">
            <Input
              ref={inputRef}
              placeholder="Search or create tag..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-8 bg-input border-border"
            />
          </div>
          <div className="max-h-48 overflow-y-auto p-2 space-y-1">
            {filteredTags.map(tag => {
              const isSelected = selectedTagIds.includes(tag.id);
              return (
                <div
                  key={tag.id}
                  onClick={() => handleSelectTag(tag.id)}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors",
                    isSelected ? "bg-muted" : "hover:bg-muted/50"
                  )}
                >
                  <div className="w-4 h-4 rounded border border-border flex items-center justify-center">
                    {isSelected && <Check className="w-3 h-3" />}
                  </div>
                  <span className="text-sm">{tag.name}</span>
                </div>
              );
            })}
            
            {showCreateOption && (
              <div
                onClick={handleCreateTag}
                className="flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-muted/50 text-primary"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm">Create "{searchValue.trim()}"</span>
              </div>
            )}

            {filteredTags.length === 0 && !showCreateOption && (
              <div className="p-2 text-sm text-muted-foreground text-center">
                No tags found
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export const AssignTagsModal = ({
  isOpen,
  onClose,
  selectedTagIds,
  onTagsChange,
  symbol,
  entryDate,
}: AssignTagsModalProps) => {
  const { categories } = useCategoriesContext();
  const { tags, addTag, getActiveTags } = useTagsContext();
  const [localSelectedIds, setLocalSelectedIds] = useState<string[]>(selectedTagIds);
  
  // Only show active (non-archived) tags in the selection UI
  const activeTags = getActiveTags();

  // Sync local state when modal opens or selectedTagIds changes
  useEffect(() => {
    if (isOpen) {
      setLocalSelectedIds(selectedTagIds);
    }
  }, [isOpen, selectedTagIds]);

  // Get all used colors
  const usedColors = useMemo(() => tags.map(t => {
    // Tags don't have colors in the current schema, so we'll use category colors
    return '';
  }), [tags]);

  const getRandomColor = () => {
    const availableColors = TAG_COLORS.filter(c => !usedColors.includes(c));
    if (availableColors.length === 0) {
      return TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)];
    }
    return availableColors[Math.floor(Math.random() * availableColors.length)];
  };

  const handleToggleTag = (tagId: string) => {
    setLocalSelectedIds(prev => {
      const newIds = prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId];
      return newIds;
    });
  };

  const handleCreateTag = (name: string, categoryId: string) => {
    // Create tag in the context (will be persisted to localStorage)
    const newTag = addTag(name, categoryId, '');
    
    // Immediately select the newly created tag
    if (newTag) {
      setLocalSelectedIds(prev => [...prev, newTag.id]);
    }
  };

  // Handle close - save changes
  const handleClose = () => {
    onTagsChange(localSelectedIds);
    onClose();
  };

  // Format entry date for display
  const formattedDate = entryDate 
    ? new Date(entryDate).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : '';

  const subText = [symbol, formattedDate].filter(Boolean).join(' • ');

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg font-semibold">Add and manage tags</DialogTitle>
              {subText && (
                <p className="text-sm text-muted-foreground mt-1">{subText}</p>
              )}
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 py-4">
          <div className="space-y-4">
            {categories.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm">No categories found.</p>
                <p className="text-muted-foreground text-xs mt-1">
                  Create categories in Settings → Custom Tags
                </p>
              </div>
            ) : (
              categories.map(category => (
                <CategoryBlock
                  key={category.id}
                  category={category}
                  tags={activeTags}
                  selectedTagIds={localSelectedIds}
                  onToggleTag={handleToggleTag}
                  onCreateTag={handleCreateTag}
                  usedColors={usedColors}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
