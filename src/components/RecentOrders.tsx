// --- RecentOrders.tsx ---
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getUserAlpacaKeys, AlpacaTradeActivity } from "@/lib/alpaca_api_client";

interface Order {
  alpaca_order_id: string;
  symbol: string;
  type: string;
  side: string;
  qty: number;
  filled_qty: number;
  status: string;
  source?: string;
  submitted_at: string | null;
  raw?: any;
}

interface RecentOrdersProps {
  userId: string;
}

export const RecentOrders: React.FC<RecentOrdersProps> = ({ userId }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [fadeState, setFadeState] = useState<"in" | "out" | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const keys = await getUserAlpacaKeys(userId);
        if (!keys) {
          console.error("❌ No Alpaca keys found for user:", userId);
          setOrders([]);
          setLoading(false);
          return;
        }

        const res = await fetch(
          `https://paper-api.alpaca.markets/v2/orders?status=all&limit=100`,
          {
            headers: {
              "APCA-API-KEY-ID": keys.api_key,
              "APCA-API-SECRET-KEY": keys.secret_key,
            },
          }
        );

        if (!res.ok) throw new Error(`Failed to fetch orders: ${res.statusText}`);
        const data: AlpacaTradeActivity[] = await res.json();

        const nonActive = data.filter(
          (o) => !["partially_filled"].includes(o.status)
        );

        const mapped: Order[] = nonActive
          .map((o) => ({
            alpaca_order_id: o.id,
            symbol: o.symbol,
            type: o.type,
            side: o.side,
            qty: Number(o.qty),
            filled_qty: Number(o.cum_qty),
            status: o.status ?? "pending",
            source: o.source ?? "",
            submitted_at: o.transaction_time ?? null,
            raw: o,
          }))
          .sort(
            (a, b) =>
              new Date(b.submitted_at || "").getTime() -
              new Date(a.submitted_at || "").getTime()
          );

        setOrders(mapped);
      } catch (err) {
        console.error("❌ Error fetching orders:", err);
        setOrders([]);
      }
      setLoading(false);
    };

    fetchOrders();
  }, [userId]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("en-US");
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "filled":
        return "text-teal-400"; // green → teal
      case "canceled":
        return "text-red-500";
      case "expired":
        return "text-gray-400";
      case "pending":
      case "accepted":
        return "text-yellow-500";
      default:
        return "text-gray-300";
    }
  };

  const getRowTextColor = (side: string) => {
    if (side.toLowerCase() === "buy") return "text-teal-400";
    if (side.toLowerCase() === "sell") return "text-magenta-500";
    return "text-white";
  };

  const handleDetailsClick = (order: Order) => {
    setSelectedOrder(order);
    setFadeState("in");
  };

  const handleCloseModal = () => {
    setFadeState("out");
    setTimeout(() => setSelectedOrder(null), 200);
  };

  const renderModal = (order: Order) =>
    createPortal(
      <div
        className={`fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 overflow-auto transition-opacity duration-200 ${
          fadeState === "in"
            ? "opacity-100"
            : fadeState === "out"
            ? "opacity-0"
            : "opacity-0"
        }`}
      >
        <div className="bg-[#1a1a1a] p-5 rounded w-[480px] max-w-[95vw] text-white text-xs border border-gray-700 shadow-lg transition-all duration-200">
          <h2 className="text-base font-bold mb-3 text-center border-b border-gray-700 pb-1">
            {order.symbol} — Order Details
          </h2>

          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[13px] mb-2">
            <p className="font-semibold text-gray-300">Symbol:</p>
            <p>{order.symbol}</p>

            <p className="font-semibold text-gray-300">Side:</p>
            <p className="capitalize">{order.side}</p>

            <p className="font-semibold text-gray-300">Order Type:</p>
            <p className="capitalize">{order.type}</p>

            <p className="font-semibold text-gray-300">Quantity:</p>
            <p>{order.qty.toLocaleString()}</p>

            <p className="font-semibold text-gray-300">Filled Qty:</p>
            <p>{order.filled_qty.toLocaleString()}</p>

            <p className="font-semibold text-gray-300">Status:</p>
            <p className={`${getStatusColor(order.status)} capitalize`}>
              {order.status}
            </p>

            <p className="font-semibold text-gray-300">Source:</p>
            <p>{order.source || "--"}</p>

            <p className="font-semibold text-gray-300">Submitted At:</p>
            <p>{formatDate(order.submitted_at)}</p>

            {order.raw && (
              <>
                <p className="font-semibold text-gray-300">Limit Price:</p>
                <p>{order.raw.limit_price ?? "--"}</p>

                <p className="font-semibold text-gray-300">Stop Price:</p>
                <p>{order.raw.stop_price ?? "--"}</p>

                <p className="font-semibold text-gray-300">Filled Avg Price:</p>
                <p>{order.raw.filled_avg_price ?? "--"}</p>

                <p className="font-semibold text-gray-300">Time in Force:</p>
                <p>{order.raw.time_in_force ?? "--"}</p>

                <p className="font-semibold text-gray-300">Updated At:</p>
                <p>
                  {order.raw.updated_at
                    ? formatDate(order.raw.updated_at)
                    : "--"}
                </p>
              </>
            )}
          </div>

          <div className="flex justify-center mt-3">
            <button
              className="mt-1 bg-red-600 px-3 py-1 rounded text-xs hover:bg-red-500"
              onClick={handleCloseModal}
            >
              Close
            </button>
          </div>
        </div>
      </div>,
      document.body
    );

  return (
    <Card className="bg-black text-white p-2">
      <CardHeader className="flex flex-row justify-between items-center pb-1">
        <CardTitle className="text-sm">Orders</CardTitle>
      </CardHeader>
      <CardContent className="p-1">
        {loading ? (
          <div className="text-center py-4 text-xs">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-4 text-xs">No orders found.</div>
        ) : (
          <div className="overflow-auto max-h-[350px] max-w-full">
            <table className="w-max border-collapse table-auto text-xs min-w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left px-1.5 py-0.5 min-w-[90px]">Asset</th>
                  <th className="text-left px-1.5 py-0.5 min-w-[70px]">
                    Order Type
                  </th>
                  <th className="text-left px-1.5 py-0.5 min-w-[80px]">Side</th>
                  <th className="text-left px-1.5 py-0.5 min-w-[80px]">Qty</th>
                  <th className="text-left px-1.5 py-0.5 min-w-[80px]">
                    Filled Qty
                  </th>
                  <th className="text-left px-1.5 py-0.5 min-w-[80px]">
                    Status
                  </th>
                  <th className="text-left px-1.5 py-0.5 min-w-[100px]">
                    Source
                  </th>
                  <th className="text-left px-1.5 py-0.5 min-w-[150px]">
                    Submitted At
                  </th>
                  <th className="text-left px-1.5 py-0.5 min-w-[70px]">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const rowTextColor = getRowTextColor(order.side);

                  return (
                    <tr
                      key={order.alpaca_order_id}
                      className={`border-b border-gray-700 hover:bg-gray-900/40 transition-colors ${rowTextColor}`}
                    >
                      <td className="px-1.5 py-0.5">{order.symbol}</td>
                      <td className="px-1.5 py-0.5">{order.type}</td>
                      <td className="px-1.5 py-0.5 capitalize font-semibold">{order.side}</td>
                      <td className="px-1.5 py-0.5 text-right">
                        {order.qty.toLocaleString()}
                      </td>
                      <td className="px-1.5 py-0.5 text-right">
                        {order.filled_qty.toLocaleString()}
                      </td>
                      <td className={`px-1.5 py-0.5 ${getStatusColor(order.status)}`}>
                        {order.status}
                      </td>
                      <td className="px-1.5 py-0.5">{order.source}</td>
                      <td className="px-1.5 py-0.5">{formatDate(order.submitted_at)}</td>
                      <td className="px-1.5 py-0.5">
                        <span
                          className="text-red-500 underline cursor-pointer text-xs hover:text-red-400"
                          onClick={() => handleDetailsClick(order)}
                        >
                          Details
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {selectedOrder && renderModal(selectedOrder)}
      </CardContent>
    </Card>
  );
};

export default RecentOrders;
