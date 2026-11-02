import { NextResponse } from 'next/server';
import { calculateVariantPrice, PriceUnavailableError } from '../../../lib/pricing-service';
import { authorizeStaff, STAFF_ROLES, type StaffRole } from '../../../lib/supabase-server';

export const runtime = 'nodejs';

type Resource =
  | 'categories' | 'materials' | 'products' | 'variants' | 'suppliers'
  | 'supplier-prices' | 'pricing-rules' | 'inventory' | 'inventory-movements' | 'orders'
  | 'enquiries' | 'customers' | 'lab-submissions' | 'promotions'
  | 'content-pages' | 'fulfilment-rules' | 'staff' | 'audit-log';

type ResourceConfig = {
  table: string;
  roles: readonly StaffRole[];
  fields: readonly string[];
  insertOnly?: boolean;
  orderBy: string;
};

const resources: Record<Resource, ResourceConfig> = {
  categories: { table: 'qutlas_categories', roles: ['catalogue_manager'], fields: ['parent_id', 'slug', 'name', 'description', 'is_active', 'sort_order'], orderBy: 'sort_order' },
  materials: { table: 'qutlas_materials', roles: ['catalogue_manager'], fields: ['category_id', 'slug', 'name', 'grade', 'specification', 'pricing_unit', 'density_kg_m3', 'standard_stock_size', 'status'], orderBy: 'name' },
  products: { table: 'qutlas_products', roles: ['catalogue_manager'], fields: ['category_id', 'material_id', 'slug', 'sku', 'name', 'description', 'attributes', 'seo_title', 'seo_description', 'status', 'published_at'], orderBy: 'name' },
  variants: { table: 'qutlas_product_variants', roles: ['catalogue_manager'], fields: ['product_id', 'sku', 'name', 'attributes', 'pricing_unit', 'minimum_quantity', 'maximum_quantity', 'quantity_step', 'is_active'], orderBy: 'name' },
  suppliers: { table: 'qutlas_suppliers', roles: ['pricing_manager'], fields: ['name', 'contact_name', 'email', 'phone', 'location', 'supplied_categories', 'delivery_terms', 'notes', 'status'], orderBy: 'name' },
  'supplier-prices': { table: 'qutlas_supplier_prices', roles: ['pricing_manager'], fields: ['supplier_id', 'variant_id', 'cost_minor', 'currency', 'pricing_unit', 'source', 'effective_at', 'valid_until', 'notes'], insertOnly: true, orderBy: 'recorded_at' },
  'pricing-rules': { table: 'qutlas_pricing_rules', roles: ['pricing_manager'], fields: ['variant_id', 'supplier_price_id', 'version', 'pricing_unit', 'wastage_bps', 'processing_minor_per_unit', 'labour_minor_per_unit', 'setup_minor', 'margin_bps', 'tax_bps', 'minimum_job_minor', 'effective_at', 'valid_until', 'notes'], insertOnly: true, orderBy: 'created_at' },
  inventory: { table: 'qutlas_inventory', roles: ['inventory_manager'], fields: [], orderBy: 'updated_at' },
  'inventory-movements': { table: 'qutlas_stock_movements', roles: ['inventory_manager'], fields: [], orderBy: 'created_at' },
  orders: { table: 'qutlas_orders', roles: ['order_manager', 'production_manager'], fields: ['production_assignee', 'fulfilment_details', 'internal_notes'], orderBy: 'created_at' },
  enquiries: { table: 'enquiries', roles: ['customer_support'], fields: ['status'], orderBy: 'created_at' },
  customers: { table: 'qutlas_customer_profiles', roles: ['customer_support'], fields: ['full_name', 'phone', 'company_name'], orderBy: 'created_at' },
  'lab-submissions': { table: 'qutlas_lab_submissions', roles: ['customer_support'], fields: ['status', 'assignee', 'internal_notes'], orderBy: 'created_at' },
  promotions: { table: 'qutlas_promotions', roles: ['catalogue_manager'], fields: ['name', 'code', 'discount_type', 'discount_value', 'currency', 'starts_at', 'ends_at', 'is_active', 'conditions'], orderBy: 'created_at' },
  'content-pages': { table: 'qutlas_content_pages', roles: ['catalogue_manager'], fields: ['slug', 'title', 'body', 'status', 'published_at'], orderBy: 'slug' },
  'fulfilment-rules': { table: 'qutlas_fulfilment_rules', roles: ['order_manager'], fields: ['method', 'region_code', 'charge_minor', 'currency', 'effective_at', 'valid_until', 'is_active'], orderBy: 'effective_at' },
  staff: { table: 'qutlas_staff_roles', roles: ['super_admin'], fields: ['user_id', 'role'], orderBy: 'granted_at' },
  'audit-log': { table: 'qutlas_admin_audit_log', roles: ['super_admin', 'reporting'], fields: [], orderBy: 'created_at' },
};

