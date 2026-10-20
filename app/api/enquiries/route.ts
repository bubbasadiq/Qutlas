
import { createHash, randomBytes, randomUUID } from 'node:crypto';
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
  'steel', 'wood', 'tiles', 'granite', 'unsure',
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

export async function POST(request: Request) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !secretKey) {
    console.error('Supabase server environment variables are missing.');
    return fail('The enquiry service is not configured yet.', 500);
  }

  let body: Record<string, unknown>;

  try {
    const parsed: unknown = await request.json();

    if (!isRecord(parsed)) {
      return fail('Invalid enquiry data.');
    }

    body = parsed;
  } catch {
    return fail('The request body must be valid JSON.');
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

    fileInputs.push({ name, size, type, extension });
  }

  const supabase = createClient(supabaseUrl, secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const id = randomUUID();
  const reference = `QUT-${new Date().getFullYear()}-${id
    .replace(/-/g, '')
    .slice(0, 8)
    .toUpperCase()}`;

  const uploadSecret = fileInputs.length
    ? randomBytes(32).toString('hex')
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
        .createSignedUploadUrl(path);

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
      specifications: isRecord(details.specs) ? details.specs : {},
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
    };

    const { error } = await supabase
      .from('enquiries')
      .insert(record);

    if (error) {
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

