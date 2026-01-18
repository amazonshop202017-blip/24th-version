import { createContext, useContext, ReactNode, useMemo, useCallback } from 'react';
import { useTrades } from '@/hooks/useTrades';
import { Trade, TradeFormData, calculateTradeMetrics } from '@/types/trade';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { isWithinInterval, parseISO, startOfDay, endOfDay } from 'date-fns';

interface TradesContextType {
  trades: Trade[]; // All trades (unfiltered)
  filteredTrades: Trade[]; // Trades after applying global filters
  stats: {
    netPnl: number;
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    breakevenTrades: number;
    tradeWinRate: number;
    dayWinRate: number;
    winningDays: number;
    losingDays: number;
    breakevenDays: number;
    avgWin: number;
    avgLoss: number;
    totalProfits: number;
    totalLosses: number;
    profitFactor: number;
  };
  addTrade: (data: TradeFormData) => Trade;
  bulkAddTrades: (tradesData: TradeFormData[]) => Trade[];
  updateTrade: (id: string, data: TradeFormData) => void;
  deleteTrade: (id: string) => void;
  getTradeById: (id: string) => Trade | undefined;
}

const TradesContext = createContext<TradesContextType | undefined>(undefined);

export const TradesProvider = ({ children }: { children: ReactNode }) => {
  const tradesHook = useTrades();
  
  // We can't use useGlobalFilters here because GlobalFiltersProvider is nested inside TradesProvider
  // Instead, we'll provide both filtered and unfiltered trades

  return (
    <TradesContext.Provider value={{
      ...tradesHook,
      filteredTrades: tradesHook.trades, // Will be overridden by FilteredTradesProvider
    }}>
      {children}
    </TradesContext.Provider>
  );
};

export const useTradesContext = (): TradesContextType => {
  const context = useContext(TradesContext);
  if (context === undefined) {
    throw new Error('useTradesContext must be used within TradesProvider');
  }
  return context;
};

// Hook to get filtered trades and stats (must be used inside GlobalFiltersProvider)
export const useFilteredTradesContext = () => {
  const { trades, addTrade, bulkAddTrades, updateTrade, deleteTrade, getTradeById } = useTradesContext();
  const { dateRange, selectedAccounts } = useGlobalFilters();

  const filteredTrades = useMemo(() => {
    let filtered = trades;

    // Filter by date range
    if (dateRange.from || dateRange.to) {
      filtered = filtered.filter(trade => {
        const metrics = calculateTradeMetrics(trade);
        if (!metrics.openDate) return false;
        
        const tradeDate = parseISO(metrics.openDate);
        const from = dateRange.from ? startOfDay(dateRange.from) : new Date(0);
        const to = dateRange.to ? endOfDay(dateRange.to) : new Date(9999, 11, 31);
        
        return isWithinInterval(tradeDate, { start: from, end: to });
      });
    }

    // Filter by selected accounts
    if (selectedAccounts.length > 0) {
      filtered = filtered.filter(trade => 
        selectedAccounts.includes(trade.accountName)
      );
    }

    return filtered;
  }, [trades, dateRange, selectedAccounts]);

  const stats = useMemo(() => {
    const winningTrades = filteredTrades.filter(t => calculateTradeMetrics(t).netPnl > 0);
    const losingTrades = filteredTrades.filter(t => calculateTradeMetrics(t).netPnl < 0);
    const breakevenTrades = filteredTrades.filter(t => calculateTradeMetrics(t).netPnl === 0);
    
    const totalProfits = winningTrades.reduce((sum, t) => sum + calculateTradeMetrics(t).netPnl, 0);
    const totalLosses = Math.abs(losingTrades.reduce((sum, t) => sum + calculateTradeMetrics(t).netPnl, 0));
    
    // Calculate day-based stats
    const dayPnl = filteredTrades.reduce((acc, t) => {
      const metrics = calculateTradeMetrics(t);
      const day = metrics.closeDate ? metrics.closeDate.split('T')[0] : 'unknown';
      acc[day] = (acc[day] || 0) + metrics.netPnl;
      return acc;
    }, {} as Record<string, number>);
    
    const days = Object.values(dayPnl);
    const winningDaysCount = days.filter(p => p > 0).length;
    const losingDaysCount = days.filter(p => p < 0).length;
    const breakevenDaysCount = days.filter(p => p === 0).length;
    
    return {
      netPnl: filteredTrades.reduce((sum, t) => sum + calculateTradeMetrics(t).netPnl, 0),
      totalTrades: filteredTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      breakevenTrades: breakevenTrades.length,
      tradeWinRate: filteredTrades.length > 0 
        ? (winningTrades.length / filteredTrades.length) * 100 
        : 0,
      dayWinRate: days.length > 0 
        ? (winningDaysCount / days.length) * 100 
        : 0,
      winningDays: winningDaysCount,
      losingDays: losingDaysCount,
      breakevenDays: breakevenDaysCount,
      avgWin: winningTrades.length > 0 
        ? totalProfits / winningTrades.length 
        : 0,
      avgLoss: losingTrades.length > 0 
        ? -(totalLosses / losingTrades.length) 
        : 0,
      totalProfits,
      totalLosses,
      profitFactor: totalLosses > 0 ? totalProfits / totalLosses : (totalProfits > 0 ? Infinity : 0),
    };
  }, [filteredTrades]);

  return {
    trades,
    filteredTrades,
    stats,
    addTrade,
    bulkAddTrades,
    updateTrade,
    deleteTrade,
    getTradeById,
  };
};
