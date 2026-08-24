import { Matrix, matrix, multiply, inv, add, subtract, zeros, subset, index, flatten, transpose } from 'mathjs';

// ============================================
// PHYSICS CONSTANTS
// ============================================
const GRAVITY = -9810; // mm/s^2
const DAMPING = 0.98;
const FRACTURE_LIMIT = 1.2;

// ============================================
// TYPES
// ============================================

import { BaseMaterial, HeatTreatment, Coating, MaterialService } from '../materials/MaterialDatabase';

export interface Node2D {
    id: string;
    x: number; // mm
    y: number; // mm
    restraints: {
        x: boolean; // true = fixed
        y: boolean;
        moment: boolean;
    };

    // Physics State
    vx?: number;
    vy?: number;
    mass?: number;
    fixed?: boolean; // Cached boolean for perf
    forceX?: number; // Accumulator
    forceY?: number; // Accumulator
}

// Replaces simple Material interface
export interface AnalysisMaterial extends BaseMaterial {
    activeTreatmentId?: string;
    activeCoatingId?: string;
}

export interface Section {
    id: string;
    name: string;
    I: number; // Moment of Inertia (mm^4)
    A: number; // Area (mm^2)
    J?: number; // Torsional Constant (mm^4)
}

export interface Element2D {
    id: string;
    startNodeId: string;
    endNodeId: string;
    materialId: string;
    sectionId: string;

    // Physics State
    tempChange?: number;
    broken?: boolean; // If true, provides no stiffness
    initialLength?: number;
}

export interface PointLoad {
    id: string;
    nodeId: string;
    fx: number; // N
    fy: number; // N
    moment: number; // Nmm
    torque?: number; // Nmm (Torsion)
}

export interface SolverResult {
    displacements: Record<string, { u: number, v: number, theta: number }>;
    reactions: Record<string, { fx: number, fy: number, moment: number }>;
    stresses: Record<string, {
        sigma_axial: number,
        sigma_bending: number,
        tau_shear: number,
        von_mises: number,
        safety_factor: number
    }>;
    success: boolean;
    error?: string;
}

// ============================================
// ENGINE
// ============================================

export class StructuralEngine {
    nodes: Node2D[] = [];
    elements: Element2D[] = [];
    materials: AnalysisMaterial[] = [];
    sections: Section[] = [];
    loads: PointLoad[] = [];

    // Helper: Initialize Physics State
    initSimulation() {
        // 1. Reset Nodes
        this.nodes.forEach(n => {
            n.vx = 0; n.vy = 0;
            n.forceX = 0; n.forceY = 0;
            n.fixed = !!(n.restraints.x && n.restraints.y);
            n.mass = 0.1; // Baseline nodal mass
        });

        // 2. Distribute Element Mass to Nodes
        this.elements.forEach(elem => {
            elem.broken = false;
            const n1 = this.nodes.find(n => n.id === elem.startNodeId);
            const n2 = this.nodes.find(n => n.id === elem.endNodeId);
            const mat = this.materials.find(m => m.id === elem.materialId);
            const sec = this.sections.find(s => s.id === elem.sectionId);

            if (n1 && n2 && mat && sec) {
                const len = Math.hypot(n2.x - n1.x, n2.y - n1.y);
                // Careful with units. A is mm^2. L is mm. Volume = A*L (mm^3).
                // Density is kg/m^3. 
                // Mass = (Density / 1e9) * Volume(mm^3).
                // Just use approximation for game feel if units are tricky.
                const mass = (mat.density / 1e6) * (sec.A * len); // Approx

                n1.mass = (n1.mass || 0) + mass / 2;
                n2.mass = (n2.mass || 0) + mass / 2;
                elem.initialLength = len;
            }
        });
    }

