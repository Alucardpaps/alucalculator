const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, '../src/data/handbookData.ts'), 'utf-8');

// Match everything inside single quotes
const matches = content.match(/'([^'\\]*(?:\\.[^'\\]*)*)'/g);

if (matches) {
    const unique = new Set();
    matches.forEach(m => {
        // remove the surrounding quotes
        let str = m.substring(1, m.length - 1);
        str = str.trim();
        // ignore short strings, purely numeric strings, and image paths
        if (str.length > 1 && !str.match(/^\d+(\.\d+)?$/) && !str.match(/^\//) && !str.match(/^[a-z_\-]+$/)) {
            unique.add(str);
        }
    });
    const arr = Array.from(unique);
    fs.writeFileSync(path.join(__dirname, 'unique_strings.json'), JSON.stringify(arr, null, 2));
    console.log("Extracted " + arr.length + " unique strings.");
} else {
    console.log("No strings found.");
}
