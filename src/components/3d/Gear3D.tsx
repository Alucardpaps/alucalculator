'use client';

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { extend, ReactThreeFiber } from '@react-three/fiber';
import { Float, Stage, PresentationControls } from '@react-three/drei';

function involute(baseRadius: number, t: number) {
    const x = baseRadius * (Math.cos(t) + t * Math.sin(t));
    const y = baseRadius * (Math.sin(t) - t * Math.cos(t));
    return { x, y };
}

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

    const geometry = useMemo(() => {
        const shape = new THREE.Shape();

        // Geometry Params
        const pressureAngleRad = (pressureAngle * Math.PI) / 180;
        const pitchRadius = (gearModule * teeth) / 2;
        const baseRadius = pitchRadius * Math.cos(pressureAngleRad);
        const addendum = gearModule * (1 + profileShift);
        const dedendum = gearModule * (1.25 - profileShift);
        const addendumRadius = pitchRadius + addendum;
        const dedendumRadius = pitchRadius - dedendum;

        const numSteps = 10;
        const toothAngle = (2 * Math.PI) / teeth;
        const halfToothAngle = toothAngle / 2;

        const visualThickness = (Math.PI / (2 * teeth));

        // Start drawing
        for (let i = 0; i < teeth; i++) {
            const angleOffset = i * toothAngle;

            // Root (start)
            // Ideally we'd do a fillet here, but simplified:
            const r0x = Math.cos(angleOffset) * dedendumRadius;
            const r0y = Math.sin(angleOffset) * dedendumRadius;

            if (i === 0) shape.moveTo(r0x, r0y);
            else shape.lineTo(r0x, r0y);

            // Involute - Right Flank
            // Limit t to where involute hits addendum circle
            // r^2 = rb^2 * (1 + t^2) => t_max = sqrt((ra/rb)^2 - 1)
            const tMax = Math.sqrt((addendumRadius / baseRadius) ** 2 - 1);

            for (let s = 0; s <= numSteps; s++) {
                const t = (s / numSteps) * tMax;
                const inv = involute(baseRadius, t);
                // Rotate involute to correct tooth position
                // Initial involute starts at base circle
                // We need to account for tooth thickness at pitch circle
                // s_pitch = pi * m / 2 + 2 * x * m * tan(alpha)
                // angle_thickness_half = s_pitch / (2 * pitchRadius)
                // ... Simplification for visual:

                const r = Math.sqrt(inv.x ** 2 + inv.y ** 2);
                const a = Math.atan2(inv.y, inv.x) + angleOffset + visualThickness; // rudimentary alignment

                shape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
            }

            // Top Land
            // Arc from end of right flank to start of left flank
            // Simplified to line for now
            // shape.lineTo(...)

            // Involute - Left Flank (Mirrored)
            for (let s = numSteps; s >= 0; s--) {
                const t = (s / numSteps) * tMax;
                const inv = involute(baseRadius, t);
                const r = Math.sqrt(inv.x ** 2 + inv.y ** 2);
                // Mirror angle
                const a = -Math.atan2(inv.y, inv.x) + angleOffset + toothAngle - visualThickness; // rudimentary

                shape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
            }
        }

        shape.closePath();

        const extrudeSettings = {
            depth: faceWidth,
            bevelEnabled: true,
            bevelThickness: gearModule * 0.1,
            bevelSize: gearModule * 0.1,
            bevelSegments: 2,
            steps: 1,
            // Helix twist
            // twist: (faceWidth * Math.tan(helixAngle * Math.PI / 180)) / pitchRadius * (180/Math.PI)
        };

        return new THREE.ExtrudeGeometry(shape, extrudeSettings);
    }, [gearModule, teeth, pressureAngle, profileShift, faceWidth, helixAngle]);

    return (
        <group position={position} rotation={rotation}>
            <mesh geometry={geometry}>
                <meshStandardMaterial
                    color={color}
                    metalness={0.8}
                    roughness={0.2}
                />
            </mesh>
            {/* Bore for visual realism */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[gearModule * 2, gearModule * 2, faceWidth * 1.1, 32]} />
                <meshStandardMaterial color="#222" metalness={0.5} roughness={0.8} />
            </mesh>
        </group>
    );
}
