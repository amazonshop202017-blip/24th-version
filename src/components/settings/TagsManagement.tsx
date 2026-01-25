import { useState, useMemo } from 'react';
import { Plus, Search, MoreHorizontal, Edit2, Trash2, Archive, ArchiveRestore, ChevronDown, ChevronUp, Tag as TagIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { useTagsContext, Tag } from '@/contexts/TagsContext';
import { useCategoriesContext } from '@/contexts/CategoriesContext';
import { useTradesContext } from '@/contexts/TradesContext';
import { TagModal } from './TagModal';
import { motion, AnimatePresence } from 'framer-motion';

export const TagsManagement = () => {
  const { tags, addTag, removeTag, updateTag, getTagUsageCount, archiveTag, unarchiveTag, deleteTagPermanently, getActiveTags, getArchivedTags } = useTagsContext();
  const { categories } = useCategoriesContext();
  const { trades } = useTradesContext();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [showArchived, setShowArchived] = useState(false);

  const activeTags = getActiveTags();
  const archivedTags = getArchivedTags();

  // Filter active tags based on search and category
  const filteredActiveTags = useMemo(() => {
    return activeTags.filter((tag) => {
      const matchesSearch = tag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tag.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || tag.categoryId === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [activeTags, searchQuery, categoryFilter]);

  // Filter archived tags based on search and category
  const filteredArchivedTags = useMemo(() => {
    return archivedTags.filter((tag) => {
      const matchesSearch = tag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tag.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || tag.categoryId === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [archivedTags, searchQuery, categoryFilter]);

  // Get category by ID
  const getCategoryById = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId);
  };

  const handleAddTag = () => {
    setEditingTag(null);
    setIsModalOpen(true);
  };

  const handleEditTag = (tag: Tag) => {
    setEditingTag(tag);
    setIsModalOpen(true);
  };

  const handleSaveTag = (name: string, categoryId: string, description: string) => {
    if (editingTag) {
      updateTag(editingTag.id, name, categoryId, description);
    } else {
      addTag(name, categoryId, description);
    }
    setIsModalOpen(false);
    setEditingTag(null);
  };

  const handleArchiveTag = (tagId: string) => {
    archiveTag(tagId);
    setSelectedTags((prev) => {
      const next = new Set(prev);
      next.delete(tagId);
      return next;
    });
  };

  const handleUnarchiveTag = (tagId: string) => {
    unarchiveTag(tagId);
  };

  const handleDeleteTag = (tagId: string) => {
    if (window.confirm('Are you sure you want to permanently delete this tag? This action cannot be undone.')) {
      deleteTagPermanently(tagId);
    }
  };

  const toggleTagSelection = (tagId: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tagId)) {
        next.delete(tagId);
      } else {
        next.add(tagId);
      }
      return next;
    });
  };

  const toggleAllSelection = () => {
    if (selectedTags.size === filteredActiveTags.length) {
      setSelectedTags(new Set());
    } else {
      setSelectedTags(new Set(filteredActiveTags.map((t) => t.id)));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Tags management</h3>
        <p className="text-sm text-muted-foreground">
          Manage your custom tags. Archived tags remain attached to historical trades but won't appear in new selections.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px] bg-input border-border">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border z-50">
            <SelectItem value="all">All</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  {category.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative flex-1 min-w-[200px] max-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search Tags"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-input border-border"
          />
        </div>

        <Button onClick={handleAddTag} className="ml-auto">
          <Plus className="w-4 h-4 mr-2" />
          Add tag
        </Button>
      </div>

      {/* Active Tags Table */}
      {filteredActiveTags.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <TagIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No active tags found</p>
          {activeTags.length === 0 ? (
            <p className="text-sm mt-1">Create your first tag to get started</p>
          ) : (
            <p className="text-sm mt-1">Try adjusting your search or filter</p>
          )}
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={selectedTags.size === filteredActiveTags.length && filteredActiveTags.length > 0}
                    onCheckedChange={toggleAllSelection}
                  />
                </TableHead>
                <TableHead>Tag name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="w-[80px] text-center">Used</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-[60px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredActiveTags.map((tag) => {
                const category = getCategoryById(tag.categoryId);
                const usageCount = getTagUsageCount(tag.id, trades);

                return (
                  <TableRow key={tag.id} className="hover:bg-muted/20">
                    <TableCell>
                      <Checkbox
                        checked={selectedTags.has(tag.id)}
                        onCheckedChange={() => toggleTagSelection(tag.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{tag.name}</TableCell>
                    <TableCell>
                      {category ? (
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          <span>{category.name}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic">No category</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-muted-foreground">{usageCount}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground line-clamp-1">
                        {tag.description || '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover border-border z-50">
                          <DropdownMenuItem onClick={() => handleEditTag(tag)}>
                            <Edit2 className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleArchiveTag(tag.id)}>
                            <Archive className="w-4 h-4 mr-2" />
                            Archive
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Archived Tags Section */}
      {filteredArchivedTags.length > 0 && (
        <div className="mt-6">
          <Button
            variant="outline"
            onClick={() => setShowArchived(!showArchived)}
            className="w-full justify-between h-10 mb-2"
          >
            <div className="flex items-center gap-2">
              <Archive className="w-4 h-4" />
              <span>Archived Tags ({filteredArchivedTags.length})</span>
            </div>
            {showArchived ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
          
          {showArchived && (
            <div className="space-y-2 mt-2">
              <AnimatePresence>
                {filteredArchivedTags.map((tag) => {
                  const category = getCategoryById(tag.categoryId);
                  const usageCount = getTagUsageCount(tag.id, trades);
                  
                  return (
                    <motion.div
                      key={tag.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border/50"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <span className="font-medium text-muted-foreground">{tag.name}</span>
                        {category && (
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                            <span className="text-sm text-muted-foreground">{category.name}</span>
                          </div>
                        )}
                        <span className="text-sm text-muted-foreground">Used: {usageCount}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUnarchiveTag(tag.id)}
                          className="h-7 text-xs gap-1"
                          title="Unarchive tag"
                        >
                          <ArchiveRestore className="w-3 h-3" />
                          Unarchive
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteTag(tag.id)}
                          className="text-destructive hover:text-destructive h-7 text-xs gap-1"
                          title="Permanently delete"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* Tag Modal */}
      <TagModal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTag(null);
        }}
        onSave={handleSaveTag}
        tag={editingTag}
      />
    </div>
  );
};
