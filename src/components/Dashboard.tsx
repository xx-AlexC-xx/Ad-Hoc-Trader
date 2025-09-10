import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import HighPotentialTrades from './HighPotentialTrades';
import AdvancedMarketTicker from './AdvancedMarketTicker';
import SignalGenerator from './SignalGenerator';
import ActiveTrades from './ActiveTrades';
import TradeHistory from './TradeHistory';
import BuySellModule from './BuySellModule';
import { useUser } from '@supabase/auth-helpers-react';
import { getUserAlpacaKeys, getAlpacaAccount, getAlpacaPositions } from '@/lib/alpaca';
import { Button } from '@/components/ui/button';
import SymbolListModal from './SymbolListModal';
import { supabase } from '@/lib/supabase';

// ------------------------
// Explicit type for Alpaca positions
// ------------------------
type AlpacaPosition = {
  symbol: string;
  qty: number;
  avg_entry_price: number;
  unrealized_pl: number | string | null;
};

interface DashboardProps {
  executedTrades?: any[];
}

const Dashboard = forwardRef<any, DashboardProps>(({ executedTrades }, ref) => {
  const user = useUser();

  const [accountBalance, setAccountBalance] = useState(0);
  const [totalPnl, setTotalPnl] = useState(0);
  const [dailyChange, setDailyChange] = useState(0);
  const [positions, setPositions] = useState<AlpacaPosition[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const [activeTrades, setActiveTrades] = useState<AlpacaPosition[]>([]);
  const [activeTradesLoading, setActiveTradesLoading] = useState(true);

  const [symbolModalOpen, setSymbolModalOpen] = useState(false);
  const [symbols, setSymbols] = useState<any[]>([]);

  // ------------------------
  // Fetch account balance / P&L / daily change directly from Alpaca
  // ------------------------
  const fetchAccountInfo = async () => {
    if (!user?.id) return;
    setRefreshing(true);

    try {
      const keys = await getUserAlpacaKeys(user.id);
      if (!keys) return;

      const account = await getAlpacaAccount(keys.api_key, keys.secret_key);

      setAccountBalance(Number(account.cash ?? 0));
      setTotalPnl(Number(account.equity ?? 0) - Number(account.last_equity ?? 0));
      setDailyChange(Number(account.equity ?? 0) - Number(account.last_equity ?? 0));
    } catch (err) {
      console.error('Error fetching Alpaca account info:', err);
      setAccountBalance(0);
      setTotalPnl(0);
      setDailyChange(0);
    } finally {
      setRefreshing(false);
    }
  };

  // ------------------------
  // Fetch active trades for dashboard card
  // ------------------------
  const fetchActiveTrades = async () => {
    if (!user?.id) return;
    setActiveTradesLoading(true);

    try {
      const keys = await getUserAlpacaKeys(user.id);
      if (!keys) return;

      const positions: AlpacaPosition[] = await getAlpacaPositions(keys.api_key, keys.secret_key);
      const filtered: AlpacaPosition[] = positions.filter((p: AlpacaPosition) => Number(p.qty ?? 0) > 0);
      setActiveTrades(filtered);
    } catch (err) {
      console.error('Error fetching active trades for dashboard:', err);
      setActiveTrades([]);
    } finally {
      setActiveTradesLoading(false);
    }
  };

  // ------------------------
  // Fetch orders (for Orders widget)
  // ------------------------
  const fetchOrders = async () => {
    if (!user?.id) return;
    setOrdersLoading(true);

    try {
      const response = await fetch(`/api/syncOrders?userId=${user.id}`);
      const data = await response.json();
      setOrders(data.orders || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  // ------------------------
  // Manual refresh button
  // ------------------------
  const fetchAllData = async () => {
    await Promise.all([fetchAccountInfo(), fetchActiveTrades(), fetchOrders()]);
  };

  useImperativeHandle(ref, () => ({
    fetchAllData
  }));

  const getPnLColor = (value: number) => {
    if (value > 0) return 'text-green-500';
    if (value < 0) return 'text-red-500';
    return 'text-gray-300';
  };

  const shimmerClass = refreshing ? 'animate-pulse bg-gray-700/50' : '';

  // ------------------------
  // Initial load: fetch each card separately
  // ------------------------
  useEffect(() => {
    fetchAccountInfo();
    fetchActiveTrades();
    fetchOrders();
  }, [user]);

  return (
    <div className="min-h-screen bg-[#1a1a1a] p-6">
      <div className="max-w-7xl mx-auto flex gap-3 items-start">
        {/* Left column */}
        <div className="flex flex-col gap-3">
          {/* Top row cards */}
          <div className="flex gap-2 mb-2">
            <Card className={`bg-[#1a1a1a] border-gray-700 w-64 ${shimmerClass}`}>
              <CardHeader className="pb-1 flex justify-between items-center">
                <CardTitle className="text-gray-300 text-sm">Account Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-400">
                  ${accountBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-gray-400">Available for trading</p>
              </CardContent>
            </Card>

            <Card className={`bg-[#1a1a1a] border-gray-700 w-64 ${shimmerClass}`}>
              <CardHeader className="pb-1 flex justify-between items-center">
                <CardTitle className="text-gray-300 text-sm">Total P&L</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getPnLColor(totalPnl)}`}>
                  {totalPnl >= 0 ? '+' : ''}{totalPnl.toFixed(2)}
                </div>
                <p className="text-xs text-gray-400">Realized + Unrealized</p>
              </CardContent>
            </Card>

            <Card className={`bg-[#1a1a1a] border-gray-700 w-64 ${shimmerClass}`}>
              <CardHeader className="pb-1 flex justify-between items-center">
                <CardTitle className="text-gray-300 text-sm">Daily Change</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getPnLColor(dailyChange)}`}>
                  {dailyChange >= 0 ? '+' : ''}{dailyChange.toFixed(6)}
                </div>
                <p className="text-xs text-gray-400">Today’s P&L</p>
              </CardContent>
            </Card>
          </div>

          {/* Active Trades card */}
          <Card className={`bg-[#1a1a1a] border-gray-700 w-[48rem]`}>
            <CardHeader className="pb-1 flex justify-between items-center">
              <CardTitle className="text-gray-300 text-sm">Active Trades</CardTitle>
            </CardHeader>
            <CardContent className="max-h-36 overflow-y-auto">
              {activeTradesLoading ? (
                <p className="text-gray-400">Loading active trades...</p>
              ) : activeTrades.length === 0 ? (
                <p className="text-gray-400">No active trades</p>
              ) : (
                <ul className="space-y-1">
                  {activeTrades.map((pos: AlpacaPosition, i: number) => {
                    const pnlValue = parseFloat(pos.unrealized_pl as any) || 0;
                    const pnlColor = pnlValue > 0 ? 'text-green-500' : pnlValue < 0 ? 'text-red-500' : 'text-gray-300';

                    return (
                      <li key={i} className="flex text-sm text-white">
                        <div className="w-1/3 text-left">{pos.symbol}</div>
                        <div className="w-1/3 text-center">{pos.qty}</div>
                        <div className={`w-1/3 text-right font-semibold ${pnlColor}`}>
                          {pnlValue >= 0 ? '+' : ''}{pnlValue.toFixed(2)}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Orders card */}
          <Card className={`bg-[#1a1a1a] border-gray-700 w-[48rem] h-36`}>
            <CardHeader className="pb-1 flex justify-between items-center">
              <CardTitle className="text-gray-300 text-sm">Orders</CardTitle>
            </CardHeader>
            <CardContent className="max-h-36 overflow-y-auto">
              {ordersLoading ? (
                <p className="text-gray-500">Syncing orders...</p>
              ) : orders.length === 0 ? (
                <p className="text-gray-400">No orders yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm border">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-2 border text-left">Symbol</th>
                        <th className="p-2 border text-left">Type</th>
                        <th className="p-2 border text-left">Side</th>
                        <th className="p-2 border text-left">Qty</th>
                        <th className="p-2 border text-left">Filled</th>
                        <th className="p-2 border text-left">Avg Fill</th>
                        <th className="p-2 border text-left">Status</th>
                        <th className="p-2 border text-left">Submitted</th>
                        <th className="p-2 border text-left">Filled At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((o: any) => (
                        <tr key={o.alpaca_order_id} className="hover:bg-gray-50 text-white text-xs">
                          <td className="p-2 border font-semibold">{o.symbol}</td>
                          <td className="p-2 border">{o.type}</td>
                          <td className={`p-2 border font-semibold ${o.side === 'buy' ? 'text-green-600' : 'text-red-600'}`}>
                            {o.side.toUpperCase()}
                          </td>
                          <td className="p-2 border">{o.qty}</td>
                          <td className="p-2 border">{o.filled_qty}</td>
                          <td className="p-2 border">{o.avg_fill_price}</td>
                          <td className="p-2 border">{o.status}</td>
                          <td className="p-2 border">{new Date(o.submitted_at).toLocaleDateString()}</td>
                          <td className="p-2 border">{o.filled_at ? new Date(o.filled_at).toLocaleDateString() : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tabs */}
          <div className="w-full mt-2">
            <Tabs defaultValue="signals" className="space-y-2">
              <TabsList className="inline-flex space-x-2 bg-[#1a1a1a] px-2 py-1 rounded-lg w-full">
                <TabsTrigger value="signals" className="text-white">Signal Generator</TabsTrigger>
                <TabsTrigger value="potential" className="text-white">High Potential</TabsTrigger>
                <TabsTrigger value="ticker" className="text-white">Live Ticker</TabsTrigger>
                <TabsTrigger value="active" className="text-white">Active Trades</TabsTrigger>
                <TabsTrigger value="history" className="text-white">Trade History</TabsTrigger>
              </TabsList>

              <TabsContent value="signals"><SignalGenerator /></TabsContent>
              <TabsContent value="potential"><HighPotentialTrades onSymbolsUpdate={() => {}} onTradesSelected={() => {}} /></TabsContent>
              <TabsContent value="ticker"><AdvancedMarketTicker /></TabsContent>
              <TabsContent value="active"><ActiveTrades /></TabsContent>
              <TabsContent value="history"><TradeHistory /></TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Right column */}
        <div className="flex-shrink-0 w-80 flex flex-col gap-2">
          <Button
            className="mb-2 bg-gray-700 hover:bg-gray-600 text-white w-full"
            onClick={async () => {
              try {
                const res = await fetch("/api/get-symbols");
                const data = await res.json();
                setSymbols(data.symbols || []);
                setSymbolModalOpen(true);
              } catch (err) {
                console.error("Failed to fetch symbols:", err);
              }
            }}
          >
            List of Symbols
          </Button>

          <Card className="bg-[#1a1a1a] border-gray-700 w-full">
            <CardHeader className="pb-1">
              <CardTitle className="text-gray-300 text-sm">Buy / Sell</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <BuySellModule
                fetchAccountAndPositions={fetchAllData}
                fetchSymbols={async () => {}}
                setLastOrderResponse={() => {}}
              />
            </CardContent>
          </Card>

          {symbolModalOpen && (
            <SymbolListModal symbols={symbols} onClose={() => setSymbolModalOpen(false)} />
          )}
        </div>
      </div>
    </div>
  );
});

export default Dashboard;
