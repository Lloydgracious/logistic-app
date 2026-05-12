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

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  role text not null default 'staff' check (role in ('admin', 'staff')),
  status text not null default 'active' check (status in ('active', 'disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists status text not null default 'active';
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles drop constraint if exists profiles_status_check;
update public.profiles set role = 'staff' where role = 'user';
update public.profiles set status = 'active' where status is null;
alter table public.profiles alter column role set default 'staff';
alter table public.profiles alter column status set default 'active';
alter table public.profiles add constraint profiles_role_check check (role in ('admin', 'staff'));
alter table public.profiles add constraint profiles_status_check check (status in ('active', 'disabled'));

create table if not exists public.permission_modules (
  module_key text primary key,
  label text not null,
  sort_order integer not null default 0
);

insert into public.permission_modules (module_key, label, sort_order) values
  ('dashboard', 'Dashboard', 10),
  ('incoming', 'Incoming', 20),
  ('orders', 'Orders', 30),
  ('customers', 'Customers', 40),
  ('inventory', 'Inventory', 50),
  ('logs', 'Logs', 60),
  ('invoices', 'Billing', 70),
  ('notifications', 'Notifications', 80)
on conflict (module_key) do update set
  label = excluded.label,
  sort_order = excluded.sort_order;

create table if not exists public.staff_invites (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  token text not null unique,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked', 'expired')),
  invited_by uuid references auth.users(id) on delete set null,
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists staff_invites_email_status_idx on public.staff_invites (lower(email), status);

create table if not exists public.user_module_access (
  user_id uuid not null references public.profiles(id) on delete cascade,
  module_key text not null references public.permission_modules(module_key) on delete cascade,
  enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, module_key)
);

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  target_type text not null,
  target_id text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create schema if not exists app_private;

create or replace function app_private.is_first_profile()
returns boolean
language sql
security definer
set search_path = public
as $$
  select not exists (select 1 from public.profiles);
$$;

create or replace function app_private.is_first_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select not exists (
    select 1
    from public.profiles
    where role = 'admin'
  );
$$;

create or replace function app_private.can_bootstrap_admin(target_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select (select auth.uid()) = target_user_id
    and not exists (
      select 1
      from public.profiles
      where role = 'admin'
        and id <> target_user_id
    );
$$;

create or replace function app_private.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
      and status = 'active'
  );
$$;

create or replace function app_private.has_pending_invite(target_email text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.staff_invites
    where lower(email) = lower(target_email)
      and status = 'pending'
      and expires_at > now()
  );
$$;

create or replace function app_private.has_module_access(module text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select app_private.is_admin() or exists (
    select 1
    from public.profiles p
    join public.user_module_access uma on uma.user_id = p.id
    where p.id = (select auth.uid())
      and p.status = 'active'
      and uma.module_key = module
      and uma.enabled = true
  );
$$;

create or replace function app_private.has_any_module_access()
returns boolean
language sql
security definer
set search_path = public
as $$
  select app_private.is_admin() or exists (
    select 1
    from public.profiles p
    join public.user_module_access uma on uma.user_id = p.id
    where p.id = (select auth.uid())
      and p.status = 'active'
      and uma.enabled = true
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select app_private.is_admin();
$$;

alter table public.inventory_sections enable row level security;
alter table public.customers enable row level security;
alter table public.incoming_shipments enable row level security;
alter table public.incoming_items enable row level security;
alter table public.container_stock enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.activity_logs enable row level security;
alter table public.profiles enable row level security;
alter table public.permission_modules enable row level security;
alter table public.staff_invites enable row level security;
alter table public.user_module_access enable row level security;
alter table public.admin_audit_logs enable row level security;

drop policy if exists "Authenticated users can manage inventory sections" on public.inventory_sections;
drop policy if exists "Users manage own inventory sections; admins manage all" on public.inventory_sections;
drop policy if exists "Authenticated users can manage customers" on public.customers;
drop policy if exists "Users manage own customers; admins manage all" on public.customers;
drop policy if exists "Authenticated users can manage incoming shipments" on public.incoming_shipments;
drop policy if exists "Users manage own incoming shipments; admins manage all" on public.incoming_shipments;
drop policy if exists "Authenticated users can manage incoming items" on public.incoming_items;
drop policy if exists "Users manage own incoming items; admins manage all" on public.incoming_items;
drop policy if exists "Authenticated users can manage container stock" on public.container_stock;
drop policy if exists "Users manage own container stock; admins manage all" on public.container_stock;
drop policy if exists "Authenticated users can manage orders" on public.orders;
drop policy if exists "Users manage own orders; admins manage all" on public.orders;
drop policy if exists "Authenticated users can manage order items" on public.order_items;
drop policy if exists "Users manage own order items; admins manage all" on public.order_items;
drop policy if exists "Authenticated users can manage activity logs" on public.activity_logs;
drop policy if exists "Users manage own activity logs; admins manage all" on public.activity_logs;

drop policy if exists "Users read own profile; admins read all profiles" on public.profiles;
drop policy if exists "Users insert own profile" on public.profiles;
drop policy if exists "Users update own profile; admins update all profiles" on public.profiles;
drop policy if exists "Profiles are visible to self or admins" on public.profiles;
create policy "Profiles are visible to self or admins"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id or app_private.is_admin());

drop policy if exists "Users can create invited or bootstrap profiles" on public.profiles;
drop policy if exists "Users can create own staff or bootstrap admin profile" on public.profiles;
create policy "Users can create own staff or bootstrap admin profile"
  on public.profiles for insert
  to authenticated
  with check (
    (select auth.uid()) = id
    and status = 'active'
    and (
      (role = 'admin' and app_private.is_first_admin())
      or role = 'staff'
    )
  );

drop policy if exists "Admins can update profiles" on public.profiles;
create policy "Admins can update profiles"
  on public.profiles for update
  to authenticated
  using (
    app_private.is_admin()
    or app_private.can_bootstrap_admin(id)
  )
  with check (
    app_private.is_admin()
    or (app_private.can_bootstrap_admin(id) and role = 'admin' and status = 'active')
  );

drop policy if exists "Admins can delete profiles" on public.profiles;
create policy "Admins can delete profiles"
  on public.profiles for delete
  to authenticated
  using (app_private.is_admin());

drop policy if exists "Authenticated users can read modules" on public.permission_modules;
create policy "Authenticated users can read modules"
  on public.permission_modules for select
  to authenticated
  using (true);

drop policy if exists "Admins can manage modules" on public.permission_modules;
create policy "Admins can manage modules"
  on public.permission_modules for all
  to authenticated
  using (app_private.is_admin())
  with check (app_private.is_admin());

drop policy if exists "Users can read own module access" on public.user_module_access;
create policy "Users can read own module access"
  on public.user_module_access for select
  to authenticated
  using ((select auth.uid()) = user_id or app_private.is_admin());

drop policy if exists "Admins can manage module access" on public.user_module_access;
create policy "Admins can manage module access"
  on public.user_module_access for all
  to authenticated
  using (app_private.is_admin())
  with check (app_private.is_admin());

drop policy if exists "Admins can manage staff invites" on public.staff_invites;
create policy "Admins can manage staff invites"
  on public.staff_invites for all
  to authenticated
  using (app_private.is_admin())
  with check (app_private.is_admin());

drop policy if exists "Users can read own invites" on public.staff_invites;
create policy "Users can read own invites"
  on public.staff_invites for select
  to authenticated
  using (lower(email) = lower((select auth.jwt() ->> 'email')) or app_private.is_admin());

drop policy if exists "Invited users can accept own invite" on public.staff_invites;
create policy "Invited users can accept own invite"
  on public.staff_invites for update
  to authenticated
  using (lower(email) = lower((select auth.jwt() ->> 'email')) and status = 'pending')
  with check (lower(email) = lower((select auth.jwt() ->> 'email')));

drop policy if exists "Admins can read audit logs" on public.admin_audit_logs;
create policy "Admins can read audit logs"
  on public.admin_audit_logs for select
  to authenticated
  using (app_private.is_admin());

drop policy if exists "Admins can insert audit logs" on public.admin_audit_logs;
create policy "Admins can insert audit logs"
  on public.admin_audit_logs for insert
  to authenticated
  with check (app_private.is_admin());

drop policy if exists "Module users can manage inventory sections" on public.inventory_sections;
create policy "Module users can manage inventory sections"
  on public.inventory_sections for all
  to authenticated
  using (
    app_private.has_module_access('inventory')
    or app_private.has_module_access('incoming')
    or app_private.has_module_access('orders')
    or app_private.has_module_access('dashboard')
  )
  with check (
    app_private.has_module_access('inventory')
    or app_private.has_module_access('incoming')
    or app_private.has_module_access('orders')
    or app_private.has_module_access('dashboard')
  );

drop policy if exists "Module users can manage customers" on public.customers;
create policy "Module users can manage customers"
  on public.customers for all
  to authenticated
  using (
    app_private.has_module_access('customers')
    or app_private.has_module_access('orders')
    or app_private.has_module_access('invoices')
    or app_private.has_module_access('dashboard')
  )
  with check (
    app_private.has_module_access('customers')
    or app_private.has_module_access('orders')
    or app_private.has_module_access('invoices')
    or app_private.has_module_access('dashboard')
  );

drop policy if exists "Module users can manage incoming shipments" on public.incoming_shipments;
create policy "Module users can manage incoming shipments"
  on public.incoming_shipments for all
  to authenticated
  using (app_private.has_module_access('incoming') or app_private.has_module_access('dashboard'))
  with check (app_private.has_module_access('incoming') or app_private.has_module_access('dashboard'));

drop policy if exists "Module users can manage incoming items" on public.incoming_items;
create policy "Module users can manage incoming items"
  on public.incoming_items for all
  to authenticated
  using (app_private.has_module_access('incoming') or app_private.has_module_access('dashboard'))
  with check (app_private.has_module_access('incoming') or app_private.has_module_access('dashboard'));

drop policy if exists "Module users can manage container stock" on public.container_stock;
create policy "Module users can manage container stock"
  on public.container_stock for all
  to authenticated
  using (
    app_private.has_module_access('inventory')
    or app_private.has_module_access('incoming')
    or app_private.has_module_access('orders')
    or app_private.has_module_access('dashboard')
  )
  with check (
    app_private.has_module_access('inventory')
    or app_private.has_module_access('incoming')
    or app_private.has_module_access('orders')
    or app_private.has_module_access('dashboard')
  );

drop policy if exists "Module users can manage orders" on public.orders;
create policy "Module users can manage orders"
  on public.orders for all
  to authenticated
  using (
    app_private.has_module_access('orders')
    or app_private.has_module_access('invoices')
    or app_private.has_module_access('dashboard')
  )
  with check (
    app_private.has_module_access('orders')
    or app_private.has_module_access('invoices')
    or app_private.has_module_access('dashboard')
  );

drop policy if exists "Module users can manage order items" on public.order_items;
create policy "Module users can manage order items"
  on public.order_items for all
  to authenticated
  using (
    app_private.has_module_access('orders')
    or app_private.has_module_access('invoices')
    or app_private.has_module_access('dashboard')
  )
  with check (
    app_private.has_module_access('orders')
    or app_private.has_module_access('invoices')
    or app_private.has_module_access('dashboard')
  );

drop policy if exists "Module users can read activity logs" on public.activity_logs;
create policy "Module users can read activity logs"
  on public.activity_logs for select
  to authenticated
  using (app_private.has_module_access('logs') or app_private.has_module_access('dashboard'));

drop policy if exists "Active module users can insert activity logs" on public.activity_logs;
create policy "Active module users can insert activity logs"
  on public.activity_logs for insert
  to authenticated
  with check (app_private.has_any_module_access());

drop policy if exists "Admins can manage activity logs" on public.activity_logs;
create policy "Admins can manage activity logs"
  on public.activity_logs for all
  to authenticated
  using (app_private.is_admin())
  with check (app_private.is_admin());
