// src/backend/tasks/updateSymbols.ts
import fetch from 'node-fetch';

// Move this to your .env file
const SUPABASE_FUNCTION_URL = 'https://qhmgxmalxffllarmlqjn.functions.supabase.co/update-symbols';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function runUpdateSymbols() {
  try {
    const response = await fetch(SUPABASE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}) // Pass any payload if needed
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Function failed:', result);
      throw new Error(`Supabase error: ${result.message || 'Unknown error'}`);
    }

    console.log('update-symbols succeeded:', result);
    return result;
  } catch (err) {
    console.error('Failed to run update-symbols:', err);
    throw err;
  }
}
