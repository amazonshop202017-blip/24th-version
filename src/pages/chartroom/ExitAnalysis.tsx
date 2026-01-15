import { useMemo, useState } from 'react';
import { useFilteredTradesContext } from '@/contexts/TradesContext';
import { calculateTradeMetrics, Trade } from '@/types/trade';
import { parseISO } from 'date-fns';
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  ReferenceLine,
  Cell,
  Scatter,
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

interface ExitAnalysisData {
  trade: number;
  updraw: number;
  drawdown: number;
  exitPercent: number;
  symbol: string;
  side: 'LONG' | 'SHORT';
}

const ExitAnalysis = () => {
  const { filteredTrades } = useFilteredTradesContext();
  const [displayType, setDisplayType] = useState('percentage');

  // Calculate exit analysis data for each trade
  const exitAnalysisData = useMemo(() => {
    // Sort trades by close date and filter closed trades with required data
    const sortedTrades = [...filteredTrades]
      .filter((trade: Trade) => {
        const metrics = calculateTradeMetrics(trade);
        return (
          metrics.positionStatus === 'CLOSED' &&
          metrics.closeDate &&
          trade.stopLoss !== undefined &&
          trade.takeProfit !== undefined &&
          trade.highestPrice !== undefined &&
          trade.lowestPrice !== undefined &&
          metrics.avgEntryPrice > 0 &&
          metrics.avgExitPrice > 0
        );
      })
      .sort((a, b) => {
        const metricsA = calculateTradeMetrics(a);
        const metricsB = calculateTradeMetrics(b);
        return parseISO(metricsA.closeDate).getTime() - parseISO(metricsB.closeDate).getTime();
      });

    if (sortedTrades.length === 0) return [];

    return sortedTrades.map((trade, index) => {
      const metrics = calculateTradeMetrics(trade);
      const entryPrice = metrics.avgEntryPrice;
      const exitPrice = metrics.avgExitPrice;
      const stopLoss = trade.stopLoss!;
      const takeProfit = trade.takeProfit!;
      const highestPrice = trade.highestPrice!;
      const lowestPrice = trade.lowestPrice!;
      const side = trade.side;

      // Calculate Risk & Reward Ranges (Normalization)
      let rewardRange: number;
      let riskRange: number;

      if (side === 'LONG') {
        rewardRange = takeProfit - entryPrice;
        riskRange = entryPrice - stopLoss;
      } else {
        // SHORT
        rewardRange = entryPrice - takeProfit;
        riskRange = stopLoss - entryPrice;
      }

      // Avoid division by zero
      if (rewardRange <= 0) rewardRange = 0.0001;
      if (riskRange <= 0) riskRange = 0.0001;

      // Calculate Updraw (Favorable Move) - POSITIVE bar
      let updraw = 0;
      
      if (side === 'LONG') {
        // Check if TP was hit
        if (highestPrice >= takeProfit) {
          updraw = 100;
        } else {
          updraw = ((highestPrice - entryPrice) / rewardRange) * 100;
          updraw = Math.max(0, Math.min(99, updraw)); // Clamp 0-99
        }
      } else {
        // SHORT
        if (lowestPrice <= takeProfit) {
          updraw = 100;
        } else {
          updraw = ((entryPrice - lowestPrice) / rewardRange) * 100;
          updraw = Math.max(0, Math.min(99, updraw)); // Clamp 0-99
        }
      }

      // Calculate Drawdown (Adverse Move) - NEGATIVE bar
      let drawdown = 0;

      if (side === 'LONG') {
        // Check if SL was hit
        if (lowestPrice <= stopLoss) {
          drawdown = -100;
        } else {
          drawdown = -((entryPrice - lowestPrice) / riskRange) * 100;
          drawdown = Math.max(-99, Math.min(0, drawdown)); // Clamp -99 to 0
        }
      } else {
        // SHORT
        if (highestPrice >= stopLoss) {
          drawdown = -100;
        } else {
          drawdown = -((highestPrice - entryPrice) / riskRange) * 100;
          drawdown = Math.max(-99, Math.min(0, drawdown)); // Clamp -99 to 0
        }
      }

      // Calculate Exit Percent
      let exitPercent: number;

      if (side === 'LONG') {
        // Check if exit at TP or SL
        if (exitPrice >= takeProfit) {
          exitPercent = 100;
        } else if (exitPrice <= stopLoss) {
          exitPercent = -100;
        } else if (exitPrice >= entryPrice) {
          // Profitable exit
          exitPercent = ((exitPrice - entryPrice) / rewardRange) * 100;
          exitPercent = Math.min(100, exitPercent);
        } else {
          // Losing exit
          exitPercent = -((entryPrice - exitPrice) / riskRange) * 100;
          exitPercent = Math.max(-100, exitPercent);
        }
      } else {
        // SHORT
        if (exitPrice <= takeProfit) {
          exitPercent = 100;
        } else if (exitPrice >= stopLoss) {
          exitPercent = -100;
        } else if (exitPrice <= entryPrice) {
          // Profitable exit
          exitPercent = ((entryPrice - exitPrice) / rewardRange) * 100;
          exitPercent = Math.min(100, exitPercent);
        } else {
          // Losing exit
          exitPercent = -((exitPrice - entryPrice) / riskRange) * 100;
          exitPercent = Math.max(-100, exitPercent);
        }
      }

      return {
        trade: index + 1,
        updraw: Math.round(updraw * 10) / 10,
        drawdown: Math.round(drawdown * 10) / 10,
        exitPercent: Math.round(exitPercent * 10) / 10,
        symbol: trade.symbol,
        side: trade.side,
      };
    });
  }, [filteredTrades]);

  // Find Y-axis bounds
  const yAxisDomain = useMemo(() => {
    if (exitAnalysisData.length === 0) return [-120, 120];
    
    const maxUpdraw = Math.max(...exitAnalysisData.map(d => d.updraw), 100);
    const minDrawdown = Math.min(...exitAnalysisData.map(d => d.drawdown), -100);
    
    return [Math.min(minDrawdown - 10, -100), Math.max(maxUpdraw + 10, 100)];
  }, [exitAnalysisData]);

  // Diamond shape for exit marker
  const renderExitMarker = (props: any) => {
    const { cx, cy } = props;
    if (cx === undefined || cy === undefined) return null;
    
    const size = 6;
    return (
      <path
        d={`M ${cx} ${cy - size} L ${cx + size} ${cy} L ${cx} ${cy + size} L ${cx - size} ${cy} Z`}
        fill="#1a1a1a"
        stroke="#1a1a1a"
        strokeWidth={1}
      />
    );
  };

  // Placeholder metrics for design
  const metrics = [
    { label: 'Trades Hit TP', value: '—', hasInfo: true, color: 'green' },
    { label: 'Trades Hit SL', value: '—', hasInfo: true, color: 'red' },
    { label: 'Avg. Updraw Winner', value: '—', hasInfo: false, color: 'green' },
    { label: 'Avg. Updraw Loser', value: '—', hasInfo: false, color: 'green' },
    { label: 'Avg. Drawdown Winner', value: '—', hasInfo: false, color: 'red' },
    { label: 'Avg. Drawdown Loser', value: '—', hasInfo: false, color: 'red' },
    { label: 'Avg. Exit Winner', value: '—', hasInfo: false, color: 'green' },
    { label: 'Avg. Exit Loser', value: '—', hasInfo: false, color: 'red' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Exit Analysis</h1>
        <p className="text-muted-foreground mt-1">Analyze your exit strategies and timing.</p>
      </div>

      {/* Chart Container */}
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          {/* Header with Display Dropdown and Legend */}
          <div className="flex items-center justify-between mb-4">
            <Select value={displayType} onValueChange={setDisplayType}>
              <SelectTrigger className="w-[160px] bg-background border-border">
                <div className="flex flex-col items-start">
                  <span className="text-xs text-muted-foreground">Display</span>
                  <SelectValue placeholder="Percentage" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Percentage</SelectItem>
              </SelectContent>
            </Select>

            {/* Legend */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm text-muted-foreground">Updraw</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-sm text-muted-foreground">Drawdown</span>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="h-[400px] w-full">
            {exitAnalysisData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={exitAnalysisData}
                  margin={{ top: 20, right: 30, left: 10, bottom: 30 }}
                  barGap={0}
                >
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
                    domain={yAxisDomain}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    tickFormatter={(value) => `${value}`}
                    ticks={[-100, -50, 0, 50, 100]}
                    label={{
                      value: 'Updraw / Drawdown',
                      angle: -90,
                      position: 'insideLeft',
                      offset: 10,
                      fill: 'hsl(var(--muted-foreground))',
                      fontSize: 12,
                      style: { textAnchor: 'middle' },
                    }}
                  />
                  
                  {/* Reference Lines */}
                  <ReferenceLine y={100} stroke="hsl(142, 71%, 45%)" strokeWidth={1} />
                  <ReferenceLine y={0} stroke="hsl(var(--border))" strokeWidth={2} />
                  <ReferenceLine y={-100} stroke="hsl(0, 84%, 60%)" strokeWidth={1} />

                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      padding: '8px 12px',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    formatter={(value: number, name: string) => {
                      const labels: Record<string, string> = {
                        updraw: 'Updraw',
                        drawdown: 'Drawdown',
                        exitPercent: 'Exit',
                      };
                      return [`${value.toFixed(1)}%`, labels[name] || name];
                    }}
                    labelFormatter={(label, payload) => {
                      if (payload && payload.length > 0) {
                        const data = payload[0].payload;
                        return `Trade #${label} - ${data.symbol} (${data.side})`;
                      }
                      return `Trade #${label}`;
                    }}
                  />

                  {/* Updraw Bar (Green - positive values) */}
                  <Bar dataKey="updraw" name="updraw" maxBarSize={30}>
                    {exitAnalysisData.map((entry, index) => (
                      <Cell
                        key={`updraw-${index}`}
                        fill="hsl(142, 71%, 45%)"
                      />
                    ))}
                  </Bar>

                  {/* Drawdown Bar (Red - negative values) */}
                  <Bar dataKey="drawdown" name="drawdown" maxBarSize={30}>
                    {exitAnalysisData.map((entry, index) => (
                      <Cell
                        key={`drawdown-${index}`}
                        fill="hsl(0, 84%, 60%)"
                      />
                    ))}
                  </Bar>

                  {/* Exit marker (black diamond) */}
                  <Scatter
                    dataKey="exitPercent"
                    name="exitPercent"
                    shape={renderExitMarker}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full border border-dashed border-border rounded-xl bg-muted/20">
                <p className="text-muted-foreground">No trades with complete exit analysis data.</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Trades need: Stop Loss, Take Profit, Highest Price, and Lowest Price.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.label} className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-1 mb-1">
                <div
                  className={`w-1 h-4 rounded-full ${
                    metric.color === 'green' ? 'bg-green-500' : 'bg-red-500'
                  }`}
                />
                <span className="text-sm text-muted-foreground">{metric.label}</span>
                {metric.hasInfo && (
                  <TooltipProvider>
                    <UITooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Metric explanation coming soon</p>
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

export default ExitAnalysis;
