import { NextResponse } from 'next/server';
import { authorizeStaff } from '../../../../../lib/supabase-server';

export const runtime = 'nodejs';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const authorization = await authorizeStaff(request, ['pricing_manager']);
  if (!authorization.ok) return authorization.response;
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'Invalid order reference.' }, { status: 400 });

  const { data, error } = await authorization.context.admin
    .from('qutlas_order_items')
    .select('sku_snapshot, name_snapshot, configuration, pricing_snapshot, quantity, unit, unit_price_minor, line_total_minor')
    .eq('order_id', id);
  if (error) return NextResponse.json({ error: 'Order pricing snapshot is unavailable.' }, { status: 503 });
  if (!data?.length) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
  return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
}