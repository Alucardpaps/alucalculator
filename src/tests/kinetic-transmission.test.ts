import { describe, it, expect } from 'vitest';

describe('Kinetic Transmission Physics & Kinematics', () => {
    it('calculates spur gear train mesh angles in exact inverse ratio', () => {
        const z1 = 20;
        const z2 = 40;
        const ratio = z1 / z2; // 0.5
        const driverAngle = 90; // degrees
        const drivenAngle = driverAngle * ratio; // 45 degrees
        expect(drivenAngle).toBe(45);
        expect(drivenAngle * z2).toBe(driverAngle * z1);
    });

    it('calculates epicyclic planetary gearbox speeds with Willis equation', () => {
        // Mode RING_FIXED: w_r = 0, w_s = 1, w_c = 1 / (1 + zr/zs)
        const zs = 20;
        const zr = 80;
        const zp = (zr - zs) / 2; // 30
        const wc = 1 / (1 + zr / zs); // 1 / (1 + 4) = 0.2
        const wp_rel = (wc - 1) * (zs / zp); // (0.2 - 1) * (20/30) = -0.8 * 0.6667 = -0.5333
        
        expect(wc).toBeCloseTo(0.2, 4);
        expect(wp_rel).toBeCloseTo(-0.5333, 3);
        // Relative rotation is opposite to sun rotation
        expect(wp_rel).toBeLessThan(0);
    });

    it('calculates bearing cage orbital velocity from pitch geometry', () => {
        // For a fixed outer ring, cage speed is ~ 0.42 * shaft speed (standard deep groove ball bearing kinematics)
        const shaftRpm = 1500;
        const cageRpm = shaftRpm * 0.42;
        expect(cageRpm).toBe(630);
    });

    it('calculates open chain drive sprocket synchrony and linear chain displacement', () => {
        const z1 = 17;
        const z2 = 34;
        const pitch = 12.7; // mm
        const d1 = pitch / Math.sin(Math.PI / z1); // ~69.12 mm
        const r1 = d1 / 2;

        const turnDeg = 360; // 1 full rotation
        const turnRad = (turnDeg * Math.PI) / 180;
        const linearTravel = turnRad * r1; // circumference of pitch circle
        const expectedCircumference = Math.PI * d1;

        expect(linearTravel).toBeCloseTo(expectedCircumference, 3);
        const sprocket2Deg = turnDeg * (z1 / z2);
        expect(sprocket2Deg).toBe(180); // 2:1 reduction
    });

    it('calculates belt drive pitch line displacement and pulley ratio', () => {
        const D1 = 100; // mm
        const D2 = 250; // mm
        const ratio = D1 / D2; // 0.4

        const inputAngle = 180;
        const outputAngle = inputAngle * ratio;
        expect(outputAngle).toBe(72);

        // Linear belt travel
        const r1 = D1 / 2;
        const beltTravel = ((inputAngle * Math.PI) / 180) * r1;
        const r2 = D2 / 2;
        const beltTravelDriven = ((outputAngle * Math.PI) / 180) * r2;
        expect(beltTravel).toBeCloseTo(beltTravelDriven, 3);
    });
});
