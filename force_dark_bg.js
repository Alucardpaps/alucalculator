const fs = require('fs');

const path = 'src/components/modules/fea/BeamCanvas3D.tsx';
let content = fs.readFileSync(path, 'utf-8');

// Force pure dark and remove opacity
content = content.replace(
    '<div className="absolute inset-0 z-0 opacity-90">',
    '<div className="absolute inset-0 z-0 bg-[#020305]">'
);

// Inject strict GL properties and attach color firmly
content = content.replace(
    '<Canvas shadows dpr={[1, 2]} camera={{ position: [8, 6, 8], fov: 45 }}>',
    '<Canvas shadows dpr={[1, 2]} camera={{ position: [8, 6, 8], fov: 45 }} gl={{ alpha: false, antialias: true, clearColor: "#020305" }} onCreated={({ gl, scene }) => { scene.background = new THREE.Color("#020305"); gl.setClearColor("#020305"); }}>'
);

fs.writeFileSync(path, content);
console.log("Forced WebGL dark background");
