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
} from 'recharts';
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface DailyPnLData {
  date: string;
  netPnl: number;
  cumulativePnl: number;
}

interface WinsVsLossesChartProps {
  data: DailyPnLData[];
  title: string;
  dateLabel: string;
  variant: 'wins' | 'losses';
  formatCurrency: (value: number, showSign?: boolean) => string;
}

export const WinsVsLossesChart = ({
  data,
  title,
  dateLabel,
  variant,
  formatCurrency,
}: WinsVsLossesChartProps) => {
  const { isPrivacyMode } = usePrivacyMode();
  const chartColor = variant === 'wins' ? '#10b981' : '#ef4444';
  const gradientId = variant === 'wins' ? 'winsGradient' : 'lossesGradient';

  const formattedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      formattedDate: format(parseISO(item.date), 'MM/dd/yy'),
    }));
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider">{title}</h3>
          <span className="text-xs text-muted-foreground">({dateLabel})</span>
          <TooltipProvider>
            <UITooltip>
              <TooltipTrigger>
                <Info className="w-3.5 h-3.5 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Cumulative P&L over time for {variant === 'wins' ? 'winning' : 'losing'} trades</p>
              </TooltipContent>
            </UITooltip>
          </TooltipProvider>
        </div>
        <div className="h-[300px] flex items-center justify-center text-muted-foreground">
          No {variant === 'wins' ? 'winning' : 'losing'} trades found
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider">{title}</h3>
        <span className="text-xs text-muted-foreground">({dateLabel})</span>
        <TooltipProvider>
          <UITooltip>
            <TooltipTrigger>
              <Info className="w-3.5 h-3.5 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Cumulative P&L over time for {variant === 'wins' ? 'winning' : 'losing'} trades</p>
            </TooltipContent>
          </UITooltip>
        </TooltipProvider>
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={chartColor} stopOpacity={0.3} />
                <stop offset="100%" stopColor={chartColor} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
            <XAxis
              dataKey="formattedDate"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickMargin={10}
            />
            <YAxis
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => isPrivacyMode ? PRIVACY_MASK : `$${Math.abs(value).toLocaleString()}`}
              tickMargin={10}
              width={70}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const data = payload[0].payload as DailyPnLData & { formattedDate: string };
                return (
                  <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                    <p className="text-xs text-muted-foreground mb-2">{data.formattedDate}</p>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-xs text-muted-foreground">Daily P&L:</span>
                        <span className={`text-xs font-medium ${data.netPnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {isPrivacyMode ? PRIVACY_MASK : formatCurrency(data.netPnl, true)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-xs text-muted-foreground">Cumulative:</span>
                        <span className={`text-xs font-medium ${data.cumulativePnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {isPrivacyMode ? PRIVACY_MASK : formatCurrency(data.cumulativePnl, true)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="cumulativePnl"
              stroke={chartColor}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
