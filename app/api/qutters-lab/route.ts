import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createAdminClient } from '../../lib/supabase-server';

export const runtime = 'nodejs';

function cleanText(value: unknown, maximum = 500) {
  return typeof value === 'string' ? value.trim().slice(0, maximum) : '';
}

function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  const length = Number(request.headers.get('content-length') ?? '0');
  if (!Number.isFinite(length) || length > 16 * 1024) return fail('Submission is too large.', 413);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail('Invalid submission.');
  }
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return fail('Invalid submission.');

  const values = body as Record<string, unknown>;
  if (cleanText(values.website, 200)) return NextResponse.json({ accepted: true });
  const submissionType = values.submissionType;
  if (submissionType !== 'host' && submissionType !== 'participant') return fail('Choose a valid submission type.');

  const name = cleanText(values.name, 200);
  const email = cleanText(values.email, 320).toLowerCase();
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail('Enter your name and a valid email address.');

  const record = {
    submission_type: submissionType,
    name,
    email,
    organisation: cleanText(values.organisation, 200) || null,
    location: cleanText(values.location, 200) || null,
    organisation_type: cleanText(values.organisationType, 100) || null,
    interest: cleanText(values.interest, 150) || null,
    message: cleanText(values.message, 5000) || null,
  };

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.from('qutlas_lab_submissions').insert(record).select('id').single();
    if (error) throw error;
    return NextResponse.json({ accepted: true, reference: `QL-${data.id.slice(0, 8).toUpperCase()}` }, { status: 201 });
  } catch (error) {
    console.error('Qutters Lab submission failed:', error);
    return fail('Your submission could not be saved. Please try again later.', 503);
  }
}