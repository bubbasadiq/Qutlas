import { NextResponse } from 'next/server';
import { calculatePrice } from '../../../../../lib/pricing';
import { authorizeStaff } from '../../../../../lib/supabase-server';

export const runtime = 'nodejs';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const authorization = await authorizeStaff(request, ['pricing_manager']);
  if (!authorization.ok) return authorization.response;
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'Invalid pricing rule reference.' }, { status: 400 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid pricing preview.' }, { status: 400 });
  }
  if (typeof body !== 'object' || body === null || Array.isArray(body) ||
    ('quantity' in body && body.quantity !== '' && typeof body.quantity !== 'string')) {
    return NextResponse.json({ error: 'Enter a valid quantity to preview.' }, { status: 400 });
  }

  const admin = authorization.context.admin;
  const { data: rule, error: ruleError } = await admin.from('qutlas_pricing_rules')
    .select('id, supplier_price_id, variant_id, pricing_unit, wastage_bps, processing_minor_per_unit, labour_minor_per_unit, setup_minor, margin_bps, tax_bps, minimum_job_minor')
    .eq('id', id)
    .maybeSingle();
  if (ruleError || !rule) return NextResponse.json({ error: 'Pricing rule not found.' }, { status: 404 });

  const [{ data: variant, error: variantError }, { data: supplierPrice, error: supplierPriceError }] = await Promise.all([
    admin.from('qutlas_product_variants').select('id, pricing_unit, minimum_quantity').eq('id', rule.variant_id).maybeSingle(),
    admin.from('qutlas_supplier_prices').select('id, supplier_id, cost_minor, currency, pricing_unit, effective_at, valid_until').eq('id', rule.supplier_price_id).maybeSingle(),
  ]);
  if (variantError || supplierPriceError) return NextResponse.json({ error: 'Pricing inputs could not be loaded.' }, { status: 503 });
  if (!variant || !supplierPrice || rule.pricing_unit !== variant.pricing_unit || rule.pricing_unit !== supplierPrice.pricing_unit) {
    return NextResponse.json({ error: 'Pricing inputs must use the same validated unit.' }, { status: 409 });
  }
  if (new Date(supplierPrice.effective_at).getTime() > Date.now() || (supplierPrice.valid_until && new Date(supplierPrice.valid_until).getTime() <= Date.now())) {
    return NextResponse.json({ error: 'Supplier cost is not currently effective.' }, { status: 409 });
  }
  const { data: supplier, error: supplierError } = await admin.from('qutlas_suppliers').select('name, status').eq('id', supplierPrice.supplier_id).maybeSingle();
  if (supplierError || !supplier || supplier.status !== 'active') return NextResponse.json({ error: 'Supplier is not active.' }, { status: 409 });

  try {
    const requestedQuantity = typeof (body as Record<string, unknown>).quantity === 'string' && (body as Record<string, string>).quantity.trim()
      ? (body as Record<string, string>).quantity
      : String(variant.minimum_quantity);
    const calculation = calculatePrice({
      quantity: requestedQuantity,
      unit: rule.pricing_unit,
      pricingUnit: rule.pricing_unit,
      materialCostMinorPerUnit: String(supplierPrice.cost_minor),
      wastageBps: rule.wastage_bps,
      processingMinorPerUnit: String(rule.processing_minor_per_unit),
      labourMinorPerUnit: String(rule.labour_minor_per_unit),
      setupMinor: String(rule.setup_minor),
      marginBps: rule.margin_bps,
      taxBps: rule.tax_bps,
      minimumQuantity: String(variant.minimum_quantity),
      minimumJobMinor: String(rule.minimum_job_minor),
    });
    return NextResponse.json({ supplier: supplier.name, currency: supplierPrice.currency, pricingUnit: rule.pricing_unit, calculation }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Price preview failed.' }, { status: 400 });
  }
}