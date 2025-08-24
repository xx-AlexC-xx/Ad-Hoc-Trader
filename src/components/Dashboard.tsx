import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import HighPotentialTrades from './HighPotentialTrades';
import AdvancedMarketTicker from './AdvancedMarketTicker';
import SignalGenerator from './SignalGenerator';
import ActiveTrades from './ActiveTrades';
import TradeHistory from './TradeHistory';
import { useTradeDatabase } from '@/hooks/useTradeDatabase';
import { useUser } from '@supabase/auth-helpers-react';
import { getUserAlpacaKeys, getAlpacaAccount, getAlpacaPositions } from '@/lib/alpaca';
import { RefreshCw } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { trades, loading } = useTradeDatabase();
  const [accountBalance, setAccountBalance] = useState(0);
  const [totalPnl, setTotalPnl] = useState(0);
  const [dailyChange, setDailyChange] = useState(0);
  const [positions, setPositions] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const user = useUser();

  const fetchAllData = async () => {
    if (!user?.id) return;
    setRefreshing(true);

    try {
      const keys = await getUserAlpacaKeys(user.id);
      if (!keys) return;

      // Account Balance
      const account = await getAlpacaAccount(keys.api_key, keys.secret_key);
      setAccountBalance(Number(account.cash ?? 0));

      // Positions for P&L, Daily Change, Active Trades
      const alpacaPositions = await getAlpacaPositions(keys.api_key, keys.secret_key);
      setPositions(alpacaPositions || []);

      // Compute total PnL and daily change
      const totalPl = (alpacaPositions || []).reduce((sum: number, pos: any) => sum + Number(pos.unrealized_pl ?? 0), 0);
      const dailyPl = (alpacaPositions || []).reduce((sum: number, pos: any) => sum + Number(pos.unrealized_intraday_pl ?? 0), 0);

      setTotalPnl(totalPl);
      setDailyChange(dailyPl);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setPositions([]);
      setTotalPnl(0);
      setDailyChange(0);
      setAccountBalance(0);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 15000); // Auto refresh every 15 seconds
    return () => clearInterval(interval);
  }, [user]);

  const getPnLColor = (value: number) => {
    if (value > 0) return 'text-green-500';
    if (value < 0) return 'text-red-500';
    return 'text-gray-300';
  };

  const activeTrades = positions.filter((p) => Number(p.qty ?? 0) > 0);

  // Shimmer/loading effect class
  const shimmerClass = refreshing ? 'animate-pulse bg-gray-700/50' : '';

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">Trading Dashboard</h1>
          <button
            onClick={fetchAllData}
            disabled={refreshing}
            className={`flex items-center gap-2 px-3 py-1 bg-gray-800 border border-gray-700 rounded hover:bg-gray-700 transition`}
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="text-white text-sm">Refresh</span>
          </button>
        </div>

        {/* Top row: Account, P&L, Daily Change */}
        <div className="flex gap-4 mb-6 max-w-2xl">
          <Card className={`bg-gray-800 border-gray-700 w-64 ${shimmerClass}`}>
            <CardHeader className="pb-2 flex justify-between items-center">
              <CardTitle className="text-gray-300 text-sm">Account Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">
              ${accountBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-gray-400">Available for trading</p>
            </CardContent>
          </Card>

          <Card className={`bg-gray-800 border-gray-700 w-64 ${shimmerClass}`}>
            <CardHeader className="pb-2 flex justify-between items-center">
              <CardTitle className="text-gray-300 text-sm">Total P&L</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getPnLColor(totalPnl)}`}>
                {totalPnl >= 0 ? '+' : ''}{totalPnl.toFixed(2)}
              </div>
              <p className="text-xs text-gray-400">Realized + Unrealized</p>
            </CardContent>
          </Card>

          <Card className={`bg-gray-800 border-gray-700 w-64 ${shimmerClass}`}>
            <CardHeader className="pb-2 flex justify-between items-center">
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

        {/* Second row: Active Trades card */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className={`bg-gray-800 border-gray-700 col-span-1 ${shimmerClass}`}>
            <CardHeader className="pb-2 flex justify-between items-center">
              <CardTitle className="text-gray-300 text-sm">Active Trades</CardTitle>
            </CardHeader>
            <CardContent>
              {activeTrades.length === 0 ? (
                <p className="text-gray-400">No active trades</p>
              ) : (
                <ul className="space-y-1">
                  {activeTrades.map((pos, i) => {
                    const pnlValue = Number(pos.unrealized_pl ?? 0);
                    return (
                      <li key={i} className={`${getPnLColor(pnlValue)} font-semibold`}>
                        {pos.symbol} ({pos.qty}): {pnlValue >= 0 ? '+' : ''}{pnlValue.toFixed(2)}
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Placeholder for future integration */}
          <div className="col-span-1"></div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="signals" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-gray-800">
            <TabsTrigger value="signals" className="text-white">Signal Generator</TabsTrigger>
            <TabsTrigger value="potential" className="text-white">High Potential</TabsTrigger>
            <TabsTrigger value="ticker" className="text-white">Live Ticker</TabsTrigger>
            <TabsTrigger value="active" className="text-white">Active Trades</TabsTrigger>
            <TabsTrigger value="history" className="text-white">History</TabsTrigger>
          </TabsList>

          <TabsContent value="signals">
            <SignalGenerator />
          </TabsContent>

          <TabsContent value="potential">
            <HighPotentialTrades 
              onSymbolsUpdate={() => {}}
              onTradesSelected={() => {}}
            />
          </TabsContent>

          <TabsContent value="ticker">
            <AdvancedMarketTicker />
          </TabsContent>

          <TabsContent value="active">
            <ActiveTrades />
          </TabsContent>

          <TabsContent value="history">
            <TradeHistory />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
