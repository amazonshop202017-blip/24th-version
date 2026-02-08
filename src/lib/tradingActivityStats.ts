import { Trade, calculateTradeMetrics } from '@/types/trade';
import { parseISO, format } from 'date-fns';

/**
 * Interface for trading activity statistics
 */
export interface TradingActivityStats {
  avgTradesPerDay: number;
  medianTradesPerDay: number;
  percentile90TradesPerDay: number;
  loggedDays: number;
}

/**
 * Calculate trading activity statistics from an array of daily counts
 * @param dailyCounts Array of trade counts per day
 * @returns Trading activity statistics
 */
export const calculateTradingActivityStatsFromCounts = (dailyCounts: number[]): TradingActivityStats => {
  const loggedDays = dailyCounts.length;
  
  if (loggedDays === 0) {
    return {
      avgTradesPerDay: 0,
      medianTradesPerDay: 0,
      percentile90TradesPerDay: 0,
      loggedDays: 0,
    };
  }
  
  // Average
  const totalTrades = dailyCounts.reduce((sum, count) => sum + count, 0);
  const avgTradesPerDay = totalTrades / loggedDays;
  
  // Median
  const sortedCounts = [...dailyCounts].sort((a, b) => a - b);
  let medianTradesPerDay: number;
  const n = sortedCounts.length;
  if (n % 2 === 1) {
    medianTradesPerDay = sortedCounts[Math.floor(n / 2)];
  } else {
    const mid = n / 2;
    medianTradesPerDay = (sortedCounts[mid - 1] + sortedCounts[mid]) / 2;
  }
  
  // 90th percentile (nearest-rank method)
  const percentileIndex = Math.ceil(0.9 * n) - 1;
  const percentile90TradesPerDay = sortedCounts[Math.min(percentileIndex, n - 1)];
  
  return {
    avgTradesPerDay,
    medianTradesPerDay,
    percentile90TradesPerDay,
    loggedDays,
  };
};

/**
 * Build a map of group -> daily counts map for calculating per-group trading activity
 * @param trades Array of trades
 * @param getGroupKey Function to extract group key from a trade
 * @returns Map of group key -> Map of date string -> trade count
 */
export const buildGroupDailyCounts = (
  trades: Trade[],
  getGroupKey: (trade: Trade) => string | string[]
): Map<string, Map<string, number>> => {
  const groupDailyCounts = new Map<string, Map<string, number>>();
  
  trades.forEach(trade => {
    const metrics = calculateTradeMetrics(trade);
    const dateStr = metrics.openDate;
    if (!dateStr) return;
    
    const date = parseISO(dateStr);
    const dayKey = format(date, 'yyyy-MM-dd');
    
    const groupKeys = getGroupKey(trade);
    const keys = Array.isArray(groupKeys) ? groupKeys : [groupKeys];
    
    keys.forEach(groupKey => {
      if (!groupDailyCounts.has(groupKey)) {
        groupDailyCounts.set(groupKey, new Map());
      }
      const dailyMap = groupDailyCounts.get(groupKey)!;
      dailyMap.set(dayKey, (dailyMap.get(dayKey) || 0) + 1);
    });
  });
  
  return groupDailyCounts;
};

/**
 * Get trading activity stats for a specific group from pre-built daily counts
 * @param groupDailyCounts Pre-built map from buildGroupDailyCounts
 * @param groupKey The group to get stats for
 * @returns Trading activity statistics
 */
export const getGroupTradingActivityStats = (
  groupDailyCounts: Map<string, Map<string, number>>,
  groupKey: string
): TradingActivityStats => {
  const dailyMap = groupDailyCounts.get(groupKey);
  if (!dailyMap) {
    return {
      avgTradesPerDay: 0,
      medianTradesPerDay: 0,
      percentile90TradesPerDay: 0,
      loggedDays: 0,
    };
  }
  
  const counts = Array.from(dailyMap.values());
  return calculateTradingActivityStatsFromCounts(counts);
};
