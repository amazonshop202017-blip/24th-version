import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ChevronDown, Info } from 'lucide-react';
import { useFilteredTradesContext } from '@/contexts/TradesContext';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { calculateTradeMetrics } from '@/types/trade';
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

type PnLType = 'net' | 'gross';

const OverviewStats = () => {
  const [pnlType, setPnlType] = useState<PnLType>('net');
  const { filteredTrades } = useFilteredTradesContext();
  const { formatCurrency, dateRange } = useGlobalFilters();

  const stats = useMemo(() => {
    const tradesWithMetrics = filteredTrades.map(trade => ({
      trade,
      metrics: calculateTradeMetrics(trade),
    }));

    // Get P&L based on type
    const getPnL = (metrics: ReturnType<typeof calculateTradeMetrics>) => {
      return pnlType === 'net' ? metrics.netPnl : metrics.grossPnl;
    };

    // Group by day
    const dayMap = new Map<string, { pnl: number; trades: typeof tradesWithMetrics }>();
    tradesWithMetrics.forEach(({ trade, metrics }) => {
      const closeDate = metrics.closeDate ? metrics.closeDate.split('T')[0] : null;
      if (closeDate) {
        const existing = dayMap.get(closeDate) || { pnl: 0, trades: [] };
        existing.pnl += getPnL(metrics);
        existing.trades.push({ trade, metrics });
        dayMap.set(closeDate, existing);
      }
    });

    // Group by month
    const monthMap = new Map<string, number>();
    tradesWithMetrics.forEach(({ metrics }) => {
      const closeDate = metrics.closeDate;
      if (closeDate) {
        const month = closeDate.slice(0, 7); // YYYY-MM
        monthMap.set(month, (monthMap.get(month) || 0) + getPnL(metrics));
      }
    });

    // Categorize trades
    const closedTrades = tradesWithMetrics.filter(({ metrics }) => metrics.positionStatus === 'CLOSED');
    const openTrades = tradesWithMetrics.filter(({ metrics }) => metrics.positionStatus === 'OPEN');
    const winningTrades = closedTrades.filter(({ metrics }) => getPnL(metrics) > 0);
    const losingTrades = closedTrades.filter(({ metrics }) => getPnL(metrics) < 0);
    const breakevenTrades = closedTrades.filter(({ metrics }) => getPnL(metrics) === 0);

    // Calculate totals
    const totalPnL = closedTrades.reduce((sum, { metrics }) => sum + getPnL(metrics), 0);
    const totalCharges = closedTrades.reduce((sum, { metrics }) => sum + metrics.totalCharges, 0);
    const totalFees = 0; // Structure for future
    const totalSwap = 0; // Structure for future

    // Win/loss stats
    const avgWinner = winningTrades.length > 0
      ? winningTrades.reduce((sum, { metrics }) => sum + getPnL(metrics), 0) / winningTrades.length
      : 0;
    const avgLoser = losingTrades.length > 0
      ? losingTrades.reduce((sum, { metrics }) => sum + getPnL(metrics), 0) / losingTrades.length
      : 0;

    // Largest profit/loss
    const largestProfit = closedTrades.length > 0
      ? Math.max(...closedTrades.map(({ metrics }) => getPnL(metrics)), 0)
      : 0;
    const largestLoss = closedTrades.length > 0
      ? Math.min(...closedTrades.map(({ metrics }) => getPnL(metrics)), 0)
      : 0;

    // Consecutive wins/losses
    const sortedByDate = [...closedTrades].sort((a, b) => 
      new Date(a.metrics.closeDate).getTime() - new Date(b.metrics.closeDate).getTime()
    );
    
    let maxConsecWins = 0, maxConsecLosses = 0;
    let currentWins = 0, currentLosses = 0;
    
    sortedByDate.forEach(({ metrics }) => {
      const pnl = getPnL(metrics);
      if (pnl > 0) {
        currentWins++;
        currentLosses = 0;
        maxConsecWins = Math.max(maxConsecWins, currentWins);
      } else if (pnl < 0) {
        currentLosses++;
        currentWins = 0;
        maxConsecLosses = Math.max(maxConsecLosses, currentLosses);
      } else {
        currentWins = 0;
        currentLosses = 0;
      }
    });

    // Hold times
    const calcAvgHoldTime = (trades: typeof closedTrades) => {
      if (trades.length === 0) return 0;
      return trades.reduce((sum, { metrics }) => sum + metrics.durationMinutes, 0) / trades.length;
    };

    const avgHoldTimeAll = calcAvgHoldTime(closedTrades);
    const avgHoldTimeWinners = calcAvgHoldTime(winningTrades);
    const avgHoldTimeLosers = calcAvgHoldTime(losingTrades);
    const avgHoldTimeScratch = calcAvgHoldTime(breakevenTrades);

    // Day stats
    const days = Array.from(dayMap.entries());
    const totalTradingDays = days.length;
    const winningDays = days.filter(([_, d]) => d.pnl > 0);
    const losingDays = days.filter(([_, d]) => d.pnl < 0);
    const breakevenDays = days.filter(([_, d]) => d.pnl === 0);

    // Consecutive winning/losing days
    const sortedDays = [...days].sort((a, b) => a[0].localeCompare(b[0]));
    let maxConsecWinDays = 0, maxConsecLossDays = 0;
    let currentWinDays = 0, currentLossDays = 0;
    
    sortedDays.forEach(([_, { pnl }]) => {
      if (pnl > 0) {
        currentWinDays++;
        currentLossDays = 0;
        maxConsecWinDays = Math.max(maxConsecWinDays, currentWinDays);
      } else if (pnl < 0) {
        currentLossDays++;
        currentWinDays = 0;
        maxConsecLossDays = Math.max(maxConsecLossDays, currentLossDays);
      } else {
        currentWinDays = 0;
        currentLossDays = 0;
      }
    });

    // Day P&L stats
    const avgDailyPnL = totalTradingDays > 0 
      ? days.reduce((sum, [_, d]) => sum + d.pnl, 0) / totalTradingDays 
      : 0;
    const avgWinningDayPnL = winningDays.length > 0
      ? winningDays.reduce((sum, [_, d]) => sum + d.pnl, 0) / winningDays.length
      : 0;
    const avgLosingDayPnL = losingDays.length > 0
      ? losingDays.reduce((sum, [_, d]) => sum + d.pnl, 0) / losingDays.length
      : 0;
    const largestProfitableDay = days.length > 0
      ? Math.max(...days.map(([_, d]) => d.pnl), 0)
      : 0;
    const largestLosingDay = days.length > 0
      ? Math.min(...days.map(([_, d]) => d.pnl), 0)
      : 0;

    // Average daily volume (trades per day)
    const avgDailyVolume = totalTradingDays > 0 
      ? closedTrades.length / totalTradingDays 
      : 0;

    // R-Multiples
    const tradesWithRisk = closedTrades.filter(({ trade }) => trade.tradeRisk > 0);
    const avgPlannedR = tradesWithRisk.length > 0
      ? tradesWithRisk.reduce((sum, { trade }) => sum + (trade.tradeTarget / trade.tradeRisk), 0) / tradesWithRisk.length
      : 0;
    const avgRealizedR = tradesWithRisk.length > 0
      ? tradesWithRisk.reduce((sum, { metrics }) => sum + metrics.rFactor, 0) / tradesWithRisk.length
      : 0;

    // Trade expectancy
    const winRate = closedTrades.length > 0 ? winningTrades.length / closedTrades.length : 0;
    const lossRate = 1 - winRate;
    const expectancy = (winRate * avgWinner) + (lossRate * avgLoser);

    // Profit factor
    const totalProfits = winningTrades.reduce((sum, { metrics }) => sum + getPnL(metrics), 0);
    const totalLosses = Math.abs(losingTrades.reduce((sum, { metrics }) => sum + getPnL(metrics), 0));
    const profitFactor = totalLosses > 0 ? totalProfits / totalLosses : (totalProfits > 0 ? Infinity : 0);

    // Drawdown calculations
    const sortedClosedTrades = [...closedTrades].sort((a, b) =>
      new Date(a.metrics.closeDate).getTime() - new Date(b.metrics.closeDate).getTime()
    );
    
    let equity = 0;
    let peak = 0;
    let maxDrawdown = 0;
    let maxDrawdownPercent = 0;
    let drawdownSum = 0;
    let drawdownPercentSum = 0;
    let drawdownCount = 0;

    sortedClosedTrades.forEach(({ metrics }) => {
      equity += getPnL(metrics);
      peak = Math.max(peak, equity);
      const drawdown = equity - peak;
      const drawdownPercent = peak > 0 ? (drawdown / peak) * 100 : 0;
      
      if (drawdown < 0) {
        drawdownSum += drawdown;
        drawdownPercentSum += drawdownPercent;
        drawdownCount++;
      }
      
      if (drawdown < maxDrawdown) {
        maxDrawdown = drawdown;
        maxDrawdownPercent = drawdownPercent;
      }
    });

    const avgDrawdown = drawdownCount > 0 ? drawdownSum / drawdownCount : 0;
    const avgDrawdownPercent = drawdownCount > 0 ? drawdownPercentSum / drawdownCount : 0;

    // Monthly stats
    const months = Array.from(monthMap.entries());
    const bestMonth = months.length > 0 
      ? months.reduce((best, curr) => curr[1] > best[1] ? curr : best, ['', -Infinity])
      : null;
    const lowestMonth = months.length > 0
      ? months.reduce((lowest, curr) => curr[1] < lowest[1] ? curr : lowest, ['', Infinity])
      : null;
    const avgPerMonth = months.length > 0
      ? months.reduce((sum, [_, pnl]) => sum + pnl, 0) / months.length
      : 0;

    // Average trade P&L
    const avgTradePnL = closedTrades.length > 0 ? totalPnL / closedTrades.length : 0;

    // Logged days (days with any activity)
    const loggedDays = totalTradingDays;

    return {
      // Monthly summary
      bestMonth: bestMonth ? { month: bestMonth[0], pnl: bestMonth[1] } : null,
      lowestMonth: lowestMonth ? { month: lowestMonth[0], pnl: lowestMonth[1] } : null,
      avgPerMonth,

      // Left column
      totalPnL,
      avgDailyVolume,
      avgWinner,
      avgLoser,
      totalTrades: closedTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      breakevenTrades: breakevenTrades.length,
      maxConsecWins,
      maxConsecLosses,
      totalCharges,
      totalFees,
      totalSwap,
      largestProfit,
      largestLoss,
      avgHoldTimeAll,
      avgHoldTimeWinners,
      avgHoldTimeLosers,
      avgHoldTimeScratch,
      avgTradePnL,
      profitFactor,

      // Right column
      openTrades: openTrades.length,
      totalTradingDays,
      winningDays: winningDays.length,
      losingDays: losingDays.length,
      breakevenDays: breakevenDays.length,
      loggedDays,
      maxConsecWinDays,
      maxConsecLossDays,
      avgDailyPnL,
      avgWinningDayPnL,
      avgLosingDayPnL,
      largestProfitableDay,
      largestLosingDay,
      avgPlannedR,
      avgRealizedR,
      expectancy,
      maxDrawdown,
      maxDrawdownPercent,
      avgDrawdown,
      avgDrawdownPercent,
    };
  }, [filteredTrades, pnlType]);

  const formatDuration = (minutes: number): string => {
    if (minutes === 0) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours === 0) return `${mins} minutes`;
    return `${hours} hour${hours !== 1 ? 's' : ''}, ${mins} minute${mins !== 1 ? 's' : ''}`;
  };

  const formatMonth = (monthStr: string): string => {
    if (!monthStr) return 'N/A';
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return format(date, 'MMM yyyy');
  };

  const formatValue = (value: number, isCurrency: boolean = true): string => {
    if (isCurrency) {
      return formatCurrency(value, false);
    }
    return value.toFixed(2);
  };

  const leftColumnStats = [
    { label: 'Total P&L', value: formatCurrency(stats.totalPnL, false), highlight: true },
    { label: 'Average daily volume', value: stats.avgDailyVolume.toFixed(2) },
    { label: 'Average winning trade', value: formatCurrency(stats.avgWinner, false) },
    { label: 'Average losing trade', value: formatCurrency(stats.avgLoser, false) },
    { label: 'Total number of trades', value: stats.totalTrades.toString() },
    { label: 'Number of winning trades', value: stats.winningTrades.toString() },
    { label: 'Number of losing trades', value: stats.losingTrades.toString() },
    { label: 'Number of break even trades', value: stats.breakevenTrades.toString() },
    { label: 'Max consecutive wins', value: stats.maxConsecWins.toString() },
    { label: 'Max consecutive losses', value: stats.maxConsecLosses.toString() },
    { label: 'Total charges', value: formatCurrency(stats.totalCharges, false) },
    { label: 'Total fees', value: formatCurrency(stats.totalFees, false) },
    { label: 'Total swap', value: formatCurrency(stats.totalSwap, false) },
    { label: 'Largest profit', value: formatCurrency(stats.largestProfit, false) },
    { label: 'Largest loss', value: formatCurrency(stats.largestLoss, false) },
    { label: 'Average hold time (All trades)', value: formatDuration(stats.avgHoldTimeAll) },
    { label: 'Average hold time (Winning trades)', value: formatDuration(stats.avgHoldTimeWinners) },
    { label: 'Average hold time (Losing trades)', value: formatDuration(stats.avgHoldTimeLosers) },
    { label: 'Average hold time (Scratch trades)', value: formatDuration(stats.avgHoldTimeScratch) },
    { label: 'Average trade P&L', value: formatCurrency(stats.avgTradePnL, false) },
    { label: 'Profit factor', value: stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2) },
  ];

  const rightColumnStats = [
    { label: 'Open trades', value: stats.openTrades.toString() },
    { label: 'Total trading days', value: stats.totalTradingDays.toString() },
    { label: 'Winning days', value: stats.winningDays.toString() },
    { label: 'Losing days', value: stats.losingDays.toString() },
    { label: 'Breakeven days', value: stats.breakevenDays.toString() },
    { label: 'Logged days', value: stats.loggedDays.toString() },
    { label: 'Max consecutive winning days', value: stats.maxConsecWinDays.toString() },
    { label: 'Max consecutive losing days', value: stats.maxConsecLossDays.toString() },
    { label: 'Average daily P&L', value: formatCurrency(stats.avgDailyPnL, false) },
    { label: 'Average winning day P&L', value: formatCurrency(stats.avgWinningDayPnL, false) },
    { label: 'Average losing day P&L', value: formatCurrency(stats.avgLosingDayPnL, false) },
    { label: 'Largest profitable day (Profits)', value: formatCurrency(stats.largestProfitableDay, false) },
    { label: 'Largest losing day (Losses)', value: formatCurrency(stats.largestLosingDay, false) },
    { label: 'Average planned R-Multiple', value: `${stats.avgPlannedR.toFixed(1)}R` },
    { label: 'Average realized R-Multiple', value: `${stats.avgRealizedR.toFixed(1)}R` },
    { label: 'Trade expectancy', value: formatCurrency(stats.expectancy, false) },
    { label: 'Max drawdown', value: formatCurrency(stats.maxDrawdown, false) },
    { label: 'Max drawdown, %', value: `${stats.maxDrawdownPercent.toFixed(2)}%` },
    { label: 'Average drawdown', value: formatCurrency(stats.avgDrawdown, false) },
    { label: 'Average drawdown, %', value: `${stats.avgDrawdownPercent.toFixed(2)}%` },
  ];

  const getDateLabel = () => {
    if (!dateRange.from && !dateRange.to) return '(ALL DATES)';
    const from = dateRange.from ? format(dateRange.from, 'MMM d, yyyy') : 'Start';
    const to = dateRange.to ? format(dateRange.to, 'MMM d, yyyy') : 'Now';
    return `(${from} - ${to})`;
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

      {/* Your Stats Summary */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-sm font-semibold uppercase tracking-wider">Your Stats</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-3.5 h-3.5 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Statistics based on your filtered trades</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <p className="text-xs text-muted-foreground mb-6">{getDateLabel()}</p>

        <div className="flex gap-12">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Best month</p>
            <p className="text-xl font-semibold">{stats.bestMonth ? formatCurrency(stats.bestMonth.pnl, false) : 'N/A'}</p>
            <p className="text-xs text-muted-foreground">
              {stats.bestMonth ? `in ${formatMonth(stats.bestMonth.month)}` : ''}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Lowest month</p>
            <p className="text-xl font-semibold">{stats.lowestMonth ? formatCurrency(stats.lowestMonth.pnl, false) : 'N/A'}</p>
            <p className="text-xs text-muted-foreground">
              {stats.lowestMonth ? `in ${formatMonth(stats.lowestMonth.month)}` : ''}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Average</p>
            <p className="text-xl font-semibold">{formatCurrency(stats.avgPerMonth, false)}</p>
            <p className="text-xs text-muted-foreground">per Month</p>
          </div>
        </div>
      </div>

      {/* Stats Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="grid grid-cols-2 divide-x divide-border">
          {/* Left Column */}
          <div className="divide-y divide-border">
            {leftColumnStats.map((stat, index) => (
              <div
                key={stat.label}
                className={`flex items-center justify-between px-4 py-3 ${
                  stat.highlight ? 'border-l-2 border-l-primary' : ''
                }`}
              >
                <span className="text-sm text-muted-foreground">{stat.label}</span>
                <span className="text-sm font-medium">{stat.value}</span>
              </div>
            ))}
          </div>

          {/* Right Column */}
          <div className="divide-y divide-border">
            {rightColumnStats.map((stat) => (
              <div
                key={stat.label}
                className="flex items-center justify-between px-4 py-3"
              >
                <span className="text-sm text-muted-foreground">{stat.label}</span>
                <span className="text-sm font-medium">{stat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewStats;
