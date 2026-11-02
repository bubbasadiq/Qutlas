import { NextResponse } from 'next/server';
import { calculateVariantPrice, PriceUnavailableError } from '../../lib/pricing-service';
import { createAdminClient } from '../../lib/supabase-server';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const admin = createAdminClient();
    const [{ data: products, error }, { data: categories, error: categoriesError }] = await Promise.all([
      admin
      .from('qutlas_products')
      .select('id, category_id, slug, sku, name, description, attributes, qutlas_product_variants(id, sku, name, attributes, pricing_unit, minimum_quantity, maximum_quantity, quantity_step, is_active)')
      .eq('status', 'active')
      .not('published_at', 'is', null)
      .order('name'),
      admin.from('qutlas_categories').select('id, slug, name').eq('is_active', true).order('sort_order'),
    ]);

    if (error || categoriesError) throw error ?? categoriesError;
    const categoriesById = new Map((categories ?? []).map((category) => [category.id, category]));

    const pricedProducts = [];
    for (const product of products ?? []) {
      const variants = [];
      for (const variant of product.qutlas_product_variants ?? []) {
        if (!variant.is_active) continue;
        try {
          const price = await calculateVariantPrice(admin, variant.id, String(variant.minimum_quantity));
          variants.push({
            id: variant.id,
            sku: variant.sku,
            name: variant.name,
            attributes: variant.attributes,
            unit: variant.pricing_unit,
            minimumQuantity: String(variant.minimum_quantity),
            maximumQuantity: variant.maximum_quantity === null ? null : String(variant.maximum_quantity),
            quantityStep: String(variant.quantity_step),
            price: {
              currency: price.currency,
              totalMinor: price.calculation.totalMinor,
              taxMinor: price.calculation.taxMinor,
            },
          });
        } catch (priceError) {
          if (!(priceError instanceof PriceUnavailableError)) throw priceError;
        }
      }

      const category = categoriesById.get(product.category_id);
      if (variants.length && category) {
        pricedProducts.push({
          id: product.id,
          categoryId: product.category_id,
          categorySlug: category.slug,
          categoryName: category.name,
          slug: product.slug,
          sku: product.sku,
          name: product.name,
          description: product.description,
          attributes: product.attributes,
          variants,
        });
      }
    }

    return NextResponse.json({ products: pricedProducts, categories: categories ?? [] }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Catalogue could not be loaded:', error);
    return NextResponse.json({ error: 'Catalogue is temporarily unavailable.' }, { status: 503 });
  }
}