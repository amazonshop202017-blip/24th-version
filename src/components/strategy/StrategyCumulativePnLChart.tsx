import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { motion } from 'framer-motion';
import { Info } from 'lucide-react';
import { Trade, calculateTradeMetrics } from '@/types/trade';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { format, parseISO } from 'date-fns';

interface StrategyCumulativePnLChartProps {
  trades: Trade[];
}

const StrategyCumulativePnLChart = ({ trades }: StrategyCumulativePnLChartProps) => {
  const { currencyConfig } = useGlobalFilters();
  
  const chartData = useMemo(() => {
    if (trades.length === 0) return [];

    // Get trades with metrics and sort by date
    const tradesWithMetrics = trades.map(trade => ({
      trade,
      metrics: calculateTradeMetrics(trade),
    })).filter(t => t.metrics.openDate)
      .sort((a, b) => new Date(a.metrics.openDate).getTime() - new Date(b.metrics.openDate).getTime());

    // Group by date and calculate daily cumulative P&L
    const dailyPnL: { [date: string]: number } = {};
    
    tradesWithMetrics.forEach(({ metrics }) => {
      const dateKey = format(parseISO(metrics.openDate), 'yyyy-MM-dd');
      dailyPnL[dateKey] = (dailyPnL[dateKey] || 0) + metrics.netPnl;
    });

    // Convert to cumulative chart data
    const sortedDates = Object.keys(dailyPnL).sort();
    let cumulative = 0;
    
    return sortedDates.map(date => {
      cumulative += dailyPnL[date];
      return {
        date,
        formattedDate: format(parseISO(date), 'MM/dd/yy'),
        dailyPnl: dailyPnL[date],
        cumulativePnl: cumulative,
      };
    });
  }, [trades]);

  if (trades.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-xl p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-sm font-medium text-foreground">Daily net cumulative P&L</h3>
          <Info className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="h-[250px] flex items-center justify-center text-muted-foreground">
          No trade data available for this strategy
        </div>
      </motion.div>
    );
  }

  const minValue = Math.min(...chartData.map(d => d.cumulativePnl), 0);
  const maxValue = Math.max(...chartData.map(d => d.cumulativePnl), 0);
  const padding = Math.abs(maxValue - minValue) * 0.1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-xl p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-sm font-medium text-foreground">Daily net cumulative P&L</h3>
        <Info className="w-4 h-4 text-muted-foreground" />
      </div>
      
      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="strategyPositiveGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--profit))" stopOpacity={0.4} />
                <stop offset="100%" stopColor="hsl(var(--profit))" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="strategyNegativeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--loss))" stopOpacity={0.05} />
                <stop offset="100%" stopColor="hsl(var(--loss))" stopOpacity={0.4} />
              </linearGradient>
            </defs>
            
            <XAxis
              dataKey="formattedDate"
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickLine={false}
              tickMargin={8}
            />
            <YAxis
              domain={[minValue - padding, maxValue + padding]}
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `${currencyConfig.symbol}${value.toFixed(0)}`}
              width={60}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              labelFormatter={(label) => `Date: ${label}`}
              formatter={(value: number, name: string) => {
                const formattedValue = `${currencyConfig.symbol}${value.toFixed(2)}`;
                const displayName = name === 'cumulativePnl' ? 'Cumulative P&L' : 'Daily P&L';
                return [formattedValue, displayName];
              }}
            />
            <ReferenceLine y={0} stroke="hsl(var(--border))" strokeDasharray="3 3" />
            
            <Area
              type="monotone"
              dataKey="cumulativePnl"
              stroke="hsl(var(--profit))"
              strokeWidth={2}
              fill="url(#strategyPositiveGradient)"
              dot={false}
              activeDot={{ r: 4, fill: 'hsl(var(--profit))' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default StrategyCumulativePnLChart;
