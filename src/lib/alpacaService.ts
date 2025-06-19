// Alpaca API Service for Paper Trading
const ALPACA_BASE_URL = 'https://paper-api.alpaca.markets/v2';
const ALPACA_DATA_URL = 'https://data.alpaca.markets/v2';

// Default credentials for development
const DEFAULT_API_KEY = 'PKR9NRP0Q9LWJBH47DEM';
const DEFAULT_SECRET = '5RvFzq4xH1rk6Mwh4hmsVyWF5BQP4wkn5cJFDuNE';

export interface AlpacaCredentials {
  apiKey: string;
  secret: string;
  baseUrl: string;
}

export interface AlpacaAccount {
  buying_power: string;
  cash: string;
  equity: string;
  portfolio_value: string;
}

export interface AlpacaPosition {
  symbol: string;
  qty: string;
  market_value: string;
  unrealized_pl: string;
  side: 'long' | 'short';
}

export interface AlpacaBar {
  t: string;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

export interface AlpacaActivity {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  qty: string;
  price: string;
  transaction_time: string;
  activity_type: string;
  type: string;
}

class AlpacaService {
  private credentials: AlpacaCredentials;

  constructor(credentials?: AlpacaCredentials) {
    this.credentials = credentials || {
      apiKey: DEFAULT_API_KEY,
      secret: DEFAULT_SECRET,
      baseUrl: ALPACA_BASE_URL
    };
  }

  private getHeaders() {
    return {
      'APCA-API-KEY-ID': this.credentials.apiKey,
      'APCA-API-SECRET-KEY': this.credentials.secret,
      'Content-Type': 'application/json'
    };
  }

  async getAccount(): Promise<AlpacaAccount> {
    const response = await fetch(`${this.credentials.baseUrl}/account`, {
      headers: this.getHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch account');
    return response.json();
  }

  async getPositions(): Promise<AlpacaPosition[]> {
    const response = await fetch(`${this.credentials.baseUrl}/positions`, {
      headers: this.getHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch positions');
    return response.json();
  }

  async getBars(symbol: string, timeframe: string = '1Day', limit: number = 100): Promise<AlpacaBar[]> {
    const url = `${ALPACA_DATA_URL}/stocks/${symbol}/bars?timeframe=${timeframe}&limit=${limit}`;
    const response = await fetch(url, {
      headers: {
        'APCA-API-KEY-ID': this.credentials.apiKey,
        'APCA-API-SECRET-KEY': this.credentials.secret
      }
    });
    if (!response.ok) throw new Error('Failed to fetch bars');
    const data = await response.json();
    return data.bars || [];
  }

  async getLatestQuote(symbol: string) {
    const url = `${ALPACA_DATA_URL}/stocks/${symbol}/quotes/latest`;
    const response = await fetch(url, {
      headers: {
        'APCA-API-KEY-ID': this.credentials.apiKey,
        'APCA-API-SECRET-KEY': this.credentials.secret
      }
    });
    if (!response.ok) throw new Error('Failed to fetch quote');
    const data = await response.json();
    return data.quote || {};
  }

  async getAccountActivities(limit: number = 100): Promise<AlpacaActivity[]> {
    const response = await fetch(`${this.credentials.baseUrl}/account/activities?limit=${limit}`, {
      headers: this.getHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch activities');
    return response.json();
  }

  async closePosition(symbol: string): Promise<any> {
    const response = await fetch(`${this.credentials.baseUrl}/positions/${symbol}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    if (!response.ok) throw new Error('Failed to close position');
    return response.json();
  }

  async submitOrder(order: {
    symbol: string;
    qty: number;
    side: 'buy' | 'sell';
    type: 'market' | 'limit';
    time_in_force: 'day' | 'gtc';
    limit_price?: number;
  }): Promise<any> {
    const response = await fetch(`${this.credentials.baseUrl}/orders`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(order)
    });
    if (!response.ok) throw new Error('Failed to submit order');
    return response.json();
  }
}

export const alpacaService = new AlpacaService();
export default AlpacaService;