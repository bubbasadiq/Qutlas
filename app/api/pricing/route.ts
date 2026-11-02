import { NextResponse } from 'next/server';
import { calculateVariantPrice, PriceUnavailableError } from '../../lib/pricing-service';
import { createAdminClient } from '../../lib/supabase-server';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get('content-length') ?? '0');
  if (!Number.isFinite(contentLength) || contentLength > 4096) {
    return NextResponse.json({ error: 'Pricing request is too large.' }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid pricing request.' }, { status: 400 });
  }

  if (
    typeof body !== 'object' || body === null || Array.isArray(body) ||
    typeof (body as Record<string, unknown>).variantId !== 'string' ||
    !/^[0-9a-f-]{36}$/i.test((body as Record<string, string>).variantId) ||
    typeof (body as Record<string, unknown>).quantity !== 'string' ||
    (body as Record<string, string>).quantity.length > 32
  ) {
    return NextResponse.json({ error: 'A valid product configuration is required.' }, { status: 400 });
  }

  try {
    const price = await calculateVariantPrice(
      createAdminClient(),
      (body as Record<string, string>).variantId,
      (body as Record<string, string>).quantity,
    );

    return NextResponse.json({
      currency: price.currency,
      quantity: price.calculation.quantity,
      unit: price.pricingUnit,
      subtotalMinor: price.calculation.subtotalMinor,
      taxMinor: price.calculation.taxMinor,
      totalMinor: price.calculation.totalMinor,
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof PriceUnavailableError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error('Price calculation failed:', error);
    return NextResponse.json({ error: 'Price could not be calculated.' }, { status: 503 });
  }
}