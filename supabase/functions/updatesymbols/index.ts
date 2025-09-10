// supabase/functions/updatesymbols/index.ts
// deno-lint-ignore-file
// @title updatesymbols
// @public

import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.5";

type SymbolRecord = {
  symbol: string;
  name: string;
  exchange: string;
  status: string;
  tradable: boolean;
  marginable: boolean;
  shortable: boolean;
  easy_to_borrow: boolean;
  fractionable: boolean;
  updated_at: string;
};

serve(async (_req: Request) => {
  console.log("🟢 Starting updatesymbols function with batching...");

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const res = await fetch("https://paper-api.alpaca.markets/v2/assets", {
      headers: {
        "APCA-API-KEY-ID": Deno.env.get("ALPACA_API_KEY")!,
        "APCA-API-SECRET-KEY": Deno.env.get("ALPACA_SECRET_KEY")!,
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Alpaca fetch failed: ${res.status} ${errorText}`);
    }

    const data = await res.json();

    if (!Array.isArray(data)) {
      console.error("❌ assets is not an array:", data);
      return new Response(
        JSON.stringify({ error: "Alpaca response is not an array", raw: data }),
        { status: 500 }
      );
    }

    const filtered = data.filter(
      (item: any) => item.status === "active" && item.tradable === true
    );

    const mapped: SymbolRecord[] = filtered.map((item: any) => ({
      symbol: item.symbol,
      name: item.name,
      exchange: item.exchange,
      status: item.status,
      tradable: item.tradable,
      marginable: item.marginable,
      shortable: item.shortable,
      easy_to_borrow: item.easy_to_borrow,
      fractionable: item.fractionable,
      updated_at: new Date().toISOString(),
    }));

    console.log(`🔍 Filtered to ${mapped.length} active & tradable symbols.`);

    // 🧩 Break into chunks of 1000
    const chunkSize = 1000;
    const chunks: SymbolRecord[][] = [];
    for (let i = 0; i < mapped.length; i += chunkSize) {
      chunks.push(mapped.slice(i, i + chunkSize));
    }

    console.log(`📦 Created ${chunks.length} chunks of ${chunkSize} records each.`);

    for (let i = 0; i < chunks.length; i++) {
      const batch = chunks[i];
      console.log(`⬆️ Upserting batch ${i + 1} of ${chunks.length} (${batch.length} records)...`);

      const { error } = await supabase
        .from("symbols")
        .upsert(batch, { onConflict: "symbol" });

      if (error) {
        console.error(`❌ Error upserting batch ${i + 1}:`, error);
        return new Response(
          JSON.stringify({
            error: "Upsert failed",
            batch: i + 1,
            details: error,
          }),
          { status: 500 }
        );
      }

      console.log(`✅ Batch ${i + 1} upserted.`);
    }

    return new Response(
      JSON.stringify({
        message: "All symbols upserted in chunks",
        total: mapped.length,
        batches: chunks.length,
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("🚨 Unexpected error:", err);

    if (err instanceof Error) {
      return new Response(
        JSON.stringify({
          error: "Unexpected error",
          message: err.message,
          stack: err.stack || "No stack trace",
        }),
        { status: 500 }
      );
    } else {
      return new Response(
        JSON.stringify({
          error: "Unknown error",
          raw: String(err),
        }),
        { status: 500 }
      );
    }
  }
});
