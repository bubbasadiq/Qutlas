import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { hasStaffPermission, STAFF_ROLES, type StaffRole } from './permissions';

export { STAFF_ROLES, type StaffRole } from './permissions';

export type StaffContext = {
  userId: string;
  roles: StaffRole[];
  admin: SupabaseClient;
};

export type StaffAuthorization =
  | { ok: true; context: StaffContext }
  | { ok: false; response: NextResponse };

export function createAdminClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secretKey) throw new Error('Supabase server credentials are not configured.');

  return createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) throw new Error('Supabase public authentication is not configured.');

  return createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function authenticateRequest(request: Request) {
  const authorization = request.headers.get('authorization') ?? '';
  const tokenMatch = /^Bearer\s+(.+)$/i.exec(authorization);
  if (!tokenMatch) {
    return { ok: false as const, response: NextResponse.json({ error: 'Sign in is required.' }, { status: 401 }) };
  }

  try {
    const publicClient = createPublicClient();
    const { data: { user }, error } = await publicClient.auth.getUser(tokenMatch[1]);
    if (error || !user) {
      return { ok: false as const, response: NextResponse.json({ error: 'Your session is invalid or expired.' }, { status: 401 }) };
    }
    return { ok: true as const, user, accessToken: tokenMatch[1] };
  } catch (error) {
    console.error('Authentication is not configured:', error);
    return { ok: false as const, response: NextResponse.json({ error: 'Authentication is temporarily unavailable.' }, { status: 503 }) };
  }
}

export async function authorizeStaff(
  request: Request,
  allowedRoles: readonly StaffRole[],
): Promise<StaffAuthorization> {
  const authentication = await authenticateRequest(request);
  if (!authentication.ok) return { ok: false, response: authentication.response };

  try {
    const user = authentication.user;
    const admin = createAdminClient();
    const { data: assignments, error: roleError } = await admin
      .from('qutlas_staff_roles')
      .select('role')
      .eq('user_id', user.id);

    if (roleError) {
      console.error('Could not verify staff permissions:', roleError);
      return { ok: false, response: NextResponse.json({ error: 'Staff permissions are temporarily unavailable.' }, { status: 503 }) };
    }

    const roles = (assignments ?? [])
      .map((assignment) => assignment.role)
      .filter((role): role is StaffRole => STAFF_ROLES.includes(role as StaffRole));
    const permitted = hasStaffPermission(roles, allowedRoles);

    if (!permitted) {
      return { ok: false, response: NextResponse.json({ error: 'You do not have permission to perform this action.' }, { status: 403 }) };
    }

    return { ok: true, context: { userId: user.id, roles, admin } };
  } catch (error) {
    console.error('Staff authorization is not configured:', error);
    return { ok: false, response: NextResponse.json({ error: 'Staff authorization is temporarily unavailable.' }, { status: 503 }) };
  }
}