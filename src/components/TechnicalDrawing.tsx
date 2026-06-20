import { MetalShape } from "@/hooks/useWeightCalculator";
import React from 'react';

interface TechnicalDrawingProps {
    mode?: 'shape' | 'fit' | 'gear' | 'strength' | 'bearing' | 'welding' | 'sheetMetal' | 'pump' | 'fastener';
    shape?: MetalShape;
    fitType?: 'clearance' | 'transition' | 'interference';
    activeField: string | null;
    data?: any;
}

export const TechnicalDrawing = ({ mode = 'shape', shape = 'box', fitType, activeField, data }: TechnicalDrawingProps) => {
    // === 2D BLUEPRINT ONLY for SHAPES & COMPONENTS ===
    if (['gear', 'bearing', 'fastener'].includes(mode) || ['gear', 'bearing', 'fastener'].includes(shape)) {
        const shapeType = mode === 'shape' ? shape : mode;

        return (
            <div className="w-full h-full relative flex flex-col bg-transparent">
                <BlueprintView shape={shapeType} inputs={data} />
            </div>
        );
    }

    // === STANDARD PROFILES (2D ONLY) ===
    // These are controlled by the parent module (AluminumModule) which handles the 3D toggle externally.
    const standardProfiles = ['box', 'sheet', 'pipe', 'bar', 'angle', 'beam', 'channel', 'tee', 'hex'];
    if (mode === 'shape' && shape && standardProfiles.includes(shape)) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <BlueprintView shape={shape} inputs={data} />
            </div>
        );
    }
    const subtleStr = "stroke-slate-200 stroke-[1]"; // Hidden data lines
    const mainStr = "stroke-slate-800 stroke-[2] fill-none"; // Main outline
    const highlightStr = "stroke-ind-orange stroke-[4] drop-shadow-md transition-all duration-300"; // Active dimension

    // Fit Colors
    const holeFill = "fill-slate-100";
    const shaftFill = "fill-slate-300";
    const toleranceFill = fitType === 'interference' ? 'fill-red-400/50' : fitType === 'transition' ? 'fill-orange-400/50' : 'fill-green-400/50';

    return (
        <div className="w-full h-full flex items-center justify-center relative">
            <svg width="240" height="240" viewBox="0 0 200 200" className="overflow-visible">

                {/* === MODE: FITS (ISO 286) === */}
                {mode === 'fit' && (
                    <g transform="translate(50, 50)">
                        {/* Nominal Zero Line */}
                        <line x1="-20" y1="50" x2="120" y2="50" className="stroke-slate-300 stroke-dasharray-4" />
                        <text x="125" y="52" className="text-[8px] fill-slate-400 font-mono">NOMINAL</text>

                        {/* HOLE (Upper Block) */}
                        <path d="M0 10 L100 10 L100 50 L0 50 Z" className={`${mainStr} ${holeFill}`} />
                        {/* Hole Tolerance Zone (H7 usually +) */}
                        <rect x="0" y="10" width="100" height="15" className="fill-blue-400/30" />
                        <text x="5" y="20" className="text-[10px] fill-blue-600 font-bold">HOLE (H7)</text>

                        {/* SHAFT (Lower Block) */}
                        <g transform={fitType === 'interference' ? 'translate(0, -5)' : fitType === 'transition' ? 'translate(0, 0)' : 'translate(0, 10)'}>
                            <path d="M20 50 L80 50 L80 120 L20 120 Z" className={`${mainStr} ${shaftFill}`} />
                            {/* Shaft Tolerance Zone */}
                            <rect x="20" y="50" width="60" height="15" className={toleranceFill} />
                            <text x="25" y="110" className="text-[9px] fill-slate-600 font-bold">SHAFT</text>
                        </g>

                        {/* Highlights */}
                        <line x1="-10" y1="10" x2="-10" y2="120" className={activeField === 'nominalSize' ? highlightStr : 'hidden'} markerStart="url(#arrow)" markerEnd="url(#arrow)" />

                        {activeField === 'holeTolerance' && (
                            <rect x="0" y="10" width="100" height="15" className="stroke-ind-orange stroke-2 fill-none" />
                        )}
                        {activeField === 'shaftTolerance' && (
                            <rect x="20" y={fitType === 'interference' ? 45 : fitType === 'transition' ? 50 : 60} width="60" height="15" className="stroke-ind-orange stroke-2 fill-none" />
                        )}
                    </g>
                )}



                {/* === MODE: STRENGTH (Mohr's Circle) === */}
                {mode === 'strength' && data && (
                    <g transform="translate(100, 100)">
                        {/* Axis */}
                        <line x1="-80" y1="0" x2="80" y2="0" className={subtleStr} markerEnd="url(#arrow)" />
                        <text x="85" y="0" className="text-[8px] fill-slate-400">σ</text>
                        <line x1="0" y1="80" x2="0" y2="-80" className={subtleStr} markerEnd="url(#arrow)" />
                        <text x="5" y="-80" className="text-[8px] fill-slate-400">τ</text>

                        {/* The Circle */}
                        {(() => {
                            const scale = 60 / (data.radius * 1.5 || 1);
                            return (
                                <>
                                    <circle cx={data.center * scale} cy="0" r={data.radius * scale} className="stroke-ind-orange stroke-[2] fill-orange-50/20" />
                                    <circle cx={data.sigma1 * scale} cy="0" r="2" className="fill-tech-blue" />
                                    <circle cx={data.sigma2 * scale} cy="0" r="2" className="fill-tech-blue" />
                                    <line x1={data.center * scale} y1={-data.radius * scale} x2={data.center * scale} y2={data.radius * scale} className="stroke-slate-400 stroke-dashed" />
                                </>
                            );
                        })()}
                    </g>
                )}



                {/* === MODE: WELDING === */}
                {mode === 'welding' && (
                    <g transform="translate(100, 100)">
                        {/* Check data type to decide Butt vs Fillet */}
                        {(!data?.type || data.type === 'fillet' || data.type === 'doubleFillet') && (
                            <g>
                                {/* Base Plate */}
                                <rect x="-80" y="0" width="160" height="20" className={mainStr} fill="url(#diagonalHatch)" />
                                {/* Vertical Plate */}
                                <rect x="-10" y="-80" width="20" height="80" className={mainStr} fill="url(#diagonalHatch)" />

                                {/* WELD BEAD - Right */}
                                <path d="M10 0 L10 -20 Q25 -10 30 0 Z" className="fill-orange-400 stroke-orange-600 stroke-2" />
                                {/* WELD BEAD - Left (if double) */}
                                {(data?.type === 'doubleFillet') && (
                                    <path d="M-10 0 L-10 -20 Q-25 -10 -30 0 Z" className="fill-orange-400 stroke-orange-600 stroke-2" />
                                )}

                                {/* Throat Line */}
                                <line x1="10" y1="0" x2="20" y2="-10" className="stroke-white stroke-[1] stroke-dashed" />

                                {/* Label a */}
                                <line x1="35" y1="0" x2="35" y2="-20" className="stroke-slate-400 marker-end marker-start" markerEnd="url(#arrow)" markerStart="url(#arrow)" />
                                <text x="40" y="-10" className="text-[10px] fill-slate-500">a</text>
                            </g>
                        )}

                        {data?.type === 'butt' && (
                            <g>
                                {/* Plate 1 */}
                                <rect x="-90" y="-10" width="80" height="20" className={mainStr} fill="url(#diagonalHatch)" />
                                {/* Plate 2 */}
                                <rect x="10" y="-10" width="80" height="20" className={mainStr} fill="url(#diagonalHatch)" />

                                {/* V-Groove Weld */}
                                <path d="M-10 -10 L10 -10 L5 10 L-5 10 Z" className="fill-orange-400 stroke-orange-600 stroke-2" />
                                <path d="M-10 -10 Q0 -15 10 -10" className="fill-orange-300/50 stroke-none" /> {/* Cap */}

                                {/* Highlight Fusion Zone */}
                                <circle cx="0" cy="0" r="15" className="fill-orange-500/10 stroke-none animate-pulse-slow" />
                            </g>
                        )}
                    </g>
                )}

                {/* === MODE: SHEET METAL (Bending) === */}
                {mode === 'sheetMetal' && data && (
                    <g transform="translate(100, 120)">
                        {/* V-Die (Static) */}
                        <path d="M-60 20 L60 20 L60 0 L20 0 L0 20 L-20 0 L-60 0 Z" className={mainStr} fill="url(#diagonalHatch)" />

                        {/* Sheet (Dynamic) */}
                        {(() => {
                            const th = 4; // Visual thickness
                            const angle = data.angle || 90;
                            const angleRad = (angle * Math.PI) / 180;
                            // Calculate arms based on angle from vertical punch?
                            // Typically 180 is flat. 90 is bent up.
                            // Let's assume angle is the internal PART angle.
                            // 180 -> flat. 90 -> L shape.

                            // Let's visualize the "Bending" process.
                            // Flat state is y=0.
                            // 90 deg -> left arm 45 deg up, right arm 45 deg up? Or one fixed?
                            // Standard air bending: symmetric.

                            const bendAngle = 180 - angle; // Deviation from flat
                            const halfBend = bendAngle / 2;
                            const rad = (halfBend * Math.PI) / 180;

                            const len = 70;
                            const xEnd = len * Math.cos(rad);
                            const yEnd = -len * Math.sin(rad); // Up is negative

                            return (
                                <g transform="translate(0, -2)">
                                    {/* Left Arm */}
                                    <line x1="0" y1="0" x2={-xEnd} y2={yEnd} className="stroke-tech-blue stroke-[4]" />
                                    {/* Right Arm */}
                                    <line x1="0" y1="0" x2={xEnd} y2={yEnd} className="stroke-tech-blue stroke-[4]" />

                                    {/* Punch */}
                                    <path d={`M-5 -100 L5 -100 L0 0 Z`} className="fill-slate-300 stroke-slate-500" transform={`translate(0, ${yEnd / 2 - 10})`} />
                                    {/* Punch connects to the bend point roughly */}

                                    {/* Angle Arc */}
                                    <path d={`M -20 ${yEnd / 2} Q 0 ${yEnd - 10} 20 ${yEnd / 2}`} className="fill-none stroke-ind-orange stroke-dashed" />
                                    <text x="0" y={yEnd - 15} className="text-[10px] fill-ind-orange font-bold text-center" textAnchor="middle">{angle}°</text>
                                </g>
                            );
                        })()}

                    </g>
                )}

                {/* === MODE: PUMP (H-Q Curve) === */}
                {mode === 'pump' && data && (
                    <g transform="translate(40, 140)">
                        {/* Axes */}
                        <line x1="0" y1="0" x2="140" y2="0" className="stroke-slate-300 stroke-[1]" markerEnd="url(#arrow)" /> {/* X: Flow */}
                        <text x="130" y="12" className="text-[8px] fill-slate-400">Q</text>

                        <line x1="0" y1="0" x2="0" y2="-120" className="stroke-slate-300 stroke-[1]" markerEnd="url(#arrow)" /> {/* Y: Head */}
                        <text x="-10" y="-110" className="text-[8px] fill-slate-400">H</text>

                        {/* Theoretical Curve: H = Hmax - k*Q^2 */}
                        {/* Let's fit the curve so it passes through the Operating Point (Q_op, H_op) */}
                        {/* Or just draw a generic curve and place point. Simpler for visualisation. */}

                        {/* Curve path */}
                        <path d="M0 -100 Q 60 -95 120 -20" className="fill-none stroke-slate-200 stroke-dashed" />

                        {/* Operating Point */}
                        {/* We will just place it dynamically relative to 100% scale */}
                        {/* Let's assume Q/H inputs are the Operating Point */}
                        {/* So we draw a curve that intersects this point. */}

                        {/* Let's assume Q=60% of scale, H=60% of scale for visual balance */}
                        {(() => {
                            const qPx = 70;
                            const hPx = -60;

                            return (
                                <g>
                                    {/* The Curve passing through point */}
                                    <path d={`M0 -${-hPx + 40} Q ${qPx / 2} -${-hPx + 35} ${qPx * 1.5} 0`} className="fill-none stroke-tech-blue stroke-[3]" />

                                    {/* Operating Point */}
                                    <circle cx={qPx} cy={hPx} r="4" className="fill-ind-orange stroke-white stroke-2 shadow-lg" />

                                    {/* Drop lines */}
                                    <line x1={qPx} y1={hPx} x2={qPx} y2="0" className="stroke-slate-300 stroke-dashed" />
                                    <line x1={qPx} y1={hPx} x2="0" y2={hPx} className="stroke-slate-300 stroke-dashed" />

                                    <text x={qPx + 5} y={hPx - 5} className="text-[8px] fill-ind-orange font-bold">OP</text>
                                </g>
                            );
                        })()}
                    </g>
                )}




            </svg>

            {/* Decorative Labels */}
            <div className="absolute top-2 left-2 text-[10px] font-mono text-slate-400">
                FIG. {mode === 'fit' ? 'ISO 286' : mode === 'strength' ? 'MOHR' : shape?.toUpperCase()}
            </div>
            <div className="absolute bottom-2 right-2 text-[10px] font-mono text-slate-400">
                SCALE {mode === 'fit' ? '5:1' : '1:1'}
            </div>
        </div>
    );
};

