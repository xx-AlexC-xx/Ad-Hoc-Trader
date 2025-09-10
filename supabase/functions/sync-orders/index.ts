// supabase/functions/sync-orders/index.ts
// Deno runtime for Supabase Edge Function
// Fetches a user's Alpaca orders, normalizes fields, and upserts into public.orders

import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in function environment");
}
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const ALPACA_BASE = Deno.env.get("ALPACA_BASE_URL") || "https://paper-api.alpaca.markets";

serve(async (req) => {
  try {
    const payload = await req.json().catch(() => ({}));
    const userId = (payload as Record<string, unknown>)?.userId as string | null;

    if (!userId) {
      return new Response(JSON.stringify({ error: "Missing userId in request body" }), { status: 400 });
    }

    // 1) Get the user's Alpaca keys from Supabase
    const { data: creds, error: credsError } = await supabase
      .from("user_alpaca_credentials")
      .select("api_key, secret_key")
      .eq("user_id", userId)
      .single();

    if (credsError || !creds) {
      console.error("Failed to fetch Alpaca credentials for user:", userId, credsError);
      return new Response(JSON.stringify({ error: "Failed to fetch Alpaca credentials" }), { status: 404 });
    }

    const { api_key, secret_key } = creds as { api_key: string; secret_key: string; };

    // 2) Fetch orders from Alpaca
    const alpacaResp = await fetch(`${ALPACA_BASE}/v2/orders?status=all&limit=50`, {
      headers: {
        "APCA-API-KEY-ID": api_key,
        "APCA-API-SECRET-KEY": secret_key,
      },
    });

    if (!alpacaResp.ok) {
      const txt = await alpacaResp.text().catch(() => "");
      console.error("Alpaca API error:", alpacaResp.status, txt);
      return new Response(JSON.stringify({ error: `Alpaca API error: ${alpacaResp.status}` }), { status: 502 });
    }

    const ordersData = await alpacaResp.json();

    if (!Array.isArray(ordersData)) {
      console.error("Unexpected Alpaca response shape:", ordersData);
      return new Response(JSON.stringify({ error: "Unexpected Alpaca response" }), { status: 502 });
    }

    // 3) Normalize & map orders for DB upsert
    const upserts = ordersData.map((o: unknown) => {
      if (typeof o !== "object" || o === null) return {}; // safety fallback
      const order = o as Record<string, unknown>;

      const toNum = (v: unknown) => (v === null || v === undefined || v === "" ? null : Number(v));
      const toNumOrZero = (v: unknown) => {
        const n = toNum(v);
        return n === null ? 0 : n;
      };

      return {
        alpaca_order_id: order["id"] as string,
        client_order_id: (order["client_order_id"] as string) ?? null,
        user_id: userId,
        symbol: (order["symbol"] as string) ?? null,
        asset_class: (order["asset_class"] as string) ?? null,
        side: (order["side"] as string) ?? null,
        type: (order["type"] as string) ?? null,
        time_in_force: (order["time_in_force"] as string) ?? null,
        status: (order["status"] as string) ?? null,
        notional: toNum(order["notional"]),
        qty: toNum(order["qty"]),
        filled_qty: toNumOrZero(order["filled_qty"]),
        filled_avg_price: toNum(order["filled_avg_price"]),
        limit_price: toNum(order["limit_price"]),
        stop_price: toNum(order["stop_price"]),
        trail_price: toNum(order["trail_price"]),
        trail_percent: toNum(order["trail_percent"]),
        take_profit_limit_price: toNum((order["take_profit"] as Record<string, unknown>)?.limit_price),
        stop_loss_stop_price: toNum((order["stop_loss"] as Record<string, unknown>)?.stop_price),
        stop_loss_limit_price: toNum((order["stop_loss"] as Record<string, unknown>)?.limit_price),
        submitted_at: (order["submitted_at"] as string) ?? null,
        filled_at: (order["filled_at"] as string) ?? null,
        expired_at: (order["expired_at"] as string) ?? null,
        canceled_at: (order["canceled_at"] as string) ?? null,
        failed_at: (order["failed_at"] as string) ?? null,
        replaced_at: (order["replaced_at"] as string) ?? null,
        replaced_by: (order["replaced_by"] as string) ?? null,
        replaces: (order["replaces"] as string) ?? null,
        legs: Array.isArray(order["legs"]) ? order["legs"] : null,
        json_raw: order ?? null,
      };
    });

    // 4) Upsert into orders table
    const { error: upsertError } = await supabase
      .from("orders")
      .upsert(upserts, { onConflict: "alpaca_order_id" });

    if (upsertError) {
      console.error("Upsert to orders failed:", upsertError);
      return new Response(JSON.stringify({ error: "Failed to upsert orders" }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true, count: upserts.length }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("sync-orders function error:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
