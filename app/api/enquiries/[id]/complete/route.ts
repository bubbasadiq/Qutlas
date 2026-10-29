
import { createHash, timingSafeEqual } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const BUCKET = 'qutlas-project-files';
const MAX_UPLOAD_AGE_MS = 2 * 60 * 60 * 1000;

type RouteContext = {
  params: Promise<{ id: string }>;
};

function fail(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function readJsonBody(request: Request, maxBytes = 4 * 1024): Promise<unknown> {
  const declaredLength = request.headers.get('content-length');
  if (declaredLength !== null) {
    const length = Number(declaredLength);
    if (!Number.isSafeInteger(length) || length < 0 || length > maxBytes) {
      throw new Error('BODY_TOO_LARGE');
    }
  }
  if (!request.body) throw new Error('INVALID_JSON');
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        throw new Error('BODY_TOO_LARGE');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder().decode(bytes)) as unknown;
  } catch {
    throw new Error('INVALID_JSON');
  }
}

export async function POST(request: Request, context: RouteContext) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !secretKey) {
    return fail('The enquiry service is not configured.', 500);
  }

  const { id } = await context.params;

  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  ) {
    return fail('Invalid enquiry reference.', 400);
  }

  let body: unknown;

  try {
    body = await readJsonBody(request);
  } catch {
    return fail('Invalid completion request.', 400);
  }

  if (
    !isRecord(body) ||
    typeof body.uploadSecret !== 'string' ||
    !/^[0-9a-f]{64}$/i.test(body.uploadSecret)
  ) {
    return fail('Invalid upload verification token.', 400);
  }

  const supabase = createClient(supabaseUrl, secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data: enquiry, error } = await supabase
    .from('enquiries')
    .select(
      'id, reference, files, upload_token_hash, uploads_completed, created_at',
    )
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Could not retrieve enquiry for upload verification:', error);
    return fail('Could not verify your uploads. Please try again.', 502);
  }

  if (!enquiry) {
    return fail('Enquiry not found.', 404);
  }

  const storedHash = enquiry.upload_token_hash;

  if (typeof storedHash !== 'string' || !/^[0-9a-f]{64}$/i.test(storedHash)) {
    return fail('This enquiry cannot be verified for uploads.', 403);
  }

  const suppliedHash = createHash('sha256')
    .update(body.uploadSecret)
    .digest();

  const expectedHash = Buffer.from(storedHash, 'hex');

  if (
    suppliedHash.length !== expectedHash.length ||
    !timingSafeEqual(suppliedHash, expectedHash)
  ) {
    return fail('Upload verification failed.', 403);
  }

  if (enquiry.uploads_completed) {
    return NextResponse.json({ reference: enquiry.reference, completed: true });
  }

  const createdAt = new Date(enquiry.created_at).getTime();

  if (
    !Number.isFinite(createdAt) ||
    Date.now() - createdAt > MAX_UPLOAD_AGE_MS ||
    createdAt > Date.now() + 60_000
  ) {
    return fail(
      'The upload session has expired. Please submit your request again.',
      410,
    );
  }

  if (!Array.isArray(enquiry.files) || enquiry.files.length === 0) {
    return fail('No expected uploads were recorded for this enquiry.', 409);
  }

  const expectedFiles: Array<{ path: string; size: number }> = [];

  for (const file of enquiry.files) {
    if (
      !isRecord(file) ||
      typeof file.path !== 'string' ||
      typeof file.size !== 'number' ||
      !file.path.startsWith(`enquiries/${id}/`) ||
      file.path.split('/').length !== 3
    ) {
      return fail('The stored file manifest is invalid.', 500);
    }

    expectedFiles.push({ path: file.path, size: file.size });
  }

  const { data: storedFiles, error: storageError } = await supabase.storage
    .from(BUCKET)
    .list(`enquiries/${id}`, {
      limit: 100,
    });

  if (storageError || !storedFiles) {
    console.error('Could not verify stored uploads:', storageError);
    return fail('Could not verify your uploads. Please try again.', 502);
  }

  const expectedNames = new Set(expectedFiles.map((file) => file.path.split('/').pop()!));
  if (
    storedFiles.length !== expectedFiles.length ||
    storedFiles.some((file) => !expectedNames.has(file.name))
  ) {
    return fail('The uploaded files do not match the expected file list. Please retry your upload.', 409);
  }

  for (const expected of expectedFiles) {
    const filename = expected.path.split('/').pop()!;
    const actual = storedFiles.find((file) => file.name === filename);
    const actualSize = actual?.metadata?.size;

    if (!actual) {
      return fail('One or more files are still uploading or missing. Please retry.', 409);
    }

    if (
      actualSize === undefined ||
      actualSize === null ||
      !Number.isFinite(Number(actualSize)) ||
      Number(actualSize) !== expected.size
    ) {
      return fail('A stored file does not match its expected size. Please upload it again.', 409);
    }
  }

  const { data: updatedRows, error: updateError } = await supabase
    .from('enquiries')
    .update({
      uploads_completed: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('uploads_completed', false)
    .select('id');

  if (updateError) {
    console.error('Could not mark uploads complete:', updateError);
    return fail('Your files were uploaded but confirmation failed. Please retry.', 502);
  }

  if (!updatedRows || updatedRows.length === 0) {
    const { data: latest, error: latestError } = await supabase
      .from('enquiries')
      .select('uploads_completed')
      .eq('id', id)
      .maybeSingle();

    if (latestError || !latest?.uploads_completed) {
      return fail('Upload confirmation changed while processing. Please retry.', 409);
    }
  }

  return NextResponse.json({
    reference: enquiry.reference,
    completed: true,
  });
}
