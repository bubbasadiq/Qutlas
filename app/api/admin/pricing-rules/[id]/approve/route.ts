import { NextResponse } from 'next/server';
import { authorizeStaff } from '../../../../../lib/supabase-server';

export const runtime = 'nodejs';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const authorization = await authorizeStaff(request, ['pricing_manager']);
  if (!authorization.ok) return authorization.response;

  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: 'Invalid pricing rule reference.' }, { status: 400 });
  }

  const admin = authorization.context.admin;
  const now = new Date();
  const { data: rule, error: ruleError } = await admin
    .from('qutlas_pricing_rules')
    .select('id, variant_id, supplier_price_id, pricing_unit, effective_at, valid_until, is_approved')
    .eq('id', id)
    .maybeSingle();

  if (ruleError || !rule) return NextResponse.json({ error: 'Pricing rule not found.' }, { status: 404 });
  if (rule.is_approved) return NextResponse.json({ error: 'Pricing rule is already approved.' }, { status: 409 });
  if (new Date(rule.effective_at).getTime() > now.getTime() || (rule.valid_until && new Date(rule.valid_until).getTime() <= now.getTime())) {
    return NextResponse.json({ error: 'Only currently effective pricing rules can be approved.' }, { status: 409 });
  }

  const [{ data: variant, error: variantError }, { data: supplierPrice, error: priceError }] = await Promise.all([
    admin.from('qutlas_product_variants').select('id, product_id, pricing_unit').eq('id', rule.variant_id).maybeSingle(),
    admin.from('qutlas_supplier_prices').select('id, supplier_id, pricing_unit, effective_at, valid_until').eq('id', rule.supplier_price_id).maybeSingle(),
  ]);

  if (variantError || priceError) return NextResponse.json({ error: 'Could not verify pricing references.' }, { status: 503 });
  if (!variant || !supplierPrice || rule.pricing_unit !== variant.pricing_unit || rule.pricing_unit !== supplierPrice.pricing_unit) {
    return NextResponse.json({ error: 'The pricing rule, supplier cost, and variant units must match.' }, { status: 409 });
  }
  if (new Date(supplierPrice.effective_at).getTime() > now.getTime() || (supplierPrice.valid_until && new Date(supplierPrice.valid_until).getTime() <= now.getTime())) {
    return NextResponse.json({ error: 'The supplier price is not currently effective.' }, { status: 409 });
  }

  const [{ data: supplier, error: supplierError }, { data: product, error: productError }] = await Promise.all([
    admin.from('qutlas_suppliers').select('id, status').eq('id', supplierPrice.supplier_id).maybeSingle(),
    admin.from('qutlas_products').select('id, status').eq('id', variant.product_id).maybeSingle(),
  ]);

  if (supplierError || productError) return NextResponse.json({ error: 'Could not verify product or supplier status.' }, { status: 503 });
  if (!supplier || supplier.status !== 'active' || !product) {
    return NextResponse.json({ error: 'An active supplier and product are required.' }, { status: 409 });
  }

  const { data: approvedRule, error: approveError } = await admin
    .from('qutlas_pricing_rules')
    .update({ is_approved: true, approved_by: authorization.context.userId, approved_at: now.toISOString() })
    .eq('id', id)
    .eq('is_approved', false)
    .select()
    .maybeSingle();

  if (approveError) {
    console.error('Pricing rule approval failed:', approveError);
    return NextResponse.json({ error: 'Pricing rule could not be approved.' }, { status: 503 });
  }
  if (!approvedRule) return NextResponse.json({ error: 'Pricing rule changed before approval.' }, { status: 409 });

  await admin.from('qutlas_admin_audit_log').insert({
    actor_id: authorization.context.userId,
    action: 'approve',
    resource_type: 'pricing-rules',
    resource_id: id,
  });

  return NextResponse.json({ id, approved: true });
}