import { createContext, useContext, ReactNode, useMemo, useCallback } from 'react';
import { useTrades } from '@/hooks/useTrades';
import { Trade, TradeFormData, calculateTradeMetrics } from '@/types/trade';
import { useGlobalFilters, OutcomeFilter, DayFilter, DirectionFilter, ReturnPercentRange, RMultipleRange, TagFilters } from '@/contexts/GlobalFiltersContext';
import { useAccountsContext } from '@/contexts/AccountsContext';
import { isWithinInterval, parseISO, startOfDay, endOfDay, getDay, getHours } from 'date-fns';

// Helper function to check if return % falls within a range
const matchesReturnRange = (returnPercent: number | undefined, range: ReturnPercentRange): boolean => {
  if (returnPercent === undefined) return false;
  switch (range) {
    case '<0': return returnPercent < 0;
    case '0-1': return returnPercent >= 0 && returnPercent < 1;
    case '1-2': return returnPercent >= 1 && returnPercent < 2;
    case '3-5': return returnPercent >= 3 && returnPercent < 5;
    case '5-10': return returnPercent >= 5 && returnPercent < 10;
    case '>10': return returnPercent >= 10;
    default: return false;
  }
};

// Helper function to check if R-Multiple falls within a range
const matchesRMultipleRange = (rMultiple: number | undefined, range: RMultipleRange): boolean => {
  if (rMultiple === undefined) return false;
  switch (range) {
    case '<-2': return rMultiple < -2;
    case '-2-0': return rMultiple >= -2 && rMultiple < 0;
    case '0-1': return rMultiple >= 0 && rMultiple < 1;
    case '1-2': return rMultiple >= 1 && rMultiple < 2;
    case '2-4': return rMultiple >= 2 && rMultiple < 4;
    case '>4': return rMultiple >= 4;
    default: return false;
  }
};

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
  deleteTradesByAccountId: (accountId: string) => void;
  deleteTradesByAccountName: (accountName: string) => void;
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
  // Provide default implementations for new methods if they don't exist
  return {
    ...context,
    deleteTradesByAccountId: context.deleteTradesByAccountId || (() => {}),
    deleteTradesByAccountName: context.deleteTradesByAccountName || (() => {}),
  };
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
  const { trades, addTrade, bulkAddTrades, updateTrade, deleteTrade, deleteTradesByAccountId, deleteTradesByAccountName, getTradeById } = useTradesContext();
  const { getActiveAccountNames } = useAccountsContext();
  const { 
    dateRange, 
    selectedAccounts,
    selectedInstruments,
    selectedOutcomes,
    selectedHours,
    selectedSetups,
    selectedDays,
    lastTradesFilter,
    selectedDirections,
    selectedReturnRanges,
    selectedRMultipleRanges,
    selectedTagsByCategory,
    classifyTradeOutcome,
  } = useGlobalFilters();

  // Get active account names (excluding archived)
  const activeAccountNames = useMemo(() => getActiveAccountNames(), [getActiveAccountNames]);

  const filteredTrades = useMemo(() => {
    let filtered = trades;

    // When "All Accounts" is selected (selectedAccounts is empty), 
    // filter to only include trades from ACTIVE (non-archived) accounts
    if (selectedAccounts.length === 0) {
      filtered = filtered.filter(trade => 
        activeAccountNames.includes(trade.accountName)
      );
    } else {
      // Filter by specifically selected accounts
      filtered = filtered.filter(trade => 
        selectedAccounts.includes(trade.accountName)
      );
    }

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

    // Filter by instrument
    if (selectedInstruments.length > 0) {
      filtered = filtered.filter(trade => 
        selectedInstruments.includes(trade.symbol)
      );
    }

    // Filter by outcome (using global breakeven tolerance)
    if (selectedOutcomes.length > 0) {
      filtered = filtered.filter(trade => {
        const metrics = calculateTradeMetrics(trade);
        const outcome = classifyTradeOutcome(metrics.netPnl, trade.savedReturnPercent);
        return selectedOutcomes.includes(outcome);
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

    // Filter by direction (Long/Short)
    if (selectedDirections.length > 0) {
      filtered = filtered.filter(trade => {
        const tradeSide = trade.side?.toLowerCase() as DirectionFilter;
        return selectedDirections.includes(tradeSide);
      });
    }

    // Filter by Return % ranges
    if (selectedReturnRanges.length > 0) {
      filtered = filtered.filter(trade => {
        const returnPercent = trade.savedReturnPercent;
        // Match if trade falls within ANY of the selected ranges (OR logic)
        return selectedReturnRanges.some(range => matchesReturnRange(returnPercent, range));
      });
    }

    // Filter by R-Multiple ranges
    if (selectedRMultipleRanges.length > 0) {
      filtered = filtered.filter(trade => {
        const rMultiple = trade.savedRMultiple;
        // Match if trade falls within ANY of the selected ranges (OR logic)
        return selectedRMultipleRanges.some(range => matchesRMultipleRange(rMultiple, range));
      });
    }

    // Filter by Tags (AND across categories, OR within category)
    const activeCategoryIds = Object.keys(selectedTagsByCategory).filter(
      categoryId => selectedTagsByCategory[categoryId]?.length > 0
    );
    
    if (activeCategoryIds.length > 0) {
      filtered = filtered.filter(trade => {
        // Trade must match at least one tag from EACH active category (AND logic)
        return activeCategoryIds.every(categoryId => {
          const selectedTagIds = selectedTagsByCategory[categoryId];
          // Within a category, trade matches if it has at least one of the selected tags (OR logic)
          return selectedTagIds.some(tagId => trade.tags?.includes(tagId));
        });
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
  }, [trades, dateRange, selectedAccounts, activeAccountNames, selectedInstruments, selectedOutcomes, selectedHours, selectedSetups, selectedDays, lastTradesFilter, selectedDirections, selectedReturnRanges, selectedRMultipleRanges, selectedTagsByCategory, classifyTradeOutcome]);

  const stats = useMemo(() => {
    // Classify trades using breakeven tolerance (pass trade-level isBreakeven flag)
    const classifiedTrades = filteredTrades.map(t => {
      const metrics = calculateTradeMetrics(t);
      const outcome = classifyTradeOutcome(metrics.netPnl, t.savedReturnPercent, t.breakEven);
      return { trade: t, metrics, outcome };
    });
    
    const winningTrades = classifiedTrades.filter(({ outcome }) => outcome === 'win');
    const losingTrades = classifiedTrades.filter(({ outcome }) => outcome === 'loss');
    const breakevenTrades = classifiedTrades.filter(({ outcome }) => outcome === 'breakeven');
    
    const totalProfits = winningTrades.reduce((sum, { metrics }) => sum + metrics.netPnl, 0);
    const totalLosses = Math.abs(losingTrades.reduce((sum, { metrics }) => sum + metrics.netPnl, 0));
    
    // Calculate day-based stats using tolerance
    const dayData = filteredTrades.reduce((acc, t) => {
      const metrics = calculateTradeMetrics(t);
      const day = metrics.closeDate ? metrics.closeDate.split('T')[0] : 'unknown';
      if (!acc[day]) {
        acc[day] = { pnl: 0, returnPercent: 0 };
      }
      acc[day].pnl += metrics.netPnl;
      acc[day].returnPercent += t.savedReturnPercent || 0;
      return acc;
    }, {} as Record<string, { pnl: number; returnPercent: number }>);
    
    const dayOutcomes = Object.values(dayData).map(d => classifyTradeOutcome(d.pnl, d.returnPercent));
    const winningDaysCount = dayOutcomes.filter(o => o === 'win').length;
    const losingDaysCount = dayOutcomes.filter(o => o === 'loss').length;
    const breakevenDaysCount = dayOutcomes.filter(o => o === 'breakeven').length;
    
    // Win Rate = Wins / (Wins + Losses) - excludes breakeven trades
    const winsAndLosses = winningTrades.length + losingTrades.length;
    const tradeWinRate = winsAndLosses > 0 
      ? (winningTrades.length / winsAndLosses) * 100 
      : 0;
    
    // Day Win Rate = Winning Days / (Winning + Losing Days) - excludes breakeven days
    const winAndLoseDays = winningDaysCount + losingDaysCount;
    const dayWinRate = winAndLoseDays > 0 
      ? (winningDaysCount / winAndLoseDays) * 100 
      : 0;
    
    return {
      netPnl: filteredTrades.reduce((sum, t) => sum + calculateTradeMetrics(t).netPnl, 0),
      totalTrades: filteredTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      breakevenTrades: breakevenTrades.length,
      tradeWinRate,
      dayWinRate,
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
  }, [filteredTrades, classifyTradeOutcome]);

  return {
    trades,
    filteredTrades,
    stats,
    addTrade,
    bulkAddTrades,
    updateTrade,
    deleteTrade,
    deleteTradesByAccountId,
    deleteTradesByAccountName,
    getTradeById,
  };
};
