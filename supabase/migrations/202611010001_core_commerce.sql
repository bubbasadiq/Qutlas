create extension if not exists pgcrypto;

create table if not exists public.qutlas_categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.qutlas_categories(id) on delete set null,
  slug text not null unique,
  name text not null,
  description text,
  is_active boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.qutlas_materials (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.qutlas_categories(id) on delete set null,
  slug text not null unique,
  name text not null,
  grade text,
  specification jsonb not null default '{}'::jsonb,
  pricing_unit text not null,
  density_kg_m3 numeric(18, 6),
  standard_stock_size jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.qutlas_suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_name text,
  email text,
  phone text,
  location text,
  supplied_categories text[] not null default '{}',
  delivery_terms text,
  notes text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.qutlas_products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.qutlas_categories(id) on delete restrict,
  material_id uuid references public.qutlas_materials(id) on delete set null,
  slug text not null unique,
  sku text not null unique,
  name text not null,
  description text not null default '',
  attributes jsonb not null default '{}'::jsonb,
  seo_title text,
  seo_description text,
  status text not null default 'draft' check (status in ('draft', 'incomplete', 'awaiting_cost', 'awaiting_pricing', 'active', 'out_of_stock', 'unavailable', 'archived')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.qutlas_product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.qutlas_products(id) on delete cascade,
  sku text not null unique,
  name text not null,
  attributes jsonb not null default '{}'::jsonb,
  pricing_unit text not null,
  minimum_quantity numeric(18, 6) not null default 1 check (minimum_quantity > 0),
  maximum_quantity numeric(18, 6) check (maximum_quantity is null or maximum_quantity >= minimum_quantity),
  quantity_step numeric(18, 6) not null default 1 check (quantity_step > 0),
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.qutlas_supplier_prices (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.qutlas_suppliers(id) on delete restrict,
  variant_id uuid not null references public.qutlas_product_variants(id) on delete restrict,
  cost_minor bigint not null check (cost_minor >= 0),
  currency char(3) not null,
  pricing_unit text not null,
  source text not null,
  effective_at timestamptz not null,
  valid_until timestamptz,
  recorded_by uuid references auth.users(id) on delete set null,
  recorded_at timestamptz not null default now(),
  notes text,
  check (valid_until is null or valid_until > effective_at)
);

create table if not exists public.qutlas_pricing_rules (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.qutlas_product_variants(id) on delete restrict,
  supplier_price_id uuid not null references public.qutlas_supplier_prices(id) on delete restrict,
  version integer not null check (version > 0),
  pricing_unit text not null,
  wastage_bps integer not null default 0 check (wastage_bps between 0 and 100000),
  processing_minor_per_unit bigint not null default 0 check (processing_minor_per_unit >= 0),
  labour_minor_per_unit bigint not null default 0 check (labour_minor_per_unit >= 0),
  setup_minor bigint not null default 0 check (setup_minor >= 0),
  margin_bps integer not null check (margin_bps between 0 and 100000),
  tax_bps integer not null default 0 check (tax_bps between 0 and 100000),
  minimum_job_minor bigint not null default 0 check (minimum_job_minor >= 0),
  effective_at timestamptz not null,
  valid_until timestamptz,
  is_approved boolean not null default false,
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  notes text,
  unique (variant_id, version),
  check (valid_until is null or valid_until > effective_at),
  check (not is_approved or (approved_by is not null and approved_at is not null))
);

create table if not exists public.qutlas_inventory (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.qutlas_product_variants(id) on delete restrict,
  location text not null,
  unit text not null,
  on_hand numeric(18, 6) not null default 0 check (on_hand >= 0),
  reserved numeric(18, 6) not null default 0 check (reserved >= 0 and reserved <= on_hand),
  damaged numeric(18, 6) not null default 0 check (damaged >= 0 and damaged <= on_hand),
  incoming numeric(18, 6) not null default 0 check (incoming >= 0),
  reorder_threshold numeric(18, 6) check (reorder_threshold is null or reorder_threshold >= 0),
  updated_at timestamptz not null default now(),
  unique (variant_id, location, unit)
);

create table if not exists public.qutlas_stock_movements (
  id uuid primary key default gen_random_uuid(),
  inventory_id uuid not null references public.qutlas_inventory(id) on delete restrict,
  movement_type text not null check (movement_type in ('receipt', 'reservation', 'release', 'dispatch', 'damage', 'adjustment')),
  quantity_delta numeric(18, 6) not null check (quantity_delta <> 0),
  reference text,
  notes text,
  actor_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.qutlas_customer_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text,
  company_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.qutlas_customer_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null default 'Address',
  recipient_name text not null,
  phone text,
  address_line_1 text not null,
  address_line_2 text,
  city text not null,
  region text,
  postal_code text,
  country_code char(2) not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.qutlas_orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  customer_id uuid references auth.users(id) on delete set null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  delivery_address jsonb not null,
  idempotency_key text not null unique,
  request_fingerprint text not null,
  reservation_expires_at timestamptz,
  currency char(3) not null,
  status text not null default 'pending_payment' check (status in ('pending_payment', 'payment_confirmed', 'confirmed', 'awaiting_production', 'in_production', 'quality_check', 'ready_for_dispatch', 'dispatched', 'delivered', 'cancelled', 'refunded')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'pending', 'paid', 'failed', 'partially_refunded', 'refunded')),
  subtotal_minor bigint not null check (subtotal_minor >= 0),
  tax_minor bigint not null default 0 check (tax_minor >= 0),
  delivery_minor bigint not null default 0 check (delivery_minor >= 0),
  total_minor bigint not null check (total_minor >= 0),
  payment_provider text,
  production_assignee uuid references auth.users(id) on delete set null,
  fulfilment_details jsonb not null default '{}'::jsonb,
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (total_minor = subtotal_minor + tax_minor + delivery_minor)
);

create table if not exists public.qutlas_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.qutlas_orders(id) on delete cascade,
  inventory_id uuid references public.qutlas_inventory(id) on delete restrict,
  product_id uuid references public.qutlas_products(id) on delete set null,
  variant_id uuid references public.qutlas_product_variants(id) on delete set null,
  sku_snapshot text not null,
  name_snapshot text not null,
  configuration jsonb not null default '{}'::jsonb,
  pricing_snapshot jsonb not null,
  quantity numeric(18, 6) not null check (quantity > 0),
  unit text not null,
  unit_price_minor bigint not null check (unit_price_minor >= 0),
  line_total_minor bigint not null check (line_total_minor >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.qutlas_order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.qutlas_orders(id) on delete cascade,
  previous_status text not null,
  next_status text not null,
  actor_id uuid references auth.users(id) on delete set null,
  note text,
  changed_at timestamptz not null default now()
);

create table if not exists public.qutlas_payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.qutlas_orders(id) on delete restrict,
  provider text not null,
  provider_reference text,
  amount_minor bigint not null check (amount_minor > 0),
  currency char(3) not null,
  status text not null check (status in ('created', 'pending', 'succeeded', 'failed', 'cancelled', 'refunded')),
  idempotency_key text not null unique,
  verified_at timestamptz,
  provider_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.qutlas_staff_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('super_admin', 'catalogue_manager', 'pricing_manager', 'inventory_manager', 'order_manager', 'customer_support', 'production_manager', 'reporting')),
  granted_by uuid references auth.users(id) on delete set null,
  granted_at timestamptz not null default now(),
  primary key (user_id, role)
);

