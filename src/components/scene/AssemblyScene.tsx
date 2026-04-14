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

import { useCallback, useRef, useMemo } from 'react';
import { Canvas, useThree, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Environment, Grid, GizmoHelper, GizmoViewport } from '@react-three/drei';
import * as THREE from 'three';
import { useShallow } from 'zustand/react/shallow';

import { useAssemblyStore } from '@/lib/store/assemblyStore';
import { calculateSnap } from '@/lib/engine/snapEngine';
import type { Vec3, WorkspaceComponent } from '@/lib/types/v5-types';

import { ProfileMesh } from './ProfileMesh';
import { BracketMesh } from './BracketMesh';
import { BoltMesh } from './BoltMesh';

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
  const startDrag = useAssemblyStore((s) => s.startDrag);
  const selectComponent = useAssemblyStore((s) => s.selectComponent);

  const handlePointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      selectComponent(component.id);
      startDrag(component.id);
    },
    [component.id, selectComponent, startDrag]
  );

  const meshProps = {
    id: component.id,
    position: component.position,
    rotation: component.rotation,
    isSelected,
    isSnappable,
    isGhost,
    onPointerDown: handlePointerDown,
  };

  switch (component.type) {
    case 'profile':
      return <ProfileMesh {...meshProps} length={component.metadata.length} />;
    case 'bracket':
      return <BracketMesh {...meshProps} />;
    case 'bolt':
      return <BoltMesh {...meshProps} />;
    default:
      return null;
  }
};

// ════════════════════════════════════════════
// Drag Handler (runs snap engine on pointer move)
// ════════════════════════════════════════════

const DragHandler = () => {
  const { camera, raycaster, gl } = useThree();
  const groundPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);
  const intersectPoint = useMemo(() => new THREE.Vector3(), []);

  // Read only primitives and stable action refs
  const isDragging = useAssemblyStore((s) => s.dragState.isDragging);
  const draggedId = useAssemblyStore((s) => s.dragState.draggedComponentId);
  const updateDragPreview = useAssemblyStore((s) => s.updateDragPreview);
  const commitDrag = useAssemblyStore((s) => s.commitDrag);

  const handlePointerMove = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (!isDragging || !draggedId) return;

      // Read latest state directly (not via subscription)
      const state = useAssemblyStore.getState();

      raycaster.setFromCamera(
        new THREE.Vector2(
          (e.nativeEvent.clientX / gl.domElement.clientWidth) * 2 - 1,
          -(e.nativeEvent.clientY / gl.domElement.clientHeight) * 2 + 1
        ),
        camera
      );
      raycaster.ray.intersectPlane(groundPlane, intersectPoint);

      const worldPos: Vec3 = [intersectPoint.x, 0, intersectPoint.z];

      const draggedComponent = state.components[draggedId];
      if (!draggedComponent) return;

      const allComps = Object.values(state.components).filter(
        (c) => c.id !== draggedId
      );

      const snapResult = calculateSnap(
        draggedComponent,
        worldPos,
        allComps,
        state.connectionRules,
        state.snapConfig
      );

      updateDragPreview(
        snapResult.isSnapped ? snapResult.position : worldPos,
        snapResult.isSnapped ? snapResult.rotation : draggedComponent.rotation,
        snapResult
      );
    },
    [isDragging, draggedId, updateDragPreview, camera, raycaster, gl, groundPlane, intersectPoint]
  );

  const handlePointerUp = useCallback(() => {
    if (isDragging) {
      commitDrag();
    }
  }, [isDragging, commitDrag]);

  return (
    <mesh
      visible={false}
      position={[0, 0, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <planeGeometry args={[100, 100]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  );
};

// ════════════════════════════════════════════
// Scene Content
// ════════════════════════════════════════════

const SceneContent = () => {
  // Subscribe to component IDs only (stable string array comparison via useShallow)
  const componentIds = useAssemblyStore(useShallow((s) => Object.keys(s.components)));
  const selectedId = useAssemblyStore((s) => s.selectedId);
  const dragIsDragging = useAssemblyStore((s) => s.dragState.isDragging);
  const draggedComponentId = useAssemblyStore((s) => s.dragState.draggedComponentId);
  const dragPreviewPosition = useAssemblyStore(useShallow((s) => s.dragState.previewPosition));
  const dragPreviewRotation = useAssemblyStore(useShallow((s) => s.dragState.previewRotation));
  const snapIsSnapped = useAssemblyStore((s) => s.dragState.snapResult?.isSnapped ?? false);
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

        const isDragged = dragIsDragging && draggedComponentId === id;
        const displayPosition = isDragged ? dragPreviewPosition : comp.position;
        const displayRotation = isDragged ? dragPreviewRotation : comp.rotation;

        return (
          <ComponentRenderer
            key={id}
            component={{
              ...comp,
              position: displayPosition,
              rotation: displayRotation,
            }}
            isSelected={selectedId === id}
            isSnappable={isDragged && snapIsSnapped}
          />
        );
      })}

      {/* Ghost preview at snap target */}
      {dragIsDragging && snapIsSnapped && draggedComponentId && (() => {
        const snapResult = useAssemblyStore.getState().dragState.snapResult;
        const ghostComp = useAssemblyStore.getState().components[draggedComponentId];
        if (!snapResult || !ghostComp) return null;
        return (
          <ComponentRenderer
            component={{
              ...ghostComp,
              position: snapResult.position,
              rotation: snapResult.rotation,
            }}
            isSelected={false}
            isSnappable={true}
            isGhost={true}
          />
        );
      })()}

      {/* Drag interaction plane */}
      <DragHandler />

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
