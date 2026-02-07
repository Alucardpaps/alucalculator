import { useState, useMemo } from 'react';
import { useCADCanvasStore } from '@/store/CADCanvasStore';
import { Share2 } from 'lucide-react';

export default function BeamDeflectionModule() {
    const { addShape, addAnnotation } = useCADCanvasStore();
    const [beamType, setBeamType] = useState<'simply-supported' | 'cantilever' | 'fixed-fixed'>('simply-supported');
    const [loadType, setLoadType] = useState<'point' | 'distributed'>('point');
    const [length, setLength] = useState(2000); // mm
    const [load, setLoad] = useState(5000); // N or N/mm
    const [elasticity, setElasticity] = useState(210000); // MPa (Steel)
    const [momentOfInertia, setMomentOfInertia] = useState(833333); // mm^4 (example: 100x50 rect)

    // Beam calculations
    const results = useMemo(() => {
        const L = length;
        const P = load;
        const E = elasticity;
        const I = momentOfInertia;

        let maxDeflection = 0;
        let maxMoment = 0;
        let maxShear = 0;

        if (beamType === 'simply-supported') {
            if (loadType === 'point') {
                // Point load at center
                maxDeflection = (P * Math.pow(L, 3)) / (48 * E * I);
                maxMoment = (P * L) / 4;
                maxShear = P / 2;
            } else {
                // Uniformly distributed load
                const w = P / L; // N/mm
                maxDeflection = (5 * w * Math.pow(L, 4)) / (384 * E * I);
                maxMoment = (w * Math.pow(L, 2)) / 8;
                maxShear = (w * L) / 2;
            }
        } else if (beamType === 'cantilever') {
            if (loadType === 'point') {
                maxDeflection = (P * Math.pow(L, 3)) / (3 * E * I);
                maxMoment = P * L;
                maxShear = P;
            } else {
                const w = P / L;
                maxDeflection = (w * Math.pow(L, 4)) / (8 * E * I);
                maxMoment = (w * Math.pow(L, 2)) / 2;
                maxShear = w * L;
            }
        } else if (beamType === 'fixed-fixed') {
            if (loadType === 'point') {
                maxDeflection = (P * Math.pow(L, 3)) / (192 * E * I);
                maxMoment = (P * L) / 8;
                maxShear = P / 2;
            } else {
                const w = P / L;
                maxDeflection = (w * Math.pow(L, 4)) / (384 * E * I);
                maxMoment = (w * Math.pow(L, 2)) / 12;
                maxShear = (w * L) / 2;
            }
        }

        return {
            deflection: maxDeflection.toFixed(4),
            moment: (maxMoment / 1000).toFixed(2), // N·m
            shear: maxShear.toFixed(1),
        };
    }, [beamType, loadType, length, load, elasticity, momentOfInertia]);

    const exportToCAD = () => {
        // 1. Draw Beam (Scaled down by 10 for visualization if needed, or 1:1)
        // Let's draw 1:1 in CAD
        const beamY = 0;
        const startX = 0;
        const endX = length;

        // Beam Line
        addShape({
            type: 'line',
            points: [{ x: startX, y: beamY }, { x: endX, y: beamY }],
            style: { strokeColor: '#ffffff', strokeWidth: 4 },
            visible: true, layer: 'beam', locked: false
        });

        // 2. Supports
        const supportSize = length / 20;
        if (beamType === 'simply-supported') {
            // Pin at 0
            addShape({
                type: 'polyline',
                points: [{ x: startX, y: beamY }, { x: startX - supportSize / 2, y: beamY - supportSize }, { x: startX + supportSize / 2, y: beamY - supportSize }, { x: startX, y: beamY }],
                style: { strokeColor: '#00e5ff', strokeWidth: 2 },
                visible: true, layer: 'beam', locked: false
            });
            // Roller at L
            addShape({
                type: 'polyline',
                points: [{ x: endX, y: beamY }, { x: endX - supportSize / 2, y: beamY - supportSize }, { x: endX + supportSize / 2, y: beamY - supportSize }, { x: endX, y: beamY }],
                style: { strokeColor: '#00e5ff', strokeWidth: 2 },
                visible: true, layer: 'beam', locked: false
            });
        } else if (beamType === 'cantilever') {
            // Fixed at 0
            addShape({
                type: 'line',
                points: [{ x: startX, y: beamY + supportSize }, { x: startX, y: beamY - supportSize }],
                style: { strokeColor: '#00e5ff', strokeWidth: 4 },
                visible: true, layer: 'beam', locked: false
            });
            // Hatching
            for (let i = 0; i < 5; i++) {
                addShape({
                    type: 'line',
                    points: [{ x: startX, y: beamY + supportSize - i * (supportSize * 2 / 5) }, { x: startX - supportSize / 2, y: beamY + supportSize - i * (supportSize * 2 / 5) - supportSize / 2 }],
                    style: { strokeColor: '#00e5ff', strokeWidth: 1 },
                    visible: true, layer: 'beam', locked: false
                });
            }
        } else if (beamType === 'fixed-fixed') {
            // Fixed at both ends
            addShape({
                type: 'line',
                points: [{ x: startX, y: beamY + supportSize }, { x: startX, y: beamY - supportSize }],
                style: { strokeColor: '#00e5ff', strokeWidth: 4 },
                visible: true, layer: 'beam', locked: false
            });
            addShape({
                type: 'line',
                points: [{ x: endX, y: beamY + supportSize }, { x: endX, y: beamY - supportSize }],
                style: { strokeColor: '#00e5ff', strokeWidth: 4 },
                visible: true, layer: 'beam', locked: false
            });
        }

        // 3. Loads
        if (loadType === 'point') {
            const mid = length / 2;
            const arrowH = length / 10;
            addShape({
                type: 'line',
                points: [{ x: mid, y: beamY + arrowH }, { x: mid, y: beamY }],
                style: { strokeColor: '#f44336', strokeWidth: 3 },
                visible: true, layer: 'beam', locked: false
            });
            // Arrowhead
            addShape({
                type: 'polyline',
                points: [{ x: mid - arrowH / 4, y: beamY + arrowH / 4 }, { x: mid, y: beamY }, { x: mid + arrowH / 4, y: beamY + arrowH / 4 }],
                style: { strokeColor: '#f44336', strokeWidth: 3 },
                visible: true, layer: 'beam', locked: false
            });
            addAnnotation({
                type: 'text',
                position: { x: mid, y: beamY + arrowH + 20 },
                content: `P = ${load}N`,
                rotation: 0,
                style: { color: '#f44336', fontSize: 24, fontFamily: 'monospace', fontWeight: 'bold' }
            });
        }
    };

    return (
        <div className="flex flex-col gap-3 h-full">
            {/* Beam Type Selection */}
            <div className="flex gap-2">
                {(['simply-supported', 'cantilever', 'fixed-fixed'] as const).map(type => (
                    <button
                        key={type}
                        onClick={() => setBeamType(type)}
                        className="flex-1 py-1.5 px-2 rounded text-[10px] font-medium uppercase transition-all"
                        style={{
                            backgroundColor: beamType === type ? 'var(--color-os-accent)' : 'var(--color-os-header)',
                            color: beamType === type ? 'var(--color-os-canvas)' : 'var(--color-os-text-secondary)',
                        }}
                    >
                        {type.replace('-', ' ')}
                    </button>
                ))}
            </div>

            {/* Load Type */}
            <div className="flex gap-2">
                <button
                    onClick={() => setLoadType('point')}
                    className="flex-1 py-1.5 rounded text-xs transition-all"
                    style={{
                        backgroundColor: loadType === 'point' ? 'var(--color-os-accent)' : 'var(--color-os-header)',
                        color: loadType === 'point' ? 'var(--color-os-canvas)' : 'var(--color-os-text-secondary)',
                    }}
                >
                    Point Load
                </button>
                <button
                    onClick={() => setLoadType('distributed')}
                    className="flex-1 py-1.5 rounded text-xs transition-all"
                    style={{
                        backgroundColor: loadType === 'distributed' ? 'var(--color-os-accent)' : 'var(--color-os-header)',
                        color: loadType === 'distributed' ? 'var(--color-os-canvas)' : 'var(--color-os-text-secondary)',
                    }}
                >
                    Distributed
                </button>
            </div>

            {/* SVG Diagram */}
            <div
                className="rounded-lg p-2"
                style={{ backgroundColor: 'var(--color-os-canvas)' }}
            >
                <svg viewBox="0 0 300 100" className="w-full h-20">
                    {/* Beam */}
                    <line x1="30" y1="50" x2="270" y2="50" stroke="var(--color-os-accent)" strokeWidth="4" />

                    {/* Supports */}
                    {beamType === 'simply-supported' && (
                        <>
                            <polygon points="30,50 20,70 40,70" fill="var(--color-os-text-secondary)" />
                            <polygon points="270,50 260,70 280,70" fill="var(--color-os-text-secondary)" />
                        </>
                    )}
                    {beamType === 'cantilever' && (
                        <rect x="20" y="35" width="10" height="30" fill="var(--color-os-text-secondary)" />
                    )}
                    {beamType === 'fixed-fixed' && (
                        <>
                            <rect x="20" y="35" width="10" height="30" fill="var(--color-os-text-secondary)" />
                            <rect x="270" y="35" width="10" height="30" fill="var(--color-os-text-secondary)" />
                        </>
                    )}

                    {/* Load */}
                    {loadType === 'point' ? (
                        <g>
                            <line x1="150" y1="15" x2="150" y2="45" stroke="var(--color-os-danger)" strokeWidth="2" />
                            <polygon points="150,45 145,35 155,35" fill="var(--color-os-danger)" />
                            <text x="150" y="12" textAnchor="middle" fill="var(--color-os-danger)" fontSize="10">P</text>
                        </g>
                    ) : (
                        <g>
                            {[0, 1, 2, 3, 4, 5, 6].map(i => (
                                <g key={i}>
                                    <line x1={50 + i * 35} y1="20" x2={50 + i * 35} y2="45" stroke="var(--color-os-danger)" strokeWidth="1" />
                                    <polygon points={`${50 + i * 35},45 ${47 + i * 35},38 ${53 + i * 35},38`} fill="var(--color-os-danger)" />
                                </g>
                            ))}
                            <line x1="50" y1="20" x2="260" y2="20" stroke="var(--color-os-danger)" strokeWidth="1" />
                        </g>
                    )}

                    {/* Deflected shape */}
                    <path
                        d={beamType === 'cantilever'
                            ? "M 30,55 Q 150,55 270,75"
                            : "M 30,55 Q 150,70 270,55"
                        }
                        fill="none"
                        stroke="var(--color-os-warning)"
                        strokeWidth="1"
                        strokeDasharray="4,2"
                    />
                </svg>
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--color-os-text-secondary)' }}>
                        Length (mm)
                    </label>
                    <input
                        type="number"
                        value={length}
                        onChange={e => setLength(Number(e.target.value))}
                        className="w-full px-2 py-1.5 rounded text-xs font-mono"
                        style={{ backgroundColor: 'var(--color-os-header)', color: 'var(--color-os-text-primary)', border: '1px solid var(--color-os-border)' }}
                    />
                </div>
                <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--color-os-text-secondary)' }}>
                        {loadType === 'point' ? 'Load (N)' : 'Total Load (N)'}
                    </label>
                    <input
                        type="number"
                        value={load}
                        onChange={e => setLoad(Number(e.target.value))}
                        className="w-full px-2 py-1.5 rounded text-xs font-mono"
                        style={{ backgroundColor: 'var(--color-os-header)', color: 'var(--color-os-text-primary)', border: '1px solid var(--color-os-border)' }}
                    />
                </div>
                <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--color-os-text-secondary)' }}>
                        E (MPa)
                    </label>
                    <input
                        type="number"
                        value={elasticity}
                        onChange={e => setElasticity(Number(e.target.value))}
                        className="w-full px-2 py-1.5 rounded text-xs font-mono"
                        style={{ backgroundColor: 'var(--color-os-header)', color: 'var(--color-os-text-primary)', border: '1px solid var(--color-os-border)' }}
                    />
                </div>
                <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--color-os-text-secondary)' }}>
                        I (mm⁴)
                    </label>
                    <input
                        type="number"
                        value={momentOfInertia}
                        onChange={e => setMomentOfInertia(Number(e.target.value))}
                        className="w-full px-2 py-1.5 rounded text-xs font-mono"
                        style={{ backgroundColor: 'var(--color-os-header)', color: 'var(--color-os-text-primary)', border: '1px solid var(--color-os-border)' }}
                    />
                </div>
            </div>

            {/* Results */}
            <div
                className="p-3 rounded-lg"
                style={{ backgroundColor: 'var(--color-os-header)', border: '1px solid var(--color-os-accent)' }}
            >
                <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                        <div className="text-[10px] uppercase" style={{ color: 'var(--color-os-text-secondary)' }}>Deflection</div>
                        <div className="font-mono font-bold" style={{ color: 'var(--color-os-accent)' }}>{results.deflection} mm</div>
                    </div>
                    <div>
                        <div className="text-[10px] uppercase" style={{ color: 'var(--color-os-text-secondary)' }}>Max Moment</div>
                        <div className="font-mono font-bold" style={{ color: 'var(--color-os-warning)' }}>{results.moment} N·m</div>
                    </div>
                    <div>
                        <div className="text-[10px] uppercase" style={{ color: 'var(--color-os-text-secondary)' }}>Max Shear</div>
                        <div className="font-mono font-bold" style={{ color: 'var(--color-os-text-primary)' }}>{results.shear} N</div>
                    </div>
                </div>

                <button
                    onClick={exportToCAD}
                    className="w-full mt-3 py-2 bg-[#252525] hover:bg-[#333] border border-[#444] text-slate-300 font-bold rounded flex items-center justify-center gap-2 text-xs uppercase transition-colors"
                >
                    <Share2 size={14} /> Open in CAD
                </button>
            </div>
        </div>
    );
}

