'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, Info, Settings2, Zap } from 'lucide-react';
import type { CalculatorSchemaV2 } from '@/types/calculator-schema-v2';
import { createValidatedValue, type ValidatedEngineeringValue } from '@/types/engineering';
import { ChainDriveBlueprint } from '@/components/visualizers/ChainDriveBlueprint';
import { BeltDriveBlueprint } from '@/components/visualizers/BeltDriveBlueprint';
import { defaultProfileForFamily, pitchDiameterFromTeeth, profilesForFamily, pulleyTeethFromPitchDiameter, PROFILE_SHAPE_LABELS, resolveBeltProfile, timingOutsideDiameterMm, timingPldForProfile, timingProfileGroups, type BeltDriveKind } from '@/data/mechanical/driveTypes';
import { snapTimingBeltCatalog } from '@/components/visualizers/techframe-utils';

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
            <label className="text-[10px] font-bold text-white/45 uppercase tracking-wider group-focus-within:text-white transition-colors">{field.label}</label>
            <div className="relative flex items-center bg-white/[0.04] border border-white/10 rounded-lg overflow-hidden focus-within:border-white/30" style={{ ['--tw-ring-color' as any]: accent }}>
                {hasOptions ? (
                    <select
                        value={String(value)}
                        onChange={(e) => onChange(field.key, e.target.value)}
                        className="w-full bg-transparent text-sm font-bold font-mono px-3 py-2 text-white outline-none"
                    >
                        {hasOptionGroups
                            ? optionGroups!.map((g) => (
                                <optgroup key={g.label} label={g.label}>
                                    {g.options.map((o) => (
                                        <option key={String(o.value)} value={String(o.value)} className="bg-[#0b121d]">{o.label}</option>
                                    ))}
                                </optgroup>
                            ))
                            : field.options!.map((o) => (
                                <option key={String(o.value)} value={String(o.value)} className="bg-[#0b121d]">{o.label}</option>
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
                            className="w-full bg-transparent text-sm font-black font-mono px-3 py-2 text-white outline-none"
                        />
                        {field.unit && field.unit !== '-' && (
                            <span className="absolute right-3 text-[10px] font-bold text-white/30">{field.unit}</span>
                        )}
                    </>
                )}
            </div>
            {field.description && <p className="text-[9px] leading-snug text-white/30">{field.description}</p>}
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
        return schema.outputs.filter((o) => isTiming || (o.key !== 'beltTeeth' && o.key !== 'catalogLength' && o.key !== 'centerDistActual' && o.key !== 'od1' && o.key !== 'od2'));
    }, [schema.outputs, isBelt, values.beltType]);

    const headerOutputs = useMemo(() => {
        if (isBelt) {
            const design = schema.outputs.find((o) => o.key === 'designPower');
            const length = schema.outputs.find((o) => o.key === 'beltLength');
            return [design, length].filter(Boolean) as typeof schema.outputs;
        }
        return schema.outputs.slice(0, 2);
    }, [schema.outputs, isBelt]);
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
        <div className="h-full flex flex-col overflow-hidden relative text-white">
            <div className="absolute inset-0 bg-[#03060a]" />
            {/* Header */}
            <div className="relative z-10 flex-shrink-0 px-4 py-3 border-b border-white/10 bg-[#03060a] flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-lg font-black italic tracking-tight uppercase">
                        {isChain ? (
                            <>Roller <span style={{ color: accent }}>Chain Drive</span></>
                        ) : (
                            <><span style={{ color: accent }}>Belt</span> Drive</>
                        )}
                    </h1>
                    <p className="text-[9px] font-mono tracking-[0.2em] text-white/30 uppercase">{schema.metadata.verifiedStandards?.join(' | ')}</p>
                </div>
                <div className="flex gap-2">
                    {headerOutputs.map((o) => (
                        <div key={o.key} className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.03] min-w-[96px]">
                            <div className="text-[8px] font-bold text-white/40 uppercase tracking-wider truncate">{o.label}</div>
                            <div className="text-base font-black font-mono tabular-nums" style={{ color: accent }}>
                                {outputs[o.key] != null ? Number(outputs[o.key]).toFixed(o.precision ?? 2) : '-'}
                                <span className="text-[9px] text-white/30 ml-1">{o.unit !== '-' ? o.unit : ''}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Body: inputs | diagram | results */}
            <div className="relative z-10 flex-1 min-h-0 flex flex-col md:flex-row gap-3 p-3 overflow-y-auto md:overflow-hidden custom-scrollbar">
                {/* Inputs */}
                <aside className="md:w-[250px] md:shrink-0 md:overflow-y-auto custom-scrollbar space-y-3">
                    <div className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Settings2 size={13} style={{ color: accent }} /> Parameters
                    </div>
                    <div className="space-y-3">
                        {groupedInputs.map(([group, fields]) => (
                            <section key={group} className="rounded-xl border border-white/5 bg-white/[0.025] p-3 space-y-2.5">
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
                                                <p className="text-[9px] leading-snug text-white/35 -mt-1 border-l border-white/10 pl-2">
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
                                                    dp{f.key === 'z1' ? '1' : '2'} = {(f.key === 'z1' ? beltGeometry.d1 : beltGeometry.d2).toFixed(1)} mm
                                                    {' · '}
                                                    Do{f.key === 'z1' ? '1' : '2'} = {(f.key === 'z1' ? beltGeometry.od1 : beltGeometry.od2)?.toFixed(1)} mm
                                                    <span className="text-white/25"> (azdırma)</span>
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
                            <button type="button" onClick={() => setAssumptionsOpen(!assumptionsOpen)} className="w-full flex items-center justify-between p-2 rounded-lg border border-white/5 bg-white/[0.02] text-[10px] font-bold text-white/45 uppercase">
                                <span className="flex items-center gap-2"><Info size={12} /> Assumptions</span>
                                {assumptionsOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                            </button>
                            {assumptionsOpen && (
                                <div className="mt-2 space-y-2">
                                    {schema.documentation.assumptions.map((a) => (
                                        <p key={a.id} className="text-[10px] text-white/40 leading-relaxed border-l-2 pl-2" style={{ borderColor: `${accent}40` }}>{a.text}</p>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </aside>

                {/* Diagram */}
                <main className="flex-1 min-w-0 min-h-[360px] md:min-h-0 rounded-xl overflow-hidden border shadow-[inset_0_0_80px_rgba(0,0,0,0.45)]" style={{ borderColor: `${accent}33`, background: '#050810' }}>
                    {isChain ? (
                        <ChainDriveBlueprint
                            showLegend={false}
                            z1={num(values.z1, 19)}
                            z2={num(values.z2, 57)}
                            pitch={num(values.pitch, 15.875)}
                            centerDist={num(values.centerDist, 500)}
                            rpm1={num(values.rpm1, 1450)}
                            chainType={String(values.chainType ?? 'roller-simplex')}
                            ratio={outputs.ratio}
                            rpm2={outputs.rpm2}
                            chainVelocity={outputs.chainVelocity}
                            chainLength={outputs.chainLength}
                            chainTension={outputs.chainTension}
                            d1={outputs.d1}
                            d2={outputs.d2}
                            od1={outputs.od1}
                            od2={outputs.od2}
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
                        />
                    )}
                </main>

                {/* Results */}
                <aside className="md:w-[320px] md:shrink-0 md:overflow-y-auto custom-scrollbar space-y-2">
                    {warnings.length > 0 && (
                        <div className="space-y-1.5">
                            {warnings.map((w, i) => (
                                <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-lg border border-amber-500/20 bg-amber-500/5 text-amber-400 text-[10px] font-bold uppercase">
                                    <AlertTriangle size={13} className="shrink-0 mt-0.5" /> {w.message}
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="rounded-xl border border-white/5 bg-[#0a1018]/60 p-3">
                        <div className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-2.5 flex items-center gap-2">
                            <Zap size={13} style={{ color: accent }} /> Engineering Results
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
                            {visibleOutputs.map((o) => (
                                <div key={o.key} className="flex items-baseline justify-between gap-2 rounded-lg bg-white/[0.03] border border-white/5 px-3 py-2">
                                    <span className="text-[9px] font-bold text-white/40 uppercase tracking-wider">{o.label}</span>
                                    <span className="font-mono text-sm font-black tabular-nums whitespace-nowrap" style={{ color: accent }}>
                                        {outputs[o.key] != null ? Number(outputs[o.key]).toFixed(o.precision ?? 2) : '-'}
                                        <span className="text-[9px] text-white/30 ml-1">{o.unit !== '-' ? o.unit : ''}</span>
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
