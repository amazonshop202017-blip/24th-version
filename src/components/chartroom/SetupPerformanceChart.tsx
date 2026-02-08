import { useMemo, useState } from 'react';
import { useFilteredTrades } from '@/hooks/useFilteredTrades';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { useAccountsContext } from '@/contexts/AccountsContext';
import { usePrivacyMode } from '@/hooks/usePrivacyMode';
import { calculateTradeMetrics, Trade } from '@/types/trade';
import { useStrategiesContext } from '@/contexts/StrategiesContext';
import { ChartDisplayType, mapGlobalToChartDisplay, formatDuration, formatDurationTick } from '@/hooks/useChartDisplayMode';
import { buildGroupDailyCounts, getGroupTradingActivityStats } from '@/lib/tradingActivityStats';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
  Cell,
} from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import { ChartDisplayDropdown } from './ChartDisplayDropdown';

interface SetupData {
  setup: string;
  totalPnl: number;
  totalPercent: number;
  tradeCount: number;
  winCount: number;
  lossCount: number;
  beCount: number;
  avgPnl: number;
  winrate: number;
  displayValue: number;
  avgHoldTimeMinutes: number;
  longestDurationMinutes: number;
  longWinCount: number;
  longLossCount: number;
  longWinrate: number;
  shortWinCount: number;
  shortLossCount: number;
  shortWinrate: number;
  longTradeCount: number;
  shortTradeCount: number;
  avgWin: number;
  avgLoss: number;
  largestWin: number;
  largestLoss: number;
  winPnlSum: number;
  lossPnlSum: number;
  // Trading Activity stats
  avgTradesPerDay: number;
  medianTradesPerDay: number;
  percentile90TradesPerDay: number;
  maxTradesInDay: number;
  loggedDays: number;
}

interface SetupPerformanceChartProps {
  defaultDisplayType?: ChartDisplayType;
  title?: string;
  useGlobalDefault?: boolean; // true = use global filter as default, false = use defaultDisplayType
}