// --- BLUEPRINT 2D COMPONENTS ---

const BlueprintView = ({ shape, inputs }: { shape: string, inputs: any }) => {
    const strokeColor = "#ecfeff"; // Engineering light-gray outline
    const dimColor = "#00e5ff"; // Engineering cyan/teal highlight
    const textFill = "#C5C6C7"; // Readable text
    const subtleColor = "rgba(255, 255, 255, 0.15)";

    // Helper for Dimension Line
    const Dim = ({ x1, y1, x2, y2, label, offset = 20, vertical = false }: any) => {
        return (
            <g>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={subtleColor} strokeWidth="1" strokeDasharray="4 4" />
                {vertical ? (
                    <>
                        <line x1={x1 - offset} y1={y1} x2={x1 - offset} y2={y2} stroke={dimColor} strokeWidth="1" markerEnd="url(#arrow)" markerStart="url(#arrow)" />
                        <text x={x1 - offset - 10} y={(y1 + y2) / 2} textAnchor="middle" alignmentBaseline="middle" className="text-[10px] font-bold font-mono uppercase tracking-wider" fill={textFill} transform={`rotate(-90 ${x1 - offset - 10} ${(y1 + y2) / 2})`}>{label}</text>
                    </>
                ) : (
                    <>
                        <line x1={x1} y1={y1 + offset} x2={x2} y2={y2 + offset} stroke={dimColor} strokeWidth="1" markerEnd="url(#arrow)" markerStart="url(#arrow)" />
                        <text x={(x1 + x2) / 2} y={y1 + offset + 15} textAnchor="middle" className="text-[10px] font-bold font-mono uppercase tracking-wider" fill={textFill}>{label}</text>
                        {/* Extension lines */}
                        <line x1={x1} y1={y1} x2={x1} y2={y1 + offset} stroke={subtleColor} strokeWidth="1" />
                        <line x1={x2} y1={y2} x2={x2} y2={y2 + offset} stroke={subtleColor} strokeWidth="1" />
                    </>
                )}
            </g>
        )
    }

    return (
        <svg width="100%" height="100%" viewBox="-50 -50 400 400" className="w-full h-full bg-blueprint-grid">
            <defs>
                <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
                    <path d="M0,0 L0,6 L9,3 z" fill={dimColor} />
                </marker>
                <pattern id="diagonalHatch" patternUnits="userSpaceOnUse" width="6" height="6">
                    <path d="M-1,1 l2,-2 M0,6 l6,-6 M5,7 l2,-2" stroke="rgba(0, 229, 255, 0.2)" strokeWidth="0.8" />
                </pattern>
            </defs>

            {shape === 'fastener' && (() => {
                const dia = parseFloat(inputs?.diameter || 20);
                const len = parseFloat(inputs?.length || 100);
                const headH = dia * 0.6;
                const headW = dia * 1.8;
                const type = inputs?.type || 'bolt';

                if (type === 'nut') {
                    // NUT VIEW (Top View - Hexagon)
                    const S = dia * 1.6; // Width across flats
                    const E = S / 0.866; // Width across corners
                    // Scale to fit
                    const scale = 200 / (E * 1.2);
                    const cx = 150, cy = 150;

                    const r = E / 2 * scale;
                    // Hexagon Points
                    const points = [];
                    for (let i = 0; i < 6; i++) {
                        const angle_deg = 30 + i * 60;
                        const angle_rad = angle_deg * Math.PI / 180;
                        points.push(`${cx + r * Math.cos(angle_rad)},${cy + r * Math.sin(angle_rad)}`);
                    }

                    return (
                        <g>
                            {/* Hexagon */}
                            <polygon points={points.join(' ')} fill="none" stroke={strokeColor} strokeWidth="2" />
                            {/* Inner Circle (Hole) */}
                            <circle cx={cx} cy={cy} r={(dia / 2) * scale} fill="url(#diagonalHatch)" stroke={strokeColor} strokeWidth="2" />
                            {/* Hidden threads (Dashed) */}
                            <circle cx={cx} cy={cy} r={(dia / 2 + (dia * 0.1)) * scale} fill="none" stroke={strokeColor} strokeWidth="1" strokeDasharray="4 4" />

                            <Dim x1={cx - r} y1={cy - r - 20} x2={cx + r} y2={cy - r - 20} label={`s=${S.toFixed(1)}`} offset={0} />
                            <text x={cx} y={cy + r + 30} textAnchor="middle" className="text-[10px] font-bold font-mono tracking-wider fill-slate-400">HEX NUT TOP VIEW</text>
                        </g>
                    )
                }

                // BOLT VIEW
                // Auto scale to fit 200px height
                const totalH = len + headH;
                const scale = 200 / (totalH || 100);

                // Scaled coords (centered)
                const L = len * scale;
                const D = dia * scale;
                const HH = headH * scale;
                const HW = headW * scale;
                const cx = 150, cy = 100 + L / 2; // Center vertically somewhat

                return (
                    <g transform={`translate(${cx}, ${cy - L / 2})`}>
                        {/* HEAD */}
                        <rect x={-HW / 2} y={-HH} width={HW} height={HH} fill="none" stroke={strokeColor} strokeWidth="2" />
                        <line x1={-HW / 2} y1={-HH} x2={HW / 2} y2={0} stroke={strokeColor} strokeWidth="1" />
                        <line x1={HW / 2} y1={-HH} x2={-HW / 2} y2={0} stroke={strokeColor} strokeWidth="1" />

                        {/* SHAFT */}
                        <rect x={-D / 2} y={0} width={D} height={L} fill="none" stroke={strokeColor} strokeWidth="2" />

                        {/* THREADS (Schematic) */}
                        <rect x={-D / 2 + 5} y={L * 0.3} width={D - 10} height={L * 0.7} fill="url(#diagonalHatch)" opacity="0.8" />
                        <line x1={-D / 2} y1={L * 0.3} x2={D / 2} y2={L * 0.3} stroke={strokeColor} strokeWidth="1" />

                        {/* Dimensions */}
                        <Dim x1={-D / 2} y1={0} x2={D / 2} y2={0} label={`⌀${dia}`} offset={-30} />
                        <Dim x1={D / 2} y1={0} x2={D / 2} y2={L} label={`L=${len}`} offset={40} vertical />
                        <Dim x1={-HW / 2} y1={-HH} x2={-HW / 2} y2={0} label={`k=${headH.toFixed(1)}`} offset={20} vertical />
                    </g>
                )
            })()}

            {shape === 'gear' && (() => {
                const z1 = parseFloat(inputs?.z1 || 20);
                const mod = parseFloat(inputs?.module || 2);
                const pd = z1 * mod;
                const od = pd + 2 * mod;
                const scale = 200 / (od || 100);

                const PD = pd * scale;
                const OD = od * scale;
                const cx = 150, cy = 150;

                return (
                    <g transform={`translate(${cx}, ${cy})`}>
                        {/* Outer Circle */}
                        <circle r={OD / 2} fill="none" stroke={strokeColor} strokeWidth="2" />
                        {/* Pitch Circle */}
                        <circle r={PD / 2} fill="none" stroke={strokeColor} strokeWidth="1" strokeDasharray="5 3" />
                        {/* Hub */}
                        <circle r={PD / 4} fill="url(#diagonalHatch)" stroke={strokeColor} strokeWidth="1" />

                        {/* Teeth schematic lines */}
                        {[...Array(12)].map((_, i) => (
                            <line key={i} x1="0" y1={-PD / 2} x2="0" y2={-OD / 2} stroke={strokeColor} strokeWidth="1" transform={`rotate(${i * 30})`} />
                        ))}

                        <Dim x1={-PD / 2} y1={0} x2={PD / 2} y2={0} label={`PD=${pd}`} offset={OD / 2 + 20} />
                        <Dim x1={-OD / 2} y1={0} x2={OD / 2} y2={0} label={`OD=${od}`} offset={OD / 2 + 40} />

                        <text x="0" y="5" textAnchor="middle" className="text-xs font-bold font-mono fill-slate-400">z={z1} m={mod}</text>
                    </g>
                )
            })()}

            {shape === 'bearing' && (() => {
                const od = parseFloat(inputs?.od || inputs?.outerDiameter || 80);
                const id = parseFloat(inputs?.id || inputs?.innerDiameter || 40);
                const w = parseFloat(inputs?.width || 20);
                const type = inputs?.type || 'ball'; // 'ball' | 'roller' | 'needle' | 'tapered'

                const scale = 200 / (od || 100);
                const OD = od * scale;
                const ID = id * scale;
                const W = w * scale;

                const cx = 150, cy = 150;
                const H = (OD - ID) / 2; // Total radial height of ring space
                const ringTh = H * 0.25; // 25% thickness for rings

                // Center coordinates of the top and bottom rolling elements
                const yCenterTop = -(ID/2 + OD/2) / 2;
                const yCenterBot = (ID/2 + OD/2) / 2;
                const spaceY = H - 2 * ringTh;

                // Let's draw outer ring, inner ring and rolling elements based on type
                if (type === 'tapered') {
                    // Slanted tapered bearing
                    // Top rings
                    const topOuterRing = `-${W/2},-${OD/2} ${W/2},-${OD/2} ${W/2},-${OD/2 + ringTh * 1.3} -${W/2},-${OD/2 + ringTh * 0.7}`;
                    const topInnerRing = `-${W/2},-${ID/2} -${W/2},-${ID/2 - ringTh * 0.7} ${W/2},-${ID/2 - ringTh * 1.3} ${W/2},-${ID/2}`;
                    // Bot rings (mirror y)
                    const botOuterRing = `-${W/2},${OD/2} ${W/2},${OD/2} ${W/2},${OD/2 - ringTh * 1.3} -${W/2},${OD/2 - ringTh * 0.7}`;
                    const botInnerRing = `-${W/2},${ID/2} -${W/2},${ID/2 + ringTh * 0.7} ${W/2},${ID/2 + ringTh * 1.3} ${W/2},${ID/2}`;

                    // Tapered Rollers: Trapezoids centered at x=0
                    // Top roller points
                    const rx1 = -W * 0.35, rx2 = W * 0.35;
                    const rTopY1 = -OD/2 + ringTh * 0.7 + 2;
                    const rTopY2 = -OD/2 + ringTh * 1.3 + 2;
                    const rBotY1 = -ID/2 - ringTh * 0.7 - 2;
                    const rBotY2 = -ID/2 - ringTh * 1.3 - 2;
                    const topRoller = `${rx1},${rTopY1} ${rx2},${rTopY2} ${rx2},${rBotY2} ${rx1},${rBotY1}`;

                    // Bottom roller points (mirror y)
                    const botRoller = `${rx1},${-rTopY1} ${rx2},${-rTopY2} ${rx2},${-rBotY2} ${rx1},${-rBotY1}`;

                    return (
                        <g transform={`translate(${cx}, ${cy})`}>
                            {/* Rings */}
                            <polygon points={topOuterRing} fill="url(#diagonalHatch)" stroke={strokeColor} strokeWidth="1.5" />
                            <polygon points={topInnerRing} fill="url(#diagonalHatch)" stroke={strokeColor} strokeWidth="1.5" />
                            <polygon points={botOuterRing} fill="url(#diagonalHatch)" stroke={strokeColor} strokeWidth="1.5" />
                            <polygon points={botInnerRing} fill="url(#diagonalHatch)" stroke={strokeColor} strokeWidth="1.5" />

                            {/* Rollers */}
                            <polygon points={topRoller} fill="#0a1018" stroke={strokeColor} strokeWidth="2" />
                            <line x1={rx1} y1={(rTopY1 + rBotY1)/2} x2={rx2} y2={(rTopY2 + rBotY2)/2} stroke={strokeColor} strokeWidth="1" strokeDasharray="2 2" />
                            
                            <polygon points={botRoller} fill="#0a1018" stroke={strokeColor} strokeWidth="2" />
                            <line x1={rx1} y1={-(rTopY1 + rBotY1)/2} x2={rx2} y2={-(rTopY2 + rBotY2)/2} stroke={strokeColor} strokeWidth="1" strokeDasharray="2 2" />

                            {/* Center Line */}
                            <line x1={-W} y1={0} x2={W} y2={0} stroke={subtleColor} strokeWidth="1" strokeDasharray="10 5" />

                            <Dim x1={W / 2} y1={-OD / 2} x2={W / 2} y2={OD / 2} label={`OD=${od}`} offset={20} vertical />
                            <Dim x1={-W / 2} y1={-ID / 2} x2={-W / 2} y2={ID / 2} label={`ID=${id}`} offset={20} vertical />
                            <Dim x1={-W / 2} y1={-OD / 2 - 10} x2={W / 2} y2={-OD / 2 - 10} label={`B=${w}`} offset={0} />
                        </g>
                    );
                }

                // Precise CAD cross-sections for rings
                const W_half = W / 2;
                
                // Let's define the paths for top/bottom inner/outer rings based on type
                let topOuterPath = "";
                let botOuterPath = "";
                let topInnerPath = "";
                let botInnerPath = "";

                if (type === 'ball') {
                    // Ball bearing rings with curved raceway grooves
                    const y_out_top = -OD/2;
                    const y_face_top = yCenterTop - spaceY * 0.42;
                    const y_groove_top = yCenterTop - spaceY * 0.56;
                    topOuterPath = `M ${-W_half},${y_out_top} L ${W_half},${y_out_top} L ${W_half},${y_face_top} L ${W_half * 0.4},${y_face_top} Q 0,${y_groove_top} ${-W_half * 0.4},${y_face_top} L ${-W_half},${y_face_top} Z`;

                    const y_out_bot = OD/2;
                    const y_face_bot = yCenterBot + spaceY * 0.42;
                    const y_groove_bot = yCenterBot + spaceY * 0.56;
                    botOuterPath = `M ${-W_half},${y_out_bot} L ${W_half},${y_out_bot} L ${W_half},${y_face_bot} L ${W_half * 0.4},${y_face_bot} Q 0,${y_groove_bot} ${-W_half * 0.4},${y_face_bot} L ${-W_half},${y_face_bot} Z`;

                    const y_in_inner_top = -ID/2;
                    const y_face_inner_top = yCenterTop + spaceY * 0.42;
                    const y_groove_inner_top = yCenterTop + spaceY * 0.56;
                    topInnerPath = `M ${-W_half},${y_in_inner_top} L ${W_half},${y_in_inner_top} L ${W_half},${y_face_inner_top} L ${W_half * 0.4},${y_face_inner_top} Q 0,${y_groove_inner_top} ${-W_half * 0.4},${y_face_inner_top} L ${-W_half},${y_face_inner_top} Z`;

                    const y_in_inner_bot = ID/2;
                    const y_face_inner_bot = yCenterBot - spaceY * 0.42;
                    const y_groove_inner_bot = yCenterBot - spaceY * 0.56;
                    botInnerPath = `M ${-W_half},${y_in_inner_bot} L ${W_half},${y_in_inner_bot} L ${W_half},${y_face_inner_bot} L ${W_half * 0.4},${y_face_inner_bot} Q 0,${y_groove_inner_bot} ${-W_half * 0.4},${y_face_inner_bot} L ${-W_half},${y_face_inner_bot} Z`;
                } else if (type === 'roller') {
                    // Cylindrical roller rings: Outer ring has guiding shoulders, inner ring is flat (NU type)
                    const y_out_top = -OD/2;
                    const y_flange_top = yCenterTop - spaceY * 0.25;
                    const y_face_top = yCenterTop - spaceY * 0.52;
                    const w_flange = W * 0.16;
                    topOuterPath = `M ${-W_half},${y_out_top} L ${W_half},${y_out_top} L ${W_half},${y_flange_top} L ${W_half - w_flange},${y_flange_top} L ${W_half - w_flange},${y_face_top} L ${-W_half + w_flange},${y_face_top} L ${-W_half + w_flange},${y_flange_top} L ${-W_half},${y_flange_top} Z`;

                    const y_out_bot = OD/2;
                    const y_flange_bot = yCenterBot + spaceY * 0.25;
                    const y_face_bot = yCenterBot + spaceY * 0.52;
                    botOuterPath = `M ${-W_half},${y_out_bot} L ${W_half},${y_out_bot} L ${W_half},${y_flange_bot} L ${W_half - w_flange},${y_flange_bot} L ${W_half - w_flange},${y_face_bot} L ${-W_half + w_flange},${y_face_bot} L ${-W_half + w_flange},${y_flange_bot} L ${-W_half},${y_flange_bot} Z`;

                    // Flat inner rings
                    topInnerPath = `M ${-W_half},${-ID/2} L ${W_half},${-ID/2} L ${W_half},${-ID/2 - ringTh} L ${-W_half},${-ID/2 - ringTh} Z`;
                    botInnerPath = `M ${-W_half},${ID/2} L ${W_half},${ID/2} L ${W_half},${ID/2 + ringTh} L ${-W_half},${ID/2 + ringTh} Z`;
                } else {
                    // Default thin rings for needle or other types
                    topOuterPath = `M ${-W_half},${-OD/2} L ${W_half},${-OD/2} L ${W_half},${-OD/2 + ringTh} L ${-W_half},${-OD/2 + ringTh} Z`;
                    botOuterPath = `M ${-W_half},${OD/2} L ${W_half},${OD/2} L ${W_half},${OD/2 - ringTh} L ${-W_half},${OD/2 - ringTh} Z`;
                    topInnerPath = `M ${-W_half},${-ID/2} L ${W_half},${-ID/2} L ${W_half},${-ID/2 - ringTh} L ${-W_half},${-ID/2 - ringTh} Z`;
                    botInnerPath = `M ${-W_half},${ID/2} L ${W_half},${ID/2} L ${W_half},${ID/2 + ringTh} L ${-W_half},${ID/2 + ringTh} Z`;
                }

                return (
                    <g transform={`translate(${cx}, ${cy})`}>
                        {/* Rings */}
                        <path d={topOuterPath} fill="url(#diagonalHatch)" stroke={strokeColor} strokeWidth="1.5" />
                        <path d={topInnerPath} fill="url(#diagonalHatch)" stroke={strokeColor} strokeWidth="1.5" />
                        <path d={botOuterPath} fill="url(#diagonalHatch)" stroke={strokeColor} strokeWidth="1.5" />
                        <path d={botInnerPath} fill="url(#diagonalHatch)" stroke={strokeColor} strokeWidth="1.5" />

                        {/* Rolling Elements */}
                        {type === 'ball' && (
                            <>
                                <circle cx="0" cy={yCenterTop} r={spaceY * 0.48} fill="#0a1018" stroke={strokeColor} strokeWidth="2" />
                                <circle cx="0" cy={yCenterBot} r={spaceY * 0.48} fill="#0a1018" stroke={strokeColor} strokeWidth="2" />
                            </>
                        )}

                        {type === 'roller' && (
                            <>
                                <rect x={-W*0.35} y={yCenterTop - spaceY*0.48} width={W*0.7} height={spaceY*0.96} rx="1" fill="#0a1018" stroke={strokeColor} strokeWidth="2" />
                                <rect x={-W*0.35} y={yCenterBot - spaceY*0.48} width={W*0.7} height={spaceY*0.96} rx="1" fill="#0a1018" stroke={strokeColor} strokeWidth="2" />
                            </>
                        )}

                        {type === 'needle' && (
                            <>
                                <rect x={-W*0.15} y={yCenterTop - spaceY*0.48} width={W*0.3} height={spaceY*0.96} rx="0.5" fill="#0a1018" stroke={strokeColor} strokeWidth="1.5" />
                                <rect x={-W*0.15} y={yCenterBot - spaceY*0.48} width={W*0.3} height={spaceY*0.96} rx="0.5" fill="#0a1018" stroke={strokeColor} strokeWidth="1.5" />
                            </>
                        )}

                        {/* Center Line */}
                        <line x1={-W} y1={0} x2={W} y2={0} stroke={subtleColor} strokeWidth="1" strokeDasharray="10 5" />

                        <Dim x1={W / 2} y1={-OD / 2} x2={W / 2} y2={OD / 2} label={`OD=${od}`} offset={20} vertical />
                        <Dim x1={-W / 2} y1={-ID / 2} x2={-W / 2} y2={ID / 2} label={`ID=${id}`} offset={20} vertical />
                        <Dim x1={-W / 2} y1={-OD / 2 - 10} x2={W / 2} y2={-OD / 2 - 10} label={`B=${w}`} offset={0} />
                    </g>
                )
            })()}

            {/* ===== MATERIAL SHAPES ===== */}

            {/* BOX - Rectangular Hollow Section */}
            {shape === 'box' && (() => {
                const w = parseFloat(inputs?.width || 60);
                const h = parseFloat(inputs?.height || 80);
                const t = parseFloat(inputs?.wallThickness || 4);

                const maxDim = Math.max(w, h);
                const scale = 180 / (maxDim || 100);
                const W = w * scale;
                const H = h * scale;
                const T = Math.max(t * scale, 4);
                const cx = 150, cy = 150;

                return (
                    <g transform={`translate(${cx}, ${cy})`}>
                        {/* Outer Rectangle */}
                        <rect x={-W / 2} y={-H / 2} width={W} height={H} fill="none" stroke={strokeColor} strokeWidth="2" />
                        {/* Inner Rectangle (hollow) */}
                        <rect x={-W / 2 + T} y={-H / 2 + T} width={W - 2 * T} height={H - 2 * T} fill="#0A0C10" stroke={strokeColor} strokeWidth="1.5" />
                        {/* Hatching for material */}
                        <rect x={-W / 2} y={-H / 2} width={T} height={H} fill="url(#diagonalHatch)" opacity="0.5" />
                        <rect x={W / 2 - T} y={-H / 2} width={T} height={H} fill="url(#diagonalHatch)" opacity="0.5" />
                        <rect x={-W / 2 + T} y={-H / 2} width={W - 2 * T} height={T} fill="url(#diagonalHatch)" opacity="0.5" />
                        <rect x={-W / 2 + T} y={H / 2 - T} width={W - 2 * T} height={T} fill="url(#diagonalHatch)" opacity="0.5" />

                        {/* Dimensions */}
                        <Dim x1={-W / 2} y1={H / 2} x2={W / 2} y2={H / 2} label={`B=${w}`} offset={25} />
                        <Dim x1={W / 2} y1={-H / 2} x2={W / 2} y2={H / 2} label={`H=${h}`} offset={25} vertical />
                        {/* Wall thickness indicator */}
                        <line x1={-W / 2} y1={-H / 2 - 10} x2={-W / 2 + T} y2={-H / 2 - 10} stroke={strokeColor} strokeWidth="1" />
                        <text x={-W / 2 + T / 2} y={-H / 2 - 15} textAnchor="middle" className="text-[8px] font-bold font-mono" fill={textFill}>t={t}</text>
                    </g>
                )
            })()}

            {/* PIPE - Circular Tube */}
            {shape === 'pipe' && (() => {
                const od = parseFloat(inputs?.diameter || 50);
                const t = parseFloat(inputs?.wallThickness || 5);
                const id = od - 2 * t;

                const scale = 180 / (od || 100);
                const OD = od * scale;
                const ID = id * scale;
                const cx = 150, cy = 150;

                return (
                    <g transform={`translate(${cx}, ${cy})`}>
                        {/* Outer Circle */}
                        <circle r={OD / 2} fill="url(#diagonalHatch)" stroke={strokeColor} strokeWidth="2" />
                        {/* Inner Circle (hollow) */}
                        <circle r={ID / 2} fill="#0A0C10" stroke={strokeColor} strokeWidth="1.5" />
                        {/* Center lines */}
                        <line x1={-OD / 2 - 15} y1={0} x2={OD / 2 + 15} y2={0} stroke={subtleColor} strokeWidth="1" strokeDasharray="10 5" />
                        <line x1={0} y1={-OD / 2 - 15} x2={0} y2={OD / 2 + 15} stroke={subtleColor} strokeWidth="1" strokeDasharray="10 5" />

                        {/* Dimensions */}
                        <Dim x1={-OD / 2} y1={OD / 2} x2={OD / 2} y2={OD / 2} label={`⌀${od}`} offset={25} />
                        <text x={OD / 4} y={-OD / 4} className="text-[9px] font-bold font-mono" fill={textFill}>t={t}</text>
                    </g>
                )
            })()}

            {/* BAR - Solid Round */}
            {shape === 'bar' && (() => {
                const d = parseFloat(inputs?.diameter || 40);

                const scale = 180 / (d || 100);
                const D = d * scale;
                const cx = 150, cy = 150;

                return (
                    <g transform={`translate(${cx}, ${cy})`}>
                        {/* Solid Circle with hatching */}
                        <circle r={D / 2} fill="url(#diagonalHatch)" stroke={strokeColor} strokeWidth="2" />
                        {/* Center cross */}
                        <line x1={-D / 2 - 15} y1={0} x2={D / 2 + 15} y2={0} stroke={subtleColor} strokeWidth="1" strokeDasharray="10 5" />
                        <line x1={0} y1={-D / 2 - 15} x2={0} y2={D / 2 + 15} stroke={subtleColor} strokeWidth="1" strokeDasharray="10 5" />

                        {/* Dimension */}
                        <Dim x1={-D / 2} y1={D / 2} x2={D / 2} y2={D / 2} label={`⌀${d}`} offset={25} />
                        <text x={0} y={D / 2 + 50} textAnchor="middle" className="text-[10px] font-bold font-mono" fill={textFill}>SOLID BAR</text>
                    </g>
                )
            })()}

            {/* SHEET - Flat Plate */}
            {shape === 'sheet' && (() => {
                const w = parseFloat(inputs?.width || 100);
                const t = parseFloat(inputs?.thickness || 5);

                const scale = 200 / (w || 100);
                const W = w * scale;
                const T = Math.max(t * scale, 8);
                const cx = 150, cy = 150;

                return (
                    <g transform={`translate(${cx}, ${cy})`}>
                        {/* Main plate (side view) */}
                        <rect x={-W / 2} y={-T / 2} width={W} height={T} fill="url(#diagonalHatch)" stroke={strokeColor} strokeWidth="2" />

                        {/* Dimensions */}
                        <Dim x1={-W / 2} y1={T / 2} x2={W / 2} y2={T / 2} label={`B=${w}`} offset={25} />
                        <Dim x1={W / 2} y1={-T / 2} x2={W / 2} y2={T / 2} label={`t=${t}`} offset={25} vertical />

                        <text x={0} y={T / 2 + 55} textAnchor="middle" className="text-[10px] font-bold font-mono" fill={textFill}>FLAT SHEET</text>
                    </g>
                )
            })()}

            {/* BEAM - I-Beam Section */}
            {shape === 'beam' && (() => {
                const H = parseFloat(inputs?.height || 100);
                const B = parseFloat(inputs?.width || 60);
                const tw = parseFloat(inputs?.webThickness || 6);
                const tf = parseFloat(inputs?.flangeThickness || 10);

                const scale = 180 / Math.max(H, B);
                const h = H * scale;
                const b = B * scale;
                const web = tw * scale;
                const flange = tf * scale;
                const cx = 150, cy = 150;

                return (
                    <g transform={`translate(${cx}, ${cy})`}>
                        {/* Top Flange */}
                        <rect x={-b / 2} y={-h / 2} width={b} height={flange} fill="url(#diagonalHatch)" stroke={strokeColor} strokeWidth="2" />
                        {/* Bottom Flange */}
                        <rect x={-b / 2} y={h / 2 - flange} width={b} height={flange} fill="url(#diagonalHatch)" stroke={strokeColor} strokeWidth="2" />
                        {/* Web */}
                        <rect x={-web / 2} y={-h / 2 + flange} width={web} height={h - 2 * flange} fill="url(#diagonalHatch)" stroke={strokeColor} strokeWidth="2" />

                        {/* Dimensions */}
                        <Dim x1={-b / 2} y1={h / 2} x2={b / 2} y2={h / 2} label={`B=${B}`} offset={25} />
                        <Dim x1={b / 2} y1={-h / 2} x2={b / 2} y2={h / 2} label={`H=${H}`} offset={25} vertical />
                        <text x={-b / 2 - 10} y={0} textAnchor="end" className="text-[8px] font-mono" fill={textFill}>tw={tw}</text>
                        <text x={0} y={-h / 2 - 5} textAnchor="middle" className="text-[8px] font-mono" fill={textFill}>tf={tf}</text>
                    </g>
                )
            })()}

            {/* CHANNEL - C-Channel Section */}
            {shape === 'channel' && (() => {
                const H = parseFloat(inputs?.height || 80);
                const B = parseFloat(inputs?.width || 45);
                const tw = parseFloat(inputs?.webThickness || 6);
                const tf = parseFloat(inputs?.flangeThickness || 8);

                const scale = 180 / Math.max(H, B);
                const h = H * scale;
                const b = B * scale;
                const web = tw * scale;
                const flange = tf * scale;
                const cx = 150, cy = 150;

                return (
                    <g transform={`translate(${cx}, ${cy})`}>
                        {/* Top Flange */}
                        <rect x={-b / 2} y={-h / 2} width={b} height={flange} fill="url(#diagonalHatch)" stroke={strokeColor} strokeWidth="2" />
                        {/* Bottom Flange */}
                        <rect x={-b / 2} y={h / 2 - flange} width={b} height={flange} fill="url(#diagonalHatch)" stroke={strokeColor} strokeWidth="2" />
                        {/* Web (left side only for C-channel) */}
                        <rect x={-b / 2} y={-h / 2 + flange} width={web} height={h - 2 * flange} fill="url(#diagonalHatch)" stroke={strokeColor} strokeWidth="2" />

                        {/* Dimensions */}
                        <Dim x1={-b / 2} y1={h / 2} x2={b / 2} y2={h / 2} label={`B=${B}`} offset={25} />
                        <Dim x1={b / 2} y1={-h / 2} x2={b / 2} y2={h / 2} label={`H=${H}`} offset={25} vertical />
                        <text x={0} y={0} textAnchor="middle" className="text-[10px] font-bold font-mono" fill={textFill}>C-CHANNEL</text>
                    </g>
                )
            })()}

            {/* ANGLE - L-Angle Section */}
            {shape === 'angle' && (() => {
                const A = parseFloat(inputs?.width || 50);
                const B = parseFloat(inputs?.height || 50);
                const t = parseFloat(inputs?.thickness || 5);

                const scale = 180 / Math.max(A, B);
                const a = A * scale;
                const b = B * scale;
                const thick = t * scale;
                const cx = 150, cy = 150;

                return (
                    <g transform={`translate(${cx - a / 4}, ${cy - b / 4})`}>
                        {/* Vertical Leg */}
                        <rect x={0} y={0} width={thick} height={b} fill="url(#diagonalHatch)" stroke={strokeColor} strokeWidth="2" />
                        {/* Horizontal Leg */}
                        <rect x={thick} y={b - thick} width={a - thick} height={thick} fill="url(#diagonalHatch)" stroke={strokeColor} strokeWidth="2" />

                        {/* Dimensions */}
                        <Dim x1={0} y1={b} x2={a} y2={b} label={`A=${A}`} offset={20} />
                        <Dim x1={a} y1={0} x2={a} y2={b} label={`B=${B}`} offset={20} vertical />
                        <text x={thick + 10} y={b - thick - 5} className="text-[8px] font-mono" fill={textFill}>t={t}</text>
                    </g>
                )
            })()}

            {/* TEE - T-Section */}
            {shape === 'tee' && (() => {
                const H = parseFloat(inputs?.height || 80);
                const B = parseFloat(inputs?.width || 60);
                const tw = parseFloat(inputs?.webThickness || 6);
                const tf = parseFloat(inputs?.flangeThickness || 10);

                const scale = 180 / Math.max(H, B);
                const h = H * scale;
                const b = B * scale;
                const web = tw * scale;
                const flange = tf * scale;
                const cx = 150, cy = 150;

                return (
                    <g transform={`translate(${cx}, ${cy})`}>
                        {/* Top Flange */}
                        <rect x={-b / 2} y={-h / 2} width={b} height={flange} fill="url(#diagonalHatch)" stroke={strokeColor} strokeWidth="2" />
                        {/* Web (stem) */}
                        <rect x={-web / 2} y={-h / 2 + flange} width={web} height={h - flange} fill="url(#diagonalHatch)" stroke={strokeColor} strokeWidth="2" />

                        {/* Dimensions */}
                        <Dim x1={-b / 2} y1={h / 2} x2={b / 2} y2={h / 2} label={`B=${B}`} offset={25} />
                        <Dim x1={b / 2} y1={-h / 2} x2={b / 2} y2={h / 2} label={`H=${H}`} offset={25} vertical />
                        <text x={web / 2 + 10} y={0} className="text-[8px] font-mono" fill={textFill}>tw={tw}</text>
                        <text x={0} y={-h / 2 - 5} textAnchor="middle" className="text-[8px] font-mono" fill={textFill}>tf={tf}</text>
                    </g>
                )
            })()}

            {/* HEX - Hexagonal Bar */}
            {shape === 'hex' && (() => {
                const S = parseFloat(inputs?.diameter || 30); // Across flats
                const E = S / 0.866; // Across corners

                const scale = 180 / E;
                const r = (E / 2) * scale;
                const cx = 150, cy = 150;

                const points: string[] = [];
                for (let i = 0; i < 6; i++) {
                    const angle = (30 + i * 60) * Math.PI / 180;
                    points.push(`${r * Math.cos(angle)},${r * Math.sin(angle)}`);
                }

                return (
                    <g transform={`translate(${cx}, ${cy})`}>
                        {/* Hexagon */}
                        <polygon points={points.join(' ')} fill="url(#diagonalHatch)" stroke={strokeColor} strokeWidth="2" />
                        {/* Center cross */}
                        <line x1={-r - 10} y1={0} x2={r + 10} y2={0} stroke={subtleColor} strokeWidth="1" strokeDasharray="10 5" />
                        <line x1={0} y1={-r - 10} x2={0} y2={r + 10} stroke={subtleColor} strokeWidth="1" strokeDasharray="10 5" />

                        {/* Dimension */}
                        <Dim x1={-S / 2 * scale} y1={r} x2={S / 2 * scale} y2={r} label={`S=${S}`} offset={25} />
                        <text x={0} y={r + 55} textAnchor="middle" className="text-[10px] font-bold font-mono" fill={textFill}>HEX BAR</text>
                    </g>
                )
            })()}
        </svg>
    )
}

