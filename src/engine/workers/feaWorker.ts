/**
 * engine/workers/feaWorker.ts
 *
 * Production 3D Truss Finite Element Analysis solver.
 * Runs inside a WebWorker to avoid blocking the UDA UI thread.
 *
 * Architecture:
 *   Main Thread → postMessage(FeaRequest) → Worker solves K·U=F → postMessage(FeaResponse)
 *
 * Solver pipeline:
 *   1. Parse flat typed-array buffers into node/element/force data
 *   2. For each element compute direction cosines (l,m,n), length L, and
 *      scatter the 6×6 element stiffness matrix (AE/L)·[T]ᵀ·[k_local]·[T] into K
 *   3. Apply boundary conditions via penalty method (K_ii *= 1e20, F_i = 0)
 *   4. Solve the symmetric positive-definite system K·U = F using
 *      Gaussian elimination with partial pivoting
 *   5. Back-compute per-element axial stress σ = (E/L)·(l·Δu + m·Δv + n·Δw)
 *   6. Transfer result buffers back with zero-copy semantics
 *
 * Constraints:
 *   - No DOM / React / window imports (pure math)
 *   - Pre-allocated typed arrays, zero heap pressure in hot loops
 */

export {};

// eslint-disable-next-line no-restricted-globals
const ctx: Worker = self as any;

// ─────────────────────────────────────────────
// MESSAGE SCHEMAS
// ─────────────────────────────────────────────

interface FeaRequest {
    type: 'SOLVE_STATIC';
    /** Flat [x0,y0,z0, x1,y1,z1, …] — 3·N floats */
    nodes: Float32Array;
    /** Flat [startIdx0,endIdx0, startIdx1,endIdx1, …] — 2·E ints */
    elements: Int32Array;
    /** Flat [fx0,fy0,fz0, fx1,fy1,fz1, …] — 3·N floats */
    forces: Float32Array;
    /** DOF indices that are fully restrained (optional) */
    fixedDofs?: Int32Array;
    /** Young's modulus per element (MPa). Falls back to 70000 (Al 6061) */
    elasticModulus?: Float32Array;
    /** Cross-section area per element (mm²). Falls back to 100 */
    crossSectionArea?: Float32Array;
}

interface FeaResponse {
    type: 'SOLVE_COMPLETE';
    success: boolean;
    /** Flat [u0,v0,w0, u1,v1,w1, …] — 3·N floats */
    displacements: Float32Array;
    /** Axial stress per element (MPa) — E floats */
    stresses: Float32Array;
    /** Axial force per element (N) — E floats */
    axialForces: Float32Array;
    /** Safety metadata */
    maxDisplacement: number;
    maxStress: number;
    error?: string;
}

// ─────────────────────────────────────────────
// LINEAR ALGEBRA — DENSE SOLVER
// ─────────────────────────────────────────────

/**
 * Solve A·x = b in-place using Gaussian elimination with partial pivoting.
 * A is stored as a flat Float64Array of size n×n in row-major order.
 * b is a Float64Array of size n.
 * On return, b contains the solution vector x.
 *
 * @returns true if the system was solved successfully, false if singular.
 */
function gaussianElimination(A: Float64Array, b: Float64Array, n: number): boolean {
    // Forward elimination with partial pivoting
    for (let col = 0; col < n; col++) {
        // Find pivot row
        let maxVal = Math.abs(A[col * n + col]);
        let pivotRow = col;

        for (let row = col + 1; row < n; row++) {
            const absVal = Math.abs(A[row * n + col]);
            if (absVal > maxVal) {
                maxVal = absVal;
                pivotRow = row;
            }
        }

        // Check for singular matrix
        if (maxVal < 1e-30) {
            return false;
        }

        // Swap rows if needed
        if (pivotRow !== col) {
            // Swap row data in A
            for (let j = col; j < n; j++) {
                const tmp = A[col * n + j];
                A[col * n + j] = A[pivotRow * n + j];
                A[pivotRow * n + j] = tmp;
            }
            // Swap in b
            const tmpB = b[col];
            b[col] = b[pivotRow];
            b[pivotRow] = tmpB;
        }

        // Eliminate below pivot
        const pivotVal = A[col * n + col];
        for (let row = col + 1; row < n; row++) {
            const factor = A[row * n + col] / pivotVal;
            A[row * n + col] = 0; // Exact zero

            for (let j = col + 1; j < n; j++) {
                A[row * n + j] -= factor * A[col * n + j];
            }
            b[row] -= factor * b[col];
        }
    }

    // Back substitution
    for (let row = n - 1; row >= 0; row--) {
        let sum = b[row];
        for (let j = row + 1; j < n; j++) {
            sum -= A[row * n + j] * b[j];
        }
        const diag = A[row * n + row];
        if (Math.abs(diag) < 1e-30) {
            return false;
        }
        b[row] = sum / diag;
    }

    return true;
}

// ─────────────────────────────────────────────
// FEA SOLVER CORE
// ─────────────────────────────────────────────

