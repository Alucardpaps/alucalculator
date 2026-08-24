'use client';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Box } from '@react-three/drei';

const BeamVisualizer = ({ deflection }: { deflection: number }) => {
  return (
    <Canvas camera={{ position: [0, 2, 10], fov: 50 }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <OrbitControls />
      {/* A simple representation of a beam, curving based on deflection */}
      <group>
        {/* We use a simple cylinder to represent the beam. In a real scenario with high deflection,
            a custom shader or multiple segments would be used to physically bend the mesh. */}
        <mesh position={[0, -deflection, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.2, 0.2, 8, 32]} />
          <meshStandardMaterial color="#4f46e5" wireframe />
        </mesh>
        <Box args={[0.4, 0.4, 0.4]} position={[-4, -0.2, 0]}>
          <meshStandardMaterial color="#9ca3af" />
        </Box>
        <Box args={[0.4, 0.4, 0.4]} position={[4, -0.2, 0]}>
          <meshStandardMaterial color="#9ca3af" />
        </Box>
        {/* Load indicator */}
        <mesh position={[0, 1 - deflection, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.3, 0.6, 16]} />
          <meshStandardMaterial color="#ef4444" />
        </mesh>
      </group>
      <gridHelper args={[20, 20]} position={[0, -2, 0]} />
    </Canvas>
  );
};

export default BeamVisualizer;
