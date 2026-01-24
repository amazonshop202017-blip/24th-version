import { useMemo } from 'react';
import { useFilteredTradesContext } from '@/contexts/TradesContext';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { calculateTradeMetrics } from '@/types/trade';
import { Card, CardContent } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';

interface DurationBucket {
  label: string;
  minMinutes: number;
  maxMinutes: number;
}

// Duration buckets matching typical trading patterns
const DURATION_BUCKETS: DurationBucket[] = [
  { label: '0-15s', minMinutes: 0, maxMinutes: 0.25 },
  { label: '15-45s', minMinutes: 0.25, maxMinutes: 0.75 },
  { label: '45s-1m', minMinutes: 0.75, maxMinutes: 1 },
  { label: '1-2m', minMinutes: 1, maxMinutes: 2 },
  { label: '2-5m', minMinutes: 2, maxMinutes: 5 },
  { label: '5-15m', minMinutes: 5, maxMinutes: 15 },
  { label: '15-30m', minMinutes: 15, maxMinutes: 30 },
  { label: '30m-1h', minMinutes: 30, maxMinutes: 60 },
  { label: '1-2h', minMinutes: 60, maxMinutes: 120 },
  { label: '2-4h', minMinutes: 120, maxMinutes: 240 },
  { label: '4h+', minMinutes: 240, maxMinutes: Infinity },
];

interface BucketData {
  bucket: string;
  totalPnl: number;
  tradeCount: number;
  winCount: number;
  lossCount: number;
  winRate: number;
}

// Hook to calculate bucket data
export const useTradeDurationBuckets = () => {
  const { filteredTrades } = useFilteredTradesContext();

  return useMemo(() => {
    const bucketMap = new Map<string, BucketData>();

    // Initialize all buckets
    DURATION_BUCKETS.forEach((bucket) => {
      bucketMap.set(bucket.label, {
        bucket: bucket.label,
        totalPnl: 0,
        tradeCount: 0,
        winCount: 0,
        lossCount: 0,
        winRate: 0,
      });
    });

    // Process trades
    filteredTrades.forEach((trade) => {
      const metrics = calculateTradeMetrics(trade);
      if (metrics.positionStatus !== 'CLOSED' || metrics.durationMinutes <= 0) return;

      // Find the matching bucket
      const bucket = DURATION_BUCKETS.find(
        (b) => metrics.durationMinutes >= b.minMinutes && metrics.durationMinutes < b.maxMinutes
      );

      if (bucket) {
        const data = bucketMap.get(bucket.label)!;
        data.totalPnl += metrics.netPnl;
        data.tradeCount += 1;
        if (metrics.netPnl > 0) {
          data.winCount += 1;
        } else if (metrics.netPnl < 0) {
          data.lossCount += 1;
        }
      }
    });

    // Calculate win rates and filter out empty buckets
    const result: BucketData[] = [];
    DURATION_BUCKETS.forEach((bucket) => {
      const data = bucketMap.get(bucket.label)!;
      if (data.tradeCount > 0) {
        data.winRate = (data.winCount / data.tradeCount) * 100;
        result.push(data);
      }
    });

    return result;
  }, [filteredTrades]);
};

// Performance by Trade Duration Chart
export const PerformanceByDurationChart = () => {
  const bucketData = useTradeDurationBuckets();
  const { currencyConfig } = useGlobalFilters();

  const formatCurrency = (value: number) => {
    const prefix = value >= 0 ? currencyConfig.symbol : `-${currencyConfig.symbol}`;
    return `${prefix}${Math.abs(value).toFixed(0)}`;
  };

  if (bucketData.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Performance by Trade Duration</h3>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No trade data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">Performance by Trade Duration</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bucketData} margin={{ top: 20, right: 20, left: 10, bottom: 30 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                opacity={0.3}
              />
              <XAxis
                dataKey="bucket"
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                tickFormatter={formatCurrency}
              />
              <ReferenceLine y={0} stroke="hsl(var(--border))" strokeWidth={1} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  const data = payload[0].payload as BucketData;
                  return (
                    <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                      <p className="text-foreground font-medium mb-2">{data.bucket}</p>
                      <div className="space-y-1 text-sm">
                        <p className={data.totalPnl >= 0 ? 'text-green-500' : 'text-red-500'}>
                          P&L: {formatCurrency(data.totalPnl)}
                        </p>
                        <p className="text-muted-foreground">
                          Trades: {data.tradeCount}
                        </p>
                      </div>
                    </div>
                  );
                }}
              />
              <Bar dataKey="totalPnl" radius={[4, 4, 0, 0]}>
                {bucketData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.totalPnl >= 0 ? 'hsl(142, 71%, 45%)' : 'hsl(0, 84%, 60%)'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

// Trade Count by Trade Duration Chart
export const TradeCountByDurationChart = () => {
  const bucketData = useTradeDurationBuckets();

  if (bucketData.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Trade Count by Duration</h3>
          <div className="h-[250px] flex items-center justify-center text-muted-foreground">
            No trade data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">Trade Count by Duration</h3>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bucketData} margin={{ top: 20, right: 20, left: 10, bottom: 30 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                opacity={0.3}
              />
              <XAxis
                dataKey="bucket"
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  const data = payload[0].payload as BucketData;
                  return (
                    <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                      <p className="text-foreground font-medium mb-2">{data.bucket}</p>
                      <div className="space-y-1 text-sm">
                        <p className="text-muted-foreground">
                          Total Trades: {data.tradeCount}
                        </p>
                        <p className="text-green-500">Winners: {data.winCount}</p>
                        <p className="text-red-500">Losers: {data.lossCount}</p>
                      </div>
                    </div>
                  );
                }}
              />
              <Bar dataKey="tradeCount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

// Win Rate by Trade Duration Chart
export const WinRateByDurationChart = () => {
  const bucketData = useTradeDurationBuckets();

  if (bucketData.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Win Rate by Duration</h3>
          <div className="h-[250px] flex items-center justify-center text-muted-foreground">
            No trade data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">Win Rate by Duration</h3>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bucketData} margin={{ top: 20, right: 20, left: 10, bottom: 30 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                opacity={0.3}
              />
              <XAxis
                dataKey="bucket"
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis
                domain={[0, 100]}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                tickFormatter={(value) => `${value}%`}
              />
              <ReferenceLine y={50} stroke="hsl(var(--border))" strokeDasharray="3 3" />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  const data = payload[0].payload as BucketData;
                  return (
                    <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                      <p className="text-foreground font-medium mb-2">{data.bucket}</p>
                      <div className="space-y-1 text-sm">
                        <p className={data.winRate >= 50 ? 'text-green-500' : 'text-red-500'}>
                          Win Rate: {data.winRate.toFixed(1)}%
                        </p>
                        <p className="text-muted-foreground">
                          {data.winCount}W / {data.lossCount}L
                        </p>
                      </div>
                    </div>
                  );
                }}
              />
              <Bar dataKey="winRate" radius={[4, 4, 0, 0]}>
                {bucketData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.winRate >= 50 ? 'hsl(142, 71%, 45%)' : 'hsl(0, 84%, 60%)'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
