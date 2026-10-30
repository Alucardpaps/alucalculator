'use client';

import React, { useState, useId, useMemo } from 'react';
import { ZoomIn, Maximize2, Info } from 'lucide-react';
import { useI18nStore, Language } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';

export interface UndercutVisualizerProps {
    dSmall: number;
    dLarge: number;
    r: number;
    form?: 'E' | 'F' | 'G' | 'H';
    t1?: number;
    t2?: number;
    f?: number;
    g?: number;
    z1?: number;
    z2?: number;
    angleFace?: number;
    angleCylinder?: number;
    language?: Language;
    hideLegend?: boolean;
}

export function UndercutVisualizer({
    dSmall,
    dLarge,
    r,
    form = 'E',
    t1 = 0.2,
    t2 = 0.1,
    f: propF,
    g: propG,
    z1 = 2.0,
    z2 = 3.0,
    angleFace: propAngleFace,
    angleCylinder: propAngleCyl,
    language: propLang,
    hideLegend = false,
}: UndercutVisualizerProps) {
    const { language: storeLang } = useI18nStore();
    const language = propLang || storeLang;

    const rawId = useId().replace(/:/g, '');
    const [viewMode, setViewMode] = useState<'detail' | 'shaft'>('detail');

    // Standard fallback values per DIN 509:2006
    const standardF = propF ?? (dSmall <= 10 ? 2.5 : dSmall <= 50 ? 2.5 : dSmall <= 125 ? 4.0 : 5.0);
    const standardG = propG ?? (dSmall <= 10 ? 1.0 : dSmall <= 50 ? 1.4 : dSmall <= 125 ? 2.5 : 3.5);
    const angleCylinder = propAngleCyl ?? (form === 'G' ? 17.5 : 15);
    const angleFace = propAngleFace ?? (form === 'G' ? 55 : form === 'H' ? 60 : form === 'F' ? 8 : 0);
    const safeT2 = form === 'E' ? 0 : (t2 ?? 0.1);

    const hatchId = `undercut-hatch-${rawId}`;
    const arrowCyan = `arrow-cyan-${rawId}`;
    const arrowAmber = `arrow-amber-${rawId}`;
    const arrowGreen = `arrow-green-${rawId}`;
    const arrowPurple = `arrow-purple-${rawId}`;

    const vbW = hideLegend ? 560 : 800;
    const vbH = 430;

    return (
        <div className="w-full flex flex-col select-none rounded-2xl overflow-hidden border border-slate-800 bg-[var(--bg-0)] shadow-2xl">
            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-[var(--bg-0)] border-b border-slate-800 text-xs font-mono">
                <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-bold tracking-wide">
                        DIN 509 Form {form}
                    </span>
                    <span className="text-slate-300 font-medium hidden sm:inline">
                        {form === 'E' && t12(language, 'Only Cylindrical Grinding (Nur Zylinderschliff)', 'Yalnız Silindirik Taşlama (Nur Zylinderschliff)')}
                        {form === 'F' && t12(language, 'Cylindrical + Face Grinding (Zylinder- und Planschliff)', 'Silindirik + Alın Taşlama (Zylinder- und Planschliff)')}
                        {form === 'G' && t12(language, '55° Face Relief Undercut', '55° Açılı Alın Taşlama Boşaltması')}
                        {form === 'H' && t12(language, '60° Face Relief Undercut', '60° Açılı Alın Taşlama Boşaltması')}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    {/* View Switcher: Detail Z vs Full Shaft */}
                    <div className="flex bg-slate-900/80 p-0.5 rounded-lg border border-slate-800">
                        <button
                            type="button"
                            onClick={() => setViewMode('detail')}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                                viewMode === 'detail'
                                    ? 'bg-[var(--cyan)] text-[var(--accent-ink)] shadow-md '
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            <ZoomIn size={13} />
                            <span>{t12(language, 'Detail Z (10:1)', 'Detay Z (M 10:1)')}</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('shaft')}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                                viewMode === 'shaft'
                                    ? 'bg-[var(--cyan)] text-[var(--accent-ink)] shadow-md '
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            <Maximize2 size={13} />
                            <span>{t12(language, 'Full Shaft (1:1)', 'Komple Şaft (1:1)')}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* SVG Canvas Area */}
            <div className="relative w-full flex items-center justify-center p-2 bg-[var(--bg-1)] border border-[var(--line)] rounded-xl overflow-hidden">
                <svg
                    viewBox={`0 0 ${vbW} ${vbH}`}
                    className="w-full h-auto min-h-[360px] max-h-[500px]"
                    preserveAspectRatio="xMidYMid meet"
                >
                    <defs>
                        {/* 45 Degree Engineering Section Hatching */}
                        <pattern id={hatchId} patternUnits="userSpaceOnUse" width="14" height="14" patternTransform="rotate(45)">
                            <line x1="0" y1="0" x2="0" y2="14" stroke="var(--cyan, #38bdf8)" strokeWidth="1.2" opacity="0.30" />
                        </pattern>

                        {/* Arrowheads */}
                        <marker id={arrowCyan} viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                            <path d="M 0,1.5 L 9,5 L 0,8.5 Z" fill="#00e5ff" />
                        </marker>
                        <marker id={arrowAmber} viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                            <path d="M 0,1.5 L 9,5 L 0,8.5 Z" fill="#f59e0b" />
                        </marker>
                        <marker id={arrowGreen} viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                            <path d="M 0,1.5 L 9,5 L 0,8.5 Z" fill="#34d399" />
                        </marker>
                        <marker id={arrowPurple} viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                            <path d="M 0,1.5 L 9,5 L 0,8.5 Z" fill="#c084fc" />
                        </marker>

                        {/* Surface Glow Gradient */}
                        <linearGradient id={`glow-${rawId}`} x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.12" />
                            <stop offset="100%" stopColor="#00e5ff" stopOpacity="0.0" />
                        </linearGradient>
                    </defs>

                    {/* Blueprint Grid Lines */}
                    <rect width={vbW} height={vbH} fill="var(--bg-2)" stroke="var(--line)" rx="8" />
                    {Array.from({ length: Math.ceil(vbW / 40) + 1 }).map((_, i) => (
                        <line
                            key={`v${i}`}
                            x1={i * 40}
                            y1={0}
                            x2={i * 40}
                            y2={vbH}
                            stroke="var(--cyan, #00e5ff)"
                            strokeWidth="0.6"
                            opacity={i % 4 === 0 ? 0.08 : 0.025}
                        />
                    ))}
                    {Array.from({ length: Math.ceil(vbH / 40) + 1 }).map((_, i) => (
                        <line
                            key={`h${i}`}
                            x1={0}
                            y1={i * 40}
                            x2={vbW}
                            y2={i * 40}
                            stroke="var(--cyan, #00e5ff)"
                            strokeWidth="0.6"
                            opacity={i % 4 === 0 ? 0.08 : 0.025}
                        />
                    ))}

                    {/* Standard Outer Drawing Frame */}
                    <rect x="12" y="12" width={vbW - 24} height={vbH - 24} fill="none" stroke="var(--line, #1e293b)" strokeWidth="1.4" rx="4" />
                    <rect x="16" y="16" width={vbW - 32} height={vbH - 32} fill="none" stroke="var(--line, #334155)" strokeWidth="0.7" />

                    {/* MAIN DRAWING AREA */}
                    {viewMode === 'detail' ? (
                        <DetailZView
                            form={form}
                            dSmall={dSmall}
                            dLarge={dLarge}
                            r={r}
                            t1={t1}
                            t2={safeT2}
                            f={standardF}
                            g={standardG}
                            angleCylinder={angleCylinder}
                            angleFace={angleFace}
                            hatchId={hatchId}
                            arrowCyan={arrowCyan}
                            arrowAmber={arrowAmber}
                            arrowGreen={arrowGreen}
                            arrowPurple={arrowPurple}
                            language={language}
                            hideLegend={hideLegend}
                        />
                    ) : (
                        <FullShaftView
                            form={form}
                            dSmall={dSmall}
                            dLarge={dLarge}
                            r={r}
                            t1={t1}
                            t2={safeT2}
                            f={standardF}
                            g={standardG}
                            angleCylinder={angleCylinder}
                            angleFace={angleFace}
                            hatchId={hatchId}
                            arrowCyan={arrowCyan}
                            arrowAmber={arrowAmber}
                            arrowGreen={arrowGreen}
                            arrowPurple={arrowPurple}
                            language={language}
                            hideLegend={hideLegend}
                        />
                    )}

                    {/* RIGHT HUD TECHNICAL DIMENSIONS PANEL (Only when hideLegend is false) */}
                    {!hideLegend && (
                        <g transform="translate(540, 24)">
                            <rect
                                x="0"
                                y="0"
                                width="236"
                                height="382"
                                rx="10"
                                fill="var(--bg-1)"
                                stroke="var(--cyan, #00e5ff)"
                                strokeWidth="1.2"
                                strokeOpacity="0.3"
                            />
                            <rect x="0" y="0" width="236" height="38" rx="10" fill={`url(#glow-${rawId})`} />

                            <text x="14" y="24" fontSize="11" fontWeight="900" fill="var(--cyan, #00e5ff)" fontFamily="ui-monospace, monospace" letterSpacing="0.12em">
                                {t12(language, 'TECHNICAL SPECS (DIN 509)', 'TEKNİK ÖLÇÜLER (DIN 509)')}
                            </text>
                            <line x1="0" y1="38" x2="236" y2="38" stroke="var(--cyan, #00e5ff)" strokeWidth="1" strokeOpacity="0.25" />

                            <g transform="translate(14, 62)" className="font-mono">
                                <text x="0" y="0" fontSize="9" fill="var(--muted, #64748b)">{t12(language, 'STANDARD FORM:', 'STANDART FORM:')}</text>
                                <text x="0" y="16" fontSize="13.5" fontWeight="900" fill="var(--cyan, #38bdf8)">
                                    DIN 509 - Form {form}
                                </text>
                            </g>

                            <g transform="translate(14, 108)" className="font-mono">
                                <text x="0" y="0" fontSize="9" fill="var(--alu-dim, #94a3b8)">{t12(language, 'Shaft Dia (d₁):', 'Mil Çapı (d₁):')}</text>
                                <text x="0" y="16" fontSize="13" fontWeight="bold" fill="var(--ink, #f8fafc)">Ø {dSmall} mm</text>

                                <text x="110" y="0" fontSize="9" fill="var(--alu-dim, #94a3b8)">{t12(language, 'Shoulder (D):', 'Kademe (D):')}</text>
                                <text x="110" y="16" fontSize="13" fontWeight="bold" fill="var(--cyan, #00e5ff)">Ø {dLarge} mm</text>
                            </g>

                            <g transform="translate(14, 154)" className="font-mono">
                                <text x="0" y="0" fontSize="9" fill="var(--alu-dim, #94a3b8)">{t12(language, 'Fillet Radius (r):', 'Kavis Yarıçapı (r):')}</text>
                                <text x="0" y="16" fontSize="13.5" fontWeight="900" fill="#f59e0b">R {r} mm</text>

                                <text x="110" y="0" fontSize="9" fill="var(--alu-dim, #94a3b8)">{t12(language, 'Radial Depth (t₁):', 'Radyal Dalma (t₁):')}</text>
                                <text x="110" y="16" fontSize="13.5" fontWeight="900" fill="var(--cyan, #38bdf8)">{t1.toFixed(2)} mm</text>
                            </g>

                            {form !== 'E' && (
                                <g transform="translate(14, 200)" className="font-mono">
                                    <text x="0" y="0" fontSize="9" fill="var(--alu-dim, #94a3b8)">{t12(language, 'Face Depth (t₂):', 'Alın Dalma (t₂):')}</text>
                                    <text x="0" y="16" fontSize="13" fontWeight="bold" fill="#c084fc">{safeT2.toFixed(2)} mm</text>

                                    <text x="110" y="0" fontSize="9" fill="var(--alu-dim, #94a3b8)">{t12(language, 'Face Height (g):', 'Alın Yükseklik (g):')}</text>
                                    <text x="110" y="16" fontSize="13" fontWeight="bold" fill="var(--ink, #f8fafc)">{standardG.toFixed(1)} mm</text>
                                </g>
                            )}

                            <g transform={`translate(14, ${form === 'E' ? 200 : 246})`} className="font-mono">
                                <text x="0" y="0" fontSize="9" fill="var(--alu-dim, #94a3b8)">{t12(language, 'Relief Width (f):', 'Oyuk Genişliği (f):')}</text>
                                <text x="0" y="16" fontSize="13" fontWeight="bold" fill="#34d399">{standardF.toFixed(1)} mm</text>

                                <text x="110" y="0" fontSize="9" fill="var(--alu-dim, #94a3b8)">{t12(language, 'Shaft Ramp:', 'Mil Rampası:')}</text>
                                <text x="110" y="16" fontSize="13" fontWeight="bold" fill="#fbbf24">{angleCylinder}°</text>
                            </g>

                            <g transform={`translate(14, ${form === 'E' ? 254 : 300})`} className="font-mono">
                                <line x1="0" y1="0" x2="208" y2="0" stroke="var(--line, rgba(255,255,255,0.1))" />
                                <text x="0" y="16" fontSize="9" fill="var(--alu-dim, #94a3b8)">{t12(language, 'Grinding Roughness:', 'Taşlama Pürüzlülüğü:')}</text>
                                <text x="0" y="32" fontSize="12" fontWeight="bold" fill="#f59e0b">Ra 0.8 µm (N6)</text>
                            </g>
                        </g>
                    )}
                </svg>
            </div>

            {/* Bottom Engineering Summary Bar */}
            <div className="px-4 py-2 bg-slate-950 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400">
                <div className="flex items-center gap-2">
                    <Info size={14} className="text-cyan-400 shrink-0" />
                    <span>
                        {form === 'E' && t12(language, 'Form E: Only cylindrical surface ground; perpendicular shoulder face remains flat.', 'Form E: Sadece silindirik yüzey taşlanır; dik alın yüzeyi düz kalır.')}
                        {form === 'F' && t12(language, 'Form F: Both cylindrical surface and perpendicular shoulder face are ground simultaneously.', 'Form F: Hem silindirik yüzey hem dik fatura alnı aynı anda taşlanır.')}
                        {form === 'G' && t12(language, 'Form G: 55° relief undercut for high dynamic loads.', 'Form G: Yüksek dinamik yükler için 55° açılı genişletilmiş boşaltma oyuğu.')}
                        {form === 'H' && t12(language, 'Form H: 60° relief undercut for heavy duty and high fatigue resistance.', 'Form H: Ağır hizmet ve yüksek yorulma direnci için 60° açılı serbest oyuk.')}
                    </span>
                </div>
                <div className="text-slate-500 font-bold">
                    {t12(language, 'DIN 509:2006 Standard', 'DIN 509:2006 Standardı')}
                </div>
            </div>
        </div>
    );
}

