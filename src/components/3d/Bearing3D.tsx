'use client';

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { extend } from '@react-three/fiber';

export interface Bearing3DProps {
    od: number;
    id: number;
    width: number;
    type?: string; // 'ball' | 'roller' | 'cylindrical-roller' | 'tapered-roller' | 'needle-roller' | 'spherical-roller' | 'thrust-ball' | 'angular-contact-ball' | 'self-aligning-ball' | 'deep-groove-ball'
    needleType?: string;
    capping?: string;
    position?: [number, number, number];
    rotation?: [number, number, number];
}

export function Bearing3D({
    od,
    id,
    width,
    type = 'ball',
    needleType,
    capping,
    position = [0, 0, 0],
    rotation = [0, 0, 0]
}: Bearing3DProps) {
    // Resolve family
    const resolvedType = useMemo(() => {
        let t = (type || '').toLowerCase();
        if (t === 'roller') return 'cylindrical-roller';
        if (t === 'ball') return 'deep-groove-ball';
        return t || 'deep-groove-ball';
    }, [type]);

    // Geometry Calculations
    const outerRadius = od / 2;
    const innerRadius = id / 2;
    const radialGap = Math.max(0.5, outerRadius - innerRadius);
    const meanRadius = (outerRadius + innerRadius) / 2;
    const raceThickness = Math.min(width * 0.4, radialGap * 0.28);
    const isHK = resolvedType === 'needle-roller' && (needleType === 'drawn-cup' || !needleType);
    const hasInnerRing = !isHK;

    const rollingElements = useMemo(() => {
        const elements: React.ReactNode[] = [];

        // ─── 1. CYLINDRICAL ROLLER ───
        if (resolvedType === 'cylindrical-roller') {
            const rollerRadius = radialGap * 0.25;
            const rollerLen = width * 0.68;
            const count = 13;
            const angleStep = (Math.PI * 2) / count;

            for (let i = 0; i < count; i++) {
                const angle = i * angleStep;
                elements.push(
                    <mesh 
                        key={`cyl-${i}`} 
                        position={[
                            Math.cos(angle) * meanRadius,
                            Math.sin(angle) * meanRadius,
                            0
                        ]}
                        rotation={[Math.PI / 2, 0, 0]}
                    >
                        <cylinderGeometry args={[rollerRadius, rollerRadius, rollerLen, 16]} />
                        <meshStandardMaterial color="#f1f5f9" metalness={0.95} roughness={0.08} />
                    </mesh>
                );
            }
        }
        // ─── 2. NEEDLE ROLLER ───
        else if (resolvedType === 'needle-roller') {
            const needleRadius = radialGap * 0.12;
            const needleLen = width * 0.82;
            const count = 24;
            const angleStep = (Math.PI * 2) / count;
            const placeRadius = isHK ? (outerRadius - raceThickness * 0.6 - needleRadius) : meanRadius;

            for (let i = 0; i < count; i++) {
                const angle = i * angleStep;
                elements.push(
                    <mesh 
                        key={`needle-${i}`} 
                        position={[
                            Math.cos(angle) * placeRadius,
                            Math.sin(angle) * placeRadius,
                            0
                        ]}
                        rotation={[Math.PI / 2, 0, 0]}
                    >
                        <cylinderGeometry args={[needleRadius, needleRadius, needleLen, 12]} />
                        <meshStandardMaterial color="#e2e8f0" metalness={0.98} roughness={0.06} />
                    </mesh>
                );
            }
        }
        // ─── 3. TAPERED ROLLER ───
        else if (resolvedType === 'tapered-roller') {
            const count = 14;
            const angleStep = (Math.PI * 2) / count;
            const rTop = radialGap * 0.20;
            const rBot = radialGap * 0.28;
            const rollerLen = width * 0.68;
            const coneAngle = 0.25; // ~14 deg

            for (let i = 0; i < count; i++) {
                const angle = i * angleStep;
                elements.push(
                    <mesh 
                        key={`taper-${i}`} 
                        position={[
                            Math.cos(angle) * meanRadius,
                            Math.sin(angle) * meanRadius,
                            0
                        ]}
                        rotation={[Math.PI / 2 + Math.cos(angle) * coneAngle, Math.sin(angle) * coneAngle, angle]}
                    >
                        <cylinderGeometry args={[rTop, rBot, rollerLen, 16]} />
                        <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.08} />
                    </mesh>
                );
            }
        }
        // ─── 4. SPHERICAL ROLLER (DOUBLE ROW BARREL) ───
        else if (resolvedType === 'spherical-roller') {
            const count = 11;
            const angleStep = (Math.PI * 2) / count;
            const rollerRadius = radialGap * 0.22;
            const rollerLen = width * 0.42;
            const tilt = 0.18; // ~10 deg

            for (let i = 0; i < count; i++) {
                const a1 = i * angleStep;
                // Row 1 (+Z)
                elements.push(
                    <mesh 
                        key={`sph-1-${i}`} 
                        position={[
                            Math.cos(a1) * meanRadius,
                            Math.sin(a1) * meanRadius,
                            width * 0.22
                        ]}
                        rotation={[Math.PI / 2 + Math.cos(a1) * tilt, Math.sin(a1) * tilt, a1]}
                    >
                        <cylinderGeometry args={[rollerRadius * 0.88, rollerRadius, rollerLen, 14]} />
                        <meshStandardMaterial color="#f1f5f9" metalness={0.95} roughness={0.08} />
                    </mesh>
                );
                // Row 2 (-Z, staggered)
                const a2 = a1 + angleStep / 2;
                elements.push(
                    <mesh 
                        key={`sph-2-${i}`} 
                        position={[
                            Math.cos(a2) * meanRadius,
                            Math.sin(a2) * meanRadius,
                            -width * 0.22
                        ]}
                        rotation={[Math.PI / 2 - Math.cos(a2) * tilt, -Math.sin(a2) * tilt, a2]}
                    >
                        <cylinderGeometry args={[rollerRadius, rollerRadius * 0.88, rollerLen, 14]} />
                        <meshStandardMaterial color="#f1f5f9" metalness={0.95} roughness={0.08} />
                    </mesh>
                );
            }
        }
        // ─── 5. SELF-ALIGNING BALL (DOUBLE ROW BALLS) ───
        else if (resolvedType === 'self-aligning-ball') {
            const count = 10;
            const angleStep = (Math.PI * 2) / count;
            const ballR = radialGap * 0.24;

            for (let i = 0; i < count; i++) {
                const a1 = i * angleStep;
                elements.push(
                    <mesh 
                        key={`sa-1-${i}`} 
                        position={[
                            Math.cos(a1) * meanRadius,
                            Math.sin(a1) * meanRadius,
                            width * 0.20
                        ]}
                    >
                        <sphereGeometry args={[ballR, 14, 14]} />
                        <meshStandardMaterial color="#f8fafc" metalness={0.98} roughness={0.05} />
                    </mesh>
                );
                const a2 = a1 + angleStep / 2;
                elements.push(
                    <mesh 
                        key={`sa-2-${i}`} 
                        position={[
                            Math.cos(a2) * meanRadius,
                            Math.sin(a2) * meanRadius,
                            -width * 0.20
                        ]}
                    >
                        <sphereGeometry args={[ballR, 14, 14]} />
                        <meshStandardMaterial color="#f8fafc" metalness={0.98} roughness={0.05} />
                    </mesh>
                );
            }
        }
        // ─── 6. THRUST BALL ───
        else if (resolvedType === 'thrust-ball' || resolvedType === 'thrust-roller') {
            const count = 14;
            const angleStep = (Math.PI * 2) / count;
            const ballR = Math.min(width * 0.22, radialGap * 0.32);

            for (let i = 0; i < count; i++) {
                const a = i * angleStep;
                elements.push(
                    <mesh 
                        key={`thrust-${i}`} 
                        position={[
                            Math.cos(a) * meanRadius,
                            Math.sin(a) * meanRadius,
                            0
                        ]}
                    >
                        <sphereGeometry args={[ballR, 16, 16]} />
                        <meshStandardMaterial color="#f8fafc" metalness={0.98} roughness={0.05} />
                    </mesh>
                );
            }
        }
        // ─── 7. DEEP GROOVE BALL & ANGULAR CONTACT (DEFAULT) ───
        else {
            const ballSize = radialGap * 0.6;
            const ballCount = Math.floor((Math.PI * 2 * meanRadius) / (ballSize * 1.2)) || 8;
            const angleStep = (Math.PI * 2) / ballCount;

            for (let i = 0; i < ballCount; i++) {
                elements.push(
                    <mesh key={`ball-${i}`} position={[
                        Math.cos(i * angleStep) * meanRadius,
                        Math.sin(i * angleStep) * meanRadius,
                        0
                    ]}>
                        <sphereGeometry args={[ballSize / 2, 16, 16]} />
                        <meshStandardMaterial color="#e2e8f0" metalness={0.98} roughness={0.05} />
                    </mesh>
                );
            }
        }

        return elements;
    }, [resolvedType, meanRadius, radialGap, width, outerRadius, raceThickness, isHK]);

    return (
        <group position={position} rotation={rotation}>
            {/* Outer Race */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[outerRadius - raceThickness, outerRadius, 64, 1]} />
                <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.15} side={THREE.DoubleSide} />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[outerRadius, outerRadius, width, 64, 1, true]} />
                <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.15} side={THREE.DoubleSide} />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[outerRadius - raceThickness, outerRadius - raceThickness, width, 64, 1, true]} />
                <meshStandardMaterial color="#64748b" metalness={0.85} roughness={0.15} side={THREE.DoubleSide} />
            </mesh>

            {/* Inner Race (Omitted for Drawn Cup Needle HK) */}
            {hasInnerRing && (
                <>
                    <mesh rotation={[Math.PI / 2, 0, 0]}>
                        <ringGeometry args={[innerRadius, innerRadius + raceThickness, 64, 1]} />
                        <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.15} side={THREE.DoubleSide} />
                    </mesh>
                    <mesh rotation={[Math.PI / 2, 0, 0]}>
                        <cylinderGeometry args={[innerRadius + raceThickness, innerRadius + raceThickness, width, 64, 1, true]} />
                        <meshStandardMaterial color="#64748b" metalness={0.85} roughness={0.15} side={THREE.DoubleSide} />
                    </mesh>
                    <mesh rotation={[Math.PI / 2, 0, 0]}>
                        <cylinderGeometry args={[innerRadius, innerRadius, width, 64, 1, true]} />
                        <meshStandardMaterial color="#a1a1aa" metalness={0.85} roughness={0.15} side={THREE.DoubleSide} />
                    </mesh>
                </>
            )}

            {/* Brass / Steel Cage Ring */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[meanRadius, radialGap * 0.04, 8, 48]} />
                <meshStandardMaterial color="#b45309" metalness={0.8} roughness={0.3} />
            </mesh>

            {/* Rolling Elements */}
            <group position={[0, 0, 0]}>
                {rollingElements}
            </group>
        </group>
    );
}
