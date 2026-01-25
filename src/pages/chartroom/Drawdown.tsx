import { useMemo, useState } from 'react';
import { useFilteredTradesContext } from '@/contexts/TradesContext';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { useAccountsContext } from '@/contexts/AccountsContext';
import { calculateTradeMetrics } from '@/types/trade';
import { parseISO } from 'date-fns';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Info } from 'lucide-react';
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const Drawdown = () => {
  const { filteredTrades } = useFilteredTradesContext();
  const { selectedAccounts, isAllAccountsSelected, currencyConfig } = useGlobalFilters();
  const { accounts, getAccountBalanceBeforeTrades } = useAccountsContext();
  const [displayType, setDisplayType] = useState('return');

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

  // Calculate drawdown data trade by trade
  const drawdownData = useMemo(() => {
    // Sort trades by close date
    const sortedTrades = [...filteredTrades]
      .filter(trade => {
        const metrics = calculateTradeMetrics(trade);
        return metrics.positionStatus === 'CLOSED' && metrics.closeDate;
      })
      .sort((a, b) => {
        const metricsA = calculateTradeMetrics(a);
        const metricsB = calculateTradeMetrics(b);
        return parseISO(metricsA.closeDate).getTime() - parseISO(metricsB.closeDate).getTime();
      });

    if (sortedTrades.length === 0) return [];

    let peak = 0;
    let cumulativePnl = 0;
    
    return sortedTrades.map((trade, index) => {
      const metrics = calculateTradeMetrics(trade);
      cumulativePnl += metrics.netPnl;
      
      // Update peak if we've reached a new high
      if (cumulativePnl > peak) {
        peak = cumulativePnl;
      }
      
      // Drawdown is the difference from peak (always 0 or negative)
      const drawdown = cumulativePnl - peak;
      
      // Calculate Return (%) correctly: Drawdown ÷ Account Starting Balance × 100
      const drawdownPercent = totalStartingBalance > 0 
        ? (drawdown / totalStartingBalance) * 100 
        : 0;
      
      return {
        trade: index + 1,
        drawdown: drawdown,
        drawdownPercent: drawdownPercent,
        cumulativePnl,
        peak,
      };
    });
  }, [filteredTrades, totalStartingBalance]);

  // Calculate min drawdown for Y-axis domain based on display type
  const minDrawdown = useMemo(() => {
    if (drawdownData.length === 0) return displayType === 'percent' ? -10 : -1000;
    const values = drawdownData.map(d => displayType === 'percent' ? d.drawdownPercent : d.drawdown);
    const min = Math.min(...values);
    return min < 0 ? min * 1.1 : (displayType === 'percent' ? -1 : -100); // Add 10% padding below
  }, [drawdownData, displayType]);

  // Calculate drawdown metrics
  const drawdownMetrics = useMemo(() => {
    if (drawdownData.length === 0) {
      return {
        worstDrawdown: 0,
        averageDrawdown: 0,
        currentDrawdown: 0,
        topToBottom: 0,
        bottomToTop: 0,
      };
    }

    // 1. Worst Drawdown - the most negative drawdown value (displayed as positive)
    const worstDrawdown = Math.abs(Math.min(...drawdownData.map(d => d.drawdown)));

    // 2. Current Drawdown - the latest drawdown value (displayed as positive)
    const currentDrawdown = Math.abs(drawdownData[drawdownData.length - 1].drawdown);

    // 3. Average Drawdown - average of the bottom of each drawdown phase
    // A phase starts when drawdown goes below 0 and ends when it returns to 0
    const phaseBottoms: number[] = [];
    let inPhase = false;
    let phaseBottom = 0;

    for (let i = 0; i < drawdownData.length; i++) {
      const dd = drawdownData[i].drawdown;
      
      if (dd < 0) {
        // We're in a drawdown phase
        if (!inPhase) {
          inPhase = true;
          phaseBottom = dd;
        } else {
          // Track the deepest point in this phase
          if (dd < phaseBottom) {
            phaseBottom = dd;
          }
        }
      } else if (dd === 0 && inPhase) {
        // Phase ended, record the bottom
        phaseBottoms.push(Math.abs(phaseBottom));
        inPhase = false;
        phaseBottom = 0;
      }
    }

    // If we're still in a phase at the end, count it
    if (inPhase) {
      phaseBottoms.push(Math.abs(phaseBottom));
    }

    const averageDrawdown = phaseBottoms.length > 0 
      ? phaseBottoms.reduce((sum, val) => sum + val, 0) / phaseBottoms.length 
      : 0;

    // 4. Top to Bottom & 5. Bottom to Top
    // Find the swing that contains the MAXIMUM drawdown depth
    // A swing starts when drawdown goes below 0 from a peak (0) and ends when it returns to 0
    
    let topToBottom = 0;
    let bottomToTop: number | null = null;

    // First, find the global worst drawdown point
    let globalWorstIndex = -1;
    let globalWorstValue = 0;
    for (let i = 0; i < drawdownData.length; i++) {
      if (drawdownData[i].drawdown < globalWorstValue) {
        globalWorstValue = drawdownData[i].drawdown;
        globalWorstIndex = i;
      }
    }

    if (globalWorstIndex !== -1) {
      // Find the start of the swing containing the worst point
      // Look backwards from worst point to find the peak (drawdown = 0)
      let swingStartIndex = 0; // Default to beginning if no peak found
      for (let i = globalWorstIndex - 1; i >= 0; i--) {
        if (drawdownData[i].drawdown === 0) {
          swingStartIndex = i + 1; // Swing starts at the first trade after the peak
          break;
        }
      }

      // Top to Bottom: count trades from swing start to the worst point (inclusive)
      topToBottom = globalWorstIndex - swingStartIndex + 1;

      // Find recovery point (where drawdown returns to 0 after the worst point)
      let recoveryIndex: number | null = null;
      for (let i = globalWorstIndex + 1; i < drawdownData.length; i++) {
        if (drawdownData[i].drawdown === 0) {
          recoveryIndex = i;
          break;
        }
      }

      // Bottom to Top: trades from AFTER the worst point to recovery (inclusive of recovery)
      if (recoveryIndex !== null) {
        bottomToTop = recoveryIndex - globalWorstIndex;
      }
      // If not recovered yet, bottomToTop stays null
    }

    return {
      worstDrawdown,
      averageDrawdown,
      currentDrawdown,
      topToBottom,
      bottomToTop,
    };
  }, [drawdownData]);

  // Format currency for display (always positive for metrics)
  const formatCurrency = (value: number) => {
    const absValue = Math.abs(value);
    if (absValue >= 1000) {
      return `${value < 0 ? '-' : ''}${currencyConfig.symbol}${(absValue / 1000).toFixed(1)}K`;
    }
    return `${value < 0 ? '-' : ''}${currencyConfig.symbol}${absValue.toFixed(0)}`;
  };

  // Format percentage for display
  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  // Format value based on display type
  const formatValue = (value: number) => {
    if (displayType === 'percent') {
      return formatPercent(value);
    }
    return formatCurrency(value);
  };

  const formatMetricCurrency = (value: number) => {
    return `${currencyConfig.symbol}${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Calculated metric values
  const metrics = [
    { label: 'Worst Drawdown', value: formatMetricCurrency(drawdownMetrics.worstDrawdown), hasInfo: false },
    { label: 'Average Drawdown', value: formatMetricCurrency(drawdownMetrics.averageDrawdown), hasInfo: false },
    { label: 'Current Drawdown', value: formatMetricCurrency(drawdownMetrics.currentDrawdown), hasInfo: false },
    { label: 'Top to Bottom', value: String(drawdownMetrics.topToBottom), hasInfo: true, tooltip: 'Number of trades from equity peak to the deepest drawdown point' },
    { label: 'Bottom to Top', value: drawdownMetrics.bottomToTop !== null ? String(drawdownMetrics.bottomToTop) : '—', hasInfo: true, tooltip: 'Number of trades from the deepest drawdown point to recovery (equity high)' },
    { label: 'Return to Drawdown', value: 'Releasing soon', hasInfo: false },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Drawdown</h1>
        <p className="text-muted-foreground mt-1">Analyze your drawdown patterns and recovery periods.</p>
      </div>
      
      {/* Chart Container */}
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          {/* Display Dropdown */}
          <div className="mb-4">
            <Select value={displayType} onValueChange={setDisplayType}>
              <SelectTrigger className="w-[160px] bg-background border-border">
                <div className="flex flex-col items-start">
                  <span className="text-xs text-muted-foreground">Display</span>
                  <SelectValue placeholder="Return ($)" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="return">Return ($)</SelectItem>
                <SelectItem value="percent">Return (%)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Chart */}
          <div className="h-[400px] w-full">
            {drawdownData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={drawdownData}
                  margin={{ top: 10, right: 30, left: 10, bottom: 30 }}
                >
                  <defs>
                    <linearGradient id="drawdownGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="trade"
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    label={{
                      value: 'Trades',
                      position: 'bottom',
                      offset: 10,
                      fill: 'hsl(var(--muted-foreground))',
                      fontSize: 12,
                    }}
                  />
                  <YAxis
                    domain={[minDrawdown, 0]}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    tickFormatter={formatValue}
                    label={{
                      value: displayType === 'percent' ? 'Drawdown (%)' : 'Drawdown ($)',
                      angle: -90,
                      position: 'insideLeft',
                      offset: 10,
                      fill: 'hsl(var(--muted-foreground))',
                      fontSize: 12,
                      style: { textAnchor: 'middle' },
                    }}
                  />
                  <ReferenceLine
                    y={0}
                    stroke="hsl(var(--border))"
                    strokeWidth={2}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      padding: '8px 12px',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    formatter={(value: number, name: string) => {
                      if (displayType === 'percent') {
                        return [`${value.toFixed(2)}%`, 'Drawdown'];
                      }
                      return [`${currencyConfig.symbol}${value.toFixed(2)}`, 'Drawdown'];
                    }}
                    labelFormatter={(label) => `Trade #${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey={displayType === 'percent' ? 'drawdownPercent' : 'drawdown'}
                    stroke="hsl(0, 84%, 60%)"
                    strokeWidth={2}
                    fill="url(#drawdownGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full border border-dashed border-border rounded-xl bg-muted/20">
                <p className="text-muted-foreground">No closed trades to display drawdown chart.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.label} className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-1 mb-1">
                <div className="w-1 h-4 bg-green-500 rounded-full" />
                <span className="text-sm text-muted-foreground">{metric.label}</span>
                {metric.hasInfo && (
                  <TooltipProvider>
                    <UITooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{metric.tooltip || 'Metric explanation coming soon'}</p>
                      </TooltipContent>
                    </UITooltip>
                  </TooltipProvider>
                )}
              </div>
              <p className="text-xl font-semibold text-foreground">{metric.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Drawdown;
