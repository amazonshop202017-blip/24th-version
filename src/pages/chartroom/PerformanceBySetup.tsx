import { useMemo, useState } from 'react';
import { useFilteredTrades } from '@/hooks/useFilteredTrades';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { useAccountsContext } from '@/contexts/AccountsContext';
import { calculateTradeMetrics, Trade } from '@/types/trade';
import { useStrategiesContext } from '@/contexts/StrategiesContext';
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
import { SetupPerformanceChart } from '@/components/chartroom/SetupPerformanceChart';

type DisplayType = 'dollar' | 'percent' | 'winrate' | 'tradecount';

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
}

const PerformanceBySetup = () => {
  const { filteredTrades } = useFilteredTrades();
  const { currencyConfig, selectedAccounts, isAllAccountsSelected } = useGlobalFilters();
  const { accounts, getAccountBalanceBeforeTrades } = useAccountsContext();
  const { strategies } = useStrategiesContext();
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

  // Calculate setup data - SETUP-CENTRIC approach
  const setupData = useMemo(() => {
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

    // SETUP-CENTRIC: First, iterate over all setups and collect their trades
    const setupMap = new Map<string, {
      totalPnl: number;
      tradeCount: number;
      winCount: number;
      lossCount: number;
      beCount: number;
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
        beCount: 0
      };
      
      // Determine win/loss/breakeven
      const isWin = metrics.netPnl > 0;
      const isLoss = metrics.netPnl < 0;
      const isBe = metrics.netPnl === 0;
      
      setupMap.set(setupName, {
        totalPnl: existing.totalPnl + metrics.netPnl,
        tradeCount: existing.tradeCount + 1,
        winCount: existing.winCount + (isWin ? 1 : 0),
        lossCount: existing.lossCount + (isLoss ? 1 : 0),
        beCount: existing.beCount + (isBe ? 1 : 0),
      });
    });

    // Convert to array and calculate averages
    const data: SetupData[] = Array.from(setupMap.entries())
      .map(([setup, data]) => {
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
        };
      })
      // Sort by value descending (best first)
      .sort((a, b) => b.displayValue - a.displayValue);

    return data;
  }, [filteredTrades, displayType, strategies, totalStartingBalance]);

  // Calculate metrics
  const metrics = useMemo(() => {
    if (setupData.length === 0) {
      return {
        bestSum: { setup: '-', value: 0 },
        worstSum: { setup: '-', value: 0 },
        bestAvg: { setup: '-', value: 0 },
        worstAvg: { setup: '-', value: 0 },
      };
    }

    // Best/Worst by sum (total P&L)
    const sortedBySum = [...setupData].sort((a, b) => b.totalPnl - a.totalPnl);
    const bestSum = sortedBySum[0];
    const worstSum = sortedBySum[sortedBySum.length - 1];

    // Best/Worst by average P&L
    const sortedByAvg = [...setupData].sort((a, b) => b.avgPnl - a.avgPnl);
    const bestAvg = sortedByAvg[0];
    const worstAvg = sortedByAvg[sortedByAvg.length - 1];

    return {
      bestSum: { setup: bestSum.setup, value: displayType === 'dollar' ? bestSum.totalPnl : bestSum.totalPercent },
      worstSum: { setup: worstSum.setup, value: displayType === 'dollar' ? worstSum.totalPnl : worstSum.totalPercent },
      bestAvg: { setup: bestAvg.setup, value: displayType === 'dollar' ? bestAvg.avgPnl : bestAvg.totalPercent / bestAvg.tradeCount },
      worstAvg: { setup: worstAvg.setup, value: displayType === 'dollar' ? worstAvg.avgPnl : worstAvg.totalPercent / worstAvg.tradeCount },
    };
  }, [setupData, displayType]);

  // Format currency
  const formatValue = (value: number, forceType?: DisplayType): string => {
    const type = forceType || displayType;
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
    if (type === 'percent') {
      return `${value.toFixed(2)}%`;
    }
    return `${currencyConfig.symbol}${Math.abs(value).toFixed(2)}`;
  };

  const metricsCards = [
    { 
      label: 'Best Setup Sum', 
      setup: metrics.bestSum.setup,
      value: formatValue(metrics.bestSum.value), 
      isPositive: metrics.bestSum.value >= 0 
    },
    { 
      label: 'Worst Setup Sum', 
      setup: metrics.worstSum.setup,
      value: formatValue(metrics.worstSum.value), 
      isPositive: metrics.worstSum.value >= 0 
    },
    { 
      label: 'Best Setup Avg', 
      setup: metrics.bestAvg.setup,
      value: formatValue(metrics.bestAvg.value), 
      isPositive: metrics.bestAvg.value >= 0 
    },
    { 
      label: 'Worst Setup Avg', 
      setup: metrics.worstAvg.setup,
      value: formatValue(metrics.worstAvg.value), 
      isPositive: metrics.worstAvg.value >= 0 
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Performance by Setup</h1>
        <p className="text-muted-foreground mt-1">Analyze your trading performance across different setups and patterns.</p>
      </div>

      {/* Side-by-side Comparison Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SetupPerformanceChart 
          defaultDisplayType="dollar" 
          title="Setup Performance 1" 
          syncWithGlobalDisplay={true}
          isLeftChart={true}
        />
        <SetupPerformanceChart 
          defaultDisplayType="winrate" 
          title="Setup Performance 2" 
          syncWithGlobalDisplay={true}
          isLeftChart={false}
        />
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metricsCards.map((metric) => (
          <Card key={metric.label} className="bg-card border-border">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">{metric.label}</p>
              <p className="text-sm text-foreground mb-1">{metric.setup}</p>
              <p className={`text-lg font-semibold ${
                metric.isPositive ? 'text-green-500' : 'text-red-500'
              }`}>
                {metric.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Setup Performance Table */}
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Setup Performance</h3>
          {setupData.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-muted-foreground">Setup</TableHead>
                    <TableHead className="text-muted-foreground text-right">Trades</TableHead>
                    <TableHead className="text-muted-foreground text-right">Winrate (%)</TableHead>
                    <TableHead className="text-muted-foreground text-right">Avg P/L ($)</TableHead>
                    <TableHead className="text-muted-foreground text-right">Total Gain ($)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {setupData.map((row) => {
                    const winrate = (row.winCount / row.tradeCount) * 100;
                    
                    return (
                      <TableRow key={row.setup} className="border-border">
                        <TableCell className="text-foreground font-medium">{row.setup}</TableCell>
                        <TableCell className="text-foreground text-right">{row.tradeCount}</TableCell>
                        <TableCell className="text-foreground text-right">{winrate.toFixed(1)}%</TableCell>
                        <TableCell className={`text-right ${row.avgPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {row.avgPnl >= 0 ? '+' : '-'}{currencyConfig.symbol}{Math.abs(row.avgPnl).toFixed(2)}
                        </TableCell>
                        <TableCell className={`text-right ${row.totalPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {row.totalPnl >= 0 ? '+' : '-'}{currencyConfig.symbol}{Math.abs(row.totalPnl).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 border border-dashed border-border rounded-xl bg-muted/20">
              <p className="text-muted-foreground">No setup data available.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceBySetup;
