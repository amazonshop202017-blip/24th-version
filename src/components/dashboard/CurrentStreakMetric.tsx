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
      <div className="relative w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
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
        <span className={`absolute inset-0 flex items-center justify-center text-xs sm:text-sm font-bold ${textColor}`}>
          {value}
        </span>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-1.5 mb-2 sm:mb-3">
        <span className="text-xs text-muted-foreground">Current streak</span>
        <span className="text-muted-foreground/50 cursor-help" title="Shows current, best, and worst streaks">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.5"/><text x="8" y="12" textAnchor="middle" fontSize="10" fill="currentColor">i</text></svg>
        </span>
      </div>
      
      <div className="flex-1 grid grid-cols-2 gap-2 sm:gap-4">
        {/* Days Column */}
        <div className="flex flex-col items-center gap-0.5 sm:gap-1 min-w-0">
          <span className="text-[9px] sm:text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Days</span>
          <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1">
            <StreakCircle value={dayStreaks.currentStreak} type={dayStreaks.currentStreakType} />
            <div className="flex flex-col gap-0.5 sm:gap-1 min-w-0">
              <span className="text-[8px] sm:text-[9px] px-1 sm:px-1.5 py-0.5 rounded-full bg-profit/15 text-profit font-medium whitespace-nowrap truncate">
                {dayStreaks.bestWinStreak} {dayStreaks.bestWinStreak === 1 ? 'day' : 'days'}
              </span>
              <span className="text-[8px] sm:text-[9px] px-1 sm:px-1.5 py-0.5 rounded-full bg-loss/15 text-loss font-medium whitespace-nowrap truncate">
                {dayStreaks.worstLossStreak} {dayStreaks.worstLossStreak === 1 ? 'day' : 'days'}
              </span>
            </div>
          </div>
        </div>

        {/* Trades Column */}
        <div className="flex flex-col items-center gap-0.5 sm:gap-1 min-w-0">
          <span className="text-[9px] sm:text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Trades</span>
          <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1">
            <StreakCircle value={tradeStreaks.currentStreak} type={tradeStreaks.currentStreakType} />
            <div className="flex flex-col gap-0.5 sm:gap-1 min-w-0">
              <span className="text-[8px] sm:text-[9px] px-1 sm:px-1.5 py-0.5 rounded-full bg-profit/15 text-profit font-medium whitespace-nowrap truncate">
                {tradeStreaks.bestWinStreak} {tradeStreaks.bestWinStreak === 1 ? 'trade' : 'trades'}
              </span>
              <span className="text-[8px] sm:text-[9px] px-1 sm:px-1.5 py-0.5 rounded-full bg-loss/15 text-loss font-medium whitespace-nowrap truncate">
                {tradeStreaks.worstLossStreak} {tradeStreaks.worstLossStreak === 1 ? 'trade' : 'trades'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
