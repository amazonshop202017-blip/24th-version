import { useMemo } from 'react';
import { useFilteredTrades } from '@/hooks/useFilteredTrades';
import { calculateTradeMetrics } from '@/types/trade';
import { format, parseISO } from 'date-fns';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';

interface StreakData {
  currentStreak: number;
  currentStreakType: 'win' | 'loss' | 'none';
  bestWinStreak: number;
  worstLossStreak: number;
}

export const CurrentStreakMetric = () => {
  const { filteredTrades } = useFilteredTrades();
  const { classifyTradeOutcome } = useGlobalFilters();

  const { dayStreaks, tradeStreaks } = useMemo(() => {
    // Calculate trade streaks
    const sortedTrades = [...filteredTrades]
      .filter(t => calculateTradeMetrics(t).positionStatus === 'CLOSED')
      .sort((a, b) => {
        const aDate = calculateTradeMetrics(a).closeDate || '';
        const bDate = calculateTradeMetrics(b).closeDate || '';
        return aDate.localeCompare(bDate);
      });

    let tradeCurrentStreak = 0;
    let tradeCurrentType: 'win' | 'loss' | 'none' = 'none';
    let tradeBestWin = 0;
    let tradeWorstLoss = 0;
    let tempWinStreak = 0;
    let tempLossStreak = 0;

    sortedTrades.forEach(trade => {
      const metrics = calculateTradeMetrics(trade);
      const outcome = classifyTradeOutcome(
        metrics.netPnl,
        trade.savedReturnPercent ?? metrics.returnPercent,
        trade.breakEven
      );

      if (outcome === 'win') {
        tempWinStreak++;
        tempLossStreak = 0;
        tradeBestWin = Math.max(tradeBestWin, tempWinStreak);
        tradeCurrentStreak = tempWinStreak;
        tradeCurrentType = 'win';
      } else if (outcome === 'loss') {
        tempLossStreak++;
        tempWinStreak = 0;
        tradeWorstLoss = Math.max(tradeWorstLoss, tempLossStreak);
        tradeCurrentStreak = tempLossStreak;
        tradeCurrentType = 'loss';
      } else {
        // Breakeven doesn't break streak but doesn't add to it
      }
    });

    // Calculate day streaks
    const dailyPnL = new Map<string, number>();
    filteredTrades.forEach(trade => {
      const metrics = calculateTradeMetrics(trade);
      if (metrics.openDate) {
        const dateKey = format(parseISO(metrics.openDate), 'yyyy-MM-dd');
        dailyPnL.set(dateKey, (dailyPnL.get(dateKey) || 0) + metrics.netPnl);
      }
    });

    const sortedDays = Array.from(dailyPnL.entries()).sort((a, b) => a[0].localeCompare(b[0]));

    let dayCurrentStreak = 0;
    let dayCurrentType: 'win' | 'loss' | 'none' = 'none';
    let dayBestWin = 0;
    let dayWorstLoss = 0;
    let dayTempWinStreak = 0;
    let dayTempLossStreak = 0;

    sortedDays.forEach(([_, pnl]) => {
      if (pnl > 0) {
        dayTempWinStreak++;
        dayTempLossStreak = 0;
        dayBestWin = Math.max(dayBestWin, dayTempWinStreak);
        dayCurrentStreak = dayTempWinStreak;
        dayCurrentType = 'win';
      } else if (pnl < 0) {
        dayTempLossStreak++;
        dayTempWinStreak = 0;
        dayWorstLoss = Math.max(dayWorstLoss, dayTempLossStreak);
        dayCurrentStreak = dayTempLossStreak;
        dayCurrentType = 'loss';
      }
    });

    return {
      dayStreaks: {
        currentStreak: dayCurrentStreak,
        currentStreakType: dayCurrentType,
        bestWinStreak: dayBestWin,
        worstLossStreak: dayWorstLoss,
      } as StreakData,
      tradeStreaks: {
        currentStreak: tradeCurrentStreak,
        currentStreakType: tradeCurrentType,
        bestWinStreak: tradeBestWin,
        worstLossStreak: tradeWorstLoss,
      } as StreakData,
    };
  }, [filteredTrades, classifyTradeOutcome]);

  const StreakCircle = ({ value, type }: { value: number; type: 'win' | 'loss' | 'none' }) => {
    const color = type === 'win' ? 'stroke-profit' : type === 'loss' ? 'stroke-loss' : 'stroke-muted';
    const textColor = type === 'win' ? 'text-profit' : type === 'loss' ? 'text-loss' : 'text-muted-foreground';
    
    return (
      <div className="relative w-10 h-10">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
          <circle
            cx="18"
            cy="18"
            r="15"
            fill="none"
            className="stroke-muted/30"
            strokeWidth="3"
          />
          <circle
            cx="18"
            cy="18"
            r="15"
            fill="none"
            className={color}
            strokeWidth="3"
            strokeDasharray={`${Math.min(value * 10, 94)} 94`}
            strokeLinecap="round"
          />
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${textColor}`}>
          {value}
        </span>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-xs text-muted-foreground">Current streak</span>
      </div>
      
      <div className="flex-1 grid grid-cols-2 gap-3">
        {/* Days Column */}
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Days</span>
          <div className="flex gap-1 mb-1">
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-profit/20 text-profit font-medium">
              {dayStreaks.bestWinStreak} days
            </span>
          </div>
          <StreakCircle value={dayStreaks.currentStreak} type={dayStreaks.currentStreakType} />
          <div className="flex gap-1 mt-1">
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-loss/20 text-loss font-medium">
              {dayStreaks.worstLossStreak} days
            </span>
          </div>
        </div>

        {/* Trades Column */}
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Trades</span>
          <div className="flex gap-1 mb-1">
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-profit/20 text-profit font-medium">
              {tradeStreaks.bestWinStreak} trades
            </span>
          </div>
          <StreakCircle value={tradeStreaks.currentStreak} type={tradeStreaks.currentStreakType} />
          <div className="flex gap-1 mt-1">
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-loss/20 text-loss font-medium">
              {tradeStreaks.worstLossStreak} trades
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
