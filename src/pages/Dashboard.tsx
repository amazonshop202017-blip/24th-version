import { DollarSign } from 'lucide-react';
import { RecentTrades } from '@/components/dashboard/RecentTrades';
import { WinRateGauge } from '@/components/dashboard/WinRateGauge';
import { ProfitFactorRing } from '@/components/dashboard/ProfitFactorRing';
import { useTradesContext } from '@/contexts/TradesContext';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const { stats } = useTradesContext();

  const formatCurrency = (value: number) => {
    const prefix = value >= 0 ? '+$' : '-$';
    return `${prefix}${Math.abs(value).toFixed(2)}`;
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Track your trading performance</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Net P&L with Total Trades */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0 }}
          className="glass-card rounded-2xl p-6 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 opacity-5 transform translate-x-8 -translate-y-8">
            <DollarSign className="w-full h-full" />
          </div>
          <div className="relative z-10">
            <p className="stat-label mb-2">Net P&L</p>
            <p className={`stat-value ${stats.netPnl >= 0 ? 'profit-text' : 'loss-text'}`}>
              {formatCurrency(stats.netPnl)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Total Trades: {stats.totalTrades}
            </p>
          </div>
        </motion.div>

        {/* Trade Win Rate */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="glass-card rounded-2xl p-6 flex items-center justify-center"
        >
          <WinRateGauge 
            value={stats.tradeWinRate} 
            label="Trade Win Rate"
            winners={stats.winningTrades}
            losers={stats.losingTrades}
          />
        </motion.div>

        {/* Day Win Rate */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="glass-card rounded-2xl p-6 flex items-center justify-center"
        >
          <WinRateGauge 
            value={stats.dayWinRate} 
            label="Day Win Rate"
          />
        </motion.div>

        {/* Profit Factor */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="glass-card rounded-2xl p-6 flex items-center justify-center"
        >
          <ProfitFactorRing 
            profitFactor={stats.profitFactor}
            totalProfits={stats.totalProfits}
            totalLosses={stats.totalLosses}
          />
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentTrades />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="glass-card rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold mb-4">Performance Summary</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-profit/10">
              <p className="text-sm text-muted-foreground mb-1">Avg Win</p>
              <p className="text-xl font-mono font-bold profit-text">
                +${stats.avgWin.toFixed(2)}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-loss/10">
              <p className="text-sm text-muted-foreground mb-1">Avg Loss</p>
              <p className="text-xl font-mono font-bold loss-text">
                ${stats.avgLoss.toFixed(2)}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-secondary">
              <p className="text-sm text-muted-foreground mb-1">Winning Trades</p>
              <p className="text-xl font-mono font-bold profit-text">
                {stats.winningTrades}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-secondary">
              <p className="text-sm text-muted-foreground mb-1">Losing Trades</p>
              <p className="text-xl font-mono font-bold loss-text">
                {stats.losingTrades}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
