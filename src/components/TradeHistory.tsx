// --- TradeHistory.tsx ---
import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getUserAlpacaKeys } from "@/lib/alpaca_api_client";
import { AlpacaTradeActivity } from "@/lib/alpaca_api_client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  [key: string]: any;
}

interface TradeHistoryProps {
  userId: string;
}

export const TradeHistory: React.FC<TradeHistoryProps> = ({ userId }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

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

        const res = await fetch(`https://paper-api.alpaca.markets/v2/orders?status=all&limit=200`, {
          headers: {
            "APCA-API-KEY-ID": keys.api_key,
            "APCA-API-SECRET-KEY": keys.secret_key,
          },
        });

        if (!res.ok) throw new Error(`Failed to fetch orders: ${res.statusText}`);
        const data: AlpacaTradeActivity[] = await res.json();

        // Map to Order interface and sort by submitted_at descending
        const mapped: Order[] = data
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
          .sort((a, b) =>
            new Date(b.submitted_at || "").getTime() - new Date(a.submitted_at || "").getTime()
          );

        // Keep last 100 for trade history
        setOrders(mapped.slice(0, 100));
      } catch (err) {
        console.error("❌ Error fetching trade history:", err);
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
        return "text-green-500";
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trade History</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4">Loading trade history...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-4">No trades found.</div>
        ) : (
          <ScrollArea className="overflow-x-auto">
            <Table className="w-full min-w-[1000px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Order Type</TableHead>
                  <TableHead>Side</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Filled Qty</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Submitted At</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.alpaca_order_id}>
                    <TableCell>{order.symbol}</TableCell>
                    <TableCell>{order.type}</TableCell>
                    <TableCell>{order.side}</TableCell>
                    <TableCell className="text-right">{order.qty.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{order.filled_qty.toLocaleString()}</TableCell>
                    <TableCell className={getStatusColor(order.status)}>{order.status}</TableCell>
                    <TableCell>{order.source}</TableCell>
                    <TableCell>{formatDate(order.submitted_at)}</TableCell>
                    <TableCell>
                      <span
                        className="text-red-500 underline cursor-pointer text-sm"
                        onClick={() => setSelectedOrder(order)}
                      >
                        Details
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}

        {selectedOrder && (
          <Dialog open={true} onOpenChange={() => setSelectedOrder(null)}>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>Order Details</DialogTitle>
                <DialogClose />
              </DialogHeader>
              <div className="grid grid-cols-2 gap-2 py-4 border border-gray-700 p-2 rounded-md">
                <div className="font-semibold text-sm">Symbol</div>
                <div className="text-sm">{selectedOrder.symbol}</div>

                <div className="font-semibold text-sm">Side</div>
                <div className="text-sm">{selectedOrder.side}</div>

                <div className="font-semibold text-sm">Order Type</div>
                <div className="text-sm">{selectedOrder.type}</div>

                <div className="font-semibold text-sm">Quantity</div>
                <div className="text-sm">{selectedOrder.qty.toLocaleString()}</div>

                <div className="font-semibold text-sm">Filled Qty</div>
                <div className="text-sm">{selectedOrder.filled_qty.toLocaleString()}</div>

                <div className="font-semibold text-sm">Status</div>
                <div className="text-sm">{selectedOrder.status}</div>

                <div className="font-semibold text-sm">Source</div>
                <div className="text-sm">{selectedOrder.source}</div>

                <div className="font-semibold text-sm">Submitted At</div>
                <div className="text-sm">{formatDate(selectedOrder.submitted_at)}</div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
};

export default TradeHistory;
