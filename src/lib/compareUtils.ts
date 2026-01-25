import { Trade, calculateTradeMetrics } from '@/types/trade';
import { CompareGroupFilters } from '@/components/reports/CompareGroupCard';
import { parseISO, startOfDay, endOfDay, isWithinInterval, format } from 'date-fns';

export interface CompareGroupStats {
  totalPnL: number;
  avgDailyVolume: number;
  avgWinningTrade: number;
  avgLosingTrade: number;
  winningTradesCount: number;
  losingTradesCount: number;
  totalCommissions: number;
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
  winRate: number;
  dateRangeLabel: string;
  matchedTradesCount: number;
}

export interface DailyPnLData {
  date: string;
  netPnl: number;
  cumulativePnl: number;
}

/**
 * Filter trades based on group-specific filters
 */
export function filterTradesForGroup(
  trades: Trade[],
  filters: CompareGroupFilters
): Trade[] {
  let filtered = [...trades];

  // Filter by symbols (OR logic - match ANY selected symbol)
  if (filters.symbols && filters.symbols.length > 0) {
    filtered = filtered.filter(t => filters.symbols.includes(t.symbol));
  }

  // Filter by side
  if (filters.side !== 'all') {
    filtered = filtered.filter(t => t.side.toLowerCase() === filters.side);
  }

  // Filter by trade P&L outcome
  if (filters.tradePnL !== 'all') {
    filtered = filtered.filter(t => {
      const metrics = calculateTradeMetrics(t);
      if (filters.tradePnL === 'win') {
        return metrics.netPnl > 0;
      } else {
        return metrics.netPnl < 0;
      }
    });
  }

  // Filter by tags (OR within category, AND across categories)
  const hasTagFilters = Object.values(filters.tagsByCategory).some(tags => tags.length > 0);
  if (hasTagFilters) {
    filtered = filtered.filter(trade => {
      // For each category that has selected tags, at least one must match
      return Object.entries(filters.tagsByCategory).every(([_category, selectedTags]) => {
        if (selectedTags.length === 0) return true;
        return trade.tags.some(tag => selectedTags.includes(tag));
      });
    });
  }

  // Filter by trade comments
  const { entryComments, tradeManagements, exitComments } = filters.tradeComments;
  
  if (entryComments.length > 0) {
    filtered = filtered.filter(t => 
      t.entryComment && entryComments.includes(t.entryComment)
    );
  }
  
  if (tradeManagements.length > 0) {
    filtered = filtered.filter(t => 
      t.tradeManagement && tradeManagements.includes(t.tradeManagement)
    );
  }
  
  if (exitComments.length > 0) {
    filtered = filtered.filter(t => 
      t.exitComment && exitComments.includes(t.exitComment)
    );
  }

  // Apply date range filter with fallback logic
  const { resolvedStart, resolvedEnd } = resolveDateRange(filtered, filters.startDate, filters.endDate);
  
  if (resolvedStart || resolvedEnd) {
    filtered = filtered.filter(trade => {
      const metrics = calculateTradeMetrics(trade);
      if (!metrics.closeDate) return false;
      
      const tradeDate = parseISO(metrics.closeDate);
      const from = resolvedStart ? startOfDay(resolvedStart) : new Date(0);
      const to = resolvedEnd ? endOfDay(resolvedEnd) : new Date(9999, 11, 31);
      
      return isWithinInterval(tradeDate, { start: from, end: to });
    });
  }

  return filtered;
}

/**
 * Resolve date range with fallback logic:
 * - If both empty: use first and last trade dates
 * - If only start: use start + last trade date
 * - If only end: use first trade date + end
 */
export function resolveDateRange(
  trades: Trade[],
  startDate: Date | undefined,
  endDate: Date | undefined
): { resolvedStart: Date | undefined; resolvedEnd: Date | undefined } {
  if (trades.length === 0) {
    return { resolvedStart: startDate, resolvedEnd: endDate };
  }

  // Get all close dates and sort
  const closeDates = trades
    .map(t => calculateTradeMetrics(t).closeDate)
    .filter(Boolean)
    .map(d => parseISO(d))
    .sort((a, b) => a.getTime() - b.getTime());

  if (closeDates.length === 0) {
    return { resolvedStart: startDate, resolvedEnd: endDate };
  }

  const firstTradeDate = closeDates[0];
  const lastTradeDate = closeDates[closeDates.length - 1];

  let resolvedStart = startDate;
  let resolvedEnd = endDate;

  // Apply fallback logic
  if (!startDate && !endDate) {
    resolvedStart = firstTradeDate;
    resolvedEnd = lastTradeDate;
  } else if (startDate && !endDate) {
    resolvedEnd = lastTradeDate;
  } else if (!startDate && endDate) {
    resolvedStart = firstTradeDate;
  }

  return { resolvedStart, resolvedEnd };
}

/**
 * Calculate statistics for a filtered group of trades
 */
