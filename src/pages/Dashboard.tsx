import { DollarSign, TrendingUp, Calendar } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentTrades } from '@/components/dashboard/RecentTrades';
import { WinRateGauge } from '@/components/dashboard/WinRateGauge';
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
        <StatCard
          label="Net P&L"
          value={formatCurrency(stats.netPnl)}
          icon={<DollarSign className="w-6 h-6" />}
          trend={stats.netPnl >= 0 ? 'profit' : 'loss'}
          delay={0}
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="glass-card rounded-2xl p-6 flex items-center justify-center"
        >
          <WinRateGauge value={stats.tradeWinRate} />
        </motion.div>
        <StatCard
          label="Day Win Rate"
          value={`${stats.dayWinRate.toFixed(1)}%`}
          icon={<Calendar className="w-6 h-6" />}
          trend={stats.dayWinRate >= 50 ? 'profit' : stats.dayWinRate > 0 ? 'loss' : 'neutral'}
          delay={0.2}
        />
        <StatCard
          label="Total Trades"
          value={stats.totalTrades}
          icon={<TrendingUp className="w-6 h-6" />}
          delay={0.3}
        />
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
