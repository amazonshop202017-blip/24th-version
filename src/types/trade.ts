export interface TradeEntry {
  id: string;
  type: 'BUY' | 'SELL';
  datetime: string;
  quantity: number;
  price: number;
  charges: number;
}

export interface Trade {
  id: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  instrument: 'Equity' | 'Futures' | 'Options' | 'Crypto';
  entries: TradeEntry[];
  tradeRisk: number;
  accountName: string;
  tags: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// Calculated values (not stored, computed on-the-fly)
export interface TradeCalculations {
  grossPnl: number;
  netPnl: number;
  totalCharges: number;
  totalQuantity: number;
  avgEntryPrice: number;
  avgExitPrice: number;
  openDate: string;
  closeDate: string;
  duration: string;
  durationMinutes: number;
  rFactor: number;
  isWin: boolean;
  returnPercent: number;
}

export type TradeFormData = Omit<Trade, 'id' | 'createdAt' | 'updatedAt'>;

// Helper function to calculate trade metrics
export function calculateTradeMetrics(trade: Trade | TradeFormData): TradeCalculations {
  const entries = trade.entries;
  const side = trade.side;
  
  // Separate buy and sell entries
  const buyEntries = entries.filter(e => e.type === 'BUY');
  const sellEntries = entries.filter(e => e.type === 'SELL');
  
  // Calculate totals
  const totalBuyQty = buyEntries.reduce((sum, e) => sum + e.quantity, 0);
  const totalSellQty = sellEntries.reduce((sum, e) => sum + e.quantity, 0);
  const totalBuyCost = buyEntries.reduce((sum, e) => sum + (e.quantity * e.price), 0);
  const totalSellValue = sellEntries.reduce((sum, e) => sum + (e.quantity * e.price), 0);
  const totalCharges = entries.reduce((sum, e) => sum + e.charges, 0);
  
  const avgEntryPrice = totalBuyQty > 0 ? totalBuyCost / totalBuyQty : 0;
  const avgExitPrice = totalSellQty > 0 ? totalSellValue / totalSellQty : 0;
  
  // For LONG: profit when sell price > buy price
  // For SHORT: profit when buy price > sell price (sell first, buy to cover)
  let grossPnl = 0;
  const closedQty = Math.min(totalBuyQty, totalSellQty);
  
  if (side === 'LONG') {
    grossPnl = (avgExitPrice - avgEntryPrice) * closedQty;
  } else {
    // SHORT: sell first, buy to close
    grossPnl = (avgEntryPrice - avgExitPrice) * closedQty;
  }
  
  const netPnl = grossPnl - totalCharges;
  
  // Get dates
  const allDates = entries.map(e => new Date(e.datetime).getTime()).filter(d => !isNaN(d));
  const openDate = allDates.length > 0 ? new Date(Math.min(...allDates)).toISOString() : '';
  const closeDate = allDates.length > 0 ? new Date(Math.max(...allDates)).toISOString() : '';
  
  // Calculate duration
  let durationMinutes = 0;
  let duration = '0 days 0 hours 0 mins';
  
  if (openDate && closeDate) {
    const diffMs = new Date(closeDate).getTime() - new Date(openDate).getTime();
    durationMinutes = Math.floor(diffMs / (1000 * 60));
    const days = Math.floor(durationMinutes / (60 * 24));
    const hours = Math.floor((durationMinutes % (60 * 24)) / 60);
    const mins = durationMinutes % 60;
    duration = `${days} days ${hours} hours ${mins} mins`;
  }
  
  // R-Factor
  const rFactor = trade.tradeRisk > 0 ? netPnl / trade.tradeRisk : 0;
  
  // Return percentage
  const investedAmount = side === 'LONG' ? totalBuyCost : totalSellValue;
  const returnPercent = investedAmount > 0 ? (netPnl / investedAmount) * 100 : 0;
  
  return {
    grossPnl,
    netPnl,
    totalCharges,
    totalQuantity: closedQty,
    avgEntryPrice,
    avgExitPrice,
    openDate,
    closeDate,
    duration,
    durationMinutes,
    rFactor,
    isWin: netPnl > 0,
    returnPercent,
  };
}
