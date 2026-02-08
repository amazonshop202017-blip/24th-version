import { Trade, calculateTradeMetrics } from '@/types/trade';
import { format, parseISO } from 'date-fns';

/**
 * Calculate Risk & Drawdown metrics for a group of trades
 */
export interface RiskDrawdownStats {
  avgRealizedR: number;       // Average realized R-multiple per trade
  avgPlannedR: number;        // Average planned R-multiple (RRR) per trade
  avgDailyDrawdown: number;   // Average net P&L of losing days
  largestDailyLoss: number;   // Most negative single-day P&L
  largestDailyLossDate: string; // Date of the largest daily loss
  losingDaysCount: number;    // Number of losing days
  totalRealizedRSum: number;  // Sum of realized R-multiples
  totalPlannedRSum: number;   // Sum of planned R-multiples
  tradesWithRealizedR: number; // Count of trades with realized R-multiple
  tradesWithPlannedR: number;  // Count of trades with planned R-multiple
}

/**
 * Calculate Risk & Drawdown stats for a given set of trades
 */
export function calculateRiskDrawdownStats(trades: Trade[]): RiskDrawdownStats {
  let totalRealizedRSum = 0;
  let totalPlannedRSum = 0;
  let tradesWithRealizedR = 0;
  let tradesWithPlannedR = 0;

  // Daily P&L tracking
  const dailyPnL = new Map<string, number>();

  trades.forEach(trade => {
    const metrics = calculateTradeMetrics(trade);
    
    // Only process closed trades for P&L calculations
    if (metrics.positionStatus !== 'CLOSED') return;
    
    // Realized R-Multiple from savedRMultiple
    if (typeof trade.savedRMultiple === 'number' && isFinite(trade.savedRMultiple)) {
      totalRealizedRSum += trade.savedRMultiple;
      tradesWithRealizedR++;
    }
    
    // Planned R-Multiple from savedRRR
    if (typeof trade.savedRRR === 'number' && isFinite(trade.savedRRR) && trade.savedRRR >= 0) {
      totalPlannedRSum += trade.savedRRR;
      tradesWithPlannedR++;
    }
    
    // Group trades by close date for daily P&L
    if (metrics.closeDate) {
      const dateKey = format(parseISO(metrics.closeDate), 'yyyy-MM-dd');
      dailyPnL.set(dateKey, (dailyPnL.get(dateKey) || 0) + metrics.netPnl);
    }
  });

  // Calculate average R-multiples
  const avgRealizedR = tradesWithRealizedR > 0 ? totalRealizedRSum / tradesWithRealizedR : 0;
  const avgPlannedR = tradesWithPlannedR > 0 ? totalPlannedRSum / tradesWithPlannedR : 0;

  // Calculate daily drawdown stats
  const dailyPnLValues = Array.from(dailyPnL.entries());
  const losingDays = dailyPnLValues.filter(([_, pnl]) => pnl < 0);
  
  const losingDaysCount = losingDays.length;
  const avgDailyDrawdown = losingDaysCount > 0 
    ? losingDays.reduce((sum, [_, pnl]) => sum + pnl, 0) / losingDaysCount 
    : 0;

  // Find largest daily loss (most negative value)
  let largestDailyLoss = 0;
  let largestDailyLossDate = '';
  
  if (losingDays.length > 0) {
    const sortedLosingDays = losingDays.sort((a, b) => a[1] - b[1]); // Ascending (most negative first)
    largestDailyLoss = sortedLosingDays[0][1];
    largestDailyLossDate = sortedLosingDays[0][0];
  }

  return {
    avgRealizedR,
    avgPlannedR,
    avgDailyDrawdown,
    largestDailyLoss,
    largestDailyLossDate,
    losingDaysCount,
    totalRealizedRSum,
    totalPlannedRSum,
    tradesWithRealizedR,
    tradesWithPlannedR,
  };
}

/**
 * Build a map of group name -> array of trades for grouped Risk & Drawdown calculations
 */
export function buildGroupedTradesMap<T>(
  trades: Trade[], 
  getGroupKey: (trade: Trade) => T
): Map<string, Trade[]> {
  const groupedTrades = new Map<string, Trade[]>();
  
  trades.forEach(trade => {
    const key = getGroupKey(trade);
    // Handle both single string keys and arrays of strings (for tags)
    const keys = Array.isArray(key) ? key : [String(key)];
    
    keys.forEach(k => {
      const keyStr = String(k);
      if (!groupedTrades.has(keyStr)) {
        groupedTrades.set(keyStr, []);
      }
      groupedTrades.get(keyStr)!.push(trade);
    });
  });
  
  return groupedTrades;
}

/**
 * Get Risk & Drawdown stats for a specific group
 */
export function getGroupRiskDrawdownStats(
  groupedTrades: Map<string, Trade[]>,
  groupKey: string
): RiskDrawdownStats {
  const trades = groupedTrades.get(groupKey) || [];
  return calculateRiskDrawdownStats(trades);
}
