/**
 * Uploads ./out to Hostinger public_html via FTP/FTPS.
 * Env: FTP_HOST, FTP_USER, FTP_PASSWORD, FTP_REMOTE (default /public_html)
 */
import { Client } from 'basic-ftp';
import fs from 'fs';
import path from 'path';

const host = process.env.FTP_HOST || 'srv2070.hstgr.io';
const user = process.env.FTP_USER;
const password = process.env.FTP_PASSWORD;
const remote = process.env.FTP_REMOTE || '/public_html';
const local = path.resolve('out');

if (!user || !password) {
  console.error('Missing FTP_USER / FTP_PASSWORD.');
  process.exit(2);
}
if (!fs.existsSync(path.join(local, 'index.html'))) {
  console.error('out/index.html missing. Run npm run build first.');
  process.exit(1);
}

const client = new Client(60_000);
client.ftp.verbose = false;

async function main() {
  console.log(`Connecting ${host} → ${remote}`);
  await client.access({
    host,
    user,
    password,
    secure: false,
  });
  await client.ensureDir(remote);
  await client.cd(remote);
  console.log('Uploading out/ (this can take several minutes)…');
  await client.uploadFromDir(local);
  console.log('Upload complete.');
  client.close();
}

main().catch((err) => {
  console.error(err);
  client.close();
  process.exit(1);
});
