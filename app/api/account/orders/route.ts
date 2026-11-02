import { NextResponse } from 'next/server';
import { authenticateRequest, createAdminClient } from '../../../lib/supabase-server';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const authentication = await authenticateRequest(request);
  if (!authentication.ok) return authentication.response;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('qutlas_orders')
    .select('id, reference, status, payment_status, currency, total_minor, created_at, qutlas_order_items(sku_snapshot, name_snapshot, configuration, quantity, unit, unit_price_minor, line_total_minor)')
    .eq('customer_id', authentication.user.id)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Customer order history could not be loaded:', error);
    return NextResponse.json({ error: 'Order history is temporarily unavailable.' }, { status: 503 });
  }

  return NextResponse.json(data ?? [], { headers: { 'Cache-Control': 'no-store' } });
}