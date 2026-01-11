import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format, parseISO } from 'date-fns';
import { motion } from 'framer-motion';
import { useTradesContext } from '@/contexts/TradesContext';
import { calculateTradeMetrics } from '@/types/trade';
import { Info } from 'lucide-react';
import { Tooltip as UITooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface DailyData {
  date: string;
  displayDate: string;
  dailyPnl: number;
  cumulativePnl: number;
}

export const DailyCumulativePnLChart = () => {
  const { trades } = useTradesContext();

  const chartData = useMemo(() => {
    if (trades.length === 0) return [];

    // Calculate P&L for each trade and group by date
    const dailyPnLMap = new Map<string, number>();

    trades.forEach(trade => {
      const metrics = calculateTradeMetrics(trade);
      if (metrics.closeDate) {
        const dateKey = format(parseISO(metrics.closeDate), 'yyyy-MM-dd');
        const existing = dailyPnLMap.get(dateKey) || 0;
        dailyPnLMap.set(dateKey, existing + metrics.netPnl);
      }
    });

    // Sort dates and calculate cumulative P&L
    const sortedDates = Array.from(dailyPnLMap.keys()).sort();
    let cumulative = 0;

    const data: DailyData[] = sortedDates.map(date => {
      const dailyPnl = dailyPnLMap.get(date) || 0;
      cumulative += dailyPnl;
      return {
        date,
        displayDate: format(parseISO(date), 'MM/dd/yy'),
        dailyPnl,
        cumulativePnl: cumulative,
      };
    });

    return data;
  }, [trades]);

  const formatCurrency = (value: number) => {
    const prefix = value >= 0 ? '$' : '-$';
    return `${prefix}${Math.abs(value).toFixed(0)}`;
  };

  // Calculate gradient split point for coloring above/below zero
  const { gradientOffset } = useMemo(() => {
    if (chartData.length === 0) return { gradientOffset: 0.5 };
    
    const maxValue = Math.max(...chartData.map(d => d.cumulativePnl));
    const minValue = Math.min(...chartData.map(d => d.cumulativePnl));
    
    if (maxValue <= 0) return { gradientOffset: 0 };
    if (minValue >= 0) return { gradientOffset: 1 };
    
    return { gradientOffset: maxValue / (maxValue - minValue) };
  }, [chartData]);

  if (chartData.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="glass-card rounded-xl p-4"
      >
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-sm font-medium text-muted-foreground">Daily net cumulative P&L</h3>
          <UITooltip>
            <TooltipTrigger>
              <Info className="h-3.5 w-3.5 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Shows your cumulative profit/loss over time</p>
            </TooltipContent>
          </UITooltip>
        </div>
        <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
          Add trades to see your equity curve
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass-card rounded-xl p-4"
    >
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">Daily net cumulative P&L</h3>
        <UITooltip>
          <TooltipTrigger>
            <Info className="h-3.5 w-3.5 text-muted-foreground" />
          </TooltipTrigger>
          <TooltipContent>
            <p>Shows your cumulative profit/loss over time</p>
          </TooltipContent>
        </UITooltip>
      </div>
      
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
                <stop offset={0} stopColor="hsl(var(--profit))" stopOpacity={0.4} />
                <stop offset={gradientOffset} stopColor="hsl(var(--profit))" stopOpacity={0.1} />
                <stop offset={gradientOffset} stopColor="hsl(var(--loss))" stopOpacity={0.1} />
                <stop offset={1} stopColor="hsl(var(--loss))" stopOpacity={0.4} />
              </linearGradient>
              <linearGradient id="splitColorLine" x1="0" y1="0" x2="0" y2="1">
                <stop offset={0} stopColor="hsl(var(--profit))" stopOpacity={1} />
                <stop offset={gradientOffset} stopColor="hsl(var(--profit))" stopOpacity={1} />
                <stop offset={gradientOffset} stopColor="hsl(var(--loss))" stopOpacity={1} />
                <stop offset={1} stopColor="hsl(var(--loss))" stopOpacity={1} />
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="hsl(var(--border))" 
              opacity={0.3}
              vertical={false}
            />
            <XAxis 
              dataKey="displayDate" 
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
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const value = payload[0].value as number;
                  return (
                    <div className="glass-card rounded-lg px-3 py-2 border border-border/50">
                      <p className="text-xs text-muted-foreground mb-1">{label}</p>
                      <p className={`text-sm font-semibold font-mono ${value >= 0 ? 'profit-text' : 'loss-text'}`}>
                        {value >= 0 ? '+' : ''}{formatCurrency(value)}
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
            <Area
              type="monotone"
              dataKey="cumulativePnl"
              stroke="url(#splitColorLine)"
              strokeWidth={2}
              fill="url(#splitColor)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};
