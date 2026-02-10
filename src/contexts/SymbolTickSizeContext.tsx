import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { setContractSizeRegistry } from '@/lib/contractSizeRegistry';

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
}

const STORAGE_KEY = 'symbol-tick-sizes';
const CONTRACT_STORAGE_KEY = 'symbol-contract-sizes';

const SymbolTickSizeContext = createContext<SymbolTickSizeContextType | undefined>(undefined);

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
      // Initialize registry on first load
      setContractSizeRegistry(parsed);
      return parsed;
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tickSizes));
  }, [tickSizes]);

  useEffect(() => {
    localStorage.setItem(CONTRACT_STORAGE_KEY, JSON.stringify(contractSizes));
    // Keep the module-level registry in sync for calculateTradeMetrics
    setContractSizeRegistry(contractSizes);
  }, [contractSizes]);

  const setTickSize = (symbol: string, size: number) => {
    setTickSizes(prev => ({ ...prev, [symbol]: size }));
  };

  const setAllTickSizes = (sizes: SymbolTickSizes) => {
    setTickSizes(sizes);
  };

  const getTickSize = (symbol: string): number | undefined => {
    return tickSizes[symbol];
  };

  const setContractSize = (symbol: string, size: number) => {
    setContractSizes(prev => ({ ...prev, [symbol]: size }));
  };

  const setAllContractSizes = (sizes: SymbolContractSizes) => {
    setContractSizes(sizes);
  };

  const getContractSize = (symbol: string): number | undefined => {
    return contractSizes[symbol];
  };

  return (
    <SymbolTickSizeContext.Provider value={{ tickSizes, contractSizes, setTickSize, setAllTickSizes, getTickSize, setContractSize, setAllContractSizes, getContractSize }}>
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