// =============================================================================
// VIEW 1: DETAY Z (BÜYÜTÜLMÜŞ KESİT - M 10:1 / 20:1)
// Fully scaled up so the undercut groove dominates the canvas with 14px badges
// =============================================================================

function DetailZView({
    form,
    dSmall,
    dLarge,
    r,
    t1,
    t2,
    f,
    g,
    angleCylinder,
    angleFace,
    hatchId,
    arrowCyan,
    arrowAmber,
    arrowGreen,
    arrowPurple,
    language,
    hideLegend,
}: {
    form: 'E' | 'F' | 'G' | 'H';
    dSmall: number;
    dLarge: number;
    r: number;
    t1: number;
    t2: number;
    f: number;
    g: number;
    angleCylinder: number;
    angleFace: number;
    hatchId: string;
    arrowCyan: string;
    arrowAmber: string;
    arrowGreen: string;
    arrowPurple: string;
    language?: Language;
    hideLegend?: boolean;
}) {
    const geom = useMemo(() => {
        // Shoulder face starts at x = 96
        const faceX = hideLegend ? 96 : 85;
        const shaftY = 205;
        // Scaled radial depth so the groove is prominent but fits within viewbox
        const scaledT1 = 54;
        const bottomY = shaftY + scaledT1; // 259
        const R = 38; // 38px fillet radius
        const scaledG = 105;
        const yg = shaftY - scaledG; // 100
        const faceTopY = 38;
        const shaftEndX = hideLegend ? 485 : 440;
        const alphaRamp = (angleCylinder * Math.PI) / 180;

        if (form === 'E') {
            const xc1 = faceX + R;
            const yc1 = bottomY - R;
            const p0 = { x: faceX, y: yc1 };
            const p1 = { x: xc1, y: bottomY };

            // Flat bottom length
            const flatW = 34;
            const xc2 = xc1 + flatW;
            const p2 = { x: xc2, y: bottomY };

            // Arc 2: tangent to bottom, curves counter-clockwise to alphaRamp
            const p3 = {
                x: xc2 + R * Math.sin(alphaRamp),
                y: bottomY - R * (1 - Math.cos(alphaRamp)),
            };

            // 15° ramp straight to shaftY
            const dxRamp = (p3.y - shaftY) / Math.tan(alphaRamp);
            const p4 = {
                x: p3.x + dxRamp,
                y: shaftY,
            };

            const outlinePath = `
                M ${faceX} ${faceTopY}
                L ${p0.x} ${p0.y}
                A ${R} ${R} 0 0 0 ${p1.x} ${p1.y}
                L ${p2.x} ${p2.y}
                A ${R} ${R} 0 0 0 ${p3.x.toFixed(2)} ${p3.y.toFixed(2)}
                L ${p4.x.toFixed(2)} ${p4.y.toFixed(2)}
                L ${shaftEndX} ${shaftY}
            `;

            const hatchPolygon = `
                M ${faceX} ${faceTopY}
                L ${p0.x} ${p0.y}
                A ${R} ${R} 0 0 0 ${p1.x} ${p1.y}
                L ${p2.x} ${p2.y}
                A ${R} ${R} 0 0 0 ${p3.x.toFixed(2)} ${p3.y.toFixed(2)}
                L ${p4.x.toFixed(2)} ${p4.y.toFixed(2)}
                L ${shaftEndX} ${shaftY}
                L ${shaftEndX} 415
                L 24 415
                L 24 ${faceTopY}
                Z
            `;

            return {
                outlinePath,
                hatchPolygon,
                faceX,
                faceTopY,
                shaftY,
                bottomY,
                yg,
                p0,
                p1,
                p2,
                p3,
                p4,
                xc1,
                yc1,
                xc2,
                yc2: yc1,
                rampStartX: p3.x,
                rampEndX: p4.x,
                shaftEndX,
                R,
            };
        } else if (form === 'F') {
            const beta = (8 * Math.PI) / 180;
            const yc1 = bottomY - R;
            const xc1 = faceX + (R - (yc1 - yg) * Math.sin(beta)) / Math.cos(beta);

            const pFaceTan = {
                x: xc1 - R * Math.cos(beta),
                y: yc1 - R * Math.sin(beta),
            };
            const pBottom1 = { x: xc1, y: bottomY };

            const flatW = 28;
            const xc2 = xc1 + flatW;
            const pBottom2 = { x: xc2, y: bottomY };

            const p3 = {
                x: xc2 + R * Math.sin(alphaRamp),
                y: bottomY - R * (1 - Math.cos(alphaRamp)),
            };

            const dxRamp = (p3.y - shaftY) / Math.tan(alphaRamp);
            const p4 = {
                x: p3.x + dxRamp,
                y: shaftY,
            };

            const outlinePath = `
                M ${faceX} ${faceTopY}
                L ${faceX} ${yg}
                L ${pFaceTan.x.toFixed(2)} ${pFaceTan.y.toFixed(2)}
                A ${R} ${R} 0 0 0 ${pBottom1.x.toFixed(2)} ${pBottom1.y.toFixed(2)}
                L ${pBottom2.x.toFixed(2)} ${pBottom2.y.toFixed(2)}
                A ${R} ${R} 0 0 0 ${p3.x.toFixed(2)} ${p3.y.toFixed(2)}
                L ${p4.x.toFixed(2)} ${p4.y.toFixed(2)}
                L ${shaftEndX} ${shaftY}
            `;

            const hatchPolygon = `
                M ${faceX} ${faceTopY}
                L ${faceX} ${yg}
                L ${pFaceTan.x.toFixed(2)} ${pFaceTan.y.toFixed(2)}
                A ${R} ${R} 0 0 0 ${pBottom1.x.toFixed(2)} ${pBottom1.y.toFixed(2)}
                L ${pBottom2.x.toFixed(2)} ${pBottom2.y.toFixed(2)}
                A ${R} ${R} 0 0 0 ${p3.x.toFixed(2)} ${p3.y.toFixed(2)}
                L ${p4.x.toFixed(2)} ${p4.y.toFixed(2)}
                L ${shaftEndX} ${shaftY}
                L ${shaftEndX} 415
                L 24 415
                L 24 ${faceTopY}
                Z
            `;

            return {
                outlinePath,
                hatchPolygon,
                faceX,
                faceTopY,
                shaftY,
                bottomY,
                yg,
                p0: { x: faceX, y: yg },
                pFaceTan,
                p1: pBottom1,
                p2: pBottom2,
                p3,
                p4,
                xc1,
                yc1,
                xc2,
                yc2: yc1,
                rampStartX: p3.x,
                rampEndX: p4.x,
                shaftEndX,
                R,
            };
        } else {
            // Form G (55°) or Form H (60°)
            const flankDeg = form === 'G' ? 55 : 60;
            const flankRad = (flankDeg * Math.PI) / 180;
            const beta = (8 * Math.PI) / 180;

            const yc = bottomY - R;
            const xc = faceX + (R - (yc - yg) * Math.sin(beta)) / Math.cos(beta);

            const p1 = {
                x: xc - R * Math.cos(beta),
                y: yc - R * Math.sin(beta),
            };

            const p2 = {
                x: xc + R * Math.sin(flankRad),
                y: yc + R * Math.cos(flankRad),
            };

            const dyFlank = p2.y - shaftY;
            const dxFlank = dyFlank * Math.tan(flankRad);
            const pEnd = {
                x: p2.x + dxFlank,
                y: shaftY,
            };

            const outlinePath = `
                M ${faceX} ${faceTopY}
                L ${faceX} ${yg}
                L ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}
                A ${R} ${R} 0 0 0 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}
                L ${pEnd.x.toFixed(2)} ${shaftY}
                L ${shaftEndX} ${shaftY}
            `;

            const hatchPolygon = `
                M ${faceX} ${faceTopY}
                L ${faceX} ${yg}
                L ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}
                A ${R} ${R} 0 0 0 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}
                L ${pEnd.x.toFixed(2)} ${shaftY}
                L ${shaftEndX} ${shaftY}
                L ${shaftEndX} 415
                L 24 415
                L 24 ${faceTopY}
                Z
            `;

            return {
                outlinePath,
                hatchPolygon,
                faceX,
                faceTopY,
                shaftY,
                bottomY,
                yg,
                p0: { x: faceX, y: yg },
                p1,
                p2,
                p4: pEnd,
                xc1: xc,
                yc1: yc,
                xc2: undefined as number | undefined,
                rampStartX: p2.x,
                rampEndX: pEnd.x,
                shaftEndX,
                R,
            };
        }
    }, [form, angleCylinder, hideLegend]);

    const {
        outlinePath,
        hatchPolygon,
        faceX,
        faceTopY,
        shaftY,
        bottomY,
        yg,
        rampEndX,
        shaftEndX,
        p2,
        R,
        xc1,
        xc2,
    } = geom;

    const scaledT2 = 42;

    return (
        <g>
            {/* Title / Detail Label */}
            <g transform="translate(28, 38)">
                <text x="0" y="0" fontSize="15" fontWeight="900" fill="#38bdf8" fontFamily="ui-monospace, monospace">
                    {t12(language, 'Detail Z (10:1 Scale)', 'Detay Z (M 10:1)')}
                </text>
                <text x="0" y="16" fontSize="10.5" fill="#94a3b8" fontFamily="ui-sans-serif, system-ui">
                    DIN 509 - Form {form}
                </text>
            </g>

            {/* Solid Metal Hatching */}
            <path d={hatchPolygon} fill={`url(#${hatchId})`} stroke="#1e293b" strokeWidth="1.2" />

            {/* Reference Extension Lines (Dashed Gray) */}
            <line
                x1={faceX - 35}
                y1={shaftY}
                x2={rampEndX + 25}
                y2={shaftY}
                stroke="#64748b"
                strokeWidth="1"
                strokeDasharray="4 3"
            />
            <line
                x1={faceX}
                y1={faceTopY}
                x2={faceX}
                y2={bottomY + 35}
                stroke="#64748b"
                strokeWidth="1"
                strokeDasharray="4 3"
            />

            {/* Finished Workpiece Contour (Cyan Thick Line) */}
            <path
                d={outlinePath}
                fill="none"
                stroke="#00e5ff"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            {/* 1. Dimension: Radial Depth t1 */}
            <VertDim
                x={rampEndX + 28}
                y1={shaftY}
                y2={bottomY}
                extX1={rampEndX + 5}
                extX2={rampEndX + 5}
                label={`t₁ = ${t1.toFixed(2)} mm`}
                color="#38bdf8"
                arrowId={arrowCyan}
            />

            {/* 2. Dimension: Axial Face Depth t2 (for Form F, G, H) */}
            {form !== 'E' && (
                <HorizDim
                    x1={faceX - scaledT2}
                    x2={faceX}
                    y={shaftY - 48}
                    extY1={yg - 12}
                    extY2={shaftY - 20}
                    label={`t₂ = ${t2.toFixed(2)} mm`}
                    color="#c084fc"
                    arrowId={arrowPurple}
                />
            )}

            {/* 3. Dimension: Face Height g (for Form F, G, H) */}
            {form !== 'E' && (
                <VertDim
                    x={faceX - scaledT2 - 34}
                    y1={yg}
                    y2={shaftY}
                    extX1={faceX - scaledT2 - 8}
                    extX2={faceX - scaledT2 - 8}
                    label={`g = ${g.toFixed(1)} mm`}
                    color="#f8fafc"
                    arrowId={arrowCyan}
                />
            )}

            {/* 4. Radius r Leader Arrow(s) */}
            <g>
                <line
                    x1={faceX + 35}
                    y1={bottomY - 55}
                    x2={xc1 - (form === 'E' ? 12 : 8)}
                    y2={bottomY - 8}
                    stroke="#f59e0b"
                    strokeWidth="1.6"
                    markerEnd={`url(#${arrowAmber})`}
                />
                <DimBadge
                    x={faceX + 50}
                    y={bottomY - 65}
                    text={`r = R ${r.toFixed(1)} mm`}
                    color="#f59e0b"
                />

                {(form === 'E' || form === 'F') && typeof xc2 === 'number' && (
                    <g>
                        <line
                            x1={xc2 + 28}
                            y1={bottomY + 45}
                            x2={xc2 + 8}
                            y2={bottomY + 6}
                            stroke="#f59e0b"
                            strokeWidth="1.4"
                            markerEnd={`url(#${arrowAmber})`}
                        />
                        <DimBadge
                            x={xc2 + 48}
                            y={bottomY + 55}
                            text={`r = R ${r.toFixed(1)}`}
                            color="#f59e0b"
                        />
                    </g>
                )}
            </g>

            {/* 5. Cylinder Ramp Angle (15° or 17.5°) - for Form E & F */}
            {(form === 'E' || form === 'F') && (
                <g transform={`translate(${rampEndX}, ${shaftY})`}>
                    <line x1="-35" y1="0" x2="35" y2="0" stroke="#fbbf24" strokeWidth="1" strokeDasharray="3 2" />
                    <path d="M -24,0 A 24 24 0 0 1 -20,8" fill="none" stroke="#fbbf24" strokeWidth="1.5" />
                    <DimBadge
                        x={-28}
                        y={24}
                        text={`${angleCylinder}°`}
                        color="#fbbf24"
                    />
                </g>
            )}

            {/* 6. Form G (55°) and Form H (60°) Flank Angle Callout */}
            {(form === 'G' || form === 'H') && (
                <g transform={`translate(${((p2.x + rampEndX) / 2).toFixed(1)}, ${((p2.y + shaftY) / 2).toFixed(1)})`}>
                    <line x1="0" y1="-32" x2="0" y2="22" stroke="#e879f9" strokeWidth="1" strokeDasharray="3 2" />
                    <path
                        d={`M 0,-22 A 22 22 0 0 1 ${(22 * Math.sin((angleFace * Math.PI) / 180)).toFixed(1)},${(-22 * Math.cos((angleFace * Math.PI) / 180)).toFixed(1)}`}
                        fill="none"
                        stroke="#e879f9"
                        strokeWidth="1.5"
                    />
                    <DimBadge
                        x={22}
                        y={-28}
                        text={`${angleFace}°`}
                        color="#e879f9"
                    />
                </g>
            )}

            {/* 7. Total Relief Width f */}
            <HorizDim
                x1={faceX}
                x2={rampEndX}
                y={shaftY - (form === 'E' ? 82 : 102)}
                extY1={shaftY - 30}
                extY2={shaftY - 10}
                label={`f = ${f.toFixed(1)} mm`}
                color="#34d399"
                arrowId={arrowGreen}
            />

            {/* 8. Ground Surface Roughness Symbol (ISO 1302) */}
            <g transform={`translate(${rampEndX + 18}, ${shaftY - 28})`}>
                <polygon points="0,0 7,13 14,0" fill="none" stroke="#f59e0b" strokeWidth="1.4" />
                <line x1="0" y1="0" x2="26" y2="0" stroke="#f59e0b" strokeWidth="1.4" />
                <text x="3" y="-3" fontSize="10" fill="#f59e0b" fontFamily="monospace" fontWeight="900">Ra 0.8</text>
            </g>

            {/* d1 Shaft Dimension Tag - Positioned cleanly inside shaft body */}
            <g transform={`translate(${shaftEndX - 50}, ${shaftY + 80})`}>
                <rect x="-35" y="-11" width="70" height="22" rx="4" fill="var(--bg-1)" stroke="var(--cyan, #38bdf8)" strokeWidth="1.2" />
                <text x="0" y="4" textAnchor="middle" fill="var(--cyan, #38bdf8)" fontSize="11" fontFamily="ui-monospace, monospace" fontWeight="900">
                    Ø d₁ = {dSmall}
                </text>
            </g>
        </g>
    );
}

