import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    'Missing Supabase env vars. Check your .env file has VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.'
  );
}

// Note: the publishable key (sb_publishable_...) is the new replacement for the
// legacy "anon" key. It's safe to expose in client-side code as long as
// Row Level Security (RLS) policies are set on your tables/storage, which we did.
export const supabase = createClient(supabaseUrl, supabasePublishableKey);