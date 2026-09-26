'use client';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Created on first use, not at module load: the dashboard is prerendered at
// build time, where the env vars are not present, and an eager client throws.
let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  client = createClient(url, key, { realtime: { params: { eventsPerSecond: 10 } } });
  return client;
}
