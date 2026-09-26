-- Phase 2 merge: columns the incident console reads, plus realtime.
-- Person B needs these; Person A's 0001 schema does not have them yet.

alter table incidents
  add column if not exists product_title text,
  add column if not exists blocker text
    check (blocker in ('size_guide', 'materials', 'returns', 'price_vs_comps', 'lead_image')),
  -- Add-to-cart rate as a fraction, 0-1, at the moment the incident opened.
  add column if not exists conversion_before numeric(5, 4),
  -- Add-to-cart rate after the fix was verified.
  add column if not exists conversion_after numeric(5, 4);

-- The fix proposer returns a type; the dashboard renders differently per type.
alter table fixes
  add column if not exists type text not null default 'copy'
    check (type in ('copy', 'price', 'reorder'));

-- Backfill product_title so existing rows render.
update incidents i
set product_title = p.title
from products p
where i.product_id = p.id and i.product_title is null;

-- Realtime: without this the console never updates and the demo looks dead.
alter publication supabase_realtime add table incidents;
alter publication supabase_realtime add table fixes;
alter publication supabase_realtime add table events;

-- Realtime respects RLS, so the anon key needs explicit read access.
drop policy if exists "anon read incidents" on incidents;
drop policy if exists "anon read fixes" on fixes;
drop policy if exists "anon read events" on events;
drop policy if exists "anon read products" on products;

create policy "anon read incidents" on incidents for select to anon using (true);
create policy "anon read fixes" on fixes for select to anon using (true);
create policy "anon read events" on events for select to anon using (true);
create policy "anon read products" on products for select to anon using (true);
