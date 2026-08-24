/**
 * AluCalc OS — Web Worker FEA & OCC Math Engine
 * 
 * Performs 1D/2D Finite Element Analysis (FEA) directly in the browser.
 * Solves the global system equation K * u = F using the Stiffness Matrix method.
 */

// Define standard types for our FEA solver
export interface FEANode {
    id: string;
    x: number; // in mm
    y: number; // in mm
}

export interface FEAElement {
    id: string;
    nodeA: string;
    nodeB: string;
    area: number; // cross section area (mm^2)
    inertia: number; // moment of inertia I (mm^4)
}

export interface FEABoundaryCondition {
    nodeId: string;
    type: 'fixed' | 'pinned' | 'roller';
    dof: { x: boolean; y: boolean; theta: boolean }; // true = constrained (fixed)
}

export interface FEALoad {
    nodeId: string;
    fx: number; // in N
    fy: number; // in N
    mz: number; // in N*mm
}

export interface FEAPayload {
    nodes: FEANode[];
    elements: FEAElement[];
    constraints: FEABoundaryCondition[];
    loads: FEALoad[];
    E: number; // Young's modulus in MPa (e.g. 210000 for steel)
}

export interface FEAResult {
    displacements: Record<string, { dx: number; dy: number; theta: number }>;
    stresses: Record<string, number>; // stress per element in MPa
    maxStress: number;
    maxDeflection: number;
}

// Global self reference for Web Worker
const ctx: Worker = self as any;

ctx.onmessage = (event: MessageEvent) => {
    const { type, engineId, executionId, payload } = event.data;

    if (type === 'execute' && engineId === 'fea-solver') {
        try {
            const result = solveFEA(payload as FEAPayload);
            ctx.postMessage({
                type: 'result',
                engineId,
                executionId,
                data: result
            });
        } catch (error: any) {
            ctx.postMessage({
                type: 'error',
                engineId,
                executionId,
                error: error.message || 'FEA Solver execution error'
            });
        }
    }
};

/**
 * High-fidelity 1D/2D Frame/Beam Element solver using the Direct Stiffness Method.
 */
