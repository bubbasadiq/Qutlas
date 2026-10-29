
import { createHash, createHmac, randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const BUCKET = 'qutlas-project-files';
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_FILES = 8;

const ALLOWED_EXTENSIONS = new Set([
  'pdf', 'jpg', 'jpeg', 'png', 'dxf', 'dwg',
  'step', 'stp', 'csv', 'xlsx',
]);

const MATERIALS = new Set([
  'steel', 'wood', 'granite', 'unsure',
]);

const START_MODES = new Set(['drawing', 'description', 'idea']);

const NEED_TYPES = new Set([
  'material', 'cut', 'component', 'assembly', 'project', 'custom',
]);

function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function cleanText(value: unknown, maxLength = 5000): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function cleanSpecs(value: unknown): Record<string, string> {
  if (!isRecord(value)) return {};
  const entries = Object.entries(value).slice(0, 40);
  const specs: Record<string, string> = {};
  for (const [key, item] of entries) {
    if (typeof item !== 'string' && typeof item !== 'number' && typeof item !== 'boolean') continue;
    const safeKey = key.trim().slice(0, 80);
    if (!safeKey) continue;
    specs[safeKey] = String(item).trim().slice(0, 500);
  }
  return specs;
}

async function readJsonBody(request: Request, maxBytes = 64 * 1024): Promise<unknown> {
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

export async function POST(request: Request) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !secretKey) {
    console.error('Supabase server environment variables are missing.');
    return fail('The enquiry service is not configured yet.', 500);
  }

  let body: Record<string, unknown>;

  try {
    const parsed = await readJsonBody(request);
    if (!isRecord(parsed)) return fail('Invalid enquiry data.');
    body = parsed;
  } catch (error) {
    if (error instanceof Error && error.message === 'BODY_TOO_LARGE') {
      return fail('The request is too large. Reduce the details or number of files and try again.', 413);
    }
    return fail('The request body must be valid JSON.');
  }

  const idempotencyKey = request.headers.get('idempotency-key')?.trim() ?? '';
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idempotencyKey)) {
    return fail('The request could not be safely identified. Refresh the form and try again.', 400);
  }

  const details = body.details;
  const requestedFiles = body.files;

  if (!isRecord(details) || !Array.isArray(requestedFiles)) {
    return fail('The enquiry details or file list is invalid.');
  }

  if (requestedFiles.length > MAX_FILES) {
    return fail(`You can attach up to ${MAX_FILES} files.`);
  }

  const material = cleanText(details.material, 30);
  const startMode = cleanText(details.startMode, 30);
  const needType = cleanText(details.need, 30);
  const description = cleanText(details.description);
  const customerName = cleanText(details.name, 200);
  const email = cleanText(details.email, 320).toLowerCase();
  const phone = cleanText(details.phone, 50);
  const location = cleanText(details.location, 300);
  const quantity = Number(details.quantity);

  if (!MATERIALS.has(material)) {
    return fail('Choose a valid material.');
  }

  if (!START_MODES.has(startMode) || !NEED_TYPES.has(needType)) {
    return fail('Choose a valid project type.');
  }

  if (!description || !customerName || !phone || !location) {
    return fail('Complete the required project and contact details.');
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return fail('Enter a valid email address.');
  }

  if (
    !Number.isSafeInteger(quantity) ||
    quantity < 1 ||
    quantity > 1_000_000_000
  ) {
    return fail('Enter a valid quantity.');
  }

  const fileInputs: Array<{
    name: string;
    size: number;
    type: string;
    extension: string;
  }> = [];

  let totalFileBytes = 0;

  for (const item of requestedFiles) {
    if (!isRecord(item)) {
      return fail('One of the file details is invalid.');
    }

    const name = cleanText(item.name, 255);
    const size = Number(item.size);
    const type = cleanText(item.type, 150);
    const extension = name.includes('.')
      ? name.split('.').pop()!.toLowerCase()
      : '';

    if (
      !name ||
      name === '.' ||
      name === '..' ||
      !ALLOWED_EXTENSIONS.has(extension)
    ) {
      return fail(`File type not accepted: ${name || 'unnamed file'}.`);
    }

    if (!Number.isSafeInteger(size) || size < 1 || size > MAX_FILE_SIZE) {
      return fail(`Each file must be no larger than 10 MB: ${name}.`);
    }

    totalFileBytes += size;
    if (totalFileBytes > 40 * 1024 * 1024) {
      return fail('The combined file size must not exceed 40 MB.');
    }

    fileInputs.push({ name, size, type: type.slice(0, 150), extension });
  }

  const supabase = createClient(supabaseUrl, secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const idempotencyKeyHash = createHash('sha256').update(idempotencyKey).digest('hex');
  const requestFingerprint = createHash('sha256').update(JSON.stringify({
    material, startMode, needType, description, customerName, email, phone, location,
    quantity, details: {
      itemName: cleanText(details.itemName, 300),
      company: cleanText(details.company, 300),
      specs: cleanSpecs(details.specs),
      quantityUnit: cleanText(details.quantityUnit, 50),
      delivery: cleanText(details.delivery, 100),
      contactMethod: cleanText(details.contactMethod, 100),
      instructions: cleanText(details.instructions),
    },
    files: fileInputs.map(({ name, size, type }) => ({ name, size, type })),
  })).digest('hex');

  const { data: existing, error: existingError } = await supabase
    .from('enquiries')
    .select('id, reference, files, upload_token_hash, uploads_completed, request_fingerprint')
    .eq('idempotency_key_hash', idempotencyKeyHash)
    .maybeSingle();

  if (existingError) {
    console.error('Could not check enquiry idempotency:', existingError);
    return fail('Could not check your request. Please try again.', 502);
  }

  if (existing) {
    if (existing.request_fingerprint !== requestFingerprint) {
      return fail('This submission key was already used for different details. Refresh the form before submitting a changed request.', 409);
    }

    if (existing.uploads_completed) {
      return NextResponse.json({
        reference: existing.reference,
        enquiryId: existing.id,
        uploadSecret: null,
        uploads: [],
        alreadyCompleted: true,
      });
    }

    const storedManifest = Array.isArray(existing.files) ? existing.files : [];

    if (storedManifest.length !== fileInputs.length) {
      return fail('The stored upload manifest does not match this submission.', 500);
    }

    const uploadSecret = fileInputs.length
      ? createHmac('sha256', secretKey).update(`qutlas-upload:${existing.id}:${idempotencyKeyHash}`).digest('hex')
      : null;
    const uploadInstructions: Array<{ path: string; token: string }> = [];

    for (const item of storedManifest) {
      if (!isRecord(item) || typeof item.path !== 'string') {
        return fail('The stored upload manifest is invalid.', 500);
      }
      const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(item.path, { upsert: true });
      if (error || !data?.token) {
        console.error('Could not recreate signed upload permission:', error);
        return fail('Could not resume file uploads. Please contact Qutlas Support and quote your reference.', 502);
      }
      uploadInstructions.push({ path: item.path, token: data.token });
    }

    return NextResponse.json({
      reference: existing.reference,
      enquiryId: existing.id,
      uploadSecret,
      uploads: uploadInstructions,
      alreadyCompleted: false,
    });
  }

  const id = randomUUID();
  const reference = `QUT-${new Date().getFullYear()}-${id
    .replace(/-/g, '')
    .slice(0, 8)
    .toUpperCase()}`;

  const uploadSecret = fileInputs.length
    ? createHmac('sha256', secretKey).update(`qutlas-upload:${id}:${idempotencyKeyHash}`).digest('hex')
    : null;

  const uploadEntries: Array<{
    originalName: string;
    path: string;
    size: number;
    contentType: string;
  }> = [];

  const uploadInstructions: Array<{
    path: string;
    token: string;
  }> = [];

  try {
    for (const file of fileInputs) {
      const path = `enquiries/${id}/${randomUUID()}.${file.extension}`;

      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUploadUrl(path, { upsert: true });

      if (error || !data?.token) {
        console.error('Could not create signed upload permission:', error);
        return fail('Could not prepare file uploads. Please try again.', 502);
      }

      uploadEntries.push({
        originalName: file.name,
        path,
        size: file.size,
        contentType: file.type || 'application/octet-stream',
      });

      uploadInstructions.push({
        path,
        token: data.token,
      });
    }

    const record = {
      id,
      reference,
      status: 'new',
      material,
      start_mode: startMode,
      need_type: needType,
      item_name: cleanText(details.itemName, 300) || null,
      description,
      specifications: cleanSpecs(details.specs),
      quantity,
      quantity_unit: cleanText(details.quantityUnit, 50) || null,
      customer_name: customerName,
      company: cleanText(details.company, 300) || null,
      email,
      phone,
      location,
      delivery_preference: cleanText(details.delivery, 100) || null,
      contact_method: cleanText(details.contactMethod, 100) || null,
      instructions: cleanText(details.instructions) || null,
      files: uploadEntries,
      uploads_completed: fileInputs.length === 0,
      upload_token_hash: uploadSecret
        ? createHash('sha256').update(uploadSecret).digest('hex')
        : null,
      notification_status: 'pending',
      idempotency_key_hash: idempotencyKeyHash,
      request_fingerprint: requestFingerprint,
    };

    const { error } = await supabase
      .from('enquiries')
      .insert(record);

    if (error) {
      // Recover only when the database reports a unique-key conflict
      // and the existing idempotency key resolves to an enquiry.
      if (error.code === '23505') {
        const {
          data: raced,
          error: racedError,
        } = await supabase
          .from('enquiries')
          .select(
            'id, reference, files, upload_token_hash, uploads_completed, request_fingerprint'
          )
          .eq('idempotency_key_hash', idempotencyKeyHash)
          .maybeSingle();

        if (racedError) {
          console.error('Could not recover concurrent enquiry:', racedError);
          return fail('We could not confirm your saved enquiry. Please retry shortly.', 502);
        }

        if (raced) {
          if (raced.request_fingerprint !== requestFingerprint) {
            return fail(
              'This submission key was already used for different details. Refresh the form before submitting a changed request.',
              409
            );
          }

          if (raced.uploads_completed) {
            return NextResponse.json({
              reference: raced.reference,
              enquiryId: raced.id,
              uploadSecret: null,
              uploads: [],
              alreadyCompleted: true,
            });
          }

          const manifest = Array.isArray(raced.files) ? raced.files : [];

          if (manifest.length !== fileInputs.length) {
            console.error('Recovered enquiry file manifest does not match request.');
            return fail('The saved enquiry has an invalid upload manifest. Please contact support.', 500);
          }

          const recoveredUploadSecret = fileInputs.length
            ? createHmac('sha256', secretKey)
                .update(`qutlas-upload:${raced.id}:${idempotencyKeyHash}`)
                .digest('hex')
            : null;

          const recoveredUploads: Array<{ path: string; token: string }> = [];

          for (const item of manifest) {
            if (!isRecord(item) || typeof item.path !== 'string') {
              console.error('Recovered enquiry contains an invalid upload manifest.');
              return fail('The saved enquiry has an invalid upload manifest. Please contact support.', 500);
            }

            const { data, error: signingError } = await supabase.storage
              .from(BUCKET)
              .createSignedUploadUrl(item.path, { upsert: true });

            if (signingError || !data?.token) {
              console.error('Could not resume recovered enquiry uploads:', signingError);
              return fail('Could not resume file uploads. Please retry shortly.', 502);
            }

            recoveredUploads.push({
              path: item.path,
              token: data.token,
            });
          }

          return NextResponse.json({
            reference: raced.reference,
            enquiryId: raced.id,
            uploadSecret: recoveredUploadSecret,
            uploads: recoveredUploads,
            alreadyCompleted: false,
          });
        }
      }

      console.error('Could not save enquiry:', error);
      return fail('We could not save your enquiry. Please try again.', 502);
    }

    return NextResponse.json({
      reference,
      enquiryId: id,
      uploadSecret,
      uploads: uploadInstructions,
    });
  } catch (error) {
    console.error('Unexpected enquiry submission error:', error);
    return fail('Something went wrong while preparing your enquiry.', 500);
  }
}

