const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'src', 'data', 'seo-calculators', 'calculators.json');
const destDir = path.join(__dirname, '..', 'public', 'api', 'ai', 'copilot');
const dest = path.join(destDir, 'calculators.json');

try {
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }
    fs.copyFileSync(src, dest);
    console.log('[Build Hook] Successfully copied calculators.json to public API directory.');
} catch (err) {
    console.error('[Build Hook] Failed to copy calculators.json:', err);
    process.exit(1);
}
