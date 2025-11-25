import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from '@/hooks/useToast';
import { supabase } from '@/lib/supabase';
import { useUser } from '@supabase/auth-helpers-react';
import type { User } from '@supabase/supabase-js';
import { getUserAlpacaKeys } from '@/lib/alpaca';

const log = (...args: any[]) => {
  const now = new Date().toISOString().split('T')[1]; // e.g. 14:22:33.123Z
  console.log(`[${now}]`, ...args);
};

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
  qty?: number;
  category?: string;
  status: 'pending' | 'active' | 'closed';
  currentPrice?: number;
  pnl?: number;
  entryTime?: string;
  exit_time?: string;
  exitReason?: 'target' | 'stop-loss' | 'expiration' | 'manual' | 'filled' | 'cancelled' | 'expired' | 'rejected';
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
  totalPnl: number;
  dailyChange: number;
  cashAvailable: number;
  portfolioValue: number;
  account: any;
  positions: any[];
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
  totalPnl: 0,
  dailyChange: 0,
  cashAvailable: 0,
  portfolioValue: 0,
  account: null,
  positions: [],
};

const AppContext = createContext<AppContextType>(defaultAppContext);
export const useAppContext = () => useContext(AppContext);

// --- normalize Alpaca position into Trade shape ---
const positionToTrade = (pos: any): Trade => {
  console.log('[AppContext] Normalizing Alpaca position into Trade:', pos);
  return {
    id: pos.asset_id || uuidv4(),
    symbol: pos.symbol,
    strikePrice: 0,
    entryPrice: parseFloat(pos.avg_entry_price ?? 0),
    exitPrice: 0,
    stopLoss: 0,
    expiration: '',
    riskRewardRatio: '',
    projectedGain: 0,
    qty: parseFloat(pos.qty ?? 0),
    category: 'position',
    status: 'active',
    currentPrice: parseFloat(pos.current_price ?? pos.market_price ?? 0),
    pnl: parseFloat(pos.unrealized_pl ?? 0),
    entryTime: undefined,
  };
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTrades, setActiveTrades] = useState<Trade[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [totalPnl, setTotalPnl] = useState(0);
  const [dailyChange, setDailyChange] = useState(0);
  const [cashAvailable, setCashAvailable] = useState(0);
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [account, setAccount] = useState<any>(null);
  const [positions, setPositions] = useState<any[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const subscribedSymbols = useRef<Set<string>>(new Set());
  const authorizedRef = useRef<boolean>(false);
  const useV2Ref = useRef<boolean>(true);

  const toggleSidebar = () => {
    console.log('[AppContext] toggleSidebar called');
    setSidebarOpen(prev => !prev);
  };

  const supaUser = useUser();
  useEffect(() => {
    console.log('[AppContext] useEffect user change:', supaUser);
    setUser(supaUser ?? null);
  }, [supaUser]);

  // --- saveTrade ---
  const saveTrade = async (trade: any) => {
    console.log('[AppContext] saveTrade called:', trade);
    try {
      const payload = {
        id: trade.id,
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
        exit_reason: trade.exitReason,
        user_id: user?.id ?? null,
      };

      console.log('[AppContext] saveTrade upsert payload:', payload);
      await supabase.from('trades').upsert([payload]);
      console.log('[AppContext] saveTrade success');
    } catch (error) {
      console.error('[AppContext] Error saving trade:', error);
    }
  };

  // --- addTrades ---
  const addTrades = (newTrades: Omit<Trade, 'id' | 'status'>[]) => {
    console.log('[AppContext] addTrades called:', newTrades);
    const tradesWithId = newTrades.map(trade => ({
      ...trade,
      id: uuidv4(),
      status: 'pending' as const,
      currentPrice: trade.entryPrice
    }));

    setActiveTrades(prev => {
      const next = [...prev, ...tradesWithId];
      console.log('[AppContext] addTrades next activeTrades count=', next.length);
      return next;
    });

    tradesWithId.forEach(saveTrade);

    toast({
      title: "Trades Added",
      description: `${newTrades.length} trade(s) added and saved to database`,
    });
  };

  const updateTradeStatus = (id: string, status: Trade['status'], data?: Partial<Trade>) => {
    console.log('[AppContext] updateTradeStatus called:', { id, status, data });
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
    console.log('[AppContext] closeTrade called:', id);
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
    } else {
      console.warn('[AppContext] closeTrade: trade not found:', id);
    }
  };

  const cancelTrade = (id: string) => {
    console.log('[AppContext] cancelTrade called:', id);
    setActiveTrades(prev => prev.filter(t => t.id !== id));
    toast({
      title: "Trade Cancelled",
      description: "Trade removed from active list",
    });
  };

  const getTradeById = (id: string) => {
    console.log('[AppContext] getTradeById called:', id);
    return activeTrades.find(trade => trade.id === id);
  };

  // --- Load open positions from Alpaca REST ---
  const loadAlpacaPositions = async (uid: string) => {
    console.log('[AppContext] Loading positions from Alpaca REST for user:', uid);
    try {
      const keys = await getUserAlpacaKeys(uid);
      if (!keys) {
        console.warn('[AppContext] No Alpaca keys found for user');
        return;
      }

      const resp = await fetch('https://paper-api.alpaca.markets/v2/positions', {
        headers: {
          'APCA-API-KEY-ID': keys.api_key,
          'APCA-API-SECRET-KEY': keys.secret_key,
        },
      });

      if (!resp.ok) {
        console.error('[AppContext] Failed to fetch Alpaca positions:', resp.statusText);
        return;
      }

      const data = await resp.json();
      console.log('[AppContext] Positions loaded from Alpaca:', data);

      const normalized = data.map(positionToTrade);
      console.log('[AppContext] Normalized activeTrades:', normalized);
      setActiveTrades(normalized);
      setPositions(data);

      // 🩹 PATCH: Compute total P&L and daily change from positions since /account lacks these fields
      const totalPnlCalc = data.reduce((sum: number, p: any) => sum + parseFloat(p.unrealized_pl ?? 0), 0);
      const dailyChangeCalc = data.reduce((sum: number, p: any) => sum + parseFloat(p.unrealized_intraday_pl ?? 0), 0);
      setTotalPnl(totalPnlCalc);
      setDailyChange(dailyChangeCalc);
      console.log('[AppContext] 🩹 Calculated totalPnl and dailyChange from positions:', { totalPnlCalc, dailyChangeCalc });

    } catch (err) {
      console.error('[AppContext] Error loading Alpaca positions:', err);
    }
  };

  // --- Load trades from Supabase (for history) ---
  useEffect(() => {
    const loadTrades = async () => {
      // 🔴 CRITICAL FIX: Added explicit check for user.id to prevent querying with an empty UUID.
      if (!user?.id) {
        console.log('[AppContext] loadTrades skipped — no valid user ID available');
        return;
      }
      console.log('[AppContext] Loading trades from Supabase for user:', user.id);
      try {
        const { data, error } = await supabase
          .from('trades')
          .select('*')
          .eq('user_id', user.id);

        if (error) {
          console.error('[AppContext] Error loading trades from Supabase:', error);
          return;
        }

        if (data) {
          const mappedTrades: Trade[] = data.map((row: any) => ({
            id: row.id,
            symbol: row.symbol,
            strikePrice: row.strike_price,
            entryPrice: row.entry_price,
            exitPrice: row.exit_price,
            stopLoss: row.stop_loss,
            expiration: row.expiration,
            riskRewardRatio: row.risk_reward_ratio,
            projectedGain: row.projected_gain,
            qty: row.qty,
            category: row.category,
            status: row.status,
            currentPrice: row.current_price,
            pnl: row.pnl,
            entryTime: row.entry_time,
            exit_time: row.exit_time,
            exitReason: row.exit_reason,
          }));
          console.log('[AppContext] Trades loaded from Supabase:', mappedTrades);
        }
      } catch (err) {
        console.error('[AppContext] Unexpected error loading trades:', err);
      }
    };

    loadTrades();
  }, [user]);

  // 🩹 PATCH START — ensure Alpaca keys fetched after Supabase hydration with timestamps
  useEffect(() => {
    if (!user?.id) {
      const now = new Date().toISOString().split('T')[1];
      console.log(`[${now}] [AppContext] Waiting for Supabase user before fetching Alpaca credentials...`);
      return;
    }

    const delay = setTimeout(async () => {
      const startTime = new Date();
      const startStamp = startTime.toISOString().split('T')[1];
      console.log(`[${startStamp}] [AppContext] (DELAY START) Fetching Alpaca credentials for user:`, user.id);

      try {
        const keys = await getUserAlpacaKeys(user.id);
        const keysTime = new Date().toISOString().split('T')[1];
        if (!keys) {
          console.warn(`[${keysTime}] [AppContext] ❌ No Alpaca keys found for user:`, user.id);
          return;
        }

        console.log(`[${keysTime}] [AppContext] ✅ Alpaca keys found — fetching account summary...`);
        const resp = await fetch('https://paper-api.alpaca.markets/v2/account', {
          headers: {
            'APCA-API-KEY-ID': keys.api_key,
            'APCA-API-SECRET-KEY': keys.secret_key,
          },
        });

        const fetchTime = new Date().toISOString().split('T')[1];
        if (!resp.ok) {
          console.error(`[${fetchTime}] [AppContext] ❌ Failed to fetch Alpaca account summary:`, resp.statusText);
          return;
        }

        const acct = await resp.json();
        const acctTime = new Date().toISOString().split('T')[1];
        console.log(`[${acctTime}] [AppContext] ✅ Account summary loaded:`, acct);

        setAccount(acct);
        if (acct.cash != null) setCashAvailable(parseFloat(acct.cash));
        if (acct.portfolio_value != null) setPortfolioValue(parseFloat(acct.portfolio_value));
        if (acct.unrealized_pl != null) setTotalPnl(parseFloat(acct.unrealized_pl)); // green → teal handled in UI
        if (acct.unrealized_intraday_pl != null) setDailyChange(parseFloat(acct.unrealized_intraday_pl)); // green → teal handled in UI

        const endTime = new Date();
        const elapsed = endTime.getTime() - startTime.getTime();
        const endStamp = endTime.toISOString().split('T')[1];
        console.log(`[${endStamp}] [AppContext] (DELAY END) Total time from start to account fetch: ${elapsed} ms`);
      } catch (err) {
        const errTime = new Date().toISOString().split('T')[1];
        console.error(`[${errTime}] [AppContext] Error fetching Alpaca credentials or account:`, err);
      }
    }, 500);

    return () => clearTimeout(delay);
  }, [user]);
  // 🩹 PATCH END

  // --- WebSocket logic ---
  useEffect(() => {
    if (!user) {
      console.log('[WebSocket] ⏸️ init skipped — no user yet');
      return;
    }

    const delay = 500; // small delay to let Supabase fully hydrate
    const timeout = setTimeout(() => {
      console.log('[WebSocket] ✅ User available — initializing after auth load:', user.id);

      let ws: WebSocket | null = null;

      const initWebSocket = async () => {
        try {
          console.log('[WebSocket] Initializing...');
          const keys = await getUserAlpacaKeys(user.id);
          if (!keys) {
            console.warn('[WebSocket] No Alpaca keys found for user');
            return;
          }

          await loadAlpacaPositions(user.id); // bootstrap open positions

          ws = new WebSocket('wss://paper-api.alpaca.markets/stream');
          wsRef.current = ws;

          ws.onopen = () => {
            console.log('[WebSocket] Connection opened');
            ws?.send(JSON.stringify({ action: 'auth', key: keys.api_key, secret: keys.secret_key }));
          };

          ws.onmessage = async (event) => {
            let msg: any;
            try {
              if (event.data instanceof Blob) {
                const text = await event.data.text();
                msg = JSON.parse(text);
              } else {
                msg = JSON.parse(event.data);
              }
            } catch (err) {
              console.error('[WebSocket] Error parsing WebSocket message:', err);
              return;
            }

            console.log('[WebSocket] Message received:', msg);
            const message = Array.isArray(msg) ? msg[0] : msg;

            if (message?.stream === 'trade_updates') {
              const data = message.data;
              console.log('[WebSocket] trade_updates message:', data);

              const pos = data?.position;
              if (pos) {
                console.log('[AppContext] trade_updates: position update for', pos.symbol);
                const mapped = positionToTrade(pos);

                if (['filled', 'canceled', 'expired', 'rejected'].includes(data.event)) {
                  console.log('[AppContext] trade_updates: closing trade, upserting to Supabase:', mapped);
                  await saveTrade({ ...mapped, status: 'closed', exitReason: data.event });
                } else {
                  setActiveTrades(prev => {
                    const idx = prev.findIndex(t => t.symbol === mapped.symbol);
                    if (idx >= 0) {
                      const updated = [...prev];
                      updated[idx] = { ...prev[idx], ...mapped };
                      return updated;
                    } else {
                      return [...prev, mapped];
                    }
                  });
                }
              }

              const acct = data?.account;
              if (acct) {
                setAccount(acct);
                if (acct.cash != null) setCashAvailable(parseFloat(acct.cash));
                if (acct.portfolio_value != null) setPortfolioValue(parseFloat(acct.portfolio_value));
                if (acct.unrealized_pl != null) setTotalPnl(parseFloat(acct.unrealized_pl)); // green → teal
                if (acct.unrealized_intraday_pl != null) setDailyChange(parseFloat(acct.unrealized_intraday_pl)); // green → teal
              }
            }
          };

          ws.onclose = () => console.log('[WebSocket] Connection closed');
          ws.onerror = (err) => console.error('[WebSocket] Error:', err);
        } catch (err) {
          console.error('[WebSocket] Failed to initialize Alpaca WebSocket:', err);
        }
      };

      initWebSocket();
    }, delay);

    return () => {
      console.log('[WebSocket] cleanup — closing socket if present');
      clearTimeout(timeout);
      wsRef.current?.close();
    };
  }, [user]);

  const contextValue: AppContextType = {
    sidebarOpen,
    toggleSidebar,
    activeTrades,
    addTrades,
    updateTradeStatus,
    getTradeById,
    closeTrade,
    cancelTrade,
    user,
    totalPnl,
    dailyChange,
    cashAvailable,
    portfolioValue,
    account,
    positions,
  };

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};