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
import { getUserAlpacaKeys, getAlpacaPositions } from '@/lib/alpaca';
import BuySellModule from './BuySellModule';

const Dashboard: React.FC = () => {
  const { trades, loading } = useTradeDatabase();
  const [accountBalance, setAccountBalance] = useState(0);
  const [totalPnl, setTotalPnl] = useState(0);
  const [dailyChange, setDailyChange] = useState(0);
  const [positions, setPositions] = useState<any[]>([]);
  const [loadingPositions, setLoadingPositions] = useState(true);
  const user = useUser();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAccountAndPositions = async () => {
    if (!user?.id) return;
    setIsRefreshing(true);
    try {
      const keys = await getUserAlpacaKeys(user.id);
      if (!keys) return;

      const alpacaPositions = await getAlpacaPositions(keys.api_key, keys.secret_key);
      setPositions(alpacaPositions || []);

      // Calculate totals
      const cash = Number(alpacaPositions?.cash ?? 0);
      const totalUnrealized = alpacaPositions?.reduce((sum: number, pos: any) => {
        return sum + Number(pos.unrealized_pl ?? 0);
      }, 0) ?? 0;

      const dailyUnrealized = alpacaPositions?.reduce((sum: number, pos: any) => {
        return sum + Number(pos.unrealized_intraday_pl ?? 0);
      }, 0) ?? 0;

      setAccountBalance(cash);
      setTotalPnl(totalUnrealized);
      setDailyChange(dailyUnrealized);
    } catch (err) {
      console.error('Error fetching Alpaca positions:', err);
    } finally {
      setLoadingPositions(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAccountAndPositions();
    const interval = setInterval(fetchAccountAndPositions, 15000); // Refresh every 15 seconds
    return () => clearInterval(interval);
  }, [user]);

  const activeTrades = positions.filter((t) => t.qty > 0);

  const getPnLColor = (value: number) => {
    if (value > 0) return 'text-green-500';
    if (value < 0) return 'text-red-500';
    return 'text-gray-300';
  };

  const handleSymbolsUpdate = (symbols: string[]) => {
    console.log("Symbols updated:", symbols);
  };

  const handleTradesSelected = (trades: any[]) => {
    console.log("Trades selected:", trades);
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">Trading Dashboard</h1>

        {/* Top row + Buy/Sell module */}
        <div className="flex gap-4 mb-6">
          {/* Dashboard Cards */}
          <div className="flex flex-col gap-4">
            <div className="flex gap-4">
              <Card className={`bg-gray-800 border-gray-700 w-64 ${isRefreshing ? 'animate-pulse' : ''}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-gray-300 text-sm">Account Balance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-400">
                    ${accountBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-gray-400">Available for trading</p>
                </CardContent>
              </Card>

              <Card className={`bg-gray-800 border-gray-700 w-64 ${isRefreshing ? 'animate-pulse' : ''}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-gray-300 text-sm">Total P&L</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${getPnLColor(totalPnl)}`}>
                    {totalPnl >= 0 ? '+' : ''}{totalPnl.toFixed(2)}
                  </div>
                  <p className="text-xs text-gray-400">Realized + Unrealized</p>
                </CardContent>
              </Card>

              <Card className={`bg-gray-800 border-gray-700 w-64 ${isRefreshing ? 'animate-pulse' : ''}`}>
                <CardHeader className="pb-2">
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
            <div className="grid grid-cols-1 gap-4 max-w-2xl">
              <Card className={`bg-gray-800 border-gray-700 col-span-1 ${isRefreshing ? 'animate-pulse' : ''}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-gray-300 text-sm">Active Trades</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingPositions ? (
                    <p className="text-gray-400">Loading active trades...</p>
                  ) : activeTrades.length === 0 ? (
                    <p className="text-gray-400">No active trades</p>
                  ) : (
                    <ul className="space-y-1">
                      {activeTrades.map((trade, i) => {
                        const pnlValue = Number(trade.unrealized_pl ?? 0);
                        return (
                          <li key={i} className={`${getPnLColor(pnlValue)} font-semibold`}>
                            {trade.symbol} ({trade.qty} shares): {pnlValue >= 0 ? '+' : ''}{pnlValue.toFixed(2)}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Buy/Sell module */}
          <div className="flex-1">
            <div className="h-full max-h-[calc(2*theme(spacing.32))] text-sm">
              <BuySellModule
                setLastOrderResponse={() => {}}
                fetchAccountAndPositions={fetchAccountAndPositions}
                fetchSymbols={async () => {}}
              />
            </div>
          </div>
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
              onSymbolsUpdate={handleSymbolsUpdate}
              onTradesSelected={handleTradesSelected}
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
