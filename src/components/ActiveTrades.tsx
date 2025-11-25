import React from 'react';
import { createPortal } from 'react-dom';
import { useAppContext } from '@/contexts/AppContext';
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
} from '@/components/ui/card';

interface ActiveTradesProps {
  cardId?: string;
  locked?: boolean;
  onLockToggle?: (cardId: string, locked: boolean) => void;
}

const TradeGraph: React.FC<{ pnl: number }> = ({ pnl }) => {
  const barColor = pnl > 0 ? '#20c997' : pnl < 0 ? '#ff00ff' : 'gray'; // Teal green / Magenta
  return (
    <div
      style={{
        height: '5px',
        width: `${Math.min(Math.abs(pnl), 100)}%`,
        backgroundColor: barColor,
        marginTop: '2px',
      }}
    />
  );
};

const ActiveTrades: React.FC<ActiveTradesProps> = ({
  cardId = 'activeTrades',
  locked = false,
  onLockToggle,
}) => {
  const { positions } = useAppContext();

  const [openDialogSymbol, setOpenDialogSymbol] = React.useState<string | null>(null);
  const [isLocked, setIsLocked] = React.useState<boolean>(locked);
  const [fadeState, setFadeState] = React.useState<'in' | 'out' | null>(null);

  const getPnLColor = (value: number) => {
    if (value > 0) return 'text-teal-400'; // Tailwind teal green
    if (value < 0) return 'text-magenta-500'; // Magenta (needs custom Tailwind color if not default)
    return 'text-gray-300';
  };

  if (!positions || positions.length === 0) {
    return <p className="text-gray-400 text-xs">No active trades</p>;
  }

  const safeNumber = (val: any, fallback = 0): number => {
    const num = parseFloat(val);
    return isNaN(num) ? fallback : num;
  };

  const handleLockToggle = () => {
    const newLockState = !isLocked;
    setIsLocked(newLockState);
    if (onLockToggle) onLockToggle(cardId, newLockState);
  };

  const handleDetailsClick = (symbol: string) => {
    setOpenDialogSymbol(symbol);
    setFadeState('in');
  };

  const handleCloseModal = () => {
    setFadeState('out');
    setTimeout(() => setOpenDialogSymbol(null), 200);
  };

  // Modal Portal rendering
  const renderModal = (symbol: string, pos: any) => {
    const qty = safeNumber(pos.qty);
    const currentPrice = safeNumber(pos.current_price || pos.market_price);
    const marketValue = safeNumber(pos.market_value);
    const unrealizedPl = safeNumber(pos.unrealized_pl);
    const side = qty > 0 ? 'Long' : qty < 0 ? 'Short' : 'Flat';

    return createPortal(
      <div
        className={`fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 overflow-auto transition-opacity duration-200 ${
          fadeState === 'in'
            ? 'opacity-100'
            : fadeState === 'out'
            ? 'opacity-0'
            : 'opacity-0'
        }`}
      >
        <div className="relative bg-[#1a1a1a] p-4 rounded w-[420px] max-w-[95vw] max-h-[90vh] text-white overflow-auto text-xs border border-gray-700 transform transition-all duration-200 scale-100 shadow-[0_0_20px_rgba(255,0,0,0.25)]">
          <h2 className="text-base font-bold mb-3 text-center border-b border-gray-700 pb-1">
            {symbol} — Trade Details
          </h2>

          <div className="space-y-3">
            <section>
              <h3 className="font-semibold mb-1 text-gray-300 uppercase text-[11px]">Trade Info</h3>
              <div className="grid grid-cols-2 gap-x-2">
                <p>Symbol: {symbol}</p>
                <p>Side: {side}</p>
                <p>Quantity: {qty}</p>
                <p>Avg Entry Price: {pos.avg_entry_price ?? '--'}</p>
                <p>Cost Basis: {pos.cost_basis ?? '--'}</p>
              </div>
            </section>

            <section>
              <h3 className="font-semibold mb-1 text-gray-300 uppercase text-[11px]">Pricing</h3>
              <div className="grid grid-cols-2 gap-x-2">
                <p>Current Price: {currentPrice.toFixed(2)}</p>
                <p>Market Value: {marketValue.toFixed(2)}</p>
                <p>Last Close Price: {pos.lastday_price ?? '--'}</p>
                <p>
                  Change Today:{' '}
                  {pos.change_today
                    ? (safeNumber(pos.change_today) * 100).toFixed(2) + '%'
                    : '--'}
                </p>
              </div>
            </section>

            <section>
              <h3 className="font-semibold mb-1 text-gray-300 uppercase text-[11px]">Performance</h3>
              <div className="grid grid-cols-2 gap-x-2">
                <p>Unrealized P/L ($): {unrealizedPl.toFixed(2)}</p>
                <p>
                  Unrealized P/L (%):{' '}
                  {pos.unrealized_plpc
                    ? (safeNumber(pos.unrealized_plpc) * 100).toFixed(2) + '%'
                    : '--'}
                </p>
                <p>Intraday P/L ($): {pos.unrealized_intraday_pl ?? '--'}</p>
                <p>
                  Intraday P/L (%):{' '}
                  {pos.unrealized_intraday_plpc
                    ? (safeNumber(pos.unrealized_intraday_plpc) * 100).toFixed(2) + '%'
                    : '--'}
                </p>
              </div>
            </section>

            <section>
              <h3 className="font-semibold mb-1 text-gray-300 uppercase text-[11px]">Asset Details</h3>
              <div className="grid grid-cols-2 gap-x-2">
                <p>Exchange: {pos.exchange ?? '--'}</p>
                <p>Asset Class: {pos.asset_class ?? '--'}</p>
                <p>Marginable: {pos.asset_marginable ? 'Yes' : 'No'}</p>
                <p>
                  Last Updated:{' '}
                  {pos.updated_at ? new Date(pos.updated_at).toLocaleString() : '--'}
                </p>
              </div>
            </section>
          </div>

          <div className="flex justify-center mt-3">
            <button
              className="mt-2 bg-red-600 px-3 py-1 rounded text-xs hover:bg-red-500"
              onClick={handleCloseModal}
            >
              Close
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <Card className="bg-black text-white p-2">
      <CardHeader className="flex flex-row justify-between items-center pb-1">
        <CardTitle className="text-sm">Active Trades</CardTitle>

        <div
          onClick={handleLockToggle}
          title={isLocked ? 'Unlock' : 'Lock'}
          className={`w-3 h-3 rounded-full cursor-pointer transition-colors ${
            isLocked ? 'bg-magenta-500 hover:bg-magenta-400' : 'bg-blue-500 hover:bg-blue-400'
          }`}
        ></div>
      </CardHeader>

      <CardContent className="overflow-auto max-h-[350px] p-1">
        <div className="min-w-full overflow-x-auto">
          <table className="w-max border-collapse table-auto text-xs">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left px-1.5 py-0.5 min-w-[90px]">Asset</th>
                <th className="text-left px-1.5 py-0.5 min-w-[90px]">Market Price</th>
                <th className="text-left px-1.5 py-0.5 min-w-[60px]">Qty</th>
                <th className="text-left px-1.5 py-0.5 min-w-[100px]">Market Value</th>
                <th className="text-left px-1.5 py-0.5 min-w-[110px]">Unrealized P/L ($)</th>
                <th className="text-left px-1.5 py-0.5 min-w-[60px]">Side</th>
                <th className="text-left px-1.5 py-0.5 min-w-[60px]">Details</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((pos: any, i: number) => {
                const symbol = pos.symbol || '--';
                const qty = safeNumber(pos.qty);
                const currentPrice = safeNumber(pos.current_price || pos.market_price);
                const marketValue = safeNumber(pos.market_value);
                const unrealizedPl = safeNumber(pos.unrealized_pl);
                const side = qty > 0 ? 'Long' : qty < 0 ? 'Short' : 'Flat';

                return (
                  <React.Fragment key={i}>
                    <tr className="border-b border-gray-700 hover:bg-gray-900/40 transition-colors">
                      <td className="px-1.5 py-0.5">{symbol}</td>
                      <td className="px-1.5 py-0.5">{currentPrice.toFixed(2)}</td>
                      <td className="px-1.5 py-0.5">{qty}</td>
                      <td className="px-1.5 py-0.5">{marketValue.toFixed(2)}</td>
                      <td className={`px-1.5 py-0.5 font-semibold ${getPnLColor(unrealizedPl)}`}>
                        {unrealizedPl >= 0 ? '+' : ''}
                        {unrealizedPl.toFixed(2)}
                      </td>
                      <td className="px-1.5 py-0.5">{side}</td>
                      <td className="px-1.5 py-0.5">
                        <span
                          className="text-magenta-500 underline cursor-pointer hover:text-magenta-400"
                          onClick={() => handleDetailsClick(symbol)}
                        >
                          Details
                        </span>
                      </td>
                    </tr>

                    <tr>
                      <td colSpan={7} className="px-1.5 py-0.5">
                        <TradeGraph pnl={unrealizedPl} />
                      </td>
                    </tr>

                    {openDialogSymbol === symbol && renderModal(symbol, pos)}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ActiveTrades;
