import { useMemo, useState } from 'react';
import { useFilteredTrades } from '@/hooks/useFilteredTrades';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { useAccountsContext } from '@/contexts/AccountsContext';
import { usePrivacyMode } from '@/hooks/usePrivacyMode';
import { calculateTradeMetrics, Trade } from '@/types/trade';
import { parseISO, getDay, getMonth, getWeek, getHours, getMinutes } from 'date-fns';
import { ChartDisplayType, mapGlobalToChartDisplay } from '@/hooks/useChartDisplayMode';
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
    const closedTrades = filteredTrades.filter((trade: Trade) => {
      const metrics = calculateTradeMetrics(trade);
      return metrics.positionStatus === 'CLOSED';
    });

    if (closedTrades.length === 0) return [];

    const timeMap = new Map<string, {
      sortOrder: number;
      totalPnl: number;
      tradeCount: number;
      winCount: number;
      lossCount: number;
      breakevenCount: number;
    }>();

    closedTrades.forEach(trade => {
      const metrics = calculateTradeMetrics(trade);
      
      const dateStr = dateSetting === 'entry' ? metrics.openDate : metrics.closeDate;
      if (!dateStr) return;
      
      const date = parseISO(dateStr);
      const bucket = getBucket(date, period);

      // Use global classifyTradeOutcome for consistent classification
      const outcome = classifyTradeOutcome(metrics.netPnl, trade.savedReturnPercent, trade.breakEven);
      
      const existing = timeMap.get(bucket.label) || { 
        sortOrder: bucket.sortOrder,
        totalPnl: 0, 
        tradeCount: 0, 
        winCount: 0,
        lossCount: 0,
        breakevenCount: 0,
      };
      
      timeMap.set(bucket.label, {
        sortOrder: bucket.sortOrder,
        totalPnl: existing.totalPnl + metrics.netPnl,
        tradeCount: existing.tradeCount + 1,
        winCount: existing.winCount + (outcome === 'win' ? 1 : 0),
        lossCount: existing.lossCount + (outcome === 'loss' ? 1 : 0),
        breakevenCount: existing.breakevenCount + (outcome === 'breakeven' ? 1 : 0),
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
          case 'dollar':
          default:
            displayValue = data.totalPnl;
            break;
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
            <Select value={displayType} onValueChange={(v) => setDisplayType(v as ChartDisplayType)}>
              <SelectTrigger className="w-[140px] bg-background border-border h-auto py-1.5">
                <div className="flex flex-col items-start">
                  <span className="text-[10px] text-muted-foreground">Display</span>
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-popover border-border z-50">
                <SelectItem value="dollar">Return ($)</SelectItem>
                <SelectItem value="percent">Return (%)</SelectItem>
                <SelectItem value="winrate">Winrate (%)</SelectItem>
                <SelectItem value="tradecount">Trade Count</SelectItem>
                <SelectItem value="tickpip">Tick / Pip</SelectItem>
              </SelectContent>
            </Select>

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
                    if (isPrivacyMode && (displayType === 'dollar' || displayType === 'percent')) {
                      return '**';
                    }
                    if (displayType === 'dollar') {
                      return `${currencyConfig.symbol}${value.toFixed(0)}`;
                    }
                    if (displayType === 'tradecount') {
                      return `${Math.round(value)}`;
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
                        displayType === 'tradecount'
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
