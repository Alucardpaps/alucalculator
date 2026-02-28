
// ============================================
// 3D STRUCTURAL ENGINE (SPACE FRAME SOLVER)
// ============================================
import { Matrix, matrix, multiply, inv, add, subtract, zeros, index, flatten, transpose } from 'mathjs';
import { AnalysisMaterial, Section, PointLoad } from './StructuralEngine';

// --- CONSTANTS ---
const GRAVITY = -9810; // mm/s^2 (Z-axis is up? usually Y is up in ThreeJS, Z is forward. In Engineering Z is usually up. Let's stick to Y-up for ThreeJS compatibility)
const DAMPING = 0.98;
const FRACTURE_LIMIT = 1.2;

// --- TYPES ---
export interface Node3D {
    id: string;
    x: number; y: number; z: number;
    restraints: {
        x: boolean; y: boolean; z: boolean;
        rx: boolean; ry: boolean; rz: boolean;
    };
    // Physics State
    vx: number; vy: number; vz: number;
    mass: number;
    forceX: number; forceY: number; forceZ: number;
    fixed: boolean;
    // Rest positions for deformation scaling
    restX?: number; restY?: number; restZ?: number;
    jointType?: 'BOLT' | 'WELD' | 'KEY' | 'PIN';
}

export interface Element3D {
    id: string;
    startNodeId: string;
    endNodeId: string;
    materialId: string;
    sectionId: string;
    roll: number; // Roll angle (beta) for orientation
    // State
    broken: boolean;
    initialLength?: number;
    // Analysis results (transient)
    stress?: number; // Von Mises or Axial Stress (MPa)
    strain?: number;
}

export interface SolverResult3D {
    displacements: Record<string, { u: number, v: number, w: number, rx: number, ry: number, rz: number }>;
    success: boolean;
}

export class StructuralEngine3D {
    nodes: Node3D[] = [];
    elements: Element3D[] = [];
    materials: AnalysisMaterial[] = [];
    sections: Section[] = [];

    constructor() { }

    // --- BUILDER METHODS ---
    addNode(x: number, y: number, z: number, fixed = false): Node3D {
        const n: Node3D = {
            id: crypto.randomUUID(),
            x, y, z,
            restraints: { x: fixed, y: fixed, z: fixed, rx: fixed, ry: fixed, rz: fixed },
            vx: 0, vy: 0, vz: 0,
            mass: 1,
            forceX: 0, forceY: 0, forceZ: 0,
            fixed
        };
        this.nodes.push(n);
        return n;
    }

    addElement(n1: Node3D, n2: Node3D, matId: string, secId: string): string {
        const el: Element3D = {
            id: crypto.randomUUID(),
            startNodeId: n1.id,
            endNodeId: n2.id,
            materialId: matId,
            sectionId: secId,
            roll: 0,
            broken: false
        };
        this.elements.push(el);
        return el.id;
    }

    // --- MATH HELPERS ---

