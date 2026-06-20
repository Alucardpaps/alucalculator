const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const svgPath = path.join(__dirname, '../src/app/icon.svg');
const destDir = path.join(__dirname, '../public/icons');

// Ensure destination folder exists
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

const sizes = [72, 96, 192, 512];

async function generateIcons() {
  console.log('Generating PWA Icons from SVG...');
  const svgBuffer = fs.readFileSync(svgPath);

  for (const size of sizes) {
    const destPath = path.join(destDir, `icon-${size}.png`);
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(destPath);
    console.log(`Generated: ${destPath}`);
  }
  console.log('PWA Icons generation complete!');
}

generateIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
