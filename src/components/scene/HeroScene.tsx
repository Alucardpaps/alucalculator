'use client';

/**
 * AluCalc OS v5.0 — Cinematic Hero Scene v2
 *
 * Engineering component showcase: gears, nuts, bolts, profiles
 * floating in a cinematic arrangement with parallax camera.
 *
 * Performance budget: dpr=[1, 1.5], no shadows, instanced where possible.
 */

import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Stars, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { useRouter } from 'next/navigation';

// Global mouse state for parallax (outside React to avoid re-renders)
const mouseState = { x: 0, y: 0 };

// ════════════════════════════════════════════
// Gear (involute-style toothed cylinder)
// ════════════════════════════════════════════

const Gear = ({
  position,
  color,
  radius = 0.5,
  teeth = 18,
  thickness = 0.1,
  speed = 0.3,
  href,
}: {
  position: [number, number, number];
  color: string;
  radius?: number;
  teeth?: number;
  thickness?: number;
  speed?: number;
  href?: string;
}) => {
  const router = useRouter();
  const groupRef = useRef<THREE.Group>(null);

  const gearShape = useMemo(() => {
    const shape = new THREE.Shape();
    const innerRadius = radius * 0.65;
    const toothHeight = radius * 0.18;
    const toothWidth = (Math.PI * 2) / teeth / 2;

    // Draw gear profile
    for (let i = 0; i < teeth; i++) {
      const angle = (i / teeth) * Math.PI * 2;
      const nextAngle = ((i + 1) / teeth) * Math.PI * 2;
      const midAngle = angle + toothWidth;
      const midAngle2 = nextAngle - toothWidth * 0.1;

      // Tooth root
      const r = radius - toothHeight;
      if (i === 0) {
        shape.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
      }

      // Tooth tip
      shape.lineTo(Math.cos(angle + toothWidth * 0.3) * radius, Math.sin(angle + toothWidth * 0.3) * radius);
      shape.lineTo(Math.cos(midAngle) * radius, Math.sin(midAngle) * radius);

      // Back to root
      shape.lineTo(Math.cos(midAngle + toothWidth * 0.3) * r, Math.sin(midAngle + toothWidth * 0.3) * r);
      shape.lineTo(Math.cos(nextAngle) * r, Math.sin(nextAngle) * r);
    }

    // Center hole
    const holePath = new THREE.Path();
    const holeRadius = radius * 0.2;
    holePath.absarc(0, 0, holeRadius, 0, Math.PI * 2, true);
    shape.holes.push(holePath);

    return shape;
  }, [radius, teeth]);

  const extrudeSettings = useMemo(() => ({
    steps: 1,
    depth: thickness,
    bevelEnabled: true,
    bevelThickness: 0.005,
    bevelSize: 0.005,
    bevelSegments: 2,
  }), [thickness]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime() * speed;
    groupRef.current.rotation.z = t;
  });

  return (
    <Float speed={1.2} rotationIntensity={0.1} floatIntensity={0.3}>
      <group ref={groupRef} position={position} 
        onClick={(e) => { if(href) { e.stopPropagation(); router.push(href); } }}
        onPointerOver={(e) => { if(href) { e.stopPropagation(); document.body.style.cursor = 'pointer'; } }}
        onPointerOut={(e) => { if(href) { e.stopPropagation(); document.body.style.cursor = 'auto'; } }}
      >
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <extrudeGeometry args={[gearShape, extrudeSettings]} />
          <meshStandardMaterial
            color={color}
            metalness={0.9}
            roughness={0.1}
            emissive={color}
            emissiveIntensity={0.08}
          />
        </mesh>
      </group>
    </Float>
  );
};

// ════════════════════════════════════════════
// Hex Nut
// ════════════════════════════════════════════

