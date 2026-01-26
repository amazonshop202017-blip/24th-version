import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ChevronDown, Info } from 'lucide-react';
import { useFilteredTradesContext } from '@/contexts/TradesContext';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { calculateTradeMetrics, Trade } from '@/types/trade';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { WinsVsLossesChart } from './WinsVsLossesChart';

type PnLType = 'net' | 'gross';

interface GroupStats {
  totalPnL: number;
  avgDailyVolume: number;
  avgWinningTrade: number | null;
  avgLosingTrade: number | null;
  winningTradesCount: number;
  losingTradesCount: number;
  totalCommissions: number;
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
}

interface DailyPnLData {
  date: string;
  netPnl: number;
  cumulativePnl: number;
}

const WinsVsLosses = () => {
  const [pnlType, setPnlType] = useState<PnLType>('net');
  const { filteredTrades } = useFilteredTradesContext();
  const { formatCurrency, dateRange } = useGlobalFilters();

  // Classify trades based on selected P&L type
  const { winningTrades, losingTrades } = useMemo(() => {
    const tradesWithMetrics = filteredTrades.map(trade => ({
      trade,
      metrics: calculateTradeMetrics(trade),
    }));

    const getPnL = (metrics: ReturnType<typeof calculateTradeMetrics>) => {
      return pnlType === 'net' ? metrics.netPnl : metrics.grossPnl;
    };

    // Only consider closed trades
    const closedTrades = tradesWithMetrics.filter(
      ({ metrics }) => metrics.positionStatus === 'CLOSED'
    );

    // WIN: P&L > 0, LOSS: P&L < 0 (breakeven excluded)
    const winning = closedTrades.filter(({ metrics }) => getPnL(metrics) > 0);
    const losing = closedTrades.filter(({ metrics }) => getPnL(metrics) < 0);

    return { winningTrades: winning, losingTrades: losing };
  }, [filteredTrades, pnlType]);

  // Calculate stats for wins column
  const winsStats = useMemo((): GroupStats => {
    if (winningTrades.length === 0) {
      return {
        totalPnL: 0,
        avgDailyVolume: 0,
        avgWinningTrade: null,
        avgLosingTrade: null,
        winningTradesCount: 0,
        losingTradesCount: 0,
        totalCommissions: 0,
        maxConsecutiveWins: 0,
        maxConsecutiveLosses: 0,
      };
    }

    const getPnL = (metrics: ReturnType<typeof calculateTradeMetrics>) => {
      return pnlType === 'net' ? metrics.netPnl : metrics.grossPnl;
    };

    const totalPnL = winningTrades.reduce((sum, { metrics }) => sum + getPnL(metrics), 0);
    const totalCommissions = winningTrades.reduce((sum, { metrics }) => sum + metrics.totalCharges, 0);

    // Group by day for avg daily volume
    const daySet = new Set(
      winningTrades.map(({ metrics }) => metrics.closeDate?.split('T')[0]).filter(Boolean)
    );
    const avgDailyVolume = daySet.size > 0 ? winningTrades.length / daySet.size : 0;

    // Average winning trade (all are winners here)
    const avgWinningTrade = winningTrades.length > 0 ? totalPnL / winningTrades.length : null;

    // Max consecutive wins
    const sortedTrades = [...winningTrades].sort(
      (a, b) => new Date(a.metrics.closeDate).getTime() - new Date(b.metrics.closeDate).getTime()
    );

    let maxConsecutiveWins = 0;
    let currentStreak = 0;
    for (const { metrics } of sortedTrades) {
      if (getPnL(metrics) > 0) {
        currentStreak++;
        maxConsecutiveWins = Math.max(maxConsecutiveWins, currentStreak);
      } else {
        currentStreak = 0;
      }
    }

    return {
      totalPnL,
      avgDailyVolume,
      avgWinningTrade,
      avgLosingTrade: null, // N/A for wins column
      winningTradesCount: winningTrades.length,
      losingTradesCount: 0,
      totalCommissions,
      maxConsecutiveWins,
      maxConsecutiveLosses: 0,
    };
  }, [winningTrades, pnlType]);

  // Calculate stats for losses column
  const lossesStats = useMemo((): GroupStats => {
    if (losingTrades.length === 0) {
      return {
        totalPnL: 0,
        avgDailyVolume: 0,
        avgWinningTrade: null,
        avgLosingTrade: null,
        winningTradesCount: 0,
        losingTradesCount: 0,
        totalCommissions: 0,
        maxConsecutiveWins: 0,
        maxConsecutiveLosses: 0,
      };
    }

    const getPnL = (metrics: ReturnType<typeof calculateTradeMetrics>) => {
      return pnlType === 'net' ? metrics.netPnl : metrics.grossPnl;
    };

    const totalPnL = losingTrades.reduce((sum, { metrics }) => sum + getPnL(metrics), 0);
    const totalCommissions = losingTrades.reduce((sum, { metrics }) => sum + metrics.totalCharges, 0);

    // Group by day for avg daily volume
    const daySet = new Set(
      losingTrades.map(({ metrics }) => metrics.closeDate?.split('T')[0]).filter(Boolean)
    );
    const avgDailyVolume = daySet.size > 0 ? losingTrades.length / daySet.size : 0;

    // Average losing trade (all are losers here)
    const avgLosingTrade = losingTrades.length > 0 ? totalPnL / losingTrades.length : null;

    // Max consecutive losses
    const sortedTrades = [...losingTrades].sort(
      (a, b) => new Date(a.metrics.closeDate).getTime() - new Date(b.metrics.closeDate).getTime()
    );

    let maxConsecutiveLosses = 0;
    let currentStreak = 0;
    for (const { metrics } of sortedTrades) {
      if (getPnL(metrics) < 0) {
        currentStreak++;
        maxConsecutiveLosses = Math.max(maxConsecutiveLosses, currentStreak);
      } else {
        currentStreak = 0;
      }
    }

    return {
      totalPnL,
      avgDailyVolume,
      avgWinningTrade: null, // N/A for losses column
      avgLosingTrade,
      winningTradesCount: 0,
      losingTradesCount: losingTrades.length,
      totalCommissions,
      maxConsecutiveWins: 0,
      maxConsecutiveLosses,
    };
  }, [losingTrades, pnlType]);

  // Calculate daily cumulative P&L for wins
  const winsDailyData = useMemo((): DailyPnLData[] => {
    if (winningTrades.length === 0) return [];

    const getPnL = (metrics: ReturnType<typeof calculateTradeMetrics>) => {
      return pnlType === 'net' ? metrics.netPnl : metrics.grossPnl;
    };

    // Group by date
    const dailyPnL: Record<string, number> = {};
    for (const { metrics } of winningTrades) {
      if (!metrics.closeDate) continue;
      const dateKey = metrics.closeDate.split('T')[0];
      dailyPnL[dateKey] = (dailyPnL[dateKey] || 0) + getPnL(metrics);
    }

    // Sort and calculate cumulative
    const sortedDates = Object.keys(dailyPnL).sort();
    let cumulative = 0;

    return sortedDates.map(date => {
      cumulative += dailyPnL[date];
      return {
        date,
        netPnl: dailyPnL[date],
        cumulativePnl: cumulative,
      };
    });
  }, [winningTrades, pnlType]);

  // Calculate daily cumulative P&L for losses
  const lossesDailyData = useMemo((): DailyPnLData[] => {
    if (losingTrades.length === 0) return [];

    const getPnL = (metrics: ReturnType<typeof calculateTradeMetrics>) => {
      return pnlType === 'net' ? metrics.netPnl : metrics.grossPnl;
    };

    // Group by date
    const dailyPnL: Record<string, number> = {};
    for (const { metrics } of losingTrades) {
      if (!metrics.closeDate) continue;
      const dateKey = metrics.closeDate.split('T')[0];
      dailyPnL[dateKey] = (dailyPnL[dateKey] || 0) + getPnL(metrics);
    }

    // Sort and calculate cumulative
    const sortedDates = Object.keys(dailyPnL).sort();
    let cumulative = 0;

    return sortedDates.map(date => {
      cumulative += dailyPnL[date];
      return {
        date,
        netPnl: dailyPnL[date],
        cumulativePnl: cumulative,
      };
    });
  }, [losingTrades, pnlType]);

  const getDateLabel = () => {
    if (!dateRange.from && !dateRange.to) return 'ALL DATES';
    const from = dateRange.from ? format(dateRange.from, 'MM/dd/yy') : 'Start';
    const to = dateRange.to ? format(dateRange.to, 'MM/dd/yy') : 'Now';
    return `${from} - ${to}`;
  };

  const formatValue = (value: number | null): string => {
    if (value === null) return 'N/A';
    return formatCurrency(value, false);
  };

  return (
    <div className="space-y-6">
      {/* P&L Type Selector */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          P&L Showing
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              {pnlType === 'net' ? 'NET P&L' : 'GROSS P&L'}
              <ChevronDown className="w-3.5 h-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => setPnlType('net')}>
              Net P&L
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPnlType('gross')}>
              Gross P&L
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* WINS Column */}
        <div className="space-y-4">
          {/* Wins Header */}
          <div className="glass-card rounded-xl p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider">
              WINS ({winningTrades.length} Trades Matched)
            </h2>
          </div>

          {/* Wins Statistics */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-1">
              STATISTICS (WINS)
            </h3>
            <p className="text-xs text-muted-foreground mb-4">({getDateLabel()})</p>
            
            <div className="space-y-3">
              <StatRow label="Total P&L" value={formatValue(winsStats.totalPnL)} isPositive />
              <StatRow label="Average daily volume" value={winsStats.avgDailyVolume.toFixed(2)} />
              <StatRow label="Average winning trade" value={formatValue(winsStats.avgWinningTrade)} isPositive />
              <StatRow label="Average losing trade" value="N/A" />
              <StatRow label="Number of winning trades" value={winsStats.winningTradesCount.toString()} isPositive />
              <StatRow label="Number of losing trades" value="0" />
              <StatRow label="Total commissions" value={formatValue(winsStats.totalCommissions)} />
              <StatRow label="Max consecutive wins" value={winsStats.maxConsecutiveWins.toString()} />
            </div>
          </div>

          {/* Wins Cumulative Chart */}
          <WinsVsLossesChart
            data={winsDailyData}
            title="DAILY NET CUMULATIVE P&L (WINS)"
            dateLabel={getDateLabel()}
            variant="wins"
            formatCurrency={formatCurrency}
          />
        </div>

        {/* LOSSES Column */}
        <div className="space-y-4">
          {/* Losses Header */}
          <div className="glass-card rounded-xl p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider">
              LOSSES ({losingTrades.length} Trades Matched)
            </h2>
          </div>

          {/* Losses Statistics */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-1">
              STATISTICS (LOSSES)
            </h3>
            <p className="text-xs text-muted-foreground mb-4">({getDateLabel()})</p>
            
            <div className="space-y-3">
              <StatRow label="Total P&L" value={formatValue(lossesStats.totalPnL)} isNegative />
              <StatRow label="Average daily volume" value={lossesStats.avgDailyVolume.toFixed(2)} />
              <StatRow label="Average winning trade" value="N/A" />
              <StatRow label="Average losing trade" value={formatValue(lossesStats.avgLosingTrade)} isNegative />
              <StatRow label="Number of winning trades" value="0" />
              <StatRow label="Number of losing trades" value={lossesStats.losingTradesCount.toString()} isNegative />
              <StatRow label="Total commissions" value={formatValue(lossesStats.totalCommissions)} />
              <StatRow label="Max consecutive losses" value={lossesStats.maxConsecutiveLosses.toString()} />
            </div>
          </div>

          {/* Losses Cumulative Chart */}
          <WinsVsLossesChart
            data={lossesDailyData}
            title="DAILY NET CUMULATIVE P&L (LOSSES)"
            dateLabel={getDateLabel()}
            variant="losses"
            formatCurrency={formatCurrency}
          />
        </div>
      </div>
    </div>
  );
};

interface StatRowProps {
  label: string;
  value: string;
  isPositive?: boolean;
  isNegative?: boolean;
}

const StatRow = ({ label, value, isPositive, isNegative }: StatRowProps) => {
  const getTextColor = () => {
    if (isPositive) return 'text-emerald-500';
    if (isNegative) return 'text-red-500';
    return 'text-muted-foreground';
  };

  const getValueColor = () => {
    if (isPositive) return 'text-emerald-500';
    if (isNegative) return 'text-red-500';
    return 'text-foreground';
  };

  return (
    <div className="flex justify-between items-center py-1 border-b border-border/50 last:border-0">
      <span className={`text-sm ${getTextColor()}`}>{label}</span>
      <span className={`text-sm font-medium ${getValueColor()}`}>{value}</span>
    </div>
  );
};

export default WinsVsLosses;
