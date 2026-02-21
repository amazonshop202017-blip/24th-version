import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { setContractSizeRegistry, setTickSizeRegistry } from '@/lib/contractSizeRegistry';

export interface TickPipRule {
  id: string;
  accountId: string;
  accountName: string;
  symbol: string;
  tickSize: number;
  contractSize: number;
  createdAt: string;
  updatedAt: string;
}

interface SymbolTickSizes {
  [symbol: string]: number;
}

interface SymbolContractSizes {
  [symbol: string]: number;
}

interface SymbolTickSizeContextType {
  tickSizes: SymbolTickSizes;
  contractSizes: SymbolContractSizes;
  setTickSize: (symbol: string, size: number) => void;
  setAllTickSizes: (sizes: SymbolTickSizes) => void;
  getTickSize: (symbol: string) => number | undefined;
  setContractSize: (symbol: string, size: number) => void;
  setAllContractSizes: (sizes: SymbolContractSizes) => void;
  getContractSize: (symbol: string) => number | undefined;
  // Rule-based API
  tickPipRules: TickPipRule[];
  addTickPipRule: (rule: Omit<TickPipRule, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTickPipRule: (id: string, rule: Partial<Omit<TickPipRule, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  deleteTickPipRule: (id: string) => void;
  getTickSizeForAccountSymbol: (accountName: string, symbol: string) => number | undefined;
  getContractSizeForAccountSymbol: (accountName: string, symbol: string) => number;
}

const STORAGE_KEY = 'symbol-tick-sizes';
const CONTRACT_STORAGE_KEY = 'symbol-contract-sizes';
const RULES_STORAGE_KEY = 'trading-journal-tickpip-rules';

const SymbolTickSizeContext = createContext<SymbolTickSizeContextType | undefined>(undefined);

const loadRules = (): TickPipRule[] => {
  try {
    const stored = localStorage.getItem(RULES_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveRules = (rules: TickPipRule[]) => {
  localStorage.setItem(RULES_STORAGE_KEY, JSON.stringify(rules));
};

export const SymbolTickSizeProvider = ({ children }: { children: ReactNode }) => {
  const [tickSizes, setTickSizes] = useState<SymbolTickSizes>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const [contractSizes, setContractSizes] = useState<SymbolContractSizes>(() => {
    try {
      const stored = localStorage.getItem(CONTRACT_STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : {};
      setContractSizeRegistry(parsed);
      return parsed;
    } catch {
      return {};
    }
  });

  const [tickPipRules, setTickPipRules] = useState<TickPipRule[]>(loadRules);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tickSizes));
    setTickSizeRegistry(tickSizes);
  }, [tickSizes]);

  useEffect(() => {
    localStorage.setItem(CONTRACT_STORAGE_KEY, JSON.stringify(contractSizes));
    setContractSizeRegistry(contractSizes);
  }, [contractSizes]);

  // Keep rules synced to flat dicts for backward compatibility
  // Rules override flat dicts per symbol (last rule for a symbol wins as global fallback)
  useEffect(() => {
    // Build merged flat dicts: start with legacy, overlay rules
    const mergedTick = { ...tickSizes };
    const mergedContract = { ...contractSizes };
    tickPipRules.forEach(rule => {
      mergedTick[rule.symbol] = rule.tickSize;
      mergedContract[rule.symbol] = rule.contractSize;
    });
    setTickSizeRegistry(mergedTick);
    setContractSizeRegistry(mergedContract);
  }, [tickPipRules, tickSizes, contractSizes]);

  const setTickSize = (symbol: string, size: number) => {
    setTickSizes(prev => ({ ...prev, [symbol]: size }));
  };

  const setAllTickSizes = (sizes: SymbolTickSizes) => {
    setTickSizes(sizes);
  };

  const getTickSize = (symbol: string): number | undefined => {
    return tickSizes[symbol];
  };

  const setContractSizeValue = (symbol: string, size: number) => {
    setContractSizes(prev => ({ ...prev, [symbol]: size }));
  };

  const setAllContractSizes = (sizes: SymbolContractSizes) => {
    setContractSizes(sizes);
  };

  const getContractSize = (symbol: string): number | undefined => {
    return contractSizes[symbol];
  };

  // Rule CRUD
  const addTickPipRule = (rule: Omit<TickPipRule, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newRule: TickPipRule = {
      ...rule,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    const updated = [...tickPipRules, newRule];
    setTickPipRules(updated);
    saveRules(updated);
  };

  const updateTickPipRule = (id: string, patch: Partial<Omit<TickPipRule, 'id' | 'createdAt' | 'updatedAt'>>) => {
    const updated = tickPipRules.map(r =>
      r.id === id ? { ...r, ...patch, updatedAt: new Date().toISOString() } : r
    );
    setTickPipRules(updated);
    saveRules(updated);
  };

  const deleteTickPipRule = (id: string) => {
    const updated = tickPipRules.filter(r => r.id !== id);
    setTickPipRules(updated);
    saveRules(updated);
  };

  // Account+Symbol lookup with fallback
  const getTickSizeForAccountSymbol = (accountName: string, symbol: string): number | undefined => {
    // Try account+symbol match first
    const accountRule = tickPipRules.find(
      r => r.accountName === accountName && r.symbol === symbol
    );
    if (accountRule) return accountRule.tickSize;
    // Fallback to symbol-only legacy
    return tickSizes[symbol];
  };

  const getContractSizeForAccountSymbol = (accountName: string, symbol: string): number => {
    const accountRule = tickPipRules.find(
      r => r.accountName === accountName && r.symbol === symbol
    );
    if (accountRule) return accountRule.contractSize;
    return contractSizes[symbol] ?? 1;
  };

  return (
    <SymbolTickSizeContext.Provider value={{
      tickSizes, contractSizes,
      setTickSize, setAllTickSizes, getTickSize,
      setContractSize: setContractSizeValue, setAllContractSizes, getContractSize,
      tickPipRules, addTickPipRule, updateTickPipRule, deleteTickPipRule,
      getTickSizeForAccountSymbol, getContractSizeForAccountSymbol,
    }}>
      {children}
    </SymbolTickSizeContext.Provider>
  );
};

export const useSymbolTickSize = (): SymbolTickSizeContextType => {
  const context = useContext(SymbolTickSizeContext);
  if (context === undefined) {
    throw new Error('useSymbolTickSize must be used within SymbolTickSizeProvider');
  }
  return context;
};