    // REAL-TIME PHYSICS STEP (Explicit Euler / Corotational)
    stepSimulation(dt: number, applyGravity: boolean = true) {
        // 1. Clear Forces & Apply Gravity
        this.nodes.forEach(n => {
            n.forceX = 0;
            n.forceY = applyGravity ? ((n.mass || 1) * GRAVITY) : 0;
            // Damping (simple linear drag)
            n.vx = (n.vx || 0) * DAMPING;
            n.vy = (n.vy || 0) * DAMPING;
        });

        // 2. Element Forces (Springs)
        this.elements.forEach(elem => {
            if (elem.broken) return;

            const n1 = this.nodes.find(n => n.id === elem.startNodeId);
            const n2 = this.nodes.find(n => n.id === elem.endNodeId);
            const mat = this.materials.find(m => m.id === elem.materialId);
            const sec = this.sections.find(s => s.id === elem.sectionId);

            if (n1 && n2 && mat && sec) {
                const dx = n2.x - n1.x;
                const dy = n2.y - n1.y;
                const currentLen = Math.hypot(dx, dy);
                const L0 = elem.initialLength || currentLen;

                // Axial Strain
                const strain = (currentLen - L0) / L0;

                // Stress Check -> Fracture
                // Yield Strength is MPa (N/mm^2). E is MPa.
                // Stress = E * strain.
                if (Math.abs(strain * mat.E) > (mat.ultimateStrength * FRACTURE_LIMIT)) {
                    elem.broken = true;
                    return;
                }

                // Axial Force (Hooke's Law): F = k * delta
                // k = EA / L
                const k = (mat.E * sec.A) / L0;
                const forceMag = k * (currentLen - L0);

                // Direction Vector (Normalized)
                const nx = dx / currentLen;
                const ny = dy / currentLen;

                // Apply to nodes
                const fx = nx * forceMag;
                const fy = ny * forceMag;

                n1.forceX = (n1.forceX || 0) + fx;
                n1.forceY = (n1.forceY || 0) + fy;
                n2.forceX = (n2.forceX || 0) - fx;
                n2.forceY = (n2.forceY || 0) - fy;
            }
        });

        // 3. Integration (Symplectic Euler)
        this.nodes.forEach(n => {
            if (n.fixed) return; // Don't move fixed nodes

            // a = F/m
            const m = n.mass || 1;
            const ax = (n.forceX || 0) / m;
            const ay = (n.forceY || 0) / m;

            // v += a * dt
            n.vx = (n.vx || 0) + ax * dt;
            n.vy = (n.vy || 0) + ay * dt;

            // x += v * dt
            n.x += n.vx * dt;
            n.y += n.vy * dt;
        });
    }

    constructor() { }

    // --- BUILDER METHODS ---

    addNode(x: number, y: number, restraints = { x: false, y: false, moment: false }): string {
        const id = `node_${this.nodes.length + 1}`;
        this.nodes.push({ id, x, y, restraints });
        return id;
    }

    addElement(startNodeId: string, endNodeId: string, materialId: string, sectionId: string): string {
        const id = `elem_${this.elements.length + 1}`;
        this.elements.push({ id, startNodeId, endNodeId, materialId, sectionId });
        return id;
    }

    addMaterial(baseMatId: string, treatmentId?: string): string {
        const id = `mat_${this.materials.length + 1}`;
        // Resolve from DB
        const props = MaterialService.resolveProperties(baseMatId, treatmentId || 't0'); // Default T0/Annealed

        if (props) {
            this.materials.push({ ...props, id });
        } else {
            // Fallback for custom
            // simplified: use a default steel if not found
            const fallback = MaterialService.resolveProperties('steel_a36', 'hr')!;
            this.materials.push({ ...fallback, id, name: "Unknown" });
        }
        return id;
    }

    addSection(name: string, A: number, I: number, depth: number = 100): string {
        const id = `sec_${this.sections.length + 1}`;
        this.sections.push({ id, name, A, I, depth } as any); // Cast to any to assume Section interface has depth now
        return id;
    }

