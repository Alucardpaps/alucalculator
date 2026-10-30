/**
 * EN 1993-1-8 fillet weld — simplified (§4.5.3.3) and directional (§4.5.3.2).
 * Stresses in MPa, forces in N, lengths in mm. Pure functions.
 */

export type WeldLoadDir = 'parallel' | 'transverse' | 'combined';

export function betaWFromFy(fy: number): number {
    if (fy <= 235) return 0.8;
    if (fy <= 275) return 0.85;
    if (fy <= 355) return 0.9;
    return 1.0;
}

/** Equal-leg 90° fillet throat a = z / √2. */
export function filletThroatMm(z: number): number {
    return z / Math.SQRT2;
}

/**
 * Throat stresses for a 90° equal-leg fillet (EN 1993-1-8 Fig. 4.5).
 * Transverse force is resolved on the 45° throat: σ⊥ = τ⊥ = F⊥ / (Aw √2).
 * Parallel force is pure throat shear: τ∥ = F∥ / Aw.
 */
export function filletThroatStresses(input: {
    F_parallel: number;
    F_transverse: number;
    a: number;
    L: number;
    n: number;
}): { Aw: number; sigma_perp: number; tau_perp: number; tau_par: number } {
    const Aw = input.a * input.L * input.n;
    if (!(Aw > 0)) {
        return { Aw: 0, sigma_perp: 0, tau_perp: 0, tau_par: 0 };
    }
    return {
        Aw,
        sigma_perp: input.F_transverse / (Aw * Math.SQRT2),
        tau_perp: input.F_transverse / (Aw * Math.SQRT2),
        tau_par: input.F_parallel / Aw,
    };
}

/**
 * EN 1993-1-8 §4.5.3.2:
 *   √(σ⊥² + 3(τ⊥² + τ∥²))  ≤  fu / (βw γM2)
 *   σ⊥                     ≤  0.9 fu / γM2
 */
export function directionalFilletCheck(input: {
    sigma_perp: number;
    tau_perp: number;
    tau_par: number;
    fu: number;
    beta_w: number;
    gamma_M2: number;
}): {
    sigma_w: number;
    fw: number;
    sigma_perp_lim: number;
    U_vm: number;
    U_perp: number;
    U: number;
} {
    const fw = input.fu / (input.beta_w * input.gamma_M2);
    const sigma_perp_lim = (0.9 * input.fu) / input.gamma_M2;
    const sigma_w = Math.sqrt(
        input.sigma_perp * input.sigma_perp + 3 * (input.tau_perp * input.tau_perp + input.tau_par * input.tau_par)
    );
    const U_vm = fw > 0 ? sigma_w / fw : 0;
    const U_perp = sigma_perp_lim > 0 ? Math.abs(input.sigma_perp) / sigma_perp_lim : 0;
    return {
        sigma_w,
        fw,
        sigma_perp_lim,
        U_vm,
        U_perp,
        U: Math.max(U_vm, U_perp),
    };
}

/** Simplified method: Fw,Rd = fu / (√3 βw γM2) · Aw  (longitudinal shear). */
export function simplifiedFilletFwRd(Aw: number, fu: number, beta_w: number, gamma_M2: number): number {
    const fw = fu / (Math.sqrt(3) * beta_w * gamma_M2);
    return fw * Aw;
}
