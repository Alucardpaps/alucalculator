const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'node_modules', '@salusoft89', 'planegcs', 'dist', 'planegcs_dist', 'planegcs.js');

if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('import("module")') && !content.includes('/* webpackIgnore: true */')) {
        content = content.replace('import("module")', 'import(/* webpackIgnore: true */ "module")');
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Successfully patched @salusoft89/planegcs for Turbopack compatibility.');
    } else {
        console.log('@salusoft89/planegcs is already patched or import statement not found.');
    }
} else {
    console.log('@salusoft89/planegcs not found. Skipping patch.');
}
