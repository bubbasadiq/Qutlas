const fs = require('node:fs');

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)
    .filter((line) => /^\s*[^#=\s]+\s*=/.test(line))
    .map((line) => {
      const separator = line.indexOf('=');
      return [line.slice(0, separator).trim(), line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '')];
    }),
);
const base = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
console.log(JSON.stringify({ kind: 'environment', names: Object.keys(env) }));

async function probe(name, key, useBearer) {
  const headers = { apikey: key };
  if (useBearer) headers.Authorization = `Bearer ${key}`;
  try {
    const response = await fetch(`${base}/rest/v1/enquiries?select=id,reference&limit=0`, { headers });
    let body = {};
    try { body = await response.json(); } catch {}
    console.log(JSON.stringify({ keyName: name, bearer: useBearer, status: response.status, code: body.code ?? null }));
  } catch (error) {
    console.log(JSON.stringify({ keyName: name, bearer: useBearer, error: error.name }));
  }
}

(async () => {
  if (!base) return console.log(JSON.stringify({ configuredUrl: false }));
  for (const keyName of ['SUPABASE_SECRET_KEY', 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY']) {
    const key = env[keyName];
    if (key) {
      await probe(keyName, key, false);
      await probe(keyName, key, true);
    }
  }
  const serverKey = env.SUPABASE_SECRET_KEY;
  const serverHeaders = { apikey: serverKey, Authorization: `Bearer ${serverKey}` };
  const openApi = await fetch(`${base}/rest/v1/`, { headers: serverHeaders });
  if (openApi.ok) {
    const specification = await openApi.json();
    const schemas = ['enquiries', 'orders', 'users', 'profiles', 'user_profiles'].map((name) => {
      const schema = specification.definitions?.[name];
      const columns = Object.fromEntries(Object.entries(schema?.properties ?? {}).map(([column, definition]) => [column, { type: definition.type ?? null, format: definition.format ?? null, required: schema.required?.includes(column) ?? false, default: definition.default ?? null }]));
      return { name, columns };
    });
    console.log(JSON.stringify({ kind: 'openapi-schemas', status: openApi.status, schemas }));
  } else {
    console.log(JSON.stringify({ kind: 'openapi-schemas', status: openApi.status }));
  }
  const bucket = await fetch(`${base}/storage/v1/bucket/qutlas-project-files`, { headers: serverHeaders });
  let bucketInfo = {};
  if (bucket.ok) {
    const data = await bucket.json();
    bucketInfo = { name: data.name, public: data.public, fileSizeLimit: data.file_size_limit, allowedMimeTypes: data.allowed_mime_types };
  }
  console.log(JSON.stringify({ kind: 'bucket-config', status: bucket.status, ...bucketInfo }));
})();