import { useState } from 'react';
import { Plus, Archive, ArchiveRestore, Trash2, ChevronDown, ChevronUp, MessageSquare, LogIn, Settings2, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCustomStats, CommentOption } from '@/contexts/CustomStatsContext';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface CommentSectionProps {
  title: string;
  description: string;
  icon: React.ElementType;
  comments: CommentOption[];
  onAdd: (value: string) => void;
  onArchive: (value: string) => void;
  onUnarchive: (value: string) => void;
  onDelete: (value: string) => void;
}

const CommentSection = ({ 
  title, 
  description, 
  icon: Icon, 
  comments, 
  onAdd, 
  onArchive, 
  onUnarchive, 
  onDelete 
}: CommentSectionProps) => {
  const [newValue, setNewValue] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  const activeComments = comments.filter(c => !c.archived);
  const archivedComments = comments.filter(c => c.archived);

  const handleAdd = () => {
    if (newValue.trim()) {
      onAdd(newValue.trim());
      setNewValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAdd();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      {/* Add new comment */}
      <div className="flex gap-3">
        <Input
          placeholder="Add new option..."
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="bg-input border-border flex-1"
        />
        <Button onClick={handleAdd} disabled={!newValue.trim()}>
          <Plus className="w-4 h-4 mr-2" />
          Add
        </Button>
      </div>

      {/* Active comments list */}
      {activeComments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No active options</p>
          <p className="text-xs">Add your first option above</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {activeComments.map((comment) => (
              <motion.div
                key={comment.value}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center justify-between p-3 bg-input rounded-lg border border-border"
              >
                <span className="font-medium">{comment.value}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onArchive(comment.value)}
                  className="text-muted-foreground hover:text-foreground"
                  title="Archive option"
                >
                  <Archive className="w-4 h-4" />
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Archived comments section */}
      {archivedComments.length > 0 && (
        <div className="mt-4">
          <Button
            variant="outline"
            onClick={() => setShowArchived(!showArchived)}
            className="w-full justify-between h-10"
          >
            <div className="flex items-center gap-2">
              <Archive className="w-4 h-4" />
              <span>Archived ({archivedComments.length})</span>
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
                {archivedComments.map((comment) => (
                  <motion.div
                    key={comment.value}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50"
                  >
                    <span className="font-medium text-muted-foreground">{comment.value}</span>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onUnarchive(comment.value)}
                        className="h-7 text-xs gap-1"
                        title="Unarchive option"
                      >
                        <ArchiveRestore className="w-3 h-3" />
                        Unarchive
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to permanently delete "${comment.value}"? This action cannot be undone.`)) {
                            onDelete(comment.value);
                          }
                        }}
                        className="text-destructive hover:text-destructive h-7 text-xs gap-1"
                        title="Permanently delete"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const TradeCommentsManagement = () => {
  const { 
    options,
    addEntryComment,
    archiveEntryComment,
    unarchiveEntryComment,
    deleteEntryComment,
    addTradeManagement,
    archiveTradeManagement,
    unarchiveTradeManagement,
    deleteTradeManagement,
    addExitComment,
    archiveExitComment,
    unarchiveExitComment,
    deleteExitComment,
  } = useCustomStats();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Trade Comments Management</h2>
        <p className="text-sm text-muted-foreground">
          Manage predefined comment options that appear in the trade popup dropdowns. Archived options remain attached to historical trades but won't appear in new selections.
        </p>
      </div>

      {/* Entry Comments */}
      <div className="glass-card rounded-2xl p-6">
        <CommentSection
          title="Entry Comments"
          description="Options for describing how you entered the trade"
          icon={LogIn}
          comments={options.entryComments}
          onAdd={addEntryComment}
          onArchive={archiveEntryComment}
          onUnarchive={unarchiveEntryComment}
          onDelete={deleteEntryComment}
        />
      </div>

      {/* Trade Management */}
      <div className="glass-card rounded-2xl p-6">
        <CommentSection
          title="Trade Management"
          description="Options for describing how you managed the trade"
          icon={Settings2}
          comments={options.tradeManagements}
          onAdd={addTradeManagement}
          onArchive={archiveTradeManagement}
          onUnarchive={unarchiveTradeManagement}
          onDelete={deleteTradeManagement}
        />
      </div>

      {/* Exit Comments */}
      <div className="glass-card rounded-2xl p-6">
        <CommentSection
          title="Exit Comments"
          description="Options for describing how you exited the trade"
          icon={LogOut}
          comments={options.exitComments}
          onAdd={addExitComment}
          onArchive={archiveExitComment}
          onUnarchive={unarchiveExitComment}
          onDelete={deleteExitComment}
        />
      </div>
    </div>
  );
};
