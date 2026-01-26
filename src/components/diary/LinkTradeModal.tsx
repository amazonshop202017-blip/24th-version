import { useState, useMemo } from 'react';
import { useFilteredTrades } from '@/hooks/useFilteredTrades';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { calculateTradeMetrics } from '@/types/trade';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Link as LinkIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface LinkTradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLink: (tradeId: string) => void;
}

export const LinkTradeModal = ({ open, onOpenChange, onLink }: LinkTradeModalProps) => {
  const { trades } = useFilteredTradesContext();
  const { formatCurrency } = useGlobalFilters();
  const [searchQuery, setSearchQuery] = useState('');

  // Sort trades by open date (newest first) and filter by search
  const filteredTrades = useMemo(() => {
    const tradesWithMetrics = trades.map(trade => ({
      trade,
      metrics: calculateTradeMetrics(trade),
    }));

    // Sort by open date descending
    tradesWithMetrics.sort((a, b) => {
      const aDate = a.metrics.openDate ? new Date(a.metrics.openDate).getTime() : 0;
      const bDate = b.metrics.openDate ? new Date(b.metrics.openDate).getTime() : 0;
      return bDate - aDate;
    });

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return tradesWithMetrics.filter(({ trade }) => 
        trade.symbol.toLowerCase().includes(query)
      );
    }

    return tradesWithMetrics;
  }, [trades, searchQuery]);

  const handleLink = (tradeId: string) => {
    onLink(tradeId);
    onOpenChange(false);
    setSearchQuery('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Recent trades</DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Trades Table */}
        <ScrollArea className="h-[400px] -mx-6">
          <div className="px-6">
            {/* Header */}
            <div className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-4 py-2 border-b border-border text-xs font-medium text-muted-foreground">
              <div>Open Date</div>
              <div>Open Time</div>
              <div>Symbol</div>
              <div>Net P&L</div>
              <div className="w-10"></div>
            </div>

            {/* Rows */}
            {filteredTrades.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No trades found
              </div>
            ) : (
              filteredTrades.map(({ trade, metrics }) => {
                const openDate = metrics.openDate 
                  ? format(new Date(metrics.openDate), 'MM/dd/yyyy')
                  : '-';
                const openTime = metrics.openDate 
                  ? format(new Date(metrics.openDate), 'HH:mm:ss')
                  : '-';
                const netPnl = metrics.netPnl;

                return (
                  <div
                    key={trade.id}
                    className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-4 py-3 border-b border-border/50 items-center hover:bg-muted/30 transition-colors"
                  >
                    <div className="text-sm">{openDate}</div>
                    <div className="text-sm text-muted-foreground">{openTime}</div>
                    <div className="text-sm font-medium">{trade.symbol}</div>
                    <div className={cn(
                      "text-sm font-medium",
                      netPnl >= 0 ? "text-profit" : "text-loss"
                    )}>
                      {netPnl >= 0 ? '' : '-'}${Math.abs(netPnl).toFixed(2)}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleLink(trade.id)}
                    >
                      <LinkIcon className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
