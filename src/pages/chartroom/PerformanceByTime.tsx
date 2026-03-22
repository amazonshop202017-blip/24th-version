import { useMemo, useState } from 'react';
import { useFilteredTrades } from '@/hooks/useFilteredTrades';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { useAccountsContext } from '@/contexts/AccountsContext';
import { usePrivacyMode, PRIVACY_MASK } from '@/hooks/usePrivacyMode';
import { calculateTradeMetrics, Trade } from '@/types/trade';
import { parseISO, getDay, getMonth, getWeek, getHours, getMinutes, format } from 'date-fns';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PerformanceByTimeChart } from '@/components/chartroom/PerformanceByTimeChart';

type DisplayType = 'dollar' | 'percent' | 'winrate' | 'tradecount';
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
  displayValue: number;
}

const WEEKDAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const PerformanceByTime = () => {
  const { filteredTrades } = useFilteredTrades();
  const { currencyConfig, selectedAccounts, isAllAccountsSelected } = useGlobalFilters();
  const { accounts, getAccountBalanceBeforeTrades } = useAccountsContext();
  const { isPrivacyMode } = usePrivacyMode();
  
  const [displayType, setDisplayType] = useState<DisplayType>('dollar');
  const [dateSetting, setDateSetting] = useState<DateSettingType>('entry');
  const [period, setPeriod] = useState<PeriodType>('weekday');

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

  // Generate all possible buckets for a period
  const getAllBuckets = (periodType: PeriodType): { label: string; sortOrder: number }[] => {
    switch (periodType) {
      case 'weekday':
        // Monday to Sunday (reorder for display)
        return [
          { label: 'Monday', sortOrder: 1 },
          { label: 'Tuesday', sortOrder: 2 },
          { label: 'Wednesday', sortOrder: 3 },
          { label: 'Thursday', sortOrder: 4 },
          { label: 'Friday', sortOrder: 5 },
          { label: 'Saturday', sortOrder: 6 },
          { label: 'Sunday', sortOrder: 0 },
        ];
      case 'month':
        return MONTH_LABELS.map((label, i) => ({ label, sortOrder: i }));
      case 'week':
        // Generate week numbers 1-53
        return Array.from({ length: 53 }, (_, i) => ({
          label: `Week ${i + 1}`,
          sortOrder: i + 1,
        }));
      case 'hour':
        return Array.from({ length: 24 }, (_, i) => ({
          label: `${String(i).padStart(2, '0')}:00`,
          sortOrder: i,
        }));
      case '2hour':
        return Array.from({ length: 12 }, (_, i) => ({
          label: `${String(i * 2).padStart(2, '0')}–${String(i * 2 + 2).padStart(2, '0')}`,
          sortOrder: i,
        }));
      case '1hour':
        return Array.from({ length: 24 }, (_, i) => ({
          label: `${String(i).padStart(2, '0')}–${String(i + 1).padStart(2, '0')}`,
          sortOrder: i,
        }));
      case '30min':
        return Array.from({ length: 48 }, (_, i) => {
          const startHour = Math.floor(i / 2);
          const startMin = (i % 2) * 30;
          const endMin = startMin + 30;
          const endHour = endMin === 60 ? startHour + 1 : startHour;
          return {
            label: `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}–${String(endHour).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`,
            sortOrder: i,
          };
        });
      case '15min':
        return Array.from({ length: 96 }, (_, i) => {
          const startHour = Math.floor(i / 4);
          const startMin = (i % 4) * 15;
          const endMin = startMin + 15;
          const endHour = endMin === 60 ? startHour + 1 : startHour;
          return {
            label: `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}–${String(endHour).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`,
            sortOrder: i,
          };
        });
      case '10min':
        return Array.from({ length: 144 }, (_, i) => {
          const startHour = Math.floor(i / 6);
          const startMin = (i % 6) * 10;
          const endMin = startMin + 10;
          const endHour = endMin === 60 ? startHour + 1 : startHour;
          return {
            label: `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}–${String(endHour).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`,
            sortOrder: i,
          };
        });
      case '5min':
        return Array.from({ length: 288 }, (_, i) => {
          const startHour = Math.floor(i / 12);
          const startMin = (i % 12) * 5;
          const endMin = startMin + 5;
          const endHour = endMin === 60 ? startHour + 1 : startHour;
          return {
            label: `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}–${String(endHour).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`,
            sortOrder: i,
          };
        });
      default:
        return [];
    }
  };

  // Get bucket for a trade based on period
  const getBucket = (date: Date, periodType: PeriodType): { label: string; sortOrder: number } => {
    const dayOfWeek = getDay(date); // 0 = Sunday
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

    // Group trades by time bucket
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
      
      // Use entry or exit date based on setting
      const dateStr = dateSetting === 'entry' ? metrics.openDate : metrics.closeDate;
      if (!dateStr) return;
      
      const date = parseISO(dateStr);
      const bucket = getBucket(date, period);

      const isWin = metrics.netPnl > 0;
      const isLoss = metrics.netPnl < 0;
      const isBreakeven = metrics.netPnl === 0;
      
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
        winCount: existing.winCount + (isWin ? 1 : 0),
        lossCount: existing.lossCount + (isLoss ? 1 : 0),
        breakevenCount: existing.breakevenCount + (isBreakeven ? 1 : 0),
      });
    });

    // Convert to array and calculate display values
    const data: TimeData[] = Array.from(timeMap.entries())
      .map(([label, data]) => {
        const winrate = data.tradeCount > 0 ? (data.winCount / data.tradeCount) * 100 : 0;
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
          displayValue,
        };
      })
      // Sort by natural period order
      .sort((a, b) => a.sortOrder - b.sortOrder);

    return data;
  }, [filteredTrades, displayType, dateSetting, period, totalStartingBalance]);

  // Get period label for metrics cards
  const getPeriodLabel = (): string => {
    switch (period) {
      case 'weekday': return 'Day';
      case 'month': return 'Month';
      case 'week': return 'Week';
      case 'hour':
      case '2hour':
      case '1hour':
      case '30min':
      case '15min':
      case '10min':
      case '5min':
        return 'Hour';
      default:
        return 'Period';
    }
  };

  // Calculate metrics
  const metrics = useMemo(() => {
    if (timeData.length === 0) {
      return {
        best: { label: '-', value: 0 },
        worst: { label: '-', value: 0 },
        mostTraded: { label: '-', count: 0 },
        bestWinrate: { label: '-', value: 0 },
        avgTrades: 0,
        avgPnl: 0,
      };
    }

    // Best/Worst by display value
    const sortedByValue = [...timeData].sort((a, b) => b.displayValue - a.displayValue);
    const best = sortedByValue[0];
    const worst = sortedByValue[sortedByValue.length - 1];

    // Most traded
    const sortedByTrades = [...timeData].sort((a, b) => b.tradeCount - a.tradeCount);
    const mostTraded = sortedByTrades[0];

    // Best winrate
    const sortedByWinrate = [...timeData].sort((a, b) => {
      const winrateA = a.tradeCount > 0 ? (a.winCount / a.tradeCount) * 100 : 0;
      const winrateB = b.tradeCount > 0 ? (b.winCount / b.tradeCount) * 100 : 0;
      return winrateB - winrateA;
    });
    const bestWinrate = sortedByWinrate[0];
    const bestWinrateValue = bestWinrate.tradeCount > 0 
      ? (bestWinrate.winCount / bestWinrate.tradeCount) * 100 
      : 0;

    // Average trades per period
    const totalTrades = timeData.reduce((sum, d) => sum + d.tradeCount, 0);
    const avgTrades = totalTrades / timeData.length;

    // Average P&L per period
    const totalPnl = timeData.reduce((sum, d) => sum + d.totalPnl, 0);
    const avgPnl = totalPnl / timeData.length;

    return {
      best: { label: best.label, value: best.displayValue },
      worst: { label: worst.label, value: worst.displayValue },
      mostTraded: { label: mostTraded.label, count: mostTraded.tradeCount },
      bestWinrate: { label: bestWinrate.label, value: bestWinrateValue },
      avgTrades,
      avgPnl,
    };
  }, [timeData, displayType]);

  // Format value based on display type
  const formatValue = (value: number, type: DisplayType = displayType): string => {
    // Mask $ and % values in privacy mode
    if (isPrivacyMode && (type === 'percent' || type === 'dollar')) {
      return '**';
    }
    if (type === 'percent') {
      return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
    }
    if (type === 'winrate') {
      return `${value.toFixed(2)}%`;
    }
    if (type === 'tradecount') {
      return `${Math.round(value)}`;
    }
    const absValue = Math.abs(value);
    if (absValue >= 1000) {
      return `${value >= 0 ? '+' : '-'}${currencyConfig.symbol}${(absValue / 1000).toFixed(1)}k`;
    }
    return `${value >= 0 ? '+' : '-'}${currencyConfig.symbol}${absValue.toFixed(2)}`;
  };

  const periodLabel = getPeriodLabel();

  const metricsCards = [
    { 
      label: `Best ${periodLabel}`, 
      period: metrics.best.label,
      value: formatValue(metrics.best.value), 
      isPositive: displayType === 'winrate' || metrics.best.value >= 0 
    },
    { 
      label: `Worst ${periodLabel}`, 
      period: metrics.worst.label,
      value: formatValue(metrics.worst.value), 
      isPositive: displayType === 'winrate' ? metrics.worst.value >= 50 : metrics.worst.value >= 0 
    },
    { 
      label: `Trades per ${periodLabel}`, 
      period: null,
      value: metrics.avgTrades.toFixed(2), 
      isPositive: true,
      isNeutral: true
    },
    { 
      label: `Avg ${periodLabel} P/L`, 
      period: null,
      value: formatValue(metrics.avgPnl, 'dollar'), 
      isPositive: metrics.avgPnl >= 0 
    },
  ];

  return (
    <div className="space-y-6">

      {/* Side-by-Side Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PerformanceByTimeChart defaultDisplayType="dollar" useGlobalDefault={true} />
        <PerformanceByTimeChart defaultDisplayType="winrate" useGlobalDefault={false} />
      </div>


      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metricsCards.map((metric) => (
          <Card key={metric.label} className="bg-card border-border">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">{metric.label}</p>
              {metric.period && (
                <p className="text-sm text-foreground mb-1 truncate" title={metric.period}>{metric.period}</p>
              )}
              <p className={`text-lg font-semibold ${
                metric.isNeutral 
                  ? 'text-foreground' 
                  : metric.isPositive ? 'text-profit' : 'text-loss'
              }`}>
                {metric.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance Table */}
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          {timeData.length > 0 ? (
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-muted-foreground sticky top-0 bg-card">{periodLabel}</TableHead>
                    <TableHead className="text-muted-foreground text-right sticky top-0 bg-card">Trades</TableHead>
                    <TableHead className="text-muted-foreground text-right sticky top-0 bg-card">Winrate (%)</TableHead>
                    <TableHead className="text-muted-foreground text-right sticky top-0 bg-card">Avg P/L ($)</TableHead>
                    <TableHead className="text-muted-foreground text-right sticky top-0 bg-card">Total Gain ($)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timeData.map((row) => {
                    const winrate = row.tradeCount > 0 ? (row.winCount / row.tradeCount) * 100 : 0;
                    const avgPnl = row.tradeCount > 0 ? row.totalPnl / row.tradeCount : 0;
                    
                    return (
                      <TableRow key={row.label} className="border-border">
                        <TableCell className="text-foreground font-medium">{row.label}</TableCell>
                        <TableCell className="text-foreground text-right">{row.tradeCount}</TableCell>
                        <TableCell className="text-foreground text-right">{winrate.toFixed(2)}</TableCell>
                        <TableCell className={`text-right ${avgPnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                          {isPrivacyMode ? PRIVACY_MASK : `${avgPnl >= 0 ? '' : '-'}${currencyConfig.symbol}${Math.abs(avgPnl).toFixed(2)}`}
                        </TableCell>
                        <TableCell className={`text-right ${row.totalPnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                          {isPrivacyMode ? PRIVACY_MASK : `${row.totalPnl >= 0 ? '' : '-'}${currencyConfig.symbol}${Math.abs(row.totalPnl).toFixed(2)}`}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 border border-dashed border-border rounded-xl bg-muted/20">
              <p className="text-muted-foreground">No trades data available.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceByTime;
