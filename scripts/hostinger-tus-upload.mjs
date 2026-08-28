import fs from 'fs';
import path from 'path';

const filePath = path.resolve('deploy-out.zip');
const stat = fs.statSync(filePath);
const size = stat.size;
const destName = process.env.TUS_NAME || 'deploy-out.zip';
const base = process.env.TUS_URL;
const auth = process.env.TUS_AUTH;
const rest = process.env.TUS_REST;
if (!base || !auth || !rest) {
  console.error('Missing TUS_URL / TUS_AUTH / TUS_REST');
  process.exit(2);
}

const url = `${base.replace(/\/$/, '')}/${destName}?override=true`;
const headers = {
  'X-Auth': auth,
  'X-Auth-Rest': rest,
  'Tus-Resumable': '1.0.0',
};

async function main() {
  console.log('TUS create', destName, size, 'bytes');
  const create = await fetch(url, {
    method: 'POST',
    headers: {
      ...headers,
      'Upload-Length': String(size),
      'Upload-Offset': '0',
    },
  });
  const createText = await create.text();
  console.log('create status', create.status, createText.slice(0, 200));
  if (![200, 201, 204].includes(create.status)) {
    process.exit(1);
  }

  const body = fs.readFileSync(filePath);
  console.log('TUS patch…');
  const patch = await fetch(url, {
    method: 'PATCH',
    headers: {
      ...headers,
      'Content-Type': 'application/offset+octet-stream',
      'Upload-Offset': '0',
    },
    body,
  });
  const patchText = await patch.text();
  console.log('patch status', patch.status, 'offset', patch.headers.get('upload-offset'), patchText.slice(0, 200));
  if (![200, 201, 204].includes(patch.status)) {
    process.exit(1);
  }
  console.log('TUS upload complete');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
