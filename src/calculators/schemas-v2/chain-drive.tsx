
import type { CalculatorSchemaV2 } from '@/types/calculator-schema-v2';
import { createValidatedValue } from '@/types/engineering';
import { ChainDriveBlueprint } from '@/components/visualizers/ChainDriveBlueprint';
import { CHAIN_DRIVE_TYPES, ROLLER_CHAIN_SIZES, sprocketOutsideDiameterMm, sprocketPitchDiameterMm, type ChainDriveKind } from '@/data/mechanical/driveTypes';
import { rateRollerChain } from '@/lib/openDriveRating';

const chainDriveSchema: CalculatorSchemaV2 = {
    id: 'chain-drive',
    metadata: {
        title: 'Roller Chain Drive Calculator',
        description: 'Calculate speed ratio, chain length, velocity, and tension for roller chain drives (ISO 606).',
        category: 'mechanical',
        version: '1.0.0',
        author: 'AluCAD Engineering',
        lastUpdated: '2026-06-15',
        tags: ['chain', 'sprocket', 'roller-chain', 'transmission', 'machine-elements'],
        verifiedStandards: ['ISO 606', 'Shigley Mechanical Design']
    },

    inputs: [
        {
            key: 'chainType',
            label: 'Chain Type',
            unit: '-',
            defaultValue: 'roller-simplex',
            options: [
                { label: CHAIN_DRIVE_TYPES['roller-simplex'].label, value: 'roller-simplex' },
                { label: CHAIN_DRIVE_TYPES['roller-duplex'].label, value: 'roller-duplex' },
                { label: CHAIN_DRIVE_TYPES['roller-triplex'].label, value: 'roller-triplex' },
                { label: CHAIN_DRIVE_TYPES.silent.label, value: 'silent' },
                { label: CHAIN_DRIVE_TYPES.leaf.label, value: 'leaf' }
            ],
            description: 'Select chain family. This changes load sharing, speed guideline, and tooth-count warnings.',
            validation: { required: true },
            group: 'selection'
        },
        {
            key: 'chainSize',
            label: 'Chain Size / Pitch Series',
            unit: '-',
            defaultValue: '10b',
            options: ROLLER_CHAIN_SIZES.map((row) => ({ label: row.label, value: row.id })),
            description: 'ISO/ANSI chain size used for pitch, working load, roller diameter, and speed checks.',
            validation: { required: true },
            group: 'selection'
        },
        {
            key: 'z1',
            label: 'Driver Sprocket Teeth (z1)',
            unit: '-',
            defaultValue: 19,
            description: 'Number of teeth on the driving sprocket.',
            validation: { required: true, min: 11, max: 120 }
        },
        {
            key: 'z2',
            label: 'Driven Sprocket Teeth (z2)',
            unit: '-',
            defaultValue: 57,
            description: 'Number of teeth on the driven sprocket.',
            validation: { required: true, min: 11, max: 120 }
        },
        {
            key: 'pitch',
            label: 'Chain Pitch (p)',
            unit: 'mm',
            defaultValue: 15.875,
            description: 'Roller chain pitch (e.g. 15.875 mm for ANSI #50 / ISO 10B).',
            validation: { required: true, min: 4, step: 0.001 }
        },
        {
            key: 'centerDist',
            label: 'Center Distance (C)',
            unit: 'mm',
            defaultValue: 500,
            description: 'Shaft center distance.',
            validation: { required: true, min: 50 }
        },
        {
            key: 'rpm1',
            label: 'Driver Speed (n1)',
            unit: 'RPM' as any,
            defaultValue: 1450,
            description: 'Rotational speed of the driving sprocket.',
            validation: { required: true, min: 1 }
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
            defaultValue: 1.3,
            description: 'Application factor for shock, starts, lubrication quality, and duty cycle.',
            validation: { required: true, min: 1, max: 4, step: 0.05 },
            group: 'load'
        }
    ],

    outputs: [
        {
            key: 'ratio',
            label: 'Speed Ratio (i)',
            unit: '-',
            formulaLatex: 'i = \\frac{z_2}{z_1}',
            description: 'Ratio of driven to driver speed.',
            precision: 3
        },
        {
            key: 'rpm2',
            label: 'Driven Speed (n2)',
            unit: 'RPM' as any,
            formulaLatex: 'n_2 = \\frac{n_1}{i}',
            description: 'Rotational speed of the driven sprocket.',
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
            key: 'd1',
            label: 'Driver Pitch Diameter (dp1)',
            unit: 'mm',
            formulaLatex: 'd_p = \\frac{p}{\\sin(\\pi/z)}',
            description: 'Pitch diameter of the driving sprocket (chain path reference).',
            precision: 2
        },
        {
            key: 'd2',
            label: 'Driven Pitch Diameter (dp2)',
            unit: 'mm',
            formulaLatex: 'd_p = \\frac{p}{\\sin(\\pi/z)}',
            description: 'Pitch diameter of the driven sprocket.',
            precision: 2
        },
        {
            key: 'od1',
            label: 'Driver Tooth-Tip Ø (Da1)',
            unit: 'mm',
            formulaLatex: 'D_a \\approx p(0.6 + \\cot(\\pi/z))',
            description: 'Hobbing tooth-tip diameter for driver sprocket (ANSI B29.1 approx.).',
            precision: 2
        },
        {
            key: 'od2',
            label: 'Driven Tooth-Tip Ø (Da2)',
            unit: 'mm',
            formulaLatex: 'D_a \\approx p(0.6 + \\cot(\\pi/z))',
            description: 'Hobbing tooth-tip diameter for driven sprocket.',
            precision: 2
        },
        {
            key: 'chainVelocity',
            label: 'Chain Velocity (v)',
            unit: 'm/s' as any,
            formulaLatex: 'v = \\frac{\\pi d_1 n_1}{60000}',
            description: 'Linear speed of the chain.',
            precision: 2
        },
        {
            key: 'chainLength',
            label: 'Chain Length (L)',
            unit: 'mm',
            formulaLatex: 'L \\approx 2C + \\frac{p(z_1+z_2)}{2} + \\frac{p(z_2-z_1)^2}{4\\pi^2 C}',
            description: 'Approximate length of the chain run.',
            precision: 1
        },
        {
            key: 'chainTension',
            label: 'Total Chain Pull (F)',
            unit: 'N',
            formulaLatex: 'F = \\frac{P_d \\cdot 1000}{v}',
            description: 'Total effective chain pull for the transmitted design power.',
            precision: 0
        },
        {
            key: 'strandTension',
            label: 'Per Strand Load',
            unit: 'N',
            formulaLatex: 'F_s = F / k_{share}',
            description: 'Estimated load per strand after non-ideal load sharing.',
            precision: 0
        },
        {
            key: 'links',
            label: 'Pitch Links (approx.)',
            unit: '-',
            formulaLatex: 'N \\approx \\frac{L}{p}',
            description: 'Approximate number of chain pitches (round to even integer in practice).',
            precision: 0
        },
        {
            key: 'evenLinks',
            label: 'Even Link Count',
            unit: '-',
            formulaLatex: 'N_e = 2 \\cdot round(N/2)',
            description: 'Nearest practical even number of pitch links.',
            precision: 0
        },
        {
            key: 'speedUtilization',
            label: 'Speed Limit Usage',
            unit: '%' as any,
            formulaLatex: '\\eta_v = v / v_{limit}',
            description: 'Chain speed as percentage of the selected chain family guideline limit.',
            precision: 0
        },
        {
            key: 'polygonEffect',
            label: 'Polygon Speed Ripple',
            unit: '%' as any,
            formulaLatex: '\\epsilon \\approx (1 - cos(\\pi/z_1))100',
            description: 'Approximate chordal action speed ripple from the driver sprocket.',
            precision: 2
        },
        {
            key: 'workingLoadUsage',
            label: 'Working Load Usage',
            unit: '%' as any,
            formulaLatex: 'F_s / F_{allow}',
            description: 'Per-strand load versus selected chain recommended working load.',
            precision: 0
        },
        {
            key: 'breakingSafety',
            label: 'Breaking Safety Factor',
            unit: '-',
            formulaLatex: 'S_b = F_{break}/F_s',
            description: 'Breaking load divided by estimated per-strand load.',
            precision: 1
        },
        {
            key: 'ratedPower',
            label: 'ISO 10823 Rated Power',
            unit: 'kW',
            formulaLatex: 'P_r = (0.0022 n z p^2 - 1.57\\cdot10^{-7} n^2 z p^3) k_{share}',
            description: 'ANSI B29.1 / ISO 10823 screening capacity for the selected pitch, z1 and speed.',
            precision: 2
        },
        {
            key: 'powerUtilization',
            label: 'Rating Utilization',
            unit: '%' as any,
            formulaLatex: 'P_d / P_r',
            description: 'Design power versus ISO 10823 screening capacity.',
            precision: 0
        },
        {
            key: 'C_even',
            label: 'Even-Link Centre (C)',
            unit: 'mm',
            formulaLatex: 'C_{even} \\leftarrow N_e = 2\\,round(L/2p)',
            description: 'Shaft centre distance that realises the nearest even pitch count.',
            precision: 1
        },
        {
            key: 'centrifugalN',
            label: 'Centrifugal Pull',
            unit: 'N',
            formulaLatex: 'F_c = m v^2',
            description: 'Chain mass-velocity pull added to tight-side tension at speed.',
            precision: 1
        }
    ],

    calculationEngine: (inputs) => {
        const chainType = (inputs.chainType?.value as ChainDriveKind) || 'roller-simplex';
        const chain = CHAIN_DRIVE_TYPES[chainType] ?? CHAIN_DRIVE_TYPES['roller-simplex'];
        const chainSizeId = String(inputs.chainSize?.value ?? '10b');
        const chainSize = ROLLER_CHAIN_SIZES.find((row) => row.id === chainSizeId) ?? ROLLER_CHAIN_SIZES.find((row) => row.id === '10b')!;
        const z1 = Number(inputs.z1.value);
        const z2 = Number(inputs.z2.value);
        const p = chainSize.pitchMm || Number(inputs.pitch.value);
        const C = Number(inputs.centerDist.value);
        const n1 = Number(inputs.rpm1.value);
        const P_kw = Number(inputs.power.value);
        const Ks = Number(inputs.serviceFactor?.value ?? 1.3);
        const designPower = P_kw * Ks;

        const ratio = z2 / z1;
        const n2 = n1 / ratio;

        const d1 = sprocketPitchDiameterMm(p, z1);
        const d2 = sprocketPitchDiameterMm(p, z2);
        const od1 = sprocketOutsideDiameterMm(p, z1);
        const od2 = sprocketOutsideDiameterMm(p, z2);
        const v = (Math.PI * d1 * n1) / 60000;

        const L = 2 * C + (p * (z1 + z2)) / 2 + (p * Math.pow(z2 - z1, 2)) / (4 * Math.PI * Math.PI * C);
        const F = v > 0 ? (designPower * 1000) / v : 0;
        const strandTension = chain.loadShare > 0 ? F / chain.loadShare : F;
        const links = L / p;
        const evenLinks = Math.max(2, Math.round(links / 2) * 2);
        const speedLimit = Math.min(chain.velocityLimit, chainSize.maxSpeedMs);
        const speedUtilization = speedLimit > 0 ? (v / speedLimit) * 100 : 0;
        const polygonEffect = (1 - Math.cos(Math.PI / Math.max(z1, 1))) * 100;
        const workingLoadUsage = chainSize.recommendedWorkingLoadN > 0 ? (strandTension / chainSize.recommendedWorkingLoadN) * 100 : 0;
        const breakingSafety = strandTension > 0 ? chainSize.breakingLoadN / strandTension : 0;
        const chainRating = rateRollerChain({
            pitchMm: p,
            z1,
            z2,
            C,
            n1,
            designPowerKW: designPower,
            strandCount: chain.strandCount,
            loadShare: chain.loadShare,
            breakingLoadN: chainSize.breakingLoadN,
            workingLoadN: chainSize.recommendedWorkingLoadN,
        });

        const warnings: { field: string; message: string; severity: 'info' | 'warning' | 'critical' }[] = [];
        if (z1 < 7) {
            warnings.push({ field: 'z1', message: `Driver z1=${z1} is below absolute minimum 7 teeth.`, severity: 'critical' });
        }
        if (z2 < 7) {
            warnings.push({ field: 'z2', message: `Driven z2=${z2} is below absolute minimum 7 teeth.`, severity: 'critical' });
        }
        if (z1 > 0 && z2 / z1 > 10) {
            warnings.push({ field: 'z2', message: `Ratio ${(z2 / z1).toFixed(1)}:1 exceeds practical 10:1 for single-stage chain.`, severity: 'warning' });
        }
        if (z2 > 120) {
            warnings.push({ field: 'z2', message: `Driven z2=${z2} exceeds practical maximum 120 teeth for roller chain sprocket.`, severity: 'warning' });
        }

        // Geometric collision & impossible dimension diagnostics
        const minC_contact = (od1 + od2) / 2;
        if (C <= minC_contact) {
            warnings.push({
                field: 'centerDist',
                message: `İmkansız Ölçü: Akslar arası mesafe (C=${C.toFixed(1)} mm), dişli dış çapları toplamından küçük (Min ${minC_contact.toFixed(1)} mm). Dişliler fiziksel olarak çarpışır/iç içe geçer!`,
                severity: 'critical',
            });
        } else if (C < minC_contact + 15) {
            warnings.push({
                field: 'centerDist',
                message: `Akslar arası mesafe (C=${C.toFixed(1)} mm) dişli diş uçlarına çok yakın (boşluk < 15 mm). Zincir titreşiminde temas riski.`,
                severity: 'warning',
            });
        }

        if (p > 0 && C < 20 * p) {
            warnings.push({
                field: 'centerDist',
                message: `Akslar arası mesafe (C=${C.toFixed(0)} mm) ISO 10823 önerilen 20p (${(20 * p).toFixed(0)} mm) sınırının altındadır.`,
                severity: 'info',
            });
        } else if (p > 0 && C > 80 * p) {
            warnings.push({
                field: 'centerDist',
                message: `Akslar arası mesafe (C=${C.toFixed(0)} mm) 80p (${(80 * p).toFixed(0)} mm) sınırını aşıyor; aşırı zincir sarkması önlemek için gergi makarası kullanın.`,
                severity: 'warning',
            });
        }

        if (n1 <= 0) {
            warnings.push({ field: 'rpm1', message: 'Input speed must be positive.', severity: 'critical' });
        }
        if (P_kw <= 0) {
            warnings.push({ field: 'power', message: 'Power must be positive.', severity: 'critical' });
        }
        if (chainType === 'leaf') {
            warnings.push({ field: 'chainType', message: 'Leaf chain is intended for lifting/tension service, not normal sprocket power transmission.', severity: 'critical' });
        }
        const minTeeth = Math.max(chain.minimumTeeth, chainSize.minSprocketTeeth);
        if (minTeeth > 0 && z1 < minTeeth) {
            warnings.push({ field: 'z1', message: `${chainSize.label} should use at least ${minTeeth} driver teeth for smoother service.`, severity: 'warning' });
        }
        if (v > chain.velocityLimit) {
            warnings.push({ field: 'chainVelocity', message: `${chain.label} speed ${v.toFixed(1)} m/s exceeds ${chain.velocityLimit} m/s guideline.`, severity: 'warning' });
        }
        if (strandTension > chainSize.recommendedWorkingLoadN) {
            warnings.push({ field: 'chainTension', message: `Per-strand load ${strandTension.toFixed(0)} N exceeds ${chainSize.label} recommended working load ${chainSize.recommendedWorkingLoadN} N.`, severity: 'critical' });
        }
        if (breakingSafety < 8) {
            warnings.push({ field: 'chainTension', message: `Breaking safety factor ${breakingSafety.toFixed(1)} is below common design target 8.`, severity: 'warning' });
        }
        if (Math.abs(evenLinks - links) > 0.25) {
            warnings.push({ field: 'links', message: `Calculated ${links.toFixed(1)} links; adjust center distance to ${chainRating.C_even.toFixed(1)} mm for even link count ${evenLinks}.`, severity: 'info' });
        }
        if (chainRating.powerUtilization > 100) {
            warnings.push({
                field: 'power',
                message: `Design power ${designPower.toFixed(2)} kW exceeds ISO 10823 screening capacity ${chainRating.ratedPowerKW.toFixed(2)} kW (${chainRating.powerUtilization.toFixed(0)}%). Increase pitch, z1, or strand count.`,
                severity: 'critical',
            });
        } else if (chainRating.powerUtilization > 80) {
            warnings.push({
                field: 'power',
                message: `Drive uses ${chainRating.powerUtilization.toFixed(0)}% of ISO 10823 rated power. Little margin for shock or wear.`,
                severity: 'warning',
            });
        }
        warnings.push({
            field: 'chainVelocity',
            message: chainRating.lubeNote,
            severity: 'info',
        });

        return {
            outputs: {
                ratio: createValidatedValue(ratio, '-', 'derived'),
                rpm2: createValidatedValue(n2, 'RPM' as any, 'derived'),
                designPower: createValidatedValue(designPower, 'kW', 'derived'),
                d1: createValidatedValue(d1, 'mm', 'derived'),
                d2: createValidatedValue(d2, 'mm', 'derived'),
                od1: createValidatedValue(od1, 'mm', 'derived'),
                od2: createValidatedValue(od2, 'mm', 'derived'),
                chainVelocity: createValidatedValue(v, 'm/s' as any, 'derived'),
                chainLength: createValidatedValue(L, 'mm', 'derived'),
                chainTension: createValidatedValue(F, 'N', 'derived'),
                strandTension: createValidatedValue(strandTension, 'N', 'derived'),
                links: createValidatedValue(links, '-', 'derived'),
                evenLinks: createValidatedValue(evenLinks, '-', 'derived'),
                speedUtilization: createValidatedValue(speedUtilization, '%' as any, 'derived'),
                polygonEffect: createValidatedValue(polygonEffect, '%' as any, 'derived'),
                workingLoadUsage: createValidatedValue(workingLoadUsage, '%' as any, 'derived'),
                breakingSafety: createValidatedValue(breakingSafety, '-', 'derived'),
                ratedPower: createValidatedValue(chainRating.ratedPowerKW, 'kW', 'derived'),
                powerUtilization: createValidatedValue(chainRating.powerUtilization, '%' as any, 'derived'),
                C_even: createValidatedValue(chainRating.C_even, 'mm', 'derived'),
                centrifugalN: createValidatedValue(chainRating.centrifugalN, 'N', 'derived')
            },
            verified: true,
            warnings,
            timestamp: Date.now()
        };
    },

    documentation: {
        assumptions: [
            { id: 'open-drive', text: 'Open chain drive without idler or tensioner.', impact: 'medium' },
            { id: 'steady-power', text: 'ISO 10823 / ANSI B29.1 screening capacity is shown; confirm the final size on the manufacturer rating chart.', impact: 'medium' },
            { id: 'lubrication', text: 'Lubrication method and sprocket material are not selected yet; use warnings as preliminary screening only.', impact: 'medium' }
        ],
        standards: [
            { code: 'ISO 606', title: 'Short-pitch transmission precision roller chains' }
        ],
        formulaLatex: 'd = \\frac{p}{\\sin(\\pi/z)}, \\quad v = \\frac{\\pi d n}{60000}'
    },

    tier: 'free',
    visualization: {
        type: 'svg-parametric',
        aspectRatio: 1.6,
        render: (result, inputs) => {
            const chainSizeId = String(inputs.chainSize?.value ?? inputs.chainSize ?? '10b');
            const chainSize = ROLLER_CHAIN_SIZES.find((row) => row.id === chainSizeId) ?? ROLLER_CHAIN_SIZES.find((row) => row.id === '10b')!;
            const p = chainSize.pitchMm || Number(inputs.pitch?.value ?? inputs.pitch ?? 15.875);
            return (
                <ChainDriveBlueprint
                    z1={Number(inputs.z1?.value ?? inputs.z1 ?? 19)}
                    z2={Number(inputs.z2?.value ?? inputs.z2 ?? 57)}
                    pitch={p}
                    centerDist={Number(inputs.centerDist?.value ?? inputs.centerDist ?? 500)}
                    rpm1={Number(inputs.rpm1?.value ?? inputs.rpm1 ?? 1450)}
                    chainType={String(inputs.chainType?.value ?? inputs.chainType ?? 'roller-simplex')}
                    chainSize={chainSizeId}
                    ratio={result.outputs.ratio?.value as number}
                    rpm2={result.outputs.rpm2?.value as number}
                    chainVelocity={result.outputs.chainVelocity?.value as number}
                    chainLength={result.outputs.chainLength?.value as number}
                    chainTension={result.outputs.chainTension?.value as number}
                    d1={result.outputs.d1?.value as number}
                    d2={result.outputs.d2?.value as number}
                    od1={result.outputs.od1?.value as number}
                    od2={result.outputs.od2?.value as number}
                    ratedPower={result.outputs.ratedPower?.value as number}
                    powerUtilization={result.outputs.powerUtilization?.value as number}
                    C_even={result.outputs.C_even?.value as number}
                    centrifugalN={result.outputs.centrifugalN?.value as number}
                />
            );
        },
    },
};

export default chainDriveSchema;
