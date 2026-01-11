import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useTradesContext } from '@/contexts/TradesContext';
import { calculateTradeMetrics } from '@/types/trade';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export const RecentTrades = () => {
  const { trades } = useTradesContext();
  const recentTrades = [...trades].sort((a, b) => {
    const metricsA = calculateTradeMetrics(a);
    const metricsB = calculateTradeMetrics(b);
    return new Date(metricsB.closeDate || 0).getTime() - new Date(metricsA.closeDate || 0).getTime();
  }).slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="glass-card rounded-2xl p-6"
    >
      <h3 className="text-lg font-semibold mb-4">Recent Trades</h3>
      
      {recentTrades.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No trades yet</p>
          <p className="text-sm mt-1">Click the + button to add your first trade</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recentTrades.map((trade, index) => {
            const metrics = calculateTradeMetrics(trade);
            return (
              <motion.div
                key={trade.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    trade.side === 'LONG' ? "bg-profit/20" : "bg-loss/20"
                  )}>
                    {trade.side === 'LONG' ? (
                      <ArrowUpRight className="w-5 h-5 profit-text" />
                    ) : (
                      <ArrowDownRight className="w-5 h-5 loss-text" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold">{trade.symbol}</p>
                    <p className="text-xs text-muted-foreground">
                      {metrics.closeDate ? format(new Date(metrics.closeDate), 'MMM dd, yyyy') : '-'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "font-mono font-semibold",
                    metrics.netPnl >= 0 ? "profit-text" : "loss-text"
                  )}>
                    {metrics.netPnl >= 0 ? '+' : ''}₹{metrics.netPnl.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">{trade.side}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};
