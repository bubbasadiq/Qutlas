import { NextResponse } from 'next/server';
import { authorizeStaff, STAFF_ROLES } from '../../../lib/supabase-server';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const authorization = await authorizeStaff(request, STAFF_ROLES);
  if (!authorization.ok) return authorization.response;

  const { data, error } = await authorization.context.admin.rpc('qutlas_admin_overview');
  if (error) {
    console.error('Admin overview is unavailable:', error);
    return NextResponse.json({ error: 'The database migration is not installed or the dashboard data is unavailable.' }, { status: 503 });
  }

  return NextResponse.json({ ...data, roles: authorization.context.roles }, { headers: { 'Cache-Control': 'no-store' } });
}