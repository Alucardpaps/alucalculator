const fs = require('fs');
const path = require('path');
const dirs = ['src/calculators/schemas-v2', 'src/calculators/schemas'];
const modules = {};
const commonKeys = new Set();
dirs.forEach(d => {
    if (!fs.existsSync(d)) return;
    fs.readdirSync(d).forEach(f => {
        if (!f.endsWith('.ts') && !f.endsWith('.tsx')) return;
        const code = fs.readFileSync(path.join(d, f), 'utf-8');
        const idMatch = code.match(/id:\s*['"]([^'"]+)['"]/);
        const titleMatch = code.match(/title:\s*['"]([^'"]+)['"]/);
        if (idMatch && titleMatch) {
            modules[idMatch[1]] = titleMatch[1];
        }
        // Match common keys: key: 'thickness'
        const keyMatches = [...code.matchAll(/key:\s*['"]([^'"]+)['"]/g)];
        keyMatches.forEach(m => commonKeys.add(m[1]));
    });
});
console.log("MODULES:\n" + JSON.stringify(modules, null, 2));
console.log("\nKEYS:\n" + JSON.stringify(Array.from(commonKeys), null, 2));
