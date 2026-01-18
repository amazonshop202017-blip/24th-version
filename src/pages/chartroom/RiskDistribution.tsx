import { useMemo, useState } from 'react';
import { useFilteredTradesContext } from '@/contexts/TradesContext';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { calculateTradeMetrics } from '@/types/trade';
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

type DisplayType = 'rMultiple' | 'returnPercent';

interface BucketData {
  label: string;
  sortOrder: number;
  rangeStart: number;
  rangeEnd: number;
  tradeCount: number;
  winCount: number;
  lossCount: number;
  breakevenCount: number;
  isWinningBucket: boolean;
}

const RiskDistribution = () => {
  const { filteredTrades } = useFilteredTradesContext();
  const { currencyConfig } = useGlobalFilters();
  
  const [displayType, setDisplayType] = useState<DisplayType>('rMultiple');

  // Get closed trades only
  const closedTrades = useMemo(() => {
    return filteredTrades.filter(trade => {
      const metrics = calculateTradeMetrics(trade);
      return metrics.positionStatus === 'CLOSED';
    });
  }, [filteredTrades]);

  // Calculate trade values (R-Multiple or Return %)
  const tradeValues = useMemo(() => {
    return closedTrades.map(trade => {
      const metrics = calculateTradeMetrics(trade);
      const value = displayType === 'rMultiple' ? metrics.rFactor : metrics.returnPercent;
      const isWin = metrics.netPnl > 0;
      const isLoss = metrics.netPnl < 0;
      const isBreakeven = metrics.netPnl === 0;
      return { value, isWin, isLoss, isBreakeven };
    });
  }, [closedTrades, displayType]);

  // Generate buckets based on display type
  const bucketData = useMemo(() => {
    const bucketSize = displayType === 'rMultiple' ? 0.5 : 0.25;
    const maxBucket = displayType === 'rMultiple' ? 10 : 10;
    const minBucket = displayType === 'rMultiple' ? -5 : -10;
    
    // Initialize buckets map
    const bucketsMap = new Map<string, BucketData>();
    
    // Generate all possible buckets from min to max
    for (let start = minBucket; start < maxBucket; start += bucketSize) {
      const end = start + bucketSize;
      const label = displayType === 'rMultiple' 
        ? `${start.toFixed(1)} to ${end.toFixed(1)}`
        : `${start.toFixed(2)}% to ${end.toFixed(2)}%`;
      
      bucketsMap.set(label, {
        label,
        sortOrder: start,
        rangeStart: start,
        rangeEnd: end,
        tradeCount: 0,
        winCount: 0,
        lossCount: 0,
        breakevenCount: 0,
        isWinningBucket: start >= 0,
      });
    }
    
    // Add overflow buckets
    const minOverflowLabel = displayType === 'rMultiple' ? `< ${minBucket.toFixed(1)}` : `< ${minBucket.toFixed(2)}%`;
    const maxOverflowLabel = displayType === 'rMultiple' ? `> ${maxBucket.toFixed(1)}` : `> ${maxBucket.toFixed(2)}%`;
    
    bucketsMap.set(minOverflowLabel, {
      label: minOverflowLabel,
      sortOrder: minBucket - 1,
      rangeStart: -Infinity,
      rangeEnd: minBucket,
      tradeCount: 0,
      winCount: 0,
      lossCount: 0,
      breakevenCount: 0,
      isWinningBucket: false,
    });
    
    bucketsMap.set(maxOverflowLabel, {
      label: maxOverflowLabel,
      sortOrder: maxBucket + 1,
      rangeStart: maxBucket,
      rangeEnd: Infinity,
      tradeCount: 0,
      winCount: 0,
      lossCount: 0,
      breakevenCount: 0,
      isWinningBucket: true,
    });
    
    // Place trades into buckets
    tradeValues.forEach(({ value, isWin, isLoss, isBreakeven }) => {
      let bucketLabel: string;
      
      if (value < minBucket) {
        bucketLabel = minOverflowLabel;
      } else if (value >= maxBucket) {
        bucketLabel = maxOverflowLabel;
      } else {
        // Find the correct bucket
        const bucketStart = Math.floor(value / bucketSize) * bucketSize;
        const bucketEnd = bucketStart + bucketSize;
        bucketLabel = displayType === 'rMultiple'
          ? `${bucketStart.toFixed(1)} to ${bucketEnd.toFixed(1)}`
          : `${bucketStart.toFixed(2)}% to ${bucketEnd.toFixed(2)}%`;
      }
      
      const bucket = bucketsMap.get(bucketLabel);
      if (bucket) {
        bucket.tradeCount++;
        if (isWin) bucket.winCount++;
        if (isLoss) bucket.lossCount++;
        if (isBreakeven) bucket.breakevenCount++;
      }
    });
    
    // Convert to array and sort
    return Array.from(bucketsMap.values())
      .filter(b => b.tradeCount > 0) // Only show buckets with trades
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [tradeValues, displayType]);

  // Calculate metrics
  const metrics = useMemo(() => {
    if (tradeValues.length === 0) {
      return {
        avgValue: 0,
        totalValue: 0,
        avgWinnerValue: 0,
        avgLoserValue: 0,
        avgRRR: 0,
      };
    }

    const allValues = tradeValues.map(t => t.value);
    const winnerValues = tradeValues.filter(t => t.isWin).map(t => t.value);
    const loserValues = tradeValues.filter(t => t.isLoss).map(t => t.value);

    const avgValue = allValues.reduce((a, b) => a + b, 0) / allValues.length;
    const totalValue = allValues.reduce((a, b) => a + b, 0);
    const avgWinnerValue = winnerValues.length > 0 
      ? winnerValues.reduce((a, b) => a + b, 0) / winnerValues.length 
      : 0;
    const avgLoserValue = loserValues.length > 0 
      ? Math.abs(loserValues.reduce((a, b) => a + b, 0) / loserValues.length)
      : 0;

    // Calculate Avg RRR from trade data (tradeTarget / tradeRisk)
    const tradesWithRRR = closedTrades.filter(t => t.tradeRisk > 0 && t.tradeTarget > 0);
    const avgRRR = tradesWithRRR.length > 0
      ? tradesWithRRR.reduce((sum, t) => sum + (t.tradeTarget / t.tradeRisk), 0) / tradesWithRRR.length
      : 0;

    return {
      avgValue,
      totalValue,
      avgWinnerValue,
      avgLoserValue,
      avgRRR,
    };
  }, [tradeValues, closedTrades]);

  // Format value based on display type
  const formatValue = (value: number, showSign: boolean = false): string => {
    if (displayType === 'rMultiple') {
      const sign = showSign && value > 0 ? '+' : '';
      return `${sign}${value.toFixed(2)}R`;
    }
    const sign = showSign && value > 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    
    const data = payload[0].payload as BucketData;
    
    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
        <p className="font-semibold text-foreground mb-2">{data.label}</p>
        <div className="space-y-1 text-sm">
          <p className="text-muted-foreground">
            Number of trades: <span className="text-foreground font-medium">{data.tradeCount}</span>
          </p>
          <p className="text-emerald-500">
            Winners: <span className="font-medium">{data.winCount}</span>
          </p>
          <p className="text-red-500">
            Losers: <span className="font-medium">{data.lossCount}</span>
          </p>
          <p className="text-muted-foreground">
            Break evens: <span className="text-foreground font-medium">{data.breakevenCount}</span>
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Risk Distribution</h1>
        <p className="text-muted-foreground mt-1">
          Analyze how your trade outcomes are distributed across {displayType === 'rMultiple' ? 'R-Multiple' : 'Return %'} ranges.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground font-medium">Display</label>
          <Select value={displayType} onValueChange={(val) => setDisplayType(val as DisplayType)}>
            <SelectTrigger className="w-[160px] bg-background border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border z-50">
              <SelectItem value="rMultiple">R Multiple</SelectItem>
              <SelectItem value="returnPercent">Return (%)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Chart */}
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          {bucketData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={bucketData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis 
                  dataKey="label" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  label={{ 
                    value: 'Number of Trades', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { fill: 'hsl(var(--muted-foreground))' }
                  }}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeWidth={1} />
                <Bar dataKey="tradeCount" radius={[4, 4, 0, 0]}>
                  {bucketData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`}
                      fill={entry.isWinningBucket ? '#10b981' : '#ef4444'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[400px] text-muted-foreground">
              No closed trades to display
            </div>
          )}
        </CardContent>
      </Card>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground font-medium mb-1">
              {displayType === 'rMultiple' ? 'Avg R Multiple' : 'Avg Return (%)'}
            </p>
            <p className={`text-xl font-bold ${metrics.avgValue >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {formatValue(metrics.avgValue)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground font-medium mb-1">
              {displayType === 'rMultiple' ? 'Total R Multiple' : 'Total Return (%)'}
            </p>
            <p className={`text-xl font-bold ${metrics.totalValue >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {formatValue(metrics.totalValue)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground font-medium mb-1">
              {displayType === 'rMultiple' ? 'Avg R Multiple Winner' : 'Avg Return (%) Winner'}
            </p>
            <p className="text-xl font-bold text-emerald-500">
              {formatValue(metrics.avgWinnerValue)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground font-medium mb-1">
              {displayType === 'rMultiple' ? 'Avg R Multiple Loser' : 'Avg Return (%) Loser'}
            </p>
            <p className="text-xl font-bold text-red-500">
              {formatValue(-metrics.avgLoserValue)}
            </p>
          </CardContent>
        </Card>

        {displayType === 'rMultiple' && (
          <Card className="bg-card border-border">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground font-medium mb-1">Avg RRR</p>
              <p className="text-xl font-bold text-foreground">
                {metrics.avgRRR.toFixed(2)}R
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default RiskDistribution;
