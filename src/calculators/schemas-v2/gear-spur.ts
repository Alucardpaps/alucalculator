/**
 * AluCalculator V2 — Spur Gear Calculator
 * 
 * ENGINEERING DOMAIN: Mechanical
 * STANDARDS: ISO 6336, DIN 3990, DIN 3960
 * 
 * Features:
 * - Undercut detection (z < 17 warning)
 * - Pressure angle < 20° DIN 3960 warning
 * - Profile shift calculations
 * - Lewis bending stress
 * - Full formula traceability
 */

import type { CalculatorSchemaV2 } from '@/types/calculator-schema-v2';
import {
    createValidatedValue,
    createUnverifiedValue,
    type ValidatedEngineeringValue,
    type CalculationResult
} from '@/types/engineering';

// ============================================
// CALCULATION ENGINE
// ============================================

function calculateGearGeometry(
    inputs: Record<string, ValidatedEngineeringValue>
): CalculationResult {
    const timestamp = Date.now();
    const warnings: CalculationResult['warnings'] = [];
    const formulaTrace: Record<string, string> = {};

    // Extract values
    const m = inputs.m.value as number;       // Module [mm]
    const z1 = inputs.z1.value as number;     // Pinion teeth
    const z2 = inputs.z2.value as number;     // Gear teeth
    const alpha = inputs.alpha.value as number; // Pressure angle [deg]
    const b = inputs.b.value as number;       // Face width [mm]
    const T = inputs.T.value as number;       // Torque [Nm]
    const Sy = inputs.Sy.value as number;     // Yield strength [MPa]
    const x1 = (inputs.x1?.value as number) ?? 0; // Pinion shift
    const x2 = (inputs.x2?.value as number) ?? 0; // Gear shift

    // ===== VALIDATION WARNINGS =====

    // DIN 3960: Pressure angle < 20° risk
    if (alpha < 20) {
        warnings.push({
            field: 'alpha',
            message: `Pressure angle ${alpha}° < 20°. High risk of undercut according to DIN 3960.`,
            severity: 'critical',
        });
    }

    // Undercut check (z < 17 without profile shift)
    const zMin = 2 / (Math.sin(alpha * Math.PI / 180) ** 2);
    if (z1 < zMin && x1 === 0) {
        warnings.push({
            field: 'z1',
            message: `Pinion teeth z₁=${z1} < ${zMin.toFixed(0)}. Undercut likely without profile shift (x₁).`,
            severity: 'warning',
        });
    }
    if (z2 < zMin && x2 === 0) {
        warnings.push({
            field: 'z2',
            message: `Gear teeth z₂=${z2} < ${zMin.toFixed(0)}. Undercut likely without profile shift (x₂).`,
            severity: 'warning',
        });
    }

    // ===== GEOMETRY CALCULATIONS =====

    // Pitch diameters
    const d1 = m * z1;
    const d2 = m * z2;
    formulaTrace['d1'] = 'd_1 = m \\cdot z_1';
    formulaTrace['d2'] = 'd_2 = m \\cdot z_2';

    // Tip diameters (with profile shift)
    const da1 = m * (z1 + 2 + 2 * x1);
    const da2 = m * (z2 + 2 + 2 * x2);
    formulaTrace['da1'] = 'd_{a1} = m \\cdot (z_1 + 2 + 2x_1)';
    formulaTrace['da2'] = 'd_{a2} = m \\cdot (z_2 + 2 + 2x_2)';

    // Root diameters (with profile shift)
    const df1 = m * (z1 - 2.5 + 2 * x1);
    const df2 = m * (z2 - 2.5 + 2 * x2);
    formulaTrace['df1'] = 'd_{f1} = m \\cdot (z_1 - 2.5 + 2x_1)';
    formulaTrace['df2'] = 'd_{f2} = m \\cdot (z_2 - 2.5 + 2x_2)';

    // Gear ratio
    const ratio = z2 / z1;
    formulaTrace['ratio'] = 'i = \\frac{z_2}{z_1}';

    // Center distance (approximate for shifted gears)
    const a = (m * (z1 + z2)) / 2 + m * (x1 + x2);
    formulaTrace['a'] = 'a = \\frac{m(z_1 + z_2)}{2} + m(x_1 + x_2)';

    // ===== FORCE & STRESS CALCULATIONS =====

    // Tangential force at pitch circle
    const Ft = (2 * T * 1000) / d1; // N (T in Nm, d1 in mm)
    formulaTrace['Ft'] = 'F_t = \\frac{2T}{d_1}';

    // Lewis form factor (simplified)
    const Y = 0.32; // Approximate for 20° pressure angle, 20 teeth

    // Bending stress (Lewis formula)
    const sigmaBending = Ft / (b * m * Y);
    formulaTrace['sigmaBending'] = '\\sigma_b = \\frac{F_t}{b \\cdot m \\cdot Y}';

    // Safety factor
    const SF = Sy / sigmaBending;
    formulaTrace['SF'] = 'SF = \\frac{S_y}{\\sigma_b}';

    // Check safety factor
    if (SF < 2.0) {
        warnings.push({
            field: 'SF',
            message: `Safety factor ${SF.toFixed(2)} < 2.0. Consider stronger material or larger module.`,
            severity: 'warning',
        });
    }

    if (sigmaBending > 200) {
        warnings.push({
            field: 'sigmaBending',
            message: `Bending stress ${sigmaBending.toFixed(0)} MPa is high. Consider larger module or wider teeth.`,
            severity: 'warning',
        });
    }

    // ===== BUILD OUTPUT =====

    const verified = warnings.filter(w => w.severity === 'critical').length === 0;

    const outputs: Record<string, ValidatedEngineeringValue> = {
        d1: createValidatedValue(d1, 'mm', 'derived', { precision: 2 }),
        d2: createValidatedValue(d2, 'mm', 'derived', { precision: 2 }),
        da1: createValidatedValue(da1, 'mm', 'derived', { precision: 2 }),
        da2: createValidatedValue(da2, 'mm', 'derived', { precision: 2 }),
        df1: createValidatedValue(df1, 'mm', 'derived', { precision: 2 }),
        df2: createValidatedValue(df2, 'mm', 'derived', { precision: 2 }),
        ratio: createValidatedValue(ratio, '-', 'derived', { precision: 3 }),
        a: createValidatedValue(a, 'mm', 'derived', { precision: 2 }),
        Ft: createValidatedValue(Ft, 'N', 'derived', { precision: 1 }),
        sigmaBending: verified
            ? createValidatedValue(sigmaBending, 'MPa', 'derived', { precision: 1 })
            : createUnverifiedValue(sigmaBending, 'MPa', 'Critical warnings present'),
        SF: verified
            ? createValidatedValue(SF, '-', 'derived', { precision: 2 })
            : createUnverifiedValue(SF, '-', 'Critical warnings present'),
    };

    return {
        outputs,
        verified,
        warnings,
        timestamp,
        formulaTrace,
    };
}

