import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell   Customized,
  Customized,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { motion } from 'framer-motion';
import { useFilteredTrades } from '@/hooks/useFilteredTrades';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { usePrivacyMode, PRIVACY_MASK } from '@/hooks/usePrivacyMode';
import { calculateTradeMetrics, Trade } from '@/types/trade';
import { Info } from 'lucide-react';
import { Tooltip as UITooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DayDetailsModal } from '@/components/dayview/DayDetailsModal';
import { ChartGradientDefs, useGradientFill } from '@/components/charts/ChartGradientDefs';

interface DailyData {
  date: string;
  displayDate: string;
  dailyPnl: number;
  tradeCount: number;
}

export const NetDailyPnLChart = () => {
  const { filteredTrades: trades } = useFilteredTrades();
  const { currencyConfig } = useGlobalFilters();
  const { isPrivacyMode } = usePrivacyMode();
  const { getFill } = useGradientFill('netDaily');

  const [selectedDayDate, setSelectedDayDate] = useState<Date | null>(null);
  const [selectedDayTrades, setSelectedDayTrades] = useState<Trade[]>([]);

  const chartData = useMemo(() => {
    if (trades.length === 0) return [];

    const dailyDataMap = new Map<string, { pnl: number; count: number }>();

    trades.forEach(trade => {
      const metrics = calculateTradeMetrics(trade);
      if (metrics.closeDate) {
        const dateKey = format(parseISO(metrics.closeDate), 'yyyy-MM-dd');
        const existing = dailyDataMap.get(dateKey) || { pnl: 0, count: 0 };
        dailyDataMap.set(dateKey, {
          pnl: existing.pnl + metrics.netPnl,
          count: existing.count + 1,
        });
      }
    });

    const sortedDates = Array.from(dailyDataMap.keys()).sort();

    const data: DailyData[] = sortedDates.map(date => {
      const dayData = dailyDataMap.get(date)!;
      return {
        date,
        displayDate: format(parseISO(date), 'MM/dd/yy'),
        dailyPnl: dayData.pnl,
        tradeCount: dayData.count,
      };
    });

    return data;
  }, [trades]);

  const formatCurrency = (value: number) => {
    if (isPrivacyMode) return PRIVACY_MASK;
    const prefix = value >= 0 ? '$' : '-$';
    return `${prefix}${Math.abs(value).toFixed(0)}`;
  };

  const handleChartClick = (data: any) => {
    if (data?.activePayload?.[0]?.payload) {
      const clicked = data.activePayload[0].payload as DailyData;
      const clickedDate = parseISO(clicked.date);
      const dayTrades = trades.filter(trade => {
        const metrics = calculateTradeMetrics(trade);
        return metrics.closeDate && format(parseISO(metrics.closeDate), 'yyyy-MM-dd') === clicked.date;
      });
      setSelectedDayDate(clickedDate);
      setSelectedDayTrades(dayTrades);
    }
  };

  const handleCloseModal = () => {
    setSelectedDayDate(null);
    setSelectedDayTrades([]);
  };

  if (chartData.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="glass-card rounded-xl p-4 h-full flex flex-col min-h-[380px]"
      >
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-sm font-medium text-muted-foreground">Net daily P&L</h3>
          <UITooltip>
            <TooltipTrigger>
              <Info className="h-3.5 w-3.5 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Shows your net profit/loss for each trading day</p>
            </TooltipContent>
          </UITooltip>
        </div>
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          Add trades to see your daily P&L
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass-card rounded-xl p-4 h-full flex flex-col min-h-[380px]"
    >
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">Net daily P&L</h3>
        <UITooltip>
          <TooltipTrigger>
            <Info className="h-3.5 w-3.5 text-muted-foreground" />
          </TooltipTrigger>
          <TooltipContent>
            <p>Shows your net profit/loss for each trading day</p>
          </TooltipContent>
        </UITooltip>
      </div>
      
      <div className="flex-1 cursor-pointer">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            onClick={handleChartClick}
          >
            <Customized component={() => <ChartGradientDefs direction="vertical" idPrefix="netDaily" />} />
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
              cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as DailyData;
                  return (
                    <div className="glass-card rounded-lg px-3 py-2 border border-border/50">
                      <p className="text-xs text-muted-foreground mb-1">{data.displayDate}</p>
                      <p className={`text-sm font-semibold font-mono ${isPrivacyMode ? 'text-foreground' : data.dailyPnl >= 0 ? 'profit-text' : 'loss-text'}`}>
                        {isPrivacyMode ? PRIVACY_MASK : `${data.dailyPnl >= 0 ? '+' : ''}${formatCurrency(data.dailyPnl)}`}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {data.tradeCount} trade{data.tradeCount !== 1 ? 's' : ''} · Click for details
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
              dataKey="dailyPnl" 
              radius={[2, 2, 0, 0]}
              maxBarSize={40}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`}
                  fill={getFill(entry.dailyPnl >= 0)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {selectedDayDate && (
        <DayDetailsModal
          isOpen={!!selectedDayDate}
          onClose={handleCloseModal}
          date={selectedDayDate}
          trades={selectedDayTrades}
        />
      )}
    </motion.div>
  );
};