// --- alpaca.ts ---

import { supabase } from "./supabase"; // Use centralized Supabase client

// --- Types ---
type AlpacaKeys = {
  api_key: string;
  secret_key: string;
};

// --- Get User's Alpaca API Keys ---
export const getUserAlpacaKeys = async (userId: string): Promise<AlpacaKeys | null> => {
  try {
    const { data, error } = await supabase
      .from("user_alpaca_credentials")
      .select("api_key, secret_key")
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      console.error("❌ Failed to fetch Alpaca keys:", error ?? "No data");
      return null;
    }

    return {
      api_key: data.api_key,
      secret_key: data.secret_key,
    };
  } catch (err) {
    console.error("❌ Error fetching Alpaca keys:", err);
    return null;
  }
};

// --- Get Alpaca Account Info ---
export const getAlpacaAccount = async (apiKey: string, secretKey: string) => {
  try {
    const res = await fetch("https://paper-api.alpaca.markets/v2/account", {
      headers: {
        "APCA-API-KEY-ID": apiKey,
        "APCA-API-SECRET-KEY": secretKey,
      },
    });
    if (!res.ok) throw new Error(`Failed to fetch account: ${res.statusText}`);
    return await res.json();
  } catch (err) {
    console.error("❌ Error fetching Alpaca account:", err);
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
    console.error("❌ Error calculating P&L:", err);
    return null;
  }
};

// --- Get Alpaca Price Quote ---
export const getAlpacaPrice = async (symbol: string, apiKey: string, secretKey: string) => {
  try {
    const res = await fetch(`https://data.alpaca.markets/v2/stocks/${symbol}/quotes/latest`, {
      headers: {
        "APCA-API-KEY-ID": apiKey,
        "APCA-API-SECRET-KEY": secretKey,
      },
    });
    if (!res.ok) throw new Error(`Failed to fetch price: ${res.statusText}`);
    const json = await res.json();
    return json.quote?.ap ?? null;
  } catch (err) {
    console.error("❌ Error fetching Alpaca price:", err);
    return null;
  }
};

// --- Place Alpaca Order ---
export async function placeAlpacaOrder(
  symbol: string,
  qty: number,
  side: 'buy' | 'sell',
  type: 'market' | 'limit' | 'stop' | 'stop_limit' | 'trailing_stop',
  time_in_force: 'day' | 'gtc' | 'fok' | 'ioc' | 'opg' | 'cls',
  apiKey: string,
  secretKey: string,
  extraParams?: Record<string, any> // ✅ Optional 8th param
): Promise<any> {
  const body = {
    symbol,
    qty,
    side,
    type,
    time_in_force,
    ...extraParams, // ✅ Optional config merged into request
  };

  const response = await fetch('https://paper-api.alpaca.markets/v2/orders', {
    method: 'POST',
    headers: {
      'APCA-API-KEY-ID': apiKey,
      'APCA-API-SECRET-KEY': secretKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('[Alpaca Order Error]', error);
    throw new Error(error.message || 'Order placement failed.');
  }

  const data = await response.json();
  return data;
};

// --- Get Alpaca Positions ---
export const getAlpacaPositions = async (apiKey: string, secretKey: string) => {
  try {
    const res = await fetch("https://paper-api.alpaca.markets/v2/positions", {
      headers: {
        "APCA-API-KEY-ID": apiKey,
        "APCA-API-SECRET-KEY": secretKey,
      },
    });
    if (!res.ok) throw new Error(`Failed to fetch positions: ${res.statusText}`);
    return await res.json();
  } catch (err) {
    console.error("❌ Error fetching Alpaca positions:", err);
    return null;
  }
};

// --- Get Alpaca Closed Trades ---
export const getAlpacaClosedTrades = async (apiKey: string, secretKey: string) => {
  try {
    const res = await fetch("https://paper-api.alpaca.markets/v2/orders?status=closed", {
      headers: {
        "APCA-API-KEY-ID": apiKey,
        "APCA-API-SECRET-KEY": secretKey,
      },
    });

    if (!res.ok) throw new Error(`Failed to fetch closed trades: ${res.statusText}`);
    const orders = await res.json();

    // Only return orders with filled prices (ensures execution actually happened)
    return orders.filter((o: any) => o.filled_avg_price && o.filled_at);
  } catch (err) {
    console.error("❌ Error fetching Alpaca closed trades:", err);
    return [];
  }
};

// --- Get Alpaca Recent Orders ---
export const getAlpacaOrders = async (
  apiKey: string,
  secretKey: string,
  status: 'open' | 'closed' | 'all' = 'all',
  limit: number = 20
) => {
  try {
    const url = `https://paper-api.alpaca.markets/v2/orders?status=${status}&limit=${limit}&nested=true`;

    const res = await fetch(url, {
      headers: {
        "APCA-API-KEY-ID": apiKey,
        "APCA-API-SECRET-KEY": secretKey,
      },
    });

    if (!res.ok) throw new Error(`Failed to fetch orders: ${res.statusText}`);

    return await res.json();
  } catch (err) {
    console.error("❌ Error fetching Alpaca orders:", err);
    return [];
  }
};
