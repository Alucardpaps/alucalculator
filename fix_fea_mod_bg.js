const fs = require('fs');

const path = 'src/components/modules/fea/FeaModule.tsx';
let content = fs.readFileSync(path, 'utf-8');

// Replace bg-[#050505] with explicit dark background to ensure it renders correctly
content = content.replace(
    'className="w-full h-full relative font-mono text-xs flex flex-col bg-[#050505]"',
    'className="w-full h-full relative font-mono text-xs flex flex-col" style={{ backgroundColor: "#020305" }}'
);

fs.writeFileSync(path, content);
console.log("Updated FeaModule.tsx");
