import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTradesContext } from '@/contexts/TradesContext';
import { calculateTradeMetrics } from '@/types/trade';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

export const RecentTrades = () => {
  const { trades } = useTradesContext();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showViewMore, setShowViewMore] = useState(false);

  // Get closed trades sorted by close date (most recent first)
  const closedTrades = trades
    .filter(trade => calculateTradeMetrics(trade).positionStatus === 'CLOSED')
    .sort((a, b) => {
      const metricsA = calculateTradeMetrics(a);
      const metricsB = calculateTradeMetrics(b);
      return new Date(metricsB.closeDate || 0).getTime() - new Date(metricsA.closeDate || 0).getTime();
    });

  const recentTrades = closedTrades.slice(0, 10);
  const hasMoreTrades = closedTrades.length >= 10;

  // Get open trades
  const openTrades = trades
    .filter(trade => calculateTradeMetrics(trade).positionStatus === 'OPEN')
    .sort((a, b) => {
      const metricsA = calculateTradeMetrics(a);
      const metricsB = calculateTradeMetrics(b);
      return new Date(metricsB.openDate || 0).getTime() - new Date(metricsA.openDate || 0).getTime();
    });

  // Check if scrolled to bottom
  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.target as HTMLDivElement;
    const isAtBottom = Math.abs(target.scrollHeight - target.scrollTop - target.clientHeight) < 10;
    setShowViewMore(isAtBottom && hasMoreTrades);
  };

  const TradeItem = ({ trade, index }: { trade: typeof trades[0]; index: number }) => {
    const metrics = calculateTradeMetrics(trade);
    const isOpen = metrics.positionStatus === 'OPEN';

    return (
      <motion.div
        key={trade.id}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.05 * index }}
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
              {isOpen 
                ? `Opened: ${metrics.openDate ? format(new Date(metrics.openDate), 'MMM dd, yyyy') : '-'}`
                : metrics.closeDate ? format(new Date(metrics.closeDate), 'MMM dd, yyyy') : '-'
              }
            </p>
          </div>
        </div>
        <div className="text-right">
          {isOpen ? (
            <>
              <p className="font-mono font-semibold text-muted-foreground">
                {metrics.openQuantity} qty
              </p>
              <p className="text-xs text-muted-foreground">{trade.side}</p>
            </>
          ) : (
            <>
              <p className={cn(
                "font-mono font-semibold",
                metrics.netPnl >= 0 ? "profit-text" : "loss-text"
              )}>
                {metrics.netPnl >= 0 ? '+' : ''}₹{metrics.netPnl.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">{trade.side}</p>
            </>
          )}
        </div>
      </motion.div>
    );
  };

  const EmptyState = ({ message }: { message: string }) => (
    <div className="text-center py-8 text-muted-foreground">
      <p>{message}</p>
      <p className="text-sm mt-1">Click the + button to add your first trade</p>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="glass-card rounded-2xl p-6"
    >
      <Tabs defaultValue="recent" className="w-full">
        <TabsList className="w-full mb-4">
          <TabsTrigger value="recent" className="flex-1">Recent Trades</TabsTrigger>
          <TabsTrigger value="open" className="flex-1">Open Positions</TabsTrigger>
        </TabsList>

        <TabsContent value="recent" className="mt-0">
          {recentTrades.length === 0 ? (
            <EmptyState message="No closed trades yet" />
          ) : (
            <div className="relative">
              <ScrollArea 
                className="h-[320px] pr-3"
                onScrollCapture={handleScroll}
              >
                <div className="space-y-3">
                  {recentTrades.map((trade, index) => (
                    <TradeItem key={trade.id} trade={trade} index={index} />
                  ))}
                </div>
                
                {showViewMore && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="pt-4 pb-2 text-center"
                  >
                    <button
                      onClick={() => navigate('/trades')}
                      className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                    >
                      View More →
                    </button>
                  </motion.div>
                )}
              </ScrollArea>
            </div>
          )}
        </TabsContent>

        <TabsContent value="open" className="mt-0">
          {openTrades.length === 0 ? (
            <EmptyState message="No open positions" />
          ) : (
            <ScrollArea className="h-[320px] pr-3">
              <div className="space-y-3">
                {openTrades.map((trade, index) => (
                  <TradeItem key={trade.id} trade={trade} index={index} />
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};