type RouteContext = { params: Promise<{ resource: string }> };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function getConfig(context: RouteContext) {
  const { resource } = await context.params;
  if (!Object.prototype.hasOwnProperty.call(resources, resource)) return null;
  return { resource: resource as Resource, config: resources[resource as Resource] };
}

async function getAuthorized(request: Request, context: RouteContext) {
  const selected = await getConfig(context);
  if (!selected) return { response: NextResponse.json({ error: 'Unknown admin resource.' }, { status: 404 }) };
  const authorization = await authorizeStaff(request, selected.config.roles);
  if (!authorization.ok) return { response: authorization.response };
  return { ...selected, staff: authorization.context };
}

export async function GET(request: Request, context: RouteContext) {
  const access = await getAuthorized(request, context);
  if ('response' in access) return access.response;

  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') ?? 50) || 50));
  const selection = access.resource === 'orders'
    ? '*, qutlas_order_items(id, sku_snapshot, name_snapshot, configuration, quantity, unit, unit_price_minor, line_total_minor), qutlas_order_status_history(*)'
    : '*';
  let query = access.staff.admin.from(access.config.table).select(selection).order(access.config.orderBy, { ascending: false }).limit(limit);
  if (id) query = query.eq('id', id);
  const status = url.searchParams.get('status');
  if (status && access.config.fields.includes('status')) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) {
    console.error(`Admin list failed for ${access.resource}:`, error);
    return NextResponse.json({ error: 'Could not load this admin resource.' }, { status: 503 });
  }

  return NextResponse.json(data ?? [], { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: Request, context: RouteContext) {
  const access = await getAuthorized(request, context);
  if ('response' in access) return access.response;

  let body: unknown;
  try {
    if (Number(request.headers.get('content-length') ?? '0') > 64 * 1024) {
      return NextResponse.json({ error: 'Request is too large.' }, { status: 413 });
    }
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (!isRecord(body)) return NextResponse.json({ error: 'A resource object is required.' }, { status: 400 });
  const unknownFields = Object.keys(body).filter((key) => !access.config.fields.includes(key));
  if (unknownFields.length) return NextResponse.json({ error: `Unsupported fields: ${unknownFields.join(', ')}` }, { status: 400 });
  if (!Object.keys(body).length) return NextResponse.json({ error: 'At least one field is required.' }, { status: 400 });
  if (access.resource === 'products' && body.status === 'active') {
    return NextResponse.json({ error: 'Create products as drafts, then validate pricing before publication.' }, { status: 409 });
  }

  const payload = { ...body };
  if (access.resource === 'pricing-rules') {
    Object.assign(payload, { created_by: access.staff.userId, is_approved: false });
  }
  if (access.resource === 'supplier-prices') Object.assign(payload, { recorded_by: access.staff.userId });
  if (access.resource === 'fulfilment-rules') Object.assign(payload, { created_by: access.staff.userId });
  if (access.resource === 'staff') Object.assign(payload, { granted_by: access.staff.userId });

  const { data, error } = await access.staff.admin
    .from(access.config.table)
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error(`Admin create failed for ${access.resource}:`, error);
    return NextResponse.json({ error: 'Could not create this record. Check required fields and relationships.' }, { status: 400 });
  }

  await access.staff.admin.from('qutlas_admin_audit_log').insert({
    actor_id: access.staff.userId,
    action: 'create',
    resource_type: access.resource,
    resource_id: String(data.id ?? data.user_id ?? ''),
  });

  return NextResponse.json(data, { status: 201, headers: { 'Cache-Control': 'no-store' } });
}

export async function PATCH(request: Request, context: RouteContext) {
  const access = await getAuthorized(request, context);
  if ('response' in access) return access.response;
  if (access.config.insertOnly) return NextResponse.json({ error: 'This resource is immutable; create a new version.' }, { status: 405 });

  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'A record id is required.' }, { status: 400 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (!isRecord(body)) return NextResponse.json({ error: 'A resource object is required.' }, { status: 400 });
  const unknownFields = Object.keys(body).filter((key) => !access.config.fields.includes(key));
  if (unknownFields.length) return NextResponse.json({ error: `Unsupported fields: ${unknownFields.join(', ')}` }, { status: 400 });
  if (!Object.keys(body).length) return NextResponse.json({ error: 'At least one field is required.' }, { status: 400 });

  if (access.resource === 'products' && body.status === 'active') {
    const { data: variants, error: variantError } = await access.staff.admin
      .from('qutlas_product_variants')
      .select('id, minimum_quantity')
      .eq('product_id', id)
      .eq('is_active', true);
    if (variantError || !variants?.length) {
      return NextResponse.json({ error: 'A product needs an active variant and approved price before publication.' }, { status: 409 });
    }
    let hasCurrentPrice = false;
    for (const variant of variants) {
      try {
        await calculateVariantPrice(access.staff.admin, variant.id, String(variant.minimum_quantity), new Date(), false);
        hasCurrentPrice = true;
        break;
      } catch (priceError) {
        if (!(priceError instanceof PriceUnavailableError)) throw priceError;
      }
    }
    if (!hasCurrentPrice) {
      return NextResponse.json({ error: 'A product needs an approved, effective pricing rule before publication.' }, { status: 409 });
    }
  }

  const updates: Record<string, unknown> = { ...body };
  if (['categories', 'materials', 'products', 'variants', 'suppliers', 'lab-submissions', 'content-pages'].includes(access.resource)) {
    updates.updated_at = new Date().toISOString();
  }
  if (access.resource === 'products' && updates.status === 'active' && !updates.published_at) {
    updates.published_at = new Date().toISOString();
  }

  const { data: before } = await access.staff.admin.from(access.config.table).select('*').eq('id', id).maybeSingle();
  const { data, error } = await access.staff.admin
    .from(access.config.table)
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) {
    console.error(`Admin update failed for ${access.resource}:`, error);
    return NextResponse.json({ error: 'Could not update this record.' }, { status: 400 });
  }
  if (!data) return NextResponse.json({ error: 'Record not found.' }, { status: 404 });

  const sensitiveResource = ['customers', 'enquiries', 'orders', 'lab-submissions'].includes(access.resource);
  await access.staff.admin.from('qutlas_admin_audit_log').insert({
    actor_id: access.staff.userId,
    action: 'update',
    resource_type: access.resource,
    resource_id: id,
    before_data: sensitiveResource ? null : before,
    after_data: sensitiveResource ? null : data,
  });

  return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
}

