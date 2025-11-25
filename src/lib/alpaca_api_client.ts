import { supabase } from "./supabase"; // centralized Supabase client

// --- Types ---
type AlpacaKeys = {
  api_key: string;
  secret_key: string;
};

export type AlpacaTradeActivity = {
  id: string;
  activity_type: string;
  transaction_time: string;
  symbol: string;
  qty: string;
  side: string;
  price: string;
  order_id: string;
  cum_qty: string;
  leaves_qty: string;
  type: string;
  status?: string;
  source?: string;
};

// --- Get User's Alpaca API Keys ---
export const getUserAlpacaKeys = async (userId: string): Promise<AlpacaKeys | null> => {
  try {
    const { data, error } = await supabase
      .from('user_alpaca_credentials')
      .select('api_key, secret_key')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      console.error('❌ Failed to fetch Alpaca keys:', error ?? 'No data');
      return null;
    }

    return {
      api_key: data.api_key,
      secret_key: data.secret_key,
    };
  } catch (err) {
    console.error('❌ Error fetching Alpaca keys:', err);
    return null;
  }
};

// --- Get Alpaca Account Info ---
export const getAlpacaAccount = async (apiKey: string, secretKey: string) => {
  try {
    const res = await fetch('https://paper-api.alpaca.markets/v2/account', {
      headers: {
        'APCA-API-KEY-ID': apiKey,
        'APCA-API-SECRET-KEY': secretKey,
      },
    });
    if (!res.ok) throw new Error(`Failed to fetch account: ${res.statusText}`);
    return await res.json();
  } catch (err) {
    console.error('❌ Error fetching Alpaca account:', err);
    return null;
  }
};

// --- Get Alpaca Account P&L ---
export const getAlpacaAccountPnl = async (userId: string) => {
  try {
    const keys = await getUserAlpacaKeys(userId);
    if (!keys) return null;

    const account = await getAlpacaAccount(keys.api_key, keys.secret_key);
    if (!account) return null;

    const equity = parseFloat(account.equity);
    const lastEquity = parseFloat(account.last_equity);
    const pnl = equity - lastEquity;
    const pnlPct = (pnl / lastEquity) * 100;

    return {
      equity,
      lastEquity,
      pnl,
      pnlPct,
    };
  } catch (err) {
    console.error('❌ Error calculating P&L:', err);
    return null;
  }
};

// --- Get Alpaca Price Quote ---
export const getAlpacaPrice = async (symbol: string, apiKey: string, secretKey: string) => {
  try {
    const res = await fetch(`https://data.alpaca.markets/v2/stocks/${symbol}/quotes/latest`, {
      headers: {
        'APCA-API-KEY-ID': apiKey,
        'APCA-API-SECRET-KEY': secretKey,
      },
    });
    if (!res.ok) throw new Error(`Failed to fetch price: ${res.statusText}`);
    const json = await res.json();
    return json.quote?.ap ?? null;
  } catch (err) {
    console.error('❌ Error fetching Alpaca price:', err);
    return null;
  }
};

// --- Place Alpaca Order ---
export const placeAlpacaOrder = async (
  symbol: string,
  qty: number,
  side: 'buy' | 'sell',
  type: string,
  time_in_force: string,
  apiKey: string,
  secretKey: string
) => {
  try {
    const res = await fetch('https://paper-api.alpaca.markets/v2/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'APCA-API-KEY-ID': apiKey,
        'APCA-API-SECRET-KEY': secretKey,
      },
      body: JSON.stringify({
        symbol,
        qty,
        side,
        type,
        time_in_force,
      }),
    });
    if (!res.ok) throw new Error(`Failed to place order: ${res.statusText}`);
    return await res.json();
  } catch (err) {
    console.error('❌ Error placing Alpaca order:', err);
    return null;
  }
};

// --- Get Alpaca Positions ---
export const getAlpacaPositions = async (apiKey: string, secretKey: string) => {
  try {
    const res = await fetch('https://paper-api.alpaca.markets/v2/positions', {
      headers: {
        'APCA-API-KEY-ID': apiKey,
        'APCA-API-SECRET-KEY': secretKey,
      },
    });
    if (!res.ok) throw new Error(`Failed to fetch positions: ${res.statusText}`);
    return await res.json();
  } catch (err) {
    console.error('❌ Error fetching Alpaca positions:', err);
    return null;
  }
};

// --- Get Alpaca Closed Trades ---
export const getAlpacaClosedTrades = async (
  userId: string,
  after?: string,   // ISO date string
  until?: string    // ISO date string
): Promise<AlpacaTradeActivity[] | null> => {
  try {
    const keys = await getUserAlpacaKeys(userId);
    if (!keys) return null;

    let url = `https://paper-api.alpaca.markets/v2/account/activities/FILL?direction=desc`;
    if (after) url += `&after=${encodeURIComponent(after)}`;
    if (until) url += `&until=${encodeURIComponent(until)}`;

    const res = await fetch(url, {
      headers: {
        'APCA-API-KEY-ID': keys.api_key,
        'APCA-API-SECRET-KEY': keys.secret_key,
      },
    });

    if (!res.ok) throw new Error(`Failed to fetch closed trades: ${res.statusText}`);
    return await res.json();
  } catch (err) {
    console.error('❌ Error fetching closed trades:', err);
    return null;
  }
};
