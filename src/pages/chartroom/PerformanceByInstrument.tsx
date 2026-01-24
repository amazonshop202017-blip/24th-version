import { useMemo, useState } from 'react';
import { useFilteredTradesContext } from '@/contexts/TradesContext';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
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

const PerformanceByInstrument = () => {
  const { filteredTrades } = useFilteredTradesContext();
  const { currencyConfig } = useGlobalFilters();
  const [displayType, setDisplayType] = useState<DisplayType>('dollar');

  // NOTE: Return (%) is now stored on each trade as savedReturnPercent
  // We use the stored value directly - never recalculate it

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
      totalPercent: number;
      tradeCount: number;
      winCount: number;
      lossCount: number;
      beCount: number;
    }>();

    closedTrades.forEach(trade => {
      const metrics = calculateTradeMetrics(trade);
      const normalizedSymbol = trade.symbol.toUpperCase();
      
      // Use stored Return % - skip trades without stored value
      const returnPercent = trade.savedReturnPercent;
      if (displayType === 'percent' && (returnPercent === undefined || returnPercent === null || !isFinite(returnPercent))) {
        return; // Skip this trade for percent mode
      }
      
      const existing = instrumentMap.get(normalizedSymbol) || { 
        totalPnl: 0, 
        totalPercent: 0,
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
        totalPercent: existing.totalPercent + (returnPercent ?? 0),
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
        let displayValue: number;
        
        switch (displayType) {
          case 'dollar':
            displayValue = data.totalPnl;
            break;
          case 'percent':
            displayValue = data.totalPercent;
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
          totalPercent: data.totalPercent,
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
  }, [filteredTrades, displayType]);

  // Calculate metrics
  const metrics = useMemo(() => {
    if (instrumentData.length === 0) {
      return {
        bestSum: { symbol: '-', value: 0 },
        worstSum: { symbol: '-', value: 0 },
        bestAvg: { symbol: '-', value: 0 },
        worstAvg: { symbol: '-', value: 0 },
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

    return {
      bestSum: { symbol: bestSum.symbol, value: displayType === 'dollar' ? bestSum.totalPnl : bestSum.totalPercent },
      worstSum: { symbol: worstSum.symbol, value: displayType === 'dollar' ? worstSum.totalPnl : worstSum.totalPercent },
      bestAvg: { symbol: bestAvg.symbol, value: displayType === 'dollar' ? bestAvg.avgPnl : bestAvg.totalPercent / bestAvg.tradeCount },
      worstAvg: { symbol: worstAvg.symbol, value: displayType === 'dollar' ? worstAvg.avgPnl : worstAvg.totalPercent / worstAvg.tradeCount },
    };
  }, [instrumentData, displayType]);

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
      label: 'Best Instrument Sum', 
      symbol: metrics.bestSum.symbol,
      value: formatValue(metrics.bestSum.value), 
      isPositive: metrics.bestSum.value >= 0 
    },
    { 
      label: 'Worst Instrument Sum', 
      symbol: metrics.worstSum.symbol,
      value: formatValue(metrics.worstSum.value), 
      isPositive: metrics.worstSum.value >= 0 
    },
    { 
      label: 'Best Instrument Avg', 
      symbol: metrics.bestAvg.symbol,
      value: formatValue(metrics.bestAvg.value), 
      isPositive: metrics.bestAvg.value >= 0 
    },
    { 
      label: 'Worst Instrument Avg', 
      symbol: metrics.worstAvg.symbol,
      value: formatValue(metrics.worstAvg.value), 
      isPositive: metrics.worstAvg.value >= 0 
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Performance by Instrument</h1>
        <p className="text-muted-foreground mt-1">Analyze your trading performance across different instruments.</p>
      </div>

      {/* Side-by-side Comparison Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <InstrumentPerformanceChart 
          defaultDisplayType="dollar" 
          title="Instrument Performance (Return $)" 
        />
        <InstrumentPerformanceChart 
          defaultDisplayType="winrate" 
          title="Instrument Performance (Winrate %)" 
        />
      </div>

      {/* Original Detailed Chart Container */}
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          {/* Header with Dropdowns */}
          <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <Select value={displayType} onValueChange={(v) => setDisplayType(v as DisplayType)}>
                <SelectTrigger className="w-[160px] bg-background border-border">
                  <div className="flex flex-col items-start">
                    <span className="text-xs text-muted-foreground">Display</span>
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dollar">Return ($)</SelectItem>
                  <SelectItem value="percent">Return (%)</SelectItem>
                  <SelectItem value="winrate">Winrate (%)</SelectItem>
                  <SelectItem value="tradecount">Trade Count</SelectItem>
                </SelectContent>
              </Select>

              <Select value="value" onValueChange={() => {}}>
                <SelectTrigger className="w-[160px] bg-background border-border">
                  <div className="flex flex-col items-start">
                    <span className="text-xs text-muted-foreground">Sort By</span>
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="value">By Value</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Legend - only show for profit/loss modes */}
            {(displayType === 'dollar' || displayType === 'percent') && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-profit" />
                  <span className="text-sm text-muted-foreground">Profit</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-loss" />
                  <span className="text-sm text-muted-foreground">Loss</span>
                </div>
              </div>
            )}
          </div>

          {/* Chart */}
          <div className="h-[400px] w-full">
            {instrumentData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={instrumentData}
                  margin={{ top: 20, right: 30, left: 10, bottom: 30 }}
                >
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="hsl(var(--border))" 
                    opacity={0.3}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="symbol"
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    dy={5}
                  />
                  <YAxis
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    tickFormatter={(value) => {
                      switch (displayType) {
                        case 'dollar':
                          return `${currencyConfig.symbol}${value.toFixed(0)}`;
                        case 'percent':
                        case 'winrate':
                          return `${value.toFixed(0)}%`;
                        case 'tradecount':
                          return `${Math.round(value)}`;
                        default:
                          return `${value}`;
                      }
                    }}
                    width={60}
                  />
                  
                  {/* Reference Line at 0 - only for dollar/percent modes */}
                  {(displayType === 'dollar' || displayType === 'percent') && (
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
                      const data = payload[0].payload as InstrumentData;
                      
                      if (displayType === 'tradecount') {
                        return (
                          <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                            <p className="text-foreground font-medium mb-2">{data.symbol}</p>
                            <p className="text-sm text-foreground">
                              Trade Count: {data.tradeCount}
                            </p>
                          </div>
                        );
                      }
                      
                      if (displayType === 'winrate') {
                        return (
                          <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                            <p className="text-foreground font-medium mb-2">{data.symbol}</p>
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
                      
                      return (
                        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                          <p className="text-foreground font-medium mb-2">{data.symbol}</p>
                          <div className="space-y-1 text-sm">
                            <p className={data.totalPnl >= 0 ? 'text-profit' : 'text-loss'}>
                              Total P&L: {formatValue(data.totalPnl, 'dollar')}
                            </p>
                            <p className={data.totalPercent >= 0 ? 'text-profit' : 'text-loss'}>
                              Total Return: {formatValue(data.totalPercent, 'percent')}
                            </p>
                            <p className="text-muted-foreground">
                              Trades: {data.tradeCount}
                            </p>
                            <p className="text-muted-foreground">
                              Win Rate: {data.winrate.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      );
                    }}
                  />

                  <Bar 
                    dataKey="displayValue" 
                    radius={[4, 4, 0, 0]}
                    maxBarSize={50}
                  >
                    {instrumentData.map((entry, index) => {
                      let fillColor: string;
                      if (displayType === 'winrate' || displayType === 'tradecount') {
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
                <p className="text-muted-foreground">No closed trades available for analysis.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metricsCards.map((metric) => (
          <Card key={metric.label} className="bg-card border-border">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">{metric.label}</p>
              <p className="text-sm text-foreground mb-1">{metric.symbol}</p>
              <p className={`text-lg font-semibold ${
                metric.isPositive ? 'text-green-500' : 'text-red-500'
              }`}>
                {metric.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Instrument Performance Table */}
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Instrument Performance</h3>
          {instrumentData.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-muted-foreground">Instrument</TableHead>
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
                          {avgValue >= 0 ? '+' : '-'}{formatTableValue(avgValue, displayType)}
                        </TableCell>
                        <TableCell className={`text-right ${totalValue >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {totalValue >= 0 ? '+' : '-'}{formatTableValue(totalValue, displayType)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 border border-dashed border-border rounded-xl bg-muted/20">
              <p className="text-muted-foreground">No instrument data available.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceByInstrument;