const HexNut = ({
  position,
  color,
  size = 0.15,
  speed = 0.5,
  href,
}: {
  position: [number, number, number];
  color: string;
  size?: number;
  speed?: number;
  href?: string;
}) => {
  const router = useRouter();
  const ref = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime() * speed;
    ref.current.rotation.y = t;
    ref.current.rotation.x = Math.sin(t * 0.6) * 0.3;
  });

  return (
    <Float speed={1.8} rotationIntensity={0.4} floatIntensity={0.5}>
      <group ref={ref} position={position}
        onClick={(e) => { if(href) { e.stopPropagation(); router.push(href); } }}
        onPointerOver={(e) => { if(href) { e.stopPropagation(); document.body.style.cursor = 'pointer'; } }}
        onPointerOut={(e) => { if(href) { e.stopPropagation(); document.body.style.cursor = 'auto'; } }}
      >
        {/* Hex body */}
        <mesh>
          <cylinderGeometry args={[size, size, size * 0.6, 6]} />
          <meshStandardMaterial
            color={color}
            metalness={0.88}
            roughness={0.12}
            emissive={color}
            emissiveIntensity={0.06}
          />
        </mesh>
        {/* Center hole */}
        <mesh>
          <cylinderGeometry args={[size * 0.4, size * 0.4, size * 0.62, 16]} />
          <meshStandardMaterial color="#050810" metalness={0.95} roughness={0.1} />
        </mesh>
        {/* Chamfer rings */}
        <mesh position={[0, size * 0.31, 0]}>
          <torusGeometry args={[size * 0.85, 0.003, 4, 6]} />
          <meshStandardMaterial color={color} metalness={0.9} roughness={0.1} emissive={color} emissiveIntensity={0.15} />
        </mesh>
        <mesh position={[0, -size * 0.31, 0]}>
          <torusGeometry args={[size * 0.85, 0.003, 4, 6]} />
          <meshStandardMaterial color={color} metalness={0.9} roughness={0.1} emissive={color} emissiveIntensity={0.15} />
        </mesh>
      </group>
    </Float>
  );
};

// ════════════════════════════════════════════
// Hex Bolt
// ════════════════════════════════════════════

const HeroBolt = ({
  position,
  color,
  speed = 0.35,
  href,
}: {
  position: [number, number, number];
  color: string;
  speed?: number;
  href?: string;
}) => {
  const router = useRouter();
  const ref = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime() * speed;
    ref.current.rotation.z = Math.sin(t) * 0.4;
    ref.current.rotation.x = Math.cos(t * 0.7) * 0.2;
  });

  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.4}>
      <group ref={ref} position={position}
        onClick={(e) => { if(href) { e.stopPropagation(); router.push(href); } }}
        onPointerOver={(e) => { if(href) { e.stopPropagation(); document.body.style.cursor = 'pointer'; } }}
        onPointerOut={(e) => { if(href) { e.stopPropagation(); document.body.style.cursor = 'auto'; } }}
      >
        {/* Hex head */}
        <mesh position={[0, 0.18, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.04, 6]} />
          <meshStandardMaterial
            color={color}
            metalness={0.92}
            roughness={0.08}
            emissive={color}
            emissiveIntensity={0.05}
          />
        </mesh>
        {/* Shaft */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.32, 12]} />
          <meshStandardMaterial
            color={color}
            metalness={0.88}
            roughness={0.12}
            emissive={color}
            emissiveIntensity={0.04}
          />
        </mesh>
        {/* Thread rings */}
        {Array.from({ length: 8 }, (_, i) => (
          <mesh key={i} position={[0, -0.05 + i * 0.025, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.032, 0.002, 4, 12]} />
            <meshStandardMaterial color="#0f172a" transparent opacity={0.5} />
          </mesh>
        ))}
      </group>
    </Float>
  );
};

// ════════════════════════════════════════════
// Aluminum Profile Bar
// ════════════════════════════════════════════