create table if not exists public.qutlas_admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id text,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.qutlas_lab_submissions (
  id uuid primary key default gen_random_uuid(),
  submission_type text not null check (submission_type in ('host', 'participant')),
  name text not null,
  email text not null,
  organisation text,
  location text,
  organisation_type text,
  interest text,
  message text,
  status text not null default 'new' check (status in ('new', 'reviewing', 'contacted', 'accepted', 'declined', 'closed')),
  assignee uuid references auth.users(id) on delete set null,
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.qutlas_promotions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text unique,
  discount_type text not null check (discount_type in ('fixed_minor', 'basis_points')),
  discount_value bigint not null check (discount_value > 0),
  currency char(3),
  starts_at timestamptz not null,
  ends_at timestamptz,
  is_active boolean not null default false,
  conditions jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (ends_at is null or ends_at > starts_at),
  check ((discount_type = 'fixed_minor' and currency is not null) or (discount_type = 'basis_points' and discount_value <= 10000))
);

create table if not exists public.qutlas_fulfilment_rules (
  id uuid primary key default gen_random_uuid(),
  method text not null check (method in ('delivery', 'collection')),
  region_code text not null default '*',
  charge_minor bigint not null check (charge_minor >= 0),
  currency char(3) not null,
  effective_at timestamptz not null,
  valid_until timestamptz,
  is_active boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (valid_until is null or valid_until > effective_at)
);

