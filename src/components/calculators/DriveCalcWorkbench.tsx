'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Box, ChevronDown, ChevronUp, Download, Info, Settings2, Zap } from 'lucide-react';
import { CrossModuleBridge } from '@/system/crossModuleBridge';
import { downloadOpenDriveLayoutSvg } from '@/engines/math/drive-loop-engine';
import { beltDriveDxf, chainDriveDxf } from '@/export/dxf/schematics';
import type { CalculatorSchemaV2 } from '@/types/calculator-schema-v2';
import { createValidatedValue, type ValidatedEngineeringValue } from '@/types/engineering';
import { ChainDriveBlueprint } from '@/components/visualizers/ChainDriveBlueprint';
import { BeltDriveBlueprint } from '@/components/visualizers/BeltDriveBlueprint';
import { defaultProfileForFamily, pitchDiameterFromTeeth, profilesForFamily, pulleyTeethFromPitchDiameter, PROFILE_SHAPE_LABELS, resolveBeltProfile, timingOutsideDiameterMm, timingPldForProfile, timingProfileGroups, ROLLER_CHAIN_SIZES, BELT_DRIVE_TYPES, type BeltDriveKind } from '@/data/mechanical/driveTypes';
import { snapTimingBeltCatalog } from '@/components/visualizers/techframe-utils';
import { useGlobalPrecision, formatEngineeringValue } from '@/components/calculator-kit/precisionUtils';

type Field = CalculatorSchemaV2['inputs'][number];

function num(v: unknown, fallback: number) {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
}

