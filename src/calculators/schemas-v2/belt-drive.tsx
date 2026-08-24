
import type { CalculatorSchemaV2 } from '@/types/calculator-schema-v2';
import { createValidatedValue } from '@/types/engineering';
import { BeltDriveBlueprint } from '@/components/visualizers/BeltDriveBlueprint';
import { BELT_DRIVE_TYPES, BELT_PROFILES, resolveBeltProfile, pitchDiameterFromTeeth, gold2_14mCatalogKw, timingOutsideDiameterMm, timingPldForProfile, type BeltDriveKind } from '@/data/mechanical/driveTypes';
import {
    openBeltPitchLengthMm,
    snapTimingBeltCatalog,
} from '@/components/visualizers/techframe-utils';

const beltDriveSchema: CalculatorSchemaV2 = {
    id: 'belt-drive',
    metadata: {
        title: 'Belt Drive Calculator',
        description: 'Calculate speeds, belt length, and tension for open belt drives.',
        category: 'mechanical',
        version: '1.0.0',
        author: 'AluCalc Engineering',
        lastUpdated: '2026-02-25',
        tags: ['belt', 'pulley', 'transmission', 'machine-elements'],
        verifiedStandards: ['ISO 5291', 'ISO 13050', 'Megadyne MEGASYNC / MEGAPOWER']
    },

    inputs: [
        {
            key: 'rpm1',
            label: 'Driver Speed (n1)',
            unit: 'RPM' as any,
            defaultValue: 1450,
            description: 'Rotational speed of the driving pulley.',
            validation: { required: true, min: 1 }
        },
        {
            key: 'd1',
            label: 'Driver Diameter (d1)',
            unit: 'mm',
            defaultValue: 100,
            description: 'Pitch diameter of the driving pulley.',
            validation: { required: true, min: 10 }
        },
        {
            key: 'd2',
            label: 'Driven Diameter (d2)',
            unit: 'mm',
            defaultValue: 250,
            description: 'Pitch diameter of the driven pulley.',
            validation: { required: true, min: 10 }
        },
        {
            key: 'z1',
            label: 'Driver Teeth (z1)',
            unit: '-',
            defaultValue: 30,
            description: 'Number of teeth on the driving pulley (timing belts).',
            validation: { required: true, min: 10 },
            group: 'geometry'
        },
        {
            key: 'z2',
            label: 'Driven Teeth (z2)',
            unit: '-',
            defaultValue: 60,
            description: 'Number of teeth on the driven pulley (timing belts).',
            validation: { required: true, min: 10 },
            group: 'geometry'
        },
        {
            key: 'centerDist',
            label: 'Center Distance (C)',
            unit: 'mm',
            defaultValue: 500,
            description: 'Distance between the centers of the two pulleys.',
            validation: { required: true, min: 100 }
        },
        {
            key: 'power',
            label: 'Power to Transmit (P)',
            unit: 'kW',
            defaultValue: 5,
            description: 'Design power for the transmission.',
            validation: { required: true, min: 0.1 }
        },
        {
            key: 'serviceFactor',
            label: 'Service Factor (Ks)',
            unit: '-',
            defaultValue: 1.25,
            description: 'Application factor for shock, duty cycle, and start frequency.',
            validation: { required: true, min: 1, max: 3, step: 0.05 },
            group: 'load'
        },
        {
            key: 'beltType',
            label: 'Belt Type',
            unit: '-',
            defaultValue: 'classical-v',
            options: [
                { label: BELT_DRIVE_TYPES.flat.label, value: 'flat' },
                { label: BELT_DRIVE_TYPES['classical-v'].label, value: 'classical-v' },
                { label: BELT_DRIVE_TYPES['narrow-v'].label, value: 'narrow-v' },
                { label: BELT_DRIVE_TYPES['cogged-v'].label, value: 'cogged-v' },
                { label: BELT_DRIVE_TYPES['poly-v'].label, value: 'poly-v' },
                { label: BELT_DRIVE_TYPES.timing.label, value: 'timing' }
            ],
            description: 'Select belt family; this changes slip model, velocity limit, and pretension estimate.',
            validation: { required: true }
        },
        {
            key: 'beltProfile',
            label: 'Belt Section / Profile',
            unit: '-',
            defaultValue: 'a',
            options: BELT_PROFILES.map((profile) => ({ label: profile.label, value: profile.id })),
            description: 'Production profile used for min pulley, speed, and required belt/rib count checks.',
            validation: { required: true },
            group: 'selection'
        },
        {
            key: 'friction',
            label: 'Friction Coefficient (μ)',
            unit: '-',
            defaultValue: 0.3,
            description: 'Friction between belt and pulley. Ignored for timing belts.',
            validation: { required: true, min: 0.1, max: 0.8 }
        }
    ],

    outputs: [
        {
            key: 'rpm2',
            label: 'Driven Speed (n2)',
            unit: 'RPM' as any,
            formulaLatex: 'n_2 = n_1 \\cdot \\frac{d_1}{d_2}',
            description: 'Rotational speed of the driven pulley.',
            precision: 0
        },
        {
            key: 'designPower',
            label: 'Design Power (Pd)',
            unit: 'kW',
            formulaLatex: 'P_d = P \\cdot K_s',
            description: 'Power after service factor.',
            precision: 2
        },
        {
            key: 'beltVelocity',
            label: 'Belt Velocity (v)',
            unit: 'm/s' as any,
            formulaLatex: 'v = \\frac{\\pi \\cdot d_1 \\cdot n_1}{60000}',
            description: 'Linear speed of the belt.',
            precision: 2
        },
        {
            key: 'beltLength',
            label: 'Catalog Belt Length (L)',
            unit: 'mm',
            formulaLatex: 'L = z_{belt} \\cdot p',
            description: 'Standard pitch length from integer belt tooth count (timing) or ISO 5291 geometry (friction belts).',
            precision: 1
        },
        {
            key: 'beltTeeth',
            label: 'Belt Teeth (z)',
            unit: '-',
            formulaLatex: 'z_{belt} = round(L_{theoretical} / p)',
            description: 'Integer tooth count — physical belts cannot have fractional teeth (ISO 13050).',
            precision: 0,
        },
        {
            key: 'catalogLength',
            label: 'Theoretical Length (Lth)',
            unit: 'mm',
            formulaLatex: 'L_{th} = 2C + \\frac{\\pi}{2}(d_1+d_2) + \\frac{(d_2-d_1)^2}{4C}',
            description: 'Continuous geometry length before integer tooth snap.',
            precision: 1,
        },
        {
            key: 'centerDistActual',
            label: 'Actual Center Distance (C)',
            unit: 'mm',
            formulaLatex: 'C_{actual} \\leftarrow L = z_{belt} \\cdot p',
            description: 'Back-solved shaft center distance for the standard integer-tooth belt length.',
            precision: 2,
        },
        {
            key: 'od1',
            label: 'Driver Outside Ø (Do1)',
            unit: 'mm',
            formulaLatex: 'D_o = d_p - 2a \\; (PLD)',
            description: 'Hobbing outside diameter: pitch diameter minus profile PLD (2a).',
            precision: 2,
        },
        {
            key: 'od2',
            label: 'Driven Outside Ø (Do2)',
            unit: 'mm',
            formulaLatex: 'D_o = d_p - 2a \\; (PLD)',
            description: 'Hobbing outside diameter for driven pulley.',
            precision: 2,
        },
        {
            key: 'arcOfContact',
            label: 'Arc of Contact (θ)',
            unit: 'deg' as any,
            formulaLatex: '\\theta = 180 - 2\\arcsin\\left(\\frac{d_2-d_1}{2C}\\right)',
            description: 'Wrap angle around the smaller pulley.',
            precision: 1
        },
        {
            key: 'tensionRatio',
            label: 'Tension Ratio (T1/T2)',
            unit: '-',
            formulaLatex: '\\frac{T_1}{T_2} = e^{\\mu \\theta / \\sin\\beta}',
            description: 'Friction-belt tension ratio. Timing belts report 0 because tooth engagement is the governing model.',
            precision: 2
        },
        {
            key: 'effectiveTension',
            label: 'Effective Tension (Te)',
            unit: 'N',
            formulaLatex: 'T_e = \\frac{P_d \\cdot 1000}{v}',
            description: 'Tight-minus-slack tension required to transmit design power.',
            precision: 1
        },
        {
            key: 'T2',
            label: 'Slack Side Tension (T2)',
            unit: 'N',
            formulaLatex: 'T_2 = \\frac{P \\cdot 1000}{v(T_1/T_2 - 1)}',
            description: 'Slack-side belt tension for the given power.',
            precision: 1
        },
        {
            key: 'T1',
            label: 'Tight Side Tension (T1)',
            unit: 'N',
            formulaLatex: 'T_1 = (T_1/T_2) \\cdot T_2',
            description: 'Tight-side belt tension for the given power.',
            precision: 1
        },
        {
            key: 'speedUtilization',
            label: 'Speed Limit Usage',
            unit: '%' as any,
            formulaLatex: '\\eta_v = v / v_{limit}',
            description: 'Belt speed as percentage of the selected belt family guideline limit.',
            precision: 0
        },
        {
            key: 'profileCapacity',
            label: 'Profile Capacity',
            unit: 'kW',
            formulaLatex: 'P_{cap} = P_{nom} C_v C_\\theta',
            description: 'Estimated capacity per belt/rib/base-width from selected profile and geometry corrections.',
            precision: 2
        },
        {
            key: 'requiredElements',
            label: 'Required Belts / Ribs',
            unit: '-',
            formulaLatex: 'N = ceil(P_d / P_{cap})',
            description: 'Preliminary number of belts, ribs, or base belt widths needed.',
            precision: 0
        },
        {
            key: 'minPulleyUsage',
            label: 'Min Pulley Usage',
            unit: '%' as any,
            formulaLatex: 'D_{min,actual}/D_{min,profile}',
            description: 'Small pulley diameter versus the selected profile minimum.',
            precision: 0
        }
    ],

    calculationEngine: (inputs) => {
        const n1 = Number(inputs.rpm1.value);
        const C_target = Number(inputs.centerDist.value);
        const P_kw = Number(inputs.power.value);
        const Ks = Number(inputs.serviceFactor?.value ?? 1.25);
        const mu = Number(inputs.friction.value);
        const type = (inputs.beltType.value as BeltDriveKind) || 'classical-v';
        const belt = BELT_DRIVE_TYPES[type] ?? BELT_DRIVE_TYPES['classical-v'];
        const profile = resolveBeltProfile(String(inputs.beltProfile?.value ?? 'a'), type);
        const pitchMm = profile.pitchMm;
        const isTiming = belt.positiveDrive && pitchMm != null && pitchMm > 0;
        const z1 = Math.round(Number(inputs.z1?.value ?? 30));
        const z2 = Math.round(Number(inputs.z2?.value ?? 60));
        const d1 = isTiming ? pitchDiameterFromTeeth(pitchMm!, z1) : Number(inputs.d1.value);
        const d2 = isTiming ? pitchDiameterFromTeeth(pitchMm!, z2) : Number(inputs.d2.value);
        const pld = isTiming ? timingPldForProfile(profile) : 0;
        const od1 = isTiming ? timingOutsideDiameterMm(pitchMm!, z1, pld) : 0;
        const od2 = isTiming ? timingOutsideDiameterMm(pitchMm!, z2, pld) : 0;
        const designPower = P_kw * Ks;

        // Driven RPM
        const n2 = n1 * (d1 / d2);

        // Belt Velocity (m/s)
        const v = (Math.PI * d1 * n1) / 60000;

        const dSmall = Math.min(d1, d2);
        const dLarge = Math.max(d1, d2);

        let C = C_target;
        let L = openBeltPitchLengthMm(dSmall, dLarge, C);
        let beltTeeth = 0;
        let L_theoretical = L;
        let C_actual = C_target;

        if (isTiming) {
            const snap = snapTimingBeltCatalog(dSmall, dLarge, C_target, pitchMm!);
            beltTeeth = snap.beltTeeth;
            L_theoretical = snap.L_theoretical;
            L = snap.L_standard;
            C_actual = snap.C_actual;
            C = C_actual;
        }

        // Arc of Contact (smaller pulley) — uses snapped C for timing
        const theta_rad = Math.PI - 2 * Math.asin((Math.abs(d2 - d1)) / (2 * C));
        const theta_deg = theta_rad * (180 / Math.PI);

        // Tension Ratio
        let ratio = 0;
        if (belt.positiveDrive) {
            ratio = 0;
        } else if (belt.grooveHalfAngleDeg != null) {
            const beta = belt.grooveHalfAngleDeg * (Math.PI / 180);
            ratio = Math.exp((mu * theta_rad) / Math.sin(beta));
        } else {
            ratio = Math.exp(mu * theta_rad);
        }
        const effectiveTension = v > 0 ? (designPower * 1000) / v : 0;

        const warnings: { field: string; message: string; severity: 'info' | 'warning' | 'critical' }[] = [];
        if (isTiming && Math.abs(C_actual - C_target) > 0.5) {
            warnings.push({
                field: 'centerDist',
                message: `Integer belt teeth (${beltTeeth}) snaps center distance to ${C_actual.toFixed(1)} mm (target ${C_target.toFixed(0)} mm).`,
                severity: 'info',
            });
        }
        if (theta_deg < 120) {
            warnings.push({ field: 'arcOfContact', message: `Wrap angle ${theta_deg.toFixed(1)} deg < 120 deg. Increase center distance or pulley sizes.`, severity: 'warning' });
        }
        if (C < (d1 + d2) / 2) {
            warnings.push({ field: 'centerDist', message: 'Center distance is below minimum for pulleys to mesh.', severity: 'critical' });
        }
        if (v > belt.velocityLimit) {
            warnings.push({ field: 'beltVelocity', message: `${belt.label} speed ${v.toFixed(1)} m/s exceeds ${belt.velocityLimit} m/s guideline.`, severity: 'warning' });
        }
        if (belt.positiveDrive && profile.pitchMm) {
            warnings.push({ field: 'beltType', message: 'Timing belt: verify catalog length (Lp) and tooth count against manufacturer table.', severity: 'info' });
        }

        let T2 = 0;
        let T1 = 0;
        if (belt.positiveDrive) {
            T1 = effectiveTension * belt.pretensionFactor;
            T2 = Math.max(0, T1 - effectiveTension);
        } else if (v > 0 && ratio > 1.001) {
            T2 = effectiveTension / (ratio - 1);
            T1 = ratio * T2;
        }
        const speedLimit = Math.min(belt.velocityLimit, profile.maxSpeedMs);
        const speedUtilization = speedLimit > 0 ? (v / speedLimit) * 100 : 0;
        const wrapCorrection = Math.max(0.55, Math.min(1.05, theta_deg / 180));
        const speedCorrection = Math.max(0.35, Math.min(1.45, Math.pow(Math.max(v, 0.1) / 10, 0.35)));

        let profileCapacity = profile.nominalKwAt10Ms * wrapCorrection * speedCorrection;
        if (isTiming) {
            const zDriver = z1;
            if (profile.catalogRating === 'gold2-14m') {
                const catalogKw = gold2_14mCatalogKw(n1, zDriver);
                if (catalogKw != null) {
                    const widthScale = (profile.referenceWidthMm ?? 40) / 40;
                    profileCapacity = catalogKw * widthScale;
                }
            }
        }

        const requiredElements = profileCapacity > 0 ? Math.max(1, Math.ceil(designPower / profileCapacity)) : 0;
        const minSmallPulley = Math.min(d1, d2);
        const minPulleyUsage = (minSmallPulley / profile.minSmallPulleyMm) * 100;

        if (profile.minTeeth != null && profile.pitchMm) {
            const zSmall = Math.min(z1, z2);
            if (zSmall < profile.minTeeth) {
                warnings.push({
                    field: isTiming ? 'z1' : 'd1',
                    message: `Small pulley z=${zSmall} teeth (d=${minSmallPulley.toFixed(1)} mm) below ${profile.label} minimum z=${profile.minTeeth} (pitch dia. ${profile.minSmallPulleyMm.toFixed(1)} mm).`,
                    severity: 'critical',
                });
            }
        } else if (minSmallPulley < profile.minSmallPulleyMm) {
            warnings.push({ field: 'd1', message: `Small pulley ${minSmallPulley.toFixed(0)} mm is below ${profile.label} minimum ${profile.minSmallPulleyMm.toFixed(0)} mm.`, severity: 'critical' });
        }
        if (requiredElements > 6 && !belt.positiveDrive) {
            warnings.push({ field: 'power', message: `${requiredElements} ${profile.elementLabel}s required; select larger profile or increase pulley diameter.`, severity: 'warning' });
        }
        if (belt.positiveDrive && requiredElements > 1) {
            warnings.push({
                field: 'power',
                message: `Design power ${designPower.toFixed(2)} kW exceeds ${profile.referenceWidthMm ?? 40} mm catalog rating (${profileCapacity.toFixed(2)} kW at n1=${n1} rpm). Increase belt width or driver teeth.`,
                severity: 'warning',
            });
        }

        return {
            outputs: {
                rpm2: createValidatedValue(n2, 'RPM' as any, 'derived'),
                designPower: createValidatedValue(designPower, 'kW', 'derived'),
                beltVelocity: createValidatedValue(v, 'm/s' as any, 'derived'),
                beltLength: createValidatedValue(L, 'mm', 'derived'),
                ...(belt.positiveDrive && pitchMm != null && pitchMm > 0
                    ? {
                        beltTeeth: createValidatedValue(beltTeeth, '-', 'derived'),
                        catalogLength: createValidatedValue(L_theoretical, 'mm', 'derived'),
                        centerDistActual: createValidatedValue(C_actual, 'mm', 'derived'),
                        od1: createValidatedValue(od1, 'mm', 'derived'),
                        od2: createValidatedValue(od2, 'mm', 'derived'),
                    }
                    : {}),
                arcOfContact: createValidatedValue(theta_deg, 'deg' as any, 'derived'),
                tensionRatio: createValidatedValue(ratio, '-', 'derived'),
                effectiveTension: createValidatedValue(effectiveTension, 'N', 'derived'),
                T2: createValidatedValue(T2, 'N', 'derived'),
                T1: createValidatedValue(T1, 'N', 'derived'),
                speedUtilization: createValidatedValue(speedUtilization, '%' as any, 'derived'),
                profileCapacity: createValidatedValue(profileCapacity, 'kW', 'derived'),
                requiredElements: createValidatedValue(requiredElements, '-', 'derived'),
                minPulleyUsage: createValidatedValue(minPulleyUsage, '%' as any, 'derived')
            },
            verified: true,
            warnings,
            timestamp: Date.now()
        };
    },

    documentation: {
        assumptions: [
            { id: 'thin-belt', text: 'Belt thickness is much smaller than pulley diameter.', impact: 'low' },
            { id: 'quasi-static', text: 'Centrifugal effects are reported by speed utilization but not subtracted from belt tension.', impact: 'medium' },
            { id: 'catalog-rating', text: 'Final belt section, tooth pitch, and number of ribs must be selected from manufacturer/standard rating tables.', impact: 'high' }
        ],
        standards: [
            { code: 'ISO 5291', title: 'V-belt drives — Grooved pulleys' },
            { code: 'ISO 13050', title: 'Metric synchronous belt drives — Pulleys and belts' },
        ],
        formulaLatex: 'L = 2C + \\frac{\\pi}{2}(d_1+d_2) + \\frac{(d_2-d_1)^2}{4C}'
    },

    tier: 'free',
    visualization: {
        type: 'svg-parametric',
        aspectRatio: 1.6,
        render: (result, inputs) => {
            const beltType = String(inputs.beltType?.value ?? inputs.beltType ?? 'classical-v') as BeltDriveKind;
            const profile = resolveBeltProfile(String(inputs.beltProfile?.value ?? 'a'), beltType);
            const timing = beltType === 'timing' && profile.pitchMm != null && profile.pitchMm > 0;
            const z1 = Math.round(Number(inputs.z1?.value ?? inputs.z1 ?? 30));
            const z2 = Math.round(Number(inputs.z2?.value ?? inputs.z2 ?? 60));
            const d1 = timing
                ? pitchDiameterFromTeeth(profile.pitchMm!, z1)
                : Number(inputs.d1?.value ?? inputs.d1 ?? 100);
            const d2 = timing
                ? pitchDiameterFromTeeth(profile.pitchMm!, z2)
                : Number(inputs.d2?.value ?? inputs.d2 ?? 250);
            const od1 = timing ? timingOutsideDiameterMm(profile.pitchMm!, z1, timingPldForProfile(profile)) : undefined;
            const od2 = timing ? timingOutsideDiameterMm(profile.pitchMm!, z2, timingPldForProfile(profile)) : undefined;
            const C_target = Number(inputs.centerDist?.value ?? inputs.centerDist ?? 500);
            const C_actual = timing ? (result.outputs.centerDistActual?.value as number) : undefined;
            return (
                <BeltDriveBlueprint
                    d1={d1}
                    d2={d2}
                    od1={od1}
                    od2={od2}
                    z1={timing ? z1 : undefined}
                    z2={timing ? z2 : undefined}
                    centerDist={timing && C_actual != null ? C_actual : C_target}
                    centerDistTarget={timing ? C_target : undefined}
                    beltType={beltType}
                    rpm1={Number(inputs.rpm1?.value ?? inputs.rpm1 ?? 1450)}
                    rpm2={result.outputs.rpm2?.value as number}
                    beltVelocity={result.outputs.beltVelocity?.value as number}
                    beltLength={result.outputs.beltLength?.value as number}
                    arcOfContact={result.outputs.arcOfContact?.value as number}
                    T1={result.outputs.T1?.value as number}
                    T2={result.outputs.T2?.value as number}
                />
            );
        },
    },
};

export default beltDriveSchema;
