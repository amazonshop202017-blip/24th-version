import { useState, useEffect, useMemo } from 'react';
import { useDiaryContext } from '@/contexts/DiaryContext';
import { useFilteredTradesContext } from '@/contexts/TradesContext';
import { calculateTradeMetrics } from '@/types/trade';
import { RichTextEditor } from './RichTextEditor';
import { DiaryTradeSummary } from './DiaryTradeSummary';
import { LinkTradeModal } from './LinkTradeModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { FileText, MoreHorizontal, Share2, Link as LinkIcon, Trash2, Unlink } from 'lucide-react';
import { format } from 'date-fns';

export const DiaryNoteEditor = () => {
  const {
    getSelectedNote,
    updateNote,
    deleteNote,
    linkNoteToTrade,
    unlinkNoteFromTrade,
    selectedFolderId,
    folders,
  } = useDiaryContext();
  const { trades } = useFilteredTradesContext();
  
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [localTitle, setLocalTitle] = useState('');
  const [localContent, setLocalContent] = useState('');

  const selectedNote = getSelectedNote();
  const currentFolder = folders.find(f => f.id === selectedFolderId);
  const isDayNote = selectedNote?.linkedDate !== null;
  const isTradeNote = selectedNote?.linkedTradeId !== null;

  // Get linked trade if any
  const linkedTrade = useMemo(() => {
    if (!selectedNote?.linkedTradeId) return null;
    return trades.find(t => t.id === selectedNote.linkedTradeId);
  }, [selectedNote?.linkedTradeId, trades]);

  // Sync local state when selected note changes
  useEffect(() => {
    if (selectedNote) {
      setLocalTitle(selectedNote.title);
      setLocalContent(selectedNote.content);
    } else {
      setLocalTitle('');
      setLocalContent('');
    }
  }, [selectedNote?.id]);

  // Debounced save for title
  useEffect(() => {
    if (!selectedNote || localTitle === selectedNote.title) return;
    
    const timeout = setTimeout(() => {
      updateNote(selectedNote.id, { title: localTitle });
    }, 500);

    return () => clearTimeout(timeout);
  }, [localTitle, selectedNote, updateNote]);

  // Debounced save for content
  useEffect(() => {
    if (!selectedNote || localContent === selectedNote.content) return;
    
    const timeout = setTimeout(() => {
      updateNote(selectedNote.id, { content: localContent });
    }, 500);

    return () => clearTimeout(timeout);
  }, [localContent, selectedNote, updateNote]);

  const handleLinkTrade = (tradeId: string) => {
    if (selectedNote) {
      linkNoteToTrade(selectedNote.id, tradeId);
    }
  };

  const handleUnlinkTrade = () => {
    if (selectedNote) {
      unlinkNoteFromTrade(selectedNote.id);
    }
  };

  const handleDeleteNote = () => {
    if (selectedNote && window.confirm('Are you sure you want to delete this note?')) {
      deleteNote(selectedNote.id);
    }
  };

  // Empty state
  if (!selectedNote) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
        <FileText className="h-12 w-12 mb-4 opacity-50" />
        <p>Select a note or create a new one</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b border-border/50">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <Input
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
              className="text-xl font-semibold border-0 p-0 h-auto focus-visible:ring-0 bg-transparent"
              placeholder="Note Title"
            />
          </div>
          <div className="text-xs text-muted-foreground mt-1 ml-7">
            Created: {format(new Date(selectedNote.createdAt), "MMM dd, yyyy hh:mma")}
            {selectedNote.updatedAt !== selectedNote.createdAt && (
              <> · Last updated: {format(new Date(selectedNote.updatedAt), "MMM dd, yyyy hh:mma")}</>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Share2 className="h-4 w-4" />
            Share
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover z-50">
              {/* Show Link/Unlink options only for non-Day notes */}
              {!isDayNote && (
                <>
                  {isTradeNote ? (
                    <DropdownMenuItem onClick={handleUnlinkTrade}>
                      <Unlink className="h-4 w-4 mr-2" />
                      Unlink from trade
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => setIsLinkModalOpen(true)}>
                      <LinkIcon className="h-4 w-4 mr-2" />
                      Link to trade
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem 
                onClick={handleDeleteNote}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete note
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Trade Summary (if linked) */}
      {linkedTrade && (
        <div className="p-4 border-b border-border/50">
          <DiaryTradeSummary trade={linkedTrade} />
        </div>
      )}

      {/* Editor */}
      <div className="flex-1 overflow-y-auto p-4">
        <RichTextEditor
          content={localContent}
          onChange={setLocalContent}
          placeholder="Write something, or press '/' for commands"
        />
      </div>

      {/* Link Trade Modal */}
      <LinkTradeModal
        open={isLinkModalOpen}
        onOpenChange={setIsLinkModalOpen}
        onLink={handleLinkTrade}
      />
    </div>
  );
};