function CalcField({ field, value, accent, onChange, optionGroups }: {
    field: Field;
    value: number | string;
    accent: string;
    onChange: (k: string, v: number | string) => void;
    optionGroups?: { label: string; options: { label: string; value: string }[] }[];
}) {
    const hasOptionGroups = optionGroups && optionGroups.length > 0;
    const hasOptions = hasOptionGroups || (field.options && field.options.length > 0);
    return (
        <div className="flex flex-col gap-1 group">
            <label className="text-[10px] font-bold text-[var(--alu-dim)] uppercase tracking-wider group-focus-within:text-[var(--ink)] transition-colors">{field.label}</label>
            <div className="relative flex items-center bg-[var(--bg-1)] border border-[var(--line)] rounded-lg overflow-hidden focus-within:border-[var(--line)]" style={{ ['--tw-ring-color' as any]: accent }}>
                {hasOptions ? (
                    <select
                        value={String(value)}
                        onChange={(e) => onChange(field.key, e.target.value)}
                        className="w-full bg-transparent text-sm font-bold font-mono px-3 py-2 text-[var(--ink)] outline-none"
                    >
                        {hasOptionGroups
                            ? optionGroups!.map((g) => (
                                <optgroup key={g.label} label={g.label}>
                                    {g.options.map((o) => (
                                        <option key={String(o.value)} value={String(o.value)} className="bg-[var(--bg-1)]">{o.label}</option>
                                    ))}
                                </optgroup>
                            ))
                            : field.options!.map((o) => (
                                <option key={String(o.value)} value={String(o.value)} className="bg-[var(--bg-1)]">{o.label}</option>
                            ))}
                    </select>
                ) : (
                    <>
                        <input
                            type="number"
                            value={value}
                            min={field.validation?.min}
                            max={field.validation?.max}
                            step={field.validation?.step ?? 'any'}
                            onChange={(e) => onChange(field.key, e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full bg-transparent text-sm font-black font-mono px-3 py-2 text-[var(--ink)] outline-none"
                        />
                        {field.unit && field.unit !== '-' && (
                            <span className="absolute right-3 text-[10px] font-bold text-[var(--alu-dim)]">{field.unit}</span>
                        )}
                    </>
                )}
            </div>
            {field.description && <p className="text-[9px] leading-snug text-[var(--alu-dim)]">{field.description}</p>}
        </div>
    );
}

const GROUP_LABELS: Record<string, string> = {
    selection: '1. Select Drive Type',
    geometry: '2. Geometry',
    load: '3. Load Case',
    operating: '4. Operating Data',
};

export function DriveCalcWorkbench({ schema }: { schema: CalculatorSchemaV2 }) {
    const precision = useGlobalPrecision();
    const defaults = useMemo(() => {
        const d: Record<string, number | string> = {};
        schema.inputs.forEach((f) => { d[f.key] = (f as any).defaultValue ?? ''; });
        return d;
    }, [schema]);

    const [values, setValues] = useState(() => {
        const d = { ...defaults };
        if (schema.id === 'belt-drive') {
            const family = (d.beltType ?? 'classical-v') as BeltDriveKind;
            const valid = profilesForFamily(family).some((p) => p.id === d.beltProfile);
            if (!valid) d.beltProfile = defaultProfileForFamily(family).id;
        }
        return d;
    });
    const [assumptionsOpen, setAssumptionsOpen] = useState(false);

    useEffect(() => {
        setValues((prev) => {
            if (schema.id !== 'belt-drive') return defaults;
            const merged = { ...defaults, ...prev };
            const family = (merged.beltType ?? 'classical-v') as BeltDriveKind;
            const valid = profilesForFamily(family).some((p) => p.id === merged.beltProfile);
            if (!valid) merged.beltProfile = defaultProfileForFamily(family).id;
            return merged;
        });
    }, [defaults, schema.id]);

    const handleChange = useCallback((key: string, v: number | string) => {
        setValues((prev) => {
            const next = { ...prev, [key]: v };
            if (key === 'chainSize') {
                const size = ROLLER_CHAIN_SIZES.find((r) => r.id === v);
                if (size && size.pitchMm > 0) {
                    next.pitch = size.pitchMm;
                }
            }
            if (key === 'pitch') {
                const pVal = Number(v);
                const match = ROLLER_CHAIN_SIZES.find((r) => Math.abs(r.pitchMm - pVal) < 0.01);
                if (match) {
                    next.chainSize = match.id;
                }
            }
            if (key === 'beltType') {
                const family = v as BeltDriveKind;
                next.beltProfile = defaultProfileForFamily(family).id;
                const profile = defaultProfileForFamily(family);
                const pitch = profile.pitchMm ?? 8;
                if (family === 'timing' && prev.beltType !== 'timing') {
                    next.z1 = pulleyTeethFromPitchDiameter(num(prev.d1, 100), pitch);
                    next.z2 = pulleyTeethFromPitchDiameter(num(prev.d2, 250), pitch);
                } else if (prev.beltType === 'timing' && family !== 'timing') {
                    const prevProfile = resolveBeltProfile(String(prev.beltProfile), 'timing');
                    const prevPitch = prevProfile.pitchMm ?? 8;
                    next.d1 = Math.round(pitchDiameterFromTeeth(prevPitch, num(prev.z1, 30)));
                    next.d2 = Math.round(pitchDiameterFromTeeth(prevPitch, num(prev.z2, 60)));
                }
            }
            return next;
        });
    }, []);

    const { outputs, warnings } = useMemo(() => {
        try {
            const validated: Record<string, ValidatedEngineeringValue> = {};
            schema.inputs.forEach((input) => {
                validated[input.key] = createValidatedValue(values[input.key] as any, input.unit, 'user');
            });
            const result = schema.calculationEngine(validated);
            const out: Record<string, number> = {};
            Object.entries(result.outputs).forEach(([k, v]) => { out[k] = v.value as number; });
            return { outputs: out, warnings: result.warnings ?? [] };
        } catch {
            return { outputs: {} as Record<string, number>, warnings: [] };
        }
    }, [schema, values]);

    const isChain = schema.id === 'chain-drive';
    const isBelt = schema.id === 'belt-drive';
    const accent = isChain ? '#00e5ff' : '#f59e0b';

    const isTimingBelt = isBelt && values.beltType === 'timing';

    const timingProfileOptionGroups = useMemo(() => {
        if (!isTimingBelt) return undefined;
        return timingProfileGroups().map((g) => ({
            label: g.label,
            options: g.profiles.map((p) => ({ label: p.label, value: p.id })),
        }));
    }, [isTimingBelt]);

    const selectedTimingProfile = useMemo(() => {
        if (!isTimingBelt) return null;
        return resolveBeltProfile(String(values.beltProfile ?? 'htd-8m'), 'timing');
    }, [isTimingBelt, values.beltProfile]);

    const beltGeometry = useMemo(() => {
        if (!isTimingBelt) {
            return {
                d1: num(values.d1, 100),
                d2: num(values.d2, 250),
                z1: undefined as number | undefined,
                z2: undefined as number | undefined,
                pitch: undefined as number | undefined,
                od1: undefined as number | undefined,
                od2: undefined as number | undefined,
                C_actual: undefined as number | undefined,
                C_target: undefined as number | undefined,
            };
        }
        const profile = resolveBeltProfile(String(values.beltProfile ?? 'htd-8m'), 'timing');
        const pitch = profile.pitchMm ?? 8;
        const z1 = Math.round(num(values.z1, 30));
        const z2 = Math.round(num(values.z2, 60));
        const pld = timingPldForProfile(profile);
        const d1 = pitchDiameterFromTeeth(pitch, z1);
        const d2 = pitchDiameterFromTeeth(pitch, z2);
        const C_target = num(values.centerDist, 500);
        const snap = snapTimingBeltCatalog(Math.min(d1, d2), Math.max(d1, d2), C_target, pitch);
        return {
            z1,
            z2,
            pitch,
            d1,
            d2,
            od1: timingOutsideDiameterMm(pitch, z1, pld),
            od2: timingOutsideDiameterMm(pitch, z2, pld),
            C_actual: snap.C_actual,
            C_target,
        };
    }, [isTimingBelt, values.beltProfile, values.d1, values.d2, values.z1, values.z2, values.centerDist]);

    const visibleOutputs = useMemo(() => {
        if (!isBelt) return schema.outputs;
        const isTiming = values.beltType === 'timing';
        return schema.outputs.filter((o) => isTiming || (o.key !== 'beltTeeth' && o.key !== 'catalogLength' && o.key !== 'centerDistActual' && o.key !== 'od1' && o.key !== 'od2' && o.key !== 'teethInMesh'));
    }, [schema.outputs, isBelt, values.beltType]);

    const headerOutputs = useMemo(() => {
        if (isBelt) {
            const design = schema.outputs.find((o) => o.key === 'designPower');
            const length = schema.outputs.find((o) => o.key === 'beltLength');
            return [design, length].filter(Boolean) as typeof schema.outputs;
        }
        return schema.outputs.slice(0, 2);
    }, [schema.outputs, isBelt]);

    const handleDownloadLayoutSvg = useCallback(() => {
        if (isChain) {
            downloadOpenDriveLayoutSvg({
                kind: 'chain',
                d1: outputs.d1 || num(values.d1, 100),
                d2: outputs.d2 || num(values.d2, 250),
                C: num(values.centerDist, 500),
                z1: num(values.z1, 19),
                z2: num(values.z2, 57),
                pitch: num(values.pitch, 15.875),
                od1: outputs.od1,
                od2: outputs.od2,
                title: `ISO 606 chain ${String(values.chainSize ?? '10B')}`,
            }, `chain_drive_layout_z${num(values.z1, 19)}_${num(values.z2, 57)}_C${num(values.centerDist, 500)}.svg`);
            return;
        }
        downloadOpenDriveLayoutSvg({
            kind: 'belt',
            d1: beltGeometry.d1,
            d2: beltGeometry.d2,
            C: isTimingBelt && beltGeometry.C_actual != null ? beltGeometry.C_actual : num(values.centerDist, 500),
            z1: beltGeometry.z1,
            z2: beltGeometry.z2,
            pitch: beltGeometry.pitch,
            od1: beltGeometry.od1,
            od2: beltGeometry.od2,
            title: `Belt drive ${String(values.beltType ?? 'V')}`,
        }, `belt_drive_layout_d${beltGeometry.d1.toFixed(0)}_${beltGeometry.d2.toFixed(0)}.svg`);
    }, [isChain, isTimingBelt, values, beltGeometry, outputs]);

    const handleDownloadLayoutDxf = useCallback(() => {
        const dxf = isChain
            ? chainDriveDxf({
                dp1: outputs.d1 || 0,
                dp2: outputs.d2 || 0,
                da1: outputs.od1 || outputs.d1 || 0,
                da2: outputs.od2 || outputs.d2 || 0,
                z1: num(values.z1, 19),
                z2: num(values.z2, 57),
                C: num(values.centerDist, 500),
                p: num(values.pitch, 15.875),
            })
            : beltDriveDxf({
                d1: beltGeometry.d1,
                d2: beltGeometry.d2,
                C: isTimingBelt && beltGeometry.C_actual != null ? beltGeometry.C_actual : num(values.centerDist, 500),
            });
        const blob = new Blob([dxf], { type: 'application/dxf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = isChain ? 'chain_drive_layout.dxf' : 'belt_drive_layout.dxf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, [isChain, isTimingBelt, values, beltGeometry, outputs]);

    const handleExportTo3D = useCallback(() => {
        if (isChain) {
            const size = ROLLER_CHAIN_SIZES.find((r) => r.id === String(values.chainSize ?? '10b'));
            CrossModuleBridge.exportChainDriveTo3D(
                num(values.z1, 19),
                num(values.z2, 57),
                num(values.pitch, 15.875),
                num(values.centerDist, 500),
                {
                    switchWindow: true,
                    chainSize: String(values.chainSize ?? '10b'),
                    rollerDiameter: size?.rollerDiaMm,
                    faceWidth: size?.widthMm,
                }
            );
            return;
        }
        const family = (values.beltType ?? 'classical-v') as BeltDriveKind;
        const profile = resolveBeltProfile(String(values.beltProfile ?? 'a'), family);
        const beltWidth = profile.topWidthMm ?? profile.heightMm ?? 20;
        const C = isTimingBelt && beltGeometry.C_actual != null ? beltGeometry.C_actual : num(values.centerDist, 500);
        CrossModuleBridge.exportBeltDriveTo3D(beltGeometry.d1, beltGeometry.d2, C, beltWidth, {
            switchWindow: true,
            beltType: family,
            beltProfile: profile.id,
            z1: beltGeometry.z1,
            z2: beltGeometry.z2,
            pitch: beltGeometry.pitch,
            od1: beltGeometry.od1,
            od2: beltGeometry.od2,
            topWidthMm: profile.topWidthMm,
            heightMm: profile.heightMm,
            grooveHalfAngleDeg: BELT_DRIVE_TYPES[family]?.grooveHalfAngleDeg ?? undefined,
        });
    }, [isChain, isTimingBelt, values, beltGeometry]);
    const groupedInputs = useMemo(() => {
        const groups: Record<string, Field[]> = {};
        schema.inputs.forEach((field) => {
            const group = field.group ?? (
                ['power', 'serviceFactor', 'friction'].includes(field.key) ? 'load'
                    : ['rpm1'].includes(field.key) ? 'operating'
                        : ['beltType', 'chainType'].includes(field.key) ? 'selection'
                            : 'geometry'
            );
            groups[group] = [...(groups[group] ?? []), field];
        });
        const order = ['selection', 'geometry', 'load', 'operating'];
        return order.filter((key) => groups[key]).map((key) => [key, groups[key]] as const);
    }, [schema]);

    return (
        <div className="h-full flex flex-col overflow-hidden relative text-[var(--ink)]">
            <div className="absolute inset-0 bg-[var(--bg-0)]" />
            {/* Header */}
            <div className="relative z-10 flex-shrink-0 px-4 py-3 border-b border-[var(--line)] bg-[var(--bg-0)] flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-lg font-black tracking-tight uppercase">
                        {isChain ? (
                            <>Roller <span style={{ color: accent }}>Chain Drive</span></>
                        ) : (
                            <><span style={{ color: accent }}>Belt</span> Drive</>
                        )}
                    </h1>
                    <p className="text-[9px] font-mono tracking-[0.2em] text-[var(--alu-dim)] uppercase">{schema.metadata.verifiedStandards?.join(' | ')}</p>
                </div>
                <div className="flex gap-2 items-center">
                    <button
                        type="button"
                        onClick={handleDownloadLayoutSvg}
                        className="px-2.5 py-1.5 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 rounded-xl text-[9px] font-black uppercase transition-all flex items-center gap-1 cursor-pointer"
                        title="Download 1:1 layout SVG of the complete drive"
                    >
                        <Download size={13} />
                        SVG
                    </button>
                    <button
                        type="button"
                        onClick={handleDownloadLayoutDxf}
                        className="px-2.5 py-1.5 bg-[var(--bg-1)] hover:bg-[var(--bg-2)] text-[var(--ink)] border border-[var(--line)] rounded-xl text-[9px] font-black uppercase transition-all flex items-center gap-1 cursor-pointer"
                        title="Download AutoCAD DXF of the complete drive"
                    >
                        DXF
                    </button>
                    <button
                        type="button"
                        onClick={handleExportTo3D}
                        className="px-2.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-[var(--radius-s)] text-[9px] font-mono font-bold uppercase transition-all flex items-center gap-1 cursor-pointer"
                        title="Export pulleys / sprockets and belt/chain loop to 3D Design Studio"
                    >
                        <Box size={13} />
                        Export to 3D
                    </button>
                    {headerOutputs.map((o) => (
                        <div key={o.key} className="px-3 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--bg-1)] min-w-[96px]">
                            <div className="text-[8px] font-bold text-[var(--alu-dim)] uppercase tracking-wider truncate">{o.label}</div>
                            <div className="text-base font-black font-mono tabular-nums" style={{ color: accent }}>
                                {outputs[o.key] != null ? formatEngineeringValue(Number(outputs[o.key]), (o as any).precision !== undefined ? (o as any).precision : precision, true) : '-'}
                                <span className="text-[9px] text-[var(--alu-dim)] ml-1">{o.unit !== '-' ? o.unit : ''}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Body: inputs | diagram | results */}
            <div className="relative z-10 flex-1 min-h-0 flex flex-col md:flex-row gap-3 p-3 overflow-y-auto md:overflow-hidden custom-scrollbar">
                {/* Inputs */}
                <aside className="md:w-[250px] md:shrink-0 md:overflow-y-auto custom-scrollbar space-y-3">
                    <div className="text-[10px] font-black text-[var(--alu-dim)] uppercase tracking-[0.2em] flex items-center gap-2">
                        <Settings2 size={13} style={{ color: accent }} /> Parameters
                    </div>
                    <div className="space-y-3">
                        {groupedInputs.map(([group, fields]) => (
                            <section key={group} className="rounded-xl border border-[var(--line)] bg-[var(--bg-1)] p-3 space-y-2.5">
                                <h2 className="text-[9px] font-black uppercase tracking-[0.18em]" style={{ color: accent }}>{GROUP_LABELS[group] ?? group}</h2>
                                {fields
                                    .filter((f) => {
                                        if (!isBelt) return true;
                                        if (isTimingBelt) return f.key !== 'd1' && f.key !== 'd2';
                                        return f.key !== 'z1' && f.key !== 'z2';
                                    })
                                    .map((f) => {
                                    let field = f;
                                    let optionGroups: { label: string; options: { label: string; value: string }[] }[] | undefined;
                                    if (f.key === 'beltProfile') {
                                        const family = (values.beltType ?? 'classical-v') as BeltDriveKind;
                                        if (family === 'timing') {
                                            optionGroups = timingProfileOptionGroups;
                                        } else {
                                            field = {
                                                ...f,
                                                options: profilesForFamily(family).map((p) => ({ label: p.label, value: p.id })),
                                            };
                                        }
                                    }
                                    return (
                                        <React.Fragment key={f.key}>
                                            <CalcField
                                                field={field}
                                                value={values[f.key] ?? ''}
                                                accent={accent}
                                                onChange={handleChange}
                                                optionGroups={optionGroups}
                                            />
                                            {isTimingBelt && f.key === 'beltProfile' && selectedTimingProfile && (
                                                <p className="text-[9px] leading-snug text-[var(--alu-dim)] -mt-1 border-l border-[var(--line)] pl-2">
                                                    {selectedTimingProfile.usageNote}
                                                    {' · '}
                                                    p={selectedTimingProfile.pitchMm} mm
                                                    {selectedTimingProfile.profileShape && (
                                                        <> · {PROFILE_SHAPE_LABELS[selectedTimingProfile.profileShape]}</>
                                                    )}
                                                </p>
                                            )}
                                            {isTimingBelt && (f.key === 'z1' || f.key === 'z2') && beltGeometry.pitch != null && (
                                                <p className="text-[9px] font-mono text-cyan-400/70 -mt-1 pl-0.5 leading-relaxed">
                                                    dp{f.key === 'z1' ? '1' : '2'} = {formatEngineeringValue(f.key === 'z1' ? beltGeometry.d1 : beltGeometry.d2, precision, true)} mm
                                                    {' · '}
                                                    Do{f.key === 'z1' ? '1' : '2'} = {formatEngineeringValue((f.key === 'z1' ? beltGeometry.od1 : beltGeometry.od2) ?? 0, precision, true)} mm
                                                    <span className="text-[var(--alu-dim)]"> (azdırma)</span>
                                                </p>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </section>
                        ))}
                    </div>
                    {schema.documentation?.assumptions && schema.documentation.assumptions.length > 0 && (
                        <div className="pt-1">
                            <button type="button" onClick={() => setAssumptionsOpen(!assumptionsOpen)} className="w-full flex items-center justify-between p-2 rounded-lg border border-[var(--line)] bg-[var(--bg-1)] text-[10px] font-bold text-[var(--alu-dim)] uppercase">
                                <span className="flex items-center gap-2"><Info size={12} /> Assumptions</span>
                                {assumptionsOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                            </button>
                            {assumptionsOpen && (
                                <div className="mt-2 space-y-2">
                                    {schema.documentation.assumptions.map((a) => (
                                        <p key={a.id} className="text-[10px] text-[var(--alu-dim)] leading-relaxed border-l-2 pl-2" style={{ borderColor: `${accent}40` }}>{a.text}</p>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </aside>

                {/* Diagram */}
                <main className="flex-1 min-w-0 min-h-[360px] md:min-h-0 rounded-xl overflow-hidden border " style={{ borderColor: 'var(--line)', background: 'var(--bg-0)' }}>
                    {isChain ? (
                        <ChainDriveBlueprint
                            showLegend={false}
                            z1={num(values.z1, 19)}
                            z2={num(values.z2, 57)}
                            pitch={num(values.pitch, 15.875)}
                            centerDist={num(values.centerDist, 500)}
                            rpm1={num(values.rpm1, 1450)}
                            chainType={String(values.chainType ?? 'roller-simplex')}
                            chainSize={String(values.chainSize ?? '10b')}
                            ratio={outputs.ratio}
                            rpm2={outputs.rpm2}
                            chainVelocity={outputs.chainVelocity}
                            chainLength={outputs.chainLength}
                            chainTension={outputs.chainTension}
                            d1={outputs.d1}
                            d2={outputs.d2}
                            od1={outputs.od1}
                            od2={outputs.od2}
                            ratedPower={outputs.ratedPower}
                            powerUtilization={outputs.powerUtilization}
                            C_even={outputs.C_even}
                            centrifugalN={outputs.centrifugalN}
                        />
                    ) : (
                        <BeltDriveBlueprint
                            showLegend={false}
                            d1={beltGeometry.d1}
                            d2={beltGeometry.d2}
                            od1={beltGeometry.od1}
                            od2={beltGeometry.od2}
                            z1={beltGeometry.z1}
                            z2={beltGeometry.z2}
                            centerDist={isTimingBelt && beltGeometry.C_actual != null ? beltGeometry.C_actual : num(values.centerDist, 500)}
                            centerDistTarget={isTimingBelt ? beltGeometry.C_target : undefined}
                            beltType={String(values.beltType ?? 'classical-v')}
                            rpm1={num(values.rpm1, 1450)}
                            rpm2={outputs.rpm2}
                            beltVelocity={outputs.beltVelocity}
                            beltLength={outputs.beltLength}
                            arcOfContact={outputs.arcOfContact}
                            T1={outputs.T1}
                            T2={outputs.T2}
                            Tc={outputs.Tc}
                            shaftLoad={outputs.shaftLoad}
                            flexHz={outputs.flexHz}
                            teethInMesh={outputs.teethInMesh}
                            pitch={selectedTimingProfile?.pitchMm}
                            beltWidth={selectedTimingProfile?.topWidthMm}
                            beltHeight={selectedTimingProfile?.heightMm}
                            profileLabel={selectedTimingProfile?.label}
                        />
                    )}
                </main>

                {/* Results */}
                <aside className="md:w-[320px] md:shrink-0 md:overflow-y-auto custom-scrollbar space-y-2">
                    {warnings.length > 0 && (
                        <div className="space-y-1.5">
                            {warnings.map((w, i) => (
                                <div key={i} className={`flex items-start gap-2 px-3 py-2 rounded-lg border text-[10px] font-bold uppercase ${
                                    w.severity === 'critical'
                                        ? 'border-red-500/30 bg-red-500/10 text-red-400'
                                        : w.severity === 'warning'
                                        ? 'border-amber-500/20 bg-amber-500/5 text-amber-400'
                                        : 'border-blue-500/20 bg-blue-500/5 text-blue-400'
                                }`}>
                                    <AlertTriangle size={13} className="shrink-0 mt-0.5" /> {w.message}
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-1)]/60 p-3">
                        <div className="text-[10px] font-black text-[var(--alu-dim)] uppercase tracking-[0.2em] mb-2.5 flex items-center gap-2">
                            <Zap size={13} style={{ color: accent }} /> Engineering Results
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
                            {visibleOutputs.map((o) => (
                                <div key={o.key} className="flex items-baseline justify-between gap-2 rounded-lg bg-[var(--bg-1)] border border-[var(--line)] px-3 py-2">
                                    <span className="text-[9px] font-bold text-[var(--alu-dim)] uppercase tracking-wider">{o.label}</span>
                                    <span className="font-mono text-sm font-black tabular-nums whitespace-nowrap" style={{ color: accent }}>
                                        {outputs[o.key] != null ? formatEngineeringValue(Number(outputs[o.key]), (o as any).precision !== undefined ? (o as any).precision : precision, true) : '-'}
                                        <span className="text-[9px] text-[var(--alu-dim)] ml-1">{o.unit !== '-' ? o.unit : ''}</span>
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}

export default DriveCalcWorkbench;
