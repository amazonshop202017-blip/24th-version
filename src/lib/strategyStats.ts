import { Trade, calculateTradeMetrics } from '@/types/trade';

export interface StrategyStats {
  totalTrades: number;
  totalNetPnL: number;
  profitFactor: number;
  winRate: number;
  avgWinner: number;
  avgLoser: number;
  expectancy: number;
  missedTrades: number;
  sharedStrategies: string;
}

export function calculateStrategyStats(strategyId: string, trades: Trade[]): StrategyStats {
  // Filter trades that belong to this strategy
  const strategyTrades = trades.filter(trade => trade.strategyId === strategyId);
  
  if (strategyTrades.length === 0) {
    return {
      totalTrades: 0,
      totalNetPnL: 0,
      profitFactor: 0,
      winRate: 0,
      avgWinner: 0,
      avgLoser: 0,
      expectancy: 0,
      missedTrades: 0,
      sharedStrategies: '-',
    };
  }
  
  // Calculate metrics for each trade
  const tradesWithMetrics = strategyTrades.map(trade => ({
    trade,
    metrics: calculateTradeMetrics(trade),
  }));
  
  // Separate winning and losing trades
  const winningTrades = tradesWithMetrics.filter(t => t.metrics.netPnl > 0);
  const losingTrades = tradesWithMetrics.filter(t => t.metrics.netPnl < 0);
  
  // Calculate totals
  const totalNetPnL = tradesWithMetrics.reduce((sum, t) => sum + t.metrics.netPnl, 0);
  const totalProfits = winningTrades.reduce((sum, t) => sum + t.metrics.netPnl, 0);
  const totalLosses = Math.abs(losingTrades.reduce((sum, t) => sum + t.metrics.netPnl, 0));
  
  // Calculate averages
  const avgWinner = winningTrades.length > 0 
    ? totalProfits / winningTrades.length 
    : 0;
  const avgLoser = losingTrades.length > 0 
    ? -(totalLosses / losingTrades.length) 
    : 0;
  
  // Win rate
  const winRate = (winningTrades.length / strategyTrades.length) * 100;
  const lossRate = 100 - winRate;
  
  // Profit factor
  const profitFactor = totalLosses > 0 
    ? totalProfits / totalLosses 
    : (totalProfits > 0 ? Infinity : 0);
  
  // Expectancy = (Win Rate × Avg. Win) – (Loss Rate × Avg. Loss)
  // Note: avgLoser is negative, so we use Math.abs
  const expectancy = ((winRate / 100) * avgWinner) - ((lossRate / 100) * Math.abs(avgLoser));
  
  return {
    totalTrades: strategyTrades.length,
    totalNetPnL,
    profitFactor: isFinite(profitFactor) ? profitFactor : 0,
    winRate,
    avgWinner,
    avgLoser,
    expectancy,
    missedTrades: 0, // Placeholder - could be implemented with additional tracking
    sharedStrategies: '-', // Placeholder - for future multi-strategy feature
  };
}
