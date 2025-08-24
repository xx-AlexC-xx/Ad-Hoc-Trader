import React, { useEffect, useState } from 'react';
import { useUser } from '@supabase/auth-helpers-react';
import { getUserAlpacaKeys, getAlpacaPositions } from '@/lib/alpaca';
import { supabase } from '../lib/supabase';
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
} from '@/components/ui/card';

// Optional: for graphing, you can integrate a library like Chart.js, Recharts, etc.
// Here we just show a placeholder.
const TradeGraph: React.FC<{ pnl: number }> = ({ pnl }) => {
  const barColor = pnl > 0 ? 'green' : pnl < 0 ? 'red' : 'gray';
  return (
    <div
      style={{
        height: '10px',
        width: `${Math.min(Math.abs(pnl), 100)}%`,
        backgroundColor: barColor,
        marginTop: '4px',
      }}
    />
  );
};

type Position = {
  symbol: string;
  qty: number;
  avg_entry_price: number;
  unrealized_pl: number | string | null;
};

const ActiveTrades: React.FC = () => {
  const user = useUser();
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPositions = async () => {
    if (!user?.id) return;

    try {
      const keys = await getUserAlpacaKeys(user.id);
      if (!keys) return;

      const alpacaPositions = await getAlpacaPositions(keys.api_key, keys.secret_key);

      setPositions(alpacaPositions || []);
    } catch (err) {
      console.error('Error fetching active trades:', err);
      setPositions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPositions();
    // Optional: refresh every 15 seconds
    const interval = setInterval(fetchPositions, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const getPnLColor = (value: number) => {
    if (value > 0) return 'text-green-500';
    if (value < 0) return 'text-red-500';
    return 'text-gray-300';
  };

  if (loading) {
    return <p className="text-gray-400">Loading active trades...</p>;
  }

  if (positions.length === 0) {
    return <p className="text-gray-400">No active trades</p>;
  }

  return (
    <div className="space-y-2">
      {positions.map((pos, i) => {
        const pnlValue = parseFloat(pos.unrealized_pl as any) || 0;
        return (
          <Card key={i} className="bg-[#1a1a1a] text-white p-2">
            <CardHeader>
              <CardTitle>
                {pos.symbol} — {pos.qty} @ ${pos.avg_entry_price}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`${getPnLColor(pnlValue)} font-semibold`}>
                PnL: {pnlValue >= 0 ? '+' : ''}{pnlValue.toFixed(2)}
              </p>
              <TradeGraph pnl={pnlValue} />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ActiveTrades;