// ============================================
// SCHEMA DEFINITION
// ============================================

const gearSpurSchema: CalculatorSchemaV2 = {
    id: 'gear-spur',

    metadata: {
        title: 'Spur Gear Calculator',
        description: 'Calculate spur gear geometry, bending stress, and safety factor. Includes undercut detection.',
        category: 'mechanical',
        version: '2.0.0',
        author: 'AluCalc Engineering',
        lastUpdated: '2026-02-09',
        tags: ['gear', 'spur', 'involute', 'bending', 'stress', 'undercut'],
        verifiedStandards: ['ISO 6336', 'DIN 3990', 'DIN 3960'],
    },

    inputs: [
        {
            key: 'm',
            label: 'Module (m)',
            unit: 'mm',
            defaultValue: 2,
            validation: {
                min: 0.5,
                max: 25,
                required: true,
                step: 0.25,
            },
            description: 'Gear module. Defines tooth size. Standard: ISO 54.',
        },
        {
            key: 'z1',
            label: 'Pinion Teeth (z₁)',
            unit: '-',
            defaultValue: 20,
            validation: {
                min: 10,
                max: 200,
                required: true,
                step: 1,
                warnings: [
                    {
                        condition: (v, ctx) => v < 17 && (ctx.x1 ?? 0) === 0,
                        message: 'Undercut likely without profile shift. Add x₁ > 0.',
                        severity: 'warning',
                        standardRef: 'DIN 3960',
                    },
                ],
            },
            description: 'Number of teeth on the pinion (smaller gear).',
        },
        {
            key: 'z2',
            label: 'Gear Teeth (z₂)',
            unit: '-',
            defaultValue: 40,
            validation: {
                min: 10,
                max: 500,
                required: true,
                step: 1,
            },
            description: 'Number of teeth on the gear (larger gear).',
        },
        {
            key: 'alpha',
            label: 'Pressure Angle (α)',
            unit: 'deg',
            defaultValue: 20,
            validation: {
                min: 14.5,
                max: 25,
                required: true,
                step: 0.5,
                warnings: [
                    {
                        condition: (v) => v < 20,
                        message: 'High risk of undercut according to DIN 3960.',
                        severity: 'critical',
                        standardRef: 'DIN 3960',
                    },
                ],
            },
            description: 'Pressure angle. Standard is 20°.',
        },
        {
            key: 'b',
            label: 'Face Width (b)',
            unit: 'mm',
            defaultValue: 20,
            validation: {
                min: 5,
                max: 500,
                required: true,
                step: 1,
            },
            description: 'Width of the gear face.',
        },
        {
            key: 'T',
            label: 'Torque on Pinion (T)',
            unit: 'Nm',
            defaultValue: 50,
            validation: {
                min: 0.1,
                max: 100000,
                required: true,
                step: 1,
            },
            description: 'Torque transmitted by the pinion.',
        },
        {
            key: 'Sy',
            label: 'Material Yield Strength',
            unit: 'MPa',
            defaultValue: 350,
            validation: {
                min: 100,
                max: 2000,
                required: true,
                step: 10,
            },
            description: 'Yield strength of gear material.',
        },
        {
            key: 'x1',
            label: 'Pinion Profile Shift (x₁)',
            unit: '-',
            defaultValue: 0,
            validation: {
                min: -1,
                max: 1.5,
                required: false,
                step: 0.01,
            },
            description: 'Profile shift coefficient for pinion. Use to avoid undercut.',
            group: 'advanced',
        },
        {
            key: 'x2',
            label: 'Gear Profile Shift (x₂)',
            unit: '-',
            defaultValue: 0,
            validation: {
                min: -1,
                max: 1.5,
                required: false,
                step: 0.01,
            },
            description: 'Profile shift coefficient for gear.',
            group: 'advanced',
        },
    ],

    outputs: [
        {
            key: 'd1',
            label: 'Pinion Pitch Diameter',
            unit: 'mm',
            formulaLatex: 'd_1 = m \\cdot z_1',
            description: 'Pitch circle diameter of pinion.',
            precision: 2,
            affectsGeometry: true,
        },
        {
            key: 'd2',
            label: 'Gear Pitch Diameter',
            unit: 'mm',
            formulaLatex: 'd_2 = m \\cdot z_2',
            description: 'Pitch circle diameter of gear.',
            precision: 2,
            affectsGeometry: true,
        },
        {
            key: 'da1',
            label: 'Pinion Tip Diameter',
            unit: 'mm',
            formulaLatex: 'd_{a1} = m \\cdot (z_1 + 2 + 2x_1)',
            description: 'Addendum (tip) circle diameter.',
            precision: 2,
            affectsGeometry: true,
        },
        {
            key: 'df1',
            label: 'Pinion Root Diameter',
            unit: 'mm',
            formulaLatex: 'd_{f1} = m \\cdot (z_1 - 2.5 + 2x_1)',
            description: 'Dedendum (root) circle diameter.',
            precision: 2,
            affectsGeometry: true,
        },
        {
            key: 'ratio',
            label: 'Gear Ratio',
            unit: '-',
            formulaLatex: 'i = \\frac{z_2}{z_1}',
            description: 'Transmission ratio.',
            precision: 3,
        },
        {
            key: 'a',
            label: 'Center Distance',
            unit: 'mm',
            formulaLatex: 'a = \\frac{m(z_1 + z_2)}{2} + m(x_1 + x_2)',
            description: 'Operating center distance.',
            precision: 2,
        },
        {
            key: 'Ft',
            label: 'Tangential Force',
            unit: 'N',
            formulaLatex: 'F_t = \\frac{2T}{d_1}',
            description: 'Force at pitch circle.',
            precision: 1,
        },
        {
            key: 'sigmaBending',
            label: 'Bending Stress',
            unit: 'MPa',
            formulaLatex: '\\sigma_b = \\frac{F_t}{b \\cdot m \\cdot Y}',
            description: 'Tooth bending stress (Lewis formula).',
            precision: 1,
            warningThreshold: {
                max: 200,
                message: 'High bending stress. Consider larger module.',
            },
        },
        {
            key: 'SF',
            label: 'Safety Factor',
            unit: '-',
            formulaLatex: 'SF = \\frac{S_y}{\\sigma_b}',
            description: 'Safety factor against yield.',
            precision: 2,
            warningThreshold: {
                min: 2,
                message: 'Safety factor below 2.0.',
            },
        },
    ],

    calculationEngine: calculateGearGeometry,

    visualization: {
        type: 'svg-parametric',
        aspectRatio: 1.5,
        // render function will be implemented in component
    },

    documentation: {
        assumptions: [
            {
                id: 'spur-only',
                text: 'Calculation is for spur gears only. Helical gears require correction factors.',
                impact: 'high',
                source: 'ISO 6336',
            },
            {
                id: 'lewis-simplified',
                text: 'Bending stress uses simplified Lewis formula (Y=0.32) without dynamic factors.',
                impact: 'medium',
                source: 'Lewis 1892',
            },
            {
                id: 'standard-addendum',
                text: 'Standard addendum (ha=m) and dedendum (hf=1.25m) assumed.',
                impact: 'low',
                source: 'ISO 53',
            },
        ],
        standards: [
            { code: 'ISO 6336', title: 'Calculation of load capacity of spur and helical gears' },
            { code: 'DIN 3990', title: 'Calculation of load capacity of cylindrical gears' },
            { code: 'DIN 3960', title: 'Undercut and profile shift definitions' },
        ],
        formulaLatex: '\\sigma_b = \\frac{F_t}{b \\cdot m \\cdot Y}, \\quad SF = \\frac{S_y}{\\sigma_b}',
    },

    tier: 'free',

    export: {
        dxf: async (result, inputs) => {
            const { generateDXF } = await import('@/cad/dxf/DxfGenerator');
            const { calculateGearGeometry: getProfile } = await import('@/engines/math/involute');

            const m = inputs.m;
            const z1 = inputs.z1;
            const z2 = inputs.z2;
            const alpha = inputs.alpha;
            const x1 = inputs.x1 ?? 0;
            const x2 = inputs.x2 ?? 0;
            const b = inputs.b ?? 10;

            // Generate Pinion
            const pinionGeo = getProfile({
                module: m, teethCount: z1, pressureAngle: alpha,
                profileShift: x1, addendumCoeff: 1.0, dedendumCoeff: 1.25, clearanceCoeff: 0.25
            });

            // Generate Gear
            const gearGeo = getProfile({
                module: m, teethCount: z2, pressureAngle: alpha,
                profileShift: x2, addendumCoeff: 1.0, dedendumCoeff: 1.25, clearanceCoeff: 0.25
            });

            const entities: any[] = []; // CadEntity[]
            const layers: any[] = [
                { id: 'l_pinion', name: 'Pinion', color: '#00e5ff', visible: true, locked: false },
                { id: 'l_gear', name: 'Gear', color: '#ff9500', visible: true, locked: false }
            ];

            // Pinion Entity
            entities.push({
                id: 'e_pinion',
                layerId: 'l_pinion',
                type: 'POLYLINE',
                itemType: 'solid', // filler
                geometry: {
                    type: 'POLYLINE',
                    vertices: pinionGeo.fullGearContour.map(p => ({ x: p.x, y: p.y, z: 0 })),
                    closed: true
                },
                isVisible: true,
                isSelected: false
            });

            // Gear Entity (shifted by center distance a)
            // a = m * (z1 + z2) / 2 + m * (x1 + x2)
            const a = (m * (z1 + z2)) / 2 + m * (x1 + x2);

            entities.push({
                id: 'e_gear',
                layerId: 'l_gear',
                type: 'POLYLINE',
                itemType: 'solid',
                geometry: {
                    type: 'POLYLINE',
                    vertices: gearGeo.fullGearContour.map(p => ({ x: p.x + a, y: p.y, z: 0 })),
                    closed: true
                },
                isVisible: true,
                isSelected: false
            });

            return generateDXF(entities, layers);
        },

        step: async (result, inputs) => {
            const step = await import('@/engines/export/step.writer');
            const { calculateGearGeometry: getProfile } = await import('@/engines/math/involute');

            // Inputs
            const m = inputs.m;
            const z1 = inputs.z1;
            const z2 = inputs.z2;
            const alpha = inputs.alpha;
            const x1 = inputs.x1 ?? 0;
            const x2 = inputs.x2 ?? 0;
            const b = inputs.b ?? 10;
            const a = (m * (z1 + z2)) / 2 + m * (x1 + x2);

            const writer = new step.STEPWriter({
                filename: 'AluGear_Assembly',
                description: `Spur Gear Pair m=${m} z1=${z1} z2=${z2}`,
                author: 'AluCalculator'
            });

            const contextId = step.addGeometricRepresentationContext(writer);

            // Helpher to add a gear model
            const addGearModel = (geo: any, offsetX: number, name: string) => {
                // 1. Convert points to Cartesian Points
                const pointIds = geo.fullGearContour.map((p: any) =>
                    step.addCartesianPoint(writer, p.x + offsetX, p.y, 0)
                );

                // 2. Create Vertex Points
                const vertexIds = pointIds.map((pid: number) => step.addVertexPoint(writer, pid));

                // 3. Create Edge Curves (Linear segments approximation)
                const edgeIds: number[] = [];
                for (let i = 0; i < vertexIds.length; i++) {
                    const start = vertexIds[i];
                    const end = vertexIds[(i + 1) % vertexIds.length];

                    // Direct line between points
                    const vecDir = step.addDirection(writer,
                        geo.fullGearContour[(i + 1) % vertexIds.length].x - geo.fullGearContour[i].x,
                        geo.fullGearContour[(i + 1) % vertexIds.length].y - geo.fullGearContour[i].y,
                        0
                    );
                    const vec = step.addVector(writer, vecDir, 1.0); // Magnitude handled implicitly by points? No, STEP line is Point+Vector

                    // Actually Line in STEP is Point + Vector. It's infinite.
                    // EDGE_CURVE delimits it with vertices.
                    const lineId = step.addLine(writer, pointIds[i], vec);
                    const edgeId = step.addEdgeCurve(writer, start, end, lineId, true);
                    const orientedEdgeId = step.addOrientedEdge(writer, edgeId, true);
                    edgeIds.push(orientedEdgeId);
                }

                // 4. Create Edge Loop
                const loopId = step.addEdgeLoop(writer, edgeIds);

                // 5. Create Face Bound
                const boundId = step.addFaceOuterBound(writer, loopId, true);

                // 6. Create Surfce (Plane at Z=0)
                // AXIS2_PLACEMENT_3D for plane
                const origin = step.addCartesianPoint(writer, offsetX, 0, 0);
                const axis = step.addDirection(writer, 0, 0, 1);
                const ref = step.addDirection(writer, 1, 0, 0);
                const axis2 = step.addAxis2Placement3D(writer, origin, axis, ref);
                const planeId = step.addPlane(writer, axis2);

                // 7. Advanced Face
                const faceId = step.addAdvancedFace(writer, [boundId], planeId, true);

                // 8. Shell
                const shellId = step.addClosedShell(writer, [faceId]); // Technically OpenShell but STEP uses ClosedShell often for single faces in surface models
                // Use SHELL_BASED_SURFACE_MODEL

                const sbsm = writer.addEntity('SHELL_BASED_SURFACE_MODEL', [name, `(#${shellId})`]);

                // Return the shape representation item
                return sbsm;
            };

            // Pinion
            const pinionGeo = getProfile({
                module: m, teethCount: z1, pressureAngle: alpha,
                profileShift: x1, addendumCoeff: 1.0, dedendumCoeff: 1.25, clearanceCoeff: 0.25
            });
            const pinionShape = addGearModel(pinionGeo, 0, 'Pinion');

            // Gear
            const gearGeo = getProfile({
                module: m, teethCount: z2, pressureAngle: alpha,
                profileShift: x2, addendumCoeff: 1.0, dedendumCoeff: 1.25, clearanceCoeff: 0.25
            });
            const gearShape = addGearModel(gearGeo, a, 'Gear');

            // Product Structure
            const productId = step.addProduct(writer, 'Gear_Assembly', 'Spur Gear Pair');
            const formationId = step.addProductDefinitionFormation(writer, productId);
            const defId = step.addProductDefinition(writer, formationId);
            const shapeRep = step.addShapeRepresentation(writer, [pinionShape, gearShape], contextId);
            step.addShapeDefinitionRepresentation(writer, defId, shapeRep);

            return writer.generate();
        }
    },

};

export default gearSpurSchema;
