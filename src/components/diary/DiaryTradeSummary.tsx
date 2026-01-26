import { useFilteredTradesContext } from '@/contexts/TradesContext';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { calculateTradeMetrics, Trade } from '@/types/trade';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { useTradeModal } from '@/contexts/TradeModalContext';

interface DiaryTradeSummaryProps {
  trade: Trade;
}

export const DiaryTradeSummary = ({ trade }: DiaryTradeSummaryProps) => {
  const { formatCurrency } = useGlobalFilters();
  const { openModal } = useTradeModal();
  
  const metrics = calculateTradeMetrics(trade);
  const netPnl = metrics.netPnl;
  const grossPnl = metrics.grossPnl;
  const volume = metrics.totalQuantity;
  const commissions = metrics.totalCharges;
  
  // Use saved return percent if available, otherwise calculate
  // This ensures accuracy by using the value stored at trade creation
  let netRoi: string;
  if (trade.savedReturnPercent !== undefined) {
    netRoi = trade.savedReturnPercent.toFixed(2);
  } else {
    // Fallback to calculated value
    netRoi = metrics.returnPercent.toFixed(2);
  }

  // Count CFDs traded (number of entry trades)
  const cfdsTraded = trade.scaleEntries?.length || 
    trade.entries.filter(e => 
      (trade.side === 'LONG' && e.type === 'BUY') || 
      (trade.side === 'SHORT' && e.type === 'SELL')
    ).length || 0;

  return (
    <div className="border border-border/50 rounded-lg p-4 bg-muted/20">
      <div className="flex items-center justify-between mb-4">
        <div className={`text-lg font-semibold ${netPnl >= 0 ? 'text-profit' : 'text-loss'}`}>
          Net P&L {netPnl >= 0 ? '' : '-'}${Math.abs(netPnl).toFixed(2)}
        </div>
        <Button
          variant="default"
          size="sm"
          className="gap-2"
          onClick={() => openModal(trade)}
        >
          View trade details
          <ExternalLink className="h-3 w-3" />
        </Button>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <div>
          <div className="text-xs text-muted-foreground mb-1">Cfds traded</div>
          <div className="text-sm font-medium">{cfdsTraded}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-1">Volume</div>
          <div className="text-sm font-medium">{volume}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-1">Commissions</div>
          <div className="text-sm font-medium">{formatCurrency(commissions)}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-1">Net ROI</div>
          <div className="text-sm font-medium">{netRoi}%</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-1">Gross P&L</div>
          <div className="text-sm font-medium">{formatCurrency(grossPnl)}</div>
        </div>
      </div>
    </div>
  );
};
