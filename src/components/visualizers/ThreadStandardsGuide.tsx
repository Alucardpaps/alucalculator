'use client';

import React, { useState, useRef } from 'react';
import {
    Download,
    Shapes,
    FileText,
    GitCompare,
    ArrowLeftRight,
    RotateCw,
    Maximize2,
    Compass,
    ShieldCheck,
} from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';

export type StandardsGuideSubTab =
    | 'shape_atlas'
    | 'iso_metric'
    | 'inch_whitworth'
    | 'taper_vs_cylindrical'
    | 'rh_vs_lh'
    | 'pitch_density'
    | 'assembly_fit'
    | 'pipe_sealing';

export interface ThreadStandardsGuideProps {
    currentType?: string;
    nominalDia?: number;
    pitch?: number;
}

/**
 * Thread-form silhouettes for the shape atlas, generated from basic-profile proportions
 * (not hand-typed paths): ISO 68-1 60° (crest P/8, root P/4, depth 5H/8), ISO 2901 Tr 30°
 * (depth 0.5P, flats 0.366P), ASME B1.9 buttress 7°/45° (depth 0.6P), DIN 405 round
 * (crest R 0.2385P, root R 0.256P, 30° flanks, depth 0.5P), square (depth 0.5P).
 * Card space: x 20…160, root line y = 155 (y down), body to y = 195.
 */
function atlasFormPath(kind: 'tri' | 'tr' | 'buttress' | 'round' | 'square'): string {
    const x0 = 20, x1 = 160, yRoot = 155, yBase = 195, P = 70;
    const tan = (deg: number) => Math.tan((deg * Math.PI) / 180);
    const rad = (deg: number) => (deg * Math.PI) / 180;
    const unit = (x: number): [number, number][] => {
        switch (kind) {
            case 'tri': {
                const h = (5 * 0.866025 * P) / 8, run = h * tan(30), yc = yRoot - h;
                return [[x, yRoot], [x + P / 8, yRoot], [x + P / 8 + run, yc], [x + P / 4 + run, yc], [x + P / 4 + 2 * run, yRoot]];
            }
            case 'tr': {
                const h = 0.5 * P, run = h * tan(15), f = 0.366 * P, yc = yRoot - h;
                return [[x, yRoot], [x + f / 2, yRoot], [x + f / 2 + run, yc], [x + 1.5 * f + run, yc], [x + 1.5 * f + 2 * run, yRoot]];
            }
            case 'buttress': {
                const h = 0.6 * P, load = h * tan(7), trail = h * tan(45), yc = yRoot - h, flat = (P - load - trail) / 2;
                return [[x, yRoot], [x + flat / 2, yRoot], [x + flat / 2 + trail, yc], [x + 1.5 * flat + trail, yc], [x + 1.5 * flat + trail + load, yRoot]];
            }
            case 'round': {
                const h = 0.5 * P, R1 = 0.23851 * P, R2 = 0.25597 * P, yc = yRoot - h;
                const out: [number, number][] = [];
                for (let a = 0; a <= 75; a += 7.5) out.push([x + R2 * Math.sin(rad(a)), yRoot - R2 + R2 * Math.cos(rad(a))]);
                for (let a = -75; a <= 75; a += 7.5) out.push([x + P / 2 + R1 * Math.sin(rad(a)), yc + R1 - R1 * Math.cos(rad(a))]);
                for (let a = -75; a < 0; a += 7.5) out.push([x + P + R2 * Math.sin(rad(a)), yRoot - R2 + R2 * Math.cos(rad(a))]);
                return out;
            }
            default: {
                const h = 0.5 * P, yc = yRoot - h;
                return [[x, yRoot], [x + P / 4, yRoot], [x + P / 4, yc], [x + 0.75 * P, yc], [x + 0.75 * P, yRoot]];
            }
        }
    };
    const pts: [number, number][] = [];
    for (let x = x0; x < x1; x += P) for (const pt of unit(x)) if (pt[0] <= x1) pts.push(pt);
    const last = pts[pts.length - 1];
    if (last[0] < x1) pts.push([x1, last[1]]);
    return `M ${pts.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' L ')} L ${x1},${yBase} L ${x0},${yBase} Z`;
}

