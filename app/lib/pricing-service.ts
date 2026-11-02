import type { SupabaseClient } from '@supabase/supabase-js';
import { calculatePrice, type PriceCalculation } from './pricing';

export class PriceUnavailableError extends Error {
  constructor(message = 'This product is not currently available for purchase.') {
    super(message);
    this.name = 'PriceUnavailableError';
  }
}

export type VariantPrice = {
  currency: string;
  pricingUnit: string;
  minimumQuantity: string;
  calculation: PriceCalculation;
  snapshot: Record<string, string | number>;
};

export async function calculateVariantPrice(
  client: SupabaseClient,
  variantId: string,
  quantity: string,
  now = new Date(),
  requirePublished = true,
): Promise<VariantPrice> {
  const { data: variant, error: variantError } = await client
    .from('qutlas_product_variants')
    .select('id, product_id, sku, pricing_unit, minimum_quantity, is_active')
    .eq('id', variantId)
    .eq('is_active', true)
    .maybeSingle();

  if (variantError) throw new Error('Could not load product configuration.');
  if (!variant) throw new PriceUnavailableError();

  const { data: product, error: productError } = await client
    .from('qutlas_products')
    .select('id, status, published_at')
    .eq('id', variant.product_id)
    .maybeSingle();

  if (productError) throw new Error('Could not load product availability.');
  if (!product || (requirePublished && (product.status !== 'active' || !product.published_at))) {
    throw new PriceUnavailableError();
  }

  const { data: rules, error: rulesError } = await client
    .from('qutlas_pricing_rules')
    .select('id, supplier_price_id, version, pricing_unit, wastage_bps, processing_minor_per_unit, labour_minor_per_unit, setup_minor, margin_bps, tax_bps, minimum_job_minor, effective_at, valid_until')
    .eq('variant_id', variantId)
    .eq('is_approved', true)
    .lte('effective_at', now.toISOString())
    .order('effective_at', { ascending: false })
    .limit(25);

  if (rulesError) throw new Error('Could not load approved pricing.');

  for (const rule of rules ?? []) {
    if (rule.valid_until && new Date(rule.valid_until).getTime() <= now.getTime()) continue;
    if (rule.pricing_unit !== variant.pricing_unit) continue;

    const { data: supplierPrice, error: supplierPriceError } = await client
      .from('qutlas_supplier_prices')
      .select('id, supplier_id, cost_minor, currency, pricing_unit, effective_at, valid_until')
      .eq('id', rule.supplier_price_id)
      .maybeSingle();

    if (supplierPriceError) throw new Error('Could not load verified material cost.');
    if (!supplierPrice || supplierPrice.pricing_unit !== variant.pricing_unit) continue;
    if (new Date(supplierPrice.effective_at).getTime() > now.getTime()) continue;
    if (supplierPrice.valid_until && new Date(supplierPrice.valid_until).getTime() <= now.getTime()) continue;

    const { data: supplier, error: supplierError } = await client
      .from('qutlas_suppliers')
      .select('id, status')
      .eq('id', supplierPrice.supplier_id)
      .maybeSingle();

    if (supplierError) throw new Error('Could not verify supplier status.');
    if (!supplier || supplier.status !== 'active') continue;

    const calculation = calculatePrice({
      quantity,
      unit: variant.pricing_unit,
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

    return {
      currency: supplierPrice.currency,
      pricingUnit: variant.pricing_unit,
      minimumQuantity: String(variant.minimum_quantity),
      calculation,
      snapshot: {
        pricingRuleId: rule.id,
        pricingRuleVersion: rule.version,
        supplierPriceId: supplierPrice.id,
        supplierId: supplier.id,
        currency: supplierPrice.currency,
        pricingUnit: variant.pricing_unit,
        ...calculation,
      },
    };
  }

  throw new PriceUnavailableError();
}