export async function DELETE(request: Request, context: RouteContext) {
  const access = await getAuthorized(request, context);
  if ('response' in access) return access.response;
  if (access.resource !== 'staff' || !access.staff.roles.includes('super_admin')) {
    return NextResponse.json({ error: 'Only a super administrator can revoke staff roles.' }, { status: 403 });
  }

  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');
  const role = url.searchParams.get('role');
  if (!userId || !/^[0-9a-f-]{36}$/i.test(userId) || !role || !STAFF_ROLES.includes(role as StaffRole)) {
    return NextResponse.json({ error: 'A valid staff user and role are required.' }, { status: 400 });
  }

  if (role === 'super_admin') {
    const { count, error: countError } = await access.staff.admin
      .from('qutlas_staff_roles')
      .select('user_id', { count: 'exact', head: true })
      .eq('role', 'super_admin');
    if (countError) return NextResponse.json({ error: 'Could not verify administrator assignments.' }, { status: 503 });
    if ((count ?? 0) <= 1) return NextResponse.json({ error: 'The final super administrator cannot be removed.' }, { status: 409 });
  }

  const { data: removed, error } = await access.staff.admin
    .from('qutlas_staff_roles')
    .delete()
    .eq('user_id', userId)
    .eq('role', role)
    .select('user_id, role')
    .maybeSingle();
  if (error) return NextResponse.json({ error: 'Staff role could not be revoked.' }, { status: 503 });
  if (!removed) return NextResponse.json({ error: 'Staff role was not found.' }, { status: 404 });

  await access.staff.admin.from('qutlas_admin_audit_log').insert({
    actor_id: access.staff.userId,
    action: 'revoke_role',
    resource_type: 'staff',
    resource_id: userId,
    before_data: { role },
  });
  return NextResponse.json({ revoked: true });
}