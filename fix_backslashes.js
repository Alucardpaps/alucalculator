const fs = require('fs');
let file = fs.readFileSync('src/components/modules/mechanical/MachiningDetailsModule.tsx', 'utf8');

// The file currently has things like: className={\`flex ... \${d.highlight
// We need to remove the backslash before backtick `\`` -> `` ` ``
file = file.replace(/\\\`/g, '`');

// And remove backslash before dollar sign `\$` -> `$`
file = file.replace(/\\\$/g, '$');

fs.writeFileSync('src/components/modules/mechanical/MachiningDetailsModule.tsx', file);
console.log('Fixed literal backslashes in JSX expressions!');
