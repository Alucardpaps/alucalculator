import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Grid } from '@react-three/drei';
import * as THREE from 'three';

interface Engineering3DProps {
  payload: {
    type: string;
    span?: number;
    load?: number;
    [key: string]: any;
  };
}

const BeamModel = ({ span = 2, load = 500 }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const deflScale = Math.min((load / 1000) * 0.5, 0.4); // Artificial visual scale

  useFrame((state) => {
    if (meshRef.current) {
         // Gentle oscillation representing dynamic loading strain
         const oscillation = Math.sin(state.clock.elapsedTime * 2) * 0.05;
         meshRef.current.position.y = -deflScale + oscillation;
         
         // Color shifting denoting stress (Green to Red heatmap approximation)
         const intensity = Math.min(load / 2000, 1);
         (meshRef.current.material as THREE.MeshStandardMaterial).color.lerp(
             new THREE.Color(intensity, 1 - intensity, 0.2), 
             0.1
         );
    }
  });

  return (
    <group>
      {/* Supports */}
      <mesh position={[-span/2, -0.5, 0]}>
         <coneGeometry args={[0.2, 0.5, 4]} />
         <meshStandardMaterial color="#444" wireframe />
      </mesh>
      
      {/* The Beam */}
      <mesh ref={meshRef} position={[0, 0, 0]}>
        <boxGeometry args={[span, 0.2, 0.2]} />
        <meshStandardMaterial color="#10b981" />
      </mesh>
      
      {/* Force Vector Arrow */}
      <group position={[0, 1 - deflScale, 0]}>
         <mesh position={[0, 0.5, 0]}>
             <cylinderGeometry args={[0.02, 0.02, 1]} />
             <meshStandardMaterial color="#ef4444" />
         </mesh>
         <mesh>
             <coneGeometry args={[0.1, 0.3, 8]} />
             <meshStandardMaterial color="#ef4444" />
         </mesh>
         <Text position={[0.3, 0.5, 0]} fontSize={0.2} color="white">
            {load}N
         </Text>
      </group>
    </group>
  );
};

export const Engineering3DView: React.FC<Engineering3DProps> = ({ payload }) => {
  return (
    <div className="w-full h-96 bg-black/80 rounded-2xl border border-emerald-500/20 shadow-inner overflow-hidden relative">
      <div className="absolute top-4 left-4 z-10 text-emerald-400 font-mono text-xs uppercase opacity-70">
          Neural Render Pipeline [ACTIVE]
      </div>
      
      <Canvas camera={{ position: [2, 2, 4], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1.5} />
        
        {payload.type === 'beam_deflection' && (
            <BeamModel span={payload.span} load={payload.load} />
        )}
        
        <Grid infiniteGrid fadeDistance={20} cellColor="#333" sectionColor="#555" position={[0, -0.5, 0]} />
        <OrbitControls makeDefault enablePan={false} maxPolarAngle={Math.PI / 2 + 0.1} />
      </Canvas>
    </div>
  );
};