function solveFEA(payload: FEAPayload): FEAResult {
    const { nodes, elements, constraints, loads, E } = payload;

    const numNodes = nodes.length;
    const dofPerNode = 3; // dx, dy, theta
    const totalDof = numNodes * dofPerNode;

    // Node lookup mapping Node ID -> Index
    const nodeIdx = new Map<string, number>();
    nodes.forEach((n, i) => nodeIdx.set(n.id, i));

    // Initialize global stiffness matrix K (totalDof x totalDof) and force vector F (totalDof)
    const K = Array.from({ length: totalDof }, () => new Float64Array(totalDof));
    const F = new Float64Array(totalDof);

    // 1. Populate Load Vector F
    loads.forEach(load => {
        const idx = nodeIdx.get(load.nodeId);
        if (idx !== undefined) {
            F[idx * dofPerNode + 0] = load.fx;
            F[idx * dofPerNode + 1] = load.fy;
            F[idx * dofPerNode + 2] = load.mz;
        }
    });

    // 2. Assemble Global Stiffness Matrix K
    elements.forEach(el => {
        const idxA = nodeIdx.get(el.nodeA)!;
        const idxB = nodeIdx.get(el.nodeB)!;
        const nodeA = nodes[idxA]!;
        const nodeB = nodes[idxB]!;

        const dx = nodeB.x - nodeA.x;
        const dy = nodeB.y - nodeA.y;
        const L = Math.sqrt(dx * dx + dy * dy);

        if (L === 0) throw new Error(`Element ${el.id} has zero length.`);

        const c = dx / L;
        const s = dy / L;

        // Local Element Stiffness Matrix for 2D beam (6x6)
        // Ke elements (using Euler-Bernoulli beam theory)
        const A = el.area;
        const I = el.inertia;

        const kLocal = Array.from({ length: 6 }, () => new Float64Array(6));
        
        // Axial stiffness terms
        const axial = (E * A) / L;
        kLocal[0][0] = axial;  kLocal[0][3] = -axial;
        kLocal[3][0] = -axial; kLocal[3][3] = axial;

        // Bending and Shear stiffness terms
        const b1 = (12 * E * I) / Math.pow(L, 3);
        const b2 = (6 * E * I) / Math.pow(L, 2);
        const b3 = (4 * E * I) / L;
        const b4 = (2 * E * I) / L;

        kLocal[1][1] = b1;   kLocal[1][2] = b2;   kLocal[1][4] = -b1;  kLocal[1][5] = b2;
        kLocal[2][1] = b2;   kLocal[2][2] = b3;   kLocal[2][4] = -b2;  kLocal[2][5] = b4;
        kLocal[4][1] = -b1;  kLocal[4][2] = -b2;  kLocal[4][4] = b1;   kLocal[4][5] = -b2;
        kLocal[5][1] = b2;   kLocal[5][2] = b4;   kLocal[5][4] = -b2;  kLocal[5][5] = b3;

        // Rotation matrix R (6x6) for transformation to global coordinates
        // T = [ c s 0 0 0 0; -s c 0 0 0 0; 0 0 1 0 0 0; ... ]
        // Transform local to global: Kg = T^T * Kl * T
        const T = [
            [c, s, 0, 0, 0, 0],
            [-s, c, 0, 0, 0, 0],
            [0, 0, 1, 0, 0, 0],
            [0, 0, 0, c, s, 0],
            [0, 0, 0, -s, c, 0],
            [0, 0, 0, 0, 0, 1]
        ];

        // Perform matrix multiplication: K_global_el = T^T * kLocal * T
        const kGlobalEl = Array.from({ length: 6 }, () => new Float64Array(6));
        
        // Temp matrix multiplication helper
        const temp = Array.from({ length: 6 }, () => new Float64Array(6));
        for (let r = 0; r < 6; r++) {
            for (let col = 0; col < 6; col++) {
                let sum = 0;
                for (let k = 0; k < 6; k++) {
                    sum += kLocal[r][k] * T[col][k]; // T is orthogonal, transpose is inverse
                }
                temp[r][col] = sum;
            }
        }
        for (let r = 0; r < 6; r++) {
            for (let col = 0; col < 6; col++) {
                let sum = 0;
                for (let k = 0; k < 6; k++) {
                    sum += T[r][k] * temp[k][col];
                }
                kGlobalEl[r][col] = sum;
            }
        }

        // Map global elements to global indices
        const dofMap = [
            idxA * dofPerNode + 0, idxA * dofPerNode + 1, idxA * dofPerNode + 2,
            idxB * dofPerNode + 0, idxB * dofPerNode + 1, idxB * dofPerNode + 2
        ];

        for (let r = 0; r < 6; r++) {
            for (let col = 0; col < 6; col++) {
                K[dofMap[r]][dofMap[col]] += kGlobalEl[r][col];
            }
        }
    });

    // 3. Apply Boundary Conditions (Penalty Method)
    const penalty = 1e15;
    constraints.forEach(bc => {
        const idx = nodeIdx.get(bc.nodeId)!;
        const baseDof = idx * dofPerNode;

        if (bc.dof.x) {
            K[baseDof + 0][baseDof + 0] += penalty;
            F[baseDof + 0] = 0;
        }
        if (bc.dof.y) {
            K[baseDof + 1][baseDof + 1] += penalty;
            F[baseDof + 1] = 0;
        }
        if (bc.dof.theta) {
            K[baseDof + 2][baseDof + 2] += penalty;
            F[baseDof + 2] = 0;
        }
    });

    // 4. Solve system equations using Gaussian Elimination
    const u = solveLinearSystem(K, F);

    // 5. Calculate results: Displacements and stresses per element
    const displacements: FEAResult['displacements'] = {};
    nodes.forEach((node, i) => {
        displacements[node.id] = {
            dx: u[i * dofPerNode + 0],
            dy: u[i * dofPerNode + 1],
            theta: u[i * dofPerNode + 2],
        };
    });

    const stresses: FEAResult['stresses'] = {};
    let maxStress = 0;
    let maxDeflection = 0;

    elements.forEach(el => {
        const idxA = nodeIdx.get(el.nodeA)!;
        const idxB = nodeIdx.get(el.nodeB)!;
        const nodeA = nodes[idxA]!;
        const nodeB = nodes[idxB]!;

        const dx = nodeB.x - nodeA.x;
        const dy = nodeB.y - nodeA.y;
        const L = Math.sqrt(dx * dx + dy * dy);

        // Nodal displacements in global coordinates
        const uG = [
            u[idxA * dofPerNode + 0], u[idxA * dofPerNode + 1], u[idxA * dofPerNode + 2],
            u[idxB * dofPerNode + 0], u[idxB * dofPerNode + 1], u[idxB * dofPerNode + 2],
        ];

        // Transform global displacements to local displacements
        const c = dx / L;
        const s = dy / L;
        const T = [
            [c, s, 0, 0, 0, 0],
            [-s, c, 0, 0, 0, 0],
            [0, 0, 1, 0, 0, 0],
            [0, 0, 0, c, s, 0],
            [0, 0, 0, -s, c, 0],
            [0, 0, 0, 0, 0, 1]
        ];

        const uL = new Float64Array(6);
        for (let r = 0; r < 6; r++) {
            let sum = 0;
            for (let k = 0; k < 6; k++) {
                sum += T[r][k] * uG[k];
            }
            uL[r] = sum;
        }

        // Stress formula: Axial stress + Bending stress
        // Axial force = E * A / L * (uL[3] - uL[0])
        // Max Bending Moment = max( M_A, M_B )
        // M_A = E * I / L * (4 * uL[2] + 2 * uL[5] + 6/L * (uL[1] - uL[4]))
        const axialForce = (E * el.area / L) * (uL[3] - uL[0]);
        const axialStress = axialForce / el.area;

        // Bending moment calculations at ends
        const m1 = (E * el.inertia / L) * (4 * uL[2] + 2 * uL[5] - (6 / L) * uL[1] + (6 / L) * uL[4]);
        const m2 = (E * el.inertia / L) * (2 * uL[2] + 4 * uL[5] - (6 / L) * uL[1] + (6 / L) * uL[4]);

        const maxMoment = Math.max(Math.abs(m1), Math.abs(m2));
        const sectionModulus = el.inertia / (20); // assumption: thickness/2 = 20mm
        const bendingStress = maxMoment / sectionModulus;

        const totalStress = Math.abs(axialStress) + bendingStress;
        stresses[el.id] = totalStress;

        if (totalStress > maxStress) maxStress = totalStress;

        // Calculate max deflection in this element
        const deflectionA = Math.sqrt(uG[0] * uG[0] + uG[1] * uG[1]);
        const deflectionB = Math.sqrt(uG[3] * uG[3] + uG[4] * uG[4]);
        const maxNodeDeflection = Math.max(deflectionA, deflectionB);
        if (maxNodeDeflection > maxDeflection) maxDeflection = maxNodeDeflection;
    });

    return {
        displacements,
        stresses,
        maxStress,
        maxDeflection,
    };
}

