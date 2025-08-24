import React, { useEffect, useState } from 'react';
import {
  Card, CardContent, CardHeader, CardTitle,
  Badge, Button, Checkbox,
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui';
import { useAppContext } from '@/contexts/AppContext';
import { supabase } from '@/lib/supabase';

interface HighPotentialTrade {
  symbol: string;
  entryPrice: number;
  exitPrice: number;
  stopLoss: number;
  expiration: string;
  strikePrice: number;
  riskRewardRatio: string;
  projectedGain: number;
  category?: string;
}

interface HighPotentialTradesProps {
  onSymbolsUpdate: (symbols: string[]) => void;
  onTradesSelected: (trades: HighPotentialTrade[]) => void;
}

const HighPotentialTrades: React.FC<HighPotentialTradesProps> = ({ onSymbolsUpdate, onTradesSelected }) => {
  const { user } = useAppContext();
  const [trades, setTrades] = useState<HighPotentialTrade[]>([]);
  const [selectedTrades, setSelectedTrades] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Fetch user Alpaca API keys from Supabase
  const fetchCredentials = async () => {
    if (!user?.id) throw new Error("User not authenticated");
    const { data, error } = await supabase
      .from('user_alpaca_credentials')
      .select('api_key, secret_key')
      .eq('user_id', user.id)
      .single();
    if (error) throw new Error(error.message);
    return data;
  };

  // Fetch latest quote price for each symbol live from Alpaca Data API
  const fetchAlpacaData = async (symbols: string[], apiKey: string, apiSecret: string) => {
    const headers = {
      'APCA-API-KEY-ID': apiKey,
      'APCA-API-SECRET-KEY': apiSecret,
    };

    const fetched: HighPotentialTrade[] = [];

    for (const symbol of symbols) {
      try {
        const res = await fetch(`https://data.alpaca.markets/v2/stocks/${symbol}/quotes/latest`, { headers });
        if (!res.ok) {
          console.warn(`Failed to fetch quote for ${symbol}: ${res.statusText}`);
          continue;
        }
        const json = await res.json();
        const price = json?.quote?.ap;

        if (typeof price !== 'number' || price <= 0) {
          console.warn(`Invalid price data for ${symbol}`);
          continue;
        }

        const entry = price;
        const exit = entry * 1.1;
        const stop = entry * 0.95;

        fetched.push({
          symbol,
          entryPrice: entry,
          exitPrice: exit,
          stopLoss: stop,
          expiration: new Date(Date.now() + 7 * 864e5).toISOString().split('T')[0],
          strikePrice: entry + 5,
          riskRewardRatio: '1:2',
          projectedGain: 10,
          category: 'Runner',
        });
      } catch (err) {
        console.error(`Error fetching data for ${symbol}`, err);
      }
    }

    return fetched;
  };

  // Refresh trades on demand or on user change
  const refreshTrades = async () => {
    try {
      setLoading(true);
      const creds = await fetchCredentials();

      // TODO: Consider making symbols dynamic or user-configurable
      const symbols = ['AAPL', 'TSLA', 'MSFT', 'NVDA', 'AMD'];

      const liveTrades = await fetchAlpacaData(symbols, creds.api_key, creds.secret_key);

      setTrades(liveTrades);
      onSymbolsUpdate(symbols);
      setSelectedTrades(new Set());
    } catch (err) {
      console.error('Error fetching trades:', err);
      setTrades([]);
      setSelectedTrades(new Set());
    } finally {
      setLoading(false);
    }
  };

  // Place live market buy orders for selected trades
  const placeOrders = async (selected: HighPotentialTrade[]) => {
    try {
      const creds = await fetchCredentials();

      const headers = {
        'APCA-API-KEY-ID': creds.api_key,
        'APCA-API-SECRET-KEY': creds.secret_key,
        'Content-Type': 'application/json',
      };

      for (const trade of selected) {
        const res = await fetch(`https://paper-api.alpaca.markets/v2/orders`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            symbol: trade.symbol,
            qty: 1,
            side: 'buy',
            type: 'market',
            time_in_force: 'gtc',
          }),
        });

        if (!res.ok) {
          console.error(`Failed to place order for ${trade.symbol}: ${res.statusText}`);
        }
      }
    } catch (err) {
      console.error('Error placing orders:', err);
    }
  };

  // Confirm and execute orders for selected trades
  const confirmTrades = async () => {
    const selected = trades.filter(t => selectedTrades.has(t.symbol));
    onTradesSelected(selected);
    await placeOrders(selected);
    setSelectedTrades(new Set());
    setShowConfirmDialog(false);
  };

  // Toggle single trade selection
  const handleTradeSelection = (symbol: string, checked: boolean) => {
    const updated = new Set(selectedTrades);
    if (checked) updated.add(symbol);
    else updated.delete(symbol);
    setSelectedTrades(updated);
  };

  // Toggle select all trades
  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelectedTrades(new Set(trades.map(t => t.symbol)));
    else setSelectedTrades(new Set());
  };

  useEffect(() => {
    if (user?.id) refreshTrades();
  }, [user]);

  return (
    <>
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex justify-between">
            <span>📈 High Potential Trades (Live)</span>
            <Button size="sm" onClick={refreshTrades} disabled={loading}>
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {trades.length === 0 ? (
            <div className="text-gray-400 py-8 text-center">No trades found.</div>
          ) : (
            <>
              <div className="flex items-center mb-4">
                <Checkbox
                  checked={selectedTrades.size === trades.length}
                  onCheckedChange={handleSelectAll}
                />
                <span className="ml-2 text-sm text-gray-300">Select All</span>
              </div>
              <div className="space-y-3">
                {trades.map((trade, i) => (
                  <div key={`${trade.symbol}-${i}`} className="bg-gray-800 p-4 rounded">
                    <div className="flex justify-between">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={selectedTrades.has(trade.symbol)}
                          onCheckedChange={(c) => handleTradeSelection(trade.symbol, c as boolean)}
                        />
                        <Badge className="bg-blue-600">{trade.symbol}</Badge>
                        <Badge className="bg-green-600">{trade.category}</Badge>
                      </div>
                      <div className="text-green-400 font-semibold">+{trade.projectedGain}%</div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 text-sm text-gray-300">
                      <div>Strike: ${trade.strikePrice.toFixed(2)}</div>
                      <div>Entry: ${trade.entryPrice.toFixed(2)}</div>
                      <div>Exit: ${trade.exitPrice.toFixed(2)}</div>
                      <div>Stop: ${trade.stopLoss.toFixed(2)}</div>
                      <div>Exp: {trade.expiration}</div>
                      <div>R/R: {trade.riskRewardRatio}</div>
                    </div>
                  </div>
                ))}
              </div>
              {selectedTrades.size > 0 && (
                <div className="mt-4">
                  <Button
                    onClick={() => setShowConfirmDialog(true)}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    Make Trades ({selectedTrades.size})
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="bg-gray-900">
          <DialogHeader>
            <DialogTitle className="text-white">Confirm Auto Trades</DialogTitle>
          </DialogHeader>
          <p className="text-gray-300">
            You're about to auto-execute {selectedTrades.size} trade(s). Continue?
          </p>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" className="flex-1" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button className="flex-1 bg-green-600" onClick={confirmTrades}>
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default HighPotentialTrades;
