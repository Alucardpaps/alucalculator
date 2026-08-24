export type BeamType = 'simply-supported' | 'cantilever' | 'overhanging';

export type LoadType = 'point' | 'distributed' | 'moment';

export interface Load {
    id: string;
    type: LoadType;
    magnitude: number; // Point: N (downward positive), Dist: N/m (downward positive), Moment: Nm (clockwise positive)
    position: number;  // m from left end
    length?: number;   // m, for distributed loads only
}

export interface FEAInput {
    length: number;    // m
    supports: [number, number]; // positions of two supports (m). For cantilever, standard is [0, 0] (fixed at 0)
    type: BeamType;
    loads: Load[];
    E: number;         // Young's Modulus (Pa)
    I: number;         // Moment of Inertia (m^4)
}

export interface FEAResult {
    x: number[];       // positions (m)
    V: number[];       // Shear force (N)
    M: number[];       // Bending moment (Nm)
    y: number[];       // Deflection (m)
    R1: number;        // Reaction 1 (N, upward positive)
    R2: number;        // Reaction 2 (N, upward positive)
    MR: number;        // Reaction Moment (Nm, counter-clockwise positive) - for cantilever
    maxV: number;
    maxM: number;
    maxY: number;
}

export function solveBeam(input: FEAInput, resolution: number = 500): FEAResult {
    const { length, supports, type, loads, E, I } = input;
    const [sup1, sup2] = supports;

    // 1. Calculate Reactions
    let R1 = 0;
    let R2 = 0;
    let MR = 0;

    // Sum of forces (downward positive for loads, upward positive for reactions)
    // Sum F = 0 => R1 + R2 = sum(loads)
    let totalForce = 0;
    loads.forEach(load => {
        if (load.type === 'point') totalForce += load.magnitude;
        else if (load.type === 'distributed') totalForce += load.magnitude * (load.length || 0);
    });

    // Sum of moments about sup1 (clockwise positive)
    // Sum M_sup1 = 0 => sum(M_loads) - R2 * (sup2 - sup1) - MR = 0
    let totalMomentAboutSup1 = 0;
    loads.forEach(load => {
        if (load.type === 'point') {
            totalMomentAboutSup1 += load.magnitude * (load.position - sup1);
        } else if (load.type === 'distributed') {
            const center = load.position + (load.length || 0) / 2;
            totalMomentAboutSup1 += load.magnitude * (load.length || 0) * (center - sup1);
        } else if (load.type === 'moment') {
            totalMomentAboutSup1 += load.magnitude;
        }
    });

    if (type === 'cantilever') {
        // Assume fixed at sup1 (which should be 0)
        R1 = totalForce;
        R2 = 0;
        MR = totalMomentAboutSup1; // Reaction moment at the wall to resist applied moments
    } else {
        // Simply supported or overhanging
        if (Math.abs(sup2 - sup1) > 1e-6) {
            R2 = totalMomentAboutSup1 / (sup2 - sup1);
            R1 = totalForce - R2;
        } else {
            // Degenerate case, shouldn't happen if UI validates, but safely handle
            R1 = totalForce;
            R2 = 0;
        }
    }

    // 2. Numerical Integration Arrays
    const dx = length / resolution;
    const x: number[] = [];
    const V: number[] = [];
    const M: number[] = [];

    // Internal arrays for numerical integration
    const M_ei: number[] = [];

    for (let i = 0; i <= resolution; i++) {
        const xi = i * dx;
        x.push(xi);

        // Calculate Shear (V)
        // V(x) = sum(Reactions to left) - sum(Loads to left)
        let Vi = 0;

        // Reactions
        if (xi >= sup1) Vi += R1;
        if (xi >= sup2 && type !== 'cantilever') Vi += R2;

        // Loads
        loads.forEach(load => {
            if (load.type === 'point') {
                if (xi >= load.position) Vi -= load.magnitude;
            } else if (load.type === 'distributed') {
                if (xi > load.position) {
                    const loadedLength = Math.min(xi - load.position, load.length || 0);
                    Vi -= load.magnitude * loadedLength;
                }
            }
        });
        V.push(Vi);

        // Calculate Bending Moment (M)
        // M(x) = sum(Moment of reactions to left) - sum(Moment of loads to left) - sum(Applied moments to left)
        let Mi = 0;

        // Reactions
        if (xi >= sup1) Mi += R1 * (xi - sup1);
        if (xi >= sup2 && type !== 'cantilever') Mi += R2 * (xi - sup2);
        if (type === 'cantilever' && xi >= sup1) Mi += MR;

        // Loads
        loads.forEach(load => {
            if (load.type === 'point') {
                if (xi >= load.position) Mi -= load.magnitude * (xi - load.position);
            } else if (load.type === 'distributed') {
                if (xi > load.position) {
                    const loadedLength = Math.min(xi - load.position, load.length || 0);
                    const centroidDist = xi - (load.position + loadedLength / 2);
                    Mi -= load.magnitude * loadedLength * centroidDist;
                }
            } else if (load.type === 'moment') {
                if (xi >= load.position) Mi -= load.magnitude; // Clockwise moment applied -> negative internal Bending Moment
            }
        });
        M.push(Mi);
        M_ei.push(Mi / (E * I));
    }

    // 3. Calculate Deflection by double integration of M/(EI)
    // E * I * y'' = M
    // Integrate once for slope (theta), twice for deflection (y)

    const theta_rel: number[] = [0];
    const y_rel: number[] = [0];

    // Trapezoidal rule for integration
    for (let i = 1; i <= resolution; i++) {
        const dTheta = 0.5 * (M_ei[i] + M_ei[i - 1]) * dx;
        theta_rel.push(theta_rel[i - 1] + dTheta);
    }

    for (let i = 1; i <= resolution; i++) {
        const dy = 0.5 * (theta_rel[i] + theta_rel[i - 1]) * dx;
        y_rel.push(y_rel[i - 1] + dy);
    }

    // Apply boundary conditions to find integration constants C1 and C2
    // y_true(x) = y_rel(x) + C1 * x + C2
    let C1 = 0;
    let C2 = 0;

    if (type === 'cantilever') {
        // Fixed at sup1 (assume x=0 for simplicity, or exactly at sup1)
        // y(sup1) = 0, theta(sup1) = 0
        const idx = Math.max(0, Math.min(resolution, Math.round(sup1 / dx)));
        // theta_true = theta_rel + C1 => C1 = -theta_rel[idx]
        C1 = -theta_rel[idx];
        // y_true = y_rel + C1*x + C2 => C2 = -y_rel[idx] - C1*x[idx]
        C2 = -y_rel[idx] - C1 * x[idx];
    } else {
        // Simply supported or overhanging
        // y(sup1) = 0, y(sup2) = 0
        const idx1 = Math.max(0, Math.min(resolution, Math.round(sup1 / dx)));
        const idx2 = Math.max(0, Math.min(resolution, Math.round(sup2 / dx)));

        // y_rel1 + C1*x1 + C2 = 0
        // y_rel2 + C1*x2 + C2 = 0
        // C1*(x2 - x1) = y_rel1 - y_rel2 => C1 = (y_rel1 - y_rel2) / (x2 - x1)
        if (Math.abs(x[idx2] - x[idx1]) > 1e-6) {
            C1 = (y_rel[idx1] - y_rel[idx2]) / (x[idx2] - x[idx1]);
            C2 = -y_rel[idx1] - C1 * x[idx1];
        }
    }

    // Final True Deflection
    const y: number[] = [];
    let maxY = 0;
    let maxV = 0;
    let maxM = 0;

    for (let i = 0; i <= resolution; i++) {
        const y_true = y_rel[i] + C1 * x[i] + C2;
        y.push(y_true);

        if (Math.abs(y_true) > Math.abs(maxY)) maxY = y_true;
        if (Math.abs(V[i]) > Math.abs(maxV)) maxV = V[i];
        if (Math.abs(M[i]) > Math.abs(maxM)) maxM = M[i];
    }

    return {
        x,
        V,
        M,
        y,
        R1,
        R2,
        MR,
        maxV,
        maxM,
        maxY
    };
}
