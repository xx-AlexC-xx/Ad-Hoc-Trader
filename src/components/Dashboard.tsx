import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import HighPotentialTrades from './HighPotentialTrades';
import AdvancedMarketTicker from './AdvancedMarketTicker';
import SignalGenerator from './SignalGenerator';
import ActiveTrades from './ActiveTrades';
import TradeHistory from './TradeHistory';
import BuySellModule from './BuySellModule';
import { useTradeDatabase } from '@/hooks/useTradeDatabase';
import { useUser } from '@supabase/auth-helpers-react';
import { getUserAlpacaKeys, getAlpacaAccount, getAlpacaPositions } from '@/lib/alpaca';

interface DashboardProps {
  executedTrades?: any[];
}

const Dashboard: React.FC<DashboardProps> = ({ executedTrades }) => {
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

      const account = await getAlpacaAccount(keys.api_key, keys.secret_key);
      setAccountBalance(Number(account.cash ?? 0));

      const alpacaPositions = await getAlpacaPositions(keys.api_key, keys.secret_key);
      setPositions(alpacaPositions || []);

      const totalPl = (alpacaPositions || []).reduce(
        (sum: number, pos: any) => sum + Number(pos.unrealized_pl ?? 0),
        0
      );
      const dailyPl = (alpacaPositions || []).reduce(
        (sum: number, pos: any) => sum + Number(pos.unrealized_intraday_pl ?? 0),
        0
      );

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
    const interval = setInterval(fetchAllData, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const getPnLColor = (value: number) => {
    if (value > 0) return 'text-green-500';
    if (value < 0) return 'text-red-500';
    return 'text-gray-300';
  };

  const shimmerClass = refreshing ? 'animate-pulse bg-gray-700/50' : '';
  const activeTrades = positions.filter((p) => Number(p.qty ?? 0) > 0);

  return (
    <div className="min-h-screen bg-[#1a1a1a] p-6">
      <div className="max-w-7xl mx-auto flex gap-6 items-start">
        {/* Left column: All dashboard cards */}
        <div className="flex flex-col gap-6">
          {/* Top row: 3 cards */}
          <div className="flex gap-4 mb-6">
            <Card className={`bg-[#1a1a1a] border-gray-700 w-64 ${shimmerClass}`}>
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

            <Card className={`bg-[#1a1a1a] border-gray-700 w-64 ${shimmerClass}`}>
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

            <Card className={`bg-[#1a1a1a] border-gray-700 w-64 ${shimmerClass}`}>
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

          {/* Active Trades, Orders, Tabs (moved directly under top row) */}
          <div className="flex flex-col gap-6">
            {/* Active Trades */}
            <Card className={`bg-[#1a1a1a] border-gray-700 w-[48rem] ${shimmerClass}`}>
              <CardHeader className="pb-2 flex justify-between items-center">
                <CardTitle className="text-gray-300 text-sm">Active Trades</CardTitle>
              </CardHeader>
              <CardContent className="max-h-40 overflow-y-auto">
                {activeTrades.length === 0 ? (
                  <p className="text-gray-400">No active trades</p>
                ) : (
                  <ul className="space-y-1">
                    {activeTrades.map((pos, i) => {
                      const pnlValue = Number(pos.unrealized_pl ?? 0);
                      return (
                        <li key={i} className="flex text-sm text-white">
                          <div className="w-1/3 text-left">{pos.symbol}</div>
                          <div className="w-1/3 text-center">{pos.qty}</div>
                          <div className={`w-1/3 text-right ${getPnLColor(pnlValue)} font-semibold`}>
                            {pnlValue >= 0 ? '+' : ''}{pnlValue.toFixed(2)}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* Orders */}
            <Card className={`bg-[#1a1a1a] border-gray-700 w-[48rem] ${shimmerClass}`}>
              <CardHeader className="pb-2 flex justify-between items-center">
                <CardTitle className="text-gray-300 text-sm">Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">No orders yet</p>
              </CardContent>
            </Card>

            {/* Tabs */}
            <div className="w-[48rem]">
              <Tabs defaultValue="signals" className="space-y-6">
                <TabsList className="inline-flex space-x-2 bg-[#1a1a1a] px-2 py-1 rounded-lg w-[max-content]">
                  <TabsTrigger value="signals" className="text-white">Signal Generator</TabsTrigger>
                  <TabsTrigger value="potential" className="text-white">High Potential</TabsTrigger>
                  <TabsTrigger value="ticker" className="text-white">Live Ticker</TabsTrigger>
                  <TabsTrigger value="active" className="text-white">Active Trades</TabsTrigger>
                  <TabsTrigger value="history" className="text-white">Trade History</TabsTrigger>
                </TabsList>

                <TabsContent value="signals">
                  <SignalGenerator />
                </TabsContent>
                <TabsContent value="potential">
                  <HighPotentialTrades onSymbolsUpdate={() => {}} onTradesSelected={() => {}} />
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
        </div>

        {/* Right column: Buy/Sell Module */}
        <div className="flex-shrink-0 w-80">
          <BuySellModule
            fetchAccountAndPositions={fetchAllData}
            fetchSymbols={async () => {}}
            setLastOrderResponse={() => {}}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