export const ThreadStandardsGuide: React.FC<ThreadStandardsGuideProps> = ({
    currentType = 'M',
    nominalDia = 20,
    pitch = 2.5,
}) => {
    const { language } = useI18nStore();
    const [subTab, setSubTab] = useState<StandardsGuideSubTab>('shape_atlas');
    const svgRef = useRef<SVGSVGElement>(null);

    const downloadActiveSvg = (filename: string) => {
        if (!svgRef.current) return;
        const clone = svgRef.current.cloneNode(true) as SVGSVGElement;
        clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        const blob = new Blob(
            ['<?xml version="1.0" encoding="UTF-8"?>\n<!-- AluCalculator 1:1 Thread Standards Blueprint -->\n', clone.outerHTML],
            { type: 'image/svg+xml;charset=utf-8' }
        );
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${filename}.svg`;
        a.click();
        URL.revokeObjectURL(a.href);
    };

    return (
        <div className="w-full flex flex-col space-y-4 font-sans select-none">
            {/* Sub-Navigation Pills */}
            <div className="flex items-center justify-between gap-2 flex-wrap bg-white/[0.03] p-1.5 rounded-xl border border-white/10 text-xs">
                <div className="flex items-center gap-1 flex-wrap">
                    <button
                        type="button"
                        onClick={() => setSubTab('shape_atlas')}
                        className={`px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer text-[11px] ${
                            subTab === 'shape_atlas'
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <Shapes size={12} />
                        <span>1. {t12(language, 'Profile Shapes (5 Basic Forms)', 'Profil Şekilleri (5 Temel Form)')}</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setSubTab('iso_metric')}
                        className={`px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer text-[11px] ${
                            subTab === 'iso_metric'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <FileText size={12} />
                        <span>2. {t12(language, 'ISO 68-1 Metric Blueprint', 'ISO 68-1 Metrik Şema')}</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setSubTab('inch_whitworth')}
                        className={`px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer text-[11px] ${
                            subTab === 'inch_whitworth'
                                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <GitCompare size={12} />
                        <span>3. {t12(language, 'ASME 60° vs Whitworth 55°', 'ASME 60° vs Whitworth 55°')}</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setSubTab('taper_vs_cylindrical')}
                        className={`px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer text-[11px] ${
                            subTab === 'taper_vs_cylindrical'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <Compass size={12} />
                        <span>4. {t12(language, 'Taper (1:16) vs Parallel', 'Konik (1:16) vs Silindirik')}</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setSubTab('rh_vs_lh')}
                        className={`px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer text-[11px] ${
                            subTab === 'rh_vs_lh'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <RotateCw size={12} />
                        <span>5. {t12(language, 'Right (RH) vs Left (LH) Hand', 'Sağ (RH) vs Sol (LH) Helis')}</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setSubTab('pitch_density')}
                        className={`px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer text-[11px] ${
                            subTab === 'pitch_density'
                                ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 shadow-sm'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <Maximize2 size={12} />
                        <span>6. {t12(language, 'Pitch Density', 'Hatve Yoğunluğu')}</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setSubTab('assembly_fit')}
                        className={`px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer text-[11px] ${
                            subTab === 'assembly_fit'
                                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <ArrowLeftRight size={12} />
                        <span>7. {t12(language, 'Thread Engagement Fit', 'Montaj Kavraması')}</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setSubTab('pipe_sealing')}
                        className={`px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer text-[11px] ${
                            subTab === 'pipe_sealing'
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <ShieldCheck size={12} />
                        <span>8. {t12(language, 'Pipe Threads & Sealing', 'Boru Dişleri ve Sızdırmazlık')}</span>
                    </button>
                </div>

                <button
                    type="button"
                    onClick={() => downloadActiveSvg(`thread_reference_${subTab}`)}
                    className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-mono text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                    title={t12(language, 'Download this 1:1 SVG Blueprint', 'Bu Şemayı 1:1 SVG Olarak İndir')}
                >
                    <Download size={11} />
                    <span>{t12(language, 'Download SVG', 'SVG İndir')}</span>
                </button>
            </div>

            {/* Visualizer Display Canvas */}
            <div className="w-full bg-[var(--bg-0)] rounded-2xl border border-white/10 p-4 min-h-[420px] flex flex-col justify-center items-center relative overflow-hidden">
                {/* ═══════════════════════════════════════════════════════════════
                    SUB-TAB 1: SHAPE ATLAS (5 TEMEL PROFİL ŞEKLİ)
                    Inpart24: Division based on the shape of threads
                   ═══════════════════════════════════════════════════════════════ */}
                {subTab === 'shape_atlas' && (
                    <div className="w-full space-y-4">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                            <div>
                                <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                    <Shapes size={15} className="text-cyan-400" />
                                    <span>{t12(language, 'Classification by Thread Profile Shapes (Inpart24 Article 34)', 'Diş Profil Şekillerine Göre Sınıflandırma (Inpart24 Article 34)')}</span>
                                </h4>
                                <p className="text-[11px] text-slate-400">
                                    {t12(language, 'Industrial threads are divided into 5 basic geometries by cross-section profile: Triangular, Symmetrical Trapezoidal, Buttress, Round, and Square.', 'Endüstriyel dişler kesit profillerine göre 5 temel geometriye ayrılır: Üçgen, Simetrik Trapez, Testere (Buttress), Yuvarlak ve Kare.')}
                                </p>
                            </div>
                        </div>

                        <svg
                            ref={svgRef}
                            viewBox="0 0 1000 320"
                            className="w-full h-auto max-h-[380px] select-none font-mono"
                            role="img"
                        >
                            <rect width="1000" height="330" fill="var(--bg-1, #020408)" rx="8" />

                            {/* 1. TRIANGULAR (ÜÇGEN) */}
                            <g transform="translate(20, 16)">
                                <rect width="180" height="295" rx="8" fill="var(--bg-2, #080f1a)" stroke="var(--cyan, #00e5ff)" strokeWidth="1" strokeOpacity="0.5" />
                                <text x="90" y="26" textAnchor="middle" fill="var(--cyan, #00e5ff)" fontSize="12" fontWeight="800">1. {t12(language, 'TRIANGULAR', 'ÜÇGEN (TRIANGULAR)')}</text>
                                <text x="90" y="44" textAnchor="middle" fill="var(--alu-dim, #94a3b8)" fontSize="10.5" fontFamily="ui-monospace, monospace">60° / 55° {t12(language, 'Flank Angle', 'Flank Açısı')}</text>
                                
                                {/* 2D Tooth Profile */}
                                <path
                                    d={atlasFormPath('tri')}
                                    fill="var(--cyan, #00e5ff)"
                                    fillOpacity="0.18"
                                    stroke="var(--cyan, #00e5ff)"
                                    strokeWidth="2"
                                    strokeLinejoin="round"
                                />
                                {/* Angle arc */}
                                <text x="90" y="96" textAnchor="middle" fill="var(--warn, #fbbf24)" fontSize="11" fontWeight="800">60° ISO · 55° BSW</text>

                                <text x="90" y="218" textAnchor="middle" fill="var(--cyan, #38bdf8)" fontSize="11" fontWeight="800">{t12(language, 'Application:', 'Kullanım Alanı:')}</text>
                                <text x="90" y="236" textAnchor="middle" fill="var(--alu, #cbd5e1)" fontSize="10.5">{t12(language, 'General Fastening Bolts', 'Genel Bağlantı Civataları')}</text>
                                <text x="90" y="254" textAnchor="middle" fill="var(--alu-dim, #94a3b8)" fontSize="10">{t12(language, 'Resistant to loosening via friction', 'Yüksek sürtünmeyle gevşemez')}</text>
                                <text x="90" y="276" textAnchor="middle" fill="var(--warn, #f59e0b)" fontSize="10.5" fontWeight="800">ISO 68-1, ASME B1.1, BS 84</text>
                            </g>

                            {/* 2. SYMMETRICAL TRAPEZOIDAL (SİMETRİK TRAPEZ) */}
                            <g transform="translate(215, 16)">
                                <rect width="180" height="295" rx="8" fill="var(--bg-2, #080f1a)" stroke="var(--cyan, #38bdf8)" strokeWidth="1" strokeOpacity="0.5" />
                                <text x="90" y="26" textAnchor="middle" fill="var(--cyan, #38bdf8)" fontSize="12" fontWeight="800">2. {t12(language, 'SYMMETRIC TRAPEZOIDAL', 'SİMETRİK TRAPEZ')}</text>
                                <text x="90" y="44" textAnchor="middle" fill="var(--alu-dim, #94a3b8)" fontSize="10.5" fontFamily="ui-monospace, monospace">Tr 30° / ACME 29°</text>

                                <path
                                    d={atlasFormPath('tr')}
                                    fill="var(--cyan, #38bdf8)"
                                    fillOpacity="0.18"
                                    stroke="var(--cyan, #38bdf8)"
                                    strokeWidth="2"
                                    strokeLinejoin="round"
                                />
                                <text x="90" y="96" textAnchor="middle" fill="var(--warn, #fbbf24)" fontSize="11" fontWeight="800">30° Tr · 29° ACME</text>

                                <text x="90" y="218" textAnchor="middle" fill="var(--cyan, #38bdf8)" fontSize="11" fontWeight="800">{t12(language, 'Application:', 'Kullanım Alanı:')}</text>
                                <text x="90" y="236" textAnchor="middle" fill="var(--alu, #cbd5e1)" fontSize="10.5">{t12(language, 'Bidirectional Power Transmission', 'Çift Yönlü Güç Aktarımı')}</text>
                                <text x="90" y="254" textAnchor="middle" fill="var(--alu-dim, #94a3b8)" fontSize="10">{t12(language, 'Lead screws, machine screw jacks', 'Torna milleri, vidalı krikolar')}</text>
                                <text x="90" y="276" textAnchor="middle" fill="var(--warn, #f59e0b)" fontSize="10.5" fontWeight="800">ISO 2901, DIN 103, ASME B1.5</text>
                            </g>

                            {/* 3. ASYMMETRICAL BUTTRESS (TESTERE DİŞ) */}
                            <g transform="translate(410, 16)">
                                <rect width="180" height="295" rx="8" fill="var(--bg-2, #080f1a)" stroke="var(--std, #a855f7)" strokeWidth="1" strokeOpacity="0.5" />
                                <text x="90" y="26" textAnchor="middle" fill="var(--std, #a855f7)" fontSize="12" fontWeight="800">3. {t12(language, 'BUTTRESS (SAWTOOTH)', 'TESTERE (BUTTRESS)')}</text>
                                <text x="90" y="44" textAnchor="middle" fill="var(--alu-dim, #94a3b8)" fontSize="10.5" fontFamily="ui-monospace, monospace">7°/45° B1.9 · 3°/30° DIN 513</text>

                                <path
                                    d={atlasFormPath('buttress')}
                                    fill="var(--std, #a855f7)"
                                    fillOpacity="0.18"
                                    stroke="var(--std, #a855f7)"
                                    strokeWidth="2"
                                    strokeLinejoin="round"
                                />
                                <text x="90" y="96" textAnchor="middle" fill="var(--warn, #fbbf24)" fontSize="11" fontWeight="800">7° load · 45° trailing</text>

                                <text x="90" y="218" textAnchor="middle" fill="var(--std, #a855f7)" fontSize="11" fontWeight="800">{t12(language, 'Application:', 'Kullanım Alanı:')}</text>
                                <text x="90" y="236" textAnchor="middle" fill="var(--alu, #cbd5e1)" fontSize="10.5">{t12(language, 'Unidirectional Heavy Loads', 'Tek Yönlü Aşırı Yük')}</text>
                                <text x="90" y="254" textAnchor="middle" fill="var(--alu-dim, #94a3b8)" fontSize="10">{t12(language, 'Hydraulic presses, artillery breeches', 'Hidrolik presler, top kundakları')}</text>
                                <text x="90" y="276" textAnchor="middle" fill="var(--warn, #f59e0b)" fontSize="10.5" fontWeight="800">DIN 513, ASME B1.9</text>
                            </g>

                            {/* 4. ROUND (YUVARLAK DİŞ) */}
                            <g transform="translate(605, 16)">
                                <rect width="180" height="295" rx="8" fill="var(--bg-2, #080f1a)" stroke="var(--ok, #10b981)" strokeWidth="1" strokeOpacity="0.5" />
                                <text x="90" y="26" textAnchor="middle" fill="var(--ok, #10b981)" fontSize="12" fontWeight="800">4. {t12(language, 'ROUND (KNUCKLE)', 'YUVARLAK (ROUND)')}</text>
                                <text x="90" y="44" textAnchor="middle" fill="var(--alu-dim, #94a3b8)" fontSize="10.5" fontFamily="ui-monospace, monospace">{t12(language, 'Rd 30° / Edison Knuckle', 'Rd 30° / Edison Dalgası')}</text>

                                <path
                                    d={atlasFormPath('round')}
                                    fill="var(--ok, #10b981)"
                                    fillOpacity="0.18"
                                    stroke="var(--ok, #10b981)"
                                    strokeWidth="2"
                                    strokeLinejoin="round"
                                />
                                <text x="90" y="96" textAnchor="middle" fill="var(--warn, #fbbf24)" fontSize="11" fontWeight="800">30° · R 0.238P</text>

                                <text x="90" y="218" textAnchor="middle" fill="var(--ok, #10b981)" fontSize="11" fontWeight="800">{t12(language, 'Application:', 'Kullanım Alanı:')}</text>
                                <text x="90" y="236" textAnchor="middle" fill="var(--alu, #cbd5e1)" fontSize="10.5">{t12(language, 'Abrasive & Dirty Environments', 'Aşındırıcı Kirli Ortamlar')}</text>
                                <text x="90" y="254" textAnchor="middle" fill="var(--alu-dim, #94a3b8)" fontSize="10">{t12(language, 'Railway couplers, lamp sockets', 'Tren kuplajları, lamba duyları')}</text>
                                <text x="90" y="276" textAnchor="middle" fill="var(--warn, #f59e0b)" fontSize="10.5" fontWeight="800">DIN 405, IEC 60061</text>
                            </g>

                            {/* 5. RECTANGULAR / SQUARE (KARE DİŞ) */}
                            <g transform="translate(800, 16)">
                                <rect width="180" height="295" rx="8" fill="var(--bg-2, #080f1a)" stroke="var(--warn, #f59e0b)" strokeWidth="1" strokeOpacity="0.5" />
                                <text x="90" y="26" textAnchor="middle" fill="var(--warn, #f59e0b)" fontSize="12" fontWeight="800">5. {t12(language, 'SQUARE (RECTANGULAR)', 'KARE (SQUARE)')}</text>
                                <text x="90" y="44" textAnchor="middle" fill="var(--alu-dim, #94a3b8)" fontSize="10.5" fontFamily="ui-monospace, monospace">{t12(language, '0° Vertical Flank Angle', '0° Dikey Flank Açısı')}</text>

                                <path
                                    d={atlasFormPath('square')}
                                    fill="var(--warn, #f59e0b)"
                                    fillOpacity="0.18"
                                    stroke="var(--warn, #f59e0b)"
                                    strokeWidth="2"
                                    strokeLinejoin="round"
                                />
                                <text x="90" y="96" textAnchor="middle" fill="var(--warn, #fbbf24)" fontSize="11" fontWeight="800">α = 0° · h = 0.5P</text>

                                <text x="90" y="218" textAnchor="middle" fill="var(--warn, #f59e0b)" fontSize="11" fontWeight="800">{t12(language, 'Application:', 'Kullanım Alanı:')}</text>
                                <text x="90" y="236" textAnchor="middle" fill="var(--alu, #cbd5e1)" fontSize="10.5">{t12(language, 'Maximum Mechanical Efficiency', 'Maksimum Mekanik Verim')}</text>
                                <text x="90" y="254" textAnchor="middle" fill="var(--alu-dim, #94a3b8)" fontSize="10">{t12(language, 'Zero radial bursting force', 'Sıfır radyal patlama kuvveti')}</text>
                                <text x="90" y="276" textAnchor="middle" fill="var(--warn, #f59e0b)" fontSize="10.5" fontWeight="800">{t12(language, 'Special Power Screws', 'Özel Güç Vidaları')}</text>
                            </g>
                        </svg>
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════════════════
                    SUB-TAB 2: ISO 68-1 METRIC THREAD SCHEME
                    Inpart24: Metric-Thread-Scheme.jpg
                   ═══════════════════════════════════════════════════════════════ */}
                {subTab === 'iso_metric' && (
                    <div className="w-full space-y-3">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                            <div>
                                <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                    <FileText size={15} className="text-amber-400" />
                                    <span>{t12(language, 'ISO 68-1 / DIN 13 Metric Thread Fundamental Geometry Scheme', 'ISO 68-1 / DIN 13 Metrik Diş Temel Geometri Şeması')}</span>
                                </h4>
                                <p className="text-[11px] text-slate-400 font-mono">
                                    H = (√3/2)·P ≈ 0.866025·P | d₂ = d − 0.64952·P | d₁ = d − 1.08253·P | H₁ = (5/8)·H = 0.54127·P
                                </p>
                            </div>
                        </div>

                        <svg
                            ref={svgRef}
                            viewBox="0 0 940 430"
                            className="w-full h-auto max-h-[460px] select-none font-mono"
                            role="img"
                        >
                            <rect width="940" height="430" fill="var(--bg-1, #020408)" rx="8" />

                            {/* Thread Axis Centerline */}
                            <line x1="40" y1="395" x2="900" y2="395" stroke="var(--cyan, #38bdf8)" strokeWidth="1.2" strokeDasharray="14 4 2 4" />
                            <text x="900" y="390" fill="var(--cyan, #38bdf8)" fontSize="11" textAnchor="end" fontWeight="700">{t12(language, 'Bolt Thread Axis Line', 'Civata Eksen Çizgisi (Axis of Thread)')}</text>

                            {/* Sharp Fundamental Triangles (60° theoretical crest and root) */}
                            <path
                                d="M 180,288 L 320,45 L 460,288 L 600,45 L 740,288"
                                fill="none"
                                stroke="var(--warn, #f59e0b)"
                                strokeWidth="1.3"
                                strokeDasharray="5 3"
                                opacity="0.6"
                            />

                            {/* Nut (Female Thread) Body Hatch (Above Minor Diameter) */}
                            {/* Nut Crest sits at y=227, valleys at y=45. Fills UPWARDS to y=20 */}
                            <path
                                d="
                                    M 60,20
                                    L 880,20
                                    L 880,180
                                    L 775,227
                                    L 705,227
                                    L 600,45
                                    L 495,227
                                    L 425,227
                                    L 320,45
                                    L 215,227
                                    L 145,227
                                    L 60,80
                                    Z
                                "
                                fill="var(--cyan, #06b6d4)"
                                fillOpacity="0.16"
                                stroke="var(--cyan, #06b6d4)"
                                strokeWidth="2.2"
                                strokeLinejoin="round"
                            />
                            <text x="460" y="40" textAnchor="middle" fill="var(--cyan, #06b6d4)" fontSize="13" fontWeight="800">
                                {t12(language, 'FEMALE THREAD (NUT) — 6H TOLERANCE BODY', 'DİŞİ DİŞ (SOMUN / NUT) — 6H TOLERANS GÖVDESİ')}
                            </text>

                            {/* Bolt (Male Thread) Body (Below Major Diameter) */}
                            {/* Bolt Crest sits at y=75, root radius at y=252. Fills DOWNWARDS to y=365 */}
                            <path
                                d="
                                    M 60,365
                                    L 880,365
                                    L 880,252
                                    L 758,252
                                    L 618,75
                                    L 582,75
                                    L 478,252
                                    L 442,252
                                    L 338,75
                                    L 302,75
                                    L 198,252
                                    L 60,252
                                    Z
                                "
                                fill="var(--warn, #f59e0b)"
                                fillOpacity="0.18"
                                stroke="var(--warn, #f59e0b)"
                                strokeWidth="2.4"
                                strokeLinejoin="round"
                            />
                            <text x="460" y="340" textAnchor="middle" fill="var(--warn, #f59e0b)" fontSize="13" fontWeight="800">
                                {t12(language, 'MALE THREAD (BOLT) — 6g TOLERANCE BODY', 'ERKEK DİŞ (CİVATA / BOLT) — 6g TOLERANS GÖVDESİ')}
                            </text>

                            {/* Pitch Line (d2 = D2) */}
                            <line x1="60" y1="166" x2="880" y2="166" stroke="var(--alu-dim, #94a3b8)" strokeWidth="1.3" strokeDasharray="8 4" />
                            <text x="880" y="160" fill="var(--alu-dim, #94a3b8)" fontSize="11.5" textAnchor="end" fontWeight="700">{t12(language, 'Pitch Line d₂ = D₂', 'Hatve Çizgisi d₂ = D₂ (Pitch Line)')}</text>

                            {/* Major Diameter Line d */}
                            <line x1="60" y1="75" x2="880" y2="75" stroke="var(--warn, #fbbf24)" strokeWidth="1.1" strokeDasharray="4 2" opacity="0.8" />
                            <text x="880" y="70" fill="var(--warn, #fbbf24)" fontSize="11.5" textAnchor="end" fontWeight="700">{t12(language, 'Major Diameter d = D', 'Dış Çap d = D (Major Diameter)')}</text>

                            {/* Minor Diameter Line d1 */}
                            <line x1="60" y1="227" x2="880" y2="227" stroke="var(--cyan, #00e5ff)" strokeWidth="1.1" strokeDasharray="4 2" opacity="0.8" />
                            <text x="880" y="222" fill="var(--cyan, #00e5ff)" fontSize="11.5" textAnchor="end" fontWeight="700">{t12(language, 'Minor Diameter d₁ = D₁', 'Çekirdek Çapı d₁ = D₁ (Minor Diameter)')}</text>

                            {/* Angle 60° Callout */}
                            <path d="M 285,105 A 36 36 0 0 0 355,105" fill="none" stroke="var(--warn, #fbbf24)" strokeWidth="1.8" />
                            <text x="320" y="132" textAnchor="middle" fill="var(--warn, #fbbf24)" fontSize="14" fontWeight="900">60°</text>
                            <line x1="320" y1="45" x2="320" y2="227" stroke="var(--muted, #64748b)" strokeWidth="0.9" strokeDasharray="4 2" />
                            <text x="265" y="152" fill="var(--warn, #fbbf24)" fontSize="10.5" fontWeight="700">30°</text>
                            <text x="375" y="152" fill="var(--warn, #fbbf24)" fontSize="10.5" fontWeight="700">30°</text>

                            {/* Dimension: Pitch P (Between Teeth) */}
                            <line x1="320" y1="28" x2="600" y2="28" stroke="var(--cyan, #38bdf8)" strokeWidth="1.4" />
                            <line x1="320" y1="22" x2="320" y2="45" stroke="var(--cyan, #38bdf8)" strokeWidth="1" />
                            <line x1="600" y1="22" x2="600" y2="45" stroke="var(--cyan, #38bdf8)" strokeWidth="1" />
                            <text x="460" y="22" textAnchor="middle" fill="var(--cyan, #38bdf8)" fontSize="12" fontWeight="800">{t12(language, 'Pitch P', 'Hatve P (Pitch)')}</text>

                            {/* Dimension: Theoretical Triangle Height H */}
                            <line x1="105" y1="45" x2="105" y2="288" stroke="var(--warn, #f59e0b)" strokeWidth="1.3" />
                            <line x1="98" y1="45" x2="112" y2="45" stroke="var(--warn, #f59e0b)" strokeWidth="1" />
                            <line x1="98" y1="288" x2="112" y2="288" stroke="var(--warn, #f59e0b)" strokeWidth="1" />
                            <text x="96" y="172" textAnchor="end" fill="var(--warn, #f59e0b)" fontSize="11" fontWeight="800">H = 0.866·P</text>

                            {/* Dimension: Working Engagement H1 = 5/8 H */}
                            <line x1="145" y1="75" x2="145" y2="227" stroke="var(--ok, #10b981)" strokeWidth="1.8" />
                            <line x1="138" y1="75" x2="152" y2="75" stroke="var(--ok, #10b981)" strokeWidth="1.2" />
                            <line x1="138" y1="227" x2="152" y2="227" stroke="var(--ok, #10b981)" strokeWidth="1.2" />
                            <text x="156" y="155" fill="var(--ok, #10b981)" fontSize="11" fontWeight="800">H₁ = 5/8·H (0.541·P)</text>

                            {/* Dimension: Bolt Crest Truncation H/8 */}
                            <line x1="338" y1="45" x2="338" y2="75" stroke="var(--warn, #f59e0b)" strokeWidth="1.1" />
                            <text x="345" y="64" fill="var(--warn, #f59e0b)" fontSize="10.5" fontWeight="800">H/8 ({t12(language, 'P/8 Flat', 'P/8 Düzlük')})</text>

                            {/* Dimension: Nut Crest Truncation H/4 */}
                            <line x1="425" y1="227" x2="425" y2="288" stroke="var(--cyan, #06b6d4)" strokeWidth="1.1" />
                            <text x="432" y="260" fill="var(--cyan, #06b6d4)" fontSize="10.5" fontWeight="800">H/4 ({t12(language, 'P/4 Flat', 'P/4 Düzlük')})</text>

                            {/* Root Radius R = H/6 */}
                            <line x1="460" y1="252" x2="495" y2="285" stroke="var(--warn, #f59e0b)" strokeWidth="1.1" />
                            <text x="502" y="295" fill="var(--warn, #f59e0b)" fontSize="11" fontWeight="800">R = H/6 ≈ 0.144·P ({t12(language, 'Bolt Root Radius', 'Civata Kök Radyüsü')})</text>

                            {/* Radial Clearance Callout */}
                            <rect x="560" y="80" width="180" height="22" rx="4" fill="var(--bg-2, #080f1a)" stroke="var(--bad, #ef4444)" strokeWidth="1" />
                            <text x="650" y="95" textAnchor="middle" fill="var(--bad, #ef4444)" fontSize="10" fontWeight="800">
                                {t12(language, 'Radial Clearance c = H/8 (Tolerance)', 'Radyal Boşluk c = H/8 (Tolerans)')}
                            </text>
                        </svg>
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════════════════
                    SUB-TAB 3: INCH 60° VS WHITWORTH 55°
                    Inpart24: American-Inch-Threads.jpg vs British-Inch-Threads.jpg
                   ═══════════════════════════════════════════════════════════════ */}
                {subTab === 'inch_whitworth' && (
                    <div className="w-full space-y-3">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                            <div>
                                <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                    <GitCompare size={15} className="text-indigo-400" />
                                    <span>{t12(language, 'American Unified (ASME B1.1 60°) vs British Whitworth (BS 84 55°)', 'Amerikan Unified (ASME B1.1 60°) vs Britanya Whitworth (BS 84 55°)')}</span>
                                </h4>
                                <p className="text-[11px] text-slate-400">
                                    {t12(language, 'Caution: 60° and 55° threads must never be mated! Binding and leaks occur due to mismatched flank angles and crest/root radii.', 'Dikkat: 60° ve 55° dişler kesinlikle birbiriyle eşleştirilemez! Farklı tepe açıları ve kret/kök yarıçapları nedeniyle sıkışma ve sızdırma meydana gelir.')}
                                </p>
                            </div>
                        </div>

                        <svg
                            ref={svgRef}
                            viewBox="0 0 900 320"
                            className="w-full h-auto max-h-[360px] select-none font-mono"
                            role="img"
                        >
                            <rect width="900" height="320" fill="var(--bg-1, #020408)" rx="8" />

                            {/* LEFT: UNIFIED 60° */}
                            <g transform="translate(40, 20)">
                                <rect width="380" height="270" rx="8" fill="var(--bg-2, #080f1a)" stroke="var(--cyan, #38bdf8)" strokeWidth="1" strokeOpacity="0.5" />
                                <text x="190" y="30" textAnchor="middle" fill="var(--cyan, #38bdf8)" fontSize="13" fontWeight="800">ASME B1.1 UNIFIED (60°)</text>
                                <text x="190" y="48" textAnchor="middle" fill="var(--alu-dim, #94a3b8)" fontSize="9.5">UNC, UNF, UNEF, UN, UNS</text>

                                {/* 60° Flat Crest / Root Profile */}
                                <path
                                    d="M 40,190 L 100,80 L 140,80 L 200,190 L 240,190 L 300,80 L 340,80"
                                    fill="none"
                                    stroke="var(--cyan, #38bdf8)"
                                    strokeWidth="2.5"
                                    strokeLinejoin="round"
                                />
                                <path
                                    d="M 40,190 L 100,80 L 140,80 L 200,190 L 240,190 L 300,80 L 340,80 L 340,220 L 40,220 Z"
                                    fill="var(--cyan, #38bdf8)"
                                    fillOpacity="0.1"
                                />

                                {/* 60° Angle callout */}
                                <path d="M 100,105 A 25 25 0 0 0 140,105" fill="none" stroke="var(--warn, #fbbf24)" strokeWidth="1.5" />
                                <text x="120" y="130" textAnchor="middle" fill="var(--warn, #fbbf24)" fontSize="13" fontWeight="800">60°</text>

                                {/* Flat crest note */}
                                <line x1="100" y1="75" x2="140" y2="75" stroke="var(--warn, #f59e0b)" strokeWidth="1.2" />
                                <text x="120" y="66" textAnchor="middle" fill="var(--warn, #f59e0b)" fontSize="11" fontWeight="700">{t12(language, 'Flat Crest (P/8 Flat)', 'Düz Tepe (P/8 Flat)')}</text>

                                <text x="190" y="238" textAnchor="middle" fill="var(--ink, #f8fafc)" fontSize="11" fontWeight="700">{t12(language, 'Pitch Unit: TPI (Threads Per Inch)', 'Hatve Ölçüsü: TPI (Threads Per Inch)')}</text>
                                <text x="190" y="255" textAnchor="middle" fill="var(--alu-dim, #94a3b8)" fontSize="10">P (mm) = 25.4 / TPI | H = 0.866·P</text>
                            </g>

                            {/* RIGHT: WHITWORTH 55° */}
                            <g transform="translate(480, 20)">
                                <rect width="380" height="270" rx="8" fill="var(--bg-2, #080f1a)" stroke="var(--std, #a855f7)" strokeWidth="1" strokeOpacity="0.5" />
                                <text x="190" y="30" textAnchor="middle" fill="var(--std, #a855f7)" fontSize="14" fontWeight="800">BS 84 WHITWORTH (55°)</text>
                                <text x="190" y="48" textAnchor="middle" fill="var(--alu-dim, #94a3b8)" fontSize="10.5">BSW, BSF, BSPP (G), BSPT (R), DIN 477 W</text>

                                {/* 55° Rounded Crest and Root Profile */}
                                <path
                                    d="M 40,180 Q 70,180 85,150 L 105,100 Q 120,70 135,100 L 155,150 Q 170,180 185,180 Q 200,180 215,150 L 235,100 Q 250,70 265,100 L 285,150 Q 300,180 340,180"
                                    fill="none"
                                    stroke="var(--std, #a855f7)"
                                    strokeWidth="2.5"
                                />
                                <path
                                    d="M 40,180 Q 70,180 85,150 L 105,100 Q 120,70 135,100 L 155,150 Q 170,180 185,180 Q 200,180 215,150 L 235,100 Q 250,70 265,100 L 285,150 Q 300,180 340,180 L 340,220 L 40,220 Z"
                                    fill="var(--std, #a855f7)"
                                    fillOpacity="0.1"
                                />

                                {/* 55° Angle callout */}
                                <path d="M 105,105 A 25 25 0 0 0 135,105" fill="none" stroke="var(--warn, #fbbf24)" strokeWidth="1.5" />
                                <text x="120" y="130" textAnchor="middle" fill="var(--warn, #fbbf24)" fontSize="13" fontWeight="800">55°</text>

                                {/* Radiused crest note */}
                                <text x="120" y="63" textAnchor="middle" fill="var(--std, #a855f7)" fontSize="11" fontWeight="700">{t12(language, 'Rounded Crest (r = 0.1373·P)', 'Yuvarlatılmış Tepe (r = 0.1373·P)')}</text>

                                <text x="190" y="238" textAnchor="middle" fill="var(--ink, #f8fafc)" fontSize="11" fontWeight="700">{t12(language, 'Working Depth h = 0.640327·P', 'Çalışma Derinliği h = 0.640327·P')}</text>
                                <text x="190" y="255" textAnchor="middle" fill="var(--alu-dim, #94a3b8)" fontSize="10">{t12(language, 'Root & Crest Radius r = 0.137329·P', 'Kök ve Kret Yarıçapı r = 0.137329·P')}</text>
                            </g>
                        </svg>
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════════════════
                    SUB-TAB 4: TAPERED VS CYLINDRICAL PIPE THREADS
                    Inpart24: Comparison-of-a-tapered-thread-and-a-cylindrical-thread.jpg
                   ═══════════════════════════════════════════════════════════════ */}
                {subTab === 'taper_vs_cylindrical' && (
                    <div className="w-full space-y-3">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                            <div>
                                <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                    <Compass size={15} className="text-emerald-400" />
                                    <span>{t12(language, 'Tapered (1:16 Taper) vs Cylindrical (Parallel) Thread Comparison', 'Konik (1:16 Taper) vs Silindirik (Paralel) Diş Karşılaştırması')}</span>
                                </h4>
                                <p className="text-[11px] text-slate-400">
                                    {t12(language, 'The sealing principle in pipe connections differs completely between tapered and cylindrical geometries.', 'Boru bağlantılarında sızdırmazlık prensibi konik ve silindirik geometrilerde tamamen farklıdır.')}
                                </p>
                            </div>
                        </div>

                        <svg
                            ref={svgRef}
                            viewBox="0 0 900 320"
                            className="w-full h-auto max-h-[360px] select-none font-mono"
                            role="img"
                        >
                            <rect width="900" height="320" fill="var(--bg-1, #020408)" rx="8" />

                            {/* LEFT: CYLINDRICAL (PARALLEL) */}
                            <g transform="translate(40, 20)">
                                <rect width="380" height="270" rx="8" fill="var(--bg-2, #080f1a)" stroke="var(--cyan, #06b6d4)" strokeWidth="1" strokeOpacity="0.5" />
                                <text x="190" y="30" textAnchor="middle" fill="var(--cyan, #06b6d4)" fontSize="14" fontWeight="800">{t12(language, 'CYLINDRICAL (PARALLEL) THREAD', 'SİLİNDİRİK (PARALEL) DİŞ')}</text>
                                <text x="190" y="48" textAnchor="middle" fill="var(--alu-dim, #94a3b8)" fontSize="10.5">BSPP (G), NPSM, Metrik, UNC</text>

                                {/* Cylindrical Body: constant OD */}
                                <rect x="50" y="80" width="280" height="90" fill="var(--bg-3, #0f172a)" stroke="var(--cyan, #06b6d4)" strokeWidth="1.8" />
                                <line x1="30" y1="125" x2="350" y2="125" stroke="var(--cyan, #38bdf8)" strokeWidth="0.8" strokeDasharray="6 3 1 3" />

                                {/* Dimension: Constant OD */}
                                <line x1="60" y1="65" x2="310" y2="65" stroke="var(--warn, #fbbf24)" strokeWidth="1" />
                                <text x="185" y="58" textAnchor="middle" fill="var(--warn, #fbbf24)" fontSize="11" fontWeight="700">{t12(language, 'Constant Outer Diameter (Constant OD)', 'Sabit Dış Çap (Constant OD)')}</text>

                                {/* Sealing Washer Graphic */}
                                <rect x="300" y="70" width="18" height="110" rx="2" fill="var(--warn, #f59e0b)" fillOpacity="0.8" stroke="var(--warn, #fbbf24)" strokeWidth="1" />
                                <text x="309" y="196" textAnchor="middle" fill="var(--warn, #fbbf24)" fontSize="9" fontWeight="700">Dowty / O-Ring</text>

                                <text x="190" y="235" textAnchor="middle" fill="var(--cyan, #06b6d4)" fontSize="11" fontWeight="800">{t12(language, 'Sealing Principle:', 'Sızdırmazlık Prensibi:')}</text>
                                <text x="190" y="250" textAnchor="middle" fill="var(--ink, #f8fafc)" fontSize="10">{t12(language, 'Thread flank surfaces DO NOT provide sealing.', 'Diş yan yüzeyleri sızdırmazlık SAĞLAMAZ.')}</text>
                                <text x="190" y="265" textAnchor="middle" fill="var(--alu-dim, #94a3b8)" fontSize="9.5">{t12(language, 'Face seal, bonded copper washer or O-ring is mandatory.', 'Alın contası, bakır pul veya O-ring zorunludur.')}</text>
                            </g>

                            {/* RIGHT: TAPERED (KONİK) */}
                            <g transform="translate(480, 20)">
                                <rect width="380" height="270" rx="8" fill="var(--bg-2, #080f1a)" stroke="var(--ok, #10b981)" strokeWidth="1" strokeOpacity="0.5" />
                                <text x="190" y="30" textAnchor="middle" fill="var(--ok, #10b981)" fontSize="14" fontWeight="800">{t12(language, 'TAPERED (CONICAL) THREAD', 'KONİK (TAPERED) DİŞ')}</text>
                                <text x="190" y="48" textAnchor="middle" fill="var(--alu-dim, #94a3b8)" fontSize="10.5">NPT (60°), NPTF Dryseal, BSPT R/Rc (55°)</text>

                                {/* Tapered Body: slope 1:16 */}
                                <polygon
                                    points="50,95 310,75 310,175 50,155"
                                    fill="var(--bg-3, #0f172a)"
                                    stroke="var(--ok, #10b981)"
                                    strokeWidth="1.8"
                                />
                                <line x1="30" y1="125" x2="350" y2="125" stroke="var(--cyan, #38bdf8)" strokeWidth="0.8" strokeDasharray="6 3 1 3" />

                                {/* Gauge Plane L1 marker */}
                                <line x1="160" y1="65" x2="160" y2="185" stroke="var(--bad, #ef4444)" strokeWidth="1.6" strokeDasharray="3 2" />
                                <text x="160" y="58" textAnchor="middle" fill="var(--bad, #ef4444)" fontSize="11" fontWeight="800">{t12(language, 'L₁ Gauge Plane', 'L₁ Mastar Düzlemi')}</text>

                                {/* 1:16 taper callout */}
                                <line x1="190" y1="90" x2="280" y2="83" stroke="var(--warn, #fbbf24)" strokeWidth="1.2" />
                                <text x="235" y="105" textAnchor="middle" fill="var(--warn, #fbbf24)" fontSize="10.5" fontWeight="800">{t12(language, 'Taper Angle 1:16 (1°47\')', 'Konik Eğim 1:16 (1°47\')')}</text>

                                <text x="190" y="235" textAnchor="middle" fill="var(--ok, #10b981)" fontSize="11" fontWeight="800">{t12(language, 'Sealing Principle:', 'Sızdırmazlık Prensibi:')}</text>
                                <text x="190" y="250" textAnchor="middle" fill="var(--ink, #f8fafc)" fontSize="10">{t12(language, 'Thread crests and roots lock by axial wedging.', 'Diş kret ve kökleri eksenel sıkışmayla kilitlenir.')}</text>
                                <text x="190" y="265" textAnchor="middle" fill="var(--alu-dim, #94a3b8)" fontSize="9.5">{t12(language, 'PTFE tape or thread paste seals the spiral leak path.', 'PTFE bant veya diş macunu ile spiral kaçak yolu kapatılır.')}</text>
                            </g>
                        </svg>
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════════════════
                    SUB-TAB 5: RIGHT-HAND (RH) VS LEFT-HAND (LH) THREADS
                    Inpart24: Right-hand-thread-and-Left-hand-thread.jpg
                   ═══════════════════════════════════════════════════════════════ */}
                {subTab === 'rh_vs_lh' && (
                    <div className="w-full space-y-3">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                            <div>
                                <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                    <RotateCw size={15} className="text-rose-400" />
                                    <span>{t12(language, 'Right-Hand (RH) vs Left-Hand (LH) Threads', 'Sağ Helis (Right-Hand - RH) vs Sol Helis (Left-Hand - LH) Dişler')}</span>
                                </h4>
                                <p className="text-[11px] text-slate-400">
                                    {t12(language, 'Helix slope and tightening direction reverse depending on rotation. 95%+ of industrial threads are right-handed.', 'Dönüş yönüne göre helis eğimi ve sıkma yönü tersine döner. Endüstride %95+ sağ helis standarttır.')}
                                </p>
                            </div>
                        </div>

                        <svg
                            ref={svgRef}
                            viewBox="0 0 900 320"
                            className="w-full h-auto max-h-[360px] select-none font-mono"
                            role="img"
                        >
                            <rect width="900" height="320" fill="var(--bg-1, #020408)" rx="8" />

                            {/* LEFT: RIGHT HAND (RH) */}
                            <g transform="translate(40, 20)">
                                <rect width="380" height="270" rx="8" fill="var(--bg-2, #080f1a)" stroke="var(--cyan, #00e5ff)" strokeWidth="1" strokeOpacity="0.5" />
                                <text x="190" y="30" textAnchor="middle" fill="var(--cyan, #00e5ff)" fontSize="14" fontWeight="800">{t12(language, 'RIGHT-HAND (RH)', 'SAĞ HELİS (RIGHT-HAND — RH)')}</text>
                                <text x="190" y="48" textAnchor="middle" fill="var(--alu-dim, #94a3b8)" fontSize="10.5">{t12(language, 'Standard Fastening (Tightens Clockwise)', 'Standart Bağlantı (Saat Yönünde Sıkma)')}</text>

                                {/* Bolt Shaft */}
                                <rect x="50" y="90" width="280" height="80" rx="4" fill="var(--bg-3, #0f172a)" stroke="var(--cyan, #00e5ff)" strokeWidth="1.5" />

                                {/* RH Slanted Ridges: Top is to the right of bottom */}
                                {[80, 115, 150, 185, 220, 255, 290].map((x, i) => (
                                    <line
                                        key={i}
                                        x1={x - 12}
                                        y1="90"
                                        x2={x + 12}
                                        y2="170"
                                        stroke="var(--cyan, #00e5ff)"
                                        strokeWidth="3.5"
                                        strokeLinecap="round"
                                    />
                                ))}

                                <text x="190" y="205" textAnchor="middle" fill="var(--warn, #fbbf24)" fontSize="11" fontWeight="700">{t12(language, 'Clockwise (CW) → Advances / Tightens', 'Saat Yönü (CW) → İleri İlerler (Tightens)')}</text>

                                <text x="190" y="235" textAnchor="middle" fill="var(--ink, #f8fafc)" fontSize="10.5" fontWeight="700">{t12(language, 'Use: Global industry standard for general fasteners', 'Kullanım: Dünya standardı tüm genel civatalar')}</text>
                                <text x="190" y="252" textAnchor="middle" fill="var(--alu-dim, #94a3b8)" fontSize="9.5">"Righty-Tighty, Lefty-Loosey"</text>
                            </g>

                            {/* RIGHT: LEFT HAND (LH) */}
                            <g transform="translate(480, 20)">
                                <rect width="380" height="270" rx="8" fill="var(--bg-2, #080f1a)" stroke="var(--bad, #f43f5e)" strokeWidth="1" strokeOpacity="0.5" />
                                <text x="190" y="30" textAnchor="middle" fill="var(--bad, #f43f5e)" fontSize="14" fontWeight="800">{t12(language, 'LEFT-HAND (LH)', 'SOL HELİS (LEFT-HAND — LH)')}</text>
                                <text x="190" y="48" textAnchor="middle" fill="var(--alu-dim, #94a3b8)" fontSize="10.5">{t12(language, 'Safety & Rotating Shafts (Counter-Clockwise)', 'Güvenlik ve Dönel Miller (Saat Yönünün Tersi)')}</text>

                                {/* Bolt Shaft */}
                                <rect x="50" y="90" width="280" height="80" rx="4" fill="var(--bg-3, #0f172a)" stroke="var(--bad, #f43f5e)" strokeWidth="1.5" />

                                {/* LH Slanted Ridges: Top is to the left of bottom */}
                                {[80, 115, 150, 185, 220, 255, 290].map((x, i) => (
                                    <line
                                        key={i}
                                        x1={x + 12}
                                        y1="90"
                                        x2={x - 12}
                                        y2="170"
                                        stroke="var(--bad, #f43f5e)"
                                        strokeWidth="3.5"
                                        strokeLinecap="round"
                                    />
                                ))}

                                <text x="190" y="205" textAnchor="middle" fill="var(--warn, #fbbf24)" fontSize="11" fontWeight="700">{t12(language, 'Counter-Clockwise (CCW) → Advances / Tightens', 'Saat Yönünün Tersi (CCW) → İleri İlerler')}</text>

                                <text x="190" y="235" textAnchor="middle" fill="var(--ink, #f8fafc)" fontSize="10.5" fontWeight="700">{t12(language, 'Applications:', 'Kullanım Alanları:')}</text>
                                <text x="190" y="252" textAnchor="middle" fill="var(--alu-dim, #94a3b8)" fontSize="9.5">{t12(language, 'Flammable gas cylinders (DIN 477), left bicycle pedal, turnbuckles', 'Yanıcı gaz tüpleri (DIN 477), sol bisiklet pedalı, gerdirmeler')}</text>
                            </g>
                        </svg>
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════════════════
                    SUB-TAB 6: PITCH DENSITY (COARSE VS FINE VS UNEF)
                    Inpart24: Comparision-of-fine-threads-coarse-threads-and-normal-threads.jpg
                   ═══════════════════════════════════════════════════════════════ */}
                {subTab === 'pitch_density' && (
                    <div className="w-full space-y-3">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                            <div>
                                <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                    <Maximize2 size={15} className="text-yellow-400" />
                                    <span>{t12(language, 'Pitch Density Comparison: Coarse vs Fine vs Extra Fine (UNEF)', 'Hatve Yoğunluğu Karşılaştırması: Kalın (Coarse) vs İnce (Fine) vs Ekstra İnce (UNEF)')}</span>
                                </h4>
                                <p className="text-[11px] text-slate-400">
                                    {t12(language, 'For the same nominal diameter, smaller pitch increases minor diameter d1, tensile stress area, and vibration resistance.', 'Aynı nominal dış çapta hatve küçüldükçe çekirdek çapı d₁ büyür, gerilme alanı artar ve titreşim dayanımı yükselir.')}
                                </p>
                            </div>
                        </div>

                        <svg
                            ref={svgRef}
                            viewBox="0 0 900 320"
                            className="w-full h-auto max-h-[360px] select-none font-mono"
                            role="img"
                        >
                            <rect width="900" height="320" fill="var(--bg-1, #020408)" rx="8" />

                            {/* 1. COARSE (KALIN) */}
                            <g transform="translate(30, 20)">
                                <rect width="265" height="270" rx="8" fill="var(--bg-2, #080f1a)" stroke="var(--warn, #f59e0b)" strokeWidth="1" strokeOpacity="0.5" />
                                <text x="132" y="30" textAnchor="middle" fill="var(--warn, #f59e0b)" fontSize="13" fontWeight="800">{t12(language, 'COARSE PITCH', 'KALIN HATVE (COARSE)')}</text>
                                <text x="132" y="47" textAnchor="middle" fill="var(--alu-dim, #94a3b8)" fontSize="10.5">{t12(language, 'Ex: M20×2.5 / 3/4-10 UNC', 'Örn: M20×2.5 / 3/4-10 UNC')}</text>

                                {/* Few deep teeth */}
                                <rect x="30" y="80" width="205" height="80" fill="var(--bg-3, #0f172a)" stroke="var(--warn, #f59e0b)" strokeWidth="1.5" />
                                {[50, 85, 120, 155, 190].map((x, i) => (
                                    <line key={i} x1={x} y1="80" x2={x + 10} y2="160" stroke="var(--warn, #f59e0b)" strokeWidth="5" />
                                ))}

                                <text x="132" y="195" textAnchor="middle" fill="var(--warn, #fbbf24)" fontSize="11" fontWeight="800">{t12(language, 'Pitch P = 2.5 mm (Coarse)', 'Hatve P = 2.5 mm (Geniş)')}</text>
                                <text x="132" y="215" textAnchor="middle" fill="var(--ink, #f8fafc)" fontSize="10">{t12(language, 'High stripping resistance in soft metals', 'Yumuşak metallerde sıyırma direnci')}</text>
                                <text x="132" y="232" textAnchor="middle" fill="var(--alu-dim, #94a3b8)" fontSize="9.5">{t12(language, 'Fast assembly, debris tolerant', 'Hızlı montaj, kire toleranslı')}</text>
                                <text x="132" y="252" textAnchor="middle" fill="var(--warn, #f59e0b)" fontSize="10" fontWeight="700">{t12(language, 'Standard Machine Fasteners', 'Standart Makine Civataları')}</text>
                            </g>

                            {/* 2. FINE (İNCE) */}
                            <g transform="translate(315, 20)">
                                <rect width="265" height="270" rx="8" fill="var(--bg-2, #080f1a)" stroke="var(--cyan, #00e5ff)" strokeWidth="1" strokeOpacity="0.5" />
                                <text x="132" y="30" textAnchor="middle" fill="var(--cyan, #00e5ff)" fontSize="13" fontWeight="800">{t12(language, 'FINE PITCH', 'İNCE HATVE (FINE)')}</text>
                                <text x="132" y="47" textAnchor="middle" fill="var(--alu-dim, #94a3b8)" fontSize="10.5">{t12(language, 'Ex: M20×1.5 / 3/4-16 UNF', 'Örn: M20×1.5 / 3/4-16 UNF')}</text>

                                {/* More medium teeth */}
                                <rect x="30" y="80" width="205" height="80" fill="var(--bg-3, #0f172a)" stroke="var(--cyan, #00e5ff)" strokeWidth="1.5" />
                                {[40, 58, 76, 94, 112, 130, 148, 166, 184, 202].map((x, i) => (
                                    <line key={i} x1={x} y1="80" x2={x + 6} y2="160" stroke="var(--cyan, #00e5ff)" strokeWidth="3" />
                                ))}

                                <text x="132" y="195" textAnchor="middle" fill="var(--cyan, #00e5ff)" fontSize="11" fontWeight="800">{t12(language, 'Pitch P = 1.5 mm (Medium)', 'Hatve P = 1.5 mm (Orta)')}</text>
                                <text x="132" y="215" textAnchor="middle" fill="var(--ink, #f8fafc)" fontSize="10">{t12(language, 'High vibration resistance (resists loosening)', 'Yüksek titreşim dayanımı (açılmaz)')}</text>
                                <text x="132" y="232" textAnchor="middle" fill="var(--alu-dim, #94a3b8)" fontSize="9.5">{t12(language, 'Larger core tensile area (As +12%)', 'Daha büyük çekirdek alanı (As +12%)')}</text>
                                <text x="132" y="252" textAnchor="middle" fill="var(--cyan, #00e5ff)" fontSize="10" fontWeight="700">{t12(language, 'Automotive & Aerospace', 'Otomotiv & Havacılık')}</text>
                            </g>

                            {/* 3. EXTRA FINE (EKSTRA İNCE) */}
                            <g transform="translate(600, 20)">
                                <rect width="265" height="270" rx="8" fill="var(--bg-2, #080f1a)" stroke="var(--std, #a855f7)" strokeWidth="1" strokeOpacity="0.5" />
                                <text x="132" y="30" textAnchor="middle" fill="var(--std, #a855f7)" fontSize="13" fontWeight="800">{t12(language, 'EXTRA FINE PITCH', 'EKSTRA İNCE (EXTRA FINE)')}</text>
                                <text x="132" y="47" textAnchor="middle" fill="var(--alu-dim, #94a3b8)" fontSize="10.5">{t12(language, 'Ex: 3/4-20 UNEF / M20×1.0', 'Örn: 3/4-20 UNEF / M20×1.0')}</text>

                                {/* Very dense teeth */}
                                <rect x="30" y="80" width="205" height="80" fill="var(--bg-3, #0f172a)" stroke="var(--std, #a855f7)" strokeWidth="1.5" />
                                {[35, 45, 55, 65, 75, 85, 95, 105, 115, 125, 135, 145, 155, 165, 175, 185, 195, 205].map((x, i) => (
                                    <line key={i} x1={x} y1="80" x2={x + 3} y2="160" stroke="var(--std, #a855f7)" strokeWidth="1.8" />
                                ))}

                                <text x="132" y="195" textAnchor="middle" fill="var(--std, #a855f7)" fontSize="11" fontWeight="800">{t12(language, 'Pitch P = 1.0 mm / 20 TPI (Fine)', 'Hatve P = 1.0 mm / 20 TPI (Sık)')}</text>
                                <text x="132" y="215" textAnchor="middle" fill="var(--ink, #f8fafc)" fontSize="10">{t12(language, 'Thin-walled tubes and housings', 'İnce cidarlı borular ve gövdeler')}</text>
                                <text x="132" y="232" textAnchor="middle" fill="var(--alu-dim, #94a3b8)" fontSize="9.5">{t12(language, 'Precision micrometer adjustment screws', 'Hassas mikrometrik ayar vidaları')}</text>
                                <text x="132" y="252" textAnchor="middle" fill="var(--std, #a855f7)" fontSize="10" fontWeight="700">{t12(language, 'Optics & Instrumentation', 'Optik & Enstrümantasyon')}</text>
                            </g>
                        </svg>
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════════════════
                    SUB-TAB 7: MALE AND FEMALE THREAD ASSEMBLY FIT (ISO 965 / DIN 13)
                   ═══════════════════════════════════════════════════════════════ */}
                {subTab === 'assembly_fit' && (
                    <div className="w-full space-y-4">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                            <div>
                                <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                    <ArrowLeftRight size={16} className="text-sky-400" />
                                    <span>{t12(language, 'Male & Female Thread Assembly Engagement & Fit Analysis (ISO 965 Fit)', 'Erkek ve Dişi Diş Montaj Kavraması & Boşluk Analizi (ISO 965 Fit)')}</span>
                                </h4>
                                <p className="text-[11.5px] text-slate-400">
                                    {t12(language, 'Under tensile preload, active load flanks bear in compression. Crest and root gaps (c) prevent jamming.', 'Civata çekme yükü altındayken aktif taşıyıcı yan yüzeyler (load flank) basma teması yapar. Kret ve köklerde sıkışmayı önleyen radyal boşluk (c) kalır.')}
                                </p>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] font-mono">
                                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">{t12(language, 'Load Flank Contact', 'Taşıyıcı Yan Yüzey')}</span>
                                <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">{t12(language, 'Axial Backlash', 'Eksenel Boşluk')}</span>
                                <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">{t12(language, 'Radial Clearance (c)', 'Radyal Boşluk (c)')}</span>
                            </div>
                        </div>

                        <svg
                            ref={svgRef}
                            viewBox="0 0 940 370"
                            className="w-full h-auto max-h-[400px] select-none font-mono bg-[var(--bg-0)] rounded-lg border border-white/10 p-1"
                            role="img"
                        >
                            <defs>
                                <pattern id="fit-nut-hatch" width="12" height="12" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                                    <line x1="0" y1="0" x2="0" y2="12" stroke="var(--cyan, #0ea5e9)" strokeWidth="1.2" strokeOpacity="0.35" />
                                </pattern>
                                <pattern id="fit-bolt-hatch" width="12" height="12" patternTransform="rotate(-45 0 0)" patternUnits="userSpaceOnUse">
                                    <line x1="0" y1="0" x2="0" y2="12" stroke="var(--warn, #f59e0b)" strokeWidth="1.2" strokeOpacity="0.35" />
                                </pattern>
                                <marker id="fit-arr-red" viewBox="0 0 6 6" refX="3" refY="3" markerWidth="4" markerHeight="4" orient="auto">
                                    <path d="M 0 0 L 6 3 L 0 6 z" fill="var(--bad, #ef4444)" />
                                </marker>
                                <marker id="fit-arr-sky" viewBox="0 0 6 6" refX="3" refY="3" markerWidth="4" markerHeight="4" orient="auto">
                                    <path d="M 0 0 L 6 3 L 0 6 z" fill="var(--cyan, #38bdf8)" />
                                </marker>
                                <marker id="fit-arr-gold" viewBox="0 0 6 6" refX="3" refY="3" markerWidth="4" markerHeight="4" orient="auto">
                                    <path d="M 0 0 L 6 3 L 0 6 z" fill="var(--warn, #fbbf24)" />
                                </marker>
                            </defs>

                            {/* Background Grid */}
                            <line x1="40" y1="161" x2="900" y2="161" stroke="var(--std, #a855f7)" strokeWidth="1.2" strokeDasharray="8 4 2 4" opacity="0.6" />
                            <text x="905" y="165" fill="#c084fc" fontSize="10" fontWeight="700">{t12(language, 'd₂ / D₂ Pitch Line', 'd₂ / D₂ Bölüm Dairesi (Pitch Line)')}</text>

                            {/* 1. DİŞİ DİŞ (SOMUN / NUT) - Metal on TOP (y: 25 -> contour) */}
                            {/* Profile: tooth 0 (100..380), tooth 1 (380..660), tooth 2 (660..880) */}
                            <path
                                d="M 40,25 L 890,25 L 890,222 L 852.5,222 L 782.5,222 L 695,70 L 660,70 L 572.5,222 L 502.5,222 L 415,70 L 380,70 L 292.5,222 L 222.5,222 L 135,70 L 100,70 L 40,174 Z"
                                fill="url(#fit-nut-hatch)"
                            />
                            <path
                                d="M 40,25 L 890,25 L 890,222 L 852.5,222 L 782.5,222 L 695,70 L 660,70 L 572.5,222 L 502.5,222 L 415,70 L 380,70 L 292.5,222 L 222.5,222 L 135,70 L 100,70 L 40,174 Z"
                                fill="#0369a1"
                                fillOpacity="0.12"
                                stroke="#0284c7"
                                strokeWidth="2"
                                strokeLinejoin="round"
                            />
                            {/* Nut Label */}
                            <rect x="520" y="35" width="280" height="26" rx="4" fill="var(--bg-3, #082f49)" stroke="var(--cyan, #0ea5e9)" strokeWidth="1" />
                            <text x="660" y="52" textAnchor="middle" fill="var(--cyan, #38bdf8)" fontSize="12" fontWeight="800">
                                {t12(language, 'INTERNAL THREAD (NUT / TAPPED HOLE) — 6H', 'DİŞİ DİŞ (SOMUN / TAPPED HOLE) — 6H')}
                            </text>

                            {/* 2. ERKEK DİŞ (CİVATA / BOLT) - Metal on BOTTOM (contour -> y: 345) */}
                            {/* Bolt contour never enters nut metal; right flank touches, left flank has backlash, crest/root have clearances */}
                            <path
                                d="M 40,345 L 890,345 L 890,140 L 782.5,222 L 755,246 L 725,246 L 671,140 L 670,88 L 635,88 L 516,246 L 485,246 L 431,140 L 425,88 L 390,88 L 278,246 L 246,246 L 191,140 L 145,88 L 110,88 L 40,210 Z"
                                fill="url(#fit-bolt-hatch)"
                            />
                            <path
                                d="M 40,345 L 890,345 L 890,140 L 782.5,222 L 755,246 L 725,246 L 671,140 L 670,88 L 635,88 L 516,246 L 485,246 L 431,140 L 425,88 L 390,88 L 278,246 L 246,246 L 191,140 L 145,88 L 110,88 L 40,210 Z"
                                fill="var(--warn, #b45309)"
                                fillOpacity="0.12"
                                stroke="#d97706"
                                strokeWidth="2.2"
                                strokeLinejoin="round"
                            />
                            {/* Bolt Label */}
                            <rect x="520" y="308" width="280" height="26" rx="4" fill="var(--warn-soft, #451a03)" stroke="var(--warn, #f59e0b)" strokeWidth="1" />
                            <text x="660" y="325" textAnchor="middle" fill="var(--warn, #fbbf24)" fontSize="12" fontWeight="800">
                                {t12(language, 'EXTERNAL THREAD (BOLT / SCREW) — 6g', 'ERKEK DİŞ (CİVATA / SCREW BOLT) — 6g')}
                            </text>

                            {/* 3. AKTİF TAŞIYICI YAN YÜZEYLER (ACTIVE LOAD FLANKS) - EMERALD CONTACT */}
                            {/* Flank 1 */}
                            <line x1="145" y1="88" x2="222.5" y2="222" stroke="var(--ok, #10b981)" strokeWidth="4.5" strokeLinecap="round" />
                            {/* Flank 2 */}
                            <line x1="425" y1="88" x2="502.5" y2="222" stroke="var(--ok, #10b981)" strokeWidth="4.5" strokeLinecap="round" />
                            {/* Flank 3 */}
                            <line x1="705" y1="88" x2="782.5" y2="222" stroke="var(--ok, #10b981)" strokeWidth="4.5" strokeLinecap="round" />

                            {/* Load Flank Callout Arrow */}
                            <path d="M 330,120 L 455,145" stroke="var(--ok, #10b981)" strokeWidth="1.8" markerEnd="url(#fit-arr-gold)" />
                            <rect x="180" y="102" width="200" height="32" rx="4" fill="#064e3b" stroke="var(--ok, #10b981)" strokeWidth="1" />
                            <text x="280" y="116" textAnchor="middle" fill="var(--ok, #34d399)" fontSize="10.5" fontWeight="800">{t12(language, 'ACTIVE LOAD FLANK', 'AKTİF TAŞIYICI YÜZEY')}</text>
                            <text x="280" y="129" textAnchor="middle" fill="#a7f3d0" fontSize="9">{t12(language, 'Load Bearing Contact (0 Gap)', 'Yük Basma Teması (0 Boşluk)')}</text>

                            {/* 4. EKSENEL BOŞLUK (AXIAL BACKLASH) - SKY BLUE CALLOUT */}
                            <line x1="337" y1="180" x2="355" y2="180" stroke="var(--cyan, #38bdf8)" strokeWidth="2" markerStart="url(#fit-arr-sky)" markerEnd="url(#fit-arr-sky)" />
                            <path d="M 346,180 L 346,240 L 320,240" fill="none" stroke="var(--cyan, #38bdf8)" strokeWidth="1.2" />
                            <rect x="195" y="226" width="120" height="28" rx="4" fill="var(--bg-3, #082f49)" stroke="var(--cyan, #38bdf8)" strokeWidth="1" />
                            <text x="255" y="239" textAnchor="middle" fill="var(--cyan, #38bdf8)" fontSize="9.5" fontWeight="800">{t12(language, 'Axial Backlash', 'Eksenel Boşluk')}</text>
                            <text x="255" y="250" textAnchor="middle" fill="#bae6fd" fontSize="8.5">{t12(language, '6g Tolerance (Backlash)', '6g Toleransı (Backlash)')}</text>

                            {/* 5. RADYAL TEPE BOŞLUĞU (CREST CLEARANCE GAP c) */}
                            {/* At tooth 1 crest: Nut root y=70, Bolt crest y=88 -> gap = 18 */}
                            <line x1="407" y1="70" x2="407" y2="88" stroke="var(--bad, #ef4444)" strokeWidth="1.8" markerStart="url(#fit-arr-red)" markerEnd="url(#fit-arr-red)" />
                            <line x1="380" y1="70" x2="430" y2="70" stroke="var(--bad, #ef4444)" strokeWidth="0.8" strokeDasharray="2 2" opacity="0.7" />
                            <line x1="390" y1="88" x2="430" y2="88" stroke="var(--bad, #ef4444)" strokeWidth="0.8" strokeDasharray="2 2" opacity="0.7" />
                            <rect x="420" y="68" width="135" height="24" rx="3" fill="var(--bad-soft, #450a0a)" stroke="var(--bad, #ef4444)" strokeWidth="1" />
                            <text x="487" y="80" textAnchor="middle" fill="var(--bad, #f87171)" fontSize="9" fontWeight="800">{t12(language, 'Crest Gap c', 'Tepe Boşluğu c')}</text>
                            <text x="487" y="90" textAnchor="middle" fill="var(--bad, #fca5a5)" fontSize="8">{t12(language, 'c ≈ 0.054·P (Anti-Jamming)', 'c ≈ 0.054·P (Sıkışma Önler)')}</text>

                            {/* 6. RADYAL KÖK BOŞLUĞU (ROOT CLEARANCE) */}
                            {/* At tooth 1 root: Nut crest y=222, Bolt root y=246 -> gap = 24 */}
                            <line x1="500" y1="222" x2="500" y2="246" stroke="var(--bad, #ef4444)" strokeWidth="1.8" markerStart="url(#fit-arr-red)" markerEnd="url(#fit-arr-red)" />
                            <rect x="515" y="235" width="130" height="24" rx="3" fill="var(--bad-soft, #450a0a)" stroke="var(--bad, #ef4444)" strokeWidth="1" />
                            <text x="580" y="247" textAnchor="middle" fill="var(--bad, #f87171)" fontSize="9" fontWeight="800">{t12(language, 'Root Clearance', 'Kök Boşluğu')}</text>
                            <text x="580" y="256" textAnchor="middle" fill="var(--bad, #fca5a5)" fontSize="8">{t12(language, 'R = H/6 Root Radius', 'R = H/6 Yuvarlatma')}</text>

                            {/* 7. KAVRAMA DERİNLİĞİ H1 (WORKING ENGAGEMENT DEPTH) */}
                            <g transform="translate(60, 0)">
                                <line x1="15" y1="70" x2="15" y2="222" stroke="var(--warn, #fbbf24)" strokeWidth="1.8" markerStart="url(#fit-arr-gold)" markerEnd="url(#fit-arr-gold)" />
                                <line x1="8" y1="70" x2="22" y2="70" stroke="var(--warn, #fbbf24)" strokeWidth="1.2" />
                                <line x1="8" y1="222" x2="22" y2="222" stroke="var(--warn, #fbbf24)" strokeWidth="1.2" />
                                <rect x="25" y="132" width="100" height="28" rx="3" fill="var(--warn-soft, #451a03)" stroke="var(--warn, #fbbf24)" strokeWidth="1" />
                                <text x="75" y="145" textAnchor="middle" fill="var(--warn, #fbbf24)" fontSize="9.5" fontWeight="800">{t12(language, 'H₁ Engagement', 'H₁ Kavrama')}</text>
                                <text x="75" y="156" textAnchor="middle" fill="#fde68a" fontSize="8.5">H₁ = 5/8·H</text>
                            </g>

                            {/* 8. HATVE P (PITCH) */}
                            <g transform="translate(380, 0)">
                                <line x1="0" y1="48" x2="280" y2="48" stroke="var(--alu, #cbd5e1)" strokeWidth="1.4" markerStart="url(#fit-arr-gold)" markerEnd="url(#fit-arr-gold)" />
                                <line x1="0" y1="42" x2="0" y2="68" stroke="var(--alu, #cbd5e1)" strokeWidth="1" strokeDasharray="2 2" />
                                <line x1="280" y1="42" x2="280" y2="68" stroke="var(--alu, #cbd5e1)" strokeWidth="1" strokeDasharray="2 2" />
                                <rect x="110" y="38" width="60" height="18" rx="2" fill="var(--bg-3, #0f172a)" stroke="var(--alu, #cbd5e1)" strokeWidth="0.8" />
                                <text x="140" y="51" textAnchor="middle" fill="var(--ink, #f8fafc)" fontSize="10" fontWeight="800">{t12(language, 'Pitch P', 'Hatve P')}</text>
                            </g>
                        </svg>

                        {/* Engineering Analysis Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/30">
                                <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs mb-1">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                                    <span>{t12(language, 'Active Load Flank', 'Aktif Taşıyıcı Yan Yüzey (Load Flank)')}</span>
                                </div>
                                <p className="text-[11px] text-slate-300 leading-relaxed">
                                    {t12(language, 'When tightened, axial tension forces the bolt flank against the nut flank. Thread load distribution theory shows 65% of axial load is carried by the first 3 engaged threads.', 'Civata sıkıldığında eksenel çekme kuvveti vidanın üst yan yüzeyini somunun alt yan yüzeyine bastırır. Diş kavrama teorisine göre eksenel yükün %65\'i ilk 3 dişte karşılanır.')}
                                </p>
                            </div>

                            <div className="p-3 rounded-lg bg-sky-950/30 border border-sky-500/30">
                                <div className="flex items-center gap-1.5 text-sky-400 font-bold text-xs mb-1">
                                    <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                                    <span>{t12(language, 'Axial Backlash (6g / 6H)', 'Eksenel Boşluk (Axial Backlash)')}</span>
                                </div>
                                <p className="text-[11px] text-slate-300 leading-relaxed">
                                    {t12(language, 'In standard metric fits, bolts are produced to 6g tolerance with negative fundamental deviation (es < 0). This clearance accommodates plating (galvanizing/cadmium) and thermal expansion.', 'Standart metrik geçmelerde civata 6g (negatif temel sapma es < 0) toleransıyla üretilir. Bu boşluk kaplama payını (galvaniz/kadmiyum) ve termal genleşmeyi absorbe eder.')}
                                </p>
                            </div>

                            <div className="p-3 rounded-lg bg-red-950/30 border border-red-500/30">
                                <div className="flex items-center gap-1.5 text-red-400 font-bold text-xs mb-1">
                                    <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                                    <span>{t12(language, 'Radial Root & Crest Clearance', 'Radyal Kök & Tepe Boşluğu (Clearance)')}</span>
                                </div>
                                <p className="text-[11px] text-slate-300 leading-relaxed">
                                    {t12(language, 'The bolt crest flat (P/8) never bottoms in the nut root (c ≈ 0.054·P). The root radius R = H/6 reduces notch stress concentration and fatigue.', 'Civata kret düzlüğü (P/8) somun kök üçgenine asla oturmaz (c ≈ 0.054·P). Civata dibindeki R = H/6 yuvarlatması çentik yorulmasını engeller.')}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════════════════
                    SUB-TAB 8: PIPE THREAD SEALS & JOINTS
                    Inpart24: Pipe-threads-examples.jpg
                   ═══════════════════════════════════════════════════════════════ */}
                {subTab === 'pipe_sealing' && (
                    <div className="w-full space-y-3">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                            <div>
                                <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                    <ShieldCheck size={15} className="text-purple-400" />
                                    <span>{t12(language, 'Industrial Pipe Thread Sealing Principles (ISO / ASME Standards)', 'Endüstriyel Boru Dişleri Sızdırmazlık Prensipleri (Inpart24 Article 37)')}</span>
                                </h4>
                                <p className="text-[11px] text-slate-400">
                                    {t12(language, 'Four primary sealing methods are used in fluid power: Tapered sealant, Metallic Dryseal, Bonded face seal, and 37° flared cone (JIC).', 'Hidrolik ve pnömatikte 4 ana sızdırmazlık yöntemi kullanılır: Konik macunlu, Kuru metalik (Dryseal), Alın contalı (Bonded seal) ve 37° havşa konisi (JIC).')}
                                </p>
                            </div>
                        </div>

                        <svg
                            ref={svgRef}
                            viewBox="0 0 900 320"
                            className="w-full h-auto max-h-[360px] select-none font-mono"
                            role="img"
                        >
                            <rect width="900" height="320" fill="var(--bg-1, #020408)" rx="8" />

                            {/* 1. NPT / BSPT Tapered Seal */}
                            <g transform="translate(20, 20)">
                                <rect width="205" height="270" rx="8" fill="var(--bg-2, #080f1a)" stroke="var(--ok, #10b981)" strokeWidth="0.8" strokeOpacity="0.5" />
                                <text x="102" y="26" textAnchor="middle" fill="var(--ok, #10b981)" fontSize="12" fontWeight="800">{t12(language, '1. TAPERED + SEALANT', '1. KONİK MACUNLU')}</text>
                                <text x="102" y="44" textAnchor="middle" fill="var(--alu-dim, #94a3b8)" fontSize="10">NPT (60°) / BSPT R (55°)</text>

                                <polygon points="30,85 175,70 175,155 30,140" fill="var(--bg-3, #0f172a)" stroke="var(--ok, #10b981)" strokeWidth="1.5" />
                                <text x="102" y="115" textAnchor="middle" fill="var(--warn, #fbbf24)" fontSize="10.5" fontWeight="800">{t12(language, '1:16 Taper Wedge', '1:16 Konik Sıkışma')}</text>

                                <text x="102" y="185" textAnchor="middle" fill="var(--ink, #f8fafc)" fontSize="9.5">{t12(language, 'PTFE thread tape or', 'PTFE teflon bant veya')}</text>
                                <text x="102" y="200" textAnchor="middle" fill="var(--ink, #f8fafc)" fontSize="9.5">{t12(language, 'anaerobic pipe sealant', 'anaerobik sızdırmazlık macunu')}</text>
                                <text x="102" y="218" textAnchor="middle" fill="var(--alu-dim, #94a3b8)" fontSize="9">{t12(language, 'Blocks helical leak path', 'Helisel kaçak yolunu tıkar')}</text>
                                <text x="102" y="248" textAnchor="middle" fill="var(--ok, #10b981)" fontSize="10" fontWeight="700">{t12(language, 'Plumbing & Water/Gas', 'Genel Tesisat & Su/Gaz')}</text>
                            </g>

                            {/* 2. NPTF DRYSEAL */}
                            <g transform="translate(235, 20)">
                                <rect width="205" height="270" rx="8" fill="var(--bg-2, #080f1a)" stroke="var(--cyan, #00e5ff)" strokeWidth="0.8" strokeOpacity="0.5" />
                                <text x="102" y="26" textAnchor="middle" fill="var(--cyan, #00e5ff)" fontSize="12" fontWeight="800">{t12(language, '2. METALLIC DRYSEAL', '2. METALİK KURU (DRYSEAL)')}</text>
                                <text x="102" y="44" textAnchor="middle" fill="var(--alu-dim, #94a3b8)" fontSize="10">NPTF (ASME B1.20.3)</text>

                                <polygon points="30,85 175,70 175,155 30,140" fill="var(--bg-3, #0f172a)" stroke="var(--cyan, #00e5ff)" strokeWidth="1.5" />
                                <text x="102" y="115" textAnchor="middle" fill="var(--cyan, #00e5ff)" fontSize="10.5" fontWeight="800">{t12(language, 'Crest-Root Crush', 'Kret-Kök Ezilmesi')}</text>

                                <text x="102" y="185" textAnchor="middle" fill="var(--ink, #f8fafc)" fontSize="9.5">{t12(language, 'NO tape/sealant used.', 'Bant/macun KULLANILMAZ.')}</text>
                                <text x="102" y="200" textAnchor="middle" fill="var(--ink, #f8fafc)" fontSize="9.5">{t12(language, 'Thread crests crush into', 'Diş kretleri köklere plastik')}</text>
                                <text x="102" y="218" textAnchor="middle" fill="var(--alu-dim, #94a3b8)" fontSize="9">{t12(language, 'roots via plastic yield.', 'deformasyonla basar.')}</text>
                                <text x="102" y="248" textAnchor="middle" fill="var(--cyan, #00e5ff)" fontSize="10" fontWeight="700">{t12(language, 'Fuel & Heavy Hydraulics', 'Yakıt & Ağır Hidrolik')}</text>
                            </g>

                            {/* 3. BSPP (G) + DOWTY SEAL */}
                            <g transform="translate(450, 20)">
                                <rect width="205" height="270" rx="8" fill="var(--bg-2, #080f1a)" stroke="var(--warn, #f59e0b)" strokeWidth="0.8" strokeOpacity="0.5" />
                                <text x="102" y="26" textAnchor="middle" fill="var(--warn, #f59e0b)" fontSize="12" fontWeight="800">{t12(language, '3. PARALLEL + BONDED SEAL', '3. PARALEL + DOWTY PUL')}</text>
                                <text x="102" y="44" textAnchor="middle" fill="var(--alu-dim, #94a3b8)" fontSize="10">BSPP (G) / NPSM</text>

                                <rect x="30" y="80" width="145" height="65" fill="var(--bg-3, #0f172a)" stroke="var(--warn, #f59e0b)" strokeWidth="1.5" />
                                <rect x="155" y="70" width="15" height="85" rx="2" fill="var(--bad, #ef4444)" stroke="var(--bad, #f87171)" strokeWidth="1" />

                                <text x="102" y="185" textAnchor="middle" fill="var(--ink, #f8fafc)" fontSize="9.5">{t12(language, 'Bonded rubber elastomeric or', 'Kauçuk bonded conta veya')}</text>
                                <text x="102" y="200" textAnchor="middle" fill="var(--ink, #f8fafc)" fontSize="9.5">{t12(language, 'copper washer seals at face.', 'bakır pul alından basar.')}</text>
                                <text x="102" y="218" textAnchor="middle" fill="var(--alu-dim, #94a3b8)" fontSize="9">{t12(language, 'Thread only provides clamp.', 'Diş sadece mekanik tutar.')}</text>
                                <text x="102" y="248" textAnchor="middle" fill="var(--warn, #f59e0b)" fontSize="10" fontWeight="700">{t12(language, 'European Hydraulic Manifolds', 'Avrupa Hidrolik Blokları')}</text>
                            </g>

                            {/* 4. JIC 37° CONE */}
                            <g transform="translate(665, 20)">
                                <rect width="215" height="270" rx="8" fill="var(--bg-2, #080f1a)" stroke="var(--std, #a855f7)" strokeWidth="0.8" strokeOpacity="0.5" />
                                <text x="107" y="26" textAnchor="middle" fill="var(--std, #a855f7)" fontSize="12" fontWeight="800">{t12(language, '4. 37° FLARED CONE', '4. 37° HAVŞA KONİSİ')}</text>
                                <text x="107" y="44" textAnchor="middle" fill="var(--alu-dim, #94a3b8)" fontSize="10">JIC (SAE J514 / ISO 8434-2)</text>

                                <polygon points="30,85 140,85 180,115 140,145 30,145" fill="var(--bg-3, #0f172a)" stroke="var(--std, #a855f7)" strokeWidth="1.5" />
                                <line x1="140" y1="85" x2="180" y2="115" stroke="var(--warn, #fbbf24)" strokeWidth="2.5" />
                                <text x="107" y="115" textAnchor="middle" fill="var(--warn, #fbbf24)" fontSize="10.5" fontWeight="800">{t12(language, '37° Metallic Cone Seat', '37° Metalik Koni')}</text>

                                <text x="107" y="185" textAnchor="middle" fill="var(--ink, #f8fafc)" fontSize="9.5">{t12(language, 'Up to 10,000 PSI metal-to-', '10.000 PSI basınca kadar')}</text>
                                <text x="107" y="200" textAnchor="middle" fill="var(--ink, #f8fafc)" fontSize="9.5">{t12(language, 'metal conical seal.', 'metal-metale konik sızdırmazlık.')}</text>
                                <text x="107" y="218" textAnchor="middle" fill="var(--alu-dim, #94a3b8)" fontSize="9">{t12(language, 'UN 60° thread only clamps.', 'UN 60° diş sadece sıkar.')}</text>
                                <text x="107" y="248" textAnchor="middle" fill="var(--std, #a855f7)" fontSize="10" fontWeight="700">{t12(language, 'Aerospace & High Pressure', 'Havacılık & Yüksek Basınç')}</text>
                            </g>
                        </svg>
                    </div>
                )}
            </div>
        </div>
    );
};
