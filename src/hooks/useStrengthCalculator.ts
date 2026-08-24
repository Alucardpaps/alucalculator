import { useState, useMemo } from 'react';

const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

export const useStrengthCalculator = () => {
    // Inputs (MPa and Degrees)
    const [sigmaX, setSigmaX] = useState(50);
    const [sigmaY, setSigmaY] = useState(10);
    const [tauXY, setTauXY] = useState(20);
    const [theta, setTheta] = useState(0); // Transformation angle

    const results = useMemo(() => {
        // 1. Center and Radius of Mohr's Circle
        const center = (sigmaX + sigmaY) / 2;
        const radius = Math.sqrt(Math.pow((sigmaX - sigmaY) / 2, 2) + Math.pow(tauXY, 2));

        // 2. Principal Stresses
        const sigma1 = center + radius;
        const sigma2 = center - radius;
        const maxShear = radius;

        // 3. Principal Angle (Theta P)
        // tan(2*thetaP) = 2*tauXY / (sigmaX - sigmaY)
        const thetaP_rad = 0.5 * Math.atan2(2 * tauXY, sigmaX - sigmaY);
        const thetaP = toDeg(thetaP_rad);

        // 4. Von Mises (Plane Stress)
        // sigma_vm = sqrt(s1^2 - s1*s2 + s2^2)
        const vonMises = Math.sqrt(Math.pow(sigma1, 2) - sigma1 * sigma2 + Math.pow(sigma2, 2));

        // 5. Transformed Stresses at angle Theta
        const rTheta = toRad(theta);
        const sigmaX_new = center + ((sigmaX - sigmaY) / 2) * Math.cos(2 * rTheta) + tauXY * Math.sin(2 * rTheta);
        const sigmaY_new = center - ((sigmaX - sigmaY) / 2) * Math.cos(2 * rTheta) - tauXY * Math.sin(2 * rTheta);
        const tauXY_new = -((sigmaX - sigmaY) / 2) * Math.sin(2 * rTheta) + tauXY * Math.cos(2 * rTheta);

        return {
            center,
            radius,
            sigma1,
            sigma2,
            maxShear,
            thetaP,
            vonMises,
            sigmaX_new,
            sigmaY_new,
            tauXY_new
        };
    }, [sigmaX, sigmaY, tauXY, theta]);

    return {
        sigmaX, setSigmaX,
        sigmaY, setSigmaY,
        tauXY, setTauXY,
        theta, setTheta,
        results
    };
};
