/**
 * Master script: generates translation data + locale-data-src/*.mjs
 * Run: node scripts/academy-i18n-data/locale-data-src/create-all-locales.mjs
 */
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..', '..', '..');

function run(cmd, args) {
  const r = spawnSync(cmd, args, { cwd: root, stdio: 'inherit', shell: true });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

run('node', ['scripts/academy-i18n-data/locale-data-src/generate-translation-data.mjs']);
run('node', ['scripts/academy-i18n-data/locale-data-src/packs/build-packs.mjs']);
run('node', ['scripts/academy-i18n-data/generate-locale-data.mjs']);
run('node', ['scripts/academy-i18n-data/full-sync.mjs']);
run('npx', ['tsx', 'scripts/academy-i18n-data/build-all.ts']);