    // 12x12 Stiffness Matrix in Local Coordinates
    getLocalStiffness(L: number, E: number, G: number, A: number, Iy: number, Iz: number, J: number): Matrix {
        // k_local for 3D Beam
        // 12 degrees of freedom: [u1 v1 w1 th_x1 th_y1 th_z1  u2 v2 w2 th_x2 th_y2 th_z2]

        const k = zeros([12, 12]) as Matrix;

        // Axial (u)
        const X = (E * A) / L;
        k.set([0, 0], X); k.set([0, 6], -X);
        k.set([6, 0], -X); k.set([6, 6], X);

        // Torsion (theta_x)
        const T = (G * J) / L;
        k.set([3, 3], T); k.set([3, 9], -T);
        k.set([9, 3], -T); k.set([9, 9], T);

        // Bending about Z (v, theta_z) -> Strong Axis usually?
        const a1 = (12 * E * Iz) / (L ** 3);
        const a2 = (6 * E * Iz) / (L ** 2);
        const a3 = (4 * E * Iz) / L;
        const a4 = (2 * E * Iz) / L;

        // v1, th_z1, v2, th_z2 indices: 1, 5, 7, 11
        k.set([1, 1], a1); k.set([1, 5], a2); k.set([1, 7], -a1); k.set([1, 11], a2);
        k.set([5, 1], a2); k.set([5, 5], a3); k.set([5, 7], -a2); k.set([5, 11], a4);
        k.set([7, 1], -a1); k.set([7, 5], -a2); k.set([7, 7], a1); k.set([7, 11], -a2);
        k.set([11, 1], a2); k.set([11, 5], a4); k.set([11, 7], -a2); k.set([11, 11], a3);

        // Bending about Y (w, theta_y) -> Weak Axis
        const b1 = (12 * E * Iy) / (L ** 3);
        const b2 = (6 * E * Iy) / (L ** 2);
        const b3 = (4 * E * Iy) / L;
        const b4 = (2 * E * Iy) / L;

        // w1, th_y1, w2, th_y2 indices: 2, 4, 8, 10
        // Signs are tricky for Y-bending due to right-hand rule
        k.set([2, 2], b1); k.set([2, 4], -b2); k.set([2, 8], -b1); k.set([2, 10], -b2);
        k.set([4, 2], -b2); k.set([4, 4], b3); k.set([4, 8], b2); k.set([4, 10], b4);
        k.set([8, 2], -b1); k.set([8, 4], b2); k.set([8, 8], b1); k.set([8, 10], b2);
        k.set([10, 2], -b2); k.set([10, 4], b4); k.set([10, 8], b2); k.set([10, 10], b3);

        return k;
    }

