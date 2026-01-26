import { useFilteredTradesContext as useBaseFilteredTradesContext } from '@/contexts/TradesContext';
import { useAccountsContext } from '@/contexts/AccountsContext';
import { useMemo } from 'react';

/**
 * Wrapper hook that provides filtered trades with automatic account filtering.
 * This hook combines TradesContext and AccountsContext to provide proper filtering
 * based on active (non-archived) accounts.
 * 
 * All components should use this hook instead of importing useFilteredTradesContext from TradesContext directly.
 * This avoids the circular dependency between TradesContext and AccountsContext.
 */
export const useFilteredTrades = () => {
  const { getActiveAccountNames } = useAccountsContext();
  
  // Get active account names (excluding archived accounts)
  const activeAccountNames = useMemo(() => getActiveAccountNames(), [getActiveAccountNames]);
  
  // Call the base hook with active account names
  return useBaseFilteredTradesContext(activeAccountNames);
};
