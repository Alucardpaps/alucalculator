const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'node_modules', '@salusoft89', 'planegcs', 'dist', 'planegcs_dist', 'planegcs.js');

if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    if (content.includes('import("module")') && !content.includes('/* webpackIgnore: true */')) {
        content = content.replace('import("module")', 'import(/* webpackIgnore: true */ "module")');
        modified = true;
    }

    if (content.includes('new URL("./",import.meta.url)')) {
        content = content.replaceAll('new URL("./",import.meta.url)', 'new URL("file:///")');
        modified = true;
    }

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Successfully patched @salusoft89/planegcs for Turbopack & Next.js compatibility.');
    } else {
        console.log('@salusoft89/planegcs is already patched.');
    }
} else {
    console.log('@salusoft89/planegcs not found. Skipping patch.');
}