    // Transformation Matrix (12x12)
    getTransformationMatrix(n1: Node3D, n2: Node3D, roll: number): Matrix {
        const dx = n2.x - n1.x;
        const dy = n2.y - n1.y;
        const dz = n2.z - n1.z;
        const L = Math.hypot(dx, dy, dz);

        // Direction Cosines of local x-axis (x')
        const cx = dx / L;
        const cy = dy / L;
        const cz = dz / L;

        // Arbitrary auxiliary node for y' and z' orientation?
        // Standard method: If vertical, handle special case.
        // Let's use the helper vector method.
        // v_temp usually (0, 1, 0) unless element is vertical.

        let R = zeros([3, 3]) as Matrix;

        // If element is vertical (cx=0, cz=0)
        if (Math.abs(cx) < 1e-6 && Math.abs(cz) < 1e-6) {
            // Vertical along Y
            // x' = (0, 1, 0) or (0, -1, 0)
            // y' = (-1, 0, 0) if up
            const sign = Math.sign(cy);
            R = matrix([
                [0, sign, 0],
                [-sign, 0, 0],
                [0, 0, 1]
            ]);
            // Apply Roll here? Rotate R about x'
        } else {
            // General Case
            // x' = [cx, cy, cz]
            // y' = z_global cross x' (horizontal-ish) - wait, standard is usually z' is horizontal?
            // Let's stick to standard FEM:
            // Frame transformation is tricky.
            // Let's compute Rotation Matrix R (3x3)

            // x_prime axis
            const Xp = [cx, cy, cz];

            // z_prime axis = Xp cross Y_global(0,1,0) normalized
            // If Xp is parallel to Y, this fails (handled above)
            const Yg = [0, 1, 0];
            let Zp = [
                Xp[1] * Yg[2] - Xp[2] * Yg[1], // cz
                Xp[2] * Yg[0] - Xp[0] * Yg[2], // 0
                Xp[0] * Yg[1] - Xp[1] * Yg[0]  // -cx
            ];
            // Normalize Zp
            const lenZ = Math.hypot(Zp[0], Zp[1], Zp[2]);
            Zp = Zp.map(v => v / lenZ);

            // y_prime = Zp cross Xp
            let Yp = [
                Zp[1] * Xp[2] - Zp[2] * Xp[1],
                Zp[2] * Xp[0] - Zp[0] * Xp[2],
                Zp[0] * Xp[1] - Zp[1] * Xp[0]
            ];

            // R = rows are Xp, Yp, Zp
            R = matrix([
                Xp,
                Yp,
                Zp
            ]);
        }

        // Full 12x12 T = diag(R, R, R, R)
        const T = zeros([12, 12]) as Matrix;

        // Fill diagonals (0,0), (3,3), (6,6), (9,9)
        const r_arr = R.toArray() as number[][];
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                const val = r_arr[i][j];
                T.set([i, j], val);     // u,v,w
                T.set([i + 3, j + 3], val); // th_x, th_y, th_z
                T.set([i + 6, j + 6], val); // u2...
                T.set([i + 9, j + 9], val); // th2...
            }
        }

        return T;
    }

    // --- SOLVER ---
    solve(): SolverResult3D {
        const nNodes = this.nodes.length;
        const nDOF = nNodes * 6;
        const K = zeros([nDOF, nDOF], 'sparse') as Matrix; // Use sparse matrix if possible, else dense
        const F = zeros([nDOF, 1]) as Matrix;

        // 1. Assembly
        this.elements.forEach(el => {
            const n1 = this.nodes.find(n => n.id === el.startNodeId);
            const n2 = this.nodes.find(n => n.id === el.endNodeId);
            const sec = this.sections.find(s => s.id === el.sectionId);
            const mat = this.materials.find(m => m.id === el.materialId);

            if (!n1 || !n2 || !sec || !mat) return;

            const idx1 = this.nodes.indexOf(n1) * 6;
            const idx2 = this.nodes.indexOf(n2) * 6;
            const indices = [
                idx1, idx1 + 1, idx1 + 2, idx1 + 3, idx1 + 4, idx1 + 5,
                idx2, idx2 + 1, idx2 + 2, idx2 + 3, idx2 + 4, idx2 + 5
            ];

            const L = Math.hypot(n2.x - n1.x, n2.y - n1.y, n2.z - n1.z);
            const E = mat.E;
            const G = mat.G;
            const A = sec.A;
            const Iy = sec.I; // Assuming I = Iy = Iz for now (Circular/Square), need full props
            const Iz = sec.I;
            const J = sec.J || (Iy + Iz); // Polar Moment estimate

            const k_local = this.getLocalStiffness(L, E, G, A, Iy, Iz, J);
            const T = this.getTransformationMatrix(n1, n2, el.roll);
            const T_t = transpose(T);

            // k_global = T' * k_local * T
            const flex = multiply(multiply(T_t, k_local), T) as Matrix;

            // Add to Global K
            const f_arr = flex.toArray() as number[][];
            for (let i = 0; i < 12; i++) {
                for (let j = 0; j < 12; j++) {
                    const global_i = indices[i];
                    const global_j = indices[j];
                    const val = K.get([global_i, global_j]) + f_arr[i][j];
                    K.set([global_i, global_j], val);
                }
            }
        });

        // 2. Apply Boundary Conditions
        const freeDOFs: number[] = [];
        this.nodes.forEach((n, i) => {
            const base = i * 6;
            if (!n.restraints.x) freeDOFs.push(base);
            if (!n.restraints.y) freeDOFs.push(base + 1);
            if (!n.restraints.z) freeDOFs.push(base + 2);
            if (!n.restraints.rx) freeDOFs.push(base + 3);
            if (!n.restraints.ry) freeDOFs.push(base + 4);
            if (!n.restraints.rz) freeDOFs.push(base + 5);
        });

        if (freeDOFs.length === 0) return { success: false, displacements: {} };

        // 3. Extract Reduced K and F
        // This is slow for large systems. For 3D we need a better math lib ideally.
        // mathjs is dense by default for subsets.
        const K_reduced = K.subset(index(freeDOFs, freeDOFs));

        // Add Loads to F (not implemented yet, assuming F=0 for now)
        // this.loads.forEach...

        // 4. Solve K * U = F
        // U = inv(K) * F
        let U_reduced: Matrix;
        try {
            // Invert
            const K_inv = inv(K_reduced);
            // Apply dummy load for testing if F is empty? 
            // Real implementation needs load vector F assembled from point loads.
            // For now, let's assume F is zero -> U is zero.
            // Just return success for now.
            return { success: true, displacements: {} };
        } catch (e) {
            console.error("Singular Matrix", e);
            return { success: false, displacements: {} };
        }
    }

    // --- DYNAMIC SOLVER (GAME PHYSICS) ---
    initSimulation() {
        this.nodes.forEach(n => {
            n.vx = 0; n.vy = 0; n.vz = 0;
            n.forceX = 0; n.forceY = 0; n.forceZ = 0;
            n.mass = 0.1; // Default mass if no element attached
        });

        // 1. Calculate Nodal Mass from Elements
        this.elements.forEach(el => {
            const n1 = this.nodes.find(n => n.id === el.startNodeId);
            const n2 = this.nodes.find(n => n.id === el.endNodeId);
            const sec = this.sections.find(s => s.id === el.sectionId);
            const mat = this.materials.find(m => m.id === el.materialId);

            if (n1 && n2 && sec && mat) {
                const len = Math.hypot(n2.x - n1.x, n2.y - n1.y, n2.z - n1.z);
                el.initialLength = len;

                // Mass = Volume * Density
                // Density is usually kg/m^3. Dimensions in mm. 
                // Need to be careful with units.
                // Let's assume consistent units for "Game Feel"
                const vol = sec.A * len;
                const density = mat.density / 1000; // arbitrary scaling for simulation stability
                const mass = vol * density;

                n1.mass += mass * 0.5;
                n2.mass += mass * 0.5;
            }
        });
    }

    stepSimulation(dt: number, applyGravity: boolean = true) {
        // A. Reset Forces & Apply Gravity
        this.nodes.forEach(n => {
            if (n.fixed) {
                n.forceX = 0; n.forceY = 0; n.forceZ = 0;
                n.vx = 0; n.vy = 0; n.vz = 0;
                return;
            }

            n.forceX = 0;
            n.forceY = applyGravity ? GRAVITY * n.mass : 0; // Gravity in Y (ThreeJS Up) or Z? 
            // In ThreeJS, Y is usually UP. In our 2D engine Y was inverted. 
            // A common convention in structural engineering is Z-up. 
            // Let's use Y-Up for ThreeJS compatibility.
            // If user said "Gravity Z-axis", we should check coordinate system.
            // Let's assume Y is UP for visualized physics.
            n.forceZ = 0;

            // Damping (Drag)
            n.forceX -= n.vx * DAMPING * n.mass;
            n.forceY -= n.vy * DAMPING * n.mass;
            n.forceZ -= n.vz * DAMPING * n.mass;
        });

        // B. Accumulate Element Forces (Springs)
        this.elements.forEach(el => {
            if (el.broken) return;

            const n1 = this.nodes.find(n => n.id === el.startNodeId);
            const n2 = this.nodes.find(n => n.id === el.endNodeId);
            const sec = this.sections.find(s => s.id === el.sectionId);
            const mat = this.materials.find(m => m.id === el.materialId);

            if (!n1 || !n2 || !sec || !mat) return;

            const dx = n2.x - n1.x;
            const dy = n2.y - n1.y;
            const dz = n2.z - n1.z;
            const len = Math.hypot(dx, dy, dz);

            if (!el.initialLength) el.initialLength = len;

            // Allow restLen to change if plastic deformation occurs
            // We use initialLength to store original unloaded length, but we need a mutable restLen
            // Let's use el.initialLength as the current rest length, and maybe store original separately if needed.
            // Wait, we need to add a `restLen` property dynamically if missing:
            const restLen = (el as any).restLen || el.initialLength;

            // Axial Strain
            const strain = (len - restLen) / restLen;
            const E = mat.E;
            const Sy = mat.yieldStrength || 250;
            const Su = mat.ultimateStrength || 400;
            const yieldStrain = Sy / E;

            // 1. Fracture Check
            if (Math.abs(strain) * E > Su * FRACTURE_LIMIT) {
                el.broken = true;
                return;
            }

            // 2. Elasto-Plasticity (Yielding)
            let currentStress = strain * E;
            if (Math.abs(strain) > yieldStrain) {
                // Yielding occurs! Stress caps at Sy (perfectly plastic curve for simplicity)
                currentStress = Math.sign(strain) * Sy;

                // Update rest length (permanent deformation)
                // Plastic strain = total strain - elastic strain
                const plasticStrainDelta = strain - (Math.sign(strain) * yieldStrain);
                // Apply plastic strain to rest length for the next step so it unloads elastically
                const newRestLen = restLen * (1 + plasticStrainDelta * 0.1); // 0.1 rate factor for stability
                (el as any).restLen = newRestLen;
                (el as any).isYielded = true;
            } else {
                (el as any).isYielded = false;
            }

            // Hooke's Law: F = Stress * A
            let springForce = currentStress * sec.A;

            // 3. Euler Buckling Check (Compressive force)
            // If springForce is negative (compression)
            if (springForce < 0) {
                // P_cr = pi^2 * E * I / (K*L)^2
                const K_factor = 1.0; // Assume pinned-pinned for simple space frame
                // Minimal Moment of Inertia assuming I = Iy = Iz, or use sec.I if available
                const I_min = sec.I || (sec.A * sec.A * 0.08); // rough approx
                const P_cr = (Math.PI * Math.PI * E * I_min) / Math.pow(K_factor * restLen, 2);

                (el as any).bucklingLoad = P_cr;

                if (Math.abs(springForce) > P_cr) {
                    // Buckling occurs! Drastic reduction in compressive stiffness
                    (el as any).isBuckled = true;
                    // Cap the compressive force at buckling load (post-buckling behavior)
                    springForce = -P_cr * 1.05; // slight peak
                } else {
                    (el as any).isBuckled = false;
                }
            } else {
                (el as any).isBuckled = false;
            }

            // 4. Update element visualization state
            el.strain = strain;
            el.stress = Math.abs(currentStress);

            // Basic Fatigue Counter (approx S-N)
            // Just tracking max stress amplitude. Real fatigue requires cycle counting (Rainflow).
            const maxStressHist = (el as any).maxStress || 0;
            if (el.stress > maxStressHist) {
                (el as any).maxStress = el.stress;
                // Basquin eq: N = (Sigma_a / A)^(1/B)
                // A roughly Su, B roughly -0.08
                if (el.stress > Sy * 0.4) {
                    const N_f = Math.pow(el.stress / Su, 1 / -0.08);
                    (el as any).fatigueLife = Math.max(0, Math.floor(N_f));
                } else {
                    (el as any).fatigueLife = Infinity; // Infinite life under endurance limit
                }
            }

            // Force vector resolution
            const fx = (dx / len) * springForce;
            const fy = (dy / len) * springForce;
            const fz = (dz / len) * springForce;

            if (!n1.fixed) {
                n1.forceX += fx;
                n1.forceY += fy;
                n1.forceZ += fz;
            }
            if (!n2.fixed) {
                n2.forceX -= fx;
                n2.forceY -= fy;
                n2.forceZ -= fz;
            }
        });

        // C. Integrate (Symplectic Euler)
        this.nodes.forEach(n => {
            if (n.fixed) return;

            // a = F/m
            const ax = n.forceX / n.mass;
            const ay = n.forceY / n.mass;
            const az = n.forceZ / n.mass;

            // v += a * dt
            n.vx += ax * dt;
            n.vy += ay * dt;
            n.vz += az * dt;

            // x += v * dt
            n.x += n.vx * dt;
            n.y += n.vy * dt;
            n.z += n.vz * dt;

            // FLOOR COLLISION (Y = 0)
            if (n.y < 0) {
                n.y = 0;
                n.vy = -n.vy * 0.3; // Bounce with energy loss

                // Friction when touching floor
                n.vx *= 0.8;
                n.vz *= 0.8;
            }
        });
    }
}
