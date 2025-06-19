import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
// Using direct values from project configuration
const supabaseUrl = 'https://qhmgxmalxffllarmlqjn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFobWd4bWFseGZmbGxhcm1scWpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyMDk2MzAsImV4cCI6MjA2NDc4NTYzMH0.CUCYQUjKxj5I3smd29ArZT6RfrngNEHNIp9c_7-65i4';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
});

export { supabase };