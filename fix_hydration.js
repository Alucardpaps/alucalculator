const fs = require('fs');
let file = fs.readFileSync('src/components/calculators/gearbox/GearboxSchematic.tsx', 'utf8');

// Replace floating point calculations with .toFixed(3)
file = file.replace(/const p1x = cx \+ Math.cos\(a1\) \* rRoot; const p1y = cy \+ Math.sin\(a1\) \* rRoot;/g, 'const p1x = (cx + Math.cos(a1) * rRoot).toFixed(3); const p1y = (cy + Math.sin(a1) * rRoot).toFixed(3);');
file = file.replace(/const p2x = cx \+ Math.cos\(a2\) \* rTip; const p2y = cy \+ Math.sin\(a2\) \* rTip;/g, 'const p2x = (cx + Math.cos(a2) * rTip).toFixed(3); const p2y = (cy + Math.sin(a2) * rTip).toFixed(3);');
file = file.replace(/const p3x = cx \+ Math.cos\(a3\) \* rTip; const p3y = cy \+ Math.sin\(a3\) \* rTip;/g, 'const p3x = (cx + Math.cos(a3) * rTip).toFixed(3); const p3y = (cy + Math.sin(a3) * rTip).toFixed(3);');
file = file.replace(/const p4x = cx \+ Math.cos\(a4\) \* rRoot; const p4y = cy \+ Math.sin\(a4\) \* rRoot;/g, 'const p4x = (cx + Math.cos(a4) * rRoot).toFixed(3); const p4y = (cy + Math.sin(a4) * rRoot).toFixed(3);');

file = file.replace(/A \${rTip},\${rTip}/g, 'A ${Number(rTip).toFixed(3)},${Number(rTip).toFixed(3)}');
file = file.replace(/A \${rRoot},\${rRoot}/g, 'A ${Number(rRoot).toFixed(3)},${Number(rRoot).toFixed(3)}');

file = file.replace(/\${cx \+ Math.cos\(firstA1\) \* firstRRoot},\${cy \+ Math.sin\(firstA1\) \* firstRRoot}/g, '${(cx + Math.cos(firstA1) * firstRRoot).toFixed(3)},${(cy + Math.sin(firstA1) * firstRRoot).toFixed(3)}');

file = file.replace(/\${cx - outerR},\${cy} A \${outerR},\${outerR} 0 1 0 \${cx \+ outerR},\${cy} A \${outerR},\${outerR} 0 1 0 \${cx - outerR},\${cy}/g, '${(cx - outerR).toFixed(3)},${Number(cy).toFixed(3)} A ${Number(outerR).toFixed(3)},${Number(outerR).toFixed(3)} 0 1 0 ${(cx + outerR).toFixed(3)},${Number(cy).toFixed(3)} A ${Number(outerR).toFixed(3)},${Number(outerR).toFixed(3)} 0 1 0 ${(cx - outerR).toFixed(3)},${Number(cy).toFixed(3)}');

// Also fix the polygon points in Carrier System
file = file.replace(/return \`\\\${\(Math.cos\\(a\\)\*rOrbit\)},\\\${\(Math.sin\\(a\\)\*rOrbit\)}\`;/g, 'return `${(Math.cos(a)*rOrbit).toFixed(3)},${(Math.sin(a)*rOrbit).toFixed(3)}`;');

// Also fix translate in Carrier pins
file = file.replace(/transform={\`translate\(\\\${px}, \\\${py}\)\`}/g, 'transform={`translate(${Number(px).toFixed(3)}, ${Number(py).toFixed(3)})`}');

// Also fix cross section rects to avoid float mismatch
file = file.replace(/width={\(srr \+ 20\) \* 2}/g, 'width={Number((srr + 20) * 2).toFixed(3)}');

fs.writeFileSync('src/components/calculators/gearbox/GearboxSchematic.tsx', file);
console.log('Fixed hydration errors.');
