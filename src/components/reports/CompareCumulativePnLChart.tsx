import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { Info } from 'lucide-react';
import { usePrivacyMode, PRIVACY_MASK } from '@/hooks/usePrivacyMode';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { DailyPnLData } from '@/lib/compareUtils';
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface CompareCumulativePnLChartProps {
  groupNumber: 1 | 2;
  data: DailyPnLData[];
  dateRangeLabel: string;
}

export const CompareCumulativePnLChart = ({ 
  groupNumber, 
  data, 
  dateRangeLabel 
}: CompareCumulativePnLChartProps) => {
  const { isPrivacyMode } = usePrivacyMode();
  
  // Split data into positive and negative segments for coloring
  const chartData = useMemo(() => {
    return data.map(d => ({
      ...d,
      formattedDate: format(parseISO(d.date), 'MM/dd/yy'),
      positive: d.cumulativePnl >= 0 ? d.cumulativePnl : null,
      negative: d.cumulativePnl < 0 ? d.cumulativePnl : null,
    }));
  }, [data]);

  const formatYAxis = (value: number) => {
    if (isPrivacyMode) return PRIVACY_MASK;
    return `$${value.toLocaleString()}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0]?.payload?.cumulativePnl ?? 0;
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm text-muted-foreground mb-1">{label}</p>
          <p className={`text-sm font-semibold ${value >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            Cumulative P&L: {isPrivacyMode ? PRIVACY_MASK : `$${value.toFixed(2)}`}
          </p>
        </div>
      );
    }
    return null;
  };

  if (data.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide">
              DAILY NET CUMULATIVE P&L (GROUP #{groupNumber})
            </h3>
            <p className="text-xs text-muted-foreground">({dateRangeLabel})</p>
          </div>
        </div>
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          No trade data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide">
            DAILY NET CUMULATIVE P&L (GROUP #{groupNumber})
          </h3>
          <p className="text-xs text-muted-foreground">({dateRangeLabel})</p>
        </div>
        <TooltipProvider>
          <UITooltip>
            <TooltipTrigger>
              <Info className="w-4 h-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Daily cumulative net P&L over time</p>
            </TooltipContent>
          </UITooltip>
        </TooltipProvider>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`positiveGradient-${groupNumber}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id={`negativeGradient-${groupNumber}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.05} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.3} />
              </linearGradient>
            </defs>
            
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
            
            <XAxis 
              dataKey="formattedDate" 
              tick={{ fontSize: 10 }}
              className="text-muted-foreground"
              tickLine={false}
              axisLine={false}
            />
            
            <YAxis 
              tickFormatter={formatYAxis}
              tick={{ fontSize: 10 }}
              className="text-muted-foreground"
              tickLine={false}
              axisLine={false}
              width={60}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            <ReferenceLine y={0} stroke="hsl(var(--border))" strokeDasharray="3 3" />
            
            <Area
              type="monotone"
              dataKey="cumulativePnl"
              stroke="#10b981"
              strokeWidth={2}
              fill={`url(#positiveGradient-${groupNumber})`}
              fillOpacity={1}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
