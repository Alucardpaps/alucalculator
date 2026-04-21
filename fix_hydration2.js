const fs = require('fs');
let file = fs.readFileSync('src/components/calculators/gearbox/GearboxSchematic.tsx', 'utf8');

file = file.replace(/return `\\$\\{Math\\.cos\\(a\\)\\*rOrbit\\},\\$\\{Math\\.sin\\(a\\)\\*rOrbit\\}`;/g, 'return `${(Math.cos(a)*rOrbit).toFixed(3)},${(Math.sin(a)*rOrbit).toFixed(3)}`;');

file = file.replace(/transform={`translate\\(\\$\\{px\\}, \\$\\{py\\}\\)`}/g, 'transform={`translate(${Number(px).toFixed(3)}, ${Number(py).toFixed(3)})`}');

fs.writeFileSync('src/components/calculators/gearbox/GearboxSchematic.tsx', file);
console.log('Fixed polygon and translate hydration issues.');
