create extension if not exists pgcrypto;

create table if not exists public.inventory_sections (
  id text primary key,
  title text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.customers (
  id text primary key,
  name text not null unique,
  phone text,
  address text,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.incoming_shipments (
  id text primary key,
  container_number text not null,
  car_number text not null,
  supplier_name text not null,
  status text not null check (status in ('ON_THE_WAY', 'AT_BRIDGE', 'IN_GARAGE')),
  arrival_time timestamptz not null default now(),
  duration_hours integer not null default 24 check (duration_hours > 0),
  note text
);

create table if not exists public.incoming_items (
  id uuid primary key default gen_random_uuid(),
  incoming_id text not null references public.incoming_shipments(id) on delete cascade,
  name text not null,
  quantity integer not null check (quantity >= 0),
  unit text,
  container_number text,
  inventory_section_id text references public.inventory_sections(id) on delete set null
);

create table if not exists public.container_stock (
  id text primary key,
  container_id text not null,
  container_number text not null,
  car_number text not null,
  supplier_name text not null,
  inventory_section_id text references public.inventory_sections(id) on delete set null,
  product_name text not null,
  initial_quantity integer not null check (initial_quantity >= 0),
  remaining_quantity integer not null check (remaining_quantity >= 0),
  unit text,
  received_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id text primary key,
  customer_name text not null,
  car_number text not null,
  status text not null check (status in ('PENDING', 'PREPARING', 'ON_THE_WAY', 'DELIVERED')),
  order_time timestamptz not null default now(),
  final_date timestamptz not null,
  customer_note text
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references public.orders(id) on delete cascade,
  name text not null,
  quantity integer not null check (quantity >= 0),
  unit text,
  container_id text,
  container_number text
);

create table if not exists public.activity_logs (
  id text primary key,
  type text not null check (type in ('INCOMING', 'OUTGOING', 'MANUAL')),
  message text not null,
  timestamp timestamptz not null default now(),
  operator text
);

alter table public.inventory_sections enable row level security;
alter table public.customers enable row level security;
alter table public.incoming_shipments enable row level security;
alter table public.incoming_items enable row level security;
alter table public.container_stock enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.activity_logs enable row level security;

drop policy if exists "Authenticated users can manage inventory sections" on public.inventory_sections;
create policy "Authenticated users can manage inventory sections"
  on public.inventory_sections for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated users can manage customers" on public.customers;
create policy "Authenticated users can manage customers"
  on public.customers for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated users can manage incoming shipments" on public.incoming_shipments;
create policy "Authenticated users can manage incoming shipments"
  on public.incoming_shipments for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated users can manage incoming items" on public.incoming_items;
create policy "Authenticated users can manage incoming items"
  on public.incoming_items for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated users can manage container stock" on public.container_stock;
create policy "Authenticated users can manage container stock"
  on public.container_stock for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated users can manage orders" on public.orders;
create policy "Authenticated users can manage orders"
  on public.orders for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated users can manage order items" on public.order_items;
create policy "Authenticated users can manage order items"
  on public.order_items for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated users can manage activity logs" on public.activity_logs;
create policy "Authenticated users can manage activity logs"
  on public.activity_logs for all
  to authenticated
  using (true)
  with check (true);