    addLoad(nodeId: string, fx: number, fy: number, moment: number): string {
        const id = `load_${this.loads.length + 1}`;
        this.loads.push({ id, nodeId, fx, fy, moment });
        return id;
    }

    // --- SOLVER CORE ---

    solve(): SolverResult {
        try {
            const dof = this.nodes.length * 3;
            if (dof === 0) {
                return { success: false, error: "No nodes defined", displacements: {}, reactions: {}, stresses: {} };
            }
            // Explicitly create Matrix objects
            const K_global = matrix(zeros([dof, dof])) as unknown as Matrix;
            const F_global = matrix(zeros([dof, 1])) as unknown as Matrix;

            // 1. ASSEMBLE GLOBAL STIFFNESS MATRIX
            this.elements.forEach(elem => {
                const k_local = this.getElementStiffness(elem);
                const T = this.getTransformationMatrix(elem);

                // k_global = T_transpose * k_local * T
                const k_global_elem = multiply(multiply(transpose(T), k_local), T) as Matrix;

                // Assemble into K_global
                const indexes = this.getElementIndices(elem);
                indexes.forEach((globalRow, localRow) => {
                    indexes.forEach((globalCol, localCol) => {
                        const currentVal = K_global.get([globalRow, globalCol]);
                        const addVal = k_global_elem.get([localRow, localCol]);
                        // Ensure we are adding numbers
                        K_global.set([globalRow, globalCol], Number(currentVal) + Number(addVal));
                    });
                });
            });

            // 2b. CALCULATE THERMAL LOADS
            this.elements.forEach(elem => {
                if (!elem.tempChange || elem.tempChange === 0) return;

                const mat = this.materials.find(m => m.id === elem.materialId);
                const sec = this.sections.find(s => s.id === elem.sectionId);
                if (!mat || !sec) return;

                // F_thermal = E * A * alpha * deltaT
                const F_th = mat.E * sec.A * mat.alpha * elem.tempChange;

                // Local Force Vector (Axial only for now)
                // [-F, 0, 0, F, 0, 0]
                const f_local = matrix([[-F_th], [0], [0], [F_th], [0], [0]]);

                const T = this.getTransformationMatrix(elem);
                const f_global = multiply(transpose(T), f_local) as Matrix; // T_transpose * f_local

                // Add to F_global
                const indices = this.getElementIndices(elem);
                indices.forEach((globalIdx, i) => {
                    const current = F_global.get([globalIdx, 0]);
                    F_global.set([globalIdx, 0], Number(current) + Number(f_global.get([i, 0])));
                });
            });

            // 3. APPLY EXTERNAL LOADS
            this.loads.forEach(load => {
                const nodeIndex = this.nodes.findIndex(n => n.id === load.nodeId);
                if (nodeIndex === -1) return;

                const baseIndex = nodeIndex * 3;
                F_global.set([baseIndex, 0], F_global.get([baseIndex, 0]) + load.fx);
                F_global.set([baseIndex + 1, 0], F_global.get([baseIndex + 1, 0]) + load.fy);
                F_global.set([baseIndex + 2, 0], F_global.get([baseIndex + 2, 0]) + load.moment);
            });

            // 3. APPLY BOUNDARY CONDITIONS (Penalty Method or Reduction)
            // Reduction Method:
            const freeIndices: number[] = [];
            this.nodes.forEach((node, i) => {
                if (!node.restraints.x) freeIndices.push(i * 3);
                if (!node.restraints.y) freeIndices.push(i * 3 + 1);
                if (!node.restraints.moment) freeIndices.push(i * 3 + 2);
            });

            if (freeIndices.length === 0) {
                return { success: false, error: "Fully simplified structure (no degrees of freedom)", displacements: {}, reactions: {}, stresses: {} };
            }

            // Extract K_reduced and F_reduced
            const K_reduced = subset(K_global, index(freeIndices, freeIndices)) as Matrix;
            const F_reduced = subset(F_global, index(freeIndices, [0])) as Matrix;

            // 4. SOLVE U = K^-1 * F
            let U_reduced: Matrix;
            try {
                // Invert or Solve. For small systems, inv() is fine.
                const K_inv = inv(K_reduced);
                U_reduced = multiply(K_inv, F_reduced) as Matrix;
            } catch (e) {
                return { success: false, error: "Unstable Structure (Singular Matrix)", displacements: {}, reactions: {}, stresses: {} };
            }

            // Map back to global U
            const U_global = matrix(zeros([dof, 1])) as unknown as Matrix;
            freeIndices.forEach((globalIdx, i) => {
                U_global.set([globalIdx, 0], U_reduced.get([i, 0]));
            });

            // 5. POST-PROCESS & STRESS ANALYSIS
            // Calculate Reactions: R = K * U - F
            const Reactions_Global = multiply(K_global, U_global);
            const R_net = subtract(Reactions_Global, F_global) as Matrix;

            const displacements: Record<string, { u: number, v: number, theta: number }> = {};
            const reactions: Record<string, { fx: number, fy: number, moment: number }> = {};
            const stresses: Record<string, {
                sigma_axial: number,
                sigma_bending: number,
                tau_shear: number,
                von_mises: number,
                safety_factor: number
            }> = {};

            this.nodes.forEach((node, i) => {
                displacements[node.id] = {
                    u: U_global.get([i * 3, 0]),
                    v: U_global.get([i * 3 + 1, 0]),
                    theta: U_global.get([i * 3 + 2, 0])
                };

                // Only significant reactions
                const rx = R_net.get([i * 3, 0]);
                const ry = R_net.get([i * 3 + 1, 0]);
                const rm = R_net.get([i * 3 + 2, 0]);

                if (node.restraints.x || node.restraints.y || node.restraints.moment) {
                    reactions[node.id] = { fx: rx, fy: ry, moment: rm };
                }
            });

            // Calculate Element Stresses
            this.elements.forEach(elem => {
                const k_local = this.getElementStiffness(elem);
                const T = this.getTransformationMatrix(elem);
                const indices = this.getElementIndices(elem);

                // Get element displacement vector (global)
                const u_elem_global = matrix(zeros([6, 1])) as unknown as Matrix;
                indices.forEach((globalIdx, i) => {
                    u_elem_global.set([i, 0], U_global.get([globalIdx, 0]));
                });

                // Convert to local displacement: u_local = T * u_global
                const u_elem_local = multiply(T, u_elem_global) as Matrix;

                // Calculate local forces: f_local = k_local * u_local
                const f_local = multiply(k_local, u_elem_local) as Matrix;

                // Extract internal forces
                const N = Math.abs(f_local.get([0, 0])); // Axial (tension/compression)
                const V = Math.abs(f_local.get([1, 0])); // Shear
                const M1 = Math.abs(f_local.get([2, 0]));
                const M2 = Math.abs(f_local.get([5, 0]));
                const M = Math.max(M1, M2); // Max Moment

                // Material & Section Properties
                const mat = this.materials.find(m => m.id === elem.materialId);
                const sec = this.sections.find(s => s.id === elem.sectionId);

                if (mat && sec) {
                    // Geometry (simplified)
                    // Assuming I-beam or Rectangular for 'c'
                    // Need 'depth' in Section. For now, estimate c approx sqrt(I/A)*2 or similar if not provided.
                    // Better: Add depth to Section interface.
                    const depth = (sec as any).depth || 100; // Fallback
                    const c = depth / 2;

                    // Stresses
                    const sigma_a = N / sec.A;
                    const sigma_b = (M * c) / sec.I;
                    const sigma_total = sigma_a + sigma_b;

                    const tau = V / (sec.A * 0.8); // Approx shear area

                    // Von Mises (Plane Stress)
                    const vm = Math.sqrt(Math.pow(sigma_total, 2) + 3 * Math.pow(tau, 2));

                    // Safety Factor
                    const yieldStr = mat.yieldStrength || 250;
                    const sf = vm > 0.001 ? yieldStr / vm : 999;

                    stresses[elem.id] = {
                        sigma_axial: sigma_a,
                        sigma_bending: sigma_b,
                        tau_shear: tau,
                        von_mises: vm,
                        safety_factor: sf
                    };
                }
            });

            return {
                displacements,
                reactions,
                stresses,
                success: true
            };

        } catch (e: any) {
            console.error(e);
            return {
                displacements: {},
                reactions: {},
                stresses: {},
                success: false,
                error: e.message
            };
        }
    }