/**
 * Standard Gaussian elimination solver for linear systems.
 */
function solveLinearSystem(A: Float64Array[], B: Float64Array): Float64Array {
    const n = B.length;

    for (let i = 0; i < n; i++) {
        // Search for maximum in this column for pivoting
        let maxEl = Math.abs(A[i][i]);
        let maxRow = i;
        for (let k = i + 1; k < n; k++) {
            if (Math.abs(A[k][i]) > maxEl) {
                maxEl = Math.abs(A[k][i]);
                maxRow = k;
            }
        }

        // Swap maximum row with current row
        const tempRow = A[maxRow];
        A[maxRow] = A[i];
        A[i] = tempRow;

        const tempVal = B[maxRow];
        B[maxRow] = B[i];
        B[i] = tempVal;

        // Make all rows below this one 0 in current column
        for (let k = i + 1; k < n; k++) {
            const c = -A[k][i] / A[i][i];
            for (let j = i; j < n; j++) {
                if (i === j) {
                    A[k][j] = 0;
                } else {
                    A[k][j] += c * A[i][j];
                }
            }
            B[k] += c * B[i];
        }
    }

    // Back substitution
    const x = new Float64Array(n);
    for (let i = n - 1; i >= 0; i--) {
        x[i] = B[i] / A[i][i];
        for (let k = i - 1; k >= 0; k--) {
            B[k] -= A[k][i] * x[i];
        }
    }

    return x;
}
