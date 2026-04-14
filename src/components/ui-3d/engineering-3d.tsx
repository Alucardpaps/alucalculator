'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Box, Cylinder, Text, Grid } from '@react-three/drei';
import * as THREE from 'three';

interface LoadVisualizerProps {
  materialType: 'aluminum' | 'steel' | 'unknown';
  profileType: 'rectangular' | 'circular' | 'i-beam' | 'unknown';
  length: number; // in mm
  forceApplied: number; // in N
}

const BeamMesh: React.FC<LoadVisualizerProps> = ({ materialType, profileType, length, forceApplied }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Scale down length for visualization purposes (e.g. 1000mm = 10 units)
  const renderedLength = length / 100;
  const radius = 0.5;
  const width = 1;

  // Change color based on material
  const materialColor = useMemo(() => {
    if (materialType === 'aluminum') return '#A5C9CA'; // light silver/blue
    if (materialType === 'steel') return '#606C38'; // darker industrial
    return '#E0E0E0';
  }, [materialType]);

  // We should clone the geometry to keep a non-mutated reference, or just do simple vertex shader.
  // For simplicity here, we'll just not animate the geometry vertices directly if it's too complex
  // Let's use a simpler approach: slightly bending the whole mesh using rotation or scale, or just rely on a simple visualizer.
  
  // Custom geometry modifier
  React.useEffect(() => {
    if (meshRef.current) {
        meshRef.current.geometry.userData.originalPositions = meshRef.current.geometry.attributes.position.clone();
    }
  }, [profileType, length]);

  useFrame((state) => {
    if (meshRef.current && meshRef.current.geometry.userData.originalPositions) {
        const time = state.clock.getElapsedTime();
        const maxDeflection = Math.min((forceApplied / 50000), 1.0); // Visual deflection factor
        const positionAttribute = meshRef.current.geometry.attributes.position;
        const originalPositions = meshRef.current.geometry.userData.originalPositions;
        
        for (let i = 0; i < positionAttribute.count; i++) {
            const x = originalPositions.getX(i);
            const y = originalPositions.getY(i);
            const z = originalPositions.getZ(i);
            
            // Calculate distance from center (x = 0)
            const normalizedDist = Math.abs(x) / (renderedLength / 2); // 0 at center, 1 at ends
            const bendShape = 1 - Math.pow(normalizedDist, 2); // Parabolic bend, 1 at center, 0 at ends
            
            // Wobble only the deflected parts
            const wobble = Math.sin(time * 5) * 0.05 * bendShape;
            
            // Apply downward deflection in the middle
            positionAttribute.setY(i, y - (bendShape * maxDeflection) + wobble);
        }
        positionAttribute.needsUpdate = true;
    }
  });

  return (
    <>
      <group>
        {profileType === 'circular' ? (
          <Cylinder ref={meshRef as any} args={[radius, radius, renderedLength, 32, 64]} rotation={[0, 0, Math.PI / 2]}>
            <meshStandardMaterial color={materialColor} roughness={0.3} metalness={0.8} />
          </Cylinder>
        ) : (
          <Box ref={meshRef as any} args={[renderedLength, width, width, 64, 1, 1]}>
            <meshStandardMaterial color={materialColor} roughness={0.3} metalness={0.8} />
          </Box>
        )}
      </group>
      
      {/* Force Arrow Indicator */}
      <group position={[0, width + 1, 0]}>
        <Cylinder args={[0.05, 0.2, 1, 16]} position={[0, -0.5, 0]}>
          <meshBasicMaterial color="#ef4444" />
        </Cylinder>
        <Text
          position={[0, 0.2, 0]}
          fontSize={0.5}
          color="#ef4444"
          anchorX="center"
          anchorY="middle"
        >
          {`${(forceApplied / 1000).toFixed(1)} kN`}
        </Text>
      </group>
      
      {/* Supports */}
      <Box args={[0.2, 1, width]} position={[-renderedLength / 2, -width, 0]}>
        <meshStandardMaterial color="#333" />
      </Box>
      <Box args={[0.2, 1, width]} position={[renderedLength / 2, -width, 0]}>
        <meshStandardMaterial color="#333" />
      </Box>
    </>
  );
};

export const Engineering3D: React.FC<LoadVisualizerProps> = (props) => {
  return (
    <div className="w-full h-full min-h-[400px] bg-slate-900 rounded-xl overflow-hidden relative">
      <Canvas camera={{ position: [0, 2, 10], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
        <pointLight position={[-10, 5, -10]} intensity={0.5} />
        
        <Grid 
          infiniteGrid 
          fadeDistance={30} 
          sectionColor="#4F4F4F" 
          cellColor="#262626" 
          position={[0, -1.5, 0]} 
        />
        
        <BeamMesh {...props} />
        
        <OrbitControls 
          enablePan={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 2}
        />
      </Canvas>
      <div className="absolute top-4 left-4 flex flex-col gap-1">
        <div className="text-white text-sm font-semibold bg-black/50 px-3 py-1 rounded-full backdrop-blur-md">
           Material: <span className="text-blue-400 capitalize">{props.materialType}</span>
        </div>
        <div className="text-white text-sm font-semibold bg-black/50 px-3 py-1 rounded-full backdrop-blur-md">
           Profile: <span className="text-blue-400 capitalize">{props.profileType}</span>
        </div>
      </div>
    </div>
  );
};
