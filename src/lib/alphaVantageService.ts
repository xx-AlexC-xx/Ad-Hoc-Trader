const ALPHA_VANTAGE_API_KEY = '0SL1MGF80JL3HSCJ';
const BASE_URL = 'https://www.alphavantage.co/query';

export interface AlphaVantageData {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TimeSeriesData {
  [key: string]: {
    '1. open': string;
    '2. high': string;
    '3. low': string;
    '4. close': string;
    '5. volume': string;
  };
}

class AlphaVantageService {
  private async fetchData(params: Record<string, string>): Promise<any> {
    const url = new URL(BASE_URL);
    Object.entries({ ...params, apikey: ALPHA_VANTAGE_API_KEY }).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  async getIntradayData(symbol: string, interval: '1min' | '5min' | '15min' | '30min' | '60min' = '5min'): Promise<AlphaVantageData[]> {
    const data = await this.fetchData({
      function: 'TIME_SERIES_INTRADAY',
      symbol,
      interval,
      outputsize: 'compact'
    });

    const timeSeries = data[`Time Series (${interval})`];
    if (!timeSeries) return [];

    return Object.entries(timeSeries).map(([timestamp, values]: [string, any]) => ({
      timestamp,
      open: parseFloat(values['1. open']),
      high: parseFloat(values['2. high']),
      low: parseFloat(values['3. low']),
      close: parseFloat(values['4. close']),
      volume: parseInt(values['5. volume'])
    })).reverse();
  }

  async getDailyData(symbol: string): Promise<AlphaVantageData[]> {
    const data = await this.fetchData({
      function: 'TIME_SERIES_DAILY',
      symbol,
      outputsize: 'compact'
    });

    const timeSeries = data['Time Series (Daily)'];
    if (!timeSeries) return [];

    return Object.entries(timeSeries).map(([timestamp, values]: [string, any]) => ({
      timestamp,
      open: parseFloat(values['1. open']),
      high: parseFloat(values['2. high']),
      low: parseFloat(values['3. low']),
      close: parseFloat(values['4. close']),
      volume: parseInt(values['5. volume'])
    })).reverse();
  }

  async getWeeklyData(symbol: string): Promise<AlphaVantageData[]> {
    const data = await this.fetchData({
      function: 'TIME_SERIES_WEEKLY',
      symbol
    });

    const timeSeries = data['Weekly Time Series'];
    if (!timeSeries) return [];

    return Object.entries(timeSeries).map(([timestamp, values]: [string, any]) => ({
      timestamp,
      open: parseFloat(values['1. open']),
      high: parseFloat(values['2. high']),
      low: parseFloat(values['3. low']),
      close: parseFloat(values['4. close']),
      volume: parseInt(values['5. volume'])
    })).reverse();
  }

  async getMonthlyData(symbol: string): Promise<AlphaVantageData[]> {
    const data = await this.fetchData({
      function: 'TIME_SERIES_MONTHLY',
      symbol
    });

    const timeSeries = data['Monthly Time Series'];
    if (!timeSeries) return [];

    return Object.entries(timeSeries).map(([timestamp, values]: [string, any]) => ({
      timestamp,
      open: parseFloat(values['1. open']),
      high: parseFloat(values['2. high']),
      low: parseFloat(values['3. low']),
      close: parseFloat(values['4. close']),
      volume: parseInt(values['5. volume'])
    })).reverse();
  }
}

export default new AlphaVantageService();