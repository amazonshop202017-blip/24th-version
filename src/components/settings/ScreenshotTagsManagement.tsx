import { useState } from 'react';
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { useScreenshotTagsContext, ScreenshotTag } from '@/contexts/ScreenshotTagsContext';
import { CategoryModal } from './CategoryModal';

export const ScreenshotTagsManagement = () => {
  const { screenshotTags, addScreenshotTag, removeScreenshotTag, updateScreenshotTag } = useScreenshotTagsContext();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('name-asc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingTag, setEditingTag] = useState<ScreenshotTag | null>(null);

  // Filter and sort tags
  const filteredTags = screenshotTags
    .filter(tag => 
      tag.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortOrder) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });

  const handleAddTag = () => {
    setModalMode('create');
    setEditingTag(null);
    setModalOpen(true);
  };

  const handleEditTag = (tag: ScreenshotTag) => {
    setModalMode('edit');
    setEditingTag(tag);
    setModalOpen(true);
  };

  const handleDeleteTag = (id: string) => {
    removeScreenshotTag(id);
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleSaveTag = (name: string, color: string) => {
    if (modalMode === 'create') {
      addScreenshotTag(name, color);
    } else if (editingTag) {
      updateScreenshotTag(editingTag.id, name, color);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredTags.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTags.map(t => t.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Screenshot Tags Management</h2>
        <p className="text-sm text-muted-foreground">
          Create tags for organizing and categorizing your trade screenshots
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={sortOrder} onValueChange={setSortOrder}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name-asc">Name A–Z</SelectItem>
            <SelectItem value="name-desc">Name Z–A</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search screenshot tags"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Button onClick={handleAddTag} className="ml-auto">
          <Plus className="w-4 h-4 mr-2" />
          Add Screenshot Tag
        </Button>
      </div>

      {/* Table */}
      {filteredTags.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Image className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="font-medium">No screenshot tags found</p>
          <p className="text-sm">
            {searchQuery 
              ? 'Try adjusting your search query'
              : 'Create your first screenshot tag to get started'
            }
          </p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedIds.size === filteredTags.length && filteredTags.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>Tag name</TableHead>
                <TableHead className="w-24">Color</TableHead>
                <TableHead className="w-16">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTags.map((tag) => (
                <TableRow key={tag.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(tag.id)}
                      onCheckedChange={() => toggleSelect(tag.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{tag.name}</TableCell>
                  <TableCell>
                    <div
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditTag(tag)}>
                          <Pencil className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteTag(tag.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Reuse CategoryModal for creating/editing */}
      <CategoryModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        mode={modalMode}
        initialName={editingTag?.name}
        initialColor={editingTag?.color}
        onSave={handleSaveTag}
      />
    </div>
  );
};