const ProfileBar = ({
  position,
  color,
  length = 1,
  speed = 0.2,
  rotationAxis = 'z',
  href,
}: {
  position: [number, number, number];
  color: string;
  length?: number;
  speed?: number;
  rotationAxis?: 'x' | 'y' | 'z';
  href?: string;
}) => {
  const router = useRouter();
  const ref = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime() * speed;
    ref.current.rotation[rotationAxis] = Math.sin(t) * 0.15;
    ref.current.position.y = position[1] + Math.sin(t * 0.6) * 0.08;
  });

  return (
    <Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.25}>
      <group ref={ref} position={position}
        onClick={(e) => { if(href) { e.stopPropagation(); router.push(href); } }}
        onPointerOver={(e) => { if(href) { e.stopPropagation(); document.body.style.cursor = 'pointer'; } }}
        onPointerOut={(e) => { if(href) { e.stopPropagation(); document.body.style.cursor = 'auto'; } }}
      >
        {/* Outer body */}
        <mesh>
          <boxGeometry args={[length, 0.08, 0.08]} />
          <meshStandardMaterial
            color={color}
            metalness={0.85}
            roughness={0.15}
            emissive={color}
            emissiveIntensity={0.1}
          />
        </mesh>
        {/* T-slot channel */}
        <mesh>
          <boxGeometry args={[length - 0.01, 0.035, 0.035]} />
          <meshStandardMaterial color="#060a12" metalness={0.9} roughness={0.3} />
        </mesh>
        {/* End caps glow */}
        <mesh position={[-length / 2, 0, 0]}>
          <sphereGeometry args={[0.012, 8, 8]} />
          <meshBasicMaterial color={color} transparent opacity={0.6} />
        </mesh>
        <mesh position={[length / 2, 0, 0]}>
          <sphereGeometry args={[0.012, 8, 8]} />
          <meshBasicMaterial color={color} transparent opacity={0.6} />
        </mesh>
      </group>
    </Float>
  );
};

// ════════════════════════════════════════════
// Washer (flat ring)
// ════════════════════════════════════════════

const Washer = ({
  position,
  color,
  speed = 0.6,
  href,
}: {
  position: [number, number, number];
  color: string;
  speed?: number;
  href?: string;
}) => {
  const router = useRouter();
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime() * speed;
    ref.current.rotation.x = t;
    ref.current.rotation.y = Math.sin(t * 0.5) * 0.5;
  });

  return (
    <Float speed={2} rotationIntensity={0.6} floatIntensity={0.4}>
      <mesh ref={ref} position={position}
        onClick={(e) => { if(href) { e.stopPropagation(); router.push(href); } }}
        onPointerOver={(e) => { if(href) { e.stopPropagation(); document.body.style.cursor = 'pointer'; } }}
        onPointerOut={(e) => { if(href) { e.stopPropagation(); document.body.style.cursor = 'auto'; } }}
      >
        <torusGeometry args={[0.08, 0.02, 8, 24]} />
        <meshStandardMaterial
          color={color}
          metalness={0.9}
          roughness={0.1}
          emissive={color}
          emissiveIntensity={0.1}
        />
      </mesh>
    </Float>
  );
};

// ════════════════════════════════════════════
// Particle Dust (floating dots)
// ════════════════════════════════════════════

const EngineeringDust = () => {
  const count = 60;
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 12;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 8;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    return arr;
  }, []);

  const ref = useRef<THREE.Points>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y = clock.getElapsedTime() * 0.02;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.015} color="#3b82f6" transparent opacity={0.4} sizeAttenuation />
    </points>
  );
};

// ════════════════════════════════════════════
// Cinematic Camera (uses window-level mouse tracking)
// ════════════════════════════════════════════

const CinematicCamera = () => {
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      mouseState.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseState.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  useFrame(({ camera, clock }) => {
    const t = clock.getElapsedTime() * 0.12;

    const targetX = Math.sin(t) * 2.5 + mouseState.x * 1.8;
    const targetY = 1.2 + mouseState.y * 0.6 + Math.sin(t * 0.5) * 0.3;
    const targetZ = Math.cos(t) * 3.5 + 7;

    camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, 0.015);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 0.015);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.015);
    camera.lookAt(0, 0.2, 0);
  });

  return null;
};

// ════════════════════════════════════════════
// Main Scene
// ════════════════════════════════════════════

