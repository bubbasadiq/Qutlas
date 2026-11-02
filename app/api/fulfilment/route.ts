import { NextResponse } from 'next/server';
import { createAdminClient } from '../../lib/supabase-server';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const method = url.searchParams.get('method');
  const regionCode = url.searchParams.get('regionCode')?.trim().toUpperCase() ?? '';
  if ((method !== 'delivery' && method !== 'collection') || !regionCode || regionCode.length > 20) {
    return NextResponse.json({ error: 'Choose a fulfilment method and region.' }, { status: 400 });
  }

  const now = new Date();
  const { data: rules, error } = await createAdminClient()
    .from('qutlas_fulfilment_rules')
    .select('method, region_code, charge_minor, currency, effective_at, valid_until')
    .eq('method', method)
    .eq('is_active', true)
    .in('region_code', [regionCode, '*'])
    .lte('effective_at', now.toISOString())
    .order('effective_at', { ascending: false });

  if (error) {
    console.error('Fulfilment rule lookup failed:', error);
    return NextResponse.json({ error: 'Fulfilment pricing is unavailable.' }, { status: 503 });
  }
  const rule = (rules ?? [])
    .filter((item) => !item.valid_until || new Date(item.valid_until).getTime() > now.getTime())
    .sort((left, right) => Number(right.region_code === regionCode) - Number(left.region_code === regionCode))[0];
  if (!rule) return NextResponse.json({ error: 'This fulfilment option is not configured for this region.' }, { status: 404 });

  return NextResponse.json({ method: rule.method, regionCode: rule.region_code, chargeMinor: String(rule.charge_minor), currency: rule.currency }, {
    headers: { 'Cache-Control': 'no-store' },
  });
}