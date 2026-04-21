const fs = require('fs');
let file = fs.readFileSync('src/components/modules/mechanical/MachiningDetailsModule.tsx', 'utf8');

// Replace <TitleBlock title=`...` /> with <TitleBlock title={`...`} />
file = file.replace(/title=\`([^`]+)\`/g, 'title={`$1`}');

// Replace d=`...` with d={`...`}
file = file.replace(/d=\`([^`]+)\`/g, 'd={`$1`}');

fs.writeFileSync('src/components/modules/mechanical/MachiningDetailsModule.tsx', file);
console.log('Fixed missing braces in JSX template literals.');
