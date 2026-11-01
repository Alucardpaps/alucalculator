'use client';

import React from 'react';
import { DynamicBlockDef } from '../blocks/dynamic/types';
import { CadEntity } from '../kernel/types';
import { Zap, Sliders, ArrowLeftRight, ArrowUpDown, Eye, BookOpen, Layers, Scissors, ExternalLink, Check } from 'lucide-react';

interface DynamicBlockPropertiesSectionProps {
    blockDef: DynamicBlockDef;
    entity: CadEntity;
    updateDynamicBlock: (blockInstanceId: string, patchParams: Record<string, any>) => void;
    onOpenStudio?: () => void;
    onExplode?: () => void;
}

function getCalculatorInfo(blockDef: DynamicBlockDef, params: Record<string, any>): {
    route: string;
    label: string;
    queryUrl: string;
} | null {
    let route = blockDef.calculatorRoute;
    let label = blockDef.calculatorLabelTr || 'İlgili Mühendislik Hesabına Git';

    if (!route) {
        if (blockDef.id === 'dyn_involute_gear') {
            route = '/gears';
            label = '⚙️ Dişli Mukavemet & KTR Kilit Hesabı (ISO 6336)';
        } else if (blockDef.id === 'dyn_fastener' || blockDef.id.includes('fastener')) {
            route = '/bolt-torque';
            label = '🔩 Cıvata Tork & Ön Gerilme Hesabı (VDI 2230)';
        } else if (blockDef.id === 'dyn_timing_pulley') {
            route = '/belt-drive';
            label = '⏱️ Triger Kayış & Kasnak Hesabı (ISO 13050)';
        } else if (blockDef.id === 'dyn_roller_sprocket') {
            route = '/chain-drive';
            label = '⛓️ Makaralı Zincir & Dişli Hesabı (ISO 606)';
        } else if (blockDef.id === 'dyn_steel_beam') {
            route = '/profile-weight';
            label = '🏗️ Profil & Kiriş Hesabı (EN 1993)';
        }
    }

    if (!route) return null;

    const query = new URLSearchParams();
    if (blockDef.id === 'dyn_involute_gear') {
        if (params.module) query.set('module', String(params.module));
        if (params.teeth) query.set('z1', String(params.teeth));
        if (params.teeth2) query.set('z2', String(params.teeth2));
        if (params.faceWidth) query.set('b', String(params.faceWidth));
        if (params.helixAngle) query.set('beta', String(params.helixAngle));
        if (params.shaftConnection) query.set('lock', String(params.shaftConnection));
        if (params.shaftDiameter) query.set('d1', String(params.shaftDiameter));
    } else if (blockDef.id === 'dyn_fastener') {
        if (params.nominalDiameter) query.set('size', String(params.nominalDiameter));
        if (params.length) query.set('length', String(params.length));
        if (params.grade) query.set('grade', String(params.grade));
    } else if (blockDef.id === 'dyn_timing_pulley') {
        if (params.teeth) query.set('z1', String(params.teeth));
        if (params.teeth2) query.set('z2', String(params.teeth2));
        if (params.centerDistance) query.set('a', String(params.centerDistance));
    } else if (blockDef.id === 'dyn_roller_sprocket') {
        if (params.chainPitch) query.set('pitch', String(params.chainPitch));
        if (params.teeth) query.set('z1', String(params.teeth));
        if (params.teeth2) query.set('z2', String(params.teeth2));
        if (params.centerDistance) query.set('a', String(params.centerDistance));
    }

    const queryString = query.toString();
    const queryUrl = queryString ? `${route}?${queryString}` : route;

    return { route, label, queryUrl };
}

