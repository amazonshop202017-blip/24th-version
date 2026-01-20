import { createContext, useContext, ReactNode, useMemo, useCallback } from 'react';
import { useTrades } from '@/hooks/useTrades';
import { Trade, TradeFormData, calculateTradeMetrics } from '@/types/trade';
import { useGlobalFilters, OutcomeFilter, DayFilter } from '@/contexts/GlobalFiltersContext';
import { isWithinInterval, parseISO, startOfDay, endOfDay, getDay, getHours } from 'date-fns';

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

// Map day index (0-6, Sunday=0) to DayFilter
const dayIndexToFilter: Record<number, DayFilter> = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
};

// Hook to get filtered trades and stats (must be used inside GlobalFiltersProvider)
export const useFilteredTradesContext = () => {
  const { trades, addTrade, bulkAddTrades, updateTrade, deleteTrade, getTradeById } = useTradesContext();
  const { 
    dateRange, 
    selectedAccounts,
    selectedInstruments,
    selectedOutcomes,
    selectedHours,
    selectedSetups,
    selectedDays,
    lastTradesFilter,
  } = useGlobalFilters();

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

    // Filter by instrument
    if (selectedInstruments.length > 0) {
      filtered = filtered.filter(trade => 
        selectedInstruments.includes(trade.symbol)
      );
    }

    // Filter by outcome
    if (selectedOutcomes.length > 0) {
      filtered = filtered.filter(trade => {
        const metrics = calculateTradeMetrics(trade);
        const netPnl = metrics.netPnl;
        
        if (netPnl > 0 && selectedOutcomes.includes('win')) return true;
        if (netPnl < 0 && selectedOutcomes.includes('loss')) return true;
        if (netPnl === 0 && selectedOutcomes.includes('breakeven')) return true;
        return false;
      });
    }

    // Filter by hour (entry hour)
    if (selectedHours.length > 0) {
      filtered = filtered.filter(trade => {
        const metrics = calculateTradeMetrics(trade);
        if (!metrics.openDate) return false;
        
        const entryDate = parseISO(metrics.openDate);
        const entryHour = getHours(entryDate);
        return selectedHours.includes(entryHour);
      });
    }

    // Filter by setup (strategyId)
    if (selectedSetups.length > 0) {
      filtered = filtered.filter(trade => 
        trade.strategyId && selectedSetups.includes(trade.strategyId)
      );
    }

    // Filter by day of week (entry day)
    if (selectedDays.length > 0) {
      filtered = filtered.filter(trade => {
        const metrics = calculateTradeMetrics(trade);
        if (!metrics.openDate) return false;
        
        const entryDate = parseISO(metrics.openDate);
        const dayIndex = getDay(entryDate);
        const dayFilter = dayIndexToFilter[dayIndex];
        return selectedDays.includes(dayFilter);
      });
    }

    // Apply "Last Trades" filter LAST - take most recent N trades after all other filters
    if (lastTradesFilter !== null) {
      // Sort by entry date descending
      const sorted = [...filtered].sort((a, b) => {
        const aMetrics = calculateTradeMetrics(a);
        const bMetrics = calculateTradeMetrics(b);
        const aDate = aMetrics.openDate ? parseISO(aMetrics.openDate).getTime() : 0;
        const bDate = bMetrics.openDate ? parseISO(bMetrics.openDate).getTime() : 0;
        return bDate - aDate; // Descending
      });
      filtered = sorted.slice(0, lastTradesFilter);
    }

    return filtered;
  }, [trades, dateRange, selectedAccounts, selectedInstruments, selectedOutcomes, selectedHours, selectedSetups, selectedDays, lastTradesFilter]);

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
