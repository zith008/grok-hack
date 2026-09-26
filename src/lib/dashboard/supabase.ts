'use client';

import { createClient } from '@supabase/supabase-js';

// Browser client, anon key only. Realtime drives the incident console.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { realtime: { params: { eventsPerSecond: 10 } } },
);
