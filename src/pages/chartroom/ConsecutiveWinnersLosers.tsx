import { useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import { useFilteredTrades } from '@/hooks/useFilteredTrades';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { usePrivacyMode } from '@/hooks/usePrivacyMode';
import { calculateTradeMetrics, Trade } from '@/types/trade';
import { parseISO } from 'date-fns';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface Streak {
  type: 'win' | 'loss';
  count: number;
  totalPnl: number;
  trades: Trade[];
  startDate: string;
  endDate: string;
}

const ConsecutiveWinnersLosers = () => {
  const { filteredTrades } = useFilteredTrades();
  const { formatCurrency } = useGlobalFilters();
  const { isPrivacyMode, maskCurrency } = usePrivacyMode();

  // Calculate streaks from trades
  const { streaks, stats, chartData } = useMemo(() => {
    // Sort trades by open date
    const sortedTrades = [...filteredTrades]
      .map(trade => ({
        trade,
        metrics: calculateTradeMetrics(trade),
      }))
      .filter(t => t.metrics.openDate)
      .sort((a, b) => {
        const aTime = parseISO(a.metrics.openDate!).getTime();
        const bTime = parseISO(b.metrics.openDate!).getTime();
        return aTime - bTime;
      });

    if (sortedTrades.length === 0) {
      return { streaks: [], stats: null, chartData: [] };
    }

    // Build streaks
    const allStreaks: Streak[] = [];
    let currentStreak: Streak | null = null;

    sortedTrades.forEach(({ trade, metrics }) => {
      const isWin = metrics.netPnl > 0;
      const type = isWin ? 'win' : 'loss';

      if (!currentStreak || currentStreak.type !== type) {
        // Start new streak
        if (currentStreak) {
          allStreaks.push(currentStreak);
        }
        currentStreak = {
          type,
          count: 1,
          totalPnl: metrics.netPnl,
          trades: [trade],
          startDate: metrics.openDate!,
          endDate: metrics.openDate!,
        };
      } else {
        // Continue streak
        currentStreak.count += 1;
        currentStreak.totalPnl += metrics.netPnl;
        currentStreak.trades.push(trade);
        currentStreak.endDate = metrics.openDate!;
      }
    });

    // Push final streak
    if (currentStreak) {
      allStreaks.push(currentStreak);
    }

    // Calculate statistics
    const winStreaks = allStreaks.filter(s => s.type === 'win');
    const lossStreaks = allStreaks.filter(s => s.type === 'loss');

    const longestWinStreak = winStreaks.length > 0
      ? Math.max(...winStreaks.map(s => s.count))
      : 0;
    const longestLossStreak = lossStreaks.length > 0
      ? Math.max(...lossStreaks.map(s => s.count))
      : 0;
    const avgWinStreak = winStreaks.length > 0
      ? winStreaks.reduce((sum, s) => sum + s.count, 0) / winStreaks.length
      : 0;
    const avgLossStreak = lossStreaks.length > 0
      ? lossStreaks.reduce((sum, s) => sum + s.count, 0) / lossStreaks.length
      : 0;

    // Current streak
    const currentStreakInfo = allStreaks[allStreaks.length - 1] || null;

    const stats = {
      longestWinStreak,
      longestLossStreak,
      avgWinStreak,
      avgLossStreak,
      totalWinStreaks: winStreaks.length,
      totalLossStreaks: lossStreaks.length,
      currentStreak: currentStreakInfo,
    };

    // Chart data - distribution of streak lengths
    const winDistribution: Record<number, number> = {};
    const lossDistribution: Record<number, number> = {};

    winStreaks.forEach(s => {
      winDistribution[s.count] = (winDistribution[s.count] || 0) + 1;
    });
    lossStreaks.forEach(s => {
      lossDistribution[s.count] = (lossDistribution[s.count] || 0) + 1;
    });

    const maxStreak = Math.max(longestWinStreak, longestLossStreak, 1);
    const chartData = [];
    for (let i = 1; i <= maxStreak; i++) {
      chartData.push({
        streak: i,
        wins: winDistribution[i] || 0,
        losses: lossDistribution[i] || 0,
      });
    }

    return { streaks: allStreaks, stats, chartData };
  }, [filteredTrades]);

  // Get top streaks for table
  const topWinStreaks = useMemo(() => {
    return [...streaks]
      .filter(s => s.type === 'win')
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [streaks]);

  const topLossStreaks = useMemo(() => {
    return [...streaks]
      .filter(s => s.type === 'loss')
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [streaks]);

  if (!stats || filteredTrades.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Consecutive Winners/Losers</h1>
            <p className="text-muted-foreground">Analyze your winning and losing streaks</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64 border border-dashed border-border rounded-xl">
          <p className="text-muted-foreground">No trades found for the selected filters</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <TrendingUp className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Consecutive Winners/Losers</h1>
          <p className="text-muted-foreground">Analyze your winning and losing streaks</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl p-4"
        >
          <p className="text-xs text-muted-foreground mb-1">Longest Win Streak</p>
          <p className="text-2xl font-bold text-profit">{stats.longestWinStreak}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-xl p-4"
        >
          <p className="text-xs text-muted-foreground mb-1">Longest Loss Streak</p>
          <p className="text-2xl font-bold text-loss">{stats.longestLossStreak}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-xl p-4"
        >
          <p className="text-xs text-muted-foreground mb-1">Avg Win Streak</p>
          <p className="text-2xl font-bold text-foreground">{stats.avgWinStreak.toFixed(1)}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card rounded-xl p-4"
        >
          <p className="text-xs text-muted-foreground mb-1">Avg Loss Streak</p>
          <p className="text-2xl font-bold text-foreground">{stats.avgLossStreak.toFixed(1)}</p>
        </motion.div>
      </div>

      {/* Current Streak */}
      {stats.currentStreak && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card rounded-xl p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Current Streak</p>
              <p className={cn(
                "text-3xl font-bold",
                stats.currentStreak.type === 'win' ? 'text-profit' : 'text-loss'
              )}>
                {stats.currentStreak.count} {stats.currentStreak.type === 'win' ? 'Wins' : 'Losses'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Streak P&L</p>
              <p className={cn(
                "text-xl font-semibold",
                isPrivacyMode ? 'text-foreground' : stats.currentStreak.totalPnl >= 0 ? 'text-profit' : 'text-loss'
              )}>
                {maskCurrency(stats.currentStreak.totalPnl, formatCurrency)}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Streak Distribution Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card rounded-xl p-6"
      >
        <h2 className="text-lg font-semibold text-foreground mb-4">Streak Length Distribution</h2>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="streak"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                label={{ value: 'Streak Length', position: 'insideBottom', offset: -5, fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                label={{ value: 'Occurrences', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                labelFormatter={(value) => `${value} trades in a row`}
              />
              <Bar dataKey="wins" name="Win Streaks" fill="hsl(var(--profit))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="losses" name="Loss Streaks" fill="hsl(var(--loss))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Top Streaks Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Win Streaks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card rounded-xl p-6"
        >
          <h2 className="text-lg font-semibold text-foreground mb-4">Top Winning Streaks</h2>
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border">
                  <TableHead className="text-muted-foreground">Rank</TableHead>
                  <TableHead className="text-muted-foreground">Wins</TableHead>
                  <TableHead className="text-muted-foreground">Total P&L</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topWinStreaks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                      No winning streaks found
                    </TableCell>
                  </TableRow>
                ) : (
                  topWinStreaks.map((streak, idx) => (
                    <TableRow key={idx} className="border-border">
                      <TableCell className="text-foreground font-medium">#{idx + 1}</TableCell>
                      <TableCell className="text-profit font-semibold">{streak.count}</TableCell>
                      <TableCell className={cn(isPrivacyMode ? 'text-foreground' : 'text-profit')}>
                        {maskCurrency(streak.totalPnl, formatCurrency)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </motion.div>

        {/* Top Loss Streaks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="glass-card rounded-xl p-6"
        >
          <h2 className="text-lg font-semibold text-foreground mb-4">Top Losing Streaks</h2>
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border">
                  <TableHead className="text-muted-foreground">Rank</TableHead>
                  <TableHead className="text-muted-foreground">Losses</TableHead>
                  <TableHead className="text-muted-foreground">Total P&L</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topLossStreaks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                      No losing streaks found
                    </TableCell>
                  </TableRow>
                ) : (
                  topLossStreaks.map((streak, idx) => (
                    <TableRow key={idx} className="border-border">
                      <TableCell className="text-foreground font-medium">#{idx + 1}</TableCell>
                      <TableCell className="text-loss font-semibold">{streak.count}</TableCell>
                      <TableCell className={cn(isPrivacyMode ? 'text-foreground' : 'text-loss')}>
                        {maskCurrency(streak.totalPnl, formatCurrency)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ConsecutiveWinnersLosers;
