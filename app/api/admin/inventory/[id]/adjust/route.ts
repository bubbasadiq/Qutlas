import { NextResponse } from 'next/server';
import { authorizeStaff } from '../../../../../lib/supabase-server';

export const runtime = 'nodejs';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const authorization = await authorizeStaff(request, ['inventory_manager']);
  if (!authorization.ok) return authorization.response;
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'Invalid inventory reference.' }, { status: 400 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid inventory adjustment.' }, { status: 400 });
  }
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return NextResponse.json({ error: 'Invalid inventory adjustment.' }, { status: 400 });
  const values = body as Record<string, unknown>;
  if (!['receipt', 'damage', 'adjustment'].includes(String(values.type)) || typeof values.quantity !== 'string' || !/^-?\d+(?:\.\d{1,6})?$/.test(values.quantity) || typeof values.notes !== 'string') {
    return NextResponse.json({ error: 'Provide an adjustment type, quantity with at most six decimals, and a note.' }, { status: 400 });
  }

  const { data, error } = await authorization.context.admin.rpc('qutlas_adjust_inventory', {
    p_inventory_id: id,
    p_movement_type: values.type,
    p_quantity: values.quantity,
    p_actor_id: authorization.context.userId,
    p_reference: typeof values.reference === 'string' ? values.reference.slice(0, 200) : null,
    p_notes: values.notes.slice(0, 2000),
  });
  if (error) {
    console.error('Inventory adjustment failed:', error);
    return NextResponse.json({ error: error.code === '23514' ? 'Adjustment exceeds available stock.' : 'Inventory adjustment could not be recorded.' }, { status: error.code === 'P0002' ? 404 : 409 });
  }

  await authorization.context.admin.from('qutlas_admin_audit_log').insert({
    actor_id: authorization.context.userId,
    action: 'adjust_inventory',
    resource_type: 'inventory',
    resource_id: id,
    after_data: { type: values.type, quantity: values.quantity, notes: values.notes },
  });

  return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
}