create table if not exists public.qutlas_featured_products (
  slot text not null,
  product_id uuid not null references public.qutlas_products(id) on delete cascade,
  sort_order integer not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  primary key (slot, product_id)
);

create table if not exists public.qutlas_content_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  body jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create index if not exists qutlas_products_category_idx on public.qutlas_products(category_id, status);
create index if not exists qutlas_variants_product_idx on public.qutlas_product_variants(product_id, is_active);
create index if not exists qutlas_supplier_prices_variant_date_idx on public.qutlas_supplier_prices(variant_id, effective_at desc);
create index if not exists qutlas_pricing_rules_variant_effective_idx on public.qutlas_pricing_rules(variant_id, effective_at desc) where is_approved;
create index if not exists qutlas_inventory_variant_idx on public.qutlas_inventory(variant_id);
create index if not exists qutlas_stock_movements_inventory_idx on public.qutlas_stock_movements(inventory_id, created_at desc);
create index if not exists qutlas_orders_customer_idx on public.qutlas_orders(customer_id, created_at desc);
create index if not exists qutlas_orders_status_idx on public.qutlas_orders(status, created_at desc);
create index if not exists qutlas_order_items_order_idx on public.qutlas_order_items(order_id);
create index if not exists qutlas_order_history_order_idx on public.qutlas_order_status_history(order_id, changed_at desc);
create index if not exists qutlas_payments_order_idx on public.qutlas_payments(order_id, created_at desc);
create unique index if not exists qutlas_payments_provider_reference_uidx on public.qutlas_payments(provider, provider_reference) where provider_reference is not null;
create index if not exists qutlas_lab_submissions_status_idx on public.qutlas_lab_submissions(status, created_at desc);
create index if not exists qutlas_audit_created_idx on public.qutlas_admin_audit_log(created_at desc);

alter table public.qutlas_categories enable row level security;
alter table public.qutlas_materials enable row level security;
alter table public.qutlas_products enable row level security;
alter table public.qutlas_product_variants enable row level security;
alter table public.qutlas_suppliers enable row level security;
alter table public.qutlas_supplier_prices enable row level security;
alter table public.qutlas_pricing_rules enable row level security;
alter table public.qutlas_inventory enable row level security;
alter table public.qutlas_stock_movements enable row level security;
alter table public.qutlas_customer_profiles enable row level security;
alter table public.qutlas_customer_addresses enable row level security;
alter table public.qutlas_orders enable row level security;
alter table public.qutlas_order_items enable row level security;
alter table public.qutlas_order_status_history enable row level security;
alter table public.qutlas_payments enable row level security;
alter table public.qutlas_staff_roles enable row level security;
alter table public.qutlas_admin_audit_log enable row level security;
alter table public.qutlas_lab_submissions enable row level security;
alter table public.qutlas_promotions enable row level security;
alter table public.qutlas_featured_products enable row level security;
alter table public.qutlas_content_pages enable row level security;
alter table public.qutlas_fulfilment_rules enable row level security;

create policy qutlas_categories_public_read on public.qutlas_categories
  for select to anon, authenticated using (is_active);

create policy qutlas_materials_public_read on public.qutlas_materials
  for select to anon, authenticated using (status = 'active');

create policy qutlas_products_public_read on public.qutlas_products
  for select to anon, authenticated using (status = 'active' and published_at is not null);

create policy qutlas_variants_public_read on public.qutlas_product_variants
  for select to anon, authenticated using (
    is_active and exists (
      select 1 from public.qutlas_products p
      where p.id = product_id and p.status = 'active' and p.published_at is not null
    )
  );

create policy qutlas_customer_profile_own_read on public.qutlas_customer_profiles
  for select to authenticated using (user_id = (select auth.uid()));
create policy qutlas_customer_profile_own_insert on public.qutlas_customer_profiles
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy qutlas_customer_profile_own_update on public.qutlas_customer_profiles
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy qutlas_customer_addresses_own_all on public.qutlas_customer_addresses
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy qutlas_orders_own_read on public.qutlas_orders
  for select to authenticated using (customer_id = (select auth.uid()));

create policy qutlas_order_items_own_read on public.qutlas_order_items
  for select to authenticated using (
    exists (select 1 from public.qutlas_orders o where o.id = order_id and o.customer_id = (select auth.uid()))
  );

