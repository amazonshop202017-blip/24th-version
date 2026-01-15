export interface TradeEntry {
  id: string;
  type: 'BUY' | 'SELL';
  datetime: string;
  quantity: number;
  price: number;
  charges: number;
}

// Scale entry/exit row for persistence
export interface ScaleEntry {
  id: string;
  price: number;
  quantity: number;
}

export interface Trade {
  id: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  instrument: 'Equity' | 'Futures' | 'Options' | 'Crypto';
  entries: TradeEntry[];
  tradeRisk: number;
  tradeTarget: number;
  accountName: string;
  strategyId?: string;
  selectedChecklistItems?: string[];
  tags: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
  // Stop Loss and Take Profit
  stopLoss?: number;
  takeProfit?: number;
  // Manual position metrics
  positionMAE?: number;
  positionMFE?: number;
  potentialMAE?: number;
  potentialMFE?: number;
  missedTrade?: boolean;
  // Manual Gross P/L override
  manualGrossPnl?: number;
  // Scale In/Out entries and exits for persistence
  scaleEntries?: ScaleEntry[];
  scaleExits?: ScaleEntry[];
  // Advanced Data fields
  entryComment?: string;
  tradeManagement?: string;
  exitComment?: string;
  highestPrice?: number;
  lowestPrice?: number;
  priceReachedFirst?: 'takeProfit' | 'stopLoss';
  breakEven?: boolean;
  // Custom Stats
  timeframe?: string;
  confluence?: string;
  pattern?: string;
  preparation?: string;
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
  // Position tracking
  positionSide: 'LONG' | 'SHORT' | null;
  positionStatus: 'OPEN' | 'CLOSED';
  openQuantity: number;
}

export type TradeFormData = Omit<Trade, 'id' | 'createdAt' | 'updatedAt'>;

// Helper function to calculate trade metrics
export function calculateTradeMetrics(trade: Trade | TradeFormData): TradeCalculations {
  const entries = trade.entries || [];
  
  // Sort entries by datetime to determine first entry
  const sortedEntries = [...entries].sort((a, b) => 
    new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
  );
  
  // Determine position side from first entry
  const firstEntry = sortedEntries[0];
  const positionSide: 'LONG' | 'SHORT' | null = firstEntry 
    ? (firstEntry.type === 'BUY' ? 'LONG' : 'SHORT')
    : null;
  
  // Calculate open quantity - prefer scaleEntries/scaleExits if they exist
  let openQuantity = 0;
  let positionStatus: 'OPEN' | 'CLOSED' = 'CLOSED';
  
  if (trade.scaleEntries && trade.scaleEntries.length > 0) {
    // Use scale entries/exits for position tracking
    const totalScaleEntryQty = trade.scaleEntries.reduce((sum, e) => sum + e.quantity, 0);
    const totalScaleExitQty = (trade.scaleExits || []).reduce((sum, e) => sum + e.quantity, 0);
    openQuantity = Math.max(0, totalScaleEntryQty - totalScaleExitQty);
    positionStatus = openQuantity > 0 ? 'OPEN' : 'CLOSED';
  } else {
    // Fallback to entries array for position tracking
    let netPosition = 0; // positive = long, negative = short
    for (const entry of sortedEntries) {
      if (entry.type === 'BUY') {
        netPosition += entry.quantity;
      } else {
        netPosition -= entry.quantity;
      }
    }
    openQuantity = Math.abs(netPosition);
    positionStatus = netPosition === 0 ? 'CLOSED' : 'OPEN';
  }
  
  // Separate buy and sell entries
  const buyEntries = entries.filter(e => e.type === 'BUY');
  const sellEntries = entries.filter(e => e.type === 'SELL');
  
  // Calculate totals
  const totalBuyQty = buyEntries.reduce((sum, e) => sum + e.quantity, 0);
  const totalSellQty = sellEntries.reduce((sum, e) => sum + e.quantity, 0);
  const totalBuyCost = buyEntries.reduce((sum, e) => sum + (e.quantity * e.price), 0);
  const totalSellValue = sellEntries.reduce((sum, e) => sum + (e.quantity * e.price), 0);
  const totalCharges = entries.reduce((sum, e) => sum + e.charges, 0);
  
  // Use the stored side or auto-calculated side for calculations
  const side = trade.side || positionSide || 'LONG';
  
  // Calculate average prices based on trade direction
  // LONG: Entry = BUY, Exit = SELL
  // SHORT: Entry = SELL, Exit = BUY
  let avgEntryPrice: number;
  let avgExitPrice: number;
  let closedQty: number;
  
  if (side === 'LONG') {
    avgEntryPrice = totalBuyQty > 0 ? totalBuyCost / totalBuyQty : 0;
    avgExitPrice = totalSellQty > 0 ? totalSellValue / totalSellQty : 0;
    closedQty = Math.min(totalBuyQty, totalSellQty);
  } else {
    // SHORT: Entry is SELL, Exit is BUY
    avgEntryPrice = totalSellQty > 0 ? totalSellValue / totalSellQty : 0;
    avgExitPrice = totalBuyQty > 0 ? totalBuyCost / totalBuyQty : 0;
    closedQty = Math.min(totalBuyQty, totalSellQty);
  }
  
  // Calculate Gross P&L based on direction
  // LONG: Profit = Exit Price - Entry Price
  // SHORT: Profit = Entry Price - Exit Price
  let calculatedGrossPnl = 0;
  
  if (closedQty > 0 && avgEntryPrice > 0 && avgExitPrice > 0) {
    if (side === 'LONG') {
      calculatedGrossPnl = (avgExitPrice - avgEntryPrice) * closedQty;
    } else {
      // SHORT: sell high, buy low to profit
      calculatedGrossPnl = (avgEntryPrice - avgExitPrice) * closedQty;
    }
  }
  
  // Use manual Gross P/L if provided, otherwise use calculated
  const grossPnl = trade.manualGrossPnl !== undefined ? trade.manualGrossPnl : calculatedGrossPnl;
  
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
  
  // Return percentage - use the correct invested amount based on direction
  // LONG: invested = what you bought (totalBuyCost)
  // SHORT: invested = what you sold (totalSellValue)
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
    positionSide,
    positionStatus,
    openQuantity,
  };
}
