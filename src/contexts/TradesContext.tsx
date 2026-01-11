import { createContext, useContext, ReactNode } from 'react';
import { useTrades } from '@/hooks/useTrades';
import { Trade, TradeFormData } from '@/types/trade';

interface TradesContextType {
  trades: Trade[];
  stats: {
    netPnl: number;
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    tradeWinRate: number;
    dayWinRate: number;
    avgWin: number;
    avgLoss: number;
    totalProfits: number;
    totalLosses: number;
    profitFactor: number;
  };
  addTrade: (data: TradeFormData) => Trade;
  updateTrade: (id: string, data: TradeFormData) => void;
  deleteTrade: (id: string) => void;
  getTradeById: (id: string) => Trade | undefined;
}

const TradesContext = createContext<TradesContextType | undefined>(undefined);

export const TradesProvider = ({ children }: { children: ReactNode }) => {
  const tradesHook = useTrades();

  return (
    <TradesContext.Provider value={tradesHook}>
      {children}
    </TradesContext.Provider>
  );
};

export const useTradesContext = () => {
  const context = useContext(TradesContext);
  if (!context) {
    throw new Error('useTradesContext must be used within TradesProvider');
  }
  return context;
};
