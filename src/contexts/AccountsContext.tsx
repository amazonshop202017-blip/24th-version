import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useTradesContext } from './TradesContext';
import { calculateTradeMetrics } from '@/types/trade';

export interface Account {
  id: string;
  name: string;
  startingBalance: number;
  createdAt: string;
}

export interface Transaction {
  id: string;
  accountId: string;
  type: 'deposit' | 'withdraw';
  amount: number;
  date: string;
  note?: string;
}

export interface AccountWithStats extends Account {
  currentBalance: number;
  pnl: number;
  roi: number;
}

interface AccountsContextType {
  accounts: Account[];
  transactions: Transaction[];
  addAccount: (name: string, startingBalance: number) => Account;
  removeAccount: (id: string) => void;
  updateAccount: (id: string, name: string, startingBalance: number) => void;
  getAccountById: (id: string) => Account | undefined;
  getAccountWithStats: (id: string) => AccountWithStats | undefined;
  getAllAccountsWithStats: () => AccountWithStats[];
  addTransaction: (accountId: string, type: 'deposit' | 'withdraw', amount: number, note?: string) => void;
  getTransactionsForAccount: (accountId: string) => Transaction[];
  // Get account balance BEFORE any trade P/L (starting balance + transactions only)
  getAccountBalanceBeforeTrades: (id: string) => number;
}

const AccountsContext = createContext<AccountsContextType | undefined>(undefined);

const STORAGE_KEY = 'trading-journal-accounts';
const TRANSACTIONS_STORAGE_KEY = 'trading-journal-transactions';

export const AccountsProvider = ({ children }: { children: ReactNode }) => {
  // Get trades from context for account stats calculation
  const { trades } = useTradesContext();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setAccounts(JSON.parse(stored));
      }
      const storedTransactions = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
      if (storedTransactions) {
        setTransactions(JSON.parse(storedTransactions));
      }
    } catch (error) {
      console.error('Error loading accounts:', error);
    }
  }, []);

  const saveAccounts = useCallback((newAccounts: Account[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newAccounts));
    setAccounts(newAccounts);
  }, []);

  const saveTransactions = useCallback((newTransactions: Transaction[]) => {
    localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(newTransactions));
    setTransactions(newTransactions);
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
    // Also remove transactions for this account
    saveTransactions(transactions.filter(t => t.accountId !== id));
  }, [accounts, transactions, saveAccounts, saveTransactions]);

  const updateAccount = useCallback((id: string, name: string, startingBalance: number) => {
    saveAccounts(accounts.map(a => 
      a.id === id ? { ...a, name: name.trim(), startingBalance } : a
    ));
  }, [accounts, saveAccounts]);

  const getAccountById = useCallback((id: string) => {
    return accounts.find(a => a.id === id);
  }, [accounts]);

  const addTransaction = useCallback((accountId: string, type: 'deposit' | 'withdraw', amount: number, note?: string) => {
    const newTransaction: Transaction = {
      id: crypto.randomUUID(),
      accountId,
      type,
      amount,
      date: new Date().toISOString(),
      note,
    };
    saveTransactions([...transactions, newTransaction]);
  }, [transactions, saveTransactions]);

  const getTransactionsForAccount = useCallback((accountId: string) => {
    return transactions.filter(t => t.accountId === accountId);
  }, [transactions]);

  const getAccountWithStats = useCallback((id: string): AccountWithStats | undefined => {
    const account = accounts.find(a => a.id === id);
    if (!account) return undefined;

    // Calculate P&L from all trades linked to this account
    const accountTrades = trades.filter(t => t.accountName === account.name);
    const tradePnl = accountTrades.reduce((sum, t) => sum + calculateTradeMetrics(t).netPnl, 0);
    
    // Add transaction adjustments
    const accountTransactions = transactions.filter(t => t.accountId === id);
    const depositTotal = accountTransactions
      .filter(t => t.type === 'deposit')
      .reduce((sum, t) => sum + t.amount, 0);
    const withdrawTotal = accountTransactions
      .filter(t => t.type === 'withdraw')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const adjustedStartingBalance = account.startingBalance + depositTotal - withdrawTotal;
    const currentBalance = adjustedStartingBalance + tradePnl;
    const roi = adjustedStartingBalance > 0 
      ? ((currentBalance - adjustedStartingBalance) / adjustedStartingBalance) * 100 
      : 0;

    return {
      ...account,
      currentBalance,
      pnl: tradePnl,
      roi,
    };
  }, [accounts, trades, transactions]);

  const getAllAccountsWithStats = useCallback((): AccountWithStats[] => {
    return accounts.map(account => {
      const accountTrades = trades.filter(t => t.accountName === account.name);
      const tradePnl = accountTrades.reduce((sum, t) => sum + calculateTradeMetrics(t).netPnl, 0);
      
      // Add transaction adjustments
      const accountTransactions = transactions.filter(t => t.accountId === account.id);
      const depositTotal = accountTransactions
        .filter(t => t.type === 'deposit')
        .reduce((sum, t) => sum + t.amount, 0);
      const withdrawTotal = accountTransactions
        .filter(t => t.type === 'withdraw')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const adjustedStartingBalance = account.startingBalance + depositTotal - withdrawTotal;
      const currentBalance = adjustedStartingBalance + tradePnl;
      const roi = adjustedStartingBalance > 0 
        ? ((currentBalance - adjustedStartingBalance) / adjustedStartingBalance) * 100 
        : 0;

      return {
        ...account,
        currentBalance,
        pnl: tradePnl,
        roi,
      };
    });
  }, [accounts, trades, transactions]);

  // Get account balance BEFORE any trade P/L is applied
  // This is: startingBalance + deposits - withdrawals (NO trade P/L)
  const getAccountBalanceBeforeTrades = useCallback((id: string): number => {
    const account = accounts.find(a => a.id === id);
    if (!account) return 0;

    const accountTransactions = transactions.filter(t => t.accountId === id);
    const depositTotal = accountTransactions
      .filter(t => t.type === 'deposit')
      .reduce((sum, t) => sum + t.amount, 0);
    const withdrawTotal = accountTransactions
      .filter(t => t.type === 'withdraw')
      .reduce((sum, t) => sum + t.amount, 0);

    return account.startingBalance + depositTotal - withdrawTotal;
  }, [accounts, transactions]);

  return (
    <AccountsContext.Provider value={{
      accounts,
      transactions,
      addAccount,
      removeAccount,
      updateAccount,
      getAccountById,
      getAccountWithStats,
      getAllAccountsWithStats,
      addTransaction,
      getTransactionsForAccount,
      getAccountBalanceBeforeTrades,
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
