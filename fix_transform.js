const fs = require('fs');
let file = fs.readFileSync('src/components/modules/mechanical/MachiningDetailsModule.tsx', 'utf8');

// Replace transform=`...` with transform={`...`}
file = file.replace(/transform=\`([^`]+)\`/g, 'transform={`$1`}');

fs.writeFileSync('src/components/modules/mechanical/MachiningDetailsModule.tsx', file);
console.log('Fixed missing braces in JSX template literals for transform.');
