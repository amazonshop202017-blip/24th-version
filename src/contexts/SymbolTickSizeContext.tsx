import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SymbolTickSizes {
  [symbol: string]: number;
}

interface SymbolTickSizeContextType {
  tickSizes: SymbolTickSizes;
  setTickSize: (symbol: string, size: number) => void;
  setAllTickSizes: (sizes: SymbolTickSizes) => void;
  getTickSize: (symbol: string) => number | undefined;
}

const STORAGE_KEY = 'symbol-tick-sizes';

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

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tickSizes));
  }, [tickSizes]);

  const setTickSize = (symbol: string, size: number) => {
    setTickSizes(prev => ({ ...prev, [symbol]: size }));
  };

  const setAllTickSizes = (sizes: SymbolTickSizes) => {
    setTickSizes(sizes);
  };

  const getTickSize = (symbol: string): number | undefined => {
    return tickSizes[symbol];
  };

  return (
    <SymbolTickSizeContext.Provider value={{ tickSizes, setTickSize, setAllTickSizes, getTickSize }}>
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
