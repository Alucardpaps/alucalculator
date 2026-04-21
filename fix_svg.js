const fs = require('fs');
let file = fs.readFileSync('src/components/modules/mechanical/MachiningDetailsModule.tsx', 'utf8');

file = file.replace(/max-w-sm/g, 'max-w-4xl max-h-[600px]');
file = file.replace(/fontSize="[0-9\.]+"/g, 'fontSize="8" fontWeight="bold"');
file = file.replace(/markerWidth="[0-9]+"/g, 'markerWidth="6"');
file = file.replace(/markerHeight="[0-9]+"/g, 'markerHeight="6"');
file = file.replace(/strokeWidth="0\.3"/g, 'strokeWidth="0.8"');
file = file.replace(/strokeWidth="0\.5"/g, 'strokeWidth="1"');

// Circlip SVG tweaks to increase container space if it clips
file = file.replace(/viewBox="-80 -80 160 160"/g, 'viewBox="-110 -110 220 220"');
file = file.replace(/viewBox="-70 -60 140 120"/g, 'viewBox="-100 -90 200 180"');

// Make text slightly lighter to contrast against dark backgrounds
file = file.replace(/fill=\{SVG_TEXT\}/g, 'fill="#cbd5e1"'); // slate-300

fs.writeFileSync('src/components/modules/mechanical/MachiningDetailsModule.tsx', file);