create policy qutlas_order_history_own_read on public.qutlas_order_status_history
  for select to authenticated using (
    exists (select 1 from public.qutlas_orders o where o.id = order_id and o.customer_id = (select auth.uid()))
  );

create policy qutlas_payments_own_read on public.qutlas_payments
  for select to authenticated using (
    exists (select 1 from public.qutlas_orders o where o.id = order_id and o.customer_id = (select auth.uid()))
  );

revoke all on all tables in schema public from anon, authenticated;
grant select on public.qutlas_categories, public.qutlas_materials, public.qutlas_products, public.qutlas_product_variants to anon, authenticated;

create or replace function public.qutlas_admin_overview()
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'order_statuses', coalesce((
      select jsonb_object_agg(status, order_count)
      from (select status, count(*)::integer as order_count from public.qutlas_orders group by status) counts
    ), '{}'::jsonb),
    'paid_revenue_minor', coalesce((
      select sum(total_minor)::text from public.qutlas_orders where payment_status = 'paid'
    ), '0'),
    'average_paid_order_minor', coalesce((
      select (sum(total_minor) / nullif(count(*), 0))::text from public.qutlas_orders where payment_status = 'paid'
    ), '0'),
    'products_awaiting_pricing', (
      select count(*)::integer from public.qutlas_products where status in ('awaiting_cost', 'awaiting_pricing')
    ),
    'low_stock_count', (
      select count(*)::integer from public.qutlas_inventory
      where reorder_threshold is not null and on_hand - reserved - damaged <= reorder_threshold
    ),
    'pending_enquiries', (
      select count(*)::integer from public.enquiries where status = 'new'
    ),
    'pending_lab_submissions', (
      select count(*)::integer from public.qutlas_lab_submissions where status = 'new'
    ),
    'top_products', coalesce((
      select jsonb_agg(to_jsonb(top_sellers)) from (
        select item.sku_snapshot, item.name_snapshot,
          sum(item.quantity)::text as quantity,
          sum(item.line_total_minor)::text as revenue_minor
        from public.qutlas_order_items item
        join public.qutlas_orders ord on ord.id = item.order_id
        where ord.payment_status = 'paid'
        group by item.sku_snapshot, item.name_snapshot
        order by sum(item.quantity) desc
        limit 5
      ) top_sellers
    ), '[]'::jsonb)
  );
$$;

revoke all on function public.qutlas_admin_overview() from public, anon, authenticated;
grant execute on function public.qutlas_admin_overview() to service_role;

