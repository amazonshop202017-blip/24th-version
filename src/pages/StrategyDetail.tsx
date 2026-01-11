import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Target, TrendingUp, TrendingDown, Percent, Activity, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useStrategiesContext } from '@/contexts/StrategiesContext';
import { useTradesContext } from '@/contexts/TradesContext';
import { calculateTradeMetrics } from '@/types/trade';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const StrategyDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getStrategyById } = useStrategiesContext();
  const { trades } = useTradesContext();

  const strategy = id ? getStrategyById(id) : undefined;

  const strategyTrades = useMemo(() => {
    return trades.filter(t => t.strategyId === id);
  }, [trades, id]);

  const stats = useMemo(() => {
    if (strategyTrades.length === 0) {
      return {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        winRate: 0,
        totalPnl: 0,
        avgWin: 0,
        avgLoss: 0,
        profitFactor: 0,
        avgRFactor: 0,
      };
    }

    const tradesWithMetrics = strategyTrades.map(t => ({
      trade: t,
      metrics: calculateTradeMetrics(t),
    }));

    const wins = tradesWithMetrics.filter(t => t.metrics.netPnl > 0);
    const losses = tradesWithMetrics.filter(t => t.metrics.netPnl < 0);

    const totalPnl = tradesWithMetrics.reduce((sum, t) => sum + t.metrics.netPnl, 0);
    const avgWin = wins.length > 0 ? wins.reduce((sum, t) => sum + t.metrics.netPnl, 0) / wins.length : 0;
    const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((sum, t) => sum + t.metrics.netPnl, 0) / losses.length) : 0;
    const profitFactor = avgLoss > 0 ? (avgWin * wins.length) / (avgLoss * losses.length) : 0;
    const avgRFactor = tradesWithMetrics.reduce((sum, t) => sum + t.metrics.rFactor, 0) / tradesWithMetrics.length;

    return {
      totalTrades: strategyTrades.length,
      winningTrades: wins.length,
      losingTrades: losses.length,
      winRate: (wins.length / strategyTrades.length) * 100,
      totalPnl,
      avgWin,
      avgLoss,
      profitFactor,
      avgRFactor,
    };
  }, [strategyTrades]);

  if (!strategy) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-muted-foreground mb-4">Strategy not found</p>
        <Button onClick={() => navigate('/strategies')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Strategies
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/strategies')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <Target className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{strategy.name}</h1>
            {strategy.description && (
              <p className="text-muted-foreground text-sm">{strategy.description}</p>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue="stats" className="space-y-6">
        <TabsList>
          <TabsTrigger value="stats">Stats</TabsTrigger>
          <TabsTrigger value="trades">Trades ({strategyTrades.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="stats">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total P&L */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-xl p-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  stats.totalPnl >= 0 ? "bg-profit/20" : "bg-loss/20"
                )}>
                  {stats.totalPnl >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-profit" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-loss" />
                  )}
                </div>
                <span className="text-sm text-muted-foreground">Total P&L</span>
              </div>
              <p className={cn(
                "text-2xl font-bold font-mono",
                stats.totalPnl >= 0 ? "profit-text" : "loss-text"
              )}>
                ₹{stats.totalPnl.toFixed(2)}
              </p>
            </motion.div>

            {/* Win Rate */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card rounded-xl p-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Percent className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground">Win Rate</span>
              </div>
              <p className="text-2xl font-bold font-mono">
                {stats.winRate.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.winningTrades}W / {stats.losingTrades}L
              </p>
            </motion.div>

            {/* Profit Factor */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card rounded-xl p-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground">Profit Factor</span>
              </div>
              <p className="text-2xl font-bold font-mono">
                {stats.profitFactor.toFixed(2)}
              </p>
            </motion.div>

            {/* Avg R Factor */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card rounded-xl p-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Target className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground">Avg R Factor</span>
              </div>
              <p className="text-2xl font-bold font-mono">
                {stats.avgRFactor.toFixed(2)}R
              </p>
            </motion.div>
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="glass-card rounded-xl p-5">
              <p className="text-sm text-muted-foreground mb-1">Total Trades</p>
              <p className="text-xl font-bold">{stats.totalTrades}</p>
            </div>
            <div className="glass-card rounded-xl p-5">
              <p className="text-sm text-muted-foreground mb-1">Average Win</p>
              <p className="text-xl font-bold font-mono profit-text">₹{stats.avgWin.toFixed(2)}</p>
            </div>
            <div className="glass-card rounded-xl p-5">
              <p className="text-sm text-muted-foreground mb-1">Average Loss</p>
              <p className="text-xl font-bold font-mono loss-text">₹{stats.avgLoss.toFixed(2)}</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="trades">
          {strategyTrades.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-30" />
              <p className="text-muted-foreground">No trades linked to this strategy yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add trades and select this strategy to see them here
              </p>
            </div>
          ) : (
            <div className="glass-card rounded-2xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead>Symbol</TableHead>
                    <TableHead>Side</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">P&L</TableHead>
                    <TableHead className="text-right">R Factor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {strategyTrades.map((trade) => {
                    const metrics = calculateTradeMetrics(trade);
                    return (
                      <TableRow key={trade.id} className="border-border">
                        <TableCell className="font-medium">{trade.symbol}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              trade.side === 'LONG'
                                ? 'border-profit text-profit'
                                : 'border-loss text-loss'
                            )}
                          >
                            {trade.side}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {metrics.openDate ? format(new Date(metrics.openDate), 'MMM dd, yyyy') : '-'}
                        </TableCell>
                        <TableCell className={cn(
                          "text-right font-mono font-medium",
                          metrics.netPnl >= 0 ? "profit-text" : "loss-text"
                        )}>
                          ₹{metrics.netPnl.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {metrics.rFactor.toFixed(2)}R
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StrategyDetail;
