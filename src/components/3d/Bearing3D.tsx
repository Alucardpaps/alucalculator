'use client';

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { extend } from '@react-three/fiber';

interface Bearing3DProps {
    od: number;
    id: number;
    width: number;
    type: string; // 'ball' | 'roller'
    position?: [number, number, number];
    rotation?: [number, number, number];
}

export function Bearing3D({
    od,
    id,
    width,
    type,
    position = [0, 0, 0],
    rotation = [0, 0, 0]
}: Bearing3DProps) {

    // Geometry Calculations
    const outerRadius = od / 2;
    const innerRadius = id / 2;
    const thickness = (outerRadius - innerRadius);
    const meanRadius = (outerRadius + innerRadius) / 2;
    const raceThickness = thickness * 0.25;

    // Ball Size
    const ballSize = thickness * 0.6;
    const ballCount = Math.floor((Math.PI * 2 * meanRadius) / (ballSize * 1.2));

    const balls = useMemo(() => {
        const b = [];
        const angleStep = (Math.PI * 2) / ballCount;
        for (let i = 0; i < ballCount; i++) {
            b.push(
                <mesh key={i} position={[
                    Math.cos(i * angleStep) * meanRadius,
                    Math.sin(i * angleStep) * meanRadius,
                    0
                ]}>
                    <sphereGeometry args={[ballSize / 2, 16, 16]} />
                    <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.1} />
                </mesh>
            )
        }
        return b;
    }, [ballCount, meanRadius, ballSize]);

    return (
        <group position={position} rotation={rotation}>
            {/* Outer Race */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[outerRadius - raceThickness, outerRadius, 64, 1]} />
                <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} side={THREE.DoubleSide} />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                {/* Extrusion thickness simulated by cylinder for now or complex shape */}
                <cylinderGeometry args={[outerRadius, outerRadius, width, 64, 1, true]} />
                <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} side={THREE.DoubleSide} />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[outerRadius - raceThickness, outerRadius - raceThickness, width, 64, 1, true]} />
                <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.2} side={THREE.DoubleSide} />
            </mesh>

            {/* Inner Race */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[innerRadius, innerRadius + raceThickness, 64, 1]} />
                <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} side={THREE.DoubleSide} />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[innerRadius + raceThickness, innerRadius + raceThickness, width, 64, 1, true]} />
                <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.2} side={THREE.DoubleSide} />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[innerRadius, innerRadius, width, 64, 1, true]} />
                <meshStandardMaterial color="#a1a1aa" metalness={0.8} roughness={0.2} side={THREE.DoubleSide} />
            </mesh>

            {/* Balls / Cage */}
            <group position={[0, 0, 0]}>
                {balls}
            </group>
        </group>
    );
}
