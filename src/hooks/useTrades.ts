import { useState, useEffect, useCallback } from 'react';
import { Trade, TradeFormData, calculateTradeMetrics } from '@/types/trade';

const STORAGE_KEY = 'trading-journal-trades';

export const useTrades = () => {
  const [trades, setTrades] = useState<Trade[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Migrate old trades that don't have the entries array
      const migrated = parsed.map((trade: any) => {
        if (!trade.entries) {
          // Old format - convert to new format
          return {
            ...trade,
            instrument: trade.instrument || 'Equity',
            entries: [],
            notes: trade.notes || '',
          };
        }
        return trade;
      });
      setTrades(migrated);
    }
  }, []);

  const saveTrades = useCallback((newTrades: Trade[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newTrades));
    setTrades(newTrades);
  }, []);

  const addTrade = useCallback((data: TradeFormData) => {
    const newTrade: Trade = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveTrades([...trades, newTrade]);
    return newTrade;
  }, [trades, saveTrades]);

  const updateTrade = useCallback((id: string, data: TradeFormData) => {
    const updated = trades.map(trade =>
      trade.id === id
        ? { ...trade, ...data, updatedAt: new Date().toISOString() }
        : trade
    );
    saveTrades(updated);
  }, [trades, saveTrades]);

  const deleteTrade = useCallback((id: string) => {
    saveTrades(trades.filter(trade => trade.id !== id));
  }, [trades, saveTrades]);

  const getTradeById = useCallback((id: string) => {
    return trades.find(trade => trade.id === id);
  }, [trades]);

  // Stats calculations using the new calculateTradeMetrics
  const stats = {
    netPnl: trades.reduce((sum, t) => sum + calculateTradeMetrics(t).netPnl, 0),
    totalTrades: trades.length,
    winningTrades: trades.filter(t => calculateTradeMetrics(t).netPnl > 0).length,
    losingTrades: trades.filter(t => calculateTradeMetrics(t).netPnl < 0).length,
    tradeWinRate: trades.length > 0 
      ? (trades.filter(t => calculateTradeMetrics(t).netPnl > 0).length / trades.length) * 100 
      : 0,
    dayWinRate: (() => {
      const dayPnl = trades.reduce((acc, t) => {
        const metrics = calculateTradeMetrics(t);
        const day = metrics.closeDate ? metrics.closeDate.split('T')[0] : 'unknown';
        acc[day] = (acc[day] || 0) + metrics.netPnl;
        return acc;
      }, {} as Record<string, number>);
      const days = Object.values(dayPnl);
      if (days.length === 0) return 0;
      return (days.filter(p => p > 0).length / days.length) * 100;
    })(),
    avgWin: (() => {
      const wins = trades.filter(t => calculateTradeMetrics(t).netPnl > 0);
      return wins.length > 0 ? wins.reduce((s, t) => s + calculateTradeMetrics(t).netPnl, 0) / wins.length : 0;
    })(),
    avgLoss: (() => {
      const losses = trades.filter(t => calculateTradeMetrics(t).netPnl < 0);
      return losses.length > 0 ? losses.reduce((s, t) => s + calculateTradeMetrics(t).netPnl, 0) / losses.length : 0;
    })(),
  };

  return {
    trades,
    stats,
    addTrade,
    updateTrade,
    deleteTrade,
    getTradeById,
  };
};
