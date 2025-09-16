import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { useUser } from '@supabase/auth-helpers-react';
import { getUserAlpacaKeys, getAlpacaAccount, getAlpacaPositions, getAlpacaOrders } from '@/lib/alpaca';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import HighPotentialTrades from './HighPotentialTrades';
import AdvancedMarketTicker from './AdvancedMarketTicker';
import SignalGenerator from './SignalGenerator';
import ActiveTrades from './ActiveTrades';
import TradeHistory from './TradeHistory';

interface DashboardProps {
  executedTrades: any[];
}

interface AlpacaPosition {
  symbol: string;
  qty: number;
  avg_entry_price: number;
  unrealized_pl: number | string | null;
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

  // ----------------------------
  // Fetch Account Info
  // ----------------------------
  const fetchAccountInfo = async () => {
    if (!user?.id) return;
    try {
      const keys = await getUserAlpacaKeys(user.id);
      if (!keys) return;

      const account = await getAlpacaAccount(keys.api_key, keys.secret_key);

      setAccountBalance(parseFloat(account.cash) || 0);
      setTotalPnl(parseFloat(account.equity) - parseFloat(account.last_equity));
      setDailyChange(parseFloat(account.equity) - parseFloat(account.previous_close));
    } catch (err) {
      console.error('Error fetching account info:', err);
    }
  };

  // ----------------------------
  // Fetch Active Trades
  // ----------------------------
  const fetchActiveTrades = async () => {
    if (!user?.id) return;
    setActiveTradesLoading(true);
    try {
      const keys = await getUserAlpacaKeys(user.id);
      if (!keys) return;

      const alpacaPositions = await getAlpacaPositions(
        keys.api_key,
        keys.secret_key
      );
      setActiveTrades(alpacaPositions || []);
    } catch (err) {
      console.error('Error fetching active trades:', err);
      setActiveTrades([]);
    } finally {
      setActiveTradesLoading(false);
    }
  };

  // ----------------------------
  // Fetch Orders (Matches RecentOrders.tsx Logic)
  // ----------------------------
  const fetchOrders = async () => {
    if (!user?.id) return;
    setOrdersLoading(true);
    try {
      const keys = await getUserAlpacaKeys(user.id);
      if (!keys) return;

      const alpacaOrders = await getAlpacaOrders(keys.api_key, keys.secret_key);

      if (alpacaOrders && Array.isArray(alpacaOrders)) {
        setOrders(alpacaOrders.slice(0, 10));
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  // ----------------------------
  // Fetch All Data (Manual Refresh)
  // ----------------------------
  const fetchAllData = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchAccountInfo(),
      fetchActiveTrades(),
      fetchOrders(),
    ]);
    setRefreshing(false);
  };

  // Expose fetchAllData to parent via ref
  useImperativeHandle(ref, () => ({
    fetchAllData,
  }));

  // ----------------------------
  // Initial Load
  // ----------------------------
  useEffect(() => {
    fetchAccountInfo();
    fetchActiveTrades();
    fetchOrders();
  }, [user]);

  // ----------------------------
  // Refresh Orders When New Trade Is Executed
  // ----------------------------
  useEffect(() => {
    if (executedTrades && executedTrades.length > 0) {
      fetchOrders();
    }
  }, [executedTrades]);

  // ----------------------------
  // UI Helpers
  // ----------------------------
  const getPnLColor = (value: number) => {
    if (value > 0) return 'text-green-500';
    if (value < 0) return 'text-red-500';
    return 'text-gray-300';
  };

  // ----------------------------
  // Render
  // ----------------------------
  return (
    <div className="p-4 space-y-4">
      {/* Account Summary */}
      <Card className="bg-[#1a1a1a] text-white">
        <CardHeader>
          <CardTitle>Account Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Balance: ${accountBalance.toFixed(2)}</p>
          <p className={getPnLColor(totalPnl)}>PnL: {totalPnl.toFixed(2)}</p>
          <p
            className={getPnLColor(dailyChange)}
          >
            Daily Change: {dailyChange.toFixed(2)}
          </p>
        </CardContent>
      </Card>

      {/* Active Trades */}
      <Card className="bg-[#1a1a1a] text-white">
        <CardHeader>
          <CardTitle>Active Trades</CardTitle>
        </CardHeader>
        <CardContent>
          {activeTradesLoading ? (
            <p className="text-gray-400">Loading active trades...</p>
          ) : activeTrades.length === 0 ? (
            <p className="text-gray-400">No active trades</p>
          ) : (
            activeTrades.map((pos, i) => {
              const pnlValue = parseFloat(pos.unrealized_pl as any) || 0;
              return (
                <div key={i} className="border-b border-gray-700 py-1">
                  <p>
                    {pos.symbol} — {pos.qty} @ ${pos.avg_entry_price}
                  </p>
                  <p className={`${getPnLColor(pnlValue)} font-semibold`}>
                    PnL: {pnlValue >= 0 ? '+' : ''}
                    {pnlValue.toFixed(2)}
                  </p>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Recent Orders */}
      <Card className="bg-[#1a1a1a] text-white">
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <p className="text-gray-400">Loading orders...</p>
          ) : orders.length === 0 ? (
            <p className="text-gray-400">No recent orders</p>
          ) : (
            orders.map((order, i) => (
              <div key={i} className="border-b border-gray-700 py-1">
                <p>
                  {order.symbol} — {order.qty} @ ${order.limit_price || 'MKT'}
                </p>
                <p>Status: {order.status}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Tabs for Other Widgets */}
      <Tabs defaultValue="signals" className="w-full">
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="signals">Signal Generator</TabsTrigger>
          <TabsTrigger value="trades">Trade History</TabsTrigger>
          <TabsTrigger value="ticker">Market Ticker</TabsTrigger>
        </TabsList>
        <TabsContent value="signals">
          <SignalGenerator />
        </TabsContent>
        <TabsContent value="trades">
          <TradeHistory executedTrades={executedTrades} />
        </TabsContent>
        <TabsContent value="ticker">
          <AdvancedMarketTicker />
        </TabsContent>
      </Tabs>

      {/* High Potential Trades */}
      <HighPotentialTrades />
    </div>
  );
});

Dashboard.displayName = 'Dashboard';
export default Dashboard;
