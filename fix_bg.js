const fs = require('fs');

const path = 'src/components/modules/fea/BeamCanvas3D.tsx';
let content = fs.readFileSync(path, 'utf-8');

// Replace bg-[#050505] with explicit dark background to ensure it renders correctly
content = content.replace(
    'className="w-full h-full relative overflow-hidden bg-[#050505] font-mono select-none"',
    'className="w-full h-full relative overflow-hidden font-mono select-none" style={{ backgroundColor: "#020305" }}'
);

// Inject background color inside canvas
content = content.replace(
    '<PerspectiveCamera makeDefault position={[8, 6, 8]} fov={45} />',
    '<color attach="background" args={["#020305"]} />\n                    <PerspectiveCamera makeDefault position={[8, 6, 8]} fov={45} />'
);

fs.writeFileSync(path, content);
console.log("Updated BeamCanvas3D.tsx");
