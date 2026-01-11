import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useTradesContext } from './TradesContext';
import { calculateTradeMetrics } from '@/types/trade';

export interface Account {
  id: string;
  name: string;
  startingBalance: number;
  createdAt: string;
}

export interface AccountWithStats extends Account {
  currentBalance: number;
  pnl: number;
  roi: number;
}

interface AccountsContextType {
  accounts: Account[];
  addAccount: (name: string, startingBalance: number) => Account;
  removeAccount: (id: string) => void;
  updateAccount: (id: string, name: string, startingBalance: number) => void;
  getAccountById: (id: string) => Account | undefined;
  getAccountWithStats: (id: string) => AccountWithStats | undefined;
  getAllAccountsWithStats: () => AccountWithStats[];
}

const AccountsContext = createContext<AccountsContextType | undefined>(undefined);

const STORAGE_KEY = 'trading-journal-accounts';

export const AccountsProvider = ({ children }: { children: ReactNode }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const { trades } = useTradesContext();

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setAccounts(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading accounts:', error);
    }
  }, []);

  const saveAccounts = useCallback((newAccounts: Account[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newAccounts));
    setAccounts(newAccounts);
  }, []);

  const addAccount = useCallback((name: string, startingBalance: number) => {
    const newAccount: Account = {
      id: crypto.randomUUID(),
      name: name.trim(),
      startingBalance,
      createdAt: new Date().toISOString(),
    };
    saveAccounts([...accounts, newAccount]);
    return newAccount;
  }, [accounts, saveAccounts]);

  const removeAccount = useCallback((id: string) => {
    saveAccounts(accounts.filter(a => a.id !== id));
  }, [accounts, saveAccounts]);

  const updateAccount = useCallback((id: string, name: string, startingBalance: number) => {
    saveAccounts(accounts.map(a => 
      a.id === id ? { ...a, name: name.trim(), startingBalance } : a
    ));
  }, [accounts, saveAccounts]);

  const getAccountById = useCallback((id: string) => {
    return accounts.find(a => a.id === id);
  }, [accounts]);

  const getAccountWithStats = useCallback((id: string): AccountWithStats | undefined => {
    const account = accounts.find(a => a.id === id);
    if (!account) return undefined;

    // Calculate P&L from all trades linked to this account
    const accountTrades = trades.filter(t => t.accountName === account.name);
    const pnl = accountTrades.reduce((sum, t) => sum + calculateTradeMetrics(t).netPnl, 0);
    const currentBalance = account.startingBalance + pnl;
    const roi = account.startingBalance > 0 
      ? ((currentBalance - account.startingBalance) / account.startingBalance) * 100 
      : 0;

    return {
      ...account,
      currentBalance,
      pnl,
      roi,
    };
  }, [accounts, trades]);

  const getAllAccountsWithStats = useCallback((): AccountWithStats[] => {
    return accounts.map(account => {
      const accountTrades = trades.filter(t => t.accountName === account.name);
      const pnl = accountTrades.reduce((sum, t) => sum + calculateTradeMetrics(t).netPnl, 0);
      const currentBalance = account.startingBalance + pnl;
      const roi = account.startingBalance > 0 
        ? ((currentBalance - account.startingBalance) / account.startingBalance) * 100 
        : 0;

      return {
        ...account,
        currentBalance,
        pnl,
        roi,
      };
    });
  }, [accounts, trades]);

  return (
    <AccountsContext.Provider value={{
      accounts,
      addAccount,
      removeAccount,
      updateAccount,
      getAccountById,
      getAccountWithStats,
      getAllAccountsWithStats,
    }}>
      {children}
    </AccountsContext.Provider>
  );
};

export const useAccountsContext = () => {
  const context = useContext(AccountsContext);
  if (!context) {
    throw new Error('useAccountsContext must be used within an AccountsProvider');
  }
  return context;
};
