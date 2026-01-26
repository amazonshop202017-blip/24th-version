import { useState } from 'react';
import { Plus, Filter } from 'lucide-react';
import { useDiaryContext } from '@/contexts/DiaryContext';
import { useFilteredTrades } from '@/hooks/useFilteredTrades';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { calculateTradeMetrics, Trade } from '@/types/trade';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { SelectDayModal } from './SelectDayModal';

export const DiaryNotesList = () => {
  const { 
    selectedFolderId, 
    selectedNoteId, 
    setSelectedNoteId, 
    getNotesForFolder,
    createNote,
    linkNoteToDay,
    folders,
  } = useDiaryContext();
  const { trades } = useFilteredTradesContext();
  const { formatCurrency } = useGlobalFilters();

  const [isSelectDayModalOpen, setIsSelectDayModalOpen] = useState(false);

  const notes = getNotesForFolder(selectedFolderId);
  const currentFolder = folders.find(f => f.id === selectedFolderId);

  // Determine if "New note" button should be shown
  const canCreateNote = currentFolder?.type === 'trade' || currentFolder?.type === 'day';
  const isDayNotes = currentFolder?.type === 'day';
  const isTradeNotes = currentFolder?.type === 'trade';

  const handleNewNote = () => {
    if (isDayNotes) {
      // Open date selection modal for Day Notes
      setIsSelectDayModalOpen(true);
    } else if (isTradeNotes) {
      // Create a trade note (will need to be linked)
      // Use empty title - will be auto-named when linked to a trade
      createNote({
        title: '',
        content: '',
      });
    }
  };

  const handleDayNoteCreate = (dateStr: string) => {
    // Create a day note and link it to the selected date
    const formattedDate = format(new Date(dateStr), 'MMM dd, yyyy');
    const newNote = createNote({
      title: `Day Note : ${formattedDate}`,
      content: '',
      linkedDate: dateStr,
    });
  };

  // Get trade info for a note
  const getTradeInfo = (linkedTradeId: string | null) => {
    if (!linkedTradeId) return null;
    const trade = trades.find(t => t.id === linkedTradeId);
    if (!trade) return null;
    const metrics = calculateTradeMetrics(trade);
    return { trade, metrics };
  };

  // Get day P&L for day-linked notes
  const getDayPnl = (linkedDate: string | null) => {
    if (!linkedDate) return null;
    const dayTrades = trades.filter(t => {
      const tradeDate = t.entries[0]?.datetime;
      if (!tradeDate) return false;
      return format(new Date(tradeDate), 'yyyy-MM-dd') === linkedDate;
    });
    if (dayTrades.length === 0) return null;
    return dayTrades.reduce((sum, t) => sum + calculateTradeMetrics(t).netPnl, 0);
  };

  return (
    <div className="h-full flex flex-col border-r border-border/50 bg-card/20">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border/50">
        {canCreateNote ? (
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-primary hover:text-primary"
            onClick={handleNewNote}
          >
            <Plus className="h-4 w-4" />
            New note
          </Button>
        ) : (
          <div className="text-sm text-muted-foreground px-2">
            {currentFolder?.name || 'Notes'}
          </div>
        )}
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* Select All */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border/50">
        <Checkbox id="select-all" />
        <label htmlFor="select-all" className="text-sm text-muted-foreground">
          Select all
        </label>
      </div>

      {/* Notes List */}
      <ScrollArea className="flex-1">
        <div className="divide-y divide-border/30">
          {notes.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p className="text-sm">No notes yet</p>
              {canCreateNote && (
                <p className="text-xs mt-1">Click "New note" to create one</p>
              )}
            </div>
          ) : (
            notes.map(note => {
              const isSelected = selectedNoteId === note.id;
              const tradeInfo = getTradeInfo(note.linkedTradeId);
              
              // Use saved return percent if available, otherwise calculate
              let netPnl: number | undefined;
              if (note.linkedTradeId && tradeInfo) {
                netPnl = tradeInfo.metrics.netPnl;
              } else if (note.linkedDate) {
                netPnl = getDayPnl(note.linkedDate) ?? undefined;
              }

              return (
                <button
                  key={note.id}
                  onClick={() => setSelectedNoteId(note.id)}
                  className={cn(
                    "w-full text-left p-4 transition-colors",
                    isSelected 
                      ? "bg-primary/10" 
                      : "hover:bg-muted/30"
                  )}
                >
                  <div className="font-medium text-sm truncate">
                    {note.title}
                  </div>
                  {netPnl !== undefined && (
                    <div className={cn(
                      "text-sm font-medium mt-1",
                      netPnl >= 0 ? "text-profit" : "text-loss"
                    )}>
                      NET P&L: {netPnl >= 0 ? '' : '-'}${Math.abs(netPnl).toFixed(2)}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground mt-1">
                    {format(new Date(note.createdAt), 'MM/dd/yyyy')}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Select Day Modal for Day Notes */}
      <SelectDayModal
        open={isSelectDayModalOpen}
        onOpenChange={setIsSelectDayModalOpen}
        onConfirm={handleDayNoteCreate}
      />
    </div>
  );
};
