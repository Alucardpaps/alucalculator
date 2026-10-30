const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const repoRoot = path.resolve(__dirname, '..');

async function convertDirToWebp(dirRelative) {
  const fullDir = path.join(repoRoot, dirRelative);
  if (!fs.existsSync(fullDir)) return;

  const files = fs.readdirSync(fullDir).filter(f => f.endsWith('.png'));
  let totalOrigBytes = 0;
  let totalWebpBytes = 0;

  console.log(`\n--- Converting ${dirRelative} (${files.length} files) to WebP ---`);

  for (const file of files) {
    const filePath = path.join(fullDir, file);
    const origStat = fs.statSync(filePath);
    totalOrigBytes += origStat.size;

    const baseName = path.basename(file, '.png');
    const webpPath = path.join(fullDir, `${baseName}.webp`);

    await sharp(filePath)
      .webp({ quality: 85, effort: 6 })
      .toFile(webpPath);

    const webpStat = fs.statSync(webpPath);
    totalWebpBytes += webpStat.size;

    console.log(`  ✓ ${file}: ${(origStat.size / 1024).toFixed(1)} KB -> ${(webpStat.size / 1024).toFixed(1)} KB (-${((1 - webpStat.size / origStat.size) * 100).toFixed(0)}%)`);
  }

  const savedMb = ((totalOrigBytes - totalWebpBytes) / (1024 * 1024)).toFixed(2);
  const ratio = ((1 - totalWebpBytes / totalOrigBytes) * 100).toFixed(1);
  console.log(`Summary for ${dirRelative}: ${(totalOrigBytes / 1024 / 1024).toFixed(2)} MB -> ${(totalWebpBytes / 1024 / 1024).toFixed(2)} MB (Saved ${savedMb} MB, ${ratio}% reduction)`);
}

async function run() {
  await convertDirToWebp('public/assets/dashboard');
  await convertDirToWebp('public/images/news');
  console.log('\nWebP generation completed.');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
