import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface StrategyChecklistEditorProps {
  isOpen: boolean;
  onClose: () => void;
  strategyName: string;
  checklistItems: string[];
  onSave: (items: string[]) => void;
}

export const StrategyChecklistEditor = ({
  isOpen,
  onClose,
  strategyName,
  checklistItems,
  onSave,
}: StrategyChecklistEditorProps) => {
  const [items, setItems] = useState<string[]>(checklistItems);
  const [newItem, setNewItem] = useState('');

  const handleAddItem = () => {
    const trimmed = newItem.trim();
    if (trimmed && !items.includes(trimmed)) {
      setItems([...items, trimmed]);
      setNewItem('');
    }
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddItem();
    }
  };

  const handleSave = () => {
    onSave(items);
    onClose();
  };

  const handleCancel = () => {
    setItems(checklistItems);
    setNewItem('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Checklist - {strategyName}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Add new item */}
          <div className="flex gap-2">
            <Input
              placeholder="Add checklist item..."
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1"
            />
            <Button 
              size="icon" 
              onClick={handleAddItem}
              disabled={!newItem.trim()}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Items list */}
          <div className="min-h-[120px] max-h-[240px] overflow-y-auto">
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No checklist items yet. Add items above.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {items.map((item, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="pl-3 pr-1 py-1.5 flex items-center gap-1.5"
                  >
                    <span className="text-sm">{item}</span>
                    <button
                      onClick={() => handleRemoveItem(index)}
                      className="p-0.5 rounded hover:bg-muted/80 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Checklist
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
