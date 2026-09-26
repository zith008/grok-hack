-- Autopilot data model (Brief & Build Plan section "Data model (Supabase)")
-- Phase 1, Person A: products, events, incidents, fixes, settings

create extension if not exists "pgcrypto";

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  shopify_id text not null unique,
  title text not null,
  price numeric(10, 2) not null,
  cost numeric(10, 2),
  inventory integer not null default 0,
  snapshot_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  persona text not null,
  type text not null check (type in ('view', 'add_to_cart', 'leave')),
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists events_product_id_created_at_idx on events (product_id, created_at desc);

create table if not exists incidents (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  detector text not null,
  loss_per_day_gbp numeric(10, 2),
  diagnosis text,
  status text not null default 'open' check (status in ('open', 'fixing', 'verified', 'rolled_back')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists incidents_status_idx on incidents (status);

create table if not exists fixes (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references incidents (id) on delete cascade,
  before_json jsonb not null,
  after_json jsonb,
  autonomy text not null check (autonomy in ('automatic', 'needs_approval', 'draft_only')),
  approved_by text,
  applied_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists settings (
  id uuid primary key default gen_random_uuid(),
  fix_type text not null unique,
  autonomy text not null check (autonomy in ('automatic', 'needs_approval', 'draft_only')),
  margin_floor_pct numeric(5, 2) not null default 0,
  updated_at timestamptz not null default now()
);

insert into settings (fix_type, autonomy, margin_floor_pct) values
  ('copy', 'automatic', 0),
  ('price', 'needs_approval', 20),
  ('reorder', 'draft_only', 0)
on conflict (fix_type) do nothing;

alter table products enable row level security;
alter table events enable row level security;
alter table incidents enable row level security;
alter table fixes enable row level security;
alter table settings enable row level security;

create policy "service role full access" on products for all using (true) with check (true);
create policy "service role full access" on events for all using (true) with check (true);
create policy "service role full access" on incidents for all using (true) with check (true);
create policy "service role full access" on fixes for all using (true) with check (true);
create policy "service role full access" on settings for all using (true) with check (true);
