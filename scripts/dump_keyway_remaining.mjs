import fs from 'fs';

const missingByFile = JSON.parse(fs.readFileSync('scripts/missing_by_file.json', 'utf8'));
const keyway = missingByFile.find(f => f.file.includes('KeywayConnection'));
console.log('Total Keyway remaining keys:', keyway.missingItems.length);
fs.writeFileSync('scripts/keyway_remaining.json', JSON.stringify(keyway.missingItems, null, 2));
