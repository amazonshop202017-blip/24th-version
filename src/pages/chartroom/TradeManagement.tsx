import { useMemo } from 'react';
import { useFilteredTradesContext } from '@/contexts/TradesContext';
import { calculateTradeMetrics, Trade } from '@/types/trade';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ChartDataPoint {
  tradeIndex: number;
  tradeId: string;
  actualR: number;
  potentialR: number;
  cumulativeActual: number;
  cumulativePotential: number;
}

const TradeManagement = () => {
  const { filteredTrades } = useFilteredTradesContext();

  const chartData = useMemo(() => {
    // Filter eligible trades: must have entry price, stop loss, take profit, direction, and priceReachedFirst
    const eligibleTrades = filteredTrades.filter(trade => {
      const metrics = calculateTradeMetrics(trade);
      
      // Must be closed trade
      if (metrics.positionStatus !== 'CLOSED') return false;
      
      // Must have avg entry price
      if (!metrics.avgEntryPrice || metrics.avgEntryPrice <= 0) return false;
      
      // Must have stop loss
      if (!trade.stopLoss || trade.stopLoss <= 0) return false;
      
      // Must have take profit
      if (!trade.takeProfit || trade.takeProfit <= 0) return false;
      
      // Must have direction (side)
      if (!trade.side) return false;
      
      // Must have priceReachedFirst
      if (!trade.priceReachedFirst) return false;
      
      // Must have savedRMultiple for actual performance
      if (trade.savedRMultiple === undefined) return false;
      
      return true;
    });

    // Sort by entry date (openDate)
    const sortedTrades = [...eligibleTrades].sort((a, b) => {
      const metricsA = calculateTradeMetrics(a);
      const metricsB = calculateTradeMetrics(b);
      return new Date(metricsA.openDate).getTime() - new Date(metricsB.openDate).getTime();
    });

    // Build chart data
    let cumulativeActual = 0;
    let cumulativePotential = 0;
    
    const data: ChartDataPoint[] = sortedTrades.map((trade, index) => {
      const metrics = calculateTradeMetrics(trade);
      
      // Actual R: Use the stored savedRMultiple
      const actualR = trade.savedRMultiple ?? 0;
      
      // Potential R: Set and forget logic
      let potentialR = 0;
      
      if (trade.priceReachedFirst === 'takeProfit') {
        // Calculate planned RR
        const entry = metrics.avgEntryPrice;
        const tp = trade.takeProfit!;
        const sl = trade.stopLoss!;
        
        if (trade.side === 'LONG') {
          // Long: (TP - Entry) / (Entry - SL)
          const risk = entry - sl;
          const reward = tp - entry;
          potentialR = risk > 0 ? reward / risk : 0;
        } else {
          // Short: (Entry - TP) / (SL - Entry)
          const risk = sl - entry;
          const reward = entry - tp;
          potentialR = risk > 0 ? reward / risk : 0;
        }
      } else if (trade.priceReachedFirst === 'stopLoss') {
        potentialR = -1;
      }
      
      cumulativeActual += actualR;
      cumulativePotential += potentialR;
      
      return {
        tradeIndex: index + 1,
        tradeId: trade.id,
        actualR: parseFloat(actualR.toFixed(2)),
        potentialR: parseFloat(potentialR.toFixed(2)),
        cumulativeActual: parseFloat(cumulativeActual.toFixed(2)),
        cumulativePotential: parseFloat(cumulativePotential.toFixed(2)),
      };
    });
    
    return data;
  }, [filteredTrades]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as ChartDataPoint;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-foreground mb-2">Trade ID: {data.tradeId.slice(0, 8)}...</p>
          <div className="space-y-1 text-sm">
            <p className="text-muted-foreground">
              Actual R: <span className={data.actualR >= 0 ? 'text-green-500' : 'text-red-500'}>{data.actualR}</span>
            </p>
            <p className="text-muted-foreground">
              Cumulative Actual: <span className={data.cumulativeActual >= 0 ? 'text-green-500' : 'text-red-500'}>{data.cumulativeActual}</span>
            </p>
            <p className="text-muted-foreground">
              Potential R: <span className={data.potentialR >= 0 ? 'text-green-500' : 'text-red-500'}>{data.potentialR}</span>
            </p>
            <p className="text-muted-foreground">
              Cumulative Potential: <span className={data.cumulativePotential >= 0 ? 'text-green-500' : 'text-red-500'}>{data.cumulativePotential}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Trade Management</h1>
        <p className="text-muted-foreground mt-1">Compare your actual performance vs set-and-forget potential</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Actual vs Potential Performance (R-Multiple)</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <div className="h-96 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <p className="text-lg font-medium mb-2">No eligible trades found</p>
                <p className="text-sm">
                  Trades must have: Entry Price, Stop Loss, Take Profit, Direction, 
                  saved R-Multiple, and "Which level did the price reach first?" set.
                </p>
              </div>
            </div>
          ) : (
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="tradeIndex" 
                    stroke="hsl(var(--muted-foreground))"
                    label={{ value: 'Trades', position: 'bottom', offset: 0, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    label={{ value: 'R-Multiple', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="top" height={36} />
                  <Line 
                    type="monotone" 
                    dataKey="cumulativeActual" 
                    name="Actual Performance"
                    stroke="hsl(var(--chart-1))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--chart-1))', strokeWidth: 0, r: 3 }}
                    activeDot={{ r: 5, fill: 'hsl(var(--chart-1))' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="cumulativePotential" 
                    name="Potential Performance"
                    stroke="hsl(var(--chart-2))" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ fill: 'hsl(var(--chart-2))', strokeWidth: 0, r: 3 }}
                    activeDot={{ r: 5, fill: 'hsl(var(--chart-2))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {chartData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{chartData.length}</p>
                <p className="text-sm text-muted-foreground">Eligible Trades</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className={`text-2xl font-bold ${chartData[chartData.length - 1]?.cumulativeActual >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {chartData[chartData.length - 1]?.cumulativeActual.toFixed(2) ?? '0.00'}R
                </p>
                <p className="text-sm text-muted-foreground">Total Actual Performance</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className={`text-2xl font-bold ${chartData[chartData.length - 1]?.cumulativePotential >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {chartData[chartData.length - 1]?.cumulativePotential.toFixed(2) ?? '0.00'}R
                </p>
                <p className="text-sm text-muted-foreground">Total Potential Performance</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TradeManagement;
