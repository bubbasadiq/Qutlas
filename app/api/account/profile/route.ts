import { NextResponse } from 'next/server';
import { authenticateRequest, createAdminClient } from '../../../lib/supabase-server';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const authentication = await authenticateRequest(request);
  if (!authentication.ok) return authentication.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid profile data.' }, { status: 400 });
  }

  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return NextResponse.json({ error: 'Invalid profile data.' }, { status: 400 });
  }

  const values = body as Record<string, unknown>;
  const fullName = typeof values.fullName === 'string' ? values.fullName.trim().slice(0, 200) : '';
  const phone = typeof values.phone === 'string' ? values.phone.trim().slice(0, 50) : null;
  const companyName = typeof values.companyName === 'string' ? values.companyName.trim().slice(0, 200) : null;

  const admin = createAdminClient();
  const { error } = await admin.from('qutlas_customer_profiles').upsert({
    user_id: authentication.user.id,
    full_name: fullName,
    phone,
    company_name: companyName,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error('Customer profile could not be saved:', error);
    return NextResponse.json({ error: 'Could not save your profile.' }, { status: 503 });
  }

  return NextResponse.json({ saved: true });
}