import { useMemo, useState } from 'react';
import { useFilteredTrades } from '@/hooks/useFilteredTrades';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { useAccountsContext } from '@/contexts/AccountsContext';
import { usePrivacyMode } from '@/hooks/usePrivacyMode';
import { calculateTradeMetrics, Trade } from '@/types/trade';
import { parseISO, getDay, getMonth, getWeek, getHours, getMinutes, format } from 'date-fns';
import { ChartDisplayType, mapGlobalToChartDisplay, formatDuration, formatDurationTick } from '@/hooks/useChartDisplayMode';
import { calculateTradingActivityStatsFromCounts } from '@/lib/tradingActivityStats';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { ChartDisplayDropdown } from './ChartDisplayDropdown';

type DateSettingType = 'entry' | 'exit';
type PeriodType = 'weekday' | 'month' | 'week' | 'hour' | '2hour' | '1hour' | '30min' | '15min' | '10min' | '5min';

interface TimeData {
  label: string;
  sortOrder: number;
  totalPnl: number;
  totalPercent: number;
  tradeCount: number;
  winCount: number;
  lossCount: number;
  breakevenCount: number;
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
  loggedDays: number;
}

interface PerformanceByTimeChartProps {
  defaultDisplayType?: ChartDisplayType;
  title?: string;
  useGlobalDefault?: boolean; // true = use global filter as default, false = use defaultDisplayType
}

const WEEKDAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const PerformanceByTimeChart = ({ 
  defaultDisplayType = 'dollar',
  title = 'Performance by Time',
  useGlobalDefault = true
}: PerformanceByTimeChartProps) => {
  const { filteredTrades } = useFilteredTrades();
  const { currencyConfig, selectedAccounts, isAllAccountsSelected, classifyTradeOutcome, displayMode } = useGlobalFilters();
  const { accounts, getAccountBalanceBeforeTrades } = useAccountsContext();
  const { isPrivacyMode } = usePrivacyMode();
  
  // Calculate initial display type from global filter or prop
  const getInitialDisplayType = (): ChartDisplayType => {
    if (useGlobalDefault) {
      return mapGlobalToChartDisplay(displayMode);
    }
    return defaultDisplayType;
  };
  
  const [displayType, setDisplayType] = useState<ChartDisplayType>(getInitialDisplayType);
  const [dateSetting, setDateSetting] = useState<DateSettingType>('entry');
  const [period, setPeriod] = useState<PeriodType>('weekday');

  // Calculate total starting balance for Return (%) denominator
  const totalStartingBalance = useMemo(() => {
    // Get active accounts
    const activeAccounts = accounts.filter(a => !a.isArchived);
    
    if (isAllAccountsSelected) {
      // Sum starting balances of all active accounts
      return activeAccounts.reduce((sum, acc) => sum + getAccountBalanceBeforeTrades(acc.id), 0);
    } else if (selectedAccounts.length > 0) {
      // Sum starting balances of selected accounts
      return activeAccounts
        .filter(acc => selectedAccounts.includes(acc.name))
        .reduce((sum, acc) => sum + getAccountBalanceBeforeTrades(acc.id), 0);
    }
    return 0;
  }, [accounts, selectedAccounts, isAllAccountsSelected, getAccountBalanceBeforeTrades]);

  // Get bucket for a trade based on period
  const getBucket = (date: Date, periodType: PeriodType): { label: string; sortOrder: number } => {
    const dayOfWeek = getDay(date);
    const month = getMonth(date);
    const weekNum = getWeek(date);
    const hour = getHours(date);
    const minute = getMinutes(date);

    switch (periodType) {
      case 'weekday':
        return { label: WEEKDAY_LABELS[dayOfWeek], sortOrder: dayOfWeek === 0 ? 7 : dayOfWeek };
      case 'month':
        return { label: MONTH_LABELS[month], sortOrder: month };
      case 'week':
        return { label: `Week ${weekNum}`, sortOrder: weekNum };
      case 'hour':
        return { label: `${String(hour).padStart(2, '0')}:00`, sortOrder: hour };
      case '2hour': {
        const bucket = Math.floor(hour / 2);
        return {
          label: `${String(bucket * 2).padStart(2, '0')}–${String(bucket * 2 + 2).padStart(2, '0')}`,
          sortOrder: bucket,
        };
      }
      case '1hour':
        return {
          label: `${String(hour).padStart(2, '0')}–${String(hour + 1).padStart(2, '0')}`,
          sortOrder: hour,
        };
      case '30min': {
        const bucket = hour * 2 + Math.floor(minute / 30);
        const startHour = Math.floor(bucket / 2);
        const startMin = (bucket % 2) * 30;
        const endMin = startMin + 30;
        const endHour = endMin === 60 ? startHour + 1 : startHour;
        return {
          label: `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}–${String(endHour).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`,
          sortOrder: bucket,
        };
      }
      case '15min': {
        const bucket = hour * 4 + Math.floor(minute / 15);
        const startHour = Math.floor(bucket / 4);
        const startMin = (bucket % 4) * 15;
        const endMin = startMin + 15;
        const endHour = endMin === 60 ? startHour + 1 : startHour;
        return {
          label: `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}–${String(endHour).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`,
          sortOrder: bucket,
        };
      }
      case '10min': {
        const bucket = hour * 6 + Math.floor(minute / 10);
        const startHour = Math.floor(bucket / 6);
        const startMin = (bucket % 6) * 10;
        const endMin = startMin + 10;
        const endHour = endMin === 60 ? startHour + 1 : startHour;
        return {
          label: `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}–${String(endHour).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`,
          sortOrder: bucket,
        };
      }
      case '5min': {
        const bucket = hour * 12 + Math.floor(minute / 5);
        const startHour = Math.floor(bucket / 12);
        const startMin = (bucket % 12) * 5;
        const endMin = startMin + 5;
        const endHour = endMin === 60 ? startHour + 1 : startHour;
        return {
          label: `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}–${String(endHour).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`,
          sortOrder: bucket,
        };
      }
      default:
        return { label: 'Unknown', sortOrder: 0 };
    }
  };

  // Calculate time-based data
  const timeData = useMemo(() => {
    // Include all trades for trading activity stats
    const allTrades = filteredTrades;
    const closedTrades = filteredTrades.filter((trade: Trade) => {
      const metrics = calculateTradeMetrics(trade);
      return metrics.positionStatus === 'CLOSED';
    });

    if (closedTrades.length === 0) return [];

    // Track daily counts per time bucket for trading activity stats
    // Map: bucket label -> Map: calendar day -> trade count
    const bucketDailyCounts = new Map<string, Map<string, number>>();

    const timeMap = new Map<string, {
      sortOrder: number;
      totalPnl: number;
      tradeCount: number;
      winCount: number;
      lossCount: number;
      breakevenCount: number;
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

    // First pass: build daily counts per bucket for all trades
    allTrades.forEach(trade => {
      const metrics = calculateTradeMetrics(trade);
      const dateStr = dateSetting === 'entry' ? metrics.openDate : metrics.closeDate;
      if (!dateStr) return;
      
      const date = parseISO(dateStr);
      const bucket = getBucket(date, period);
      const dayKey = format(date, 'yyyy-MM-dd');
      
      if (!bucketDailyCounts.has(bucket.label)) {
        bucketDailyCounts.set(bucket.label, new Map());
      }
      const dailyMap = bucketDailyCounts.get(bucket.label)!;
      dailyMap.set(dayKey, (dailyMap.get(dayKey) || 0) + 1);
    });

    closedTrades.forEach(trade => {
      const metrics = calculateTradeMetrics(trade);
      
      const dateStr = dateSetting === 'entry' ? metrics.openDate : metrics.closeDate;
      if (!dateStr) return;
      
      const date = parseISO(dateStr);
      const bucket = getBucket(date, period);

      // Use global classifyTradeOutcome for consistent classification
      const outcome = classifyTradeOutcome(metrics.netPnl, trade.savedReturnPercent, trade.breakEven);
      const durationMinutes = metrics.durationMinutes || 0;
      const isLong = trade.side === 'LONG';
      const isShort = trade.side === 'SHORT';
      const isWin = outcome === 'win';
      const isLoss = outcome === 'loss';
      const pnl = metrics.netPnl;
      
      const existing = timeMap.get(bucket.label) || { 
        sortOrder: bucket.sortOrder,
        totalPnl: 0, 
        tradeCount: 0, 
        winCount: 0,
        lossCount: 0,
        breakevenCount: 0,
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
      
      timeMap.set(bucket.label, {
        sortOrder: bucket.sortOrder,
        totalPnl: existing.totalPnl + pnl,
        tradeCount: existing.tradeCount + 1,
        winCount: existing.winCount + (isWin ? 1 : 0),
        lossCount: existing.lossCount + (isLoss ? 1 : 0),
        breakevenCount: existing.breakevenCount + (outcome === 'breakeven' ? 1 : 0),
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

    const data: TimeData[] = Array.from(timeMap.entries())
      .map(([label, data]) => {
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
          case 'median_trades_per_day':
          case '90th_percentile_trades':
            // Will be calculated below
            displayValue = 0;
            break;
          case 'dollar':
          default:
            displayValue = data.totalPnl;
            break;
        }

        // Calculate trading activity stats for this bucket
        const dailyMap = bucketDailyCounts.get(label);
        const dailyCounts = dailyMap ? Array.from(dailyMap.values()) : [];
        const tradingActivityStats = calculateTradingActivityStatsFromCounts(dailyCounts);
        
        // Override displayValue for trading activity metrics
        if (displayType === 'avg_trades_per_day') {
          displayValue = tradingActivityStats.avgTradesPerDay;
        } else if (displayType === 'median_trades_per_day') {
          displayValue = tradingActivityStats.medianTradesPerDay;
        } else if (displayType === '90th_percentile_trades') {
          displayValue = tradingActivityStats.percentile90TradesPerDay;
        }

        return {
          label,
          sortOrder: data.sortOrder,
          totalPnl: data.totalPnl,
          totalPercent: returnPercent,
          tradeCount: data.tradeCount,
          winCount: data.winCount,
          lossCount: data.lossCount,
          breakevenCount: data.breakevenCount,
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
          loggedDays: tradingActivityStats.loggedDays,
        };
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);

    return data;
  }, [filteredTrades, displayType, dateSetting, period, totalStartingBalance, classifyTradeOutcome]);

  const formatValue = (value: number, type: ChartDisplayType = displayType): string => {
    if (type === 'percent') {
      return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
    }
    if (type === 'winrate') {
      return `${value.toFixed(2)}%`;
    }
    if (type === 'tradecount') {
      return `${Math.round(value)}`;
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
        <div className="flex items-start justify-between mb-3 flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <ChartDisplayDropdown
              value={displayType}
              onValueChange={(v) => setDisplayType(v)}
            />

            <Select value={dateSetting} onValueChange={(v) => setDateSetting(v as DateSettingType)}>
              <SelectTrigger className="w-[130px] bg-background border-border h-auto py-1.5">
                <div className="flex flex-col items-start">
                  <span className="text-[10px] text-muted-foreground">Date</span>
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-popover border-border z-50">
                <SelectItem value="entry">Entry Date</SelectItem>
                <SelectItem value="exit">Exit Date</SelectItem>
              </SelectContent>
            </Select>

            <Select value={period} onValueChange={(v) => setPeriod(v as PeriodType)}>
              <SelectTrigger className="w-[150px] bg-background border-border h-auto py-1.5">
                <div className="flex flex-col items-start">
                  <span className="text-[10px] text-muted-foreground">Period</span>
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-popover border-border z-50">
                <SelectItem value="weekday">Weekday</SelectItem>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="hour">Hour of Day</SelectItem>
                <SelectItem value="2hour">2 Hour Interval</SelectItem>
                <SelectItem value="1hour">1 Hour Interval</SelectItem>
                <SelectItem value="30min">30 Min Interval</SelectItem>
                <SelectItem value="15min">15 Min Interval</SelectItem>
                <SelectItem value="10min">10 Min Interval</SelectItem>
                <SelectItem value="5min">5 Min Interval</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-profit" />
              <span className="text-xs text-muted-foreground">Profit</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-loss" />
              <span className="text-xs text-muted-foreground">Loss</span>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-[300px] w-full">
          {timeData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={timeData}
                margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
              >
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="hsl(var(--border))" 
                  opacity={0.3}
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  dy={5}
                  interval={period.includes('min') || period === '1hour' || period === '2hour' ? 'preserveStartEnd' : 0}
                  angle={period.includes('min') ? -45 : 0}
                  textAnchor={period.includes('min') ? 'end' : 'middle'}
                  height={period.includes('min') ? 50 : 25}
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
                    if (displayType === 'dollar' || displayType === 'avg_win' || displayType === 'avg_loss' || displayType === 'largest_win' || displayType === 'largest_loss') {
                      return `${currencyConfig.symbol}${value.toFixed(0)}`;
                    }
                    if (displayType === 'tradecount' || displayType === 'tradecount_long' || displayType === 'tradecount_short' || displayType === 'avg_trades_per_day' || displayType === 'median_trades_per_day' || displayType === '90th_percentile_trades') {
                      return value % 1 === 0 ? `${Math.round(value)}` : value.toFixed(1);
                    }
                    if (displayType === 'avg_hold_time' || displayType === 'longest_duration') {
                      return formatDurationTick(value);
                    }
                    if (displayType === 'percent' || displayType === 'winrate' || displayType === 'long_winrate' || displayType === 'short_winrate') {
                      return `${value.toFixed(0)}%`;
                    }
                    return `${value.toFixed(1)}%`;
                  }}
                  width={50}
                />
                
                <ReferenceLine 
                  y={0} 
                  stroke="hsl(var(--muted-foreground))" 
                  strokeWidth={1}
                  strokeDasharray="3 3"
                />

                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
                  content={({ active, payload }) => {
                    if (!active || !payload || payload.length === 0) return null;
                    const data = payload[0].payload as TimeData;
                    
                    if (displayType === 'tradecount') {
                      return (
                        <div className="bg-card border border-border rounded-lg p-3 shadow-lg z-50">
                          <p className="text-foreground font-medium mb-2">{data.label}</p>
                          <p className="text-sm text-foreground">
                            Trade Count: {data.tradeCount}
                          </p>
                        </div>
                      );
                    }
                    
                    if (displayType === 'avg_hold_time') {
                      return (
                        <div className="bg-card border border-border rounded-lg p-3 shadow-lg z-50">
                          <p className="text-foreground font-medium mb-2">{data.label}</p>
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
                        <div className="bg-card border border-border rounded-lg p-3 shadow-lg z-50">
                          <p className="text-foreground font-medium mb-2">{data.label}</p>
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
                        <div className="bg-card border border-border rounded-lg p-3 shadow-lg z-50">
                          <p className="text-foreground font-medium mb-2">{data.label}</p>
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
                              Breakeven: {data.breakevenCount}
                            </p>
                          </div>
                        </div>
                      );
                    }
                    
                    if (displayType === 'long_winrate') {
                      const longTotal = data.longWinCount + data.longLossCount;
                      return (
                        <div className="bg-card border border-border rounded-lg p-3 shadow-lg z-50">
                          <p className="text-foreground font-medium mb-2">{data.label}</p>
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
                        <div className="bg-card border border-border rounded-lg p-3 shadow-lg z-50">
                          <p className="text-foreground font-medium mb-2">{data.label}</p>
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
                        <div className="bg-card border border-border rounded-lg p-3 shadow-lg z-50">
                          <p className="text-foreground font-medium mb-2">{data.label}</p>
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
                        <div className="bg-card border border-border rounded-lg p-3 shadow-lg z-50">
                          <p className="text-foreground font-medium mb-2">{data.label}</p>
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
                        <div className="bg-card border border-border rounded-lg p-3 shadow-lg z-50">
                          <p className="text-foreground font-medium mb-2">{data.label}</p>
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
                        <div className="bg-card border border-border rounded-lg p-3 shadow-lg z-50">
                          <p className="text-foreground font-medium mb-2">{data.label}</p>
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
                        <div className="bg-card border border-border rounded-lg p-3 shadow-lg z-50">
                          <p className="text-foreground font-medium mb-2">{data.label}</p>
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
                        <div className="bg-card border border-border rounded-lg p-3 shadow-lg z-50">
                          <p className="text-foreground font-medium mb-2">{data.label}</p>
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
                        <div className="bg-card border border-border rounded-lg p-3 shadow-lg z-50">
                          <p className="text-foreground font-medium mb-2">{data.label}</p>
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
                        <div className="bg-card border border-border rounded-lg p-3 shadow-lg z-50">
                          <p className="text-foreground font-medium mb-2">{data.label}</p>
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
                        <div className="bg-card border border-border rounded-lg p-3 shadow-lg z-50">
                          <p className="text-foreground font-medium mb-2">{data.label}</p>
                          <div className="space-y-1 text-sm">
                            <p className="text-foreground">
                              90th Pctl Trades/Day: {data.percentile90TradesPerDay.toFixed(1)}
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
                    
                    // Dollar mode: show Net PNL + counts
                    if (displayType === 'dollar') {
                      return (
                        <div className="bg-card border border-border rounded-lg p-3 shadow-lg z-50">
                          <p className="text-foreground font-medium mb-2">{data.label}</p>
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
                              BE: {data.breakevenCount}
                            </p>
                          </div>
                        </div>
                      );
                    }
                    
                    // Percent mode: show Return % + counts
                    if (displayType === 'percent') {
                      return (
                        <div className="bg-card border border-border rounded-lg p-3 shadow-lg z-50">
                          <p className="text-foreground font-medium mb-2">{data.label}</p>
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
                              BE: {data.breakevenCount}
                            </p>
                          </div>
                        </div>
                      );
                    }
                    
                    // Tick/Pip and Privacy modes - placeholder
                    return (
                      <div className="bg-card border border-border rounded-lg p-3 shadow-lg z-50">
                        <p className="text-foreground font-medium mb-2">{data.label}</p>
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
                            BE: {data.breakevenCount}
                          </p>
                        </div>
                      </div>
                    );
                  }}
                />

                <Bar 
                  dataKey="displayValue" 
                  radius={[3, 3, 0, 0]}
                  maxBarSize={40}
                >
                  {timeData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`}
                      fill={
                        displayType === 'tradecount' || displayType === 'avg_hold_time' || displayType === 'longest_duration' || displayType === 'long_winrate' || displayType === 'short_winrate' || displayType === 'tradecount_long' || displayType === 'tradecount_short'
                          ? 'hsl(var(--primary))'
                          : displayType === 'winrate'
                            ? entry.displayValue >= 50 ? 'hsl(142, 71%, 45%)' : 'hsl(0, 84%, 60%)'
                            : entry.displayValue >= 0 ? 'hsl(142, 71%, 45%)' : 'hsl(0, 84%, 60%)'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full border border-dashed border-border rounded-xl bg-muted/20">
              <p className="text-muted-foreground text-sm">No closed trades available.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
