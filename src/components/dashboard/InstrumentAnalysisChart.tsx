import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { motion } from 'framer-motion';
import { useFilteredTrades } from '@/hooks/useFilteredTrades';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { usePrivacyMode, PRIVACY_MASK } from '@/hooks/usePrivacyMode';
import { calculateTradeMetrics } from '@/types/trade';
import { Info } from 'lucide-react';
import { Tooltip as UITooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ChartGradientDefs, useGradientFill } from '@/components/charts/ChartGradientDefs';

interface SymbolData {
  symbol: string;
  pnl: number;
  tradeCount: number;
}

export const SymbolAnalysisChart = () => {
  const { filteredTrades: trades } = useFilteredTrades();
  const { currencyConfig } = useGlobalFilters();
  const { isPrivacyMode } = usePrivacyMode();

  const chartData = useMemo(() => {
    if (trades.length === 0) return [];

    // Group trades by symbol (case-insensitive)
    const symbolMap = new Map<string, { pnl: number; count: number }>();

    trades.forEach(trade => {
      const metrics = calculateTradeMetrics(trade);
      // Normalize symbol to uppercase for grouping
      const normalizedSymbol = trade.symbol.toUpperCase();
      
      const existing = symbolMap.get(normalizedSymbol) || { pnl: 0, count: 0 };
      symbolMap.set(normalizedSymbol, {
        pnl: existing.pnl + metrics.netPnl,
        count: existing.count + 1,
      });
    });

    // Convert to array and sort by absolute P&L descending
    const data: SymbolData[] = Array.from(symbolMap.entries())
      .map(([symbol, data]) => ({
        symbol,
        pnl: data.pnl,
        tradeCount: data.count,
      }))
      .sort((a, b) => Math.abs(b.pnl) - Math.abs(a.pnl));

    return data;
  }, [trades]);

  const formatCurrency = (value: number) => {
    if (isPrivacyMode) return PRIVACY_MASK;
    if (Math.abs(value) >= 1000) {
      return `${value >= 0 ? '' : '-'}${currencyConfig.symbol}${(Math.abs(value) / 1000).toFixed(1)}k`;
    }
    return `${value >= 0 ? '' : '-'}${currencyConfig.symbol}${Math.abs(value).toFixed(0)}`;
  };

  if (chartData.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="glass-card rounded-xl p-4 h-full flex flex-col min-h-[300px]"
      >
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-sm font-medium text-muted-foreground">Symbol analysis</h3>
          <UITooltip>
            <TooltipTrigger>
              <Info className="h-3.5 w-3.5 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Shows net P&L breakdown by trading symbol</p>
            </TooltipContent>
          </UITooltip>
        </div>
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          Add trades to see symbol analysis
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass-card rounded-xl p-4 h-full flex flex-col min-h-[300px]"
    >
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">Symbol analysis</h3>
        <UITooltip>
          <TooltipTrigger>
            <Info className="h-3.5 w-3.5 text-muted-foreground" />
          </TooltipTrigger>
          <TooltipContent>
            <p>Shows net P&L breakdown by trading symbol</p>
          </TooltipContent>
        </UITooltip>
      </div>
      
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="hsl(var(--border))" 
              opacity={0.3}
              vertical={false}
            />
            <XAxis 
              dataKey="symbol" 
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              dy={5}
            />
            <YAxis 
              tickFormatter={formatCurrency}
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={false}
              width={50}
            />
            <Tooltip 
              cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as SymbolData;
                  return (
                    <div className="glass-card rounded-lg px-3 py-2 border border-border/50">
                      <p className="text-xs text-muted-foreground mb-1">{data.symbol}</p>
                      <p className={`text-sm font-semibold font-mono ${isPrivacyMode ? 'text-foreground' : data.pnl >= 0 ? 'profit-text' : 'loss-text'}`}>
                        {isPrivacyMode ? PRIVACY_MASK : `${data.pnl >= 0 ? '+' : ''}${formatCurrency(data.pnl)}`}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {data.tradeCount} trade{data.tradeCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <ReferenceLine 
              y={0} 
              stroke="hsl(var(--muted-foreground))" 
              strokeDasharray="3 3"
              strokeOpacity={0.5}
            />
            <Bar 
              dataKey="pnl" 
              radius={[4, 4, 4, 4]}
              maxBarSize={30}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`}
                  fill={entry.pnl >= 0 ? 'hsl(var(--profit))' : 'hsl(var(--loss))'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};