function solveStaticTruss(request: FeaRequest): FeaResponse {
    const { nodes, elements, forces } = request;

    const numNodes = nodes.length / 3;
    const numElements = elements.length / 2;
    const numDofs = numNodes * 3;

    // Guard: degenerate inputs
    if (numNodes < 2 || numElements < 1) {
        const empty = new Float32Array(0);
        return {
            type: 'SOLVE_COMPLETE',
            success: false,
            displacements: new Float32Array(numNodes * 3),
            stresses: empty,
            axialForces: empty,
            maxDisplacement: 0,
            maxStress: 0,
            error: `Insufficient mesh: ${numNodes} nodes, ${numElements} elements.`
        };
    }

    // ── 1. Allocate global stiffness matrix K (dense, row-major) ──
    //    Using Float64 for numerical precision in the solver.
    const K = new Float64Array(numDofs * numDofs); // Initialized to zero
    const F = new Float64Array(numDofs);

    // Copy forces into F (Float32 → Float64)
    for (let i = 0; i < numDofs; i++) {
        F[i] = i < forces.length ? forces[i] : 0;
    }

    // ── 2. Element loop: compute & scatter stiffness ──
    //    Pre-allocate the 6×6 element stiffness scratch buffer
    const ke = new Float64Array(36); // 6×6 flat

    // DOF index scratch (avoid allocation per element)
    const dofMap = new Int32Array(6);

    for (let e = 0; e < numElements; e++) {
        const i = elements[e * 2];     // Start node index
        const j = elements[e * 2 + 1]; // End node index

        // Node coordinates
        const x1 = nodes[i * 3];
        const y1 = nodes[i * 3 + 1];
        const z1 = nodes[i * 3 + 2];
        const x2 = nodes[j * 3];
        const y2 = nodes[j * 3 + 1];
        const z2 = nodes[j * 3 + 2];

        // Element geometry
        const dx = x2 - x1;
        const dy = y2 - y1;
        const dz = z2 - z1;
        const L = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (L < 1e-12) continue; // Degenerate element, skip

        // Direction cosines
        const l = dx / L;
        const m = dy / L;
        const n = dz / L;

        // Material properties (per-element or default)
        const E = request.elasticModulus ? request.elasticModulus[e] : 70_000; // MPa (Al 6061)
        const A = request.crossSectionArea ? request.crossSectionArea[e] : 100; // mm²

        const coeff = (A * E) / L;

        // Build 6×6 element stiffness matrix in global coordinates:
        //
        //        [ l²   lm   ln  -l²  -lm  -ln ]
        //        [ lm   m²   mn  -lm  -m²  -mn ]
        // ke = c·[ ln   mn   n²  -ln  -mn  -n² ]
        //        [-l²  -lm  -ln   l²   lm   ln ]
        //        [-lm  -m²  -mn   lm   m²   mn ]
        //        [-ln  -mn  -n²   ln   mn   n² ]
        //
        // where c = AE/L

        const ll = l * l, mm = m * m, nn = n * n;
        const lm = l * m, ln = l * n, mn = m * n;

        // Upper-left 3×3 quadrant (positive)
        ke[0] = coeff * ll;  ke[1] = coeff * lm;  ke[2] = coeff * ln;
        ke[6] = coeff * lm;  ke[7] = coeff * mm;  ke[8] = coeff * mn;
        ke[12] = coeff * ln; ke[13] = coeff * mn;  ke[14] = coeff * nn;

        // Upper-right 3×3 quadrant (negative)
        ke[3] = -coeff * ll;  ke[4] = -coeff * lm;  ke[5] = -coeff * ln;
        ke[9] = -coeff * lm;  ke[10] = -coeff * mm;  ke[11] = -coeff * mn;
        ke[15] = -coeff * ln; ke[16] = -coeff * mn;  ke[17] = -coeff * nn;

        // Lower-left 3×3 quadrant (negative) — mirror of upper-right
        ke[18] = -coeff * ll;  ke[19] = -coeff * lm;  ke[20] = -coeff * ln;
        ke[24] = -coeff * lm;  ke[25] = -coeff * mm;  ke[26] = -coeff * mn;
        ke[30] = -coeff * ln;  ke[31] = -coeff * mn;  ke[32] = -coeff * nn;

        // Lower-right 3×3 quadrant (positive) — same as upper-left
        ke[21] = coeff * ll;  ke[22] = coeff * lm;  ke[23] = coeff * ln;
        ke[27] = coeff * lm;  ke[28] = coeff * mm;  ke[29] = coeff * mn;
        ke[33] = coeff * ln;  ke[34] = coeff * mn;  ke[35] = coeff * nn;

        // DOF mapping: node i → [3i, 3i+1, 3i+2], node j → [3j, 3j+1, 3j+2]
        dofMap[0] = i * 3;
        dofMap[1] = i * 3 + 1;
        dofMap[2] = i * 3 + 2;
        dofMap[3] = j * 3;
        dofMap[4] = j * 3 + 1;
        dofMap[5] = j * 3 + 2;

        // Scatter into global K
        for (let r = 0; r < 6; r++) {
            const globalRow = dofMap[r];
            for (let c = 0; c < 6; c++) {
                const globalCol = dofMap[c];
                K[globalRow * numDofs + globalCol] += ke[r * 6 + c];
            }
        }
    }

    // ── 3. Apply boundary conditions (penalty method) ──
    //    For each fixed DOF: K[i][i] *= 1e20, F[i] = 0
    //    This preserves matrix symmetry and avoids row/col removal.

    const PENALTY = 1e20;

    if (request.fixedDofs && request.fixedDofs.length > 0) {
        for (let k = 0; k < request.fixedDofs.length; k++) {
            const dof = request.fixedDofs[k];
            if (dof >= 0 && dof < numDofs) {
                K[dof * numDofs + dof] *= PENALTY;
                F[dof] = 0;
            }
        }
    } else {
        // Heuristic fallback: if no fixedDofs provided, fix the first node (all 3 DOFs).
        // This prevents a singular system for simple test cases.
        for (let d = 0; d < 3; d++) {
            K[d * numDofs + d] *= PENALTY;
            F[d] = 0;
        }
    }

    // ── 4. Solve K·U = F ──
    const solved = gaussianElimination(K, F, numDofs);
    // After solving, F now contains the displacement vector U

    if (!solved) {
        return {
            type: 'SOLVE_COMPLETE',
            success: false,
            displacements: new Float32Array(numDofs),
            stresses: new Float32Array(numElements),
            axialForces: new Float32Array(numElements),
            maxDisplacement: 0,
            maxStress: 0,
            error: 'Singular stiffness matrix — check boundary conditions and connectivity.'
        };
    }

    // ── 5. Post-process: element stresses & axial forces ──
    const displacements = new Float32Array(numDofs);
    let maxDisplacement = 0;

    for (let d = 0; d < numDofs; d++) {
        const val = F[d]; // F now holds U after solve
        displacements[d] = val;

        // Track max displacement magnitude per node (every 3 DOFs)
        if (d % 3 === 2) {
            const u = displacements[d - 2];
            const v = displacements[d - 1];
            const w = displacements[d];
            const mag = Math.sqrt(u * u + v * v + w * w);
            if (mag > maxDisplacement) maxDisplacement = mag;
        }
    }

    const stresses = new Float32Array(numElements);
    const axialForces = new Float32Array(numElements);
    let maxStress = 0;

    for (let e = 0; e < numElements; e++) {
        const i = elements[e * 2];
        const j = elements[e * 2 + 1];

        const x1 = nodes[i * 3];
        const y1 = nodes[i * 3 + 1];
        const z1 = nodes[i * 3 + 2];
        const x2 = nodes[j * 3];
        const y2 = nodes[j * 3 + 1];
        const z2 = nodes[j * 3 + 2];

        const dx = x2 - x1;
        const dy = y2 - y1;
        const dz = z2 - z1;
        const L = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (L < 1e-12) {
            stresses[e] = 0;
            axialForces[e] = 0;
            continue;
        }

        const l = dx / L;
        const m = dy / L;
        const n = dz / L;

        const E = request.elasticModulus ? request.elasticModulus[e] : 70_000;
        const A = request.crossSectionArea ? request.crossSectionArea[e] : 100;

        // Displacement differences
        const du = displacements[j * 3]     - displacements[i * 3];
        const dv = displacements[j * 3 + 1] - displacements[i * 3 + 1];
        const dw = displacements[j * 3 + 2] - displacements[i * 3 + 2];

        // Axial deformation along element axis
        const deltaL = l * du + m * dv + n * dw;

        // Axial strain
        const strain = deltaL / L;

        // Axial stress (Hooke's law)
        const sigma = E * strain;
        stresses[e] = sigma;

        // Axial force
        axialForces[e] = sigma * A;

        const absSigma = Math.abs(sigma);
        if (absSigma > maxStress) maxStress = absSigma;
    }

    return {
        type: 'SOLVE_COMPLETE',
        success: true,
        displacements,
        stresses,
        axialForces,
        maxDisplacement,
        maxStress
    };
}

// ─────────────────────────────────────────────
// WORKER MESSAGE HANDLER
// ─────────────────────────────────────────────

ctx.addEventListener('message', (event: MessageEvent<FeaRequest>) => {
    const request = event.data;

    if (request.type === 'SOLVE_STATIC') {
        console.log(
            `[FEA Worker] Received mesh: ${request.nodes.length / 3} nodes, ` +
            `${request.elements.length / 2} elements. Solving…`
        );

        const t0 = performance.now();
        const result = solveStaticTruss(request);
        const elapsed = performance.now() - t0;

        console.log(
            `[FEA Worker] ${result.success ? 'SOLVED' : 'FAILED'} in ${elapsed.toFixed(1)} ms. ` +
            `Max displacement: ${result.maxDisplacement.toFixed(4)} mm, ` +
            `Max stress: ${result.maxStress.toFixed(2)} MPa`
        );

        // Transfer buffers back for zero-copy performance
        ctx.postMessage(result, [
            result.displacements.buffer,
            result.stresses.buffer,
            result.axialForces.buffer
        ]);
    }
});
