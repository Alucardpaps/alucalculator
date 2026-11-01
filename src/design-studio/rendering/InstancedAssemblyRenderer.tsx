/**
 * AluCAD High-Performance GPU Instanced Assembly Renderer
 * 
 * Hardware-accelerated batch rendering for assemblies with up to 10,000+ components.
 * Merges thousands of draw calls for repeated standard parts (fasteners, bolts, nuts,
 * washers, profiles, brackets) into single-call THREE.InstancedMesh on the dedicated GPU.
 */

'use client';

import React, { useMemo, useRef, useLayoutEffect } from 'react';
import * as THREE from 'three';
import { useDesignStore, type DesignPart, type RenderMode } from '../designStore';
import { createCustomGeometry } from '../geometryFactory';
import type { MateFeature, MateKind } from '../assembly/mateTypes';

interface InstancedGroupProps {
    parts: DesignPart[];
    renderMode: RenderMode;
    clippingPlanes?: THREE.Plane[];
    onSelectPart: (partId: string) => void;
}

function InstancedGroup({ parts, renderMode, clippingPlanes, onSelectPart }: InstancedGroupProps) {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const samplePart = parts[0];

    // Compute base geometry once for all instances
    const geom = useMemo(() => {
        return createCustomGeometry(samplePart, false, [], []);
    }, [samplePart.kind, samplePart.params, samplePart.outer, samplePart.customGeometry]);

    // Material with clipping and metallic appearance
    const material = useMemo(() => {
        const isWireframe = renderMode === 'wire';
        const color = new THREE.Color(samplePart.color || '#94a3b8');

        return new THREE.MeshStandardMaterial({
            color,
            wireframe: isWireframe,
            metalness: 0.7,
            roughness: 0.35,
            clippingPlanes: clippingPlanes && clippingPlanes.length > 0 ? clippingPlanes : undefined,
            clipShadows: true,
        });
    }, [samplePart.color, renderMode, clippingPlanes]);

    // Apply transformation matrices for each instance
    useLayoutEffect(() => {
        const mesh = meshRef.current;
        if (!mesh) return;

        const dummy = new THREE.Object3D();

        for (let i = 0; i < parts.length; i++) {
            const p = parts[i];
            const px = p.position.x / 10;
            const py = p.position.y / 10;
            const pz = p.position.z / 10;

            const rx = ((p.rotation.x || 0) * Math.PI) / 180;
            const ry = ((p.rotation.y || 0) * Math.PI) / 180;
            const rz = ((p.rotation.z || 0) * Math.PI) / 180;

            const sx = p.scale?.x ?? 1;
            const sy = p.scale?.y ?? 1;
            const sz = p.scale?.z ?? 1;

            dummy.position.set(px, py, pz);
            dummy.rotation.set(rx, ry, rz, 'XYZ');
            dummy.scale.set(sx, sy, sz);
            dummy.updateMatrix();

            mesh.setMatrixAt(i, dummy.matrix);
        }

        mesh.instanceMatrix.needsUpdate = true;
    }, [parts]);

    return (
        <instancedMesh
            ref={meshRef}
            args={[geom, material, parts.length]}
            castShadow={parts.length < 500}
            receiveShadow={parts.length < 500}
            onPointerDown={(e) => {
                e.stopPropagation();
                if (e.instanceId !== undefined && e.instanceId < parts.length) {
                    onSelectPart(parts[e.instanceId].id);
                }
            }}
        />
    );
}

export interface InstancedAssemblyRendererProps {
    parts: DesignPart[];
    renderMode: RenderMode;
    clippingPlanes?: THREE.Plane[];
    isSculptMode?: boolean;
    renderIndividualMesh: (part: DesignPart, index: number) => React.ReactNode;
}

export function InstancedAssemblyRenderer({
    parts,
    renderMode,
    clippingPlanes,
    isSculptMode,
    renderIndividualMesh,
}: InstancedAssemblyRendererProps) {
    const selectedId = useDesignStore((s) => s.selectedId);
    const editingPartId = useDesignStore((s) => s.editingPartId);
    const isolatedPartId = useDesignStore((s) => s.isolatedPartId);
    const select = useDesignStore((s) => s.select);

    // If small assembly (<= 40 parts) or sculpt mode is active, render individual SolidMesh
    if (parts.length <= 40 || isSculptMode) {
        return (
            <>
                {parts.map((p, index) => renderIndividualMesh(p, index))}
            </>
        );
    }

    // Partition parts into instanced groups vs unique parts
    const { instancedGroups, uniqueParts } = useMemo(() => {
        const groups = new Map<string, DesignPart[]>();
        const unique: DesignPart[] = [];

        for (const p of parts) {
            // Interactive/active parts MUST remain individual SolidMesh
            if (
                p.id === selectedId ||
                p.id === editingPartId ||
                p.id === isolatedPartId ||
                (p.holes && p.holes.length > 0) ||
                (p.cuts && p.cuts.length > 0) ||
                p.customGeometry ||
                p.solidOp
            ) {
                unique.push(p);
                continue;
            }

            // Generate signature for identical geometry & material
            const sig = `${p.kind}|${p.materialId || ''}|${p.color || ''}|${p.outer ? JSON.stringify(p.outer) : ''}|${JSON.stringify(p.params || {})}`;
            const existing = groups.get(sig);
            if (existing) {
                existing.push(p);
            } else {
                groups.set(sig, [p]);
            }
        }

        const validInstancedGroups: DesignPart[][] = [];

        // Groups with >= 3 instances are batched into InstancedMesh
        for (const [_, groupList] of groups.entries()) {
            if (groupList.length >= 3) {
                validInstancedGroups.push(groupList);
            } else {
                unique.push(...groupList);
            }
        }

        return {
            instancedGroups: validInstancedGroups,
            uniqueParts: unique,
        };
    }, [parts, selectedId, editingPartId, isolatedPartId]);

    return (
        <group name="alucalc-accelerated-assembly">
            {/* GPU-Batched Instanced Meshes (reduces 10,000 draw calls to ~5-15) */}
            {instancedGroups.map((groupParts, gIdx) => (
                <InstancedGroup
                    key={`inst_grp_${groupParts[0].kind}_${gIdx}`}
                    parts={groupParts}
                    renderMode={renderMode}
                    clippingPlanes={clippingPlanes}
                    onSelectPart={select}
                />
            ))}

            {/* Unique / Interactive parts */}
            {uniqueParts.map((p, index) => renderIndividualMesh(p, index))}
        </group>
    );
}
