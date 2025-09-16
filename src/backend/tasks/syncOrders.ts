// src/backend/tasks/syncOrders.ts

export async function runSyncOrders(userId: string) {
  console.log("🔄 [syncOrders] Starting syncOrders for userId:", userId);

  // Load environment variables from Deno
  const SUPABASE_FUNCTION_URL = Deno.env.get("SUPABASE_FUNCTION_URL");
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

  if (!SUPABASE_FUNCTION_URL || !SUPABASE_ANON_KEY) {
    console.error("❌ [syncOrders] Missing environment variables:", {
      SUPABASE_FUNCTION_URL,
      SUPABASE_ANON_KEY,
    });
    throw new Error(
      "Missing environment variables: SUPABASE_FUNCTION_URL or SERVICE_ROLE_KEY",
    );
  }

  try {
    console.log("🌐 [syncOrders] Sending request to Supabase function...");
    const response = await fetch(`${SUPABASE_FUNCTION_URL}/sync-orders`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
       "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId }),
    });

    console.log("📥 [syncOrders] Response received, parsing JSON...");
    const result = await response.json();

    if (!response.ok) {
      console.error("❌ [syncOrders] Supabase function returned an error:", result);
      throw new Error(`Supabase error: ${result.message || "Unknown error"}`);
    }

    console.log("✅ [syncOrders] syncOrders succeeded:", result);
    return result;
  } catch (err) {
    console.error("❌ [syncOrders] Exception while running syncOrders:", err);
    throw err;
  }
}
