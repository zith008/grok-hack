import type { AutonomySettings, Autonomy } from "../agents/fix";
import { getSupabaseServerClient } from "./supabase";

/** Reads the `settings` table (seeded in migration 0001) into the shape proposeFix expects. */
export async function getAutonomySettings(cost?: number | null): Promise<AutonomySettings> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("settings").select("fix_type, autonomy, margin_floor_pct");

  if (error) {
    throw new Error(`Supabase settings read failed: ${error.message}`);
  }

  const byType = new Map((data ?? []).map((r) => [r.fix_type, r]));
  const copy = (byType.get("copy")?.autonomy ?? "automatic") as Autonomy;
  const price = (byType.get("price")?.autonomy ?? "needs_approval") as Autonomy;
  const margin_floor_pct = byType.get("price")?.margin_floor_pct ?? 20;

  return { copy, price, margin_floor_pct, cost };
}
