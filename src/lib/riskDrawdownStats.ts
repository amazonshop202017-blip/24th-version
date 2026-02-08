import { Trade, calculateTradeMetrics } from '@/types/trade';
import { format, parseISO } from 'date-fns';
import { BreakevenTolerance, TradeOutcome } from '@/contexts/GlobalFiltersContext';

/**
 * Classify trade outcome using the same logic as GlobalFiltersContext
 * This ensures consistency across the entire application
 */
export function classifyTradeOutcomeLocal(
  netPnl: number, 
  returnPercent: number | undefined, 
  isBreakeven: boolean | undefined,
  breakevenTolerance: BreakevenTolerance
): TradeOutcome {
  const { type, value, mode } = breakevenTolerance;
  
  // Manual mode: Use trade-level breakeven flag
  if (mode === 'manual') {
    if (isBreakeven === true) {
      return 'breakeven';
    }
    // If not marked as breakeven, classify by P/L
    if (netPnl > 0) return 'win';
    if (netPnl < 0) return 'loss';
    return 'breakeven'; // Exactly zero is always breakeven
  }
  
  // Automatic mode: Use tolerance-based logic
  if (type === 'amount') {
    // Amount-based tolerance: P/L between -value and +value is breakeven
    if (netPnl >= -value && netPnl <= value) {
      return 'breakeven';
    }
  } else if (type === 'percentage' && returnPercent !== undefined) {
    // Percentage-based tolerance: Return % between -value and +value is breakeven
    if (returnPercent >= -value && returnPercent <= value) {
      return 'breakeven';
    }
  }
  
  // If outside tolerance range
  if (netPnl > 0) return 'win';
  if (netPnl < 0) return 'loss';
  return 'breakeven'; // Exactly zero is always breakeven
}

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
  winningDaysCount: number;   // Number of winning days
  breakevenDaysCount: number; // Number of breakeven days
  totalLoggedDays: number;    // Total number of days with trades
  totalRealizedRSum: number;  // Sum of realized R-multiples
  totalPlannedRSum: number;   // Sum of planned R-multiples
  tradesWithRealizedR: number; // Count of trades with realized R-multiple
  tradesWithPlannedR: number;  // Count of trades with planned R-multiple
}

/**
 * Calculate Risk & Drawdown stats for a given set of trades
 * Uses the global breakeven tolerance settings for consistent classification
 */
export function calculateRiskDrawdownStats(
  trades: Trade[], 
  breakevenTolerance: BreakevenTolerance
): RiskDrawdownStats {
  let totalRealizedRSum = 0;
  let totalPlannedRSum = 0;
  let tradesWithRealizedR = 0;
  let tradesWithPlannedR = 0;

  // Daily P&L tracking (includes both open and closed trades)
  // Also track daily return % for percentage-based tolerance
  const dailyPnL = new Map<string, number>();
  const dailyReturnPercent = new Map<string, number>();
  // Track if ANY trade on a day is manually marked as breakeven
  const dailyHasManualBreakeven = new Map<string, boolean>();

  trades.forEach(trade => {
    const metrics = calculateTradeMetrics(trade);
    
    // Track daily P&L from open date (both open and closed trades)
    if (metrics.openDate) {
      const dateKey = format(parseISO(metrics.openDate), 'yyyy-MM-dd');
      dailyPnL.set(dateKey, (dailyPnL.get(dateKey) || 0) + metrics.netPnl);
      
      // Track return % for percentage-based tolerance
      const returnPct = trade.savedReturnPercent ?? metrics.returnPercent;
      dailyReturnPercent.set(dateKey, (dailyReturnPercent.get(dateKey) || 0) + returnPct);
      
      // Track manual breakeven flags
      if (trade.breakEven === true) {
        dailyHasManualBreakeven.set(dateKey, true);
      }
    }
    
    // Only process closed trades for R-multiple calculations
    if (metrics.positionStatus !== 'CLOSED') {
      return;
    }
    
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
  });

  // Calculate average R-multiples
  const avgRealizedR = tradesWithRealizedR > 0 ? totalRealizedRSum / tradesWithRealizedR : 0;
  const avgPlannedR = tradesWithPlannedR > 0 ? totalPlannedRSum / tradesWithPlannedR : 0;

  // Calculate daily metrics using global breakeven tolerance
  const dailyPnLValues = Array.from(dailyPnL.entries());
  const totalLoggedDays = dailyPnLValues.length;

  // Classify each day using the same breakeven logic as trades
  const winningDays: [string, number][] = [];
  const losingDays: [string, number][] = [];
  const breakevenDays: [string, number][] = [];

  dailyPnLValues.forEach(([dateKey, pnl]) => {
    const returnPct = dailyReturnPercent.get(dateKey) || 0;
    const hasManualBreakeven = dailyHasManualBreakeven.get(dateKey) || false;
    
    // For manual mode, a day is breakeven if ALL trades are breakeven OR net P&L is 0
    // For automatic mode, use the tolerance-based classification on daily totals
    const dayOutcome = classifyTradeOutcomeLocal(
      pnl,
      returnPct,
      // In manual mode, only mark day as breakeven if it has manual breakeven AND net P&L qualifies
      breakevenTolerance.mode === 'manual' ? hasManualBreakeven : undefined,
      breakevenTolerance
    );
    
    switch (dayOutcome) {
      case 'win':
        winningDays.push([dateKey, pnl]);
        break;
      case 'loss':
        losingDays.push([dateKey, pnl]);
        break;
      case 'breakeven':
        breakevenDays.push([dateKey, pnl]);
        break;
    }
  });

  const winningDaysCount = winningDays.length;
  const losingDaysCount = losingDays.length;
  const breakevenDaysCount = breakevenDays.length;

  // Calculate average daily drawdown (average P&L of losing days only)
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
    winningDaysCount,
    breakevenDaysCount,
    totalLoggedDays,
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
 * Uses the global breakeven tolerance settings for consistent classification
 */
export function getGroupRiskDrawdownStats(
  groupedTrades: Map<string, Trade[]>,
  groupKey: string,
  breakevenTolerance: BreakevenTolerance
): RiskDrawdownStats {
  const trades = groupedTrades.get(groupKey) || [];
  return calculateRiskDrawdownStats(trades, breakevenTolerance);
}
