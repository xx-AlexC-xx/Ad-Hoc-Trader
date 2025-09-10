


// src/backend/tasks/syncOrders.ts

export async function runSyncOrders(userId: string) {
  // Load environment variables from Deno
  const SUPABASE_FUNCTION_URL = Deno.env.get("SUPABASE_FUNCTION_URL");
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!SUPABASE_FUNCTION_URL || !SERVICE_ROLE_KEY) {
    throw new Error(
      "Missing environment variables: SUPABASE_FUNCTION_URL or SERVICE_ROLE_KEY",
    );
  }

  try {
    const response = await fetch(`${SUPABASE_FUNCTION_URL}/sync-orders`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("❌ syncOrders function failed:", result);
      throw new Error(`Supabase error: ${result.message || "Unknown error"}`);
    }

    console.log("✅ syncOrders succeeded:", result);
    return result;
  } catch (err) {
    console.error("❌ Failed to run syncOrders:", err);
    throw err;
  }
}
