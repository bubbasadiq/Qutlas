import { NextResponse } from 'next/server';
import { authorizeStaff } from '../../../../../lib/supabase-server';

export const runtime = 'nodejs';

type RouteContext = { params: Promise<{ id: string }> };
const allowedStatuses = new Set([
  'cancelled', 'confirmed', 'awaiting_production', 'in_production',
  'quality_check', 'ready_for_dispatch', 'dispatched', 'delivered',
]);

export async function POST(request: Request, context: RouteContext) {
  const authorization = await authorizeStaff(request, ['order_manager', 'production_manager']);
  if (!authorization.ok) return authorization.response;
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'Invalid order reference.' }, { status: 400 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid status update.' }, { status: 400 });
  }
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return NextResponse.json({ error: 'Invalid status update.' }, { status: 400 });
  const values = body as Record<string, unknown>;
  if (typeof values.status !== 'string' || !allowedStatuses.has(values.status)) {
    return NextResponse.json({ error: 'Choose a supported order status.' }, { status: 400 });
  }
  const note = typeof values.note === 'string' ? values.note.trim().slice(0, 2000) : null;

  const { data: order, error } = await authorization.context.admin.rpc('qutlas_set_order_status', {
    p_order_id: id,
    p_next_status: values.status,
    p_actor_id: authorization.context.userId,
    p_note: note,
  });
  if (error) {
    console.error('Order status transition failed:', error);
    return NextResponse.json({ error: error.code === '23514' ? 'That order status transition is not allowed.' : 'The order status could not be updated.' }, { status: error.code === 'P0002' ? 404 : 409 });
  }

  await authorization.context.admin.from('qutlas_admin_audit_log').insert({
    actor_id: authorization.context.userId,
    action: 'change_status',
    resource_type: 'orders',
    resource_id: id,
    after_data: { status: values.status },
  });
  return NextResponse.json(order, { headers: { 'Cache-Control': 'no-store' } });
}