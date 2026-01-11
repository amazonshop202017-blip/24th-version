import { RecentTrades } from '@/components/dashboard/RecentTrades';
import { WinRateGauge } from '@/components/dashboard/WinRateGauge';
import { ProfitFactorRing } from '@/components/dashboard/ProfitFactorRing';
import { AvgWinLossRatio } from '@/components/dashboard/AvgWinLossRatio';
import { DailyCumulativePnLChart } from '@/components/dashboard/DailyCumulativePnLChart';
import { NetDailyPnLChart } from '@/components/dashboard/NetDailyPnLChart';
import { TradeTimePerformanceChart } from '@/components/dashboard/TradeTimePerformanceChart';
import { TradeDurationPerformanceChart } from '@/components/dashboard/TradeDurationPerformanceChart';
import { MonthlyPerformanceCalendar } from '@/components/dashboard/MonthlyPerformanceCalendar';
import { InstrumentAnalysisChart } from '@/components/dashboard/InstrumentAnalysisChart';
import { LongShortAnalysisChart } from '@/components/dashboard/LongShortAnalysisChart';
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

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Net P&L with Total Trades */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0 }}
          className="glass-card rounded-xl px-4 py-3"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xs text-muted-foreground">Net P&L</span>
            <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
              {stats.totalTrades}
            </span>
          </div>
          <p className={`text-2xl font-bold font-mono ${stats.netPnl >= 0 ? 'profit-text' : 'loss-text'}`}>
            {formatCurrency(stats.netPnl)}
          </p>
        </motion.div>

        {/* Trade Win Rate */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="glass-card rounded-xl px-4 py-3"
        >
          <WinRateGauge 
            value={stats.tradeWinRate} 
            label="Trade Win %"
            winners={stats.winningTrades}
            losers={stats.losingTrades}
            breakeven={0}
          />
        </motion.div>

        {/* Profit Factor */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="glass-card rounded-xl px-4 py-3"
        >
          <ProfitFactorRing 
            profitFactor={stats.profitFactor}
            totalProfits={stats.totalProfits}
            totalLosses={stats.totalLosses}
          />
        </motion.div>

        {/* Day Win Rate */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="glass-card rounded-xl px-4 py-3"
        >
          <WinRateGauge 
            value={stats.dayWinRate} 
            label="Day Win %"
          />
        </motion.div>

        {/* Avg Win/Loss Ratio */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="glass-card rounded-xl px-4 py-3"
        >
          <AvgWinLossRatio 
            avgWin={stats.avgWin}
            avgLoss={stats.avgLoss}
          />
        </motion.div>
      </div>

      {/* 3-column grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Row 1: Recent Trades | Daily Cumulative P&L | Net Daily P&L */}
        <div className="lg:col-span-1">
          <RecentTrades />
        </div>
        <div className="lg:col-span-1">
          <DailyCumulativePnLChart />
        </div>
        <div className="lg:col-span-1">
          <NetDailyPnLChart />
        </div>

        {/* Row 2-3: Calendar (spans 2 cols × 2 rows) | Trade Time + Trade Duration (stacked in col 3) */}
        <div className="lg:col-span-2 lg:row-span-2">
          <MonthlyPerformanceCalendar />
        </div>
        <div className="lg:col-span-1">
          <TradeTimePerformanceChart />
        </div>
        <div className="lg:col-span-1">
          <TradeDurationPerformanceChart />
        </div>

        {/* Row 4: Instrument Analysis (2 cols) | Long/Short Analysis (1 col) */}
        <div className="lg:col-span-2">
          <InstrumentAnalysisChart />
        </div>
        <div className="lg:col-span-1">
          <LongShortAnalysisChart />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