export function calculateGroupStats(
  trades: Trade[],
  filters: CompareGroupFilters
): CompareGroupStats {
  const filteredTrades = filterTradesForGroup(trades, filters);
  
  if (filteredTrades.length === 0) {
    return {
      totalPnL: 0,
      avgDailyVolume: 0,
      avgWinningTrade: 0,
      avgLosingTrade: 0,
      winningTradesCount: 0,
      losingTradesCount: 0,
      totalCommissions: 0,
      maxConsecutiveWins: 0,
      maxConsecutiveLosses: 0,
      winRate: 0,
      dateRangeLabel: 'ALL DATES',
      matchedTradesCount: 0,
    };
  }

  // Calculate metrics for each trade
  const tradesWithMetrics = filteredTrades.map(t => ({
    trade: t,
    metrics: calculateTradeMetrics(t),
  }));

  // Separate winning and losing trades
  const winningTrades = tradesWithMetrics.filter(t => t.metrics.netPnl > 0);
  const losingTrades = tradesWithMetrics.filter(t => t.metrics.netPnl < 0);

  // Total P&L
  const totalPnL = tradesWithMetrics.reduce((sum, t) => sum + t.metrics.netPnl, 0);

  // Total commissions
  const totalCommissions = tradesWithMetrics.reduce((sum, t) => sum + t.metrics.totalCharges, 0);

  // Average winning trade
  const totalWinPnL = winningTrades.reduce((sum, t) => sum + t.metrics.netPnl, 0);
  const avgWinningTrade = winningTrades.length > 0 ? totalWinPnL / winningTrades.length : 0;

  // Average losing trade
  const totalLossPnL = losingTrades.reduce((sum, t) => sum + t.metrics.netPnl, 0);
  const avgLosingTrade = losingTrades.length > 0 ? totalLossPnL / losingTrades.length : 0;

  // Average daily volume
  const tradeDays = new Set(
    tradesWithMetrics
      .map(t => t.metrics.closeDate?.split('T')[0])
      .filter(Boolean)
  );
  const avgDailyVolume = tradeDays.size > 0 
    ? tradesWithMetrics.reduce((sum, t) => sum + t.metrics.totalQuantity, 0) / tradeDays.size
    : 0;

  // Max consecutive wins/losses
  const sortedTrades = [...tradesWithMetrics].sort(
    (a, b) => new Date(a.metrics.closeDate).getTime() - new Date(b.metrics.closeDate).getTime()
  );

  let maxConsecutiveWins = 0;
  let maxConsecutiveLosses = 0;
  let currentWinStreak = 0;
  let currentLossStreak = 0;

  for (const t of sortedTrades) {
    if (t.metrics.netPnl > 0) {
      currentWinStreak++;
      currentLossStreak = 0;
      maxConsecutiveWins = Math.max(maxConsecutiveWins, currentWinStreak);
    } else if (t.metrics.netPnl < 0) {
      currentLossStreak++;
      currentWinStreak = 0;
      maxConsecutiveLosses = Math.max(maxConsecutiveLosses, currentLossStreak);
    } else {
      // Breakeven - reset both streaks
      currentWinStreak = 0;
      currentLossStreak = 0;
    }
  }

  // Win rate (excluding breakeven)
  const totalWinLoss = winningTrades.length + losingTrades.length;
  const winRate = totalWinLoss > 0 ? (winningTrades.length / totalWinLoss) * 100 : 0;

  // Determine date range label
  const { resolvedStart, resolvedEnd } = resolveDateRange(
    filteredTrades, 
    filters.startDate, 
    filters.endDate
  );
  
  let dateRangeLabel = 'ALL DATES';
  if (filters.startDate || filters.endDate) {
    const startStr = resolvedStart ? format(resolvedStart, 'MM/dd/yy') : '';
    const endStr = resolvedEnd ? format(resolvedEnd, 'MM/dd/yy') : '';
    dateRangeLabel = `${startStr} - ${endStr}`;
  }

  return {
    totalPnL,
    avgDailyVolume,
    avgWinningTrade,
    avgLosingTrade,
    winningTradesCount: winningTrades.length,
    losingTradesCount: losingTrades.length,
    totalCommissions,
    maxConsecutiveWins,
    maxConsecutiveLosses,
    winRate,
    dateRangeLabel,
    matchedTradesCount: filteredTrades.length,
  };
}

/**
 * Calculate daily cumulative P&L data for charting
 */
export function calculateDailyCumulativePnL(
  trades: Trade[],
  filters: CompareGroupFilters
): DailyPnLData[] {
  const filteredTrades = filterTradesForGroup(trades, filters);

  if (filteredTrades.length === 0) {
    return [];
  }

  // Group trades by close date
  const dailyPnL: Record<string, number> = {};
  
  for (const trade of filteredTrades) {
    const metrics = calculateTradeMetrics(trade);
    if (!metrics.closeDate) continue;
    
    const dateKey = metrics.closeDate.split('T')[0];
    dailyPnL[dateKey] = (dailyPnL[dateKey] || 0) + metrics.netPnl;
  }

  // Sort dates and calculate cumulative
  const sortedDates = Object.keys(dailyPnL).sort();
  let cumulative = 0;
  
  return sortedDates.map(date => {
    cumulative += dailyPnL[date];
    return {
      date,
      netPnl: dailyPnL[date],
      cumulativePnl: cumulative,
    };
  });
}

/**
 * Get matched trades count for a group
 */
export function getMatchedTradesCount(
  trades: Trade[],
  filters: CompareGroupFilters
): number {
  return filterTradesForGroup(trades, filters).length;
}
