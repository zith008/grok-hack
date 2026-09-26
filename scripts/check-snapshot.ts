/** Sanity check: does the parser read the seeded listings correctly? */
import { getSupabaseServerClient } from "@/lib/commerce/supabase";
import { toSnapshot, type ProductRow } from "@/lib/agents/snapshot";

async function main() {
  const db = getSupabaseServerClient();
  const { data, error } = await db.from("products").select("*").limit(20);
  if (error) throw new Error(error.message);

  for (const row of (data ?? []) as ProductRow[]) {
    const s = toSnapshot(row);
    const missing = [
      !s.size_info && "size_info",
      !s.materials && "materials",
      !s.returns_policy && "returns_policy",
      s.image_urls.length === 0 && "images",
    ].filter(Boolean);
    console.log(
      `${missing.length ? "FAIL" : "ok  "} ${s.title.padEnd(28)} ${
        missing.length ? "missing: " + missing.join(", ") : `size="${s.size_info.slice(0, 32)}…"`
      }`,
    );
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
