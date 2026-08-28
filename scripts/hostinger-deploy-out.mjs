/**
 * Zip is created separately as deploy-out.zip in project root.
 * Env: HOSTINGER_API_TOKEN
 */
import fs from 'fs';
import path from 'path';

const TOKEN = process.env.HOSTINGER_API_TOKEN;
const USER = process.env.HOSTINGER_USER || 'u199833058';
const DOMAIN = process.env.HOSTINGER_DOMAIN || 'alucalculator.com';
const ARCHIVE = process.env.HOSTINGER_ARCHIVE || 'deploy-out.zip';
const API = 'https://developers.hostinger.com';

if (!TOKEN) {
  console.error('Missing HOSTINGER_API_TOKEN');
  process.exit(2);
}

const zipPath = path.resolve(ARCHIVE);
if (!fs.existsSync(zipPath)) {
  console.error('Missing', zipPath);
  process.exit(1);
}
const size = fs.statSync(zipPath).size;
console.log('archive', ARCHIVE, size, 'bytes');

async function api(method, pathname, body) {
  const res = await fetch(`${API}${pathname}`, {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text.slice(0, 400) };
  }
  if (!res.ok) {
    console.error(method, pathname, res.status, JSON.stringify(json).slice(0, 500));
    process.exit(1);
  }
  return json;
}

async function tusUpload(url, authKey, restKey, destName) {
  const tusUrl = `${url.replace(/\/$/, '')}/${destName}?override=true`;
  const headers = {
    'X-Auth': authKey,
    'X-Auth-Rest': restKey,
    'Tus-Resumable': '1.0.0',
  };
  console.log('TUS create…');
  const create = await fetch(tusUrl, {
    method: 'POST',
    headers: { ...headers, 'Upload-Length': String(size), 'Upload-Offset': '0' },
  });
  const createText = await create.text();
  console.log('create', create.status);
  if (![200, 201, 204].includes(create.status)) {
    console.error(createText.slice(0, 300));
    process.exit(1);
  }
  console.log('TUS patch…');
  const body = fs.readFileSync(zipPath);
  const patch = await fetch(tusUrl, {
    method: 'PATCH',
    headers: {
      ...headers,
      'Content-Type': 'application/offset+octet-stream',
      'Upload-Offset': '0',
    },
    body,
  });
  const patchText = await patch.text();
  console.log('patch', patch.status, 'offset', patch.headers.get('upload-offset'));
  if (![200, 201, 204].includes(patch.status)) {
    console.error(patchText.slice(0, 300));
    process.exit(1);
  }
}

const creds = await api('POST', '/api/hosting/v1/files/upload-urls', {
  username: USER,
  domain: DOMAIN,
});
const data = creds.data || creds;
if (!data.url || !data.auth_key || !data.rest_auth_key) {
  console.error('Unexpected upload-url payload keys', Object.keys(creds));
  process.exit(1);
}
console.log('TUS endpoint ready');
await tusUpload(data.url, data.auth_key, data.rest_auth_key, ARCHIVE);

console.log('Deploy archive…');
await api(
  'POST',
  `/api/hosting/v1/accounts/${USER}/websites/${DOMAIN}/deploy`,
  { archive_path: ARCHIVE },
);
console.log('Deploy requested');

console.log('Clear cache…');
await api('DELETE', `/api/hosting/v1/accounts/${USER}/websites/${DOMAIN}/cache/clear`);
console.log('Cache cleared. Deploy complete.');
