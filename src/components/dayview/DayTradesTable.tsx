import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Trade, calculateTradeMetrics } from '@/types/trade';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { useStrategiesContext } from '@/contexts/StrategiesContext';
import { useTagsContext } from '@/contexts/TagsContext';
import { useTradesContext } from '@/contexts/TradesContext';
import { useTradeModal } from '@/contexts/TradeModalContext';
import { AssignTagsModal } from '@/components/trades/AssignTagsModal';
import { parseISO, format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface DayTradesTableProps {
  trades: Trade[];
}

export const DayTradesTable = ({ trades }: DayTradesTableProps) => {
  const { formatCurrency } = useGlobalFilters();
  const { strategies } = useStrategiesContext();
  const { tags } = useTagsContext();
  const { updateTrade } = useTradesContext();
  const { openModal } = useTradeModal();

  // Tag assignment modal state
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [selectedTradeForTags, setSelectedTradeForTags] = useState<Trade | null>(null);

  // Sort trades by entry time (earliest first)
  const sortedTrades = [...trades].sort((a, b) => {
    const aMetrics = calculateTradeMetrics(a);
    const bMetrics = calculateTradeMetrics(b);
    const aTime = aMetrics.openDate ? parseISO(aMetrics.openDate).getTime() : 0;
    const bTime = bMetrics.openDate ? parseISO(bMetrics.openDate).getTime() : 0;
    return bTime - aTime; // Most recent first
  });

  const handleOpenTagModal = (e: React.MouseEvent, trade: Trade) => {
    e.stopPropagation(); // Prevent row click from triggering
    setSelectedTradeForTags(trade);
    setTagModalOpen(true);
  };

  const handleRowClick = (trade: Trade) => {
    openModal(trade);
  };

  const handleTagsChange = (tagIds: string[]) => {
    if (selectedTradeForTags) {
      updateTrade(selectedTradeForTags.id, {
        ...selectedTradeForTags,
        tags: tagIds,
      });
    }
  };

  const getStrategyName = (strategyId?: string) => {
    if (!strategyId) return '–';
    const strategy = strategies.find(s => s.id === strategyId);
    return strategy?.name || '–';
  };

  const getTradeTags = (trade: Trade) => {
    if (!trade.tags || trade.tags.length === 0) return [];
    return trade.tags.map(tagId => tags.find(t => t.id === tagId)).filter(Boolean);
  };

  return (
    <>
      <div className="border border-border rounded-lg overflow-hidden bg-card/50">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border">
              <TableHead className="text-muted-foreground font-medium">Open Time</TableHead>
              <TableHead className="text-muted-foreground font-medium">Ticker</TableHead>
              <TableHead className="text-muted-foreground font-medium">Side</TableHead>
              <TableHead className="text-muted-foreground font-medium">Net P&L</TableHead>
              <TableHead className="text-muted-foreground font-medium">Net ROI</TableHead>
              <TableHead className="text-muted-foreground font-medium">Realized R-Multiple</TableHead>
              <TableHead className="text-muted-foreground font-medium">Strategy</TableHead>
              <TableHead className="text-muted-foreground font-medium">Tags</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTrades.map(trade => {
              const metrics = calculateTradeMetrics(trade);
              const openTime = metrics.openDate
                ? format(parseISO(metrics.openDate), 'HH:mm:ss')
                : '–';
              const isProfit = metrics.netPnl >= 0;
              const tradeTags = getTradeTags(trade);

              return (
                <TableRow 
                  key={trade.id} 
                  className="border-border hover:bg-muted/30 cursor-pointer"
                  onClick={() => handleRowClick(trade)}
                >
                  <TableCell className="text-foreground">{openTime}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs">
                      {trade.symbol}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-foreground">{trade.side}</TableCell>
                  <TableCell className={cn(isProfit ? 'text-profit' : 'text-loss')}>
                    {formatCurrency(metrics.netPnl)}
                  </TableCell>
                  <TableCell className={cn(isProfit ? 'text-profit' : 'text-loss')}>
                    {trade.savedReturnPercent !== undefined
                      ? `${trade.savedReturnPercent.toFixed(2)}%`
                      : `${metrics.returnPercent.toFixed(2)}%`}
                  </TableCell>
                  <TableCell className="text-foreground">
                    {trade.savedRMultiple !== undefined
                      ? trade.savedRMultiple.toFixed(2)
                      : '–'}
                  </TableCell>
                  <TableCell>
                    {getStrategyName(trade.strategyId) !== '–' ? (
                      <Badge className="bg-primary/20 text-primary hover:bg-primary/30 border-0">
                        {getStrategyName(trade.strategyId)}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">–</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {tradeTags.slice(0, 2).map(tag => (
                        <Badge
                          key={tag!.id}
                          variant="outline"
                          className="text-xs"
                        >
                          {tag!.name}
                        </Badge>
                      ))}
                      {tradeTags.length > 2 && (
                        <span className="text-xs text-muted-foreground">
                          +{tradeTags.length - 2}
                        </span>
                      )}
                      <button
                        onClick={(e) => handleOpenTagModal(e, trade)}
                        className="p-1 rounded hover:bg-muted/50 transition-colors"
                        aria-label="Manage tags"
                      >
                        <Plus className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Tag Assignment Modal */}
      {selectedTradeForTags && (
        <AssignTagsModal
          isOpen={tagModalOpen}
          onClose={() => {
            setTagModalOpen(false);
            setSelectedTradeForTags(null);
          }}
          selectedTagIds={selectedTradeForTags.tags || []}
          onTagsChange={handleTagsChange}
          symbol={selectedTradeForTags.symbol}
          entryDate={calculateTradeMetrics(selectedTradeForTags).openDate}
        />
      )}
    </>
  );
};
