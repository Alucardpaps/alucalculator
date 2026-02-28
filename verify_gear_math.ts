
const toRad = (deg: number) => deg * Math.PI / 180;
const inv = (angle: number) => Math.tan(angle) - angle;

const verify = () => {
    const gearModule = 5;
    const z1 = 43;
    const z2 = 40;
    const pressureAngle = 20;
    const beta = 0;
    const x1 = 1.0;
    const x2 = 0.1;

    console.log(`Inputs: m=${gearModule}, z1=${z1}, z2=${z2}, alpha=${pressureAngle}, x1=${x1}, x2=${x2}`);

    const alphaRad = toRad(pressureAngle);
    const betaRad = toRad(beta);
    const alpha_t_rad = Math.atan(Math.tan(alphaRad) / Math.cos(betaRad));

    console.log(`alpha_t (deg): ${alpha_t_rad * 180 / Math.PI}`);

    const mt = gearModule / Math.cos(betaRad);
    const d1 = z1 * mt;
    const d2 = z2 * mt;
    const a_standard = (d1 + d2) / 2;

    console.log(`Standard: d1=${d1}, d2=${d2}, a_std=${a_standard}`);

    const sumX = x1 + x2;
    const sumZ = z1 + z2;
    const inv_alpha_wt = (2 * Math.tan(alphaRad) * sumX / sumZ) + inv(alpha_t_rad);

    console.log(`inv_alpha_wt target: ${inv_alpha_wt}`);

    let alpha_wt = 0.35; // Initial guess
    for (let k = 0; k < 20; k++) {
        const f = inv(alpha_wt) - inv_alpha_wt;
        const df = Math.tan(alpha_wt) ** 2; // Derivative of inv(x) is tan^2(x)
        alpha_wt = alpha_wt - f / df;
    }

    console.log(`alpha_wt (deg): ${alpha_wt * 180 / Math.PI}`);

    const a_wt = Math.abs(sumX) < 1e-6
        ? a_standard
        : a_standard * Math.cos(alpha_t_rad) / Math.cos(alpha_wt);

    console.log(`Operating Center Distance (a_wt): ${a_wt}`);

    // Diameter Calculation Check
    const da1_simple = d1 + 2 * gearModule * (1 + x1);
    const da2_simple = d2 + 2 * gearModule * (1 + x2);

    console.log(`Tip Diameters (Simple): da1=${da1_simple}, da2=${da2_simple}`);

    // Check with topping?
    // y = (a_wt - a_std) / gearModule;
    // delta_y = sumX - y;
    // da1_topped = d1 + 2*gearModule * (1 + x1 - delta_y);

    const y = (a_wt - a_standard) / gearModule;
    const delta_y = sumX - y;

    console.log(`y (center dist coeff): ${y}`);
    console.log(`delta_y (compensation): ${delta_y}`);

    const da1_topped = d1 + 2 * gearModule * (1 + x1 - delta_y);
    const da2_topped = d2 + 2 * gearModule * (1 + x2 - delta_y);

    console.log(`Tip Diameters (Topped): da1=${da1_topped}, da2=${da2_topped}`);

    // Root
    const c_star = 0.25;
    const df1 = d1 - 2 * gearModule * (1 + c_star - x1);
    const df2 = d2 - 2 * gearModule * (1 + c_star - x2);

    console.log(`Root Diameters: df1=${df1}, df2=${df2}`);
}

verify();
