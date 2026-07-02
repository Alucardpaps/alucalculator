export interface ShrinkFitInputs {
    nominalDia: number; // mm
    hubOuterDia: number; // mm
    length: number; // mm
    interference: number; // diametral interference in mm
    eHub: number; // MPa
    eShaft: number; // MPa
    vHub: number; // Poisson ratio
    vShaft: number; // Poisson ratio
    mu: number; // Friction coefficient
}

export interface ShrinkFitResults {
    contactPressure: number; // MPa
    transmissibleTorque: number; // N.m
    transmissibleAxialForce: number; // N
    hubHoopStressInner: number; // MPa (Max tensile stress on hub)
    shaftRadialStress: number; // MPa (Compressive stress on shaft)
}

export function calculateShrinkFit(inputs: ShrinkFitInputs): ShrinkFitResults {
    const { nominalDia: d, hubOuterDia: Do, length: L, interference: delta, eHub, eShaft, vHub, vShaft, mu } = inputs;
    
    // If there is no interference or negative interference (clearance), pressure is 0
    if (delta <= 0) {
        return {
            contactPressure: 0,
            transmissibleTorque: 0,
            transmissibleAxialForce: 0,
            hubHoopStressInner: 0,
            shaftRadialStress: 0
        };
    }

    // Contact Pressure p (MPa)
    // Formula for solid shaft (di = 0)
    // p = delta / [ d * ( (1/Eh) * ((Do^2 + d^2)/(Do^2 - d^2) + vh) + (1-vs)/Es ) ]
    
    const hubTerm1 = (Math.pow(Do, 2) + Math.pow(d, 2)) / (Math.pow(Do, 2) - Math.pow(d, 2));
    const hubPart = (1 / eHub) * (hubTerm1 + vHub);
    const shaftPart = (1 - vShaft) / eShaft;
    
    const p = delta / (d * (hubPart + shaftPart));

    // Transmissible Force (Axial) in N
    // F = p * A * mu = p * (pi * d * L) * mu
    const fAxial = p * Math.PI * d * L * mu;

    // Transmissible Torque in N.m
    // T = F * (d/2) / 1000 (to convert mm to m)
    const torque = fAxial * (d / 2) / 1000;

    // Hub Max Hoop Stress (Inner surface) - Tensile
    // sigma_t = p * (Do^2 + d^2) / (Do^2 - d^2)
    const hubHoopStressInner = p * hubTerm1;

    // Shaft Radial Stress - Compressive
    // sigma_r = -p
    const shaftRadialStress = -p;

    return {
        contactPressure: p,
        transmissibleTorque: torque,
        transmissibleAxialForce: fAxial,
        hubHoopStressInner,
        shaftRadialStress
    };
}