    private getTransformationMatrix(elem: Element2D): Matrix {
        const n1 = this.nodes.find(n => n.id === elem.startNodeId);
        const n2 = this.nodes.find(n => n.id === elem.endNodeId);
        if (!n1 || !n2) throw new Error("Invalid Nodes");

        const dx = n2.x - n1.x;
        const dy = n2.y - n1.y;
        const L = Math.sqrt(dx * dx + dy * dy);
        const c = dx / L;
        const s = dy / L;

        // 6x6 Transformation Matrix
        // [ c  s  0  0  0  0 ]
        // [ -s c  0  0  0  0 ]
        // [ 0  0  1  0  0  0 ]
        // [ 0  0  0  c  s  0 ]
        // [ 0  0  0 -s  c  0 ]
        // [ 0  0  0  0  0  1 ]

        return matrix([
            [c, s, 0, 0, 0, 0],
            [-s, c, 0, 0, 0, 0],
            [0, 0, 1, 0, 0, 0],
            [0, 0, 0, c, s, 0],
            [0, 0, 0, -s, c, 0],
            [0, 0, 0, 0, 0, 1]
        ]);
    }

    private getElementIndices(elem: Element2D): number[] {
        const n1Idx = this.nodes.findIndex(n => n.id === elem.startNodeId);
        const n2Idx = this.nodes.findIndex(n => n.id === elem.endNodeId);

        if (n1Idx === -1 || n2Idx === -1) throw new Error(`Invalid Node IDs in Element ${elem.id}`);

        return [
            n1Idx * 3, n1Idx * 3 + 1, n1Idx * 3 + 2,
            n2Idx * 3, n2Idx * 3 + 1, n2Idx * 3 + 2
        ];
    }