const HeroSceneContent = () => {
  return (
    <>
      <CinematicCamera />

      {/* Mood lighting */}
      <ambientLight intensity={0.25} color="#1e3a5f" />
      <pointLight position={[5, 5, 5]} intensity={1.8} color="#60a5fa" distance={25} />
      <pointLight position={[-5, 3, -5]} intensity={1.0} color="#a78bfa" distance={20} />
      <pointLight position={[0, -3, 3]} intensity={0.5} color="#f472b6" distance={12} />
      <pointLight position={[3, -1, -3]} intensity={0.4} color="#34d399" distance={12} />

      {/* ═══ MAIN GEAR CLUSTER (center) ═══ */}
      <Gear position={[0, 0.3, 0]} color="#60a5fa" radius={0.55} teeth={20} thickness={0.08} speed={0.15} href="/gears" />
      <Gear position={[-0.85, -0.4, 0.2]} color="#818cf8" radius={0.35} teeth={14} thickness={0.06} speed={-0.24} href="/gears" />
      <Gear position={[1.0, -0.2, -0.3]} color="#38bdf8" radius={0.4} teeth={16} thickness={0.07} speed={-0.19} href="/gears" />

      {/* ═══ PROFILE BARS (frame structure) ═══ */}
      <ProfileBar position={[-2.2, 0.8, -0.5]} color="#60a5fa" length={1.4} speed={0.15} href="/aluminum" />
      <ProfileBar position={[2.0, -0.5, -1]} color="#38bdf8" length={1.0} speed={0.18} rotationAxis="y" href="/aluminum" />
      <ProfileBar position={[0, 1.8, -0.8]} color="#818cf8" length={1.6} speed={0.12} href="/aluminum" />

      {/* ═══ NUTS (scattered) ═══ */}
      <HexNut position={[-1.8, -0.8, 0.5]} color="#f59e0b" size={0.12} speed={0.4} href="/fasteners" />
      <HexNut position={[1.5, 1.2, 0.3]} color="#f59e0b" size={0.09} speed={-0.5} href="/fasteners" />
      <HexNut position={[2.5, 0.3, -0.5]} color="#eab308" size={0.1} speed={0.35} href="/fasteners" />

      {/* ═══ BOLTS ═══ */}
      <HeroBolt position={[-1.2, 1.3, 0.4]} color="#94a3b8" speed={0.25} href="/fasteners" />
      <HeroBolt position={[1.8, -1.0, 0.8]} color="#cbd5e1" speed={-0.3} href="/fasteners" />

      {/* ═══ WASHERS ═══ */}
      <Washer position={[2.8, 0.8, 0]} color="#a78bfa" speed={0.5} href="/fasteners" />
      <Washer position={[-2.5, 0.2, 0.6]} color="#60a5fa" speed={-0.4} href="/fasteners" />
      <Washer position={[0.5, -1.5, 0.5]} color="#34d399" speed={0.6} href="/fasteners" />

      {/* ═══ ATMOSPHERE ═══ */}
      <EngineeringDust />

      <Stars
        radius={80}
        depth={50}
        count={2500}
        factor={3}
        saturation={0.1}
        fade
        speed={0.3}
      />

      {/* Ground reference grid */}
      <gridHelper
        args={[30, 30, '#0f2847', '#0a1a33']}
        position={[0, -2.5, 0]}
      />
    </>
  );
};

// ════════════════════════════════════════════
// Exported Component
// ════════════════════════════════════════════

export const HeroScene = () => {
  return (
    <div className="absolute inset-0 z-0" style={{ pointerEvents: 'none' }}>
      <Canvas
        dpr={[1, 1.5]}
        style={{ pointerEvents: 'none' }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 0.85,
        }}
        onCreated={({ gl }) => {
          gl.setClearColor('#020408');
        }}
      >
        <PerspectiveCamera makeDefault position={[0, 1.5, 8]} fov={45} />
        <HeroSceneContent />
      </Canvas>
    </div>
  );
};
