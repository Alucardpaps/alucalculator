import { useMemo, useState, useEffect } from 'react';
import { useFlowStore } from '@/store/flowStore';
import { EngineeringGeometry, Point2D } from '../geometry-types';
import { calculateGearGeometry } from '@/engines/math/involute';

export function useActiveGeometry(): EngineeringGeometry | null {
    const { nodes, selectedNodeId } = useFlowStore();

    // We use a local state to store the calculated geometry because 'calculateGearGeometry' might be synchronous but we want to be safe
    // Actually calculateGearGeometry is synchronous in the file I read.

    return useMemo(() => {
        if (!selectedNodeId) return null;

        const node = nodes.find(n => n.id === selectedNodeId);

        // DEBUG LOGGING
        console.log('[useActiveGeometry] Selected Node:', selectedNodeId);
        console.log('[useActiveGeometry] Node Object:', node);

        if (!node || node.data.type !== 'calculator') {
            console.log('[useActiveGeometry] Invalid node type or null:', node?.data.type);
            return null;
        }

        const { outputs, schemaId, inputs } = node.data as any;
        console.log('[useActiveGeometry] Schema:', schemaId);

        // 1. SPUR GEAR ADAPTER
        if (schemaId === 'gear-spur' || schemaId === 'mech-gear-spur' || schemaId === 'mech-gear-spur-v1') {

            // Extract parameters (fallback to inputs if outputs missing/stale)
            // Note: inputs in flow store are { value: ... } or raw values depending on implementation
            // The schema uses { value: ... } structure.

            const getVal = (key: string) => {
                // Try outputs first (computed)
                if (outputs && outputs[key]) return Number(outputs[key].value);
                // Try inputs (user entered)
                if (inputs && inputs[key]) return Number(inputs[key].value || inputs[key]);
                return undefined;
            }

            const module = getVal('m') || 2;
            const teeth = getVal('z1') || 20; // Default to pinion for visualization if single node
            // If node represents a pair, we might need to know WHICH one to show. 
            // Usually SpurGearNode represents the pair calculation, but visualizes the PAIR or primarily the Pinion?
            // The inputs have z1 and z2.

            const alpha = getVal('alpha') || 20;
            const x1 = getVal('x1') || 0;

            // GEOMETRY GENERATION (Real Involute)
            const geo = calculateGearGeometry({
                module: module,
                teethCount: teeth,
                pressureAngle: alpha,
                profileShift: x1,
                addendumCoeff: 1.0,
                dedendumCoeff: 1.25,
                clearanceCoeff: 0.25
            });

            const d = module * teeth; // Pitch diam
            const da = module * (teeth + 2 + 2 * x1); // Tip diam
            const df = module * (teeth - 2.5 + 2 * x1); // Root diam
            const db = d * Math.cos(alpha * Math.PI / 180); // Base diam

            return {
                type: 'profile',
                metadata: {
                    title: 'Spur Gear (Involute)',
                    description: `M${module} Z${teeth} x${x1}`
                },
                technical2D: {
                    outline: geo.fullGearContour, // {x,y} array
                    circles: [
                        { cx: 0, cy: 0, r: d / 2, style: 'center' }, // Pitch
                        { cx: 0, cy: 0, r: da / 2, style: 'solid' }, // Tip
                        { cx: 0, cy: 0, r: df / 2, style: 'solid' }, // Root
                        { cx: 0, cy: 0, r: db / 2, style: 'dashed' }, // Base
                    ],
                    lines: [
                        { x1: -da, y1: 0, x2: da, y2: 0, style: 'center' },
                        { x1: 0, y1: -da, x2: 0, y2: da, style: 'center' }
                    ],
                    dimensions: [
                        { x1: -d / 2, y1: d / 2 + module * 5, x2: d / 2, y2: d / 2 + module * 5, label: `d=${d.toFixed(2)}`, offset: module * 2 }
                    ]
                },
                model3D: {
                    type: 'extrusion',
                    path: geo.fullGearContour,
                    thickness: getVal('b') || 20
                }
            };
        }

        return null;
    }, [nodes, selectedNodeId]);
}
