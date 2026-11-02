import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { calculateVariantPrice, PriceUnavailableError } from '../../lib/pricing-service';
import { quantityToMicros } from '../../lib/pricing';
import { authenticateRequest, createAdminClient } from '../../lib/supabase-server';

export const runtime = 'nodejs';

type OrderLineInput = { variantId: string; quantity: string; configuration?: Record<string, unknown> };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function ceilDivide(numerator: bigint, denominator: bigint) {
  return (numerator + denominator - 1n) / denominator;
}

function fail(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  const authentication = await authenticateRequest(request);
  if (!authentication.ok) return authentication.response;
  if (!authentication.user.email || !authentication.user.email_confirmed_at) {
    return fail('Confirm your account email before placing an order.', 403);
  }

  const declaredLength = Number(request.headers.get('content-length') ?? '0');
  if (!Number.isFinite(declaredLength) || declaredLength > 64 * 1024) return fail('Order request is too large.', 413);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail('Invalid order request.', 400);
  }

  if (!isRecord(body) || !isRecord(body.customer) || !isRecord(body.fulfilment) || !Array.isArray(body.items)) {
    return fail('Customer, fulfilment, and order items are required.', 400);
  }

  const customerName = typeof body.customer.name === 'string' ? body.customer.name.trim().slice(0, 200) : '';
  const customerPhone = typeof body.customer.phone === 'string' ? body.customer.phone.trim().slice(0, 50) : '';
  const method = body.fulfilment.method;
  const regionCode = typeof body.fulfilment.regionCode === 'string' ? body.fulfilment.regionCode.trim().toUpperCase().slice(0, 20) : '';
  const deliveryAddress = body.fulfilment.address;
  const idempotencyKey = request.headers.get('idempotency-key')?.trim() ?? '';

  if (!customerName || !customerPhone || !regionCode || !isRecord(deliveryAddress)) {
    return fail('Complete your name, phone, region, and fulfilment address.', 400);
  }
  if (method !== 'delivery' && method !== 'collection') return fail('Choose a supported fulfilment method.', 400);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idempotencyKey)) {
    return fail('A valid idempotency key is required.', 400);
  }
  if (body.items.length < 1 || body.items.length > 30) return fail('Orders must contain between 1 and 30 distinct items.', 400);

  const lines: OrderLineInput[] = [];
  const variantIds = new Set<string>();
  for (const item of body.items) {
    if (!isRecord(item) || typeof item.variantId !== 'string' || !/^[0-9a-f-]{36}$/i.test(item.variantId) || typeof item.quantity !== 'string') {
      return fail('Each item needs a valid variant and quantity.', 400);
    }
    if (variantIds.has(item.variantId)) return fail('Combine quantities for duplicate product variants.', 400);
    variantIds.add(item.variantId);
    if (item.configuration !== undefined && !isRecord(item.configuration)) return fail('Item configuration must be an object.', 400);
    lines.push({ variantId: item.variantId, quantity: item.quantity, configuration: item.configuration as Record<string, unknown> | undefined });
  }

  const normalizedRequest = {
    customerId: authentication.user.id,
    customerName,
    customerEmail: authentication.user.email.toLowerCase(),
    customerPhone,
    method,
    regionCode,
    deliveryAddress,
    items: lines,
  };
  const requestFingerprint = createHash('sha256').update(JSON.stringify(normalizedRequest)).digest('hex');
  const admin = createAdminClient();
  const { data: existing, error: existingError } = await admin
    .from('qutlas_orders')
    .select('id, reference, request_fingerprint, status, payment_status, customer_id')
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle();

  if (existingError) return fail('Could not verify an earlier order attempt.', 503);
  if (existing) {
    if (existing.request_fingerprint !== requestFingerprint || existing.customer_id !== authentication.user.id) {
      return fail('This order retry key was already used for different details.', 409);
    }
    return NextResponse.json({ id: existing.id, reference: existing.reference, status: existing.status, paymentStatus: existing.payment_status });
  }

  const now = new Date();
  const { data: fulfilmentRules, error: fulfilmentError } = await admin
    .from('qutlas_fulfilment_rules')
    .select('id, method, region_code, charge_minor, currency, effective_at, valid_until')
    .eq('method', method)
    .eq('is_active', true)
    .in('region_code', [regionCode, '*'])
    .lte('effective_at', now.toISOString())
    .order('effective_at', { ascending: false });

  if (fulfilmentError) return fail('Fulfilment pricing is unavailable.', 503);
  const fulfilmentRule = (fulfilmentRules ?? [])
    .filter((rule) => !rule.valid_until || new Date(rule.valid_until).getTime() > now.getTime())
    .sort((left, right) => Number(right.region_code === regionCode) - Number(left.region_code === regionCode))[0];
  if (!fulfilmentRule) return fail('This fulfilment option is not currently configured for your region.', 409);

  const orderItems = [];
  let subtotalMinor = 0n;
  let taxMinor = 0n;
  let currency: string | null = null;

  try {
    for (const line of lines) {
      const { data: variant, error: variantError } = await admin
        .from('qutlas_product_variants')
        .select('id, product_id, sku, name, pricing_unit, minimum_quantity, maximum_quantity, quantity_step')
        .eq('id', line.variantId)
        .eq('is_active', true)
        .maybeSingle();
      if (variantError || !variant) return fail('A selected product is no longer available.', 409);

      const quantityMicros = quantityToMicros(line.quantity);
      const minimumMicros = quantityToMicros(String(variant.minimum_quantity), 'Minimum quantity');
      const stepMicros = quantityToMicros(String(variant.quantity_step), 'Quantity step');
      if ((variant.maximum_quantity !== null && quantityMicros > quantityToMicros(String(variant.maximum_quantity), 'Maximum quantity')) ||
        (quantityMicros - minimumMicros) % stepMicros !== 0n) {
        return fail('A selected quantity is outside the allowed quantity steps.', 409);
      }

      const price = await calculateVariantPrice(admin, line.variantId, line.quantity, now);
      if (currency && currency !== price.currency) return fail('Orders cannot combine different currencies.', 409);
      currency = price.currency;

      const { data: stockRows, error: stockError } = await admin
        .from('qutlas_inventory')
        .select('id, on_hand, reserved, damaged, unit')
        .eq('variant_id', line.variantId)
        .eq('unit', variant.pricing_unit);
      if (stockError) return fail('Stock availability could not be verified.', 503);
      const availableStock = (stockRows ?? []).find((stock) => {
        if (stock.unit !== variant.pricing_unit) return false;
        return quantityToMicros(String(stock.on_hand), 'Stock') -
          quantityToMicros(String(stock.reserved), 'Reserved stock') -
          quantityToMicros(String(stock.damaged), 'Damaged stock') >= quantityMicros;
      });
      if (!availableStock) return fail('A selected quantity exceeds available stock.', 409);

      const lineSubtotal = BigInt(price.calculation.subtotalMinor);
      const lineTax = BigInt(price.calculation.taxMinor);
      const lineTotal = lineSubtotal + lineTax;
      subtotalMinor += lineSubtotal;
      taxMinor += lineTax;
      orderItems.push({
        inventory_id: availableStock.id,
        product_id: variant.product_id,
        variant_id: variant.id,
        sku_snapshot: variant.sku,
        name_snapshot: variant.name,
        configuration: line.configuration ?? {},
        pricing_snapshot: price.snapshot,
        quantity: line.quantity,
        unit: variant.pricing_unit,
        unit_price_minor: ceilDivide(lineTotal * 1_000_000n, quantityMicros).toString(),
        line_total_minor: lineTotal.toString(),
      });
    }
  } catch (priceError) {
    if (priceError instanceof PriceUnavailableError) return fail(priceError.message, 409);
    return fail(priceError instanceof Error ? priceError.message : 'Order pricing failed.', 400);
  }

  if (fulfilmentRule.currency !== currency) return fail('Fulfilment and product prices use different currencies.', 409);
  const deliveryMinor = BigInt(fulfilmentRule.charge_minor);
  const totalMinor = subtotalMinor + taxMinor + deliveryMinor;
  const orderSnapshot = {
    customer_id: authentication.user.id,
    customer_name: customerName,
    customer_email: authentication.user.email.toLowerCase(),
    customer_phone: customerPhone,
    delivery_address: { method, regionCode, ...deliveryAddress },
    idempotency_key: idempotencyKey,
    request_fingerprint: requestFingerprint,
    currency,
    subtotal_minor: subtotalMinor.toString(),
    tax_minor: taxMinor.toString(),
    delivery_minor: deliveryMinor.toString(),
    total_minor: totalMinor.toString(),
  };

  const { data: created, error: createError } = await admin.rpc('qutlas_create_order', {
    p_order: orderSnapshot,
    p_items: orderItems,
  });

  if (createError) {
    if (createError.code === '23505') {
      const { data: raced } = await admin.from('qutlas_orders')
        .select('id, reference, request_fingerprint, status, payment_status, customer_id')
        .eq('idempotency_key', idempotencyKey)
        .maybeSingle();
      if (raced?.customer_id === authentication.user.id && raced.request_fingerprint === requestFingerprint) {
        return NextResponse.json({ id: raced.id, reference: raced.reference, status: raced.status, paymentStatus: raced.payment_status });
      }
    }
    console.error('Order transaction failed:', createError);
    const insufficientStock = createError.code === '23514';
    return fail(insufficientStock ? 'Stock changed before the order could be reserved.' : 'The order could not be created.', insufficientStock ? 409 : 503);
  }

  return NextResponse.json({
    id: created.id,
    reference: created.reference,
    status: 'pending_payment',
    paymentStatus: 'unpaid',
    totalMinor: totalMinor.toString(),
    currency,
  }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
}