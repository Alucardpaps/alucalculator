import fs from 'fs';

const code = fs.readFileSync('src/components/modules/mechanical/ORingModule.tsx', 'utf8');

// Find raw text in JSX: >Some Text<
const jsxTextRegex = />([A-Za-z0-9][^<>{}]*?[A-Za-z][^<>{}]*?)</g;
let m;
const rawTexts = new Set();
while ((m = jsxTextRegex.exec(code)) !== null) {
  const txt = m[1].trim();
  // Filter out numbers, single letters, units like mm, bar, rpm
  if (txt.length > 2 && !/^\d+[\s\w\/%°\.-]*$/.test(txt) && !txt.includes('=')) {
    rawTexts.add(txt);
  }
}

console.log('Raw JSX text strings in ORingModule.tsx:', rawTexts.size);
console.log('Samples:', Array.from(rawTexts).slice(0, 30));
