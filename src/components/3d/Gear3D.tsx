'use client';

import React, { useMemo } from 'react';
import * as THREE from 'three';

interface Gear3DProps {
    gearModule: number;
    teeth: number;
    faceWidth: number;
    helixAngle?: number;
    pressureAngle?: number;
    profileShift?: number; // x
    color?: string;
    position?: [number, number, number];
    rotation?: [number, number, number]; // Additional rotation
    speed?: number; // For animation
}

export function Gear3D({
    gearModule,
    teeth,
    faceWidth,
    helixAngle = 0,
    pressureAngle = 20,
    profileShift = 0,
    color = '#6366f1',
    position = [0, 0, 0],
    rotation = [0, 0, 0]
}: Gear3DProps) {

    const { geometry, boreRadius, pitchRadius } = useMemo(() => {
        const shape = new THREE.Shape();

        // Core Radial Parameters
        const pitchRadius = (gearModule * teeth) / 2;
        // Incorporate profile shift into addendum/dedendum sizing safely
        const addendum = gearModule * (1 + profileShift);
        const dedendum = gearModule * (1.25 - profileShift);

        const Ra = pitchRadius + addendum;
        const Rf = Math.max(pitchRadius - dedendum, gearModule * 0.5);

        const anglePerTooth = (2 * Math.PI) / teeth;

        // Angular thickness distribution along pitch circle
        const s = gearModule * (Math.PI / 2 + 2 * profileShift * Math.tan((pressureAngle * Math.PI) / 180));
        const anglePitchHalf = Math.max(s / pitchRadius, 0.05 / teeth) / 2;

        // Proportions for tip land, flank base, and root land to guarantee pristine, non-intersecting triangulation
        const angleTipHalf = anglePitchHalf * 0.45;
        const angleRootHalf = Math.min(anglePitchHalf * 1.5, (anglePerTooth / 2) * 0.85);

        // Sequentially construct the single continuous outer contour CCW
        for (let i = 0; i < teeth; i++) {
            const angleCenter = i * anglePerTooth;

            const aRootStart = angleCenter - anglePerTooth / 2;
            const aFlankUpStart = angleCenter - angleRootHalf;
            const aTipStart = angleCenter - angleTipHalf;
            const aTipEnd = angleCenter + angleTipHalf;
            const aFlankDownEnd = angleCenter + angleRootHalf;
            const aRootEnd = angleCenter + anglePerTooth / 2;

            // 1. Root land entry
            if (i === 0) {
                shape.moveTo(Math.cos(aRootStart) * Rf, Math.sin(aRootStart) * Rf);
            } else {
                shape.lineTo(Math.cos(aRootStart) * Rf, Math.sin(aRootStart) * Rf);
            }
            shape.lineTo(Math.cos(aFlankUpStart) * Rf, Math.sin(aFlankUpStart) * Rf);

            // 2. Convex Upward Flank mimicking highly smooth authentic involute curves
            const aMidUp = (aFlankUpStart + aTipStart) / 2;
            const rMid = (Rf + Ra) / 2;
            shape.quadraticCurveTo(
                Math.cos(aMidUp) * rMid * 1.02, Math.sin(aMidUp) * rMid * 1.02,
                Math.cos(aTipStart) * Ra, Math.sin(aTipStart) * Ra
            );

            // 3. Top Land (Tooth Tip)
            shape.lineTo(Math.cos(aTipEnd) * Ra, Math.sin(aTipEnd) * Ra);

            // 4. Downward Flank
            const aMidDown = (aTipEnd + aFlankDownEnd) / 2;
            shape.quadraticCurveTo(
                Math.cos(aMidDown) * rMid * 1.02, Math.sin(aMidDown) * rMid * 1.02,
                Math.cos(aFlankDownEnd) * Rf, Math.sin(aFlankDownEnd) * Rf
            );

            // 5. Root land exit
            shape.lineTo(Math.cos(aRootEnd) * Rf, Math.sin(aRootEnd) * Rf);
        }

        shape.closePath();

        // Add an authentic inner shaft borehole with a keyway cut (Clockwise winding order for Three.js holes)
        const borePath = new THREE.Path();
        const boreRadius = Math.min(Math.max(gearModule * 1.2, Rf * 0.25), Rf * 0.65);

        // Keyway measurements
        const kwHalfAngle = Math.asin(Math.min(0.2, (boreRadius * 0.25) / boreRadius));
        const outerR = boreRadius * 1.22;

        // Trace keyway roof and walls
        borePath.moveTo(Math.cos(Math.PI / 2 + kwHalfAngle) * boreRadius, Math.sin(Math.PI / 2 + kwHalfAngle) * boreRadius);
        borePath.lineTo(Math.cos(Math.PI / 2 + kwHalfAngle) * outerR, Math.sin(Math.PI / 2 + kwHalfAngle) * outerR);
        borePath.lineTo(Math.cos(Math.PI / 2 - kwHalfAngle) * outerR, Math.sin(Math.PI / 2 - kwHalfAngle) * outerR);
        borePath.lineTo(Math.cos(Math.PI / 2 - kwHalfAngle) * boreRadius, Math.sin(Math.PI / 2 - kwHalfAngle) * boreRadius);

        // Trace remaining inner circle CW
        borePath.absarc(0, 0, boreRadius, Math.PI / 2 - kwHalfAngle, Math.PI / 2 + kwHalfAngle, true);

        shape.holes.push(borePath);

        // Highly optimized Extrude Settings with custom step subdivisions for helical twisting
        const extrudeSettings = {
            depth: faceWidth,
            bevelEnabled: true,
            bevelThickness: Math.min(gearModule * 0.12, faceWidth * 0.04),
            bevelSize: Math.min(gearModule * 0.12, faceWidth * 0.04),
            bevelSegments: 3,
            steps: helixAngle && helixAngle !== 0 ? 8 : 1,
        };

        const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);

        // Apply Procedural Helical Twist along the Z axis if requested
        if (helixAngle && helixAngle !== 0) {
            const posAttr = geom.attributes.position;
            const helixRad = (helixAngle * Math.PI) / 180;
            // Twist angle proportional to extrusion depth Z
            const maxTwist = (faceWidth * Math.tan(helixRad)) / pitchRadius;

            for (let k = 0; k < posAttr.count; k++) {
                const x = posAttr.getX(k);
                const y = posAttr.getY(k);
                const z = posAttr.getZ(k);

                const angle = (z / faceWidth) * maxTwist;
                const cos = Math.cos(angle);
                const sin = Math.sin(angle);

                const newX = x * cos - y * sin;
                const newY = x * sin + y * cos;

                posAttr.setXYZ(k, newX, newY, z);
            }
            geom.computeVertexNormals();
        }

        return { geometry: geom, boreRadius, pitchRadius };
    }, [gearModule, teeth, pressureAngle, profileShift, faceWidth, helixAngle]);

    const ringInner = boreRadius * 1.25;
    const ringOuter = Math.max(ringInner + gearModule * 0.8, pitchRadius * 0.75);
    const showMachinedRings = ringOuter > ringInner && ringOuter < pitchRadius * 0.9;

    return (
        <group position={position} rotation={rotation}>
            {/* Perfectly center the visual mass of the extruded gear along the Z axis */}
            <group position={[0, 0, -faceWidth / 2]}>
                
                {/* Main Forged/Machined Gear Body */}
                <mesh geometry={geometry} castShadow receiveShadow>
                    <meshStandardMaterial
                        color={color}
                        metalness={0.88}
                        roughness={0.15}
                        envMapIntensity={1.3}
                    />
                </mesh>

                {/* Polished Surface Relief Accents (Web Faces) */}
                {showMachinedRings && (
                    <>
                        {/* Front Recessed Relief Ring */}
                        <mesh position={[0, 0, faceWidth + 0.01]}>
                            <ringGeometry args={[ringInner, ringOuter, 64]} />
                            <meshStandardMaterial color={color} metalness={0.6} roughness={0.4} side={THREE.DoubleSide} />
                        </mesh>
                        {/* Back Recessed Relief Ring */}
                        <mesh position={[0, 0, -0.01]} rotation={[0, Math.PI, 0]}>
                            <ringGeometry args={[ringInner, ringOuter, 64]} />
                            <meshStandardMaterial color={color} metalness={0.6} roughness={0.4} side={THREE.DoubleSide} />
                        </mesh>
                    </>
                )}

                {/* Internal Inner Keyway Bore Surface Highlight */}
                <mesh position={[0, 0, faceWidth / 2]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[boreRadius * 0.99, boreRadius * 0.99, faceWidth * 1.02, 48]} />
                    <meshStandardMaterial color="#030712" metalness={0.3} roughness={0.7} side={THREE.BackSide} />
                </mesh>

            </group>
        </group>
    );
}

