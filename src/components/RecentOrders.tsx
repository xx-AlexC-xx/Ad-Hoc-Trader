// --- RecentOrders.tsx ---

import React, { useEffect, useState } from "react";
import { createClient } from '@supabase/supabase-js'; // adjust path if needed
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/lib/supabase";

interface Order {
  alpaca_order_id: string;
  symbol: string;
  type: string;
  side: string;
  qty: number;
  filled_qty: number;
  filled_avg_price: number | null;
  status: string;
  submitted_at: string | null;
  filled_at: string | null;
}

interface RecentOrdersProps {
  userId: string;
}

export const RecentOrders: React.FC<RecentOrdersProps> = ({ userId }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("orders")
        .select(
          "alpaca_order_id, symbol, type, side, qty, filled_qty, filled_avg_price, status, submitted_at, filled_at"
        )
        .eq("user_id", userId)
        .order("submitted_at", { ascending: false })
        .limit(10);

      if (error) {
        console.error("❌ Error fetching orders:", error);
        setOrders([]);
      } else {
        setOrders(data as Order[]);
      }
      setLoading(false);
    };

    fetchOrders();
  }, [userId]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Orders</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-4">No orders found.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ASSET</TableHead>
                <TableHead>ORDER TYPE</TableHead>
                <TableHead>SIDE</TableHead>
                <TableHead>QTY</TableHead>
                <TableHead>FILLED QTY</TableHead>
                <TableHead>AVG PRICE</TableHead>
                <TableHead>STATUS</TableHead>
                <TableHead>SUBMITTED AT</TableHead>
                <TableHead>FILLED AT</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.alpaca_order_id}>
                  <TableCell>{order.symbol}</TableCell>
                  <TableCell>{order.type}</TableCell>
                  <TableCell>{order.side}</TableCell>
                  <TableCell>{order.qty}</TableCell>
                  <TableCell>{order.filled_qty}</TableCell>
                  <TableCell>
                    {order.filled_avg_price !== null
                      ? order.filled_avg_price.toFixed(2)
                      : "-"}
                  </TableCell>
                  <TableCell>{order.status}</TableCell>
                  <TableCell>{formatDate(order.submitted_at)}</TableCell>
                  <TableCell>{formatDate(order.filled_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentOrders;
