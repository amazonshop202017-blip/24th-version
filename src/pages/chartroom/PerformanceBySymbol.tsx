import { useMemo, useState } from 'react';
import { useFilteredTrades } from '@/hooks/useFilteredTrades';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { useAccountsContext } from '@/contexts/AccountsContext';
import { usePrivacyMode, PRIVACY_MASK } from '@/hooks/usePrivacyMode';
import { calculateTradeMetrics, Trade } from '@/types/trade';
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
import { InstrumentPerformanceChart } from '@/components/chartroom/InstrumentPerformanceChart';

type DisplayType = 'dollar' | 'percent' | 'winrate' | 'tradecount';

interface InstrumentData {
  symbol: string;
  totalPnl: number;
  totalPercent: number;
  tradeCount: number;
  winCount: number;
  lossCount: number;
  beCount: number;
  avgPnl: number;
  winrate: number;
  displayValue: number;
}

const PerformanceBySymbol = () => {
  const { filteredTrades } = useFilteredTrades();
  const { currencyConfig, selectedAccounts, isAllAccountsSelected } = useGlobalFilters();
  const { accounts, getAccountBalanceBeforeTrades } = useAccountsContext();
  const { isPrivacyMode } = usePrivacyMode();
  const [displayType, setDisplayType] = useState<DisplayType>('dollar');

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

  // Calculate instrument data
  const instrumentData = useMemo(() => {
    const closedTrades = filteredTrades.filter((trade: Trade) => {
      const metrics = calculateTradeMetrics(trade);
      return metrics.positionStatus === 'CLOSED';
    });

    if (closedTrades.length === 0) return [];

    // Group trades by instrument symbol
    const instrumentMap = new Map<string, {
      totalPnl: number;
      tradeCount: number;
      winCount: number;
      lossCount: number;
      beCount: number;
    }>();

    closedTrades.forEach(trade => {
      const metrics = calculateTradeMetrics(trade);
      const normalizedSymbol = trade.symbol.toUpperCase();
      
      const existing = instrumentMap.get(normalizedSymbol) || { 
        totalPnl: 0, 
        tradeCount: 0, 
        winCount: 0,
        lossCount: 0,
        beCount: 0
      };
      
      // Determine win/loss/breakeven
      const isWin = metrics.netPnl > 0;
      const isLoss = metrics.netPnl < 0;
      const isBe = metrics.netPnl === 0;
      
      instrumentMap.set(normalizedSymbol, {
        totalPnl: existing.totalPnl + metrics.netPnl,
        tradeCount: existing.tradeCount + 1,
        winCount: existing.winCount + (isWin ? 1 : 0),
        lossCount: existing.lossCount + (isLoss ? 1 : 0),
        beCount: existing.beCount + (isBe ? 1 : 0),
      });
    });

    // Convert to array and calculate averages
    const data: InstrumentData[] = Array.from(instrumentMap.entries())
      .map(([symbol, data]) => {
        const winrate = data.tradeCount > 0 ? (data.winCount / data.tradeCount) * 100 : 0;
        // Calculate Return (%) correctly: Total P/L ÷ Account Starting Balance × 100
        const returnPercent = totalStartingBalance > 0 
          ? (data.totalPnl / totalStartingBalance) * 100 
          : 0;
        
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
          default:
            displayValue = data.totalPnl;
        }
        
        return {
          symbol,
          totalPnl: data.totalPnl,
          totalPercent: returnPercent,
          tradeCount: data.tradeCount,
          winCount: data.winCount,
          lossCount: data.lossCount,
          beCount: data.beCount,
          avgPnl: data.totalPnl / data.tradeCount,
          winrate,
          displayValue,
        };
      })
      // Sort by value descending (best first)
      .sort((a, b) => b.displayValue - a.displayValue);

    return data;
  }, [filteredTrades, displayType, totalStartingBalance]);

  // Calculate metrics
  const metrics = useMemo(() => {
    if (instrumentData.length === 0) {
      return {
        bestSum: { symbol: '-', value: 0 },
        worstSum: { symbol: '-', value: 0 },
        bestAvg: { symbol: '-', value: 0 },
        worstAvg: { symbol: '-', value: 0 },
        bestWinRate: { symbol: '-', value: 0 },
        worstWinRate: { symbol: '-', value: 0 },
      };
    }

    // Best/Worst by sum (total P&L)
    const sortedBySum = [...instrumentData].sort((a, b) => b.totalPnl - a.totalPnl);
    const bestSum = sortedBySum[0];
    const worstSum = sortedBySum[sortedBySum.length - 1];

    // Best/Worst by average P&L
    const sortedByAvg = [...instrumentData].sort((a, b) => b.avgPnl - a.avgPnl);
    const bestAvg = sortedByAvg[0];
    const worstAvg = sortedByAvg[sortedByAvg.length - 1];

    // Best/Worst by winrate
    const sortedByWinRate = [...instrumentData].sort((a, b) => b.winrate - a.winrate);
    const bestWinRate = sortedByWinRate[0];
    const worstWinRate = sortedByWinRate[sortedByWinRate.length - 1];

    return {
      bestSum: { symbol: bestSum.symbol, value: displayType === 'dollar' ? bestSum.totalPnl : bestSum.totalPercent },
      worstSum: { symbol: worstSum.symbol, value: displayType === 'dollar' ? worstSum.totalPnl : worstSum.totalPercent },
      bestAvg: { symbol: bestAvg.symbol, value: displayType === 'dollar' ? bestAvg.avgPnl : bestAvg.totalPercent / bestAvg.tradeCount },
      worstAvg: { symbol: worstAvg.symbol, value: displayType === 'dollar' ? worstAvg.avgPnl : worstAvg.totalPercent / worstAvg.tradeCount },
      bestWinRate: { symbol: bestWinRate.symbol, value: bestWinRate.winrate },
      worstWinRate: { symbol: worstWinRate.symbol, value: worstWinRate.winrate },
    };
  }, [instrumentData, displayType]);

  // Format currency
  const formatValue = (value: number, forceType?: DisplayType): string => {
    const type = forceType || displayType;
    // Mask $ and % values in privacy mode
    if (isPrivacyMode && (type === 'percent' || type === 'dollar')) {
      return '**';
    }
    if (type === 'percent') {
      return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
    }
    const absValue = Math.abs(value);
    if (absValue >= 1000) {
      return `${value >= 0 ? '+' : '-'}${currencyConfig.symbol}${(absValue / 1000).toFixed(1)}k`;
    }
    return `${value >= 0 ? '+' : '-'}${currencyConfig.symbol}${absValue.toFixed(2)}`;
  };

  // Format for table (without +/- prefix handled separately)
  const formatTableValue = (value: number, type: DisplayType): string => {
    // Mask $ and % values in privacy mode
    if (isPrivacyMode && (type === 'percent' || type === 'dollar')) {
      return PRIVACY_MASK;
    }
    if (type === 'percent') {
      return `${value.toFixed(2)}%`;
    }
    return `${currencyConfig.symbol}${Math.abs(value).toFixed(2)}`;
  };

  const metricsCards = [
    { 
      label: 'Best Symbol Sum', 
      symbol: metrics.bestSum.symbol,
      value: formatValue(metrics.bestSum.value), 
      isPositive: metrics.bestSum.value >= 0 
    },
    { 
      label: 'Worst Symbol Sum', 
      symbol: metrics.worstSum.symbol,
      value: formatValue(metrics.worstSum.value), 
      isPositive: metrics.worstSum.value >= 0 
    },
    { 
      label: 'Best Symbol Avg', 
      symbol: metrics.bestAvg.symbol,
      value: formatValue(metrics.bestAvg.value), 
      isPositive: metrics.bestAvg.value >= 0 
    },
    { 
      label: 'Worst Symbol Avg', 
      symbol: metrics.worstAvg.symbol,
      value: formatValue(metrics.worstAvg.value), 
      isPositive: metrics.worstAvg.value >= 0 
    },
    { 
      label: 'Best Winrate Symbol', 
      symbol: metrics.bestWinRate.symbol,
      value: `${metrics.bestWinRate.value.toFixed(1)}%`, 
      isPositive: true 
    },
    { 
      label: 'Worst Winrate Symbol', 
      symbol: metrics.worstWinRate.symbol,
      value: `${metrics.worstWinRate.value.toFixed(1)}%`, 
      isPositive: false 
    },
  ];

  return (
    <div className="space-y-6">

      {/* Side-by-side Comparison Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <InstrumentPerformanceChart 
          defaultDisplayType="dollar" 
          title="Symbol Performance 1"
          useGlobalDefault={true}
        />
        <InstrumentPerformanceChart 
          defaultDisplayType="winrate" 
          title="Symbol Performance 2"
          useGlobalDefault={false}
        />
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {metricsCards.map((metric) => (
          <Card key={metric.label} className="bg-card border-border">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">{metric.label}</p>
              <p className="text-sm text-foreground mb-1 truncate" title={metric.symbol}>{metric.symbol}</p>
              <p className={`text-lg font-semibold ${
                metric.isPositive ? 'text-profit' : 'text-loss'
              }`}>
                {metric.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Symbol Performance Table */}
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Symbol Performance</h3>
          {instrumentData.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-muted-foreground">Symbol</TableHead>
                    <TableHead className="text-muted-foreground text-right">Trades</TableHead>
                    <TableHead className="text-muted-foreground text-right">Winrate (%)</TableHead>
                    <TableHead className="text-muted-foreground text-right">Avg P/L</TableHead>
                    <TableHead className="text-muted-foreground text-right">Total Gain</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {instrumentData.map((row) => {
                    const winrate = (row.winCount / row.tradeCount) * 100;
                    const avgValue = displayType === 'dollar' 
                      ? row.avgPnl 
                      : row.totalPercent / row.tradeCount;
                    const totalValue = displayType === 'dollar' 
                      ? row.totalPnl 
                      : row.totalPercent;
                    
                    return (
                      <TableRow key={row.symbol} className="border-border">
                        <TableCell className="text-foreground font-medium">{row.symbol}</TableCell>
                        <TableCell className="text-foreground text-right">{row.tradeCount}</TableCell>
                        <TableCell className="text-foreground text-right">{winrate.toFixed(1)}%</TableCell>
                        <TableCell className={`text-right ${avgValue >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {isPrivacyMode && displayType === 'dollar' ? PRIVACY_MASK : `${avgValue >= 0 ? '+' : '-'}${formatTableValue(avgValue, displayType)}`}
                        </TableCell>
                        <TableCell className={`text-right ${totalValue >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {isPrivacyMode && displayType === 'dollar' ? PRIVACY_MASK : `${totalValue >= 0 ? '+' : '-'}${formatTableValue(totalValue, displayType)}`}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 border border-dashed border-border rounded-xl bg-muted/20">
              <p className="text-muted-foreground">No symbol data available.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceBySymbol;
