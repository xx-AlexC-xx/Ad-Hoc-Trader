import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from '@/hooks/useToast';
import { supabase } from '@/lib/supabase';
import { useUser } from '@supabase/auth-helpers-react';
import type { User } from '@supabase/supabase-js';

interface Trade {
  id: string;
  symbol: string;
  strikePrice: number;
  entryPrice: number;
  exitPrice: number;
  stopLoss: number;
  expiration: string;
  riskRewardRatio: string;
  projectedGain: number;
  category?: string;
  status: 'pending' | 'active' | 'closed';
  currentPrice?: number;
  pnl?: number;
  entryTime?: string;
  exit_time?: string;
  exitReason?: 'target' | 'stop-loss' | 'expiration' | 'manual';
}

interface AppContextType {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  activeTrades: Trade[];
  addTrades: (trades: Omit<Trade, 'id' | 'status'>[]) => void;
  updateTradeStatus: (id: string, status: Trade['status'], data?: Partial<Trade>) => void;
  getTradeById: (id: string) => Trade | undefined;
  closeTrade: (id: string) => void;
  cancelTrade: (id: string) => void;
  user: User | null;
}

const defaultAppContext: AppContextType = {
  sidebarOpen: false,
  toggleSidebar: () => {},
  activeTrades: [],
  addTrades: () => {},
  updateTradeStatus: () => {},
  getTradeById: () => undefined,
  closeTrade: () => {},
  cancelTrade: () => {},
  user: null,
};

const AppContext = createContext<AppContextType>(defaultAppContext);
export const useAppContext = () => useContext(AppContext);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTrades, setActiveTrades] = useState<Trade[]>([]);
  const [user, setUser] = useState<User | null>(null);

  const toggleSidebar = () => setSidebarOpen(prev => !prev);
  const supaUser = useUser();

  useEffect(() => {
    setUser(supaUser ?? null);
  }, [supaUser]);

  const saveTrade = async (trade: any) => {
    try {
      await supabase.from('trades').insert([{
        symbol: trade.symbol,
        strike_price: trade.strikePrice,
        entry_price: trade.entryPrice,
        exit_price: trade.exitPrice,
        stop_loss: trade.stopLoss,
        expiration: trade.expiration,
        risk_reward_ratio: trade.riskRewardRatio,
        projected_gain: trade.projectedGain,
        category: trade.category,
        status: trade.status,
        current_price: trade.currentPrice,
        pnl: trade.pnl,
        entry_time: trade.entryTime,
        exit_time: trade.exit_time,
        exit_reason: trade.exitReason
      }]);
    } catch (error) {
      console.error('Error saving trade:', error);
    }
  };

  const addTrades = (newTrades: Omit<Trade, 'id' | 'status'>[]) => {
    const tradesWithId = newTrades.map(trade => ({
      ...trade,
      id: uuidv4(),
      status: 'pending' as const,
      currentPrice: trade.entryPrice
    }));

    setActiveTrades(prev => [...prev, ...tradesWithId]);
    tradesWithId.forEach(saveTrade);

    toast({
      title: "Trades Added",
      description: `${newTrades.length} trade(s) added and saved to database`,
    });
  };

  const updateTradeStatus = (id: string, status: Trade['status'], data?: Partial<Trade>) => {
    setActiveTrades(prev => prev.map(trade => {
      if (trade.id === id) {
        const updatedTrade = { ...trade, status, ...data };
        saveTrade(updatedTrade);
        return updatedTrade;
      }
      return trade;
    }));
  };

  const closeTrade = (id: string) => {
    const trade = activeTrades.find(t => t.id === id);
    if (trade) {
      updateTradeStatus(id, 'closed', {
        exit_time: new Date().toISOString(),
        exitReason: 'manual'
      });
      toast({
        title: "Trade Closed",
        description: `${trade.symbol} manually closed`,
      });
    }
  };

  const cancelTrade = (id: string) => {
    setActiveTrades(prev => prev.filter(t => t.id !== id));
    toast({
      title: "Trade Cancelled",
      description: "Trade removed from active list",
    });
  };

  const getTradeById = (id: string) => activeTrades.find(trade => trade.id === id);

  // Mock price updates and auto-close logic
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTrades(prev => prev.map(trade => {
        if (trade.status === 'closed') return trade;

        const volatility = 0.02;
        const change = (Math.random() - 0.5) * volatility;
        const newPrice = (trade.currentPrice || trade.entryPrice) * (1 + change);

        let updatedTrade = { ...trade, currentPrice: newPrice };

        if (trade.status === 'pending') {
          if (Math.abs(newPrice - trade.entryPrice) / trade.entryPrice < 0.01) {
            updatedTrade.status = 'active';
            updatedTrade.entryTime = new Date().toISOString();
            toast({
              title: "Trade Entered",
              description: `${trade.symbol} entered at $${newPrice.toFixed(2)}`,
            });
          }
        } else if (trade.status === 'active') {
          updatedTrade.pnl = ((newPrice - trade.entryPrice) / trade.entryPrice) * 100;

          if (newPrice >= trade.exitPrice) {
            updatedTrade.status = 'closed';
            updatedTrade.exit_time = new Date().toISOString();
            updatedTrade.exitReason = 'target';
            toast({
              title: "Trade Closed - Target Hit",
              description: `${trade.symbol} sold at $${newPrice.toFixed(2)} (+${updatedTrade.pnl?.toFixed(2)}%)`,
            });
          } else if (newPrice <= trade.stopLoss) {
            updatedTrade.status = 'closed';
            updatedTrade.exit_time = new Date().toISOString();
            updatedTrade.exitReason = 'stop-loss';
            toast({
              title: "Trade Closed - Stop Loss",
              description: `${trade.symbol} sold at $${newPrice.toFixed(2)} (${updatedTrade.pnl?.toFixed(2)}%)`,
            });
          }
        }

        if (updatedTrade !== trade) saveTrade(updatedTrade);
        return updatedTrade;
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <AppContext.Provider
      value={{
        sidebarOpen,
        toggleSidebar,
        activeTrades,
        addTrades,
        updateTradeStatus,
        getTradeById,
        closeTrade,
        cancelTrade,
        user
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
