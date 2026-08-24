'use client';

/**
 * AluCalc OS v5.0 — Assembly Scene
 *
 * Main R3F Canvas for the workspace. Reads components from Zustand,
 * renders the correct mesh for each type, and handles drag interactions.
 *
 * KEY ARCHITECTURE:
 * - Reads from store via selective subscriptions (no full rerenders)
 * - Passes snap engine results to store (preview → commit pattern)
 * - All heavy math (snap calc) runs outside React render
 */

import { useCallback, useRef, useMemo, useEffect } from 'react';
import { Canvas, useThree, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Environment, Grid, GizmoHelper, GizmoViewport, TransformControls } from '@react-three/drei';
import * as THREE from 'three';
import { useShallow } from 'zustand/react/shallow';

import { useAssemblyStore } from '@/lib/store/assemblyStore';
import { calculateSnap } from '@/lib/engine/snapEngine';
import type { Vec3, WorkspaceComponent } from '@/lib/types/v5-types';

import { ProfileMesh } from './ProfileMesh';
import { BracketMesh } from './BracketMesh';
import { BoltMesh } from './BoltMesh';
import { GearMesh } from './GearMesh';
import { BearingMesh } from './BearingMesh';
import { KeyMesh } from './KeyMesh';
import { FinanceHUD } from './FinanceHUD';

// ════════════════════════════════════════════
// Component Renderer (maps type → mesh)
// ════════════════════════════════════════════

interface ComponentRendererProps {
  component: WorkspaceComponent;
  isSelected: boolean;
  isSnappable: boolean;
  isGhost?: boolean;
}

const ComponentRenderer = ({ component, isSelected, isSnappable, isGhost }: ComponentRendererProps) => {
  const selectComponent = useAssemblyStore((s) => s.selectComponent);
  const toolMode = useAssemblyStore((s) => s.toolMode);
  const updateTransform = useAssemblyStore((s) => s.updateTransform);
  const { controls } = useThree();
  const meshRef = useRef<THREE.Group>(null);
  const tcRef = useRef<any>(null);

  useEffect(() => {
    const tc = tcRef.current;
    if (!tc) return;
    const onDragging = (e: any) => {
      if (controls) (controls as any).enabled = !e.value;
    };
    tc.addEventListener('dragging-changed', onDragging);
    return () => tc.removeEventListener('dragging-changed', onDragging);
  }, [controls]);

  const handlePointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      selectComponent(component.id);
    },
    [component.id, selectComponent]
  );

  const meshProps = {
    id: component.id,
    isSelected,
    isSnappable,
    isGhost,
    onPointerDown: handlePointerDown,
  };

  return (
    <>
      <group ref={meshRef} position={component.position} rotation={component.rotation}>
        {component.type === 'profile' && <ProfileMesh {...meshProps} length={component.metadata.length} position={[0,0,0]} rotation={[0,0,0]} />}
        {component.type === 'bracket' && <BracketMesh {...meshProps} position={[0,0,0]} rotation={[0,0,0]} />}
        {component.type === 'bolt' && <BoltMesh {...meshProps} position={[0,0,0]} rotation={[0,0,0]} />}
        {component.type === 'gear' && <GearMesh {...meshProps} teeth={component.metadata.teeth} module={component.metadata.module} width={component.metadata.width} position={[0,0,0]} rotation={[0,0,0]} />}
        {component.type === 'bearing' && <BearingMesh {...meshProps} innerDia={component.metadata.innerDia} outerDia={component.metadata.outerDia} width={component.metadata.width} position={[0,0,0]} rotation={[0,0,0]} />}
        {component.type === 'key' && <KeyMesh {...meshProps} length={component.metadata.length} width={component.metadata.width} height={component.metadata.height} position={[0,0,0]} rotation={[0,0,0]} />}
      </group>

      {isSelected && toolMode !== 'select' && !isGhost && (
        <TransformControls
          ref={tcRef}
          object={meshRef as any}
          mode={toolMode as any}
          onObjectChange={() => {
            if (meshRef.current) {
              updateTransform(
                component.id,
                meshRef.current.position.toArray() as [number, number, number],
                meshRef.current.rotation.toArray() as [number, number, number]
              );
            }
          }}
        />
      )}
    </>
  );
};

const SceneContent = () => {
  // Subscribe to component IDs only (stable string array comparison via useShallow)
  const componentIds = useAssemblyStore(useShallow((s) => Object.keys(s.components)));
  const selectedId = useAssemblyStore((s) => s.selectedId);
  const selectComponent = useAssemblyStore((s) => s.selectComponent);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} color="#94a3b8" />
      <directionalLight
        position={[5, 8, 3]}
        intensity={1.2}
        color="#e2e8f0"
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <pointLight position={[-3, 5, -3]} intensity={0.5} color="#3b82f6" />

      {/* Environment for reflections */}
      <Environment preset="city" />

      {/* Grid */}
      <Grid
        position={[0, -0.001, 0]}
        args={[20, 20]}
        cellSize={0.25}
        cellThickness={0.5}
        cellColor="#1e293b"
        sectionSize={1}
        sectionThickness={1}
        sectionColor="#334155"
        fadeDistance={15}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid
      />

      {/* Components */}
      {componentIds.map((id) => {
        const comp = useAssemblyStore.getState().components[id];
        if (!comp) return null;

        return (
          <ComponentRenderer
            key={id}
            component={comp}
            isSelected={selectedId === id}
            isSnappable={false}
          />
        );
      })}

      {/* Finance HUD Overlay */}
      <FinanceHUD />

      {/* Click on void → deselect */}
      <mesh
        visible={false}
        position={[0, -0.01, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerDown={() => selectComponent(null)}
      >
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial />
      </mesh>

      {/* Camera controls */}
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.05}
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 2.1}
        minDistance={1}
        maxDistance={20}
        touches={{
          ONE: THREE.TOUCH.ROTATE,
          TWO: THREE.TOUCH.DOLLY_PAN
        }}
        enableZoom={true}
        enablePan={true}
      />

      {/* Viewport gizmo */}
      <GizmoHelper alignment="bottom-right" margin={[60, 60]}>
        <GizmoViewport labelColor="white" axisHeadScale={0.7} />
      </GizmoHelper>
    </>
  );
};

// ════════════════════════════════════════════
// Assembly Scene (exported Canvas wrapper)
// ════════════════════════════════════════════

export const AssemblyScene = () => {
  return (
    <div className="w-full h-full" style={{ background: '#080c12' }}>
      <Canvas
        dpr={[1, 1.5]}
        shadows
        camera={{ position: [3, 3, 3], fov: 50, near: 0.01, far: 100 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
        onCreated={({ gl }) => {
          gl.setClearColor('#080c12');
        }}
      >
        <SceneContent />
      </Canvas>
    </div>
  );
};
