import { createClient } from '@supabase/supabase-js';

/** Server-side client with the service role. Never import into a client component. */
export function serverSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}
