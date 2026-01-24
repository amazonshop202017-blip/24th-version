import { useMemo, useState } from 'react';
import { useFilteredTradesContext } from '@/contexts/TradesContext';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
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

interface SetupPerformanceChartProps {
  defaultDisplayType?: DisplayType;
  title?: string;
}

export const SetupPerformanceChart = ({ 
  defaultDisplayType = 'dollar',
  title = 'Performance by Setup'
}: SetupPerformanceChartProps) => {
  const { filteredTrades } = useFilteredTradesContext();
  const { currencyConfig } = useGlobalFilters();
  const { strategies } = useStrategiesContext();
  const [displayType, setDisplayType] = useState<DisplayType>(defaultDisplayType);

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

    const setupMap = new Map<string, {
      totalPnl: number;
      totalPercent: number;
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

      // Use stored Return % - skip trades without stored value for percent mode
      const returnPercent = trade.savedReturnPercent;
      if (displayType === 'percent' && (returnPercent === undefined || returnPercent === null || !isFinite(returnPercent))) {
        return;
      }
      
      const existing = setupMap.get(setupName) || { 
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
      
      setupMap.set(setupName, {
        totalPnl: existing.totalPnl + metrics.netPnl,
        totalPercent: existing.totalPercent + (returnPercent ?? 0),
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
          setup,
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
  }, [filteredTrades, displayType, strategies]);

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

  return (
    <Card className="bg-card border-border h-full">
      <CardContent className="p-4">
        {/* Header with Dropdowns */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          <div className="flex items-center gap-2">
            <Select value={displayType} onValueChange={(v) => setDisplayType(v as DisplayType)}>
              <SelectTrigger className="w-[140px] h-8 bg-background border-border text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dollar">Return ($)</SelectItem>
                <SelectItem value="percent">Return (%)</SelectItem>
                <SelectItem value="winrate">Winrate (%)</SelectItem>
                <SelectItem value="tradecount">Trade Count</SelectItem>
              </SelectContent>
            </Select>
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
                  width={50}
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
                    
                    return (
                      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                        <p className="text-foreground font-medium mb-2">{data.setup}</p>
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
                  maxBarSize={40}
                >
                  {setupData.map((entry, index) => {
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
              <p className="text-muted-foreground text-sm">No closed trades with setups available for analysis.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
