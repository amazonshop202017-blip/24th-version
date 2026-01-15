import { useMemo, useState } from 'react';
import { useFilteredTradesContext } from '@/contexts/TradesContext';
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
  const [displayType, setDisplayType] = useState('return');

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
      
      return {
        trade: index + 1,
        drawdown: drawdown,
        cumulativePnl,
        peak,
      };
    });
  }, [filteredTrades]);

  // Calculate min drawdown for Y-axis domain
  const minDrawdown = useMemo(() => {
    if (drawdownData.length === 0) return -1000;
    const min = Math.min(...drawdownData.map(d => d.drawdown));
    return min < 0 ? min * 1.1 : -100; // Add 10% padding below
  }, [drawdownData]);

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

    // 4. Top to Bottom - trades from last peak (0) to the worst drawdown point
    // 5. Bottom to Top - trades from worst point to recovery (0)
    // We focus on the most recent complete or ongoing drawdown phase for these metrics
    
    let topToBottom = 0;
    let bottomToTop = 0;

    // Find the last peak (drawdown = 0) before the most recent/ongoing phase
    let lastPeakIndex = -1;
    let worstPointIndex = -1;
    let worstValue = 0;
    let recoveryIndex = -1;

    // Find the last drawdown phase
    for (let i = drawdownData.length - 1; i >= 0; i--) {
      if (drawdownData[i].drawdown === 0) {
        if (lastPeakIndex === -1 && worstPointIndex !== -1) {
          // Found recovery point after we found a bottom
          recoveryIndex = i;
        }
        if (worstPointIndex === -1) {
          // Haven't found a drawdown yet, keep looking back
          continue;
        }
        // Found the start of the phase we're measuring
        lastPeakIndex = i;
        break;
      } else {
        // In drawdown
        if (drawdownData[i].drawdown < worstValue) {
          worstValue = drawdownData[i].drawdown;
          worstPointIndex = i;
        }
      }
    }

    // If we found a complete phase pattern
    if (lastPeakIndex !== -1 && worstPointIndex !== -1) {
      topToBottom = worstPointIndex - lastPeakIndex;
    } else if (worstPointIndex !== -1) {
      // Phase started from the beginning (no previous peak at 0)
      topToBottom = worstPointIndex + 1;
    }

    if (recoveryIndex !== -1 && worstPointIndex !== -1) {
      bottomToTop = recoveryIndex - worstPointIndex;
    } else if (worstPointIndex !== -1 && drawdownData[drawdownData.length - 1].drawdown === 0) {
      // Current position is at 0, so we recovered
      bottomToTop = (drawdownData.length - 1) - worstPointIndex;
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
      return `${value < 0 ? '-' : ''}$${(absValue / 1000).toFixed(1)}K`;
    }
    return `${value < 0 ? '-' : ''}$${absValue.toFixed(0)}`;
  };

  const formatMetricCurrency = (value: number) => {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Calculated metric values
  const metrics = [
    { label: 'Worst Drawdown', value: formatMetricCurrency(drawdownMetrics.worstDrawdown), hasInfo: false },
    { label: 'Average Drawdown', value: formatMetricCurrency(drawdownMetrics.averageDrawdown), hasInfo: false },
    { label: 'Current Drawdown', value: formatMetricCurrency(drawdownMetrics.currentDrawdown), hasInfo: false },
    { label: 'Top to Bottom', value: String(drawdownMetrics.topToBottom), hasInfo: true, tooltip: 'Number of trades from the last equity peak to the worst drawdown point' },
    { label: 'Bottom to Top', value: String(drawdownMetrics.bottomToTop), hasInfo: true, tooltip: 'Number of trades from the worst drawdown point to recovery' },
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
                    tickFormatter={(value) => formatCurrency(value)}
                    label={{
                      value: 'Drawdown ($)',
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
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Drawdown']}
                    labelFormatter={(label) => `Trade #${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="drawdown"
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
