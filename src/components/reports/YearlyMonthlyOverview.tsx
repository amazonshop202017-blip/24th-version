import { useState, useMemo } from 'react';
import { useFilteredTrades } from '@/hooks/useFilteredTrades';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { usePrivacyMode, PRIVACY_MASK } from '@/hooks/usePrivacyMode';
import { calculateTradeMetrics } from '@/types/trade';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

type ViewMode = 'winrate' | 'pnl';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface MonthData {
  trades: number;
  wins: number;
  netPnl: number;
}

export const YearlyMonthlyOverview = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('winrate');
  const { filteredTrades } = useFilteredTrades();
  const { formatCurrency } = useGlobalFilters();
  const { isPrivacyMode } = usePrivacyMode();

  // Group trades by year and month (using close date)
  const yearlyData = useMemo(() => {
    const data: Record<number, Record<number, MonthData>> = {};

    filteredTrades.forEach((trade) => {
      const metrics = calculateTradeMetrics(trade);
      const closeDate = metrics.closeDate;
      if (!closeDate) return;

      const date = new Date(closeDate);
      const year = date.getFullYear();
      const month = date.getMonth();

      if (!data[year]) data[year] = {};
      if (!data[year][month]) data[year][month] = { trades: 0, wins: 0, netPnl: 0 };

      data[year][month].trades += 1;
      if (metrics.netPnl > 0) data[year][month].wins += 1;
      data[year][month].netPnl += metrics.netPnl;
    });

    return data;
  }, [filteredTrades]);

  // Get sorted years (latest first)
  const years = useMemo(() => {
    return Object.keys(yearlyData).map(Number).sort((a, b) => b - a);
  }, [yearlyData]);

  // Calculate year totals
  const getYearTotal = (year: number): MonthData => {
    const months = yearlyData[year] || {};
    return Object.values(months).reduce(
      (acc, m) => ({ trades: acc.trades + m.trades, wins: acc.wins + m.wins, netPnl: acc.netPnl + m.netPnl }),
      { trades: 0, wins: 0, netPnl: 0 }
    );
  };

  // Win rate blue intensity (0-100% maps to opacity)
  const getWinRateBg = (winRate: number): string => {
    if (winRate >= 70) return 'bg-blue-600';
    if (winRate >= 50) return 'bg-blue-600/70';
    if (winRate >= 30) return 'bg-blue-600/45';
    return 'bg-blue-600/25';
  };

  const getPnlBg = (pnl: number): string => {
    return pnl >= 0 ? 'bg-profit/20' : 'bg-loss/20';
  };

  const renderCell = (data: MonthData | undefined) => {
    if (!data || data.trades === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <span className="text-muted-foreground text-xs">--</span>
        </div>
      );
    }

    if (viewMode === 'winrate') {
      const winRate = (data.wins / data.trades) * 100;
      return (
        <div className={cn("flex flex-col items-center justify-center h-full rounded px-1 py-1", getWinRateBg(winRate))}>
          <span className="text-xs font-semibold text-white">{winRate.toFixed(0)}%</span>
          <span className="text-[10px] text-blue-200">{data.trades} trade{data.trades !== 1 ? 's' : ''}</span>
        </div>
      );
    }

    // P&L mode
    return (
      <div className={cn("flex flex-col items-center justify-center h-full rounded px-1 py-1", getPnlBg(data.netPnl))}>
        <span className={cn("text-xs font-semibold", data.netPnl >= 0 ? 'text-profit' : 'text-loss')}>
          {isPrivacyMode ? PRIVACY_MASK : formatCurrency(data.netPnl, false)}
        </span>
        <span className="text-[10px] text-muted-foreground">{data.trades} trade{data.trades !== 1 ? 's' : ''}</span>
      </div>
    );
  };

  if (years.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="glass-card rounded-2xl p-4 sm:p-5"
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <h3 className="text-sm font-semibold text-foreground">Yearly calendar</h3>
        <div className="flex items-center gap-0.5 bg-secondary/60 rounded-lg p-0.5">
          <button
            onClick={() => setViewMode('winrate')}
            className={cn(
              "px-3 py-1 text-xs font-medium rounded-md transition-colors",
              viewMode === 'winrate'
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Win rate
          </button>
          <button
            onClick={() => setViewMode('pnl')}
            className={cn(
              "px-3 py-1 text-xs font-medium rounded-md transition-colors",
              viewMode === 'pnl'
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            P&L
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left text-muted-foreground font-medium px-2 py-2 w-16">Year</th>
              {MONTHS.map((m) => (
                <th key={m} className="text-center text-muted-foreground font-medium px-1 py-2 min-w-[80px]">{m}</th>
              ))}
              <th className="text-center text-muted-foreground font-medium px-2 py-2 min-w-[80px]">Total</th>
            </tr>
          </thead>
          <tbody>
            {years.map((year) => {
              const total = getYearTotal(year);
              return (
                <tr key={year} className="border-b border-border/30">
                  <td className="text-foreground font-semibold px-2 py-2">{year}</td>
                  {Array.from({ length: 12 }, (_, monthIdx) => {
                    const monthData = yearlyData[year]?.[monthIdx];
                    return (
                      <td key={monthIdx} className="px-1 py-1.5">
                        {renderCell(monthData)}
                      </td>
                    );
                  })}
                  <td className="px-1 py-1.5">
                    {renderCell(total)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};