// =============================================================================
// VIEW 2: KOMPLE ŞAFT MONTAJI (1:1 / GENEL KESİT GÖRÜNÜMÜ)
// =============================================================================

function FullShaftView({
    form,
    dSmall,
    dLarge,
    r,
    t1,
    t2,
    f,
    g,
    angleCylinder,
    angleFace,
    hatchId,
    arrowCyan,
    arrowAmber,
    arrowGreen,
    arrowPurple,
    language,
    hideLegend,
}: {
    form: 'E' | 'F' | 'G' | 'H';
    dSmall: number;
    dLarge: number;
    r: number;
    t1: number;
    t2: number;
    f: number;
    g: number;
    angleCylinder: number;
    angleFace: number;
    hatchId: string;
    arrowCyan: string;
    arrowAmber: string;
    arrowGreen: string;
    arrowPurple: string;
    language?: Language;
    hideLegend?: boolean;
}) {
    const geom = useMemo(() => {
        const cx = hideLegend ? 280 : 240;
        const cy = 215; // Shaft centerline
        const shoulderX = cx + 25;

        const s = 180 / Math.max(dLarge, 40);
        const rSmall = Math.max((dSmall * s) / 2, 40);
        const rLarge = Math.max((dLarge * s) / 2, rSmall + 32);

        const scaledT1 = Math.max(t1 * s * 6, 14);
        const scaledR = Math.max(r * s * 3.5, 18);
        const scaledG = form === 'E' ? 0 : Math.max(g * s * 2.5, 20);

        const xLeft = hideLegend ? 50 : 35;
        const xRight = hideLegend ? 510 : 475;

        const topShaftY = cy - rSmall;
        const botShaftY = cy + rSmall;
        const topLargeY = cy - rLarge;
        const botLargeY = cy + rLarge;

        const topGrooveY = topShaftY + scaledT1;
        const botGrooveY = botShaftY - scaledT1;

        const ygTop = topShaftY - scaledG;
        const ygBot = botShaftY + scaledG;

        const alphaRamp = (angleCylinder * Math.PI) / 180;
        const beta = (8 * Math.PI) / 180;

        if (form === 'E') {
            const xc1 = shoulderX + scaledR;
            const flatW = 12;
            const xc2 = xc1 + flatW;
            const p3Top = {
                x: xc2 + scaledR * Math.sin(alphaRamp),
                y: topGrooveY - scaledR * (1 - Math.cos(alphaRamp)),
            };
            const p4Top = {
                x: p3Top.x + (p3Top.y - topShaftY) / Math.tan(alphaRamp),
                y: topShaftY,
            };

            const topOutline = `
                M ${xLeft} ${topLargeY}
                L ${shoulderX} ${topLargeY}
                L ${shoulderX} ${topGrooveY - scaledR}
                A ${scaledR} ${scaledR} 0 0 0 ${xc1} ${topGrooveY}
                L ${xc2} ${topGrooveY}
                A ${scaledR} ${scaledR} 0 0 0 ${p3Top.x.toFixed(2)} ${p3Top.y.toFixed(2)}
                L ${p4Top.x.toFixed(2)} ${topShaftY}
                L ${xRight} ${topShaftY}
            `;

            const p3Bot = {
                x: p3Top.x,
                y: 2 * cy - p3Top.y,
            };
            const p4Bot = {
                x: p4Top.x,
                y: botShaftY,
            };

            const botOutline = `
                M ${xLeft} ${botLargeY}
                L ${shoulderX} ${botLargeY}
                L ${shoulderX} ${botGrooveY + scaledR}
                A ${scaledR} ${scaledR} 0 0 1 ${xc1} ${botGrooveY}
                L ${xc2} ${botGrooveY}
                A ${scaledR} ${scaledR} 0 0 1 ${p3Bot.x.toFixed(2)} ${p3Bot.y.toFixed(2)}
                L ${p4Bot.x.toFixed(2)} ${botShaftY}
                L ${xRight} ${botShaftY}
            `;

            const hatchPolygon = `
                M ${xLeft} ${topLargeY}
                L ${shoulderX} ${topLargeY}
                L ${shoulderX} ${topGrooveY - scaledR}
                A ${scaledR} ${scaledR} 0 0 0 ${xc1} ${topGrooveY}
                L ${xc2} ${topGrooveY}
                A ${scaledR} ${scaledR} 0 0 0 ${p3Top.x.toFixed(2)} ${p3Top.y.toFixed(2)}
                L ${p4Top.x.toFixed(2)} ${topShaftY}
                L ${xRight} ${topShaftY}
                L ${xRight} ${botShaftY}
                L ${p4Bot.x.toFixed(2)} ${botShaftY}
                L ${p3Bot.x.toFixed(2)} ${p3Bot.y.toFixed(2)}
                A ${scaledR} ${scaledR} 0 0 0 ${xc2} ${botGrooveY}
                L ${xc1} ${botGrooveY}
                A ${scaledR} ${scaledR} 0 0 0 ${shoulderX} ${botGrooveY + scaledR}
                L ${shoulderX} ${botLargeY}
                L ${xLeft} ${botLargeY}
                Z
            `;

            return {
                topOutline,
                botOutline,
                hatchPolygon,
                xLeft,
                xRight,
                shoulderX,
                topShaftY,
                botShaftY,
                topLargeY,
                botLargeY,
                scaledR,
                cy,
            };
        } else {
            // Form F, G, H
            const flankDeg = form === 'G' ? 55 : form === 'H' ? 60 : 8;
            const flankRad = (flankDeg * Math.PI) / 180;
            const yc = topGrooveY - scaledR;
            const xc = shoulderX + (scaledR - (yc - ygTop) * Math.sin(beta)) / Math.cos(beta);
            const p1 = {
                x: xc - scaledR * Math.cos(beta),
                y: yc - scaledR * Math.sin(beta),
            };
            const p2 = {
                x: xc + scaledR * Math.sin(flankRad),
                y: yc + scaledR * Math.cos(flankRad),
            };
            const dyFlank = p2.y - topShaftY;
            const dxFlank = dyFlank * Math.tan(flankRad);
            const pEndTop = {
                x: p2.x + dxFlank,
                y: topShaftY,
            };

            const topOutline = `
                M ${xLeft} ${topLargeY}
                L ${shoulderX} ${topLargeY}
                L ${shoulderX} ${ygTop}
                L ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}
                A ${scaledR} ${scaledR} 0 0 0 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}
                L ${pEndTop.x.toFixed(2)} ${topShaftY}
                L ${xRight} ${topShaftY}
            `;

            const p1Bot = { x: p1.x, y: 2 * cy - p1.y };
            const p2Bot = { x: p2.x, y: 2 * cy - p2.y };
            const pEndBot = { x: pEndTop.x, y: botShaftY };

            const botOutline = `
                M ${xLeft} ${botLargeY}
                L ${shoulderX} ${botLargeY}
                L ${shoulderX} ${ygBot}
                L ${p1Bot.x.toFixed(2)} ${p1Bot.y.toFixed(2)}
                A ${scaledR} ${scaledR} 0 0 1 ${p2Bot.x.toFixed(2)} ${p2Bot.y.toFixed(2)}
                L ${pEndBot.x.toFixed(2)} ${botShaftY}
                L ${xRight} ${botShaftY}
            `;

            const hatchPolygon = `
                M ${xLeft} ${topLargeY}
                L ${shoulderX} ${topLargeY}
                L ${shoulderX} ${ygTop}
                L ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}
                A ${scaledR} ${scaledR} 0 0 0 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}
                L ${pEndTop.x.toFixed(2)} ${topShaftY}
                L ${xRight} ${topShaftY}
                L ${xRight} ${botShaftY}
                L ${pEndBot.x.toFixed(2)} ${botShaftY}
                L ${p2Bot.x.toFixed(2)} ${p2Bot.y.toFixed(2)}
                A ${scaledR} ${scaledR} 0 0 0 ${p1Bot.x.toFixed(2)} ${p1Bot.y.toFixed(2)}
                L ${shoulderX} ${ygBot}
                L ${shoulderX} ${botLargeY}
                L ${xLeft} ${botLargeY}
                Z
            `;

            return {
                topOutline,
                botOutline,
                hatchPolygon,
                xLeft,
                xRight,
                shoulderX,
                topShaftY,
                botShaftY,
                topLargeY,
                botLargeY,
                scaledR,
                cy,
            };
        }
    }, [form, dSmall, dLarge, r, t1, g, angleCylinder, hideLegend]);

    const {
        topOutline,
        botOutline,
        hatchPolygon,
        xLeft,
        xRight,
        shoulderX,
        topShaftY,
        botShaftY,
        topLargeY,
        botLargeY,
        scaledR,
        cy,
    } = geom;

    return (
        <g>
            {/* Title */}
            <g transform="translate(28, 38)">
                <text x="0" y="0" fontSize="15" fontWeight="900" fill="#38bdf8" fontFamily="ui-monospace, monospace">
                    {t12(language, 'Complete Stepped Shaft Assembly (1:1)', 'Komple Kademeli Mil Montajı (1:1)')}
                </text>
                <text x="0" y="16" fontSize="10.5" fill="#94a3b8" fontFamily="ui-sans-serif, system-ui">
                    DIN 509 - Form {form}
                </text>
            </g>

            {/* Shaft Centerline */}
            <line
                x1={xLeft - 20}
                y1={cy}
                x2={xRight + 20}
                y2={cy}
                stroke="#00e5ff"
                strokeWidth="1.2"
                strokeDasharray="20 4 4 4"
                opacity="0.8"
            />

            {/* Shaft Body with Cross-Hatching */}
            <path d={hatchPolygon} fill={`url(#${hatchId})`} stroke="#1e293b" strokeWidth="1.2" />

            {/* Clean Outer Profile Lines */}
            <path d={topOutline} fill="none" stroke="#00e5ff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d={botOutline} fill="none" stroke="#00e5ff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />

            {/* Vertical Left and Right Edges */}
            <line x1={xLeft} y1={topLargeY} x2={xLeft} y2={botLargeY} stroke="#00e5ff" strokeWidth="2.8" />
            <line x1={xRight} y1={topShaftY} x2={xRight} y2={botShaftY} stroke="#00e5ff" strokeWidth="2.8" />

            {/* Detail Z Callout Circle */}
            <g>
                <circle
                    cx={shoulderX + 6}
                    cy={topShaftY}
                    r={scaledR + 20}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="1.5"
                    strokeDasharray="5 3"
                />
                <line
                    x1={shoulderX + scaledR + 20}
                    y1={topShaftY - 16}
                    x2={shoulderX + scaledR + 58}
                    y2={topShaftY - 48}
                    stroke="#f59e0b"
                    strokeWidth="1.5"
                />
                <circle cx={shoulderX + scaledR + 72} cy={topShaftY - 54} r="14" fill="var(--bg-1)" stroke="#f59e0b" strokeWidth="1.5" />
                <text x={shoulderX + scaledR + 67} y={topShaftY - 49} fill="#f59e0b" fontSize="13.5" fontWeight="black" fontFamily="monospace">
                    Z
                </text>
            </g>

            {/* Diameter Dimensions */}
            <VertDim
                x={xLeft + 35}
                y1={topLargeY}
                y2={botLargeY}
                extX1={xLeft + 5}
                extX2={xLeft + 5}
                label={`Ø${dLarge} (D)`}
                color="#38bdf8"
                arrowId={arrowCyan}
            />

            <VertDim
                x={xRight - 45}
                y1={topShaftY}
                y2={botShaftY}
                extX1={xRight - 5}
                extX2={xRight - 5}
                label={`Ø${dSmall} (d₁)`}
                color="#00e5ff"
                arrowId={arrowCyan}
            />
        </g>
    );
}

// =============================================================================
// CAD HELPER DRAWING PRIMITIVES
// =============================================================================

function DimBadge({
    x,
    y,
    text,
    color = 'var(--cyan, #00e5ff)',
    bg = 'var(--bg-1, #030712)'
}: {
    x: number;
    y: number;
    text: string;
    color?: string;
    bg?: string;
}) {
    const w = Math.max(34, text.length * 6.0 + 10);
    const h = 16;
    return (
        <g transform={`translate(${x}, ${y})`}>
            <rect
                x={-w / 2}
                y={-h / 2}
                width={w}
                height={h}
                rx="3"
                fill={bg}
                stroke={color}
                strokeWidth="0.8"
                strokeOpacity="0.95"
            />
            <text
                x="0"
                y="0"
                dominantBaseline="central"
                textAnchor="middle"
                fontSize="8.5"
                fontWeight="bold"
                fill={color}
                fontFamily="ui-monospace, monospace"
            >
                {text}
            </text>
        </g>
    );
}

function HorizDim({
    x1,
    x2,
    y,
    extY1,
    extY2,
    label,
    color = '#00e5ff',
    arrowId
}: {
    x1: number;
    x2: number;
    y: number;
    extY1: number;
    extY2?: number;
    label: string;
    color?: string;
    arrowId?: string;
}) {
    const ey2 = extY2 ?? extY1;
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const midX = (minX + maxX) / 2;
    const markerAttr = arrowId ? { markerStart: `url(#${arrowId})`, markerEnd: `url(#${arrowId})` } : {};

    return (
        <g>
            <line x1={x1} y1={extY1} x2={x1} y2={y > extY1 ? y + 6 : y - 6} stroke={color} strokeWidth="0.9" strokeDasharray="3 2" opacity="0.6" />
            <line x1={x2} y1={ey2} x2={x2} y2={y > ey2 ? y + 6 : y - 6} stroke={color} strokeWidth="0.9" strokeDasharray="3 2" opacity="0.6" />
            <line x1={minX} y1={y} x2={maxX} y2={y} stroke={color} strokeWidth="1.3" {...markerAttr} />
            <DimBadge x={midX} y={y} text={label} color={color} />
        </g>
    );
}

function VertDim({
    x,
    y1,
    y2,
    extX1,
    extX2,
    label,
    color = '#00e5ff',
    arrowId
}: {
    x: number;
    y1: number;
    y2: number;
    extX1: number;
    extX2?: number;
    label: string;
    color?: string;
    arrowId?: string;
}) {
    const ex2 = extX2 ?? extX1;
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);
    const midY = (minY + maxY) / 2;
    const markerAttr = arrowId ? { markerStart: `url(#${arrowId})`, markerEnd: `url(#${arrowId})` } : {};

    return (
        <g>
            <line x1={extX1} y1={y1} x2={x > extX1 ? x + 6 : x - 6} y2={y1} stroke={color} strokeWidth="0.9" strokeDasharray="3 2" opacity="0.6" />
            <line x1={ex2} y1={y2} x2={x > ex2 ? x + 6 : x - 6} y2={y2} stroke={color} strokeWidth="0.9" strokeDasharray="3 2" opacity="0.6" />
            <line x1={x} y1={minY} x2={x} y2={maxY} stroke={color} strokeWidth="1.3" {...markerAttr} />
            <DimBadge x={x} y={midY} text={label} color={color} />
        </g>
    );
}
