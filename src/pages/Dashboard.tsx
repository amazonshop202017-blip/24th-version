import { DollarSign } from 'lucide-react';
import { RecentTrades } from '@/components/dashboard/RecentTrades';
import { WinRateGauge } from '@/components/dashboard/WinRateGauge';
import { ProfitFactorRing } from '@/components/dashboard/ProfitFactorRing';
import { AvgWinLossRatio } from '@/components/dashboard/AvgWinLossRatio';
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

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Net P&L with Total Trades */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0 }}
          className="glass-card rounded-2xl p-4 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 opacity-5 transform translate-x-6 -translate-y-6">
            <DollarSign className="w-full h-full" />
          </div>
          <div className="relative z-10">
            <p className="stat-label mb-1 text-xs">Net P&L</p>
            <p className={`text-xl font-bold font-mono ${stats.netPnl >= 0 ? 'profit-text' : 'loss-text'}`}>
              {formatCurrency(stats.netPnl)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">
              Total Trades: {stats.totalTrades}
            </p>
          </div>
        </motion.div>

        {/* Trade Win Rate */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="glass-card rounded-2xl p-4 flex items-center justify-center"
        >
          <WinRateGauge 
            value={stats.tradeWinRate} 
            label="Trade Win Rate"
            winners={stats.winningTrades}
            losers={stats.losingTrades}
            size={100}
          />
        </motion.div>

        {/* Day Win Rate */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="glass-card rounded-2xl p-4 flex items-center justify-center"
        >
          <WinRateGauge 
            value={stats.dayWinRate} 
            label="Day Win Rate"
            size={100}
          />
        </motion.div>

        {/* Profit Factor */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="glass-card rounded-2xl p-4 flex items-center justify-center"
        >
          <ProfitFactorRing 
            profitFactor={stats.profitFactor}
            totalProfits={stats.totalProfits}
            totalLosses={stats.totalLosses}
            size={100}
          />
        </motion.div>

        {/* Avg Win/Loss Ratio */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="glass-card rounded-2xl p-4 flex items-center justify-center"
        >
          <AvgWinLossRatio 
            avgWin={stats.avgWin}
            avgLoss={stats.avgLoss}
          />
        </motion.div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <RecentTrades />
      </div>
    </div>
  );
};

export default Dashboard;