export function DynamicBlockPropertiesSection({
    blockDef,
    entity,
    updateDynamicBlock,
    onOpenStudio,
    onExplode
}: DynamicBlockPropertiesSectionProps) {
    const params = {
        ...blockDef.defaultValues,
        ...(entity.dynamicParams || {})
    };

    const calcInfo = getCalculatorInfo(blockDef, params);

    const handleParamChange = (key: string, value: any) => {
        if (!entity.blockInstanceId) return;
        updateDynamicBlock(entity.blockInstanceId, { [key]: value });
    };

    const handleLookupSelect = (lookupId: string, optionId: string) => {
        if (!entity.blockInstanceId) return;
        const lookup = blockDef.lookupParams?.find(l => l.id === lookupId);
        if (!lookup) return;
        const option = lookup.options.find(o => o.id === optionId);
        if (!option) return;
        updateDynamicBlock(entity.blockInstanceId, option.values);
    };

    return (
        <div className="border border-cyan-500/30 bg-[var(--bg-0)] rounded-lg p-3 space-y-3 shadow-lg ">
            {/* Header Badge */}
            <div className="flex items-start justify-between gap-2 border-b border-cyan-500/20 pb-2.5">
                <div className="flex items-center gap-2">
                    <span className="text-xl p-1.5 bg-cyan-950/50 border border-cyan-500/30 rounded-md select-none">
                        {blockDef.icon}
                    </span>
                    <div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-bold text-cyan-300 font-mono tracking-wide">
                                {blockDef.nameTr}
                            </span>
                            <span className="px-1.5 py-0.2 text-[9px] bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 rounded font-mono font-semibold">
                                DYNAMIC
                            </span>
                        </div>
                        <div className="text-[9px] text-slate-400 font-mono truncate max-w-[190px]">
                            {blockDef.name}
                        </div>
                    </div>
                </div>

                {onOpenStudio && (
                    <button
                        type="button"
                        onClick={onOpenStudio}
                        title="Dinamik Blok Görsel Stüdyosu'nda Aç"
                        className="p-1 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:border-cyan-400 transition-colors shrink-0"
                    >
                        <ExternalLink size={13} />
                    </button>
                )}
            </div>

            {/* Standard Citation Banner */}
            <div className="flex items-center gap-2 px-2 py-1.5 bg-cyan-950/30 border border-cyan-800/40 rounded text-[9px] font-mono text-cyan-200/90">
                <BookOpen size={11} className="text-cyan-400 shrink-0" />
                <div className="truncate">
                    <span className="text-cyan-400 font-bold">{blockDef.citation.standard}</span>
                    {blockDef.citation.clause && (
                        <span className="text-slate-400 ml-1">({blockDef.citation.clause})</span>
                    )}
                </div>
            </div>

            {/* Engineering Calculation Shortcut Banner ("Sayfaya Uğra / Hesap Modülüne Git") */}
            {calcInfo && (
                <div className="pt-0.5">
                    <a
                        href={calcInfo.queryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Mühendislik hesaplama modülüne git (yeni sekmede canlı parametrelerle açılır)"
                        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 hover:text-cyan-100 border border-cyan-500/40 hover:border-cyan-400 transition-all text-[9.5px] font-mono group shadow-sm "
                    >
                        <div className="flex items-center gap-1.5 truncate">
                            <Zap size={12} className="text-cyan-400 group-hover:scale-110 transition-transform shrink-0" />
                            <span className="font-semibold truncate">{calcInfo.label}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 text-cyan-400/90 group-hover:text-cyan-300 ml-1">
                            <span className="text-[8.5px] uppercase tracking-wider font-bold">Sayfaya Uğra</span>
                            <ExternalLink size={10} />
                        </div>
                    </a>
                </div>
            )}

            {/* 1. LOOKUP PRESETS (Standart Seçici) */}
            {blockDef.lookupParams && blockDef.lookupParams.length > 0 && (
                <div className="space-y-1.5 pt-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                        <Layers size={11} className="text-cyan-400" />
                        <span>Standart Tip / Boyut</span>
                    </div>
                    {blockDef.lookupParams.map(lookup => {
                        // Find matching option
                        const matchedOption = lookup.options.find(opt => {
                            return Object.entries(opt.values).every(([k, v]) => params[k] === v);
                        });

                        return (
                            <div key={lookup.id} className="space-y-1">
                                <label className="text-[9px] text-slate-400 font-mono block">
                                    {lookup.labelTr || lookup.label}
                                </label>
                                <select
                                    value={matchedOption?.id || ''}
                                    onChange={(e) => handleLookupSelect(lookup.id, e.target.value)}
                                    className="w-full bg-[var(--bg-1)] border border-cyan-800/50 hover:border-cyan-500/60 rounded px-2 py-1 text-slate-200 text-[10px] font-mono outline-none focus:border-cyan-400 cursor-pointer"
                                >
                                    <option value="" disabled>Özel Değerler (Özelleştirilmiş)</option>
                                    {lookup.options.map(opt => (
                                        <option key={opt.id} value={opt.id}>
                                            {opt.label} {opt.standard ? `[${opt.standard}]` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* 2. VISIBILITY STATES (Görünüm Durumları) */}
            {blockDef.visibilityParam && (
                <div className="space-y-1.5 pt-1 border-t border-slate-800">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                        <Eye size={11} className="text-purple-400" />
                        <span>{blockDef.visibilityParam.labelTr || blockDef.visibilityParam.label}</span>
                    </div>
                    <select
                        value={params[blockDef.visibilityParam.id] || blockDef.visibilityParam.default}
                        onChange={(e) => handleParamChange(blockDef.visibilityParam!.id, e.target.value)}
                        className="w-full bg-[var(--bg-1)] border border-purple-800/50 hover:border-purple-500/60 rounded px-2 py-1 text-slate-200 text-[10px] font-mono outline-none focus:border-purple-400 cursor-pointer"
                    >
                        {blockDef.visibilityParam.states.map(state => (
                            <option key={state.id} value={state.id}>
                                {state.labelTr || state.label}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* 3. FLIP PARAMETERS (Yön Aynalama) */}
            {blockDef.flipParams && blockDef.flipParams.length > 0 && (
                <div className="space-y-1.5 pt-1 border-t border-slate-800">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                        <ArrowLeftRight size={11} className="text-amber-400" />
                        <span>Yön & Aynalama</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                        {blockDef.flipParams.map(flip => {
                            const isFlipped = !!params[flip.id];
                            const Icon = flip.axis === 'vertical' ? ArrowUpDown : ArrowLeftRight;
                            return (
                                <button
                                    key={flip.id}
                                    type="button"
                                    onClick={() => handleParamChange(flip.id, !isFlipped)}
                                    className={`flex items-center justify-between px-2 py-1.5 rounded border text-[9px] font-mono transition-all ${
                                        isFlipped
                                            ? 'bg-amber-500/20 border-amber-500/60 text-amber-200 shadow-sm '
                                            : 'bg-[var(--bg-1)] border-slate-700/80 hover:border-slate-500 text-slate-300'
                                    }`}
                                >
                                    <div className="flex items-center gap-1 truncate">
                                        <Icon size={11} className={isFlipped ? 'text-amber-400' : 'text-slate-500'} />
                                        <span className="truncate">{flip.labelTr || flip.label}</span>
                                    </div>
                                    <span className={`text-[8px] font-bold px-1 rounded ${isFlipped ? 'bg-[var(--cyan)] text-[var(--accent-ink)]' : 'bg-slate-800 text-slate-400'}`}>
                                        {isFlipped ? 'TERS' : 'DÜZ'}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* 4. LINEAR PARAMETERS (Ölçü Esnetme Sliders) */}
            {blockDef.linearParams && blockDef.linearParams.length > 0 && (
                <div className="space-y-2 pt-1 border-t border-slate-800">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                        <Sliders size={11} className="text-cyan-400" />
                        <span>Parametrik Ölçüler</span>
                    </div>
                    <div className="space-y-2">
                        {blockDef.linearParams.map(param => {
                            const val = Number(params[param.id] ?? param.default);
                            return (
                                <div key={param.id} className="space-y-1">
                                    <div className="flex items-center justify-between text-[9px] font-mono">
                                        <span className="text-slate-400">{param.labelTr || param.label}</span>
                                        <div className="flex items-center gap-1">
                                            <input
                                                type="number"
                                                min={param.min}
                                                max={param.max}
                                                step={param.step}
                                                value={val}
                                                onChange={(e) => handleParamChange(param.id, Number(e.target.value))}
                                                className="w-14 bg-[var(--bg-1)] border border-cyan-800/40 focus:border-cyan-400 rounded px-1 py-0.5 text-right text-cyan-300 font-mono text-[10px] outline-none"
                                            />
                                            <span className="text-slate-500 text-[8px]">{param.unit}</span>
                                        </div>
                                    </div>
                                    <input
                                        type="range"
                                        min={param.min}
                                        max={param.max}
                                        step={param.step}
                                        value={val}
                                        onChange={(e) => handleParamChange(param.id, Number(e.target.value))}
                                        className="w-full accent-[var(--cyan)] h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <div className="flex justify-between text-[8px] text-slate-600 font-mono">
                                        <span>{param.min} {param.unit}</span>
                                        <span>{param.max} {param.unit}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Explode / Convert to static */}
            {onExplode && (
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={onExplode}
                        className="w-full flex items-center justify-center gap-1.5 px-2 py-1 rounded border border-rose-900/40 bg-rose-950/20 hover:bg-rose-900/40 text-rose-300 hover:text-rose-100 text-[9px] font-mono transition-colors"
                    >
                        <Scissors size={11} />
                        <span>Bloku Patlat (Statik Çizgiye Dönüştür)</span>
                    </button>
                </div>
            )}
        </div>
    );
}