create or replace function public.qutlas_create_order(p_order jsonb, p_items jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order_id uuid;
  v_item jsonb;
  v_inventory public.qutlas_inventory%rowtype;
  v_quantity numeric(18, 6);
  v_reference text;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'An order must contain at least one item' using errcode = '22023';
  end if;

  v_reference := 'QO-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));

  insert into public.qutlas_orders (
    reference, customer_id, customer_name, customer_email, customer_phone,
    delivery_address, idempotency_key, request_fingerprint, currency,
    status, payment_status, subtotal_minor, tax_minor, delivery_minor, total_minor
  ) values (
    v_reference, (p_order->>'customer_id')::uuid, p_order->>'customer_name',
    p_order->>'customer_email', p_order->>'customer_phone', p_order->'delivery_address',
    p_order->>'idempotency_key', p_order->>'request_fingerprint', p_order->>'currency',
    'pending_payment', 'unpaid', (p_order->>'subtotal_minor')::bigint,
    (p_order->>'tax_minor')::bigint, (p_order->>'delivery_minor')::bigint,
    (p_order->>'total_minor')::bigint
  ) returning id into v_order_id;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_quantity := (v_item->>'quantity')::numeric;

    select * into v_inventory
    from public.qutlas_inventory
    where id = (v_item->>'inventory_id')::uuid
    for update;

    if not found or v_inventory.unit <> v_item->>'unit' then
      raise exception 'Inventory record is unavailable' using errcode = '23514';
    end if;
    if v_quantity <= 0 or v_quantity > v_inventory.on_hand - v_inventory.reserved - v_inventory.damaged then
      raise exception 'Insufficient available stock' using errcode = '23514';
    end if;

    update public.qutlas_inventory
    set reserved = reserved + v_quantity, updated_at = now()
    where id = v_inventory.id;

    insert into public.qutlas_stock_movements (
      inventory_id, movement_type, quantity_delta, reference, actor_id
    ) values (
      v_inventory.id, 'reservation', v_quantity, v_reference, (p_order->>'customer_id')::uuid
    );

    insert into public.qutlas_order_items (
      order_id, inventory_id, product_id, variant_id, sku_snapshot, name_snapshot,
      configuration, pricing_snapshot, quantity, unit, unit_price_minor, line_total_minor
    ) values (
      v_order_id, v_inventory.id, nullif(v_item->>'product_id', '')::uuid,
      (v_item->>'variant_id')::uuid, v_item->>'sku_snapshot', v_item->>'name_snapshot',
      coalesce(v_item->'configuration', '{}'::jsonb), v_item->'pricing_snapshot',
      v_quantity, v_item->>'unit', (v_item->>'unit_price_minor')::bigint,
      (v_item->>'line_total_minor')::bigint
    );
  end loop;

  return jsonb_build_object('id', v_order_id, 'reference', v_reference);
end;
$$;

revoke all on function public.qutlas_create_order(jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.qutlas_create_order(jsonb, jsonb) to service_role;

create or replace function public.qutlas_set_order_status(
  p_order_id uuid,
  p_next_status text,
  p_actor_id uuid,
  p_note text default null
)
returns public.qutlas_orders
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order public.qutlas_orders%rowtype;
  v_item record;
  v_previous_status text;
begin
  select * into v_order from public.qutlas_orders where id = p_order_id for update;
  if not found then raise exception 'Order not found' using errcode = 'P0002'; end if;
  if p_next_status = v_order.status then return v_order; end if;
  v_previous_status := v_order.status;
  if p_next_status = 'payment_confirmed' then
    raise exception 'Payment status can only be changed by verified provider confirmation' using errcode = '42501';
  end if;

  if not (
    (v_order.status = 'pending_payment' and v_order.payment_status = 'unpaid' and p_next_status = 'cancelled') or
    (v_order.status = 'payment_confirmed' and p_next_status = 'confirmed') or
    (v_order.status = 'confirmed' and p_next_status = 'awaiting_production') or
    (v_order.status = 'awaiting_production' and p_next_status = 'in_production') or
    (v_order.status = 'in_production' and p_next_status = 'quality_check') or
    (v_order.status = 'quality_check' and p_next_status in ('in_production', 'ready_for_dispatch')) or
    (v_order.status = 'ready_for_dispatch' and p_next_status = 'dispatched') or
    (v_order.status = 'dispatched' and p_next_status = 'delivered')
  ) then
    raise exception 'Invalid order status transition' using errcode = '23514';
  end if;

  if p_next_status = 'cancelled' then
    for v_item in
      select inventory_id, quantity from public.qutlas_order_items
      where order_id = p_order_id and inventory_id is not null
    loop
      update public.qutlas_inventory
      set reserved = greatest(0, reserved - v_item.quantity), updated_at = now()
      where id = v_item.inventory_id;
      insert into public.qutlas_stock_movements (
        inventory_id, movement_type, quantity_delta, reference, actor_id, notes
      ) values (
        v_item.inventory_id, 'release', -v_item.quantity, v_order.reference, p_actor_id, 'Released after order cancellation'
      );
    end loop;
  elsif p_next_status = 'dispatched' then
    for v_item in
      select inventory_id, quantity from public.qutlas_order_items
      where order_id = p_order_id and inventory_id is not null
    loop
      update public.qutlas_inventory
      set on_hand = on_hand - v_item.quantity,
          reserved = greatest(0, reserved - v_item.quantity),
          updated_at = now()
      where id = v_item.inventory_id
        and on_hand >= v_item.quantity
        and reserved >= v_item.quantity;
      if not found then
        raise exception 'Reserved inventory changed before dispatch' using errcode = '23514';
      end if;
      insert into public.qutlas_stock_movements (
        inventory_id, movement_type, quantity_delta, reference, actor_id, notes
      ) values (
        v_item.inventory_id, 'dispatch', -v_item.quantity, v_order.reference, p_actor_id, 'Stock dispatched against order'
      );
    end loop;
  end if;

  update public.qutlas_orders
  set status = p_next_status, updated_at = now()
  where id = p_order_id returning * into v_order;

  insert into public.qutlas_order_status_history(order_id, previous_status, next_status, actor_id, note)
  values (p_order_id, v_previous_status, p_next_status, p_actor_id, left(p_note, 2000));

  return v_order;
end;
$$;

revoke all on function public.qutlas_set_order_status(uuid, text, uuid, text) from public, anon, authenticated;
grant execute on function public.qutlas_set_order_status(uuid, text, uuid, text) to service_role;

create or replace function public.qutlas_adjust_inventory(
  p_inventory_id uuid,
  p_movement_type text,
  p_quantity numeric,
  p_actor_id uuid,
  p_reference text default null,
  p_notes text default null
)
returns public.qutlas_inventory
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_inventory public.qutlas_inventory%rowtype;
begin
  if p_quantity = 0 or p_movement_type not in ('receipt', 'damage', 'adjustment') then
    raise exception 'Invalid inventory adjustment' using errcode = '22023';
  end if;

  select * into v_inventory from public.qutlas_inventory where id = p_inventory_id for update;
  if not found then raise exception 'Inventory record not found' using errcode = 'P0002'; end if;

  if p_movement_type = 'receipt' then
    if p_quantity < 0 then raise exception 'Receipt quantity must be positive' using errcode = '22023'; end if;
    update public.qutlas_inventory set on_hand = on_hand + p_quantity, updated_at = now()
      where id = p_inventory_id returning * into v_inventory;
  elsif p_movement_type = 'damage' then
    if p_quantity < 0 or p_quantity > v_inventory.on_hand - v_inventory.reserved - v_inventory.damaged then
      raise exception 'Damaged quantity exceeds available stock' using errcode = '23514';
    end if;
    update public.qutlas_inventory set damaged = damaged + p_quantity, updated_at = now()
      where id = p_inventory_id returning * into v_inventory;
  else
    if v_inventory.on_hand + p_quantity < v_inventory.reserved + v_inventory.damaged then
      raise exception 'Adjustment would reduce stock below reserved and damaged quantities' using errcode = '23514';
    end if;
    update public.qutlas_inventory set on_hand = on_hand + p_quantity, updated_at = now()
      where id = p_inventory_id returning * into v_inventory;
  end if;

  insert into public.qutlas_stock_movements(inventory_id, movement_type, quantity_delta, reference, notes, actor_id)
  values (p_inventory_id, p_movement_type, p_quantity, left(p_reference, 200), left(p_notes, 2000), p_actor_id);
  return v_inventory;
end;
$$;

revoke all on function public.qutlas_adjust_inventory(uuid, text, numeric, uuid, text, text) from public, anon, authenticated;
grant execute on function public.qutlas_adjust_inventory(uuid, text, numeric, uuid, text, text) to service_role;

create or replace function public.qutlas_confirm_payment(
  p_provider_reference text,
  p_amount_minor bigint,
  p_currency char(3),
  p_provider_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_payment public.qutlas_payments%rowtype;
  v_order public.qutlas_orders%rowtype;
begin
  select * into v_payment
  from public.qutlas_payments
  where provider = 'paystack' and provider_reference = p_provider_reference
  for update;

  if not found then
    raise exception 'Payment reference not found' using errcode = 'P0002';
  end if;
  if v_payment.amount_minor <> p_amount_minor or v_payment.currency <> p_currency then
    raise exception 'Verified payment amount or currency does not match' using errcode = '23514';
  end if;
  if v_payment.status = 'succeeded' then
    return jsonb_build_object('confirmed', true, 'duplicate', true, 'order_id', v_payment.order_id);
  end if;

  select * into v_order from public.qutlas_orders where id = v_payment.order_id for update;
  if not found or v_order.status in ('cancelled', 'refunded') then
    raise exception 'Order is not payable' using errcode = '23514';
  end if;

  update public.qutlas_payments
  set status = 'succeeded', verified_at = now(), provider_payload = p_provider_payload, updated_at = now()
  where id = v_payment.id;

  update public.qutlas_orders
  set payment_status = 'paid',
      status = case when status = 'pending_payment' then 'payment_confirmed' else status end,
      updated_at = now()
  where id = v_order.id;

  if v_order.status = 'pending_payment' then
    insert into public.qutlas_order_status_history(order_id, previous_status, next_status, note)
    values (v_order.id, 'pending_payment', 'payment_confirmed', 'Confirmed by verified Paystack webhook');
  end if;

  return jsonb_build_object('confirmed', true, 'duplicate', false, 'order_id', v_order.id);
end;
$$;

revoke all on function public.qutlas_confirm_payment(text, bigint, char, jsonb) from public, anon, authenticated;
grant execute on function public.qutlas_confirm_payment(text, bigint, char, jsonb) to service_role;