export const SetupPerformanceChart = ({ 
  defaultDisplayType = 'dollar',
  title = 'Performance by Setup',
  useGlobalDefault = true
}: SetupPerformanceChartProps) => {
  const { filteredTrades } = useFilteredTrades();
  const { currencyConfig, selectedAccounts, isAllAccountsSelected, classifyTradeOutcome, displayMode } = useGlobalFilters();
  const { accounts, getAccountBalanceBeforeTrades } = useAccountsContext();
  const { strategies } = useStrategiesContext();
  const { isPrivacyMode } = usePrivacyMode();
  
  // Calculate initial display type from global filter or prop
  const getInitialDisplayType = (): ChartDisplayType => {
    if (useGlobalDefault) {
      return mapGlobalToChartDisplay(displayMode);
    }
    return defaultDisplayType;
  };
  
  const [displayType, setDisplayType] = useState<ChartDisplayType>(getInitialDisplayType);

  // Calculate total starting balance for Return (%) denominator
  const totalStartingBalance = useMemo(() => {
    const activeAccounts = accounts.filter(a => !a.isArchived);
    
    if (isAllAccountsSelected) {
      return activeAccounts.reduce((sum, acc) => sum + getAccountBalanceBeforeTrades(acc.id), 0);
    } else if (selectedAccounts.length > 0) {
      return activeAccounts
        .filter(acc => selectedAccounts.includes(acc.name))
        .reduce((sum, acc) => sum + getAccountBalanceBeforeTrades(acc.id), 0);
    }
    return 0;
  }, [accounts, selectedAccounts, isAllAccountsSelected, getAccountBalanceBeforeTrades]);

  // Calculate setup data - SETUP-CENTRIC approach
  const setupData = useMemo(() => {
    // Include all trades for trading activity stats
    const allTrades = filteredTrades;
    const closedTrades = filteredTrades.filter((trade: Trade) => {
      const metrics = calculateTradeMetrics(trade);
      return metrics.positionStatus === 'CLOSED';
    });

    if (closedTrades.length === 0) return [];

    // Build a map of setup ID -> setup name for quick lookup
    const setupIdToName = new Map<string, string>();
    strategies.forEach(strategy => {
      setupIdToName.set(strategy.id, strategy.name);
    });

    // Build daily counts per setup for trading activity metrics
    const groupDailyCounts = buildGroupDailyCounts(allTrades, (trade) => {
      if (trade.strategyId && setupIdToName.has(trade.strategyId)) {
        return setupIdToName.get(trade.strategyId)!;
      }
      return 'Unassigned';
    });

    const setupMap = new Map<string, {
      totalPnl: number;
      tradeCount: number;
      winCount: number;
      lossCount: number;
      beCount: number;
      totalDurationMinutes: number;
      longestDurationMinutes: number;
      longWinCount: number;
      longLossCount: number;
      shortWinCount: number;
      shortLossCount: number;
      longTradeCount: number;
      shortTradeCount: number;
      winPnlSum: number;
      lossPnlSum: number;
      largestWin: number;
      largestLoss: number;
    }>();

    // Group trades by their strategyId (setup)
    closedTrades.forEach(trade => {
      const metrics = calculateTradeMetrics(trade);
      
      // Determine setup name from strategyId
      let setupName: string;
      if (trade.strategyId && setupIdToName.has(trade.strategyId)) {
        setupName = setupIdToName.get(trade.strategyId)!;
      } else if (!trade.strategyId || trade.strategyId.trim() === '') {
        setupName = 'Unassigned';
      } else {
        setupName = 'Unassigned';
      }
      
      const existing = setupMap.get(setupName) || { 
        totalPnl: 0, 
        tradeCount: 0, 
        winCount: 0,
        lossCount: 0,
        beCount: 0,
        totalDurationMinutes: 0,
        longestDurationMinutes: 0,
        longWinCount: 0,
        longLossCount: 0,
        shortWinCount: 0,
        shortLossCount: 0,
        longTradeCount: 0,
        shortTradeCount: 0,
        winPnlSum: 0,
        lossPnlSum: 0,
        largestWin: 0,
        largestLoss: 0,
      };
      
      // Use global classifyTradeOutcome for consistent classification
      const outcome = classifyTradeOutcome(metrics.netPnl, trade.savedReturnPercent, trade.breakEven);
      const durationMinutes = metrics.durationMinutes || 0;
      const isLong = trade.side === 'LONG';
      const isShort = trade.side === 'SHORT';
      const isWin = outcome === 'win';
      const isLoss = outcome === 'loss';
      const pnl = metrics.netPnl;
      
      setupMap.set(setupName, {
        totalPnl: existing.totalPnl + pnl,
        tradeCount: existing.tradeCount + 1,
        winCount: existing.winCount + (isWin ? 1 : 0),
        lossCount: existing.lossCount + (isLoss ? 1 : 0),
        beCount: existing.beCount + (outcome === 'breakeven' ? 1 : 0),
        totalDurationMinutes: existing.totalDurationMinutes + durationMinutes,
        longestDurationMinutes: Math.max(existing.longestDurationMinutes, durationMinutes),
        longWinCount: existing.longWinCount + (isLong && isWin ? 1 : 0),
        longLossCount: existing.longLossCount + (isLong && isLoss ? 1 : 0),
        shortWinCount: existing.shortWinCount + (isShort && isWin ? 1 : 0),
        shortLossCount: existing.shortLossCount + (isShort && isLoss ? 1 : 0),
        longTradeCount: existing.longTradeCount + (isLong ? 1 : 0),
        shortTradeCount: existing.shortTradeCount + (isShort ? 1 : 0),
        winPnlSum: existing.winPnlSum + (isWin ? pnl : 0),
        lossPnlSum: existing.lossPnlSum + (isLoss ? pnl : 0),
        largestWin: isWin ? Math.max(existing.largestWin, pnl) : existing.largestWin,
        largestLoss: isLoss ? Math.min(existing.largestLoss, pnl) : existing.largestLoss,
      });
    });

    // Convert to array and calculate averages
    const data: SetupData[] = Array.from(setupMap.entries())
      .map(([setup, data]) => {
        // Win Rate = Wins / (Wins + Losses) - excludes breakeven
        const winsAndLosses = data.winCount + data.lossCount;
        const winrate = winsAndLosses > 0 ? (data.winCount / winsAndLosses) * 100 : 0;
        // Calculate Return (%) correctly: Total P/L ÷ Account Starting Balance × 100
        const returnPercent = totalStartingBalance > 0 
          ? (data.totalPnl / totalStartingBalance) * 100 
          : 0;
        
        const avgHoldTimeMinutes = data.tradeCount > 0 ? data.totalDurationMinutes / data.tradeCount : 0;
        const longestDurationMinutes = data.longestDurationMinutes;
        
        // Long Win % = Long Wins / (Long Wins + Long Losses)
        const longWinsAndLosses = data.longWinCount + data.longLossCount;
        const longWinrate = longWinsAndLosses > 0 ? (data.longWinCount / longWinsAndLosses) * 100 : 0;
        
        // Short Win % = Short Wins / (Short Wins + Short Losses)
        const shortWinsAndLosses = data.shortWinCount + data.shortLossCount;
        const shortWinrate = shortWinsAndLosses > 0 ? (data.shortWinCount / shortWinsAndLosses) * 100 : 0;
        
        // Profitability metrics
        const avgWin = data.winCount > 0 ? data.winPnlSum / data.winCount : 0;
        const avgLoss = data.lossCount > 0 ? data.lossPnlSum / data.lossCount : 0;
        const largestWin = data.largestWin;
        const largestLoss = data.largestLoss;
        
        let displayValue: number;
        
        switch (displayType) {
          case 'dollar':
            displayValue = data.totalPnl;
            break;
          case 'percent':
            displayValue = returnPercent;
            break;
          case 'winrate':
            displayValue = winrate;
            break;
          case 'tradecount':
            displayValue = data.tradeCount;
            break;
          case 'avg_hold_time':
            displayValue = avgHoldTimeMinutes;
            break;
          case 'longest_duration':
            displayValue = longestDurationMinutes;
            break;
          case 'long_winrate':
            displayValue = longWinrate;
            break;
          case 'short_winrate':
            displayValue = shortWinrate;
            break;
          case 'tradecount_long':
            displayValue = data.longTradeCount;
            break;
          case 'tradecount_short':
            displayValue = data.shortTradeCount;
            break;
          case 'avg_win':
            displayValue = avgWin;
            break;
          case 'avg_loss':
            displayValue = avgLoss;
            break;
          case 'largest_win':
            displayValue = largestWin;
            break;
          case 'largest_loss':
            displayValue = largestLoss;
            break;
          case 'avg_trades_per_day':
            displayValue = getGroupTradingActivityStats(groupDailyCounts, setup).avgTradesPerDay;
            break;
          case 'median_trades_per_day':
            displayValue = getGroupTradingActivityStats(groupDailyCounts, setup).medianTradesPerDay;
            break;
          case '90th_percentile_trades':
            displayValue = getGroupTradingActivityStats(groupDailyCounts, setup).percentile90TradesPerDay;
            break;
          case 'logged_days':
            displayValue = getGroupTradingActivityStats(groupDailyCounts, setup).loggedDays;
            break;
          default:
            displayValue = data.totalPnl;
        }
        
        // Get trading activity stats for this setup
        const tradingActivityStats = getGroupTradingActivityStats(groupDailyCounts, setup);
        
        return {
          setup,
          totalPnl: data.totalPnl,
          totalPercent: returnPercent,
          tradeCount: data.tradeCount,
          winCount: data.winCount,
          lossCount: data.lossCount,
          beCount: data.beCount,
          avgPnl: data.totalPnl / data.tradeCount,
          winrate,
          displayValue,
          avgHoldTimeMinutes,
          longestDurationMinutes,
          longWinCount: data.longWinCount,
          longLossCount: data.longLossCount,
          longWinrate,
          shortWinCount: data.shortWinCount,
          shortLossCount: data.shortLossCount,
          shortWinrate,
          longTradeCount: data.longTradeCount,
          shortTradeCount: data.shortTradeCount,
          avgWin,
          avgLoss,
          largestWin,
          largestLoss,
          winPnlSum: data.winPnlSum,
          lossPnlSum: data.lossPnlSum,
          avgTradesPerDay: tradingActivityStats.avgTradesPerDay,
          medianTradesPerDay: tradingActivityStats.medianTradesPerDay,
          percentile90TradesPerDay: tradingActivityStats.percentile90TradesPerDay,
          maxTradesInDay: tradingActivityStats.maxTradesInDay,
          loggedDays: tradingActivityStats.loggedDays,
        };
      })
      // Sort by value descending (best first)
      .sort((a, b) => b.displayValue - a.displayValue);

    return data;
  }, [filteredTrades, displayType, strategies, totalStartingBalance, classifyTradeOutcome]);

  // Format currency
  const formatValue = (value: number, forceType?: ChartDisplayType): string => {
    const type = forceType || displayType;
    if (type === 'percent') {
      return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
    }
    if (type === 'tickpip') {
      // Placeholder for tick/pip display
      return `${value >= 0 ? '+' : ''}${value.toFixed(2)} T`;
    }
    if (type === 'privacy') {
      return '•••••';
    }
    const absValue = Math.abs(value);
    if (absValue >= 1000) {
      return `${value >= 0 ? '+' : '-'}${currencyConfig.symbol}${(absValue / 1000).toFixed(1)}k`;
    }
    return `${value >= 0 ? '+' : '-'}${currencyConfig.symbol}${absValue.toFixed(2)}`;
  };

  return (
    <Card className="bg-card border-border h-full">
      <CardContent className="p-4">
        {/* Header with Dropdowns */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          <div className="flex items-center gap-2">
            <ChartDisplayDropdown
              value={displayType}
              onValueChange={(v) => setDisplayType(v)}
            />
          </div>
        </div>

        {/* Chart */}
        <div className="h-[300px] w-full">
          {setupData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={setupData}
                margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
              >
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="hsl(var(--border))" 
                  opacity={0.3}
                  vertical={false}
                />
                <XAxis
                  dataKey="setup"
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  dy={5}
                />
                <YAxis
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  tickFormatter={(value) => {
                    // Mask $ and % values in privacy mode
                    if (isPrivacyMode && (displayType === 'dollar' || displayType === 'percent' || displayType === 'avg_win' || displayType === 'avg_loss' || displayType === 'largest_win' || displayType === 'largest_loss')) {
                      return '**';
                    }
                    switch (displayType) {
                      case 'dollar':
                      case 'avg_win':
                      case 'avg_loss':
                      case 'largest_win':
                      case 'largest_loss':
                        return `${currencyConfig.symbol}${value.toFixed(0)}`;
                      case 'percent':
                      case 'winrate':
                      case 'long_winrate':
                      case 'short_winrate':
                        return `${value.toFixed(0)}%`;
                       case 'tradecount':
                       case 'tradecount_long':
                       case 'tradecount_short':
                       case 'avg_trades_per_day':
                       case 'median_trades_per_day':
                       case '90th_percentile_trades':
                       case 'logged_days':
                         return value % 1 === 0 ? `${Math.round(value)}` : value.toFixed(1);
                      case 'avg_hold_time':
                      case 'longest_duration':
                        return formatDurationTick(value);
                      default:
                        return `${value}`;
                    }
                  }}
                  width={50}
                />
                
                {/* Reference Line at 0 - for monetary and percent modes */}
                {(displayType === 'dollar' || displayType === 'percent' || displayType === 'avg_win' || displayType === 'avg_loss' || displayType === 'largest_win' || displayType === 'largest_loss') && (
                  <ReferenceLine 
                    y={0} 
                    stroke="hsl(var(--muted-foreground))" 
                    strokeWidth={1}
                    strokeDasharray="3 3"
                  />
                )}

                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
                  content={({ active, payload }) => {
                    if (!active || !payload || payload.length === 0) return null;
                    const data = payload[0].payload as SetupData;
                    
                    if (displayType === 'tradecount') {
                      return (
                        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                          <p className="text-foreground font-medium mb-2">{data.setup}</p>
                          <p className="text-sm text-foreground">
                            Trade Count: {data.tradeCount}
                          </p>
                        </div>
                      );
                    }
                    
                    if (displayType === 'avg_hold_time') {
                      return (
                        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                          <p className="text-foreground font-medium mb-2">{data.setup}</p>
                          <div className="space-y-1 text-sm">
                            <p className="text-foreground">
                              Avg Hold Time: {formatDuration(data.avgHoldTimeMinutes)}
                            </p>
                            <p className="text-muted-foreground">
                              Total Trades: {data.tradeCount}
                            </p>
                          </div>
                        </div>
                      );
                    }
                    
                    if (displayType === 'longest_duration') {
                      return (
                        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                          <p className="text-foreground font-medium mb-2">{data.setup}</p>
                          <div className="space-y-1 text-sm">
                            <p className="text-foreground">
                              Longest Duration: {formatDuration(data.longestDurationMinutes)}
                            </p>
                            <p className="text-muted-foreground">
                              Total Trades: {data.tradeCount}
                            </p>
                          </div>
                        </div>
                      );
                    }
                    
                    if (displayType === 'winrate') {
                      return (
                        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                          <p className="text-foreground font-medium mb-2">{data.setup}</p>
                          <div className="space-y-1 text-sm">
                            <p className="text-foreground">
                              Winrate: {data.winrate.toFixed(1)}%
                            </p>
                            <p className="text-muted-foreground">
                              Wins: {data.winCount}
                            </p>
                            <p className="text-muted-foreground">
                              Losses: {data.lossCount}
                            </p>
                            <p className="text-muted-foreground">
                              Breakeven: {data.beCount}
                            </p>
                          </div>
                        </div>
                      );
                    }
                    
                    if (displayType === 'long_winrate') {
                      const longTotal = data.longWinCount + data.longLossCount;
                      return (
                        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                          <p className="text-foreground font-medium mb-2">{data.setup}</p>
                          <div className="space-y-1 text-sm">
                            <p className="text-foreground">
                              Long Win %: {data.longWinrate.toFixed(1)}%
                            </p>
                            <p className="text-muted-foreground">
                              Long Wins: {data.longWinCount}
                            </p>
                            <p className="text-muted-foreground">
                              Long Losses: {data.longLossCount}
                            </p>
                            <p className="text-muted-foreground">
                              Total Long Trades: {longTotal}
                            </p>
                          </div>
                        </div>
                      );
                    }
                    
                    if (displayType === 'short_winrate') {
                      const shortTotal = data.shortWinCount + data.shortLossCount;
                      return (
                        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                          <p className="text-foreground font-medium mb-2">{data.setup}</p>
                          <div className="space-y-1 text-sm">
                            <p className="text-foreground">
                              Short Win %: {data.shortWinrate.toFixed(1)}%
                            </p>
                            <p className="text-muted-foreground">
                              Short Wins: {data.shortWinCount}
                            </p>
                            <p className="text-muted-foreground">
                              Short Losses: {data.shortLossCount}
                            </p>
                            <p className="text-muted-foreground">
                              Total Short Trades: {shortTotal}
                            </p>
                          </div>
                        </div>
                      );
                    }
                    
                    if (displayType === 'tradecount_long') {
                      return (
                        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                          <p className="text-foreground font-medium mb-2">{data.setup}</p>
                          <div className="space-y-1 text-sm">
                            <p className="text-foreground">
                              Trade Count (Long): {data.longTradeCount}
                            </p>
                            <p className="text-muted-foreground">
                              Direction: Long
                            </p>
                          </div>
                        </div>
                      );
                    }
                    
                    if (displayType === 'tradecount_short') {
                      return (
                        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                          <p className="text-foreground font-medium mb-2">{data.setup}</p>
                          <div className="space-y-1 text-sm">
                            <p className="text-foreground">
                              Trade Count (Short): {data.shortTradeCount}
                            </p>
                            <p className="text-muted-foreground">
                              Direction: Short
                            </p>
                          </div>
                        </div>
                      );
                    }
                    
                    if (displayType === 'avg_win') {
                      return (
                        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                          <p className="text-foreground font-medium mb-2">{data.setup}</p>
                          <div className="space-y-1 text-sm">
                            <p className={data.avgWin >= 0 ? 'text-profit' : 'text-foreground'}>
                              Avg Win: {isPrivacyMode ? '**' : `${currencyConfig.symbol}${data.avgWin.toFixed(2)}`}
                            </p>
                            <p className="text-muted-foreground">
                              Winning Trades: {data.winCount}
                            </p>
                          </div>
                        </div>
                      );
                    }
                    
                    if (displayType === 'avg_loss') {
                      return (
                        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                          <p className="text-foreground font-medium mb-2">{data.setup}</p>
                          <div className="space-y-1 text-sm">
                            <p className={data.avgLoss < 0 ? 'text-loss' : 'text-foreground'}>
                              Avg Loss: {isPrivacyMode ? '**' : `${data.avgLoss < 0 ? '-' : ''}${currencyConfig.symbol}${Math.abs(data.avgLoss).toFixed(2)}`}
                            </p>
                            <p className="text-muted-foreground">
                              Losing Trades: {data.lossCount}
                            </p>
                          </div>
                        </div>
                      );
                    }
                    
                    if (displayType === 'largest_win') {
                      return (
                        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                          <p className="text-foreground font-medium mb-2">{data.setup}</p>
                          <div className="space-y-1 text-sm">
                            <p className={data.largestWin >= 0 ? 'text-profit' : 'text-foreground'}>
                              Largest Win: {isPrivacyMode ? '**' : `${currencyConfig.symbol}${data.largestWin.toFixed(2)}`}
                            </p>
                            <p className="text-muted-foreground">
                              Winning Trades: {data.winCount}
                            </p>
                          </div>
                        </div>
                      );
                    }
                    
                    if (displayType === 'largest_loss') {
                      return (
                        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                          <p className="text-foreground font-medium mb-2">{data.setup}</p>
                          <div className="space-y-1 text-sm">
                            <p className={data.largestLoss < 0 ? 'text-loss' : 'text-foreground'}>
                              Largest Loss: {isPrivacyMode ? '**' : `${data.largestLoss < 0 ? '-' : ''}${currencyConfig.symbol}${Math.abs(data.largestLoss).toFixed(2)}`}
                            </p>
                            <p className="text-muted-foreground">
                              Losing Trades: {data.lossCount}
                            </p>
                          </div>
                        </div>
                      );
                    }
                    
                    if (displayType === 'avg_trades_per_day') {
                      return (
                        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                          <p className="text-foreground font-medium mb-2">{data.setup}</p>
                          <div className="space-y-1 text-sm">
                            <p className="text-foreground">
                              Avg Trades/Day: {data.avgTradesPerDay.toFixed(1)}
                            </p>
                            <p className="text-muted-foreground">
                              Logged Days: {data.loggedDays}
                            </p>
                            <p className="text-muted-foreground">
                              Total Trades: {data.tradeCount}
                            </p>
                          </div>
                        </div>
                      );
                    }
                    
                    if (displayType === 'median_trades_per_day') {
                      return (
                        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                          <p className="text-foreground font-medium mb-2">{data.setup}</p>
                          <div className="space-y-1 text-sm">
                            <p className="text-foreground">
                              Median Trades/Day: {data.medianTradesPerDay.toFixed(1)}
                            </p>
                            <p className="text-muted-foreground">
                              Logged Days: {data.loggedDays}
                            </p>
                            <p className="text-muted-foreground">
                              Total Trades: {data.tradeCount}
                            </p>
                          </div>
                        </div>
                      );
                    }
                    
                    if (displayType === '90th_percentile_trades') {
                      return (
                        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                          <p className="text-foreground font-medium mb-2">{data.setup}</p>
                          <div className="space-y-1 text-sm">
                            <p className="text-foreground">
                              90th Percentile Trades / Day: {Math.round(data.percentile90TradesPerDay)}
                            </p>
                            <p className="text-muted-foreground">
                              Median Trades / Day: {data.medianTradesPerDay.toFixed(1)}
                            </p>
                            <p className="text-muted-foreground">
                              Max Trades in a Day: {data.maxTradesInDay}
                            </p>
                            <p className="text-muted-foreground text-xs mt-2 italic border-t border-border pt-2">
                              Largest drawdowns occur when trades/day &gt; {Math.round(data.percentile90TradesPerDay)}
                            </p>
                          </div>
                        </div>
                      );
                    }
                    
                    if (displayType === 'logged_days') {
                      return (
                        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                          <p className="text-foreground font-medium mb-2">{data.setup}</p>
                          <div className="space-y-1 text-sm">
                            <p className="text-foreground">
                              Logged Days: {data.loggedDays}
                            </p>
                            <p className="text-muted-foreground">
                              Total Trades: {data.tradeCount}
                            </p>
                            <p className="text-muted-foreground">
                              Median Trades / Day: {data.medianTradesPerDay.toFixed(1)}
                            </p>
                          </div>
                        </div>
                      );
                    }
                    
                    // Dollar mode: show Net PNL + counts
                    if (displayType === 'dollar') {
                      return (
                        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                          <p className="text-foreground font-medium mb-2">{data.setup}</p>
                          <div className="space-y-1 text-sm">
                            <p className={isPrivacyMode ? 'text-foreground' : data.totalPnl >= 0 ? 'text-profit' : 'text-loss'}>
                              Net PNL: {isPrivacyMode ? '**' : formatValue(data.totalPnl, 'dollar')}
                            </p>
                            <p className="text-muted-foreground">
                              Total Trades: {data.tradeCount}
                            </p>
                            <p className="text-muted-foreground">
                              Winners: {data.winCount}
                            </p>
                            <p className="text-muted-foreground">
                              Losers: {data.lossCount}
                            </p>
                            <p className="text-muted-foreground">
                              BE: {data.beCount}
                            </p>
                          </div>
                        </div>
                      );
                    }
                    
                    // Percent mode: show Return % + counts
                    if (displayType === 'percent') {
                      return (
                        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                          <p className="text-foreground font-medium mb-2">{data.setup}</p>
                          <div className="space-y-1 text-sm">
                            <p className={isPrivacyMode ? 'text-foreground' : data.totalPercent >= 0 ? 'text-profit' : 'text-loss'}>
                              Return %: {isPrivacyMode ? '**' : formatValue(data.totalPercent, 'percent')}
                            </p>
                            <p className="text-muted-foreground">
                              Total Trades: {data.tradeCount}
                            </p>
                            <p className="text-muted-foreground">
                              Winners: {data.winCount}
                            </p>
                            <p className="text-muted-foreground">
                              Losers: {data.lossCount}
                            </p>
                            <p className="text-muted-foreground">
                              BE: {data.beCount}
                            </p>
                          </div>
                        </div>
                      );
                    }
                    
                    // Tick/Pip and Privacy modes - placeholder
                    return (
                      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                        <p className="text-foreground font-medium mb-2">{data.setup}</p>
                        <div className="space-y-1 text-sm">
                          <p className="text-foreground">
                            {displayType === 'privacy' ? '•••••' : '--'}
                          </p>
                          <p className="text-muted-foreground">
                            Total Trades: {data.tradeCount}
                          </p>
                          <p className="text-muted-foreground">
                            Winners: {data.winCount}
                          </p>
                          <p className="text-muted-foreground">
                            Losers: {data.lossCount}
                          </p>
                          <p className="text-muted-foreground">
                            BE: {data.beCount}
                          </p>
                        </div>
                      </div>
                    );
                  }}
                />

                <Bar 
                  dataKey="displayValue" 
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                >
                  {setupData.map((entry, index) => {
                    let fillColor: string;
                    if (displayType === 'winrate' || displayType === 'tradecount' || displayType === 'avg_hold_time' || displayType === 'longest_duration' || displayType === 'long_winrate' || displayType === 'short_winrate' || displayType === 'tradecount_long' || displayType === 'tradecount_short') {
                      fillColor = 'hsl(var(--primary))';
                    } else {
                      fillColor = entry.displayValue >= 0 ? 'hsl(var(--profit))' : 'hsl(var(--loss))';
                    }
                    return (
                      <Cell 
                        key={`cell-${index}`}
                        fill={fillColor}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full border border-dashed border-border rounded-xl bg-muted/20">
              <p className="text-muted-foreground text-sm">No closed trades with setups available for analysis.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
