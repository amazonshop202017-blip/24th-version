import { useMemo } from 'react';
import { useTradesContext } from '@/contexts/TradesContext';

/**
 * Single source of truth for symbol discovery.
 * Returns sorted list of symbols that have at least one trade.
 * Used by both Settings → Symbol Tick/Pip and Trade Modal Symbol dropdown.
 */
export const useTradedSymbols = (): string[] => {
  const { trades } = useTradesContext();

  return useMemo(() => {
    const symbols = new Set<string>();
    trades.forEach(trade => {
      if (trade.symbol) {
        symbols.add(trade.symbol);
      }
    });
    return Array.from(symbols).sort();
  }, [trades]);
};
