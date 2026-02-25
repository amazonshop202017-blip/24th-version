import { Trade, calculateTradeMetrics } from '@/types/trade';

export interface HeatmapCell {
  sl: number;
  tp: number;
  expectancy: number;
  winRate: number;
  avgR: number;
  tradesCount: number;
}

export interface ExitAnalyzerTrade {
  side: 'LONG' | 'SHORT';
  mfe: number;
  mae: number;
  realizedR: number;
}

/**
 * Prepare trades for exit analysis. Filters and normalizes.
 */
export function prepareExitTrades(
  trades: Trade[],
  treatMissingAsZero: boolean
): ExitAnalyzerTrade[] {
  const result: ExitAnalyzerTrade[] = [];

  for (const trade of trades) {
    const mfe = trade.mfeTickPip;
    const mae = trade.maeTickPip;

    let mfeVal: number;
    let maeVal: number;

    if (treatMissingAsZero) {
      mfeVal = mfe ?? 0;
      maeVal = mae ?? 0;
    } else {
      if (mfe == null || mae == null) continue;
      mfeVal = mfe;
      maeVal = mae;
    }

    const metrics = calculateTradeMetrics(trade);
    // Use savedRMultiple if available, otherwise compute from metrics
    const realizedR = trade.savedRMultiple ?? (trade.tradeRisk > 0 ? metrics.netPnl / trade.tradeRisk : 0);

    result.push({
      side: trade.side,
      mfe: mfeVal,
      mae: maeVal,
      realizedR,
    });
  }

  return result;
}

/**
 * Simulate exit for a single trade given SL/TP in ticks.
 * Returns the R result of the simulated exit.
 */
function simulateExit(trade: ExitAnalyzerTrade, sl: number, tp: number): number {
  // MAE >= SL means stop loss would have been hit
  if (trade.mae >= sl) {
    // SL hit → loss proportional to SL
    return -(sl / (tp + sl)) * (tp + sl) / tp; // simplified: -sl/tp ratio as R
    // Actually let's keep it simple: if SL hit, result = -1 R (risked SL, lost SL)
    // But we want R based on the SL/TP as risk unit
    // Convention: Risk = SL ticks. Reward = TP ticks.
    // If SL hit: R = -1 (lost 1R)
    return -1;
  }
  // MFE >= TP means take profit would have been hit
  if (trade.mfe >= tp) {
    // TP hit → R = TP/SL
    return tp / sl;
  }
  // Neither hit → use realized R
  return trade.realizedR;
}

/**
 * Compute the full heatmap grid.
 */
export function computeHeatmap(
  trades: ExitAnalyzerTrade[],
  minSL: number,
  maxSL: number,
  slStep: number,
  minTP: number,
  maxTP: number,
  tpStep: number
): HeatmapCell[] {
  if (trades.length === 0 || slStep <= 0 || tpStep <= 0) return [];

  const cells: HeatmapCell[] = [];

  for (let sl = minSL; sl <= maxSL; sl += slStep) {
    for (let tp = minTP; tp <= maxTP; tp += tpStep) {
      let totalR = 0;
      let wins = 0;
      const count = trades.length;

      for (const trade of trades) {
        const r = simulateExit(trade, sl, tp);
        totalR += r;
        if (r > 0) wins++;
      }

      cells.push({
        sl,
        tp,
        expectancy: totalR / count,
        winRate: (wins / count) * 100,
        avgR: totalR / count,
        tradesCount: count,
      });
    }
  }

  return cells;
}
