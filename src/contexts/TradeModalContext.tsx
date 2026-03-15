/* Trade Modal Context - provides modal state for adding/editing trades */
import { createContext, useContext, useState, ReactNode } from 'react';
import { Trade } from '@/types/trade';

interface TradeModalContextType {
  isOpen: boolean;
  editingTrade: Trade | null;
  initialEntryDate: string | null;
  openModal: (trade?: Trade) => void;
  openModalWithDate: (entryDate: string) => void;
  closeModal: () => void;
}

const TradeModalContext = createContext<TradeModalContextType | undefined>(undefined);

export const TradeModalProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [initialEntryDate, setInitialEntryDate] = useState<string | null>(null);

  const openModal = (trade?: Trade) => {
    setEditingTrade(trade || null);
    setInitialEntryDate(null);
    setIsOpen(true);
  };

  const openModalWithDate = (entryDate: string) => {
    setEditingTrade(null);
    setInitialEntryDate(entryDate);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setEditingTrade(null);
    setInitialEntryDate(null);
  };

  return (
    <TradeModalContext.Provider value={{ isOpen, editingTrade, initialEntryDate, openModal, openModalWithDate, closeModal }}>
      {children}
    </TradeModalContext.Provider>
  );
};

export const useTradeModal = () => {
  const context = useContext(TradeModalContext);
  if (!context) {
    throw new Error('useTradeModal must be used within TradeModalProvider');
  }
  return context;
};
