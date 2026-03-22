import { useMemo } from 'react';
import { format, startOfDay, endOfDay } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus } from 'lucide-react';
import { Trade, calculateTradeMetrics } from '@/types/trade';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { usePrivacyMode } from '@/hooks/usePrivacyMode';
import { useDiaryContext } from '@/contexts/DiaryContext';
import { useTradeModal } from '@/contexts/TradeModalContext';
import { IntradayPnLChart } from './IntradayPnLChart';
import { DayTradesTable } from './DayTradesTable';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface DayDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  trades: Trade[];
}

export const DayDetailsModal = ({ isOpen, onClose, date, trades }: DayDetailsModalProps) => {
  const navigate = useNavigate();
  const { formatCurrency, setDateRange, setDatePreset } = useGlobalFilters();
  const { isPrivacyMode, maskCurrency, maskProfitFactor } = usePrivacyMode();
  const { createNote, setSelectedFolderId, setSelectedNoteId } = useDiaryContext();
  const { openModalWithDate } = useTradeModal();

  // Calculate day stats
  const dayStats = useMemo(() => {
    return trades.reduce(
      (acc, trade) => {
        const metrics = calculateTradeMetrics(trade);
        
        acc.netPnl += metrics.netPnl;
        acc.grossPnl += metrics.grossPnl;
        acc.totalTrades += 1;
        acc.totalQuantity += metrics.totalQuantity;
        acc.totalCommissions += metrics.totalCharges;
        acc.totalDurationMinutes += metrics.durationMinutes;
        
        if (metrics.netPnl > 0) {
          acc.winners += 1;
          acc.totalWins += metrics.netPnl;
        } else if (metrics.netPnl < 0) {
          acc.losers += 1;
          acc.totalLosses += Math.abs(metrics.netPnl);
        } else {
          acc.breakeven += 1;
        }
        
        return acc;
      },
      {
        netPnl: 0,
        grossPnl: 0,
        totalTrades: 0,
        winners: 0,
        losers: 0,
        breakeven: 0,
        totalQuantity: 0,
        totalCommissions: 0,
        totalWins: 0,
        totalLosses: 0,
        totalDurationMinutes: 0,
      }
    );
  }, [trades]);

  // Win rate calculation: Wins / (Wins + Losses)
  const winsAndLosses = dayStats.winners + dayStats.losers;
  const winRate = winsAndLosses > 0 ? (dayStats.winners / winsAndLosses) * 100 : 0;

  // Avg Duration calculation
  const avgDurationMinutes = dayStats.totalTrades > 0
    ? dayStats.totalDurationMinutes / dayStats.totalTrades
    : 0;

  const formatDuration = (minutes: number) => {
    if (minutes < 1) return '< 1m';
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours < 24) return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    return remHours > 0 ? `${days}d ${remHours}h` : `${days}d`;
  };

  const isProfit = dayStats.netPnl >= 0;
  const formattedDate = format(date, 'EEE, MMM dd, yyyy');

  const handleAddTrade = () => {
    // Build a datetime string for the clicked date with current time
    const now = new Date();
    const entryDate = new Date(date);
    entryDate.setHours(now.getHours(), now.getMinutes(), 0, 0);
    const entryDateStr = entryDate.toISOString().slice(0, 16);
    onClose();
    openModalWithDate(entryDateStr);
  };

  const handleAddNote = () => {
    const dayTitle = format(date, 'MMM dd, yyyy');
    const dayDateStr = format(date, 'yyyy-MM-dd');
    const newNote = createNote({
      title: `Day Note: ${dayTitle}`,
      linkedDate: dayDateStr,
    });
    
    setSelectedFolderId('day-notes');
    setSelectedNoteId(newNote.id);
    onClose();
    navigate('/diary');
  };

  const handleViewDetails = () => {
    setDatePreset('custom');
    setDateRange({
      from: startOfDay(date),
      to: endOfDay(date),
    });
    onClose();
    navigate('/day-view');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-auto p-4 sm:p-6">
        <DialogHeader className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0 pb-3 sm:pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
            <DialogTitle className="text-base sm:text-lg font-semibold">{formattedDate}</DialogTitle>
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-muted-foreground">•</span>
              <span className={cn('text-sm sm:text-base font-semibold', isPrivacyMode ? 'text-foreground' : isProfit ? 'text-profit' : 'text-loss')}>
                Net P&L {maskCurrency(dayStats.netPnl, formatCurrency)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs sm:text-sm"
              onClick={handleAddTrade}
            >
              <Plus className="w-3.5 h-3.5" />
              Add Trade
            </Button>
            <Button
              variant="default"
              size="sm"
              className="gap-1.5 text-xs sm:text-sm"
              onClick={handleAddNote}
            >
              <FileText className="w-3.5 h-3.5" />
              Add note
            </Button>
          </div>
        </DialogHeader>

        {/* Main Content */}
        <div className="space-y-4 sm:space-y-5">
          {trades.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 sm:h-40 border border-dashed border-border rounded-xl gap-3">
              <p className="text-muted-foreground text-sm">No trades on this day</p>
              <Button
                variant="default"
                size="sm"
                className="gap-2"
                onClick={handleAddTrade}
              >
                <Plus className="w-4 h-4" />
                Add Trade
              </Button>
            </div>
          ) : (
            <>
              {/* Chart and Metrics - stack on mobile */}
              <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                {/* Chart Section */}
                <div className="w-full md:w-[300px] h-[120px] md:h-[140px] flex-shrink-0">
                  <IntradayPnLChart trades={trades} />
                </div>

                {/* Metrics Section */}
                <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-3 sm:gap-y-4">
                  <div>
                    <p className="text-[11px] sm:text-xs text-muted-foreground mb-0.5">Total Trades</p>
                    <p className="text-base sm:text-lg font-semibold text-foreground">{dayStats.totalTrades}</p>
                  </div>
                  <div>
                    <p className="text-[11px] sm:text-xs text-muted-foreground mb-0.5">Winners</p>
                    <p className="text-base sm:text-lg font-semibold text-foreground">{dayStats.winners}</p>
                  </div>
                  <div>
                    <p className="text-[11px] sm:text-xs text-muted-foreground mb-0.5">Gross P&L</p>
                    <p className={cn('text-base sm:text-lg font-semibold', isPrivacyMode ? 'text-foreground' : isProfit ? 'text-profit' : 'text-loss')}>
                      {maskCurrency(dayStats.grossPnl, formatCurrency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] sm:text-xs text-muted-foreground mb-0.5">Commissions</p>
                    <p className="text-base sm:text-lg font-semibold text-foreground">
                      {maskCurrency(dayStats.totalCommissions, (v) => formatCurrency(v, false))}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] sm:text-xs text-muted-foreground mb-0.5">Winrate</p>
                    <p className="text-base sm:text-lg font-semibold text-foreground">{winRate.toFixed(0)}%</p>
                  </div>
                  <div>
                    <p className="text-[11px] sm:text-xs text-muted-foreground mb-0.5">Losers</p>
                    <p className="text-base sm:text-lg font-semibold text-foreground">{dayStats.losers}</p>
                  </div>
                  <div>
                    <p className="text-[11px] sm:text-xs text-muted-foreground mb-0.5">Volume</p>
                    <p className="text-base sm:text-lg font-semibold text-foreground">{dayStats.totalQuantity.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] sm:text-xs text-muted-foreground mb-0.5">Avg Duration</p>
                    <p className="text-base sm:text-lg font-semibold text-foreground">
                      {formatDuration(avgDurationMinutes)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Trades Table */}
              <div className="pt-3 sm:pt-4 border-t border-border overflow-x-auto">
                <DayTradesTable trades={trades} />
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-border">
          <Button variant="outline" size="sm" className="sm:size-default" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" className="sm:size-default" onClick={handleViewDetails}>
            View Details
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};