import React from 'react';
import type { CalculatorSchemaV2 } from '@/types/calculator-schema-v2';
import { createValidatedValue } from '@/types/engineering';
import {
    generateExternalGearContour,
    generateInternalGearContour,
    pointsToSvgPath,
    calculateInvoluteGearSpecs,
} from '@/engines/math/gear-involute-factory';
import { CrossModuleBridge } from '@/system/crossModuleBridge';
import { ratePlanetaryStage } from '@/lib/planetaryRating';

export const planetaryGearSchema: CalculatorSchemaV2 = {
    id: 'planetary-gear',
    metadata: {
        title: 'Planetary Gear Train',
        description: 'Speed, torque, efficiency, and assembly spacing analysis for planetary gear sets (sun, planet, ring, carrier).',
        category: 'mechanical',
        version: '1.0.0',
        author: 'AluCAD OS',
        lastUpdated: '2026-06-28',
        tags: ['planetary gear', 'epicyclic', 'gear ratio', 'carrier speed', 'spacing condition', 'machine elements'],
        verifiedStandards: ['ISO 6336', 'AGMA 6123']
    },
    documentation: {
        assumptions: [
            { id: 'a1', text: 'Planets are equally spaced around the sun.', impact: 'medium' },
            { id: 'a2', text: 'Standard tooth profiles without profile shift.', impact: 'medium' }
        ],
        standards: [
            { code: 'AGMA 6123', title: 'Design Manual for Enclosed Epicyclic Gear Drives' },
            { code: 'ISO 6336', title: 'Calculation of load capacity of spur and helical gears' }
        ],
        formulaLatex: 'z_r = z_s + 2 \\cdot z_p \\quad , \\quad i = 1 + \\frac{z_r}{z_s} \\text{ (Ring Fixed)} \\quad , \\quad \\frac{z_s + z_r}{N} = \\text{Integer}'
    },
    inputs: [
        { key: 'm', label: 'Normal Module (mn)', unit: 'mm', defaultValue: 3, description: 'Normal pitch module of the teeth', validation: { required: true, min: 0.5, max: 50 } },
        { key: 'helixAngle', label: 'Helix Angle (β)', unit: 'deg' as any, defaultValue: 0, description: '0 = spur. Helical planetary uses mt = mn/cos(β); sun RH, planets/ring LH.', validation: { required: false, min: 0, max: 30, step: 1 } },
        { key: 'faceWidth', label: 'Face Width (b)', unit: 'mm', defaultValue: 30, description: 'Common face width of sun, planets and ring', validation: { required: false, min: 4, max: 200 } },
        { key: 'zs', label: 'Sun Gear Teeth (zs)', unit: '-', defaultValue: 18, description: 'Number of teeth on the sun gear', validation: { required: true, min: 10, max: 100, step: 1 } },
        { key: 'zp', label: 'Planet Gear Teeth (zp)', unit: '-', defaultValue: 18, description: 'Number of teeth on the planet gear', validation: { required: true, min: 10, max: 100, step: 1 } },
        { key: 'N', label: 'Number of Planets (N)', unit: '-', defaultValue: 3, description: 'Number of planet gears (typically 3 or 4)', validation: { required: true, min: 2, max: 8, step: 1 } },
        {
            key: 'config',
            label: 'Fixed Member',
            unit: '-',
            defaultValue: 'ring',
            description: 'The member of the epicyclic train that is stationary',
            options: [
                { label: 'Ring Fixed (Input Sun, Output Carrier)', value: 'ring' },
                { label: 'Carrier Fixed (Input Sun, Output Ring)', value: 'carrier' },
                { label: 'Sun Fixed (Input Ring, Output Carrier)', value: 'sun' }
            ],
            validation: { required: true }
        },
        { key: 'nin', label: 'Input Speed (nin)', unit: 'rpm', defaultValue: 1500, description: 'Rotational speed of the input member', validation: { required: true, min: 1, max: 10000 } },
        { key: 'Tin', label: 'Input Torque (Tin)', unit: 'Nm', defaultValue: 100, description: 'Torque applied to the input member', validation: { required: true, min: 0.1, max: 10000 } }
    ],
    outputs: [
        { key: 'zr', label: 'Ring Gear Teeth (zr)', unit: '-', description: 'Derived number of teeth on the ring gear', precision: 0, formulaLatex: 'z_r = z_s + 2 \\cdot z_p' },
        { key: 'i', label: 'Gear Ratio (i)', unit: '-', description: 'Absolute speed ratio between input and output', precision: 2, formulaLatex: 'i = \\omega_{in} / \\omega_{out}' },
        { key: 'nout', label: 'Output Speed (nout)', unit: 'rpm', description: 'Rotational speed of the output member', precision: 1, formulaLatex: 'n_{out} = n_{in} / i' },
        { key: 'Tout', label: 'Output Torque (Tout)', unit: 'Nm', description: 'Torque on the output member after mesh-power efficiency', precision: 1, formulaLatex: 'T_{out} = T_{in} \\cdot i \\cdot \\eta' },
        { key: 'eta', label: 'Stage Efficiency (η)', unit: '-', description: 'Müller mesh-power efficiency (sun–planet × planet–ring, coupling power deducted)', precision: 3, formulaLatex: '\\eta = (1 + \\alpha \\eta_0)/(1+\\alpha)' },
        { key: 'Kgamma', label: 'Load Share Kγ', unit: '-', description: 'AGMA 6123 planet load-sharing factor (floating sun)', precision: 2, formulaLatex: 'K_\\gamma = 1.10 + 0.05(N-3)' },
        { key: 'FtPlanet', label: 'Planet Mesh Ft', unit: 'N', description: 'Tangential load per planet after Kγ', precision: 0, formulaLatex: 'F_t = 2000 T_s K_\\gamma / (N d_s)' },
        { key: 'SFsp', label: 'Sun–Planet SF', unit: '-', description: 'ISO 6336 bending safety of the sun–planet mesh', precision: 2, formulaLatex: 'S_{F,sp} = \\sigma_{FP} / \\sigma_{F,sp}' },
        { key: 'SHsp', label: 'Sun–Planet SH', unit: '-', description: 'ISO 6336 pitting safety of the sun–planet mesh', precision: 2, formulaLatex: 'S_{H,sp} = \\sigma_{HP} / \\sigma_{H,sp}' },
        { key: 'SFpr', label: 'Planet–Ring SF', unit: '-', description: 'ISO 6336 bending safety of the internal planet–ring mesh', precision: 2, formulaLatex: 'S_{F,pr} = \\sigma_{FP} / \\sigma_{F,pr}' },
        { key: 'SHpr', label: 'Planet–Ring SH', unit: '-', description: 'ISO 6336 pitting safety of the internal planet–ring mesh', precision: 2, formulaLatex: 'S_{H,pr} = \\sigma_{HP} / \\sigma_{H,pr}' },
        { key: 'ds', label: 'Sun Pitch Diameter (ds)', unit: 'mm', description: 'Pitch diameter of the sun gear (mt·zs if helical)', precision: 2, formulaLatex: 'd_s = m_t \\cdot z_s' },
        { key: 'dp', label: 'Planet Pitch Diameter (dp)', unit: 'mm', description: 'Pitch diameter of each planet gear', precision: 2, formulaLatex: 'd_p = m_t \\cdot z_p' },
        { key: 'dc', label: 'Carrier Orbit Diameter (dc)', unit: 'mm', description: 'Pitch circle diameter of the planet carrier pins', precision: 2, formulaLatex: 'd_c = d_s + d_p' },
        { key: 'mt', label: 'Transverse Module (mt)', unit: 'mm', description: 'mt = mn / cos(β)', precision: 4, formulaLatex: 'm_t = m_n / \\cos\\beta' }
    ],
    calculationEngine: (inputs: Record<string, any>) => {
        const m = Number(inputs.m.value);
        const zs = Number(inputs.zs.value);
        const zp = Number(inputs.zp.value);
        const N = Number(inputs.N.value);
        const config = String(inputs.config.value);
        const nin = Number(inputs.nin.value);
        const Tin = Number(inputs.Tin.value);
        const betaDeg = Number(inputs.helixAngle?.value ?? 0);
        const faceWidth = Number(inputs.faceWidth?.value ?? 10 * m);
        const mt = Math.abs(betaDeg) > 0.05 ? m / Math.cos((betaDeg * Math.PI) / 180) : m;

        // 1. Ring teeth constraint
        const zr = zs + 2 * zp;

        // 2. Diameters — helical planetary uses transverse module
        const ds = mt * zs;
        const dp = mt * zp;
        const dr = mt * zr;
        const dc = ds + dp;

        // 3. Ratio based on config
        let i = 1;
        if (config === 'ring') {
            i = 1 + zr / zs; // Sun input, Carrier output, Ring fixed
        } else if (config === 'carrier') {
            i = -zr / zs; // Sun input, Ring output, Carrier fixed (reversing)
        } else if (config === 'sun') {
            i = 1 + zs / zr; // Ring input, Carrier output, Sun fixed
        }

        const powerKW = (Tin * nin) / 9549.27;
        const rating = ratePlanetaryStage({
            zs,
            zp,
            zr,
            planetCount: N,
            mn: m,
            betaDeg,
            faceWidth,
            mode: config === 'carrier' ? 'carrier' : config === 'sun' ? 'sun' : 'ring',
            nInRpm: nin,
            powerKW,
            floatingSun: true,
        });

        const nout = rating.nOut;
        const Tout = rating.T_out;

        const warnings: { field: string; message: string; severity: "info" | "warning" | "critical" }[] = [];

        if (!rating.assemblyOk) {
            warnings.push({
                field: 'N',
                message: `Assembly index condition failed. (zs + zr) / N = (${zs} + ${zr}) / ${N} = ${((zs + zr) / N).toFixed(2)}, which is not an integer. Planets cannot be equally spaced!`,
                severity: 'critical'
            });
        }

        if (zp < 12) {
            warnings.push({
                field: 'zp',
                message: `Planet gear teeth count (${zp}) is below 12. Undercutting and tooth interference may occur without profile shift.`,
                severity: 'warning'
            });
        }
        if (rating.sunPlanet.SF < 1.4 || rating.planetRing.SF < 1.4) {
            warnings.push({
                field: 'Tin',
                message: `ISO 6336 bending safety below 1.4 (sun–planet SF=${rating.sunPlanet.SF.toFixed(2)}, planet–ring SF=${rating.planetRing.SF.toFixed(2)}). Increase b or mn.`,
                severity: 'warning'
            });
        }
        if (rating.sunPlanet.SH < 1.0 || rating.planetRing.SH < 1.0) {
            warnings.push({
                field: 'Tin',
                message: `ISO 6336 pitting safety below 1.0 (SH_sp=${rating.sunPlanet.SH.toFixed(2)}, SH_pr=${rating.planetRing.SH.toFixed(2)}).`,
                severity: 'critical'
            });
        }
        if (Math.abs(betaDeg) > 0.05) {
            warnings.push({
                field: 'helixAngle',
                message: `Helical planetary: sun ${rating.helixHands.sun}, planets/ring ${rating.helixHands.planets}. Axial force on sun Fa=${rating.Fa_sun.toFixed(0)} N.`,
                severity: 'info'
            });
        }

        return {
            outputs: {
                zr: createValidatedValue(zr, '-', 'derived'),
                i: createValidatedValue(rating.i, '-', 'derived'),
                nout: createValidatedValue(nout, 'rpm', 'derived'),
                Tout: createValidatedValue(Tout, 'Nm', 'derived'),
                eta: createValidatedValue(rating.etaStage, '-', 'derived'),
                Kgamma: createValidatedValue(rating.Kgamma, '-', 'derived'),
                FtPlanet: createValidatedValue(rating.Ft_planet, 'N', 'derived'),
                SFsp: createValidatedValue(rating.sunPlanet.SF, '-', 'derived'),
                SHsp: createValidatedValue(rating.sunPlanet.SH, '-', 'derived'),
                SFpr: createValidatedValue(rating.planetRing.SF, '-', 'derived'),
                SHpr: createValidatedValue(rating.planetRing.SH, '-', 'derived'),
                ds: createValidatedValue(ds, 'mm', 'derived'),
                dp: createValidatedValue(dp, 'mm', 'derived'),
                dc: createValidatedValue(dc, 'mm', 'derived'),
                mt: createValidatedValue(mt, 'mm', 'derived')
            },
            verified: rating.assemblyOk && rating.status !== 'unsafe',
            warnings,
            timestamp: Date.now()
        };
    },
    visualization: {
        type: 'svg-parametric',
        render: (result: any, inputs: any) => {
            const out = result.outputs || {};
            const m = Number(inputs?.m?.value || 3);
            const zs = Math.max(8, Number(inputs?.zs?.value || 18));
            const zp = Math.max(4, Number(inputs?.zp?.value || 18));
            const zr = Math.max(zs + 2, Number(out?.zr?.value || (zs + 2 * zp)));
            const N = Math.max(2, Number(inputs?.N?.value || 3));
            const beta = Number(inputs?.helixAngle?.value ?? 0);
            const faceWidth = Number(inputs?.faceWidth?.value ?? 10 * m);

            const sunSpecs = calculateInvoluteGearSpecs({ module: m, teeth: zs, helixAngle: beta });
            const planetSpecs = calculateInvoluteGearSpecs({ module: m, teeth: zp, helixAngle: -beta });
            const ringSpecs = calculateInvoluteGearSpecs({ module: m, teeth: zr, helixAngle: -beta, isInternal: true, rimThickness: 3.5 * m });

            const rS = sunSpecs.pitchRadius;
            const rP = planetSpecs.pitchRadius;
            const rR = ringSpecs.pitchRadius;
            const rC = rS + rP;
            const rOuter = (ringSpecs.outerRingDiameter ?? (ringSpecs.rootDiameter + 20)) / 2;

            const scale = 95 / rOuter;

            const sunPts = generateExternalGearContour({ module: m, teeth: zs, helixAngle: beta, pointsPerFlank: 6 });
            const planetPts = generateExternalGearContour({ module: m, teeth: zp, helixAngle: -beta, pointsPerFlank: 6 });
            const ringPts = generateInternalGearContour({ module: m, teeth: zr, helixAngle: -beta, pointsPerFlank: 6, rimThickness: 3.5 * m });

            const sunPath = pointsToSvgPath(sunPts, true);
            const planetPath = pointsToSvgPath(planetPts, true);
            const ringPath = `${pointsToSvgPath(ringPts.outerRimContour, true)} ${pointsToSvgPath(ringPts.innerTeethContour, true)}`;

            // Generate planet coordinates
            const planets = [];
            for (let k = 0; k < N; k++) {
                const angle = (k * 2 * Math.PI) / N - Math.PI / 2;
                planets.push({
                    x: rC * Math.cos(angle),
                    y: rC * Math.sin(angle),
                    angle
                });
            }

            const exportTo3D = () => {
                CrossModuleBridge.exportPlanetaryTo3D({
                    sunTeeth: zs,
                    planetTeeth: zp,
                    ringTeeth: zr,
                    planetCount: N,
                    module: m,
                    faceWidth,
                    helixAngle: beta,
                    switchWindow: true,
                });
            };

            return (
                <div className="w-full h-full flex flex-row items-center justify-center p-6 bg-[var(--bg-0)] gap-12">
                    {/* Epicyclic Layout SVG */}
                    <div className="relative w-[220px] h-[220px]">
                        <button
                            type="button"
                            onClick={exportTo3D}
                            className="absolute -top-1 right-0 z-10 px-2.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-[var(--radius-s)] text-[9px] font-mono font-bold uppercase transition-all cursor-pointer"
                            title="Export sun, planets and ring to 3D Design Studio"
                        >
                            Export to 3D
                        </button>
                        <svg viewBox="0 0 220 220" width="100%" height="100%" className="overflow-visible select-none">
                            <defs>
                                <linearGradient id="pgSun" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#38bdf8" />
                                    <stop offset="100%" stopColor="#0284c7" />
                                </linearGradient>
                                <linearGradient id="pgPlanet" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#34d399" />
                                    <stop offset="100%" stopColor="#059669" />
                                </linearGradient>
                                <linearGradient id="pgRing" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#334155" />
                                    <stop offset="100%" stopColor="#1e293b" />
                                </linearGradient>
                            </defs>

                            <g transform={`translate(110, 110) scale(${scale.toFixed(5)})`}>
                                {/* Outer Ring Gear */}
                                <path d={ringPath} fill="url(#pgRing)" stroke="#ef4444" strokeWidth={1 / scale} fillRule="evenodd" />
                                <circle r={rR} fill="none" stroke="#ef4444" strokeWidth={1 / scale} strokeDasharray={`${4 / scale} ${3 / scale}`} opacity={0.5} />

                                {/* Carrier Spider Arms */}
                                {planets.map((p, idx) => (
                                    <line key={`arm-${idx}`} x1={0} y1={0} x2={p.x} y2={p.y} stroke="#f59e0b" strokeWidth={2.5 / scale} strokeLinecap="round" />
                                ))}
                                <circle r={rC} fill="none" stroke="#f59e0b" strokeWidth={1 / scale} strokeDasharray={`${4 / scale} ${3 / scale}`} opacity={0.4} />

                                {/* Sun Gear */}
                                <path d={sunPath} fill="url(#pgSun)" stroke="#38bdf8" strokeWidth={0.8 / scale} />
                                <circle r={rS} fill="none" stroke="#ffffff" strokeWidth={0.8 / scale} strokeDasharray={`${3 / scale} ${2 / scale}`} opacity={0.4} />
                                <circle r={Math.max(4, rS * 0.35)} fill="#05080b" stroke="#0284c7" strokeWidth={1 / scale} />

                                {/* Planet Gears */}
                                {planets.map((p, idx) => (
                                    <g key={`planet-${idx}`} transform={`translate(${p.x.toFixed(3)}, ${p.y.toFixed(3)})`}>
                                        <g transform={`rotate(${180 / zp})`}>
                                            <path d={planetPath} fill="url(#pgPlanet)" stroke="#34d399" strokeWidth={0.8 / scale} />
                                        </g>
                                        <circle r={rP} fill="none" stroke="#ffffff" strokeWidth={0.8 / scale} strokeDasharray={`${2 / scale} ${2 / scale}`} opacity={0.4} />
                                        <circle r={Math.max(3, rP * 0.35)} fill="#05080b" stroke="#059669" strokeWidth={1 / scale} />
                                    </g>
                                ))}
                            </g>
                        </svg>
                    </div>

                    {/* Stats */}
                    <div className="flex flex-col gap-5 w-36 border border-[var(--line)] bg-[var(--bg-1)] p-4 rounded-xl">
                        <div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Ratio (i)</div>
                            <div className="text-xl font-bold font-mono text-white">
                                {((out.i?.value as number) || 1).toFixed(2)}
                            </div>
                        </div>
                        <div className="w-full h-px bg-[var(--bg-3)]"></div>
                        <div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Output Speed</div>
                            <div className="text-xl font-bold font-mono text-emerald-400">
                                {Math.abs((out.nout?.value as number) || 0).toFixed(0)} <span className="text-[10px] text-gray-500">rpm</span>
                            </div>
                        </div>
                        <div className="w-full h-px bg-[var(--bg-3)]"></div>
                        <div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Assembly Spacing</div>
                            <div className={`text-xs font-bold font-mono ${(zr + zs) % N === 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {((zr + zs) % N === 0) ? 'OK' : 'MISALIGNED'}
                            </div>
                        </div>
                        <div className="w-full h-px bg-[var(--bg-3)]"></div>
                        <div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">η / Kγ</div>
                            <div className="text-sm font-bold font-mono text-cyan-300">
                                {(((out.eta?.value as number) || 0) * 100).toFixed(1)}% · {((out.Kgamma?.value as number) || 0).toFixed(2)}
                            </div>
                        </div>
                        <div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">SF / SH (sun–planet)</div>
                            <div className="text-sm font-bold font-mono text-white">
                                {((out.SFsp?.value as number) || 0).toFixed(2)} / {((out.SHsp?.value as number) || 0).toFixed(2)}
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
    },
    tier: 'free'
};

export default planetaryGearSchema;