    private getElementStiffness(elem: Element2D): Matrix {
        const n1 = this.nodes.find(n => n.id === elem.startNodeId);
        const n2 = this.nodes.find(n => n.id === elem.endNodeId);
        const mat = this.materials.find(m => m.id === elem.materialId);
        const sec = this.sections.find(s => s.id === elem.sectionId);

        if (!n1 || !n2 || !mat || !sec) throw new Error("Invalid Element Data");

        const dx = n2.x - n1.x;
        const dy = n2.y - n1.y;
        const L = Math.sqrt(dx * dx + dy * dy);

        const { E } = mat;
        const { A, I } = sec;

        // Stiffness Coefficients
        const k_axial = (E * A) / L;
        const k1 = (12 * E * I) / Math.pow(L, 3);
        const k2 = (6 * E * I) / Math.pow(L, 2);
        const k3 = (4 * E * I) / L;
        const k4 = (2 * E * I) / L;

        // Local Stiffness Matrix (6x6)
        // u1, v1, th1, u2, v2, th2
        // ... Construction of 6x6 k_local matrix ...
        return matrix([
            [k_axial, 0, 0, -k_axial, 0, 0],
            [0, k1, k2, 0, -k1, k2],
            [0, k2, k3, 0, -k2, k4],
            [-k_axial, 0, 0, k_axial, 0, 0],
            [0, -k1, -k2, 0, k1, -k2],
            [0, k2, k4, 0, -k2, k3]
        ]);
    }